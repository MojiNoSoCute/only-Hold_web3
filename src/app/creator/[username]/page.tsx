'use client';

import { use, useState, useEffect } from 'react';
import { useChainData } from '@/lib/useChainData';
import { formatNumber, CATEGORY_COLORS } from '@/lib/utils';
import ContentCard from '@/components/ContentCard';
import SubscribeModal from '@/components/SubscribeModal';
import { useWeb3 } from '@/lib/Web3Provider';
import { useOnlyHold } from '@/lib/useOnlyHold';
import type { Creator } from '@/lib/types';
import Link from 'next/link';

import { getAdminCreators } from '@/lib/adminData';

const SEPOLIA_RPC = 'https://ethereum-sepolia.publicnode.com';
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? '';

interface CreatorPageProps {
  params: Promise<{ username: string }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  art: 'ศิลปะ', music: 'ดนตรี', fitness: 'ฟิตเนส', gaming: 'เกม',
  education: 'การศึกษา', lifestyle: 'ไลฟ์สไตล์', photography: 'ถ่ายภาพ', writing: 'งานเขียน',
};

export default function CreatorPage({ params }: CreatorPageProps) {
  const { username } = use(params);
  const { isConnected, address } = useWeb3();
  const { checkAccess } = useOnlyHold();
  const { content, creators } = useChainData();

  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');
  const [copied, setCopied] = useState(false);

  // creator data
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loadingCreator, setLoadingCreator] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  // on-chain state
  const [hasAccess, setHasAccess] = useState(false);
  const [accessVia, setAccessVia] = useState<'nft' | 'subscription' | 'none'>('none');
  const [onChainNFT, setOnChainNFT] = useState('');
  const [onChainSub, setOnChainSub] = useState('');
  const [loadingAccess, setLoadingAccess] = useState(false);

  // ── Load creator from chain ────────────────────────────────────────────
  useEffect(() => {
    if (!FACTORY_ADDRESS) { setNotFoundState(true); setLoadingCreator(false); return; }

    const { ethers } = require('ethers');
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    const factory = new ethers.Contract(FACTORY_ADDRESS, [
      'function resolveUsername(string username) view returns (address creator, address nft, address sub)',
      'function creatorProfiles(address) view returns (address creatorAddress, address nftContract, address subscriptionContract, string username, string metadataURI, uint256 registeredAt, bool isActive)',
    ], provider);

    factory.resolveUsername(username)
      .then(async (res: any) => {
        const creatorAddr: string = res[0];
        if (!creatorAddr || creatorAddr === ethers.ZeroAddress) {
          setNotFoundState(true);
          return;
        }

        const nftAddr: string = res[1];
        const subAddr: string = res[2];
        setOnChainNFT(nftAddr !== ethers.ZeroAddress ? nftAddr : '');
        setOnChainSub(subAddr !== ethers.ZeroAddress ? subAddr : '');

        // fetch more details
        let nftPrice = '';
        let stablecoinPrice = '';
        if (nftAddr && nftAddr !== ethers.ZeroAddress) {
          try {
            const nft = new ethers.Contract(nftAddr, ['function mintPrice() view returns (uint256)'], provider);
            nftPrice = ethers.formatEther(await nft.mintPrice());
          } catch {}
        }
        if (subAddr && subAddr !== ethers.ZeroAddress) {
          try {
            const sub = new ethers.Contract(subAddr, ['function monthlyPrice() view returns (uint256)'], provider);
            stablecoinPrice = (Number(await sub.monthlyPrice()) / 1_000_000).toFixed(0);
          } catch {}
        }

        const profile = await factory.creatorProfiles(creatorAddr);
        const uname: string = profile.username || username;
        const registeredAt: number = Number(profile.registeredAt);

        // Find saved custom profile (avatar, cover, name, bio) from admin store / chain data
        const localList = getAdminCreators();
        const custom = localList.find(
          (c) => c.username?.toLowerCase() === uname.toLowerCase() || c.address?.toLowerCase() === creatorAddr.toLowerCase()
        ) || creators.find(
          (c) => c.username?.toLowerCase() === uname.toLowerCase() || c.address?.toLowerCase() === creatorAddr.toLowerCase()
        );

        setCreator({
          id: creatorAddr.toLowerCase(),
          address: creatorAddr,
          name: custom?.name || uname.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          username: uname,
          avatar: custom?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uname}`,
          coverImage: custom?.coverImage || 'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=1200&auto=format&fit=crop',
          bio: custom?.bio || `ครีเอเตอร์บน OnlyHold Sepolia Testnet`,
          category: custom?.category || 'art',
          totalSubscribers: custom?.totalSubscribers || 0,
          totalEarnings: custom?.totalEarnings || '0',
          isVerified: custom?.isVerified || false,
          nftContractAddress: nftAddr !== ethers.ZeroAddress ? nftAddr : undefined,
          nftPrice: nftPrice || undefined,
          stablecoinPrice: stablecoinPrice || undefined,
          contentCount: custom?.contentCount || 0,
          joinedAt: registeredAt > 0 ? new Date(registeredAt * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        });
      })
      .catch(() => setNotFoundState(true))
      .finally(() => setLoadingCreator(false));
  }, [username]);

  // ── Sync custom profile data when useChainData updates ────────────────
  useEffect(() => {
    if (!creator) return;
    const match = creators.find(
      (c) => c.username?.toLowerCase() === creator.username.toLowerCase() || c.address?.toLowerCase() === creator.address.toLowerCase()
    );
    if (match) {
      setCreator((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          name: match.name || prev.name,
          avatar: match.avatar || prev.avatar,
          coverImage: match.coverImage || prev.coverImage,
          bio: match.bio || prev.bio,
          category: match.category || prev.category,
        };
      });
    }
  }, [creators, username]);

  // ── Check access ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isConnected || !address || !creator) return;
    setLoadingAccess(true);
    checkAccess(creator.address).then((res) => {
      setHasAccess(res.hasAccess);
      setAccessVia(res.via as any);
    }).finally(() => setLoadingAccess(false));
  }, [isConnected, address, creator, checkAccess]);

  const handleCopyAddress = async () => {
    if (!creator) return;
    await navigator.clipboard.writeText(creator.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categoryClass = creator
    ? (CATEGORY_COLORS[creator.category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30')
    : '';

  // ── Loading ────────────────────────────────────────────────────────────
  if (loadingCreator) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="text-4xl mb-4 animate-pulse">⛓️</div>
        <p className="text-white/40">กำลังโหลดโปรไฟล์จาก Sepolia...</p>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────
  if (notFoundState || !creator) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">👤</div>
        <h1 className="text-2xl font-bold text-white mb-2">ไม่พบครีเอเตอร์ @{username}</h1>
        <p className="text-white/40 text-sm mb-6">ไม่มีครีเอเตอร์ชื่อนี้บน Sepolia Testnet</p>
        <Link href="/creators" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:opacity-90 transition-all">
          ดูครีเอเตอร์ทั้งหมด
        </Link>
      </div>
    );
  }

  const creatorContent = content.filter(
    (c) =>
      c.creatorUsername?.toLowerCase() === creator.username.toLowerCase() ||
      c.creatorId?.toLowerCase() === creator.id.toLowerCase() ||
      c.creatorId?.toLowerCase() === creator.address.toLowerCase()
  );

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
            <div className="w-24 h-24 rounded-2xl border-4 border-[#0a0a0f] bg-gradient-to-br from-purple-600 to-pink-600 overflow-hidden flex-shrink-0">
              <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white">{creator.name}</h1>
                {creator.isVerified && (
                  <span className="bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ยืนยันแล้ว
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${categoryClass}`}>
                  {CATEGORY_LABELS[creator.category] ?? creator.category}
                </span>
              </div>
              <p className="text-white/40 text-sm mb-2">@{creator.username}</p>
              <button onClick={handleCopyAddress} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors font-mono">
                {creator.address.slice(0, 10)}...{creator.address.slice(-6)}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                {copied && <span className="text-green-400">คัดลอกแล้ว!</span>}
              </button>
            </div>

            <div className="flex flex-col gap-2 items-end">
              {loadingAccess ? (
                <div className="text-xs text-white/30 animate-pulse">กำลังตรวจสอบสิทธิ์...</div>
              ) : hasAccess ? (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${accessVia === 'nft' ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-green-500/20 border-green-500/40 text-green-300'}`}>
                  ✓ {accessVia === 'nft' ? 'ถือ NFT อยู่' : 'สมาชิกอยู่'}
                </div>
              ) : null}
              <button
                onClick={() => setSubscribeModalOpen(true)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg"
              >
                {hasAccess ? 'จัดการสมาชิก' : 'สมัครสมาชิก'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-[#13131a] border border-white/5 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">{formatNumber(creator.totalSubscribers)}</p>
              <p className="text-white/40 text-xs">แฟนคลับ</p>
            </div>
            <div className="bg-[#13131a] border border-white/5 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">{creatorContent.length}</p>
              <p className="text-white/40 text-xs">โพสต์</p>
            </div>
            <div className="bg-[#13131a] border border-white/5 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">{creator.joinedAt}</p>
              <p className="text-white/40 text-xs">วันที่สมัคร</p>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            {creator.nftPrice && (
              <button onClick={() => setSubscribeModalOpen(true)} className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl text-left hover:border-purple-500/40 transition-colors group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-400 font-bold text-sm">🖼️ สมาชิก NFT</span>
                  <svg className="w-4 h-4 text-purple-400/40 group-hover:text-purple-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </div>
                <p className="text-white font-bold text-xl">{creator.nftPrice} ETH</p>
                <p className="text-white/40 text-xs mt-1">จ่ายครั้งเดียว • สิทธิ์ตลอดชีพ • ซื้อขายได้</p>
              </button>
            )}
            {creator.stablecoinPrice && (
              <button onClick={() => setSubscribeModalOpen(true)} className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-left hover:border-green-500/40 transition-colors group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-400 font-bold text-sm">💵 Stablecoin Sub</span>
                  <svg className="w-4 h-4 text-green-400/40 group-hover:text-green-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </div>
                <p className="text-white font-bold text-xl">${creator.stablecoinPrice} USDC</p>
                <p className="text-white/40 text-xs mt-1">ต่อเดือน • ยกเลิกได้ทุกเมื่อ • ถอนเงินคืนได้</p>
              </button>
            )}
          </div>

          {/* On-chain links */}
          {(onChainNFT || onChainSub) && (
            <div className="mt-4 p-3 bg-white/3 border border-white/5 rounded-xl flex flex-wrap gap-3 text-xs">
              {onChainNFT && (
                <a href={`https://sepolia.etherscan.io/address/${onChainNFT}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-mono">
                  🖼️ NFT: {onChainNFT.slice(0, 8)}...{onChainNFT.slice(-6)} ↗
                </a>
              )}
              {onChainSub && (
                <a href={`https://sepolia.etherscan.io/address/${onChainSub}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-green-400 hover:text-green-300 font-mono">
                  💵 Sub: {onChainSub.slice(0, 8)}...{onChainSub.slice(-6)} ↗
                </a>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mt-6 bg-white/3 border border-white/5 rounded-xl p-1 w-fit">
            {(['posts', 'about'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
              >
                {tab === 'posts' ? 'โพสต์' : 'เกี่ยวกับ'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'posts' ? (
              creatorContent.length === 0 ? (
                <div className="bg-[#13131a] border border-white/5 rounded-2xl p-12 text-center my-4">
                  <div className="text-5xl mb-3 opacity-40">📭</div>
                  <p className="text-white/70 font-semibold text-base mb-1">ยังไม่มีโพสต์จากครีเอเตอร์นี้</p>
                  <p className="text-white/30 text-xs">ครีเอเตอร์ยังไม่ได้สร้างโพสต์ใหม่ หรืออยู่ในระหว่างการเตรียมคอนเทนต์</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-5">
                  {creatorContent.map((content) => (
                    <ContentCard key={content.id} content={content} isSubscribed={hasAccess} />
                  ))}
                </div>
              )
            ) : (
              <div className="space-y-6">
                <div className="bg-[#13131a] border border-white/5 rounded-xl p-5">
                  <h3 className="font-bold text-white text-sm mb-3">เกี่ยวกับ</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{creator.bio}</p>
                </div>
                {onChainNFT && (
                  <div className="bg-[#13131a] border border-white/5 rounded-xl p-5">
                    <h3 className="font-bold text-white text-sm mb-3">สัญญา NFT (Sepolia)</h3>
                    <a href={`https://sepolia.etherscan.io/address/${onChainNFT}`} target="_blank" rel="noopener noreferrer" className="text-purple-400 text-xs font-mono break-all hover:underline">
                      {onChainNFT}
                    </a>
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
          onClose={() => {
            setSubscribeModalOpen(false);
            if (isConnected && address) {
              checkAccess(creator.address).then((res) => {
                setHasAccess(res.hasAccess);
                setAccessVia(res.via as any);
              });
            }
          }}
        />
      )}
    </>
  );
}
