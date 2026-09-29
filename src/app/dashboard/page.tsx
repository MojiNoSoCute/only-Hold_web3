'use client';

import { useWeb3 } from '@/lib/Web3Provider';
import { useOnlyHold } from '@/lib/useOnlyHold';
import { useChainData } from '@/lib/useChainData';
import {
  getAdminCreators,
  updateAdminCreator,
  addAdminCreator,
  addAdminContent,
  deleteAdminContent,
} from '@/lib/adminData';
import ContentCard from '@/components/ContentCard';
import Link from 'next/link';
import WalletModal from '@/components/WalletModal';
import { useState, useEffect } from 'react';
import type { Content, Creator } from '@/lib/types';

interface CreatorProfile {
  nftContract: string;
  subscriptionContract: string;
  username: string;
  isActive: boolean;
}

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop',
];

export default function DashboardPage() {
  const { isConnected, address, isWrongNetwork, switchToSepolia } = useWeb3();
  const { FACTORY_ADDRESS, USDC_ADDRESS } = useOnlyHold();
  const { creators, content, refetch } = useChainData();

  const [walletModalOpen, setWalletModalOpen] = useState(false);

  // On-chain state
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [pendingEarnings, setPendingEarnings] = useState(0n);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawTxHash, setWithdrawTxHash] = useState('');
  const [error, setError] = useState('');

  // Tabs / Active subview
  const [activeTab, setActiveTab] = useState<'overview' | 'new-post' | 'edit-profile'>('overview');

  // Edit Profile Form
  const [profileForm, setProfileForm] = useState({
    name: '',
    avatar: '',
    coverImage: '',
    bio: '',
  });
  const [profileSavedMsg, setProfileSavedMsg] = useState('');

  // Create Post Form
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    type: 'text' as 'text' | 'image' | 'video' | 'audio',
    thumbnail: '',
    isExclusive: true,
    requiredTier: 'nft' as 'nft' | 'stablecoin',
    tags: '',
  });
  const [postSuccessMsg, setPostSuccessMsg] = useState('');

  // ── Load creator profile + pending earnings ─────────────────────────────
  useEffect(() => {
    if (!isConnected || !address || !FACTORY_ADDRESS) return;
    setLoadingProfile(true);

    const { ethers } = require('ethers');
    const provider = new ethers.BrowserProvider((window as any).ethereum);

    const factory = new ethers.Contract(
      FACTORY_ADDRESS,
      [
        'function isRegistered(address) view returns (bool)',
        'function creatorProfiles(address) view returns (address creatorAddress, address nftContract, address subscriptionContract, string username, string metadataURI, uint256 registeredAt, bool isActive)',
      ],
      provider
    );

    factory.isRegistered(address).then(async (registered: boolean) => {
      if (!registered) { setProfile(null); setLoadingProfile(false); return; }

      const p = await factory.creatorProfiles(address);
      setProfile({
        nftContract: p.nftContract,
        subscriptionContract: p.subscriptionContract,
        username: p.username,
        isActive: p.isActive,
      });

      // Find current creator profile in chain/local data to fill edit form
      const existing = creators.find(
        (c) => c.username.toLowerCase() === p.username.toLowerCase() || c.address.toLowerCase() === address.toLowerCase()
      );
      if (existing) {
        setProfileForm({
          name: existing.name || p.username,
          avatar: existing.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`,
          coverImage: existing.coverImage || PRESET_COVERS[0],
          bio: existing.bio || `ครีเอเตอร์บน OnlyHold Sepolia Testnet`,
        });
      } else {
        setProfileForm({
          name: p.username,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`,
          coverImage: PRESET_COVERS[0],
          bio: `ครีเอเตอร์บน OnlyHold Sepolia Testnet`,
        });
      }

      // Fetch pending earnings from subscription contract
      if (p.subscriptionContract && p.subscriptionContract !== ethers.ZeroAddress) {
        const sub = new ethers.Contract(
          p.subscriptionContract,
          ['function pendingCreatorEarnings() view returns (uint256)'],
          provider
        );
        sub.pendingCreatorEarnings().then(setPendingEarnings).catch(console.error);
      }
    }).catch(console.error).finally(() => setLoadingProfile(false));
  }, [isConnected, address, FACTORY_ADDRESS, creators]);

  // ── Withdraw earnings ────────────────────────────────────────────────────
  const handleWithdraw = async () => {
    if (!profile?.subscriptionContract || pendingEarnings === 0n) return;
    if (isWrongNetwork) { await switchToSepolia(); return; }
    setWithdrawing(true);
    setError('');
    try {
      const { ethers } = require('ethers');
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const sub = new ethers.Contract(
        profile.subscriptionContract,
        ['function withdrawEarnings()'],
        signer
      );
      const tx = await sub.withdrawEarnings();
      const receipt = await tx.wait();
      setWithdrawTxHash(receipt.hash);
      setPendingEarnings(0n);
    } catch (err: any) {
      setError(err.reason ?? err.message ?? 'เกิดข้อผิดพลาด');
    } finally {
      setWithdrawing(false);
    }
  };

  // ── Handle Profile Edit Save ──────────────────────────────────────────────
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !address) return;

    const currentList = getAdminCreators();
    const existingIndex = currentList.findIndex(
      (c) => c.username.toLowerCase() === profile.username.toLowerCase() || c.address.toLowerCase() === address.toLowerCase()
    );

    const updatedCreatorObj: Creator = {
      id: address.toLowerCase(),
      address: address,
      name: profileForm.name || profile.username,
      username: profile.username,
      avatar: profileForm.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`,
      coverImage: profileForm.coverImage || PRESET_COVERS[0],
      bio: profileForm.bio,
      category: 'art',
      totalSubscribers: 0,
      totalEarnings: '0',
      isVerified: true,
      nftContractAddress: profile.nftContract,
      contentCount: 0,
      joinedAt: new Date().toISOString().split('T')[0],
    };

    if (existingIndex >= 0) {
      updateAdminCreator({
        ...currentList[existingIndex],
        ...updatedCreatorObj,
      });
    } else {
      addAdminCreator(updatedCreatorObj);
    }

    setProfileSavedMsg('บันทึกรูปโปรไฟล์และภาพหน้าปกเรียบร้อยแล้ว!');
    refetch();
    setTimeout(() => setProfileSavedMsg(''), 4000);
  };

  // ── Handle Create Post ───────────────────────────────────────────────────
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !address) return;

    const newPost: Content = {
      id: `post_${Date.now()}`,
      creatorId: address.toLowerCase(),
      creatorName: profileForm.name || profile.username,
      creatorAvatar: profileForm.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`,
      creatorUsername: profile.username,
      title: postForm.title,
      description: postForm.description,
      type: postForm.type,
      thumbnail: postForm.thumbnail || undefined,
      isExclusive: postForm.isExclusive,
      requiredTier: postForm.isExclusive ? postForm.requiredTier : undefined,
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString().split('T')[0],
      tags: postForm.tags ? postForm.tags.split(',').map((t) => t.trim()) : [],
    };

    addAdminContent(newPost);
    setPostSuccessMsg('เผยแพร่โพสต์ใหม่สำเร็จเรียบร้อย!');
    setPostForm({
      title: '',
      description: '',
      type: 'text',
      thumbnail: '',
      isExclusive: true,
      requiredTier: 'nft',
      tags: '',
    });
    refetch();
    setTimeout(() => {
      setPostSuccessMsg('');
      setActiveTab('overview');
    }, 2000);
  };

  // ── Format USDC amount (6 decimals) ─────────────────────────────────────
  const formatUSDC = (raw: bigint) => (Number(raw) / 1_000_000).toFixed(2);

  // ── Creator posts ────────────────────────────────────────────────────────
  const myPosts = profile
    ? content.filter(
        (c) =>
          c.creatorUsername?.toLowerCase() === profile.username.toLowerCase() ||
          c.creatorId?.toLowerCase() === address?.toLowerCase()
      )
    : [];

  // ── Not connected ────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-6">📊</div>
        <h1 className="text-2xl font-bold text-white mb-3">แดชบอร์ดครีเอเตอร์</h1>
        <p className="text-white/50 mb-8">เชื่อมต่อกระเป๋าเพื่อเข้าถึงแดชบอร์ดครีเอเตอร์</p>
        <button
          onClick={() => setWalletModalOpen(true)}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition-all"
        >
          เชื่อมต่อกระเป๋า
        </button>
        {walletModalOpen && <WalletModal onClose={() => setWalletModalOpen(false)} />}
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-4xl mb-4 animate-pulse">⛓️</div>
        <p className="text-white/50">กำลังโหลดข้อมูลจาก Sepolia...</p>
      </div>
    );
  }

  // ── Not a creator yet ────────────────────────────────────────────────────
  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-6">🚀</div>
        <h1 className="text-2xl font-bold text-white mb-3">คุณยังไม่ได้เป็นครีเอเตอร์</h1>
        <p className="text-white/50 mb-8">
          สมัครเป็นครีเอเตอร์เพื่อ Deploy สัญญา NFT และ Subscription ของคุณบน Sepolia
        </p>
        <Link
          href="/become-creator"
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition-all"
        >
          🚀 เป็นครีเอเตอร์
        </Link>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">แดชบอร์ดครีเอเตอร์</h1>
          <p className="text-white/40 text-sm mt-1">@{profile.username} · Sepolia Testnet</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('new-post')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium text-sm hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
          >
            <span>✍️</span> สร้างโพสต์ใหม่
          </button>
          <button
            onClick={() => setActiveTab('edit-profile')}
            className="px-4 py-2 rounded-xl border border-white/10 text-white/80 text-sm hover:bg-white/5 transition-all flex items-center gap-2"
          >
            <span>🎨</span> แต่งโปรไฟล์
          </button>
          <Link
            href={`/creator/${profile.username}`}
            className="px-4 py-2 rounded-xl border border-white/10 text-white/70 text-sm hover:bg-white/5 transition-all"
          >
            ดูโปรไฟล์ →
          </Link>
        </div>
      </div>

      {/* Tabs bar */}
      <div className="flex border-b border-white/5 mb-8 gap-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'overview' ? 'border-purple-500 text-purple-400' : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          📊 ภาพรวม &amp; โพสต์ทั้งหมด ({myPosts.length})
        </button>
        <button
          onClick={() => setActiveTab('new-post')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'new-post' ? 'border-purple-500 text-purple-400' : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          ✍️ สร้างโพสต์ใหม่
        </button>
        <button
          onClick={() => setActiveTab('edit-profile')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'edit-profile' ? 'border-purple-500 text-purple-400' : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          🎨 ปรับแต่งรูปภาพ &amp; หน้าปก
        </button>
      </div>

      {/* Wrong network warning */}
      {isWrongNetwork && (
        <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-between">
          <span className="text-yellow-400 text-sm">⚠️ สลับไป Sepolia เพื่อ Withdraw</span>
          <button onClick={switchToSepolia} className="px-4 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-sm hover:bg-yellow-500/30 transition-colors">สลับเลย</button>
        </div>
      )}

      {/* ── TAB 1: OVERVIEW ────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Earnings Card */}
            <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5">
              <h3 className="font-bold text-white mb-4">💰 รายได้ที่รอถอน</h3>

              <div className="mb-4">
                <p className="text-white/40 text-xs mb-1">Pending Earnings (USDC)</p>
                <p className="text-green-400 font-bold text-3xl font-mono">
                  ${formatUSDC(pendingEarnings)}
                </p>
                <p className="text-white/30 text-xs mt-1">จาก Stablecoin Subscriptions</p>
              </div>

              {error && (
                <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  ❌ {error}
                </div>
              )}

              {withdrawTxHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${withdrawTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mb-3 text-xs text-green-400 hover:underline truncate"
                >
                  ✅ ถอนสำเร็จ: {withdrawTxHash.slice(0, 16)}... →
                </a>
              )}

              <button
                onClick={handleWithdraw}
                disabled={withdrawing || pendingEarnings === 0n || isWrongNetwork}
                className="w-full py-2.5 rounded-xl bg-green-600/80 hover:bg-green-600 text-white text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {withdrawing ? (
                  <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" /></svg>กำลังถอน...</>
                ) : pendingEarnings === 0n ? 'ไม่มียอดที่รอถอน' : 'ถอนรายได้ →'}
              </button>
            </div>

            {/* Contracts Card */}
            <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5">
              <h3 className="font-bold text-white mb-4">📋 สัญญาของคุณ (Sepolia)</h3>
              <div className="space-y-4 text-xs">
                {profile.nftContract && profile.nftContract !== '0x0000000000000000000000000000000000000000' && (
                  <div>
                    <p className="text-purple-400 font-medium mb-1">🖼️ NFT Contract</p>
                    <a
                      href={`https://sepolia.etherscan.io/address/${profile.nftContract}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-white/50 hover:text-purple-400 break-all transition-colors"
                    >
                      {profile.nftContract}
                    </a>
                  </div>
                )}
                {profile.subscriptionContract && profile.subscriptionContract !== '0x0000000000000000000000000000000000000000' && (
                  <div>
                    <p className="text-green-400 font-medium mb-1">💵 Subscription Contract</p>
                    <a
                      href={`https://sepolia.etherscan.io/address/${profile.subscriptionContract}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-white/50 hover:text-green-400 break-all transition-colors"
                    >
                      {profile.subscriptionContract}
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-white/40 font-medium mb-1">🏭 Factory</p>
                  <a
                    href={`https://sepolia.etherscan.io/address/${FACTORY_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-white/30 hover:text-white/60 break-all transition-colors"
                  >
                    {FACTORY_ADDRESS}
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5">
                <h3 className="font-bold text-white mb-4">⚡ Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('new-post')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600/20 transition-colors text-left group"
                  >
                    <span className="text-base">✍️</span>
                    <span className="text-sm text-purple-300 font-medium">สร้างโพสต์ใหม่</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('edit-profile')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors text-left group"
                  >
                    <span className="text-base">🎨</span>
                    <span className="text-sm text-white/80 font-medium">เปลี่ยนรูปภาพ &amp; หน้าปก</span>
                  </button>
                  <Link
                    href={`/creator/${profile.username}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <span className="text-base">👤</span>
                    <span className="text-sm text-white/70 group-hover:text-white transition-colors">ดูหน้าโปรไฟล์ของฉัน</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Published Posts Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">โพสต์ที่คุณเผยแพร่แล้ว ({myPosts.length})</h2>
              <button
                onClick={() => setActiveTab('new-post')}
                className="text-xs px-3 py-1.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 transition-colors"
              >
                + โพสต์ใหม่
              </button>
            </div>

            {myPosts.length === 0 ? (
              <div className="bg-[#13131a] border border-white/5 rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">📝</div>
                <h3 className="text-white font-bold text-base mb-1">ยังไม่มีโพสต์</h3>
                <p className="text-white/40 text-xs mb-4">เริ่มสร้างโพสต์พิเศษให้สมาชิก OnlyHold ดูได้เลย!</p>
                <button
                  onClick={() => setActiveTab('new-post')}
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-medium text-xs hover:bg-purple-500 transition-colors"
                >
                  สร้างโพสต์แรก →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {myPosts.map((post) => (
                  <div key={post.id} className="relative group">
                    <ContentCard content={post} isSubscribed={true} />
                    <button
                      onClick={() => {
                        if (confirm(`คุณต้องการลบโพสต์ "${post.title}" หรือไม่?`)) {
                          deleteAdminContent(post.id);
                          refetch();
                        }
                      }}
                      className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      ลบโพสต์
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: CREATE NEW POST ─────────────────────────────────────── */}
      {activeTab === 'new-post' && (
        <div className="max-w-2xl mx-auto bg-[#13131a] border border-white/5 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white mb-2">สร้างโพสต์ใหม่</h2>
          <p className="text-white/40 text-sm mb-6">เผยแพร่เนื้อหาพิเศษให้แฟนคลับและผู้ถือ NFT บน OnlyHold</p>

          {postSuccessMsg && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
              <span>🎉</span> {postSuccessMsg}
            </div>
          )}

          <form onSubmit={handleCreatePost} className="space-y-5">
            <div>
              <label className="text-white/70 text-sm font-medium block mb-1.5">หัวข้อโพสต์ *</label>
              <input
                type="text"
                required
                value={postForm.title}
                onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                placeholder="เช่น ผลงานใหม่พิเศษสัปดาห์นี้ / Studio Update #1"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <div>
              <label className="text-white/70 text-sm font-medium block mb-1.5">รายละเอียด / เนื้อหา *</label>
              <textarea
                required
                rows={4}
                value={postForm.description}
                onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                placeholder="เขียนรายละเอียดเนื้อหาของคุณที่นี่..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-500/50 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/70 text-sm font-medium block mb-1.5">ประเภทคอนเทนต์</label>
                <select
                  value={postForm.type}
                  onChange={(e) => setPostForm({ ...postForm, type: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#13131a] border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
                >
                  <option value="text">📄 ข้อความ (Text)</option>
                  <option value="image">🖼️ รูปภาพ (Image)</option>
                  <option value="video">🎥 วิดีโอ (Video)</option>
                  <option value="audio">🎵 เสียง (Audio)</option>
                </select>
              </div>

              <div>
                <label className="text-white/70 text-sm font-medium block mb-1.5">แท็ก (คั่นด้วยจุลภาค)</label>
                <input
                  type="text"
                  value={postForm.tags}
                  onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })}
                  placeholder="เช่น art, exclusive, update"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>

            <div>
              <label className="text-white/70 text-sm font-medium block mb-1.5">ลิงก์รูปภาพ / Thumbnail URL (ถ้ามี)</label>
              <input
                type="url"
                value={postForm.thumbnail}
                onChange={(e) => setPostForm({ ...postForm, thumbnail: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-500/50"
              />
            </div>

            {/* Exclusive Setting */}
            <div className="border border-white/10 rounded-xl p-4 space-y-3 bg-white/3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">🔒 คอนเทนต์เฉพาะสมาชิกเท่านั้น (Exclusive)</h4>
                  <p className="text-white/40 text-xs mt-0.5">เฉพาะผู้ที่มี NFT หรือ Subscription สัญญานี้จึงจะเห็นเนื้อหา</p>
                </div>
                <input
                  type="checkbox"
                  checked={postForm.isExclusive}
                  onChange={(e) => setPostForm({ ...postForm, isExclusive: e.target.checked })}
                  className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                />
              </div>

              {postForm.isExclusive && (
                <div className="pt-2 border-t border-white/5">
                  <label className="text-white/60 text-xs block mb-1">สิทธิ์ที่ต้องการ</label>
                  <select
                    value={postForm.requiredTier}
                    onChange={(e) => setPostForm({ ...postForm, requiredTier: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-[#13131a] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="nft">🖼️ ผู้ถือ NFT สมาชิกเท่านั้น</option>
                    <option value="stablecoin">💵 สมาชิกรายเดือน Stablecoin เท่านั้น</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 text-sm"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg"
              >
                🚀 เผยแพร่โพสต์
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 3: EDIT PROFILE (AVATAR & COVER) ─────────────────────── */}
      {activeTab === 'edit-profile' && (
        <div className="max-w-2xl mx-auto bg-[#13131a] border border-white/5 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white mb-2">ปรับแต่งรูปโปรไฟล์ &amp; หน้าปก</h2>
          <p className="text-white/40 text-sm mb-6">ตั้งค่ารูปประจำตัว ภาพพื้นหลังหน้าปก และคำอธิบายหน้าโปรไฟล์ของคุณ</p>

          {profileSavedMsg && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
              <span>✅</span> {profileSavedMsg}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Live Preview */}
            <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0a0a0f]">
              <div className="relative h-32 w-full bg-slate-800">
                <img
                  src={profileForm.coverImage || PRESET_COVERS[0]}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
              </div>
              <div className="p-4 flex items-end gap-4 -mt-10 relative z-10">
                <div className="w-16 h-16 rounded-xl border-2 border-[#13131a] bg-purple-600 overflow-hidden flex-shrink-0 shadow-lg">
                  <img
                    src={profileForm.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">{profileForm.name || profile.username}</h4>
                  <p className="text-white/40 text-xs">@{profile.username}</p>
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="text-white/70 text-sm font-medium block mb-1.5">ชื่อที่แสดง (Display Name)</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="เช่น Aria Nakamura"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-500/50"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="text-white/70 text-sm font-medium block mb-1.5">คำอธิบายโปรไฟล์ (Bio)</label>
              <textarea
                rows={3}
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                placeholder="บอกเล่าเกี่ยวกับผลงานพิเศษของคุณ..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-500/50 resize-none"
              />
            </div>

            {/* Avatar URL / Presets */}
            <div>
              <label className="text-white/70 text-sm font-medium block mb-1.5">รูปประจำตัว / Avatar Image URL</label>
              <input
                type="url"
                value={profileForm.avatar}
                onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                placeholder="https://api.dicebear.com/... หรือ URL รูปภาพ"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-500/50 mb-2"
              />
              <p className="text-white/30 text-xs">ตัวอย่าง Avatar preset:</p>
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {['aria', 'synth', 'luna', 'marcus', 'nexus', 'priya', 'cyber'].map((seed) => {
                  const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                  return (
                    <button
                      key={seed}
                      type="button"
                      onClick={() => setProfileForm({ ...profileForm, avatar: url })}
                      className="w-10 h-10 rounded-lg border border-white/10 overflow-hidden hover:border-purple-400 transition-all flex-shrink-0"
                    >
                      <img src={url} alt={seed} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cover Image URL / Presets */}
            <div>
              <label className="text-white/70 text-sm font-medium block mb-1.5">ภาพหน้าปก / Background Cover URL</label>
              <input
                type="url"
                value={profileForm.coverImage}
                onChange={(e) => setProfileForm({ ...profileForm, coverImage: e.target.value })}
                placeholder="https://images.unsplash.com/... หรือ URL ภาพหน้าปก"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-500/50 mb-2"
              />
              <p className="text-white/30 text-xs mb-2">ภาพหน้าปกสำเร็จรูป:</p>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_COVERS.map((cUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setProfileForm({ ...profileForm, coverImage: cUrl })}
                    className={`h-16 rounded-lg overflow-hidden border transition-all ${
                      profileForm.coverImage === cUrl ? 'border-purple-500 ring-2 ring-purple-400' : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <img src={cUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 text-sm"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg"
              >
                💾 บันทึกรูปโปรไฟล์ &amp; หน้าปก
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
