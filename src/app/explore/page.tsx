'use client';

import { useState } from 'react';
import { MOCK_CONTENT, MOCK_CREATORS, CATEGORIES } from '@/lib/mockData';
import ContentCard from '@/components/ContentCard';
import CreatorCard from '@/components/CreatorCard';

export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [contentType, setContentType] = useState<'all' | 'free' | 'exclusive'>('all');
  const [mediaType, setMediaType] = useState<'all' | 'video' | 'image' | 'audio' | 'text'>('all');

  const filteredContent = MOCK_CONTENT.filter((c) => {
    const creator = MOCK_CREATORS.find((cr) => cr.id === c.creatorId);
    const matchCategory = selectedCategory === 'all' || creator?.category === selectedCategory;
    const matchExclusive = contentType === 'all' || (contentType === 'exclusive' ? c.isExclusive : !c.isExclusive);
    const matchMedia = mediaType === 'all' || c.type === mediaType;
    return matchCategory && matchExclusive && matchMedia;
  });

  const trendingCreators = MOCK_CREATORS.sort((a, b) => b.totalSubscribers - a.totalSubscribers).slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">สำรวจ</h1>
        <p className="text-white/50">ค้นพบคอนเทนต์พิเศษจากครีเอเตอร์ Web3 ชั้นนำ</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Filters */}
          <div className="space-y-4 mb-6">
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-1">
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
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            {/* Sub-filters */}
            <div className="flex flex-wrap gap-2">
              <div className="flex bg-white/3 border border-white/5 rounded-lg overflow-hidden">
                {(['all', 'free', 'exclusive'] as const).map((type) => (
                  <button key={type} onClick={() => setContentType(type)} className={`px-3 py-1.5 text-xs capitalize transition-colors ${contentType === type ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
                    {type === 'all' ? 'ทั้งหมด' : type === 'free' ? 'ฟรี' : 'พิเศษ'}
                  </button>
                ))}
              </div>

              <div className="flex bg-white/3 border border-white/5 rounded-lg overflow-hidden">
                {(['all', 'video', 'image', 'audio', 'text'] as const).map((type) => (
                  <button key={type} onClick={() => setMediaType(type)} className={`px-3 py-1.5 text-xs capitalize transition-colors ${mediaType === type ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
                    {type === 'all' ? 'ทั้งหมด' : type === 'video' ? 'วิดีโอ' : type === 'image' ? 'รูปภาพ' : type === 'audio' ? 'เสียง' : 'ข้อความ'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredContent.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🎨</div>
              <p className="text-white/50">ไม่พบคอนเทนต์ ลองเปลี่ยนตัวกรองดู</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {filteredContent.map((content) => (
                <ContentCard key={content.id} content={content} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trending Creators */}
          <div className="bg-[#13131a] border border-white/5 rounded-2xl p-4">
            <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
              🔥 ครีเอเตอร์มาแรง
            </h3>
            <div className="space-y-3">
              {trendingCreators.map((creator, i) => (
                <a key={creator.id} href={`/creator/${creator.username}`} className="flex items-center gap-3 group">
                  <span className="text-white/20 font-bold text-sm w-4">{i + 1}</span>
                  <img src={creator.avatar} alt={creator.name} className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white group-hover:text-purple-300 transition-colors truncate font-medium">{creator.name}</p>
                    <p className="text-xs text-white/30">{creator.totalSubscribers.toLocaleString()} แฟนคลับ</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Chain Support */}
          <div className="bg-[#13131a] border border-white/5 rounded-2xl p-4">
            <h3 className="font-bold text-white text-sm mb-4">⛓️ Chain ที่รองรับ</h3>
            <div className="space-y-2">
              {[
                { name: 'Ethereum', symbol: 'ETH', color: 'bg-blue-500' },
                { name: 'Polygon', symbol: 'MATIC', color: 'bg-purple-500' },
                { name: 'Arbitrum', symbol: 'ARB', color: 'bg-blue-400' },
                { name: 'Base', symbol: 'BASE', color: 'bg-blue-600' },
              ].map((chain) => (
                <div key={chain.name} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${chain.color}`} />
                  <span className="text-sm text-white/60 flex-1">{chain.name}</span>
                  <span className="text-xs text-white/30 font-mono">{chain.symbol}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stablecoin Support */}
          <div className="bg-[#13131a] border border-white/5 rounded-2xl p-4">
            <h3 className="font-bold text-white text-sm mb-4">💵 Stablecoin ที่รับ</h3>
            <div className="flex flex-wrap gap-2">
              {['USDC', 'USDT', 'DAI', 'LUSD'].map((coin) => (
                <span key={coin} className="px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-mono">
                  {coin}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
