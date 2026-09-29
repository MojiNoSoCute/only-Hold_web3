'use client';

import { useWeb3 } from '@/lib/Web3Provider';
import { MOCK_CONTENT, MOCK_CREATORS } from '@/lib/mockData';
import Link from 'next/link';
import WalletModal from '@/components/WalletModal';
import { useState } from 'react';
import { formatNumber, shortenAddress } from '@/lib/utils';

const MOCK_ANALYTICS = {
  totalEarnings: '12,450',
  monthlyEarnings: '2,100',
  totalSubscribers: 347,
  nftHolders: 89,
  stablecoinSubs: 258,
  totalContent: 24,
  pendingWithdrawal: '450.00',
  recentTxns: [
    { type: 'nft_mint', user: '0xabc...1234', amount: '0.05 ETH', time: '2 mins ago' },
    { type: 'stablecoin', user: '0xdef...5678', amount: '$20 USDC', time: '15 mins ago' },
    { type: 'nft_mint', user: '0x123...abcd', amount: '0.05 ETH', time: '1 hour ago' },
    { type: 'stablecoin', user: '0x456...efgh', amount: '$10 USDC', time: '3 hours ago' },
  ],
};

export default function DashboardPage() {
  const { isConnected } = useWeb3();
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const handleWithdraw = async () => {
    setWithdrawing(true);
    await new Promise((r) => setTimeout(r, 2000));
    setWithdrawing(false);
    alert('Withdrawal of $' + MOCK_ANALYTICS.pendingWithdrawal + ' USDC initiated!');
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-6">📊</div>
        <h1 className="text-2xl font-bold text-white mb-3">Creator Dashboard</h1>
        <p className="text-white/50 mb-8">Connect your wallet to access your creator dashboard.</p>
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Creator Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">Manage your content and earnings</p>
        </div>
        <Link
          href="/become-creator"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:opacity-90 transition-all"
        >
          + New Post
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Earnings', value: `$${MOCK_ANALYTICS.totalEarnings}`, sub: 'All time', color: 'text-green-400', icon: '💰' },
          { label: 'Monthly Revenue', value: `$${MOCK_ANALYTICS.monthlyEarnings}`, sub: 'This month', color: 'text-blue-400', icon: '📈' },
          { label: 'Total Fans', value: formatNumber(MOCK_ANALYTICS.totalSubscribers), sub: `${MOCK_ANALYTICS.nftHolders} NFT + ${MOCK_ANALYTICS.stablecoinSubs} sub`, color: 'text-purple-400', icon: '👥' },
          { label: 'Posts', value: MOCK_ANALYTICS.totalContent.toString(), sub: 'Published', color: 'text-pink-400', icon: '📄' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#13131a] border border-white/5 rounded-2xl p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xl">{stat.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-white/80 text-sm font-medium mt-0.5">{stat.label}</p>
            <p className="text-white/30 text-xs mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Subscriber Breakdown */}
        <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-4">Subscriber Types</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-purple-400 flex items-center gap-1.5">🖼️ NFT Holders</span>
                <span className="text-white font-medium">{MOCK_ANALYTICS.nftHolders}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
                  style={{ width: `${(MOCK_ANALYTICS.nftHolders / MOCK_ANALYTICS.totalSubscribers) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-green-400 flex items-center gap-1.5">💵 Stablecoin Subs</span>
                <span className="text-white font-medium">{MOCK_ANALYTICS.stablecoinSubs}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full"
                  style={{ width: `${(MOCK_ANALYTICS.stablecoinSubs / MOCK_ANALYTICS.totalSubscribers) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Withdrawal */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-white/50 text-xs">Pending Withdrawal</p>
                <p className="text-green-400 font-bold text-lg">${MOCK_ANALYTICS.pendingWithdrawal} USDC</p>
              </div>
            </div>
            <button
              onClick={handleWithdraw}
              disabled={withdrawing}
              className="w-full py-2.5 rounded-xl bg-green-600/80 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {withdrawing ? 'Withdrawing...' : 'Withdraw Earnings'}
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {MOCK_ANALYTICS.recentTxns.map((tx, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type === 'nft_mint' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>
                  {tx.type === 'nft_mint' ? '🖼️' : '💵'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-xs font-mono truncate">{tx.user}</p>
                  <p className="text-white/30 text-[11px]">{tx.time}</p>
                </div>
                <span className={`text-xs font-bold font-mono ${tx.type === 'nft_mint' ? 'text-purple-400' : 'text-green-400'}`}>
                  +{tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5">
            <h3 className="font-bold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { icon: '📝', label: 'Create New Post', href: '/become-creator' },
                { icon: '🖼️', label: 'Manage NFT Collection', href: '/my-nfts' },
                { icon: '👤', label: 'Edit Profile', href: '/profile' },
                { icon: '📊', label: 'View Analytics', href: '/dashboard' },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <span className="text-base">{action.icon}</span>
                  <span className="text-sm text-white/70 group-hover:text-white transition-colors">{action.label}</span>
                  <svg className="w-4 h-4 text-white/20 group-hover:text-white/50 ml-auto transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5">
            <h3 className="font-bold text-purple-300 text-sm mb-2">💡 Pro Tip</h3>
            <p className="text-white/50 text-xs leading-relaxed">
              Creators who post at least 3x per week earn 2.4x more than those who post weekly. Consistency is key!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
