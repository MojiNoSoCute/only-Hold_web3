'use client';

import { useState, useEffect, useRef } from 'react';
import type { Content } from '@/lib/types';
import { timeAgo, formatNumber, CONTENT_TYPE_ICONS, compressImageFile } from '@/lib/utils';
import Link from 'next/link';
import SubscribeModal from './SubscribeModal';
import { useWeb3 } from '@/lib/Web3Provider';
import { useOnlyHold } from '@/lib/useOnlyHold';
import { getAdminCreators, pushSync } from '@/lib/adminData';

interface PostDetailModalProps {
  content: Content;
  isSubscribed?: boolean;
  onClose: () => void;
}

interface CommentItem {
  id: string;
  author: string;
  authorAvatar: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
}

export default function PostDetailModal({ content, isSubscribed = false, onClose }: PostDetailModalProps) {
  const { isConnected, address } = useWeb3();
  const { checkAccess } = useOnlyHold();

  const [liked, setLiked] = useState(content.isLiked || false);
  const [likeCount, setLikeCount] = useState(content.likes);
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [hasOnChainAccess, setHasOnChainAccess] = useState(false);

  // Check on-chain access
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

  // Local comments
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const canView = !content.isExclusive || isSubscribed || hasOnChainAccess;
  const storageKey = `onlyhold_comments_${content.id}`;

  // Load comments from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setComments(JSON.parse(saved));
      } else {
        // Sample default comments with real photo avatars and sample image
        const sample: CommentItem[] = [
          {
            id: 'c1',
            author: 'Web3Fan',
            authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
            text: 'สุดยอดผลงานมากครับ! รอติดตามผลงานต่อไปเลย 🔥',
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
          {
            id: 'c2',
            author: 'K-Crypto',
            authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop',
            text: 'ภาพสวย คมชัดมากครับ 👍',
            createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          },
        ];
        setComments(sample);
      }
    } catch {}
  }, [content.id, storageKey]);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  // Handle image attachment selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      // Compress image to fit nicely in localStorage & payload
      const compressed = await compressImageFile(file, 800, 800, 0.75);
      setCommentImage(compressed);
    } catch (err) {
      alert('ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && !commentImage) return;

    // Resolve real user avatar from creator list or profile data
    let userAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop';
    let userAuthor = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Anonymous';

    if (address) {
      const creators = getAdminCreators();
      const match = creators.find(
        (c) => c.address?.toLowerCase() === address.toLowerCase()
      );
      if (match) {
        if (match.avatar) userAvatar = match.avatar;
        if (match.name) userAuthor = match.name;
      }
    }

    const item: CommentItem = {
      id: `comment_${Date.now()}`,
      author: userAuthor,
      authorAvatar: userAvatar,
      text: newComment.trim(),
      imageUrl: commentImage || undefined,
      createdAt: new Date().toISOString(),
    };

    const updated = [item, ...comments];
    setComments(updated);
    setNewComment('');
    setCommentImage(null);

    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      pushSync('add_comment', { postId: content.id, comment: item });
    } catch {}
  };

  // Convert plain text URLs to clickable links
  const renderFormattedDescription = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, idx) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={idx}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline underline-offset-2 break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part} ↗
          </a>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          onClick={onClose}
        />

        {/* Modal Container */}
        <div className="relative z-10 w-full max-w-2xl bg-[#13131a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between bg-[#181824]">
            <div className="flex items-center gap-3">
              <Link href={`/creator/${content.creatorUsername}`} onClick={onClose}>
                <img
                  src={content.creatorAvatar}
                  alt={content.creatorName}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 hover:ring-2 hover:ring-purple-500 transition-all object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${content.creatorUsername}`;
                  }}
                />
              </Link>
              <div>
                <Link
                  href={`/creator/${content.creatorUsername}`}
                  onClick={onClose}
                  className="font-bold text-white text-sm hover:text-purple-300 transition-colors block"
                >
                  {content.creatorName}
                </Link>
                <p className="text-xs text-white/40">@{content.creatorUsername} · {timeAgo(content.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-base">{CONTENT_TYPE_ICONS[content.type]}</span>
              {content.isExclusive ? (
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1 font-medium">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a5 5 0 014.9 4H20a1 1 0 011 1v1a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1h3.1A5 5 0 0112 2zm0 2a3 3 0 00-2.83 2h5.66A3 3 0 0012 4zM4 11h16l-1 9H5l-1-9z" /></svg>
                   exclusive
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-medium">
                  🌐 สาธารณะ
                </span>
              )}

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1">
            
            {/* Title */}
            <h2 className="text-xl font-bold text-white leading-snug">{content.title}</h2>

            {/* Thumbnail / Media View */}
            {content.thumbnail && (
              <div className="relative rounded-xl overflow-hidden bg-black/50 border border-white/5 max-h-96 flex items-center justify-center">
                {!imageError ? (
                  <img
                    src={content.thumbnail}
                    alt={content.title}
                    onError={() => setImageError(true)}
                    className={`w-full max-h-96 object-contain transition-all duration-500 ${!canView ? 'blur-xl scale-105 opacity-30' : ''}`}
                  />
                ) : (
                  <div className="w-full h-64 bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-pink-900/30 flex flex-col items-center justify-center p-6 text-center">
                    <span className="text-4xl mb-2">🖼️</span>
                    <p className="text-white/70 text-sm font-medium">รูปภาพพรีวิวเนื้อหา</p>
                  </div>
                )}

                {/* Locked Content Overlay */}
                {!canView && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur flex items-center justify-center mb-3 border border-white/20 shadow-xl">
                      <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2a5 5 0 014.9 4H20a1 1 0 011 1v1a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1h3.1A5 5 0 0112 2zm0 2a3 3 0 00-2.83 2h5.66A3 3 0 0012 4zM4 11h16l-1 9H5l-1-9z" />
                      </svg>
                    </div>
                    <h4 className="text-white font-bold text-base mb-1">เนื้อหาเฉพาะสมาชิกเท่านั้น</h4>
                    <p className="text-white/60 text-xs max-w-sm mb-4">
                      {content.requiredTier === 'nft'
                        ? 'ต้องถือ NFT สมาชิกเพื่อเข้าถึงโพสต์นี้'
                        : content.requiredTier === 'stablecoin'
                        ? 'ต้องสมัครสมาชิก Stablecoin รายเดือนเพื่อเข้าถึงโพสต์นี้'
                        : 'ต้องเป็นสมาชิก NFT หรือ Stablecoin เพื่อเข้าถึงโพสต์นี้'}
                    </p>
                    <button
                      onClick={() => setSubscribeModalOpen(true)}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold hover:opacity-90 transition-all shadow-lg"
                    >
                      🚀 ปลดล็อกการเข้าถึง
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Description Text */}
            <div className={`text-white/80 text-sm leading-relaxed whitespace-pre-line bg-white/3 border border-white/5 rounded-xl p-4 ${!canView ? 'blur-sm select-none' : ''}`}>
              {renderFormattedDescription(content.description)}
            </div>

            {/* Tags */}
            {content.tags && content.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {content.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-purple-300 border border-white/5 font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between border-t border-b border-white/5 py-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors px-3 py-1.5 rounded-xl bg-white/3 border border-white/5 ${
                    liked ? 'text-pink-400 border-pink-500/30 bg-pink-500/10' : 'text-white/60 hover:text-pink-400'
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{formatNumber(likeCount)} ถูกใจ</span>
                </button>

                <span className="text-xs text-white/40">
                  💬 {comments.length} ความคิดเห็น
                </span>
              </div>

              {!canView && (
                <button
                  onClick={() => setSubscribeModalOpen(true)}
                  className="text-xs px-4 py-2 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-500 transition-all"
                >
                  สมัครสมาชิก
                </button>
              )}
            </div>

            {/* Comments Section */}
            <div className="space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <span>💬</span> ความคิดเห็น ({comments.length})
              </h3>

              {/* Add Comment Input Form */}
              <form onSubmit={handleAddComment} className="space-y-3">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={isConnected ? "เขียนความคิดเห็น..." : "เชื่อมต่อกระเป๋าเพื่อแสดงความคิดเห็น"}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-purple-500/50"
                  />

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {/* Attach Image Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors text-sm flex items-center justify-center"
                    title="แนบรูปภาพในความคิดเห็น"
                  >
                    🖼️
                  </button>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={(!newComment.trim() && !commentImage) || uploadingImage}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    {uploadingImage ? '...' : 'ส่ง'}
                  </button>
                </div>

                {/* Attached Image Preview */}
                {commentImage && (
                  <div className="relative inline-block border border-white/10 rounded-xl overflow-hidden bg-black/40 p-1">
                    <img src={commentImage} alt="Attached comment image" className="h-24 w-auto object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setCommentImage(null)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/80 text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </form>

              {/* Comment List */}
              <div className="space-y-3 pt-2">
                {comments.length === 0 ? (
                  <p className="text-white/30 text-xs text-center py-4">ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็น!</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex gap-3 bg-white/3 border border-white/5 rounded-xl p-3.5">
                      <img
                        src={c.authorAvatar}
                        alt={c.author}
                        className="w-9 h-9 rounded-full bg-purple-600 flex-shrink-0 object-cover border border-white/10 shadow-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-white text-xs">{c.author}</span>
                          <span className="text-[10px] text-white/30">{timeAgo(c.createdAt)}</span>
                        </div>
                        {c.text && <p className="text-white/80 text-xs leading-relaxed mb-2">{c.text}</p>}

                        {/* Attached Image inside Comment */}
                        {c.imageUrl && (
                          <div className="mt-2 rounded-xl overflow-hidden border border-white/10 max-w-sm bg-black/30">
                            <img
                              src={c.imageUrl}
                              alt="Comment attachment"
                              className="w-full h-auto max-h-60 object-cover hover:scale-[1.02] transition-transform duration-300"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {subscribeModalOpen && (
        <SubscribeModal
          creatorId={content.creatorId || content.creatorUsername}
          creatorName={content.creatorName}
          onClose={() => {
            setSubscribeModalOpen(false);
            const target = content.creatorId || content.creatorUsername;
            if (target) {
              checkAccess(target).then((res) => {
                if (res.hasAccess) setHasOnChainAccess(true);
              });
            }
          }}
        />
      )}
    </>
  );
}
