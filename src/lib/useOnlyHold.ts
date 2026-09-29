/**
 * useOnlyHold — React hook for interacting with OnlyHold smart contracts
 *
 * This hook wraps raw ethers.js calls into a clean interface that the
 * frontend components can use to:
 *   - Check if a wallet has access to a creator's content
 *   - Mint an NFT membership
 *   - Deposit stablecoin for a subscription
 *   - Withdraw a stablecoin subscription balance
 *   - Register as a creator via the factory
 *
 * The ABI fragments are minimal — only the functions we actually call.
 * Replace with full generated TypeChain types after `npx hardhat compile`.
 */
'use client';

import { useCallback, useState } from 'react';
import { useWeb3 } from './Web3Provider';

// ─── Minimal ABI Fragments ─────────────────────────────────────────────────

const NFT_ABI = [
  'function mint(address to, string tokenURI) payable',
  'function isMember(address account) view returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function mintPrice() view returns (uint256)',
  'function totalMinted() view returns (uint256)',
  'function maxSupply() view returns (uint256)',
  'error InsufficientPayment(uint256 required, uint256 provided)',
  'error MaxSupplyReached(uint256 maxSupply)',
  'error MintingIsPaused()',
  'event NFTMinted(address indexed to, uint256 indexed tokenId, uint256 price)',
];

const SUB_ABI = [
  'function subscribe(uint256 amount)',
  'function withdrawBalance()',
  'function isSubscribed(address account) view returns (bool)',
  'function getSubscription(address account) view returns (uint256 deposited, uint256 expiresAt, bool isActive, uint256 remainingSeconds)',
  'function monthlyPrice() view returns (uint256)',
  'function withdrawEarnings()',
  'function pendingCreatorEarnings() view returns (uint256)',
  'error InsufficientDeposit(uint256 required, uint256 provided)',
  'error NotMultipleOfMonthlyPrice(uint256 amount, uint256 monthlyPrice_)',
  'error NoEarningsToWithdraw()',
  'error NoBalanceToWithdraw()',
];

const FACTORY_ABI = [
  'function checkAccess(address creatorAddress, address fan) view returns (bool hasAccess, string via)',
  'function resolveUsername(string username) view returns (address creator, address nft, address sub)',
  'function launchCreator(string username, string metadataURI, (bool enable, string name, string symbol, uint256 mintPrice, uint256 maxSupply, string baseURI) nft, (bool enable, uint256 monthlyPrice, address customStablecoin) sub) returns (address nftContract, address subContract)',
  'function creatorProfiles(address) view returns (address creatorAddress, address nftContract, address subscriptionContract, string username, string metadataURI, uint256 registeredAt, bool isActive)',
  'function isRegistered(address) view returns (bool)',
  // custom errors — needed for ethers to decode revert reasons
  'error AlreadyRegistered()',
  'error UsernameTaken()',
  'error Blacklisted()',
  'error MustEnableAtLeastOne()',
  'error InvalidUsername()',
  // events
  'event CreatorLaunched(address indexed creator, string username, address nftContract, address subscriptionContract, uint256 timestamp)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
];

// ─── Contract Addresses (from env) ────────────────────────────────────────

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? '';
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS ?? '';

// ─── Error parser (ethers v6) ──────────────────────────────────────────────

function parseContractError(err: any): string {
  // User rejected
  if (err?.code === 4001 || err?.code === 'ACTION_REJECTED' ||
      err?.message?.includes('user rejected') || err?.message?.includes('User denied')) {
    return 'ACTION_REJECTED';
  }
  // ethers v6: err.revert.name is the custom error name
  if (err?.revert?.name) return err.revert.name;
  // err.reason (older ethers)
  if (err?.reason) return err.reason;
  // parse from data field
  if (err?.data) {
    const hex = typeof err.data === 'string' ? err.data : err.data?.data;
    if (hex) {
      if (hex.startsWith('0x08c379a0')) return 'require: ' + decodeRevertString(hex);
      if (hex.startsWith('0x4e5cf2a0')) return 'AlreadyRegistered';
      if (hex.startsWith('0x')) return 'ContractError';
    }
  }
  // fallback
  return err?.shortMessage ?? err?.message ?? 'เกิดข้อผิดพลาด';
}

