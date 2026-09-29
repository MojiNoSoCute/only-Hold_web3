// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @dev Minimal ERC-20 mock for local Hardhat testing.
 *      Anyone can mint tokens to themselves (testnet only - NOT for production).
 */
contract MockUSDC is ERC20 {
    uint8 private _decimals;

    constructor() ERC20("Mock USDC", "USDC") {
        _decimals = 6;
        // Mint 1,000,000 USDC to deployer
        _mint(msg.sender, 1_000_000 * 10 ** 6);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /// @dev Allow anyone to faucet tokens (testnet / local only)
    function faucet(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
