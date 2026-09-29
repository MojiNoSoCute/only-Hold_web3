'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Web3ContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  balance: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
}

const Web3Context = createContext<Web3ContextType>({
  address: null,
  isConnected: false,
  isConnecting: false,
  chainId: null,
  balance: '0',
  connect: async () => {},
  disconnect: () => {},
  switchChain: async () => {},
});

export function Web3Provider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState('0');

  // Check for existing connection on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
            fetchChainId();
          }
        })
        .catch(console.error);

      // Listen for account/chain changes
      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      (window as any).ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if ((window as any).ethereum?.removeListener) {
        (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
        (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect();
    } else {
      setAddress(accounts[0]);
    }
  };

  const handleChainChanged = (chainIdHex: string) => {
    setChainId(parseInt(chainIdHex, 16));
    window.location.reload();
  };

  const fetchChainId = async () => {
    if ((window as any).ethereum) {
      const id = await (window as any).ethereum.request({ method: 'eth_chainId' });
      setChainId(parseInt(id, 16));
    }
  };

  const connect = async () => {
    if (!(window as any).ethereum) {
      alert('Please install MetaMask or another Web3 wallet to use OnlyHold!');
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });
      setAddress(accounts[0]);
      setIsConnected(true);
      await fetchChainId();
      // Mock balance fetch
      setBalance('1.245');
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

  const switchChain = async (targetChainId: number) => {
    if (!(window as any).ethereum) return;
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (err) {
      console.error('Chain switch failed:', err);
    }
  };

  return (
    <Web3Context.Provider
      value={{ address, isConnected, isConnecting, chainId, balance, connect, disconnect, switchChain }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => useContext(Web3Context);
