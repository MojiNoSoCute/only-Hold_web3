'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Creator } from '@/lib/types';
import { formatNumber, CATEGORY_COLORS } from '@/lib/utils';

interface CreatorCardProps {
  creator: Creator;
}

export default function CreatorCard({ creator }: CreatorCardProps) {
  const categoryClass = CATEGORY_COLORS[creator.category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';

  return (
    <Link href={`/creator/${creator.username}`} className="block group">
      <div className="nft-card bg-[#13131a] border border-white/5 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
        {/* Cover Image */}
        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-purple-900/40 to-pink-900/40">
          {creator.coverImage && (
            <img
              src={creator.coverImage}
              alt={creator.name}
              className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#13131a] via-transparent to-transparent" />

          {/* Verified Badge */}
          {creator.isVerified && (
            <div className="absolute top-3 right-3 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verified
            </div>
          )}
        </div>

        {/* Avatar + Info */}
        <div className="px-4 pb-4 -mt-8 relative">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full border-2 border-[#13131a] bg-gradient-to-br from-purple-600 to-pink-600 overflow-hidden mb-3 flex items-center justify-center">
            <img
              src={creator.avatar}
              alt={creator.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-white text-sm group-hover:text-purple-300 transition-colors">
                {creator.name}
              </h3>
              <p className="text-white/40 text-xs">@{creator.username}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${categoryClass}`}>
              {creator.category}
            </span>
          </div>

          <p className="text-white/50 text-xs line-clamp-2 mb-3 leading-relaxed">
            {creator.bio}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-white/40 mb-3">
            <div className="flex items-center gap-1">
              <span>👥</span>
              <span>{formatNumber(creator.totalSubscribers)} fans</span>
            </div>
            <div className="flex items-center gap-1">
              <span>📄</span>
              <span>{creator.contentCount} posts</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="flex gap-2">
            {creator.nftPrice && (
              <div className="flex-1 bg-purple-500/10 border border-purple-500/20 rounded-lg px-2 py-1.5 text-center">
                <p className="text-purple-400 font-bold text-xs">{creator.nftPrice} ETH</p>
                <p className="text-white/30 text-[10px]">NFT Hold</p>
              </div>
            )}
            {creator.stablecoinPrice && (
              <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-lg px-2 py-1.5 text-center">
                <p className="text-green-400 font-bold text-xs">${creator.stablecoinPrice}/mo</p>
                <p className="text-white/30 text-[10px]">Stablecoin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
