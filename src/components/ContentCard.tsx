'use client';

import { useState } from 'react';
import { Content } from '@/lib/types';
import { timeAgo, formatNumber, CONTENT_TYPE_ICONS } from '@/lib/utils';
import Link from 'next/link';
import SubscribeModal from './SubscribeModal';

interface ContentCardProps {
  content: Content;
  isSubscribed?: boolean;
}

export default function ContentCard({ content, isSubscribed = false }: ContentCardProps) {
  const [liked, setLiked] = useState(content.isLiked || false);
  const [likeCount, setLikeCount] = useState(content.likes);
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);

  const canView = !content.isExclusive || isSubscribed;

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <>
      <div className="bg-[#13131a] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all duration-300 group">
        {/* Creator Header */}
        <div className="flex items-center gap-3 p-4 pb-0">
          <Link href={`/creator/${content.creatorUsername}`}>
            <img
              src={content.creatorAvatar}
              alt={content.creatorName}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 hover:ring-2 hover:ring-purple-500 transition-all"
            />
          </Link>
          <div className="flex-1">
            <Link href={`/creator/${content.creatorUsername}`} className="font-medium text-sm text-white hover:text-purple-300 transition-colors">
              {content.creatorName}
            </Link>
            <p className="text-xs text-white/40">@{content.creatorUsername} · {timeAgo(content.createdAt)}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base">{CONTENT_TYPE_ICONS[content.type]}</span>
            {content.isExclusive && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a5 5 0 014.9 4H20a1 1 0 011 1v1a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1h3.1A5 5 0 0112 2zm0 2a3 3 0 00-2.83 2h5.66A3 3 0 0012 4zM4 11h16l-1 9H5l-1-9z" />
                </svg>
                Exclusive
              </span>
            )}
          </div>
        </div>

        {/* Thumbnail / Preview */}
        {content.thumbnail && (
          <div className="relative mt-3 mx-4 rounded-xl overflow-hidden bg-[#1a1a2e]">
            <img
              src={content.thumbnail}
              alt={content.title}
              className={`w-full h-48 object-cover transition-all duration-500 ${!canView ? 'blur-md scale-105' : 'group-hover:scale-105'}`}
            />

            {/* Lock Overlay */}
            {!canView && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center mb-2 border border-white/20">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2a5 5 0 014.9 4H20a1 1 0 011 1v1a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1h3.1A5 5 0 0112 2zm0 2a3 3 0 00-2.83 2h5.66A3 3 0 0012 4zM4 11h16l-1 9H5l-1-9z" />
                  </svg>
                </div>
                <p className="text-white/90 text-sm font-medium mb-1">Exclusive Content</p>
                <p className="text-white/50 text-xs">
                  {content.requiredTier === 'nft' ? 'Hold NFT' : 'Subscribe'} to unlock
                </p>
                <button
                  onClick={() => setSubscribeModalOpen(true)}
                  className="mt-3 px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  Unlock Access
                </button>
              </div>
            )}

            {/* Video play icon */}
            {content.type === 'video' && canView && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <svg className="w-5 h-5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="p-4">
          <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1">{content.title}</h3>
          <p className={`text-white/50 text-xs leading-relaxed ${!canView ? 'blur-sm select-none' : ''} line-clamp-2`}>
            {content.description}
          </p>

          {/* Tags */}
          {content.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {content.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 border border-white/5">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 pb-4 flex items-center justify-between border-t border-white/5 pt-3">
          <div className="flex items-center gap-4">
            {/* Like */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? 'text-pink-400' : 'text-white/40 hover:text-pink-400'}`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{formatNumber(likeCount)}</span>
            </button>

            {/* Comments */}
            <button className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{formatNumber(content.comments)}</span>
            </button>
          </div>

          {/* Subscribe CTA */}
          {!canView && (
            <button
              onClick={() => setSubscribeModalOpen(true)}
              className="text-xs px-3 py-1.5 rounded-lg border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 transition-colors"
            >
              Subscribe
            </button>
          )}
        </div>
      </div>

      {subscribeModalOpen && (
        <SubscribeModal
          creatorId={content.creatorId}
          creatorName={content.creatorName}
          onClose={() => setSubscribeModalOpen(false)}
        />
      )}
    </>
  );
}
