'use client';

import { useWeb3 } from '@/lib/Web3Provider';
import { useOnlyHold } from '@/lib/useOnlyHold';
import { useChainData } from '@/lib/useChainData';
import ContentCard from '@/components/ContentCard';
import Link from 'next/link';
import WalletModal from '@/components/WalletModal';
import { useState, useEffect } from 'react';

export default function FeedPage() {
  const { isConnected, address } = useWeb3();
  const { checkAccess } = useOnlyHold();
  const { creators, content, isLoading: chainLoading } = useChainData();

  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [accessMap, setAccessMap] = useState<Record<string, { hasAccess: boolean; via: string }>>({});
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [lastFetchKey, setLastFetchKey] = useState('');
  const [feedTab, setFeedTab] = useState<'subscribed' | 'all'>('subscribed');

  useEffect(() => {
    if (!isConnected || !address || creators.length === 0) {
      setAccessMap({});
      return;
    }

    const fetchKey = `${address}-${creators.length}`;
    if (fetchKey === lastFetchKey) return;

    setLoadingAccess(true);
    setLastFetchKey(fetchKey);

    Promise.all(
      creators.map((c) => {
        if (
          (address && c.address && c.address.toLowerCase() === address.toLowerCase()) ||
          (address && c.id && c.id.toLowerCase() === address.toLowerCase())
        ) {
          return Promise.resolve({ id: c.id, hasAccess: true, via: 'owner' });
        }
        return checkAccess(c.address).then((res) => ({ id: c.id, ...res }));
      })
    ).then((results) => {
      const map: Record<string, { hasAccess: boolean; via: string }> = {};
      results.forEach((r) => { map[r.id] = { hasAccess: r.hasAccess, via: r.via }; });
      setAccessMap(map);
    }).catch(console.error).finally(() => setLoadingAccess(false));
  }, [isConnected, address, creators, checkAccess, lastFetchKey]);

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-6">🔐</div>
        <h1 className="text-2xl font-bold text-white mb-3">เชื่อมต่อกระเป๋าเพื่อดูฟีด</h1>
        <p className="text-white/50 mb-8">เชื่อมต่อกระเป๋าของคุณเพื่อดูคอนเทนต์พิเศษจากครีเอเตอร์ที่คุณสมัครสมาชิกไว้</p>
        <button onClick={() => setWalletModalOpen(true)} className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition-all shadow-lg">
          เชื่อมต่อกระเป๋า
        </button>
        {walletModalOpen && <WalletModal onClose={() => setWalletModalOpen(false)} />}
      </div>
    );
  }

  const accessibleIds = Object.entries(accessMap).filter(([, v]) => v.hasAccess).map(([id]) => id);

  const subscribedFeed = content.filter((c) => {
    if (!c) return false;
    const creator = creators.find(
      (cr) =>
        cr &&
        ((cr.username && c.creatorUsername && cr.username.toLowerCase() === c.creatorUsername.toLowerCase()) ||
          (cr.id && c.creatorId && cr.id.toLowerCase() === c.creatorId.toLowerCase()) ||
          (cr.address && c.creatorId && cr.address.toLowerCase() === c.creatorId.toLowerCase()))
    );
    return (
      (creator && accessibleIds.includes(creator.id)) ||
      (address && c.creatorId && c.creatorId.toLowerCase() === address.toLowerCase())
    );
  });

  const displayedPosts = feedTab === 'subscribed' ? subscribedFeed : content;

  const subscribedCreators = creators.filter((c) => accessibleIds.includes(c.id));
  const nftCount = Object.values(accessMap).filter((v) => v.via === 'nft').length;
  const subCount = Object.values(accessMap).filter((v) => v.via === 'subscription').length;
  const isLoading = chainLoading || loadingAccess;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">ฟีดของฉัน</h1>
          <p className="text-white/40 text-sm mt-1">คอนเทนต์และอัปเดตล่าสุดจากครีเอเตอร์บน OnlyHold</p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 text-sm hover:bg-purple-600/30 transition-colors font-medium">
            ✍️ สร้างโพสต์ใหม่
          </Link>
          <Link href="/explore" className="px-4 py-2 rounded-xl border border-white/10 text-white/70 text-sm hover:bg-white/5 transition-colors">
            + ค้นหาครีเอเตอร์
          </Link>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-white/5 mb-8 gap-4">
        <button
          onClick={() => setFeedTab('subscribed')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            feedTab === 'subscribed' ? 'border-purple-500 text-purple-400' : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          ⭐ สมาชิก &amp; โพสต์ของฉัน ({subscribedFeed.length})
        </button>
        <button
          onClick={() => setFeedTab('all')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            feedTab === 'all' ? 'border-purple-500 text-purple-400' : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          🌐 คอนเทนต์ทั้งหมด ({content.length})
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="text-center py-20 text-white/30">
              <div className="text-4xl mb-3 animate-pulse">⛓️</div>
              <p>กำลังตรวจสอบสิทธิ์บน Sepolia...</p>
            </div>
          ) : displayedPosts.length === 0 ? (
            <div className="bg-[#13131a] border border-white/5 rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-white font-bold text-base mb-1">ยังไม่มีคอนเทนต์ในฟีดของคุณ</p>
              <p className="text-white/40 text-xs mb-6 max-w-md mx-auto">
                {feedTab === 'subscribed'
                  ? 'สมัครสมาชิกหรือถือ NFT ครีเอเตอร์ที่คุณชื่นชอบเพื่อปลดล็อกฟีดพิเศษ!'
                  : 'ยังไม่มีโพสต์ที่เผยแพร่บนระบบ สามารถสร้างโพสต์แรกได้ที่หน้าแดชบอร์ด'}
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/explore"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold hover:opacity-90 transition-all shadow-lg"
                >
                  ค้นหาครีเอเตอร์ →
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              {displayedPosts.map((c) => {
                if (!c) return null;
                const creator = creators.find(
                  (cr) =>
                    cr &&
                    ((cr.username && c.creatorUsername && cr.username.toLowerCase() === c.creatorUsername.toLowerCase()) ||
                      (cr.id && c.creatorId && cr.id.toLowerCase() === c.creatorId.toLowerCase()) ||
                      (cr.address && c.creatorId && cr.address.toLowerCase() === c.creatorId.toLowerCase()))
                );
                const hasSub =
                  (creator && accessMap[creator.id]?.hasAccess) ||
                  (address &&
                    ((c.creatorId && c.creatorId.toLowerCase() === address.toLowerCase()) ||
                      (c.creatorUsername && c.creatorUsername.toLowerCase() === address.toLowerCase())));
                return <ContentCard key={c.id} content={c} isSubscribed={Boolean(hasSub)} />;
              })}
            </div>
          )}
        </div>

        <div>
          <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5 sticky top-20">
            <h3 className="font-bold text-white text-sm mb-4">สมาชิกของฉัน</h3>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-white/10" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-white/10 rounded w-24" />
                      <div className="h-2 bg-white/5 rounded w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : subscribedCreators.length === 0 ? (
              <div className="text-center py-6 text-white/30 text-xs">
                <p className="mb-2">ยังไม่มีสมาชิก</p>
                <Link href="/explore" className="text-purple-400 hover:underline">เลือกครีเอเตอร์ →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {subscribedCreators.map((creator) => {
                  const via = accessMap[creator.id]?.via;
                  return (
                    <Link key={creator.id} href={`/creator/${creator.username}`} className="flex items-center gap-3 group">
                      <img
                        src={creator.avatar}
                        alt={creator.name}
                        className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.username}`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white group-hover:text-purple-300 transition-colors truncate">{creator.name}</p>
                        <p className="text-[10px] text-white/40">
                          {via === 'owner' ? '👑 เจ้าของโปรไฟล์' : via === 'nft' ? '🖼️ NFT Holder' : '💵 Stablecoin Sub'}
                        </p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                    </Link>
                  );
                })}
              </div>
            )}
            <div className="mt-5 pt-4 border-t border-white/5 space-y-2 text-xs text-white/40">
              <div className="flex justify-between"><span>NFT ที่ถือ</span><span className="text-purple-400 font-mono font-bold">{nftCount} ชิ้น</span></div>
              <div className="flex justify-between"><span>Stablecoin Sub</span><span className="text-green-400 font-mono font-bold">{subCount} รายการ</span></div>
              <div className="flex justify-between"><span>Network</span><span className="text-yellow-400 font-medium">Sepolia Testnet</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

