'use client';

import { useWeb3 } from '@/lib/Web3Provider';
import { shortenAddress, formatNumber } from '@/lib/utils';
import { MOCK_CREATORS } from '@/lib/mockData';
import Link from 'next/link';
import WalletModal from '@/components/WalletModal';
import { useState } from 'react';

const MOCK_NFTS = [
  {
    id: '1',
    creator: MOCK_CREATORS[0],
    tokenId: '#0042',
    mintedAt: '2024-12-15',
    floorPrice: '0.09',
  },
  {
    id: '2',
    creator: MOCK_CREATORS[4],
    tokenId: '#0187',
    mintedAt: '2024-11-20',
    floorPrice: '0.06',
  },
];

const MOCK_STABLECOIN_SUBS = [
  {
    creator: MOCK_CREATORS[1],
    monthlyPrice: '10',
    deposited: '30',
    remainingMonths: 3,
    nextBill: '2025-02-15',
  },
  {
    creator: MOCK_CREATORS[2],
    monthlyPrice: '20',
    deposited: '20',
    remainingMonths: 1,
    nextBill: '2025-01-30',
  },
];

export default function ProfilePage() {
  const { isConnected, address } = useWeb3();
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'nfts' | 'subscriptions'>('nfts');

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-6">👤</div>
        <h1 className="text-2xl font-bold text-white mb-3">My Profile</h1>
        <p className="text-white/50 mb-8">Connect your wallet to view your profile, NFTs, and subscriptions.</p>
        <button
          onClick={() => setWalletModalOpen(true)}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition-all"
        >
          Connect Wallet
        </button>
        {walletModalOpen && <WalletModal onClose={() => setWalletModalOpen(false)} />}
      </div>
    );
  }

  const totalNFTValue = MOCK_NFTS.reduce((sum, nft) => sum + parseFloat(nft.floorPrice), 0);
  const totalStablecoinDeposited = MOCK_STABLECOIN_SUBS.reduce((sum, sub) => sum + parseFloat(sub.deposited), 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Profile Card */}
      <div className="bg-[#13131a] border border-white/5 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-5">
          {/* Generated Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl text-white font-bold flex-shrink-0">
            {address?.slice(2, 4).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-bold text-white text-lg font-mono">{shortenAddress(address!)}</p>
            <p className="text-white/40 text-sm">Fan & Collector</p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 text-sm transition-colors"
          >
            Creator Dashboard →
          </Link>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white/3 rounded-xl p-3 text-center">
            <p className="text-purple-400 font-bold text-lg">{MOCK_NFTS.length}</p>
            <p className="text-white/40 text-xs">NFTs Held</p>
          </div>
          <div className="bg-white/3 rounded-xl p-3 text-center">
            <p className="text-green-400 font-bold text-lg">${totalStablecoinDeposited}</p>
            <p className="text-white/40 text-xs">USDC Deposited</p>
          </div>
          <div className="bg-white/3 rounded-xl p-3 text-center">
            <p className="text-yellow-400 font-bold text-lg">{totalNFTValue.toFixed(2)} ETH</p>
            <p className="text-white/40 text-xs">NFT Portfolio</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/3 border border-white/5 rounded-xl p-1 mb-6 w-fit">
        {(['nfts', 'subscriptions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
          >
            {tab === 'nfts' ? `🖼️ NFTs (${MOCK_NFTS.length})` : `💵 Subscriptions (${MOCK_STABLECOIN_SUBS.length})`}
          </button>
        ))}
      </div>

      {/* NFTs Tab */}
      {activeTab === 'nfts' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {MOCK_NFTS.map((nft) => (
            <div key={nft.id} className="bg-[#13131a] border border-white/5 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-colors group">
              {/* NFT Visual */}
              <div className="relative h-32 overflow-hidden bg-gradient-to-br from-purple-900/40 to-pink-900/40">
                <img src={nft.creator.coverImage} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-2xl">
                    🎫
                  </div>
                </div>
                <div className="absolute top-2 right-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs px-2 py-0.5 rounded-full font-mono">
                  {nft.tokenId}
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <img src={nft.creator.avatar} alt="" className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-pink-600" />
                  <div>
                    <p className="text-white font-medium text-sm">{nft.creator.name}</p>
                    <p className="text-white/30 text-xs">@{nft.creator.username}</p>
                  </div>
                </div>

                <div className="flex justify-between text-xs mb-3">
                  <span className="text-white/40">Floor Price</span>
                  <span className="text-purple-400 font-mono font-bold">{nft.floorPrice} ETH</span>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/creator/${nft.creator.username}`}
                    className="flex-1 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs text-center hover:bg-purple-500/20 transition-colors"
                  >
                    View Content
                  </Link>
                  <button className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10 transition-colors">
                    Sell NFT
                  </button>
                </div>
              </div>
            </div>
          ))}

          <Link
            href="/explore"
            className="border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-8 text-white/20 hover:border-purple-500/30 hover:text-purple-400 transition-all group min-h-[200px]"
          >
            <span className="text-3xl mb-2">+</span>
            <p className="text-sm">Browse More Creators</p>
          </Link>
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          {MOCK_STABLECOIN_SUBS.map((sub, i) => (
            <div key={i} className="bg-[#13131a] border border-white/5 rounded-2xl p-4 hover:border-green-500/20 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <img src={sub.creator.avatar} alt="" className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600" />
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{sub.creator.name}</p>
                  <p className="text-white/30 text-xs">@{sub.creator.username}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-green-400 text-xs">Active</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <p className="text-white/30 text-xs">Monthly</p>
                  <p className="text-green-400 font-mono font-bold text-sm">${sub.monthlyPrice} USDC</p>
                </div>
                <div>
                  <p className="text-white/30 text-xs">Deposited</p>
                  <p className="text-white font-bold text-sm">${sub.deposited} USDC</p>
                </div>
                <div>
                  <p className="text-white/30 text-xs">Remaining</p>
                  <p className="text-yellow-400 font-bold text-sm">{sub.remainingMonths} mo</p>
                </div>
              </div>

              {/* Balance bar */}
              <div className="mb-4">
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
                    style={{ width: `${(sub.remainingMonths / 3) * 100}%` }}
                  />
                </div>
                <p className="text-white/20 text-[10px] mt-1">Next billing: {sub.nextBill}</p>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/creator/${sub.creator.username}`}
                  className="flex-1 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs text-center hover:bg-green-500/20 transition-colors"
                >
                  View Content
                </Link>
                <button className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10 transition-colors">
                  + Top Up
                </button>
                <button className="py-2 px-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
