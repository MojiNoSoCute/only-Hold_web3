'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ─── Sepolia chain config ──────────────────────────────────────────────────

export const SEPOLIA_CHAIN_ID = 11155111;

const SEPOLIA_PARAMS = {
  chainId: '0xaa36a7',
  chainName: 'Ethereum Sepolia Testnet',
  nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://rpc.sepolia.org', 'https://ethereum-sepolia.publicnode.com'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
};

// ─── Types ─────────────────────────────────────────────────────────────────

interface Web3ContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  isWrongNetwork: boolean;
  balance: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToSepolia: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType>({
  address: null,
  isConnected: false,
  isConnecting: false,
  chainId: null,
  isWrongNetwork: false,
  balance: '0',
  connect: async () => {},
  disconnect: () => {},
  switchToSepolia: async () => {},
});

// ─── Provider ──────────────────────────────────────────────────────────────

export function Web3Provider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState('0');

  const isWrongNetwork = isConnected && chainId !== null && chainId !== SEPOLIA_CHAIN_ID;

  // ── Helpers ────────────────────────────────────────────────────────────

  const fetchChainId = async () => {
    if (!(window as any).ethereum) return;
    const hex = await (window as any).ethereum.request({ method: 'eth_chainId' });
    setChainId(parseInt(hex, 16));
  };

  const fetchBalance = async (addr: string) => {
    if (!(window as any).ethereum) return;
    try {
      const hex = await (window as any).ethereum.request({
        method: 'eth_getBalance',
        params: [addr, 'latest'],
      });
      const wei = BigInt(hex);
      const eth = Number(wei) / 1e18;
      setBalance(eth.toFixed(4));
    } catch {
      setBalance('0');
    }
  };

  // ── Switch / add Sepolia ───────────────────────────────────────────────

  const switchToSepolia = async () => {
    if (!(window as any).ethereum) return;
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_PARAMS.chainId }],
      });
    } catch (err: any) {
      // 4902 = chain not added yet
      if (err.code === 4902) {
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [SEPOLIA_PARAMS],
        });
      }
    }
  };

  // ── Connect ────────────────────────────────────────────────────────────

  const connect = async () => {
    if (!(window as any).ethereum) {
      alert('กรุณาติดตั้ง MetaMask หรือกระเป๋า Web3 ก่อนใช้งาน OnlyHold');
      return;
    }
    setIsConnecting(true);
    try {
      const accounts: string[] = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });
      setAddress(accounts[0]);
      setIsConnected(true);
      await fetchChainId();
      await fetchBalance(accounts[0]);

      // Auto-switch to Sepolia if on wrong network
      const hex = await (window as any).ethereum.request({ method: 'eth_chainId' });
      if (parseInt(hex, 16) !== SEPOLIA_CHAIN_ID) {
        await switchToSepolia();
      }
    } catch (err) {
      console.error('Connection failed:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setIsConnected(false);
    setChainId(null);
    setBalance('0');
  };

  // ── Event listeners ────────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;

    // Restore existing connection
    (window as any).ethereum
      .request({ method: 'eth_accounts' })
      .then(async (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          await fetchChainId();
          await fetchBalance(accounts[0]);
        }
      })
      .catch(console.error);

    const onAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
        fetchBalance(accounts[0]);
      }
    };

    const onChainChanged = (hex: string) => {
      setChainId(parseInt(hex, 16));
    };

    (window as any).ethereum.on('accountsChanged', onAccountsChanged);
    (window as any).ethereum.on('chainChanged', onChainChanged);

    return () => {
      (window as any).ethereum?.removeListener('accountsChanged', onAccountsChanged);
      (window as any).ethereum?.removeListener('chainChanged', onChainChanged);
    };
  }, []);

  return (
    <Web3Context.Provider
      value={{
        address,
        isConnected,
        isConnecting,
        chainId,
        isWrongNetwork,
        balance,
        connect,
        disconnect,
        switchToSepolia,
      }}
    >
      {/* Wrong network banner */}
      {isWrongNetwork && (
        <div className="fixed top-0 inset-x-0 z-[200] bg-yellow-500 text-black text-sm font-medium text-center py-2 flex items-center justify-center gap-3">
          <span>⚠️ คุณอยู่บน network ที่ไม่ถูกต้อง กรุณาสลับไป Sepolia Testnet</span>
          <button
            onClick={switchToSepolia}
            className="px-3 py-0.5 rounded-lg bg-black/20 hover:bg-black/30 transition-colors font-semibold text-xs"
          >
            สลับเลย
          </button>
        </div>
      )}
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);