function decodeRevertString(hex: string): string {
  try {
    const { ethers } = require('ethers');
    return ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + hex.slice(10))[0];
  } catch {
    return hex;
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface AccessResult {
  hasAccess: boolean;
  via: 'nft' | 'subscription' | 'none';
}

export interface SubscriptionInfo {
  deposited: bigint;
  expiresAt: bigint;
  isActive: boolean;
  remainingSeconds: bigint;
}

export interface TxResult {
  success: boolean;
  hash?: string;
  error?: string;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useOnlyHold() {
  const { address, isConnected } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get an ethers Contract instance using the browser's injected provider.
   */
  const getContract = useCallback(
    (contractAddress: string, abi: string[]) => {
      if (typeof window === 'undefined' || !(window as any).ethereum) return null;
      // Dynamic import to avoid SSR issues
      const { ethers } = require('ethers');
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      return provider.getSigner().then((signer: any) =>
        new ethers.Contract(contractAddress, abi, signer)
      );
    },
    []
  );

  const getReadContract = useCallback(
    (contractAddress: string, abi: string[]) => {
      if (typeof window === 'undefined' || !(window as any).ethereum) return null;
      const { ethers } = require('ethers');
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      return new ethers.Contract(contractAddress, abi, provider);
    },
    []
  );

  // ── Check Access ──────────────────────────────────────────────────────────

  /**
   * Check if the connected wallet has access to a creator's content.
   * Calls OnlyHoldFactory.checkAccess() on-chain.
   */
  const checkAccess = useCallback(
    async (creatorAddress: string): Promise<AccessResult> => {
      if (!isConnected || !address || !FACTORY_ADDRESS) {
        return { hasAccess: false, via: 'none' };
      }
      try {
        const contract = getReadContract(FACTORY_ADDRESS, FACTORY_ABI);
        if (!contract) return { hasAccess: false, via: 'none' };
        const [hasAccess, via] = await contract.checkAccess(creatorAddress, address);
        return { hasAccess, via };
      } catch (err) {
        console.error('checkAccess error:', err);
        return { hasAccess: false, via: 'none' };
      }
    },
    [address, isConnected, getReadContract]
  );

  // ── Resolve Username ──────────────────────────────────────────────────────

  /**
   * Resolve a creator's username to their wallet + contract addresses.
   */
  const resolveUsername = useCallback(
    async (username: string) => {
      if (!FACTORY_ADDRESS) return null;
      try {
        const contract = getReadContract(FACTORY_ADDRESS, FACTORY_ABI);
        if (!contract) return null;
        const [creator, nft, sub] = await contract.resolveUsername(username);
        return { creator, nftContract: nft, subContract: sub };
      } catch (err) {
        console.error('resolveUsername error:', err);
        return null;
      }
    },
    [getReadContract]
  );

  // ── Mint NFT ──────────────────────────────────────────────────────────────

  /**
   * Mint an NFT membership from a creator's NFT contract.
   * @param nftContractAddress  The creator's NFT contract address
   * @param mintPrice           Price in ETH (string, e.g. "0.05")
   */
  const mintNFT = useCallback(
    async (nftContractAddress: string, mintPrice: string): Promise<TxResult> => {
      if (!isConnected) return { success: false, error: 'Wallet not connected' };
      setIsLoading(true);
      try {
        const { ethers } = require('ethers');
        const contractPromise = getContract(nftContractAddress, NFT_ABI);
        if (!contractPromise) return { success: false, error: 'No provider' };
        const contract = await contractPromise;
        const tx = await contract.mint(address, '', {
          value: ethers.parseEther(mintPrice),
        });
        const receipt = await tx.wait();
        return { success: true, hash: receipt.hash };
      } catch (err: any) {
        return { success: false, error: parseContractError(err) };
      } finally {
        setIsLoading(false);
      }
    },
    [address, isConnected, getContract]
  );

  // ── Subscribe (Stablecoin) ────────────────────────────────────────────────

  /**
   * Subscribe to a creator by depositing stablecoin.
   * @param subContractAddress  The creator's subscription contract address
   * @param months              Number of months to subscribe
   * @param monthlyPrice        Monthly price in USDC base units (e.g. 10_000_000)
   */
  const subscribeWithStablecoin = useCallback(
    async (
      subContractAddress: string,
      months: number,
      monthlyPrice: bigint
    ): Promise<TxResult> => {
      if (!isConnected) return { success: false, error: 'Wallet not connected' };
      setIsLoading(true);
      try {
        const { ethers } = require('ethers');
        const amount = monthlyPrice * BigInt(months);

        // Step 1: Approve USDC spending
        const usdcPromise = getContract(USDC_ADDRESS, ERC20_ABI);
        if (!usdcPromise) return { success: false, error: 'No provider' };
        const usdc = await usdcPromise;

        const currentAllowance = await usdc.allowance(address, subContractAddress);
        if (currentAllowance < amount) {
          const approveTx = await usdc.approve(subContractAddress, ethers.MaxUint256);
          await approveTx.wait();
        }

        // Step 2: Subscribe
        const subPromise = getContract(subContractAddress, SUB_ABI);
        if (!subPromise) return { success: false, error: 'No provider' };
        const sub = await subPromise;
        const tx = await sub.subscribe(amount);
        const receipt = await tx.wait();

        return { success: true, hash: receipt.hash };
      } catch (err: any) {
        return { success: false, error: parseContractError(err) };
      } finally {
        setIsLoading(false);
      }
    },
    [address, isConnected, getContract]
  );

  // ── Cancel Subscription ───────────────────────────────────────────────────

  /**
   * Cancel subscription and withdraw remaining balance.
   */
  const cancelSubscription = useCallback(
    async (subContractAddress: string): Promise<TxResult> => {
      if (!isConnected) return { success: false, error: 'Wallet not connected' };
      setIsLoading(true);
      try {
        const subPromise = getContract(subContractAddress, SUB_ABI);
        if (!subPromise) return { success: false, error: 'No provider' };
        const sub = await subPromise;
        const tx = await sub.withdrawBalance();
        const receipt = await tx.wait();
        return { success: true, hash: receipt.hash };
      } catch (err: any) {
        return { success: false, error: parseContractError(err) };
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, getContract]
  );

  // ── Get Subscription Info ─────────────────────────────────────────────────

  /**
   * Fetch subscription info for the connected wallet.
   */
  const getSubscriptionInfo = useCallback(
    async (subContractAddress: string): Promise<SubscriptionInfo | null> => {
      if (!address || !subContractAddress) return null;
      try {
        const contract = getReadContract(subContractAddress, SUB_ABI);
        if (!contract) return null;
        const [deposited, expiresAt, isActive, remainingSeconds] =
          await contract.getSubscription(address);
        return { deposited, expiresAt, isActive, remainingSeconds };
      } catch {
        return null;
      }
    },
    [address, getReadContract]
  );

  // ── Register Creator ──────────────────────────────────────────────────────

  /**
   * Register as a creator via the factory contract.
   */
  const registerCreator = useCallback(
    async (params: {
      username: string;
      metadataURI: string;
      enableNFT: boolean;
      nftName: string;
      nftSymbol: string;
      nftMintPrice: string; // ETH string
      nftMaxSupply: number;
      nftBaseURI: string;
      enableSub: boolean;
      monthlyPrice: bigint;
    }): Promise<TxResult & { nftContract?: string; subContract?: string }> => {
      if (!isConnected) return { success: false, error: 'Wallet not connected' };
      setIsLoading(true);
      try {
        const { ethers } = require('ethers');
        const factoryPromise = getContract(FACTORY_ADDRESS, FACTORY_ABI);
        if (!factoryPromise) return { success: false, error: 'No provider' };
        const factory = await factoryPromise;

        const nftParams = {
          enable: params.enableNFT,
          name: params.nftName,
          symbol: params.nftSymbol,
          mintPrice: ethers.parseEther(params.nftMintPrice),
          maxSupply: params.nftMaxSupply,
          baseURI: params.nftBaseURI,
        };

        const subParams = {
          enable: params.enableSub,
          monthlyPrice: params.monthlyPrice,
          customStablecoin: ethers.ZeroAddress,
        };

        // simulate ด้วย provider (read-only) เพื่อ decode revert reason ก่อนส่ง tx จริง
        const readFactory = getReadContract(FACTORY_ADDRESS, FACTORY_ABI);
        if (readFactory) {
          try {
            await readFactory.launchCreator.staticCall(
              params.username,
              params.metadataURI,
              nftParams,
              subParams,
              { from: address }
            );
          } catch (simErr: any) {
            throw simErr;
          }
        }

        const tx = await factory.launchCreator(
          params.username,
          params.metadataURI,
          nftParams,
          subParams
        );
        const receipt = await tx.wait();
        // Parse event from receipt
        const iface = new ethers.Interface(FACTORY_ABI);
        const event = receipt.logs
          .map((log: any) => {
            try { return iface.parseLog(log); } catch { return null; }
          })
          .find((e: any) => e?.name === 'CreatorLaunched');

        return {
          success: true,
          hash: receipt.hash,
          nftContract: event?.args?.nftContract,
          subContract: event?.args?.subscriptionContract,
        };
      } catch (err: any) {
        return { success: false, error: parseContractError(err) };
      } finally {
        setIsLoading(false);
      }
    },
    [address, isConnected, getContract, getReadContract]
  );

  return {
    isLoading,
    checkAccess,
    resolveUsername,
    mintNFT,
    subscribeWithStablecoin,
    cancelSubscription,
    getSubscriptionInfo,
    registerCreator,
    FACTORY_ADDRESS,
    USDC_ADDRESS,
  };
}
