'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { MOCK_CREATORS, MOCK_CONTENT } from '@/lib/mockData';
import { useState } from 'react';
import { formatNumber, shortenAddress, CATEGORY_COLORS } from '@/lib/utils';
import ContentCard from '@/components/ContentCard';
import SubscribeModal from '@/components/SubscribeModal';
import { useWeb3 } from '@/lib/Web3Provider';

interface CreatorPageProps {
  params: Promise<{ username: string }>;
}

export default function CreatorPage({ params }: CreatorPageProps) {
  const { username } = use(params);
  const { isConnected } = useWeb3();
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');
  const [copied, setCopied] = useState(false);

  const creator = MOCK_CREATORS.find((c) => c.username === username);
  if (!creator) notFound();

  const creatorContent = MOCK_CONTENT.filter((c) => c.creatorId === creator.id);
  const categoryClass = CATEGORY_COLORS[creator.category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(creator.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 pb-16">
        {/* Cover */}
        <div className="relative h-48 sm:h-64 rounded-b-3xl overflow-hidden bg-gradient-to-br from-purple-900/40 to-pink-900/40 -mx-4 sm:mx-0 sm:mt-4 sm:rounded-2xl">
          {creator.coverImage && (
            <img src={creator.coverImage} alt="" className="w-full h-full object-cover opacity-60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/30 to-transparent" />
        </div>

        {/* Profile Header */}
        <div className="relative -mt-16 px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl border-4 border-[#0a0a0f] bg-gradient-to-br from-purple-600 to-pink-600 overflow-hidden flex-shrink-0">
              <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" />
            </div>

            {/* Info */}
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white">{creator.name}</h1>
                {creator.isVerified && (
                  <span className="bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verified
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${categoryClass}`}>
                  {creator.category}
                </span>
              </div>
              <p className="text-white/40 text-sm mb-2">@{creator.username}</p>

              {/* Wallet address */}
              <button
                onClick={handleCopyAddress}
                className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors font-mono"
              >
                {creator.address.slice(0, 10)}...{creator.address.slice(-6)}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                {copied && <span className="text-green-400">Copied!</span>}
              </button>
            </div>

            {/* Subscribe Button */}
            <div className="flex gap-2">
              <button
                onClick={() => setSubscribeModalOpen(true)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg hover:shadow-purple-500/30"
              >
                Subscribe
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-[#13131a] border border-white/5 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">{formatNumber(creator.totalSubscribers)}</p>
              <p className="text-white/40 text-xs">Fans</p>
            </div>
            <div className="bg-[#13131a] border border-white/5 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">{creator.contentCount}</p>
              <p className="text-white/40 text-xs">Posts</p>
            </div>
            <div className="bg-[#13131a] border border-white/5 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">${creator.totalEarnings}</p>
              <p className="text-white/40 text-xs">Earned</p>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            {creator.nftPrice && (
              <button
                onClick={() => setSubscribeModalOpen(true)}
                className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl text-left hover:border-purple-500/40 transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-400 font-bold text-sm">🖼️ NFT Membership</span>
                  <svg className="w-4 h-4 text-purple-400/40 group-hover:text-purple-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-white font-bold text-xl">{creator.nftPrice} ETH</p>
                <p className="text-white/40 text-xs mt-1">One-time • Lifetime access • Tradeable</p>
              </button>
            )}
            {creator.stablecoinPrice && (
              <button
                onClick={() => setSubscribeModalOpen(true)}
                className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-left hover:border-green-500/40 transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-400 font-bold text-sm">💵 Stablecoin Sub</span>
                  <svg className="w-4 h-4 text-green-400/40 group-hover:text-green-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-white font-bold text-xl">${creator.stablecoinPrice} USDC</p>
                <p className="text-white/40 text-xs mt-1">Per month • Cancel anytime • Withdraw balance</p>
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 bg-white/3 border border-white/5 rounded-xl p-1 w-fit">
            {(['posts', 'about'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'posts' ? (
              creatorContent.length === 0 ? (
                <div className="text-center py-16 text-white/30">
                  <div className="text-4xl mb-3">📭</div>
                  <p>No posts yet.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-5">
                  {creatorContent.map((content) => (
                    <ContentCard key={content.id} content={content} />
                  ))}
                </div>
              )
            ) : (
              /* About Tab */
              <div className="space-y-6">
                <div className="bg-[#13131a] border border-white/5 rounded-xl p-5">
                  <h3 className="font-bold text-white text-sm mb-3">About</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{creator.bio}</p>
                </div>

                {creator.socialLinks && Object.keys(creator.socialLinks).length > 0 && (
                  <div className="bg-[#13131a] border border-white/5 rounded-xl p-5">
                    <h3 className="font-bold text-white text-sm mb-3">Links</h3>
                    <div className="space-y-2">
                      {creator.socialLinks.twitter && (
                        <a href={`https://twitter.com/${creator.socialLinks.twitter}`} target="_blank" rel="noopener" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                          <span>🐦</span> @{creator.socialLinks.twitter}
                        </a>
                      )}
                      {creator.socialLinks.instagram && (
                        <a href={`https://instagram.com/${creator.socialLinks.instagram}`} target="_blank" rel="noopener" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                          <span>📸</span> @{creator.socialLinks.instagram}
                        </a>
                      )}
                      {creator.socialLinks.website && (
                        <a href={`https://${creator.socialLinks.website}`} target="_blank" rel="noopener" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                          <span>🌐</span> {creator.socialLinks.website}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {creator.nftContractAddress && (
                  <div className="bg-[#13131a] border border-white/5 rounded-xl p-5">
                    <h3 className="font-bold text-white text-sm mb-3">NFT Contract</h3>
                    <p className="text-white/40 text-xs font-mono break-all">{creator.nftContractAddress}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {subscribeModalOpen && (
        <SubscribeModal
          creatorId={creator.id}
          creatorName={creator.name}
          onClose={() => setSubscribeModalOpen(false)}
        />
      )}
    </>
  );
}
