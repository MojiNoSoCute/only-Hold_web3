// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./OnlyHoldNFT.sol";
import "./OnlyHoldSubscription.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OnlyHoldFactory
 * @dev Factory contract that deploys creator contracts in one transaction.
 *
 * A creator calls `launchCreator()` to simultaneously deploy:
 *   - An OnlyHoldNFT contract (if NFT membership is desired)
 *   - An OnlyHoldSubscription contract (if stablecoin sub is desired)
 *
 * The factory also serves as the on-chain registry of all creators,
 * making it easy to enumerate and verify creator contracts.
 *
 * Only verified (non-blacklisted) creators can be registered.
 * Platform treasury is set at factory deployment and inherited by all contracts.
 */
contract OnlyHoldFactory is Ownable {
    // ─── Structs ──────────────────────────────────────────────────────────────

    struct CreatorProfile {
        address creatorAddress;
        address nftContract;          // address(0) if NFT not enabled
        address subscriptionContract; // address(0) if stablecoin not enabled
        string username;
        string metadataURI;           // IPFS URI with creator profile metadata
        uint256 registeredAt;
        bool isActive;
    }

    // ─── State Variables ──────────────────────────────────────────────────────

    /// @notice OnlyHold treasury address (receives 5% platform fees)
    address public treasury;

    /// @notice Default accepted stablecoin for new subscription contracts
    address public defaultStablecoin;

    /// @notice Stablecoin decimals (6 for USDC)
    uint8 public defaultStablecoinDecimals;

    /// @notice Mapping from creator address to their profile
    mapping(address => CreatorProfile) public creatorProfiles;

    /// @notice Mapping from username to creator address
    mapping(string => address) public usernameToAddress;

    /// @notice All registered creator addresses
    address[] private _creatorList;

    /// @notice Blacklisted addresses cannot register
    mapping(address => bool) public blacklisted;

    /// @notice Whether an address already registered as a creator
    mapping(address => bool) public isRegistered;

    // ─── Events ───────────────────────────────────────────────────────────────

    event CreatorLaunched(
        address indexed creator,
        string username,
        address nftContract,
        address subscriptionContract,
        uint256 timestamp
    );
    event CreatorDeactivated(address indexed creator);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event DefaultStablecoinUpdated(address newStablecoin);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error AlreadyRegistered();
    error UsernameTaken(string username);
    error Blacklisted();
    error MustEnableAtLeastOne();
    error InvalidUsername();
    error NotRegistered();

    // ─── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param _treasury               Platform treasury address
     * @param _defaultStablecoin      Default stablecoin (e.g. USDC on the chain)
     * @param _defaultStablecoinDecimals  Decimals (6 for USDC, 18 for DAI)
     */
    constructor(
        address _treasury,
        address _defaultStablecoin,
        uint8 _defaultStablecoinDecimals
    ) Ownable(msg.sender) {
        treasury = _treasury;
        defaultStablecoin = _defaultStablecoin;
        defaultStablecoinDecimals = _defaultStablecoinDecimals;
    }

    // ─── Creator Registration ─────────────────────────────────────────────────

    /**
     * @notice Register as a creator and optionally deploy NFT & Subscription contracts.
     *
     * @param username          Unique creator username (lowercase, alphanumeric + underscore)
     * @param metadataURI       IPFS URI with creator profile JSON
     * @param enableNFT         Whether to deploy an NFT membership contract
     * @param nftName           ERC-721 name   (e.g. "Aria Membership")
     * @param nftSymbol         ERC-721 symbol (e.g. "ARIA")
     * @param nftMintPrice      Mint price in wei
     * @param nftMaxSupply      Max NFT supply (0 = unlimited)
     * @param nftBaseURI        IPFS base URI for NFT metadata
     * @param enableSub         Whether to deploy a stablecoin subscription contract
     * @param monthlyPrice      Monthly price in stablecoin base units (e.g. 10_000_000 for 10 USDC)
     * @param customStablecoin  Custom stablecoin address (address(0) to use platform default)
     */
    function launchCreator(
        string calldata username,
        string calldata metadataURI,
        // NFT params
        bool enableNFT,
        string calldata nftName,
        string calldata nftSymbol,
        uint256 nftMintPrice,
        uint256 nftMaxSupply,
        string calldata nftBaseURI,
        // Subscription params
        bool enableSub,
        uint256 monthlyPrice,
        address customStablecoin
    ) external returns (address nftContract, address subContract) {
        if (isRegistered[msg.sender]) revert AlreadyRegistered();
        if (blacklisted[msg.sender]) revert Blacklisted();
        if (!enableNFT && !enableSub) revert MustEnableAtLeastOne();
        if (bytes(username).length == 0 || bytes(username).length > 30) revert InvalidUsername();
        if (usernameToAddress[username] != address(0)) revert UsernameTaken(username);

        // ── Deploy NFT Contract ───────────────────────────────────────
        if (enableNFT) {
            OnlyHoldNFT nft = new OnlyHoldNFT(
                msg.sender,
                treasury,
                nftName,
                nftSymbol,
                nftMintPrice,
                nftMaxSupply,
                nftBaseURI
            );
            nftContract = address(nft);
        }

        // ── Deploy Subscription Contract ──────────────────────────────
        if (enableSub) {
            address stablecoin = customStablecoin != address(0)
                ? customStablecoin
                : defaultStablecoin;

            OnlyHoldSubscription sub = new OnlyHoldSubscription(
                msg.sender,
                treasury,
                stablecoin,
                defaultStablecoinDecimals,
                monthlyPrice
            );
            subContract = address(sub);
        }

        // ── Register Creator ──────────────────────────────────────────
        creatorProfiles[msg.sender] = CreatorProfile({
            creatorAddress: msg.sender,
            nftContract: nftContract,
            subscriptionContract: subContract,
            username: username,
            metadataURI: metadataURI,
            registeredAt: block.timestamp,
            isActive: true
        });

        usernameToAddress[username] = msg.sender;
        _creatorList.push(msg.sender);
        isRegistered[msg.sender] = true;

        emit CreatorLaunched(
            msg.sender,
            username,
            nftContract,
            subContract,
            block.timestamp
        );
    }

    // ─── Access Helpers ───────────────────────────────────────────────────────

    /**
     * @notice Check if `fan` has access to `creatorAddress`'s exclusive content.
     * @dev    Returns true if fan holds an NFT from the creator's collection
     *         OR has an active stablecoin subscription.
     * @param  creatorAddress  The creator's wallet address
     * @param  fan             The fan's wallet address
     * @return hasAccess       True if fan has access
     * @return via             "nft" | "subscription" | "none"
     */
    function checkAccess(address creatorAddress, address fan)
        external
        view
        returns (bool hasAccess, string memory via)
    {
        CreatorProfile memory profile = creatorProfiles[creatorAddress];

        // Check NFT membership
        if (profile.nftContract != address(0)) {
            if (OnlyHoldNFT(profile.nftContract).isMember(fan)) {
                return (true, "nft");
            }
        }

        // Check stablecoin subscription
        if (profile.subscriptionContract != address(0)) {
            if (OnlyHoldSubscription(profile.subscriptionContract).isSubscribed(fan)) {
                return (true, "subscription");
            }
        }

        return (false, "none");
    }

    /**
     * @notice Resolve a username to creator address + contract addresses.
     * @param  username  Creator's username
     * @return creator   Creator wallet address
     * @return nft       NFT contract address
     * @return sub       Subscription contract address
     */
    function resolveUsername(string calldata username)
        external
        view
        returns (
            address creator,
            address nft,
            address sub
        )
    {
        creator = usernameToAddress[username];
        if (creator == address(0)) return (address(0), address(0), address(0));
        CreatorProfile memory profile = creatorProfiles[creator];
        return (creator, profile.nftContract, profile.subscriptionContract);
    }

    // ─── Enumeration ──────────────────────────────────────────────────────────

    /// @notice Get total number of registered creators
    function creatorCount() external view returns (uint256) {
        return _creatorList.length;
    }

    /// @notice Get creator address by index
    function creatorAt(uint256 index) external view returns (address) {
        return _creatorList[index];
    }

    /// @notice Get all creator addresses (use with caution on large sets)
    function allCreators() external view returns (address[] memory) {
        return _creatorList;
    }

    // ─── Admin Functions ──────────────────────────────────────────────────────

    /// @notice Deactivate a creator (platform moderation)
    function deactivateCreator(address creatorAddress) external onlyOwner {
        if (!isRegistered[creatorAddress]) revert NotRegistered();
        creatorProfiles[creatorAddress].isActive = false;
        emit CreatorDeactivated(creatorAddress);
    }

    /// @notice Blacklist an address from registering
    function blacklist(address account, bool status) external onlyOwner {
        blacklisted[account] = status;
    }

    /// @notice Update the treasury address
    function setTreasury(address newTreasury) external onlyOwner {
        emit TreasuryUpdated(treasury, newTreasury);
        treasury = newTreasury;
    }

    /// @notice Update the default stablecoin
    function setDefaultStablecoin(address newStablecoin, uint8 decimals) external onlyOwner {
        defaultStablecoin = newStablecoin;
        defaultStablecoinDecimals = decimals;
        emit DefaultStablecoinUpdated(newStablecoin);
    }
}
