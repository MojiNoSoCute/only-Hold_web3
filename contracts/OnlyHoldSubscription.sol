// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title OnlyHoldSubscription
 * @dev Stablecoin-based subscription contract for OnlyHold platform.
 *
 * How it works:
 *   1. Creator sets a monthly price (e.g. 10 USDC).
 *   2. Fan deposits any multiple of the monthly price.
 *      e.g. 30 USDC = 3 months of access.
 *   3. Access is checked off-chain by reading `getSubscription()`.
 *      Access is active as long as `expiresAt > block.timestamp`.
 *   4. Fan can top-up anytime (extends expiry) or withdraw remaining balance
 *      (cancels remaining subscription).
 *   5. Creator withdraws accumulated earnings at any time.
 *
 * Revenue flow:
 *   Fan deposits USDC
 *   → Claimable by creator (95%) when they call `withdrawEarnings()`
 *   → 5% held for platform fee, claimable by treasury
 *
 * Supported stablecoins: USDC, USDT, DAI (or any ERC-20 the creator whitelists).
 */
contract OnlyHoldSubscription is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct SubscriberInfo {
        uint256 deposited;      // Total USDC deposited by this subscriber
        uint256 expiresAt;      // UNIX timestamp when subscription expires
        uint256 lastDeposit;    // Timestamp of last deposit
    }

    // ─── State Variables ──────────────────────────────────────────────────────

    /// @notice Creator's wallet address
    address public immutable creator;

    /// @notice OnlyHold platform treasury
    address public immutable treasury;

    /// @notice Accepted stablecoin (e.g. USDC at 6 decimals)
    IERC20 public immutable stablecoin;

    /// @notice Decimals of the stablecoin (6 for USDC/USDT, 18 for DAI)
    uint8 public immutable stablecoinDecimals;

    /// @notice Monthly subscription price in stablecoin base units
    ///         e.g. 10_000_000 = 10 USDC (6 decimals)
    uint256 public monthlyPrice;

    /// @notice Seconds in a 30-day month
    uint256 public constant MONTH_SECONDS = 30 days;

    /// @notice Platform fee in basis points (500 = 5%)
    uint256 public constant PLATFORM_FEE_BPS = 500;

    /// @notice Total undistributed earnings available for the creator to withdraw
    uint256 public pendingCreatorEarnings;

    /// @notice Total undistributed platform fees available for treasury to claim
    uint256 public pendingPlatformFee;

    /// @notice Subscriber data mapped by wallet address
    mapping(address => SubscriberInfo) public subscribers;

    /// @notice All subscriber addresses (for enumeration)
    address[] private _subscriberList;

    // ─── Events ───────────────────────────────────────────────────────────────

    event Subscribed(
        address indexed subscriber,
        uint256 amount,
        uint256 months,
        uint256 expiresAt
    );
    event BalanceWithdrawn(address indexed subscriber, uint256 amount);
    event CreatorWithdrew(address indexed creator, uint256 amount);
    event PlatformFeeWithdrawn(address indexed treasury, uint256 amount);
    event MonthlyPriceUpdated(uint256 oldPrice, uint256 newPrice);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error InsufficientDeposit(uint256 required, uint256 provided);
    error NotMultipleOfMonthlyPrice(uint256 amount, uint256 monthlyPrice_);
    error NoEarningsToWithdraw();
    error NoBalanceToWithdraw();
    error InvalidPrice();
    error TransferFailed();

    // ─── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param _creator            Creator's wallet
     * @param _treasury           OnlyHold treasury
     * @param _stablecoin         ERC-20 stablecoin address (e.g. USDC)
     * @param _stablecoinDecimals Decimals of the stablecoin (6 for USDC)
     * @param _monthlyPrice       Price per month in stablecoin base units
     */
    constructor(
        address _creator,
        address _treasury,
        address _stablecoin,
        uint8 _stablecoinDecimals,
        uint256 _monthlyPrice
    ) Ownable(_creator) {
        creator = _creator;
        treasury = _treasury;
        stablecoin = IERC20(_stablecoin);
        stablecoinDecimals = _stablecoinDecimals;
        monthlyPrice = _monthlyPrice;
    }

    // ─── Subscriber Functions ─────────────────────────────────────────────────

    /**
     * @notice Deposit stablecoin to subscribe.
     * @dev    `amount` must be a whole multiple of `monthlyPrice`.
     *         e.g. to subscribe for 3 months: amount = monthlyPrice * 3
     *
     *         If subscriber already has remaining time, new time is added on top.
     *         Caller must approve this contract to spend `amount` stablecoin first.
     *
     * @param amount  Amount of stablecoin in base units (e.g. 30_000_000 = 30 USDC)
     */
    function subscribe(uint256 amount) external nonReentrant {
        if (amount < monthlyPrice) revert InsufficientDeposit(monthlyPrice, amount);
        if (amount % monthlyPrice != 0) revert NotMultipleOfMonthlyPrice(amount, monthlyPrice);

        // Transfer stablecoin from subscriber
        stablecoin.safeTransferFrom(msg.sender, address(this), amount);

        // Calculate months purchased
        uint256 months = amount / monthlyPrice;
        uint256 addedSeconds = months * MONTH_SECONDS;

        // Extend subscription from max(now, current expiry)
        SubscriberInfo storage sub = subscribers[msg.sender];
        uint256 startFrom = block.timestamp > sub.expiresAt
            ? block.timestamp
            : sub.expiresAt;
        sub.expiresAt = startFrom + addedSeconds;
        sub.deposited += amount;
        sub.lastDeposit = block.timestamp;

        // Track new subscribers for enumeration
        if (sub.deposited == amount) {
            _subscriberList.push(msg.sender);
        }

        // ── Revenue accounting ────────────────────────────────────────
        uint256 platformFee = (amount * PLATFORM_FEE_BPS) / 10_000;
        uint256 creatorShare = amount - platformFee;

        pendingCreatorEarnings += creatorShare;
        pendingPlatformFee += platformFee;

        emit Subscribed(msg.sender, amount, months, sub.expiresAt);
    }

    /**
     * @notice Withdraw unused/remaining subscription balance.
     * @dev    Only refunds the proportion of time remaining from the LAST deposit.
     *         Previous months already consumed are non-refundable.
     *
     *         Remaining time is calculated as:
     *           remainingSeconds = expiresAt - now  (clamped to 0)
     *           refund = (remainingSeconds / MONTH_SECONDS) * monthlyPrice
     *                    (rounded down to whole months)
     */
    function withdrawBalance() external nonReentrant {
        SubscriberInfo storage sub = subscribers[msg.sender];

        if (sub.expiresAt <= block.timestamp) revert NoBalanceToWithdraw();

        uint256 remainingSeconds = sub.expiresAt - block.timestamp;
        uint256 remainingMonths = remainingSeconds / MONTH_SECONDS;

        if (remainingMonths == 0) revert NoBalanceToWithdraw();

        uint256 refundAmount = remainingMonths * monthlyPrice;

        // Reduce pending earnings proportionally
        uint256 platformFeeReduction = (refundAmount * PLATFORM_FEE_BPS) / 10_000;
        uint256 creatorReduction = refundAmount - platformFeeReduction;

        // Clamp to avoid underflow (safety check)
        if (pendingCreatorEarnings >= creatorReduction) {
            pendingCreatorEarnings -= creatorReduction;
        }
        if (pendingPlatformFee >= platformFeeReduction) {
            pendingPlatformFee -= platformFeeReduction;
        }

        // Cancel remaining subscription time
        sub.expiresAt = block.timestamp;
        sub.deposited -= refundAmount;

        stablecoin.safeTransfer(msg.sender, refundAmount);
        emit BalanceWithdrawn(msg.sender, refundAmount);
    }

    // ─── Creator Functions ────────────────────────────────────────────────────

    /**
     * @notice Withdraw accumulated earnings (creator only).
     */
    function withdrawEarnings() external onlyOwner nonReentrant {
        uint256 amount = pendingCreatorEarnings;
        if (amount == 0) revert NoEarningsToWithdraw();
        pendingCreatorEarnings = 0;
        stablecoin.safeTransfer(creator, amount);
        emit CreatorWithdrew(creator, amount);
    }

    /**
     * @notice Update monthly price (creator only).
     * @dev    Only affects NEW subscriptions. Existing ones are unaffected.
     */
    function setMonthlyPrice(uint256 newPrice) external onlyOwner {
        if (newPrice == 0) revert InvalidPrice();
        emit MonthlyPriceUpdated(monthlyPrice, newPrice);
        monthlyPrice = newPrice;
    }

    // ─── Platform Treasury Functions ──────────────────────────────────────────

    /**
     * @notice Withdraw accumulated platform fees (treasury only).
     */
    function withdrawPlatformFee() external nonReentrant {
        require(msg.sender == treasury, "Only treasury");
        uint256 amount = pendingPlatformFee;
        if (amount == 0) revert NoEarningsToWithdraw();
        pendingPlatformFee = 0;
        stablecoin.safeTransfer(treasury, amount);
        emit PlatformFeeWithdrawn(treasury, amount);
    }

    // ─── Access Control (called by frontend/backend) ──────────────────────────

    /**
     * @notice Check if a wallet currently has an active subscription.
     * @param  account  Wallet address to check
     * @return bool     True if subscription has not expired
     */
    function isSubscribed(address account) external view returns (bool) {
        return subscribers[account].expiresAt > block.timestamp;
    }

    /**
     * @notice Get full subscription details for an account.
     * @return deposited    Total USDC deposited
     * @return expiresAt    Subscription expiry timestamp
     * @return isActive     Whether subscription is currently active
     * @return remainingSeconds  Seconds until expiry (0 if expired)
     */
    function getSubscription(address account)
        external
        view
        returns (
            uint256 deposited,
            uint256 expiresAt,
            bool isActive,
            uint256 remainingSeconds
        )
    {
        SubscriberInfo memory sub = subscribers[account];
        isActive = sub.expiresAt > block.timestamp;
        remainingSeconds = isActive ? sub.expiresAt - block.timestamp : 0;
        return (sub.deposited, sub.expiresAt, isActive, remainingSeconds);
    }

    /**
     * @notice Returns all subscriber addresses.
     */
    function getSubscribers() external view returns (address[] memory) {
        return _subscriberList;
    }

    /**
     * @notice Returns the number of active subscribers at this moment.
     */
    function activeSubscriberCount() external view returns (uint256 count) {
        for (uint256 i = 0; i < _subscriberList.length; i++) {
            if (subscribers[_subscriberList[i]].expiresAt > block.timestamp) {
                count++;
            }
        }
    }
}
