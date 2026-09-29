/**
 * useOnlyHold — React hook for interacting with OnlyHold smart contracts
 *
 * Wraps ethers.js calls for:
 *   - checkAccess / resolveUsername
 *   - mintNFT
 *   - subscribeWithStablecoin / cancelSubscription
 *   - registerCreator via Factory
 */
'use client';

import { useCallback, useState } from 'react';
import { useWeb3 } from './Web3Provider';

// ─── ABI Fragments — must match OnlyHoldFactory.sol exactly ───────────────

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

// ── FACTORY ABI — matching OnlyHoldFactory.sol struct tuples exactly ─────────────
const FACTORY_ABI = [
  'function checkAccess(address creatorAddress, address fan) view returns (bool hasAccess, string via)',
  'function resolveUsername(string username) view returns (address creator, address nft, address sub)',
  'function launchCreator(string username, string metadataURI, (bool enable, string name, string symbol, uint256 mintPrice, uint256 maxSupply, string baseURI) nft, (bool enable, uint256 monthlyPrice, address customStablecoin) sub) returns (address nftContract, address subContract)',
  'function creatorProfiles(address) view returns (address creatorAddress, address nftContract, address subscriptionContract, string username, string metadataURI, uint256 registeredAt, bool isActive)',
  'function isRegistered(address) view returns (bool)',
  // custom errors
  'error AlreadyRegistered()',
  'error UsernameTaken()',
  'error Blacklisted()',
  'error MustEnableAtLeastOne()',
  'error InvalidUsername()',
  // event
  'event CreatorLaunched(address indexed creator, string username, address nftContract, address subscriptionContract, uint256 timestamp)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
];

// ─── Contract Addresses ────────────────────────────────────────────────────

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? '';
const USDC_ADDRESS    = process.env.NEXT_PUBLIC_USDC_ADDRESS ?? '';

// ─── Error parser (ethers v6) ──────────────────────────────────────────────

