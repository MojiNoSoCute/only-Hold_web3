'use client';

import { useState, useEffect } from 'react';
import { Content } from '@/lib/types';
import { timeAgo, formatNumber, CONTENT_TYPE_ICONS } from '@/lib/utils';
import Link from 'next/link';
import SubscribeModal from './SubscribeModal';
import PostDetailModal from './PostDetailModal';
import { useWeb3 } from '@/lib/Web3Provider';
import { useOnlyHold } from '@/lib/useOnlyHold';

interface ContentCardProps {
  content: Content;
  isSubscribed?: boolean;
}

export default function ContentCard({ content, isSubscribed = false }: ContentCardProps) {
  const { isConnected, address } = useWeb3();
  const { checkAccess } = useOnlyHold();

  const [liked, setLiked] = useState(content.isLiked || false);
  const [likeCount, setLikeCount] = useState(content.likes);
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [hasOnChainAccess, setHasOnChainAccess] = useState(false);

  useEffect(() => {
    if (isSubscribed) {
      setHasOnChainAccess(true);
      return;
    }
    if (!isConnected || !address || !content.isExclusive) return;

    const target = content.creatorId || content.creatorUsername;
    if (!target) return;

    checkAccess(target).then((res) => {
      if (res.hasAccess) setHasOnChainAccess(true);
    });
  }, [content, isSubscribed, isConnected, address, checkAccess]);

  const canView = !content.isExclusive || isSubscribed || hasOnChainAccess;

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <>
      <div className="bg-[#13131a] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all duration-300 group flex flex-col justify-between">
        <div>
          {/* Creator Header */}
          <div className="flex items-center gap-3 p-4 pb-0">
            <Link href={`/creator/${content.creatorUsername}`}>
              <img
                src={content.creatorAvatar}
                alt={content.creatorName}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 hover:ring-2 hover:ring-purple-500 transition-all object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${content.creatorUsername}`;
                }}
              />
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/creator/${content.creatorUsername}`} className="font-medium text-sm text-white hover:text-purple-300 transition-colors block truncate">
                {content.creatorName}
              </Link>
              <p className="text-xs text-white/40 truncate">@{content.creatorUsername} · {timeAgo(content.createdAt)}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-base">{CONTENT_TYPE_ICONS[content.type]}</span>
              {content.isExclusive && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a5 5 0 014.9 4H20a1 1 0 011 1v1a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1h3.1A5 5 0 0112 2zm0 2a3 3 0 00-2.83 2h5.66A3 3 0 0012 4zM4 11h16l-1 9H5l-1-9z" /></svg>
                  พิเศษ
                </span>
              )}
            </div>
          </div>

          {/* Thumbnail / Preview (Clickable to open modal) */}
          {content.thumbnail && (
            <div
              onClick={() => setDetailModalOpen(true)}
              className="relative mt-3 mx-4 rounded-xl overflow-hidden bg-[#1a1a2e] cursor-pointer group/thumb"
            >
              {!imageError ? (
                <img
                  src={content.thumbnail}
                  alt={content.title}
                  onError={() => setImageError(true)}
                  className={`w-full h-48 object-cover transition-all duration-500 ${!canView ? 'blur-md scale-105 opacity-40' : 'group-hover/thumb:scale-105'}`}
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-pink-900/30 flex flex-col items-center justify-center p-4 text-center">
                  <span className="text-3xl mb-2">🖼️</span>
                  <p className="text-white/60 text-xs font-medium">รูปภาพพรีวิวเนื้อหา (กดเพื่ออ่านเพิ่มเติม)</p>
                </div>
              )}

              {/* Lock Overlay */}
              {!canView && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setSubscribeModalOpen(true);
                  }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs p-4 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center mb-2 border border-white/20 shadow-lg">
                    <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2a5 5 0 014.9 4H20a1 1 0 011 1v1a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1h3.1A5 5 0 0112 2zm0 2a3 3 0 00-2.83 2h5.66A3 3 0 0012 4zM4 11h16l-1 9H5l-1-9z" />
                    </svg>
                  </div>
                  <p className="text-white text-sm font-bold mb-1">คอนเทนต์พิเศษ</p>
                  <button className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[11px] font-semibold shadow-md hover:opacity-90">
                    ปลดล็อกการเข้าถึง →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Title & Description */}
          <div className="p-4 cursor-pointer" onClick={() => setDetailModalOpen(true)}>
            <h3 className="font-bold text-white text-sm group-hover:text-purple-300 transition-colors line-clamp-1 mb-1">
              {content.title}
            </h3>
            <p className={`text-white/60 text-xs line-clamp-2 leading-relaxed ${!canView ? 'blur-xs select-none' : ''}`}>
              {content.description}
            </p>
          </div>
        </div>

        {/* Footer / Actions */}
        <div className="px-4 pb-4 pt-2 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                liked ? 'text-pink-400 font-medium' : 'text-white/40 hover:text-pink-400'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{formatNumber(likeCount)}</span>
            </button>

            <button onClick={() => setDetailModalOpen(true)} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors">
              <span>💬</span>
              <span>{content.comments}</span>
            </button>
          </div>

          <button
            onClick={() => setDetailModalOpen(true)}
            className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            {canView ? 'อ่านเพิ่มเติม →' : 'ดูรายละเอียด 🔒'}
          </button>
        </div>
      </div>

      {subscribeModalOpen && (
        <SubscribeModal
          creatorId={content.creatorId || content.creatorUsername}
          creatorName={content.creatorName}
          onClose={() => setSubscribeModalOpen(false)}
        />
      )}

      {detailModalOpen && (
        <PostDetailModal
          content={content}
          isSubscribed={canView}
          onClose={() => setDetailModalOpen(false)}
        />
      )}
    </>
  );
}
