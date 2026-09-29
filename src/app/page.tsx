'use client';

import Link from 'next/link';
import { useWeb3 } from '@/lib/Web3Provider';
import { MOCK_CREATORS, MOCK_CONTENT, CATEGORIES } from '@/lib/mockData';
import CreatorCard from '@/components/CreatorCard';
import ContentCard from '@/components/ContentCard';
import { useState } from 'react';
import { formatNumber } from '@/lib/utils';
import WalletModal from '@/components/WalletModal';

const STATS = [
  { value: '12,400+', label: 'Active Creators' },
  { value: '$4.2M', label: 'Creator Earnings' },
  { value: '89,000+', label: 'NFT Memberships' },
  { value: '320,000+', label: 'Fans' },
];

export default function HomePage() {
  const { isConnected } = useWeb3();
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const featuredCreators = MOCK_CREATORS.slice(0, 6);
  const filteredContent =
    selectedCategory === 'all'
      ? MOCK_CONTENT
      : MOCK_CONTENT.filter((c) => {
          const creator = MOCK_CREATORS.find((cr) => cr.id === c.creatorId);
          return creator?.category === selectedCategory;
        });

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="hero-mesh relative overflow-hidden pt-20 pb-24 px-4">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            Web3-Native Creator Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-6">
            <span className="text-white">Support Creators</span>
            <br />
            <span className="gradient-text">Hold NFTs. Unlock Everything.</span>
          </h1>

          <p className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            OnlyHold is the first platform where creator subscriptions are on-chain.{' '}
            <strong className="text-white/80">Hold an NFT</strong> for lifetime access or{' '}
            <strong className="text-white/80">deposit stablecoins</strong> for monthly access. Creators earn instantly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!isConnected ? (
              <button
                onClick={() => setWalletModalOpen(true)}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-base hover:opacity-90 transition-all shadow-xl hover:shadow-purple-500/30"
              >
                Connect Wallet & Explore
              </button>
            ) : (
              <Link
                href="/explore"
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-base hover:opacity-90 transition-all shadow-xl hover:shadow-purple-500/30"
              >
                Browse Creators
              </Link>
            )}
            <Link
              href="/become-creator"
              className="px-8 py-3.5 rounded-xl border border-white/10 text-white/80 font-semibold text-base hover:bg-white/5 transition-all"
            >
              Become a Creator →
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-4xl mx-auto mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
          {STATS.map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold gradient-text">{stat.value}</p>
              <p className="text-white/40 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────── */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">How OnlyHold Works</h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Two ways to support your favourite creators on-chain. Both with instant, trustless payments.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* NFT Card */}
            <div className="glass-card rounded-2xl p-6 border border-purple-500/10 hover:border-purple-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-2xl mb-4">
                🖼️
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Hold NFT Membership</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-4">
                Mint the creator's membership NFT for a one-time payment. Get <strong className="text-white/70">lifetime access</strong> to exclusive content. Your NFT is tradeable — sell your membership anytime.
              </p>
              <ul className="space-y-2 text-sm">
                {['One-time payment', 'Lifetime content access', 'Tradeable on NFT markets', 'Token-gated community access'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-white/60">
                    <span className="w-4 h-4 rounded-full bg-purple-500/30 text-purple-400 text-[10px] flex items-center justify-center flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-white/5">
                <span className="text-purple-400 font-mono text-sm">Starting from 0.03 ETH</span>
              </div>
            </div>

            {/* Stablecoin Card */}
            <div className="glass-card rounded-2xl p-6 border border-green-500/10 hover:border-green-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center text-2xl mb-4">
                💵
              </div>
              <h3 className="text-white font-bold text-xl mb-2">Deposit Stablecoin</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-4">
                Deposit USDC / USDT to subscribe monthly. Access is streamed automatically — <strong className="text-white/70">withdraw your balance</strong> anytime and cancel instantly with no friction.
              </p>
              <ul className="space-y-2 text-sm">
                {['Flexible monthly payments', 'Cancel & withdraw anytime', 'Automatic streaming payments', 'Multi-chain support'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-white/60">
                    <span className="w-4 h-4 rounded-full bg-green-500/30 text-green-400 text-[10px] flex items-center justify-center flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-white/5">
                <span className="text-green-400 font-mono text-sm">Starting from $8 USDC/month</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Featured Creators ────────────────────────────────── */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white">Featured Creators</h2>
              <p className="text-white/50 mt-1">Join the top creators building on-chain communities</p>
            </div>
            <Link href="/creators" className="text-purple-400 hover:text-purple-300 text-sm transition-colors">
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredCreators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Latest Content ───────────────────────────────────── */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white">Latest Content</h2>
              <p className="text-white/50 mt-1">Fresh drops from your favourite creators</p>
            </div>
            <Link href="/explore" className="text-purple-400 hover:text-purple-300 text-sm transition-colors">
              View all →
            </Link>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                  selectedCategory === cat.value
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                    : 'bg-white/3 border-white/5 text-white/50 hover:border-white/20'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredContent.map((content) => (
              <ContentCard key={content.id} content={content} isSubscribed={false} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ───────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-purple-900/40 via-pink-900/20 to-cyan-900/20 border border-white/10 p-10 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Ready to monetize your content?
              </h2>
              <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
                Launch your NFT membership or stablecoin subscription in minutes. Keep 95% of your earnings.
              </p>
              <Link
                href="/become-creator"
                className="inline-block px-10 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-base hover:opacity-90 transition-all shadow-xl hover:shadow-purple-500/40"
              >
                Start Creating for Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xs">
                OH
              </div>
              <span className="font-bold">Only<span className="gradient-text">Hold</span></span>
            </div>
            <div className="flex gap-8 text-sm text-white/40">
              <Link href="/about" className="hover:text-white/70 transition-colors">About</Link>
              <Link href="/creators" className="hover:text-white/70 transition-colors">Creators</Link>
              <Link href="/docs" className="hover:text-white/70 transition-colors">Docs</Link>
              <a href="https://twitter.com" target="_blank" rel="noopener" className="hover:text-white/70 transition-colors">Twitter</a>
              <a href="https://discord.gg" target="_blank" rel="noopener" className="hover:text-white/70 transition-colors">Discord</a>
            </div>
            <p className="text-white/20 text-xs">© 2025 OnlyHold. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {walletModalOpen && <WalletModal onClose={() => setWalletModalOpen(false)} />}
    </>
  );
}
