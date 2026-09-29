'use client';

import { useState } from 'react';
import { MOCK_CREATORS, CATEGORIES } from '@/lib/mockData';
import CreatorCard from '@/components/CreatorCard';

export default function CreatorsPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'subscribers' | 'earnings' | 'newest'>('subscribers');

  const filtered = MOCK_CREATORS.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase()) ||
      c.bio.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === 'all' || c.category === selectedCategory;
    return matchSearch && matchCategory;
  }).sort((a, b) => {
    if (sortBy === 'subscribers') return b.totalSubscribers - a.totalSubscribers;
    if (sortBy === 'earnings') return parseFloat(b.totalEarnings.replace(/,/g, '')) - parseFloat(a.totalEarnings.replace(/,/g, ''));
    return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Discover Creators</h1>
        <p className="text-white/50">Find your next favourite creator and unlock exclusive content</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search creators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm focus:outline-none focus:border-purple-500/50 transition-colors cursor-pointer"
        >
          <option value="subscribers">Most Followers</option>
          <option value="earnings">Top Earners</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
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

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-white/50">No creators found matching your search.</p>
        </div>
      ) : (
        <>
          <p className="text-white/30 text-sm mb-4">{filtered.length} creators found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
