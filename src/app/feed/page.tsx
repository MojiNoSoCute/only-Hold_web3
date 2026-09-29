'use client';

import { useWeb3 } from '@/lib/Web3Provider';
import { MOCK_CONTENT, MOCK_CREATORS } from '@/lib/mockData';
import ContentCard from '@/components/ContentCard';
import Link from 'next/link';
import WalletModal from '@/components/WalletModal';
import { useState } from 'react';

export default function FeedPage() {
  const { isConnected, address } = useWeb3();
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-6">🔐</div>
        <h1 className="text-2xl font-bold text-white mb-3">Connect to See Your Feed</h1>
        <p className="text-white/50 mb-8">
          Connect your wallet to see exclusive content from creators you're subscribed to.
        </p>
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

  // Show mock subscribed content (first 4 items)
  const myFeed = MOCK_CONTENT.slice(0, 4);
  const subscribedCreators = MOCK_CREATORS.slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">My Feed</h1>
          <p className="text-white/40 text-sm mt-1">Content from creators you follow</p>
        </div>
        <Link href="/explore" className="text-purple-400 hover:text-purple-300 text-sm transition-colors">
          + Find Creators
        </Link>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Feed */}
        <div className="lg:col-span-3">
          <div className="grid sm:grid-cols-2 gap-5">
            {myFeed.map((content) => (
              <ContentCard key={content.id} content={content} isSubscribed={true} />
            ))}
          </div>
        </div>

        {/* Sidebar - Subscriptions */}
        <div>
          <div className="bg-[#13131a] border border-white/5 rounded-2xl p-4 sticky top-20">
            <h3 className="font-bold text-white text-sm mb-4">My Subscriptions</h3>
            <div className="space-y-3">
              {subscribedCreators.map((creator) => (
                <Link key={creator.id} href={`/creator/${creator.username}`} className="flex items-center gap-3 group">
                  <img src={creator.avatar} alt={creator.name} className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white group-hover:text-purple-300 transition-colors truncate">{creator.name}</p>
                    <p className="text-xs text-white/30">NFT Holder</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-400" title="Active" />
                </Link>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex justify-between text-xs text-white/30 mb-2">
                <span>Total Deposited</span>
                <span className="text-green-400 font-mono">$45.00 USDC</span>
              </div>
              <div className="flex justify-between text-xs text-white/30">
                <span>NFTs Held</span>
                <span className="text-purple-400 font-mono">2 NFTs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
