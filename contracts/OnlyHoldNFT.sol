// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title OnlyHoldNFT
 * @dev ERC-721 Membership NFT contract for OnlyHold platform.
 *
 * Each creator deploys their own instance of this contract (via OnlyHoldFactory).
 * Holding an NFT from this contract grants lifetime access to the creator's
 * exclusive content. The NFT is transferable/tradeable on secondary markets.
 *
 * Revenue flow:
 *   Fan pays mintPrice (ETH)
 *   → 95% goes to creator (owner)
 *   → 5%  goes to OnlyHold platform treasury
 */
contract OnlyHoldNFT is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    Ownable,
    ReentrancyGuard
{
    // ─── State Variables ──────────────────────────────────────────────────────

    /// @notice Creator's wallet address (receives 95% of mint revenue)
    address public immutable creator;

    /// @notice OnlyHold platform treasury (receives 5% platform fee)
    address public immutable treasury;

    /// @notice Mint price in ETH
    uint256 public mintPrice;

    /// @notice Maximum supply (0 = unlimited)
    uint256 public maxSupply;

    /// @notice Auto-incrementing token ID counter
    uint256 private _nextTokenId;

    /// @notice IPFS base URI for metadata
    string private _baseTokenURI;

    /// @notice Platform fee in basis points (500 = 5%)
    uint256 public constant PLATFORM_FEE_BPS = 500;

    /// @notice Whether minting is paused
    bool public mintingPaused;

    // ─── Events ───────────────────────────────────────────────────────────────

    event NFTMinted(address indexed to, uint256 indexed tokenId, uint256 price);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event BaseURIUpdated(string newBaseURI);
    event MintingPaused(bool paused);

    // ─── Errors ───────────────────────────────────────────────────────────────

    error InsufficientPayment(uint256 required, uint256 provided);
    error MaxSupplyReached(uint256 maxSupply);
    error MintingIsPaused();
    error WithdrawFailed();
    error InvalidPrice();

    // ─── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param _creator      Address of the content creator
     * @param _treasury     OnlyHold platform treasury address
     * @param _name         ERC-721 token name  (e.g. "Aria NFT Membership")
     * @param _symbol       ERC-721 symbol      (e.g. "ARIA")
     * @param _mintPrice    Mint price in wei
     * @param _maxSupply    Max token supply (0 = unlimited)
     * @param baseURI_      IPFS base URI for metadata
     */
    constructor(
        address _creator,
        address _treasury,
        string memory _name,
        string memory _symbol,
        uint256 _mintPrice,
        uint256 _maxSupply,
        string memory baseURI_
    ) ERC721(_name, _symbol) Ownable(_creator) {
        creator = _creator;
        treasury = _treasury;
        mintPrice = _mintPrice;
        maxSupply = _maxSupply;
        _baseTokenURI = baseURI_;
    }

    // ─── Minting ──────────────────────────────────────────────────────────────

    /**
     * @notice Mint a membership NFT.
     * @dev    Caller must send exactly `mintPrice` ETH.
     *         Revenue is split: 95% creator, 5% platform.
     * @param  to          Recipient of the NFT
     * @param  tokenURI_   Optional per-token metadata URI (can be empty to use base URI)
     */
    function mint(address to, string memory tokenURI_)
        external
        payable
        nonReentrant
    {
        if (mintingPaused) revert MintingIsPaused();
        if (msg.value < mintPrice) revert InsufficientPayment(mintPrice, msg.value);
        if (maxSupply > 0 && _nextTokenId >= maxSupply) revert MaxSupplyReached(maxSupply);

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        if (bytes(tokenURI_).length > 0) {
            _setTokenURI(tokenId, tokenURI_);
        }

        // ── Revenue distribution ──────────────────────────────────────
        uint256 platformFee = (msg.value * PLATFORM_FEE_BPS) / 10_000;
        uint256 creatorShare = msg.value - platformFee;

        (bool sentToCreator, ) = creator.call{value: creatorShare}("");
        (bool sentToTreasury, ) = treasury.call{value: platformFee}("");
        if (!sentToCreator || !sentToTreasury) revert WithdrawFailed();

        emit NFTMinted(to, tokenId, msg.value);
    }

    /**
     * @notice Convenience function: mint to the caller's address.
     */
    function mintSelf(string memory tokenURI_) external payable nonReentrant {
        if (mintingPaused) revert MintingIsPaused();
        if (msg.value < mintPrice) revert InsufficientPayment(mintPrice, msg.value);
        if (maxSupply > 0 && _nextTokenId >= maxSupply) revert MaxSupplyReached(maxSupply);

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        if (bytes(tokenURI_).length > 0) {
            _setTokenURI(tokenId, tokenURI_);
        }

        uint256 platformFee = (msg.value * PLATFORM_FEE_BPS) / 10_000;
        uint256 creatorShare = msg.value - platformFee;

        (bool sentToCreator, ) = creator.call{value: creatorShare}("");
        (bool sentToTreasury, ) = treasury.call{value: platformFee}("");
        if (!sentToCreator || !sentToTreasury) revert WithdrawFailed();

        emit NFTMinted(msg.sender, tokenId, msg.value);
    }

    // ─── Access Check ─────────────────────────────────────────────────────────

    /**
     * @notice Check whether `account` holds at least one membership NFT.
     * @dev    Frontend calls this to gate exclusive content access.
     * @param  account  The wallet address to check
     * @return bool     True if the account is an active member
     */
    function isMember(address account) external view returns (bool) {
        return balanceOf(account) > 0;
    }

    /**
     * @notice Returns all token IDs held by `account`.
     */
    function tokensOfOwner(address account)
        external
        view
        returns (uint256[] memory)
    {
        uint256 count = balanceOf(account);
        uint256[] memory tokens = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            tokens[i] = tokenOfOwnerByIndex(account, i);
        }
        return tokens;
    }

    // ─── Owner Functions ──────────────────────────────────────────────────────

    /**
     * @notice Update mint price (creator only).
     * @param newPrice  New price in wei
     */
    function setMintPrice(uint256 newPrice) external onlyOwner {
        if (newPrice == 0) revert InvalidPrice();
        emit MintPriceUpdated(mintPrice, newPrice);
        mintPrice = newPrice;
    }

    /**
     * @notice Update base metadata URI (creator only).
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @notice Pause / unpause minting (creator only).
     */
    function setPaused(bool paused) external onlyOwner {
        mintingPaused = paused;
        emit MintingPaused(paused);
    }

    /**
     * @notice Airdrop membership NFTs to a list of addresses (creator only).
     * @dev    No payment required for airdrops.
     */
    function airdrop(address[] calldata recipients) external onlyOwner {
        for (uint256 i = 0; i < recipients.length; i++) {
            if (maxSupply > 0 && _nextTokenId >= maxSupply) break;
            uint256 tokenId = _nextTokenId++;
            _safeMint(recipients[i], tokenId);
            emit NFTMinted(recipients[i], tokenId, 0);
        }
    }

    // ─── View Helpers ─────────────────────────────────────────────────────────

    /// @notice Total number of NFTs minted so far
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    // ─── Overrides ────────────────────────────────────────────────────────────

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
