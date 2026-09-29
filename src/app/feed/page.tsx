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
  // ใช้ ref เก็บ address ล่าสุดที่ fetch แล้ว เพื่อกัน re-fetch ซ้ำ
  const [lastFetchKey, setLastFetchKey] = useState('');

  useEffect(() => {
    if (!isConnected || !address || creators.length === 0) {
      setAccessMap({});
      return;
    }

    // สร้าง key จาก address + จำนวน creators เพื่อ deduplicate
    const fetchKey = `${address}-${creators.length}`;
    if (fetchKey === lastFetchKey) return;

    setLoadingAccess(true);
    setLastFetchKey(fetchKey);

    Promise.all(
      creators.map((c) =>
        checkAccess(c.address).then((res) => ({ id: c.id, ...res }))
      )
    ).then((results) => {
      const map: Record<string, { hasAccess: boolean; via: string }> = {};
      results.forEach((r) => { map[r.id] = { hasAccess: r.hasAccess, via: r.via }; });
      setAccessMap(map);
    }).catch(console.error).finally(() => setLoadingAccess(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, creators.length]);

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-6">🔐</div>
        <h1 className="text-2xl font-bold text-white mb-3">เชื่อมต่อกระเป๋าเพื่อดูฟีด</h1>
        <p className="text-white/50 mb-8">เชื่อมต่อกระเป๋าของคุณเพื่อดูคอนเทนต์พิเศษจากครีเอเตอร์ที่คุณสมัครสมาชิกไว้</p>
        <button onClick={() => setWalletModalOpen(true)} className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition-all">
          เชื่อมต่อกระเป๋า
        </button>
        {walletModalOpen && <WalletModal onClose={() => setWalletModalOpen(false)} />}
      </div>
    );
  }

  const accessibleIds = Object.entries(accessMap).filter(([, v]) => v.hasAccess).map(([id]) => id);
  const myFeed = content.filter((c) => {
    const creator = creators.find((cr) => cr.username === c.creatorUsername);
    return creator && accessibleIds.includes(creator.id);
  });
  const subscribedCreators = creators.filter((c) => accessibleIds.includes(c.id));
  const nftCount = Object.values(accessMap).filter((v) => v.via === 'nft').length;
  const subCount = Object.values(accessMap).filter((v) => v.via === 'subscription').length;
  const isLoading = chainLoading || loadingAccess;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">ฟีดของฉัน</h1>
          <p className="text-white/40 text-sm mt-1">คอนเทนต์จากครีเอเตอร์ที่คุณสมัครสมาชิก</p>
        </div>
        <Link href="/explore" className="text-purple-400 hover:text-purple-300 text-sm transition-colors">+ ค้นหาครีเอเตอร์</Link>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="text-center py-20 text-white/30">
              <div className="text-4xl mb-3 animate-pulse">⛓️</div>
              <p>กำลังตรวจสอบสิทธิ์บน Sepolia...</p>
            </div>
          ) : myFeed.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-white/50 mb-2">ยังไม่มีคอนเทนต์ในฟีดของคุณ</p>
              <p className="text-white/30 text-sm mb-6">สมัครสมาชิกครีเอเตอร์เพื่อปลดล็อกคอนเทนต์พิเศษ</p>
              <Link href="/explore" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:opacity-90 transition-all">
                ค้นหาครีเอเตอร์
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              {myFeed.map((c) => <ContentCard key={c.id} content={c} isSubscribed={true} />)}
            </div>
          )}
        </div>

        <div>
          <div className="bg-[#13131a] border border-white/5 rounded-2xl p-4 sticky top-20">
            <h3 className="font-bold text-white text-sm mb-4">สมาชิกของฉัน</h3>
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map((i) => (
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
              <p className="text-white/30 text-xs text-center py-4">ยังไม่มีสมาชิก</p>
            ) : (
              <div className="space-y-3">
                {subscribedCreators.map((creator) => (
                  <Link key={creator.id} href={`/creator/${creator.username}`} className="flex items-center gap-3 group">
                    <img src={creator.avatar} alt={creator.name} className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white group-hover:text-purple-300 transition-colors truncate">{creator.name}</p>
                      <p className="text-xs text-white/30">{accessMap[creator.id]?.via === 'nft' ? '🖼️ NFT Holder' : '💵 Stablecoin Sub'}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-xs text-white/30">
              <div className="flex justify-between"><span>NFT ที่ถือ</span><span className="text-purple-400 font-mono">{nftCount} ชิ้น</span></div>
              <div className="flex justify-between"><span>Stablecoin Sub</span><span className="text-green-400 font-mono">{subCount} รายการ</span></div>
              <div className="flex justify-between"><span>Network</span><span className="text-yellow-400">Sepolia Testnet</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
