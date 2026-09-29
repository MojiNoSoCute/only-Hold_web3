'use client';

import { use, useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { MOCK_CREATORS, MOCK_CONTENT } from '@/lib/mockData';
import { formatNumber, CATEGORY_COLORS } from '@/lib/utils';
import ContentCard from '@/components/ContentCard';
import SubscribeModal from '@/components/SubscribeModal';
import { useWeb3 } from '@/lib/Web3Provider';
import { useOnlyHold } from '@/lib/useOnlyHold';

interface CreatorPageProps {
  params: Promise<{ username: string }>;
}

export default function CreatorPage({ params }: CreatorPageProps) {
  const { username } = use(params);
  const { isConnected, address } = useWeb3();
  const { checkAccess, resolveUsername } = useOnlyHold();

  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');
  const [copied, setCopied] = useState(false);

  // on-chain state
  const [hasAccess, setHasAccess] = useState(false);
  const [accessVia, setAccessVia] = useState<'nft' | 'subscription' | 'none'>('none');
  const [onChainNFT, setOnChainNFT] = useState('');
  const [onChainSub, setOnChainSub] = useState('');
  const [loadingAccess, setLoadingAccess] = useState(false);

  const creator = MOCK_CREATORS.find((c) => c.username === username);
  if (!creator) notFound();

  const creatorContent = MOCK_CONTENT.filter((c) => c.creatorId === creator.id);
  const categoryClass = CATEGORY_COLORS[creator.category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';

  // ── Resolve on-chain contract addresses ─────────────────────────────────
  useEffect(() => {
    resolveUsername(creator.username).then((res) => {
      if (res && res.creator !== '0x0000000000000000000000000000000000000000') {
        setOnChainNFT(res.nftContract);
        setOnChainSub(res.subContract);
      }
    });
  }, [creator.username, resolveUsername]);

  // ── Check access whenever wallet connects or contracts resolve ───────────
  useEffect(() => {
    if (!isConnected || !address) { setHasAccess(false); setAccessVia('none'); return; }
    setLoadingAccess(true);
    checkAccess(creator.address).then((res) => {
      setHasAccess(res.hasAccess);
      setAccessVia(res.via as any);
    }).finally(() => setLoadingAccess(false));
  }, [isConnected, address, creator.address, checkAccess, onChainNFT, onChainSub]);

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(creator.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const CATEGORY_LABELS: Record<string, string> = {
    art: 'ศิลปะ', music: 'ดนตรี', fitness: 'ฟิตเนส', gaming: 'เกม',
    education: 'การศึกษา', lifestyle: 'ไลฟ์สไตล์', photography: 'ถ่ายภาพ', writing: 'งานเขียน',
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
                    ยืนยันแล้ว
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${categoryClass}`}>
                  {CATEGORY_LABELS[creator.category] ?? creator.category}
                </span>
              </div>
              <p className="text-white/40 text-sm mb-2">@{creator.username}</p>
              <button
                onClick={handleCopyAddress}
                className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors font-mono"
              >
                {creator.address.slice(0, 10)}...{creator.address.slice(-6)}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                {copied && <span className="text-green-400">คัดลอกแล้ว!</span>}
              </button>
            </div>

            {/* Access status + subscribe button */}
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
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg hover:shadow-purple-500/30"
              >
                {hasAccess ? 'จัดการสมาชิก' : 'สมัครสมาชิก'}
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-[#13131a] border border-white/5 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">{formatNumber(creator.totalSubscribers)}</p>
              <p className="text-white/40 text-xs">แฟนคลับ</p>
            </div>
            <div className="bg-[#13131a] border border-white/5 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">{creator.contentCount}</p>
              <p className="text-white/40 text-xs">โพสต์</p>
            </div>
            <div className="bg-[#13131a] border border-white/5 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">${creator.totalEarnings}</p>
              <p className="text-white/40 text-xs">รายได้รวม</p>
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
                  <span className="text-purple-400 font-bold text-sm">🖼️ สมาชิก NFT</span>
                  <svg className="w-4 h-4 text-purple-400/40 group-hover:text-purple-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-white font-bold text-xl">{creator.nftPrice} ETH</p>
                <p className="text-white/40 text-xs mt-1">จ่ายครั้งเดียว • สิทธิ์ตลอดชีพ • ซื้อขายได้</p>
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
                <p className="text-white/40 text-xs mt-1">ต่อเดือน • ยกเลิกได้ทุกเมื่อ • ถอนเงินคืนได้</p>
              </button>
            )}
          </div>

          {/* On-chain contract addresses (if found) */}
          {(onChainNFT || onChainSub) && (
            <div className="mt-4 p-3 bg-white/3 border border-white/5 rounded-xl flex flex-wrap gap-3 text-xs">
              {onChainNFT && onChainNFT !== '0x0000000000000000000000000000000000000000' && (
                <a href={`https://sepolia.etherscan.io/address/${onChainNFT}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 font-mono">
                  🖼️ NFT: {onChainNFT.slice(0, 8)}...{onChainNFT.slice(-6)} ↗
                </a>
              )}
              {onChainSub && onChainSub !== '0x0000000000000000000000000000000000000000' && (
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
                <div className="text-center py-16 text-white/30">
                  <div className="text-4xl mb-3">📭</div>
                  <p>ยังไม่มีโพสต์</p>
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

                {creator.socialLinks && Object.keys(creator.socialLinks).length > 0 && (
                  <div className="bg-[#13131a] border border-white/5 rounded-xl p-5">
                    <h3 className="font-bold text-white text-sm mb-3">ลิงก์</h3>
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

                {onChainNFT && onChainNFT !== '0x0000000000000000000000000000000000000000' && (
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
            // re-check access after modal closes
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