function parseContractError(err: any): string {
  if (
    err?.code === 4001 ||
    err?.code === 'ACTION_REJECTED' ||
    err?.message?.includes('user rejected') ||
    err?.message?.includes('User denied')
  ) return 'ACTION_REJECTED';

  if (err?.revert?.name) return err.revert.name;
  if (err?.reason)       return err.reason;

  if (err?.data) {
    const hex = typeof err.data === 'string' ? err.data : err.data?.data;
    if (typeof hex === 'string') {
      if (hex.startsWith('0x08c379a0')) {
        try {
          const { ethers } = require('ethers');
          const msg = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + hex.slice(10))[0];
          return `require: ${msg}`;
        } catch {}
      }
    }
  }

  return err?.shortMessage ?? err?.message ?? 'เกิดข้อผิดพลาด';
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface AccessResult {
  hasAccess: boolean;
  via: 'nft' | 'subscription' | 'owner' | 'none';
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

  // signer-based contract (write)
  const getContract = useCallback(
    (contractAddress: string, abi: string[]) => {
      if (typeof window === 'undefined' || !(window as any).ethereum) return null;
      const { ethers } = require('ethers');
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      return provider.getSigner().then((signer: any) =>
        new ethers.Contract(contractAddress, abi, signer)
      );
    },
    []
  );

  // provider-based contract (read-only)
  const getReadContract = useCallback(
    (contractAddress: string, abi: string[]) => {
      if (typeof window === 'undefined' || !(window as any).ethereum) return null;
      const { ethers } = require('ethers');
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      return new ethers.Contract(contractAddress, abi, provider);
    },
    []
  );

  // ── checkAccess ───────────────────────────────────────────────────────────

  const checkAccess = useCallback(
    async (creatorAddressOrUsername: string): Promise<AccessResult> => {
      if (!isConnected || !address || !FACTORY_ADDRESS)
        return { hasAccess: false, via: 'none' };
      try {
        const contract = getReadContract(FACTORY_ADDRESS, FACTORY_ABI);
        if (!contract) return { hasAccess: false, via: 'none' };

        let targetAddress = creatorAddressOrUsername;

        if (targetAddress.toLowerCase() === address.toLowerCase()) {
          return { hasAccess: true, via: 'owner' };
        }

        if (!targetAddress.startsWith('0x')) {
          try {
            const [resolvedCreator] = await contract.resolveUsername(targetAddress);
            if (resolvedCreator && resolvedCreator !== '0x0000000000000000000000000000000000000000') {
              targetAddress = resolvedCreator;
            } else {
              return { hasAccess: false, via: 'none' };
            }
          } catch {
            return { hasAccess: false, via: 'none' };
          }
        }

        if (targetAddress.toLowerCase() === address.toLowerCase()) {
          return { hasAccess: true, via: 'owner' };
        }

        const [hasAccess, via] = await contract.checkAccess(targetAddress, address);
        return { hasAccess, via };
      } catch {
        return { hasAccess: false, via: 'none' };
      }
    },
    [address, isConnected, getReadContract]
  );

  // ── resolveUsername ───────────────────────────────────────────────────────

  const resolveUsername = useCallback(
    async (username: string) => {
      if (!FACTORY_ADDRESS) return null;
      try {
        const contract = getReadContract(FACTORY_ADDRESS, FACTORY_ABI);
        if (!contract) return null;
        const [creator, nft, sub] = await contract.resolveUsername(username);
        return { creator, nftContract: nft, subContract: sub };
      } catch {
        return null;
      }
    },
    [getReadContract]
  );

  // ── checkIsRegistered ─────────────────────────────────────────────────────

  const checkIsRegistered = useCallback(
    async (targetAddress?: string): Promise<{ isRegistered: boolean; username?: string }> => {
      const addrToCheck = targetAddress || address;
      if (!addrToCheck || !FACTORY_ADDRESS) return { isRegistered: false };
      try {
        const contract = getReadContract(FACTORY_ADDRESS, FACTORY_ABI);
        if (!contract) return { isRegistered: false };
        const registered: boolean = await contract.isRegistered(addrToCheck);
        if (!registered) return { isRegistered: false };
        const profile = await contract.creatorProfiles(addrToCheck);
        return { isRegistered: true, username: profile.username };
      } catch {
        return { isRegistered: false };
      }
    },
    [address, getReadContract]
  );

  // ── mintNFT ───────────────────────────────────────────────────────────────

  const mintNFT = useCallback(
    async (nftContractAddress: string, mintPrice: string): Promise<TxResult> => {
      if (!isConnected) return { success: false, error: 'Wallet not connected' };
      setIsLoading(true);
      try {
        const { ethers } = require('ethers');
        const contractPromise = getContract(nftContractAddress, NFT_ABI);
        if (!contractPromise) return { success: false, error: 'No provider' };
        const contract = await contractPromise;
        const tx = await contract.mint(address, '', { value: ethers.parseEther(mintPrice) });
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

  // ── subscribeWithStablecoin ───────────────────────────────────────────────

  const subscribeWithStablecoin = useCallback(
    async (subContractAddress: string, months: number, monthlyPrice: bigint): Promise<TxResult> => {
      if (!isConnected) return { success: false, error: 'Wallet not connected' };
      setIsLoading(true);
      try {
        const { ethers } = require('ethers');
        const amount = monthlyPrice * BigInt(months);

        const usdcPromise = getContract(USDC_ADDRESS, ERC20_ABI);
        if (!usdcPromise) return { success: false, error: 'No provider' };
        const usdc = await usdcPromise;

        const allowance = await usdc.allowance(address, subContractAddress);
        if (allowance < amount) {
          const approveTx = await usdc.approve(subContractAddress, ethers.MaxUint256);
          await approveTx.wait();
        }

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

  // ── cancelSubscription ────────────────────────────────────────────────────

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

  // ── getSubscriptionInfo ───────────────────────────────────────────────────

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

  // ── registerCreator ───────────────────────────────────────────────────────
  // ส่ง flat 11 params ตรงตาม OnlyHoldFactory.launchCreator signature

  const registerCreator = useCallback(
    async (params: {
      username: string;
      metadataURI: string;
      enableNFT: boolean;
      nftName: string;
      nftSymbol: string;
      nftMintPrice: string;   // ETH string e.g. "0.05"
      nftMaxSupply: number;
      nftBaseURI: string;
      enableSub: boolean;
      monthlyPrice: bigint;   // USDC base units e.g. 10_000_000n
    }): Promise<TxResult & { nftContract?: string; subContract?: string }> => {
      if (!isConnected) return { success: false, error: 'Wallet not connected' };
      setIsLoading(true);
      try {
        const { ethers } = require('ethers');
        const factoryPromise = getContract(FACTORY_ADDRESS, FACTORY_ABI);
        if (!factoryPromise) return { success: false, error: 'No provider' };
        const factory = await factoryPromise;

        // Struct tuples matching Solidity: launchCreator(string, string, NFTParams, SubParams)
        const tx = await factory.launchCreator(
          params.username,
          params.metadataURI,
          {
            enable: params.enableNFT,
            name: params.nftName || `${params.username} Pass`,
            symbol: params.nftSymbol || params.username.toUpperCase().slice(0, 5),
            mintPrice: ethers.parseEther(params.nftMintPrice || '0'),
            maxSupply: params.nftMaxSupply || 0,
            baseURI: params.nftBaseURI || '',
          },
          {
            enable: params.enableSub,
            monthlyPrice: params.monthlyPrice || 0n,
            customStablecoin: ethers.ZeroAddress,
          }
        );

        const receipt = await tx.wait();

        // parse CreatorLaunched event
        const iface = new ethers.Interface(FACTORY_ABI);
        const event = receipt.logs
          .map((log: any) => { try { return iface.parseLog(log); } catch { return null; } })
          .find((e: any) => e?.name === 'CreatorLaunched');

        return {
          success: true,
          hash: receipt.hash,
          nftContract:  event?.args?.nftContract,
          subContract:  event?.args?.subscriptionContract,
        };
      } catch (err: any) {
        return { success: false, error: parseContractError(err) };
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, getContract]
  );

  return {
    isLoading,
    checkAccess,
    resolveUsername,
    checkIsRegistered,
    mintNFT,
    subscribeWithStablecoin,
    cancelSubscription,
    getSubscriptionInfo,
    registerCreator,
    FACTORY_ADDRESS,
    USDC_ADDRESS,
  };
}
