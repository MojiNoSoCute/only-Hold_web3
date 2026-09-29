'use client';

import { useWeb3 } from '@/lib/Web3Provider';
import { shortenAddress } from '@/lib/utils';
import Link from 'next/link';
import WalletModal from '@/components/WalletModal';
import { useState, useEffect } from 'react';
import { getAdminCreators } from '@/lib/adminData';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? '';

const FACTORY_ABI = [
  'function allCreators() view returns (address[])',
  'function creatorProfiles(address) view returns (address creatorAddress, address nftContract, address subscriptionContract, string username, string metadataURI, uint256 registeredAt, bool isActive)',
];

const NFT_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function mintPrice() view returns (uint256)',
];

interface NFTItem {
  creatorAddress: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatar: string;
  creatorCover: string;
  nftContract: string;
  nftName: string;
  nftSymbol: string;
  tokenCount: number;
  firstTokenId?: string;
  mintPrice: string;
}

export default function MyNFTsPage() {
  const { isConnected, address, isWrongNetwork, switchToSepolia } = useWeb3();
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isConnected || !address || !FACTORY_ADDRESS) return;
    setLoading(true);
    setError('');

    const { ethers } = require('ethers');
    const provider = new ethers.BrowserProvider((window as any).ethereum);

    async function loadNFTs() {
      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

      let allAddresses: string[] = [];
      try {
        allAddresses = await factory.allCreators();
      } catch (e) {
        setLoading(false);
        return;
      }

      const nftResults: NFTItem[] = [];

      await Promise.all(
        allAddresses.map(async (creatorAddr: string) => {
          try {
            const profile = await factory.creatorProfiles(creatorAddr);
            const username = profile.username;

            if (profile.nftContract && profile.nftContract !== ethers.ZeroAddress) {
              try {
                const nft = new ethers.Contract(profile.nftContract, NFT_ABI, provider);
                const bal = await nft.balanceOf(address);
                if (Number(bal) > 0) {
                  const price = await nft.mintPrice().catch(() => 0n);
                  const nftName = await nft.name().catch(() => `${username} Pass`);
                  const nftSymbol = await nft.symbol().catch(() => username.toUpperCase().slice(0, 5));
                  let firstTokenId = '';
                  try {
                    const tid = await nft.tokenOfOwnerByIndex(address, 0);
                    firstTokenId = String(tid);
                  } catch {}

                  const localList = getAdminCreators();
                  const custom = localList.find(
                    (c) =>
                      c.username?.toLowerCase() === username.toLowerCase() ||
                      c.address?.toLowerCase() === creatorAddr.toLowerCase()
                  );

                  nftResults.push({
                    creatorAddress: creatorAddr,
                    creatorName:
                      custom?.name || username.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                    creatorUsername: username,
                    creatorAvatar:
                      custom?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
                    creatorCover:
                      custom?.coverImage ||
                      'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=1200&auto=format&fit=crop',
                    nftContract: profile.nftContract,
                    nftName,
                    nftSymbol,
                    tokenCount: Number(bal),
                    firstTokenId,
                    mintPrice: ethers.formatEther(price),
                  });
                }
              } catch {}
            }
          } catch {}
        })
      );

      setNfts(nftResults);
    }

    loadNFTs().catch((e) => setError(String(e))).finally(() => setLoading(false));
  }, [isConnected, address]);

  const filteredNfts = nfts.filter(
    (item) =>
      item.nftName.toLowerCase().includes(search.toLowerCase()) ||
      item.creatorName.toLowerCase().includes(search.toLowerCase()) ||
      item.creatorUsername.toLowerCase().includes(search.toLowerCase()) ||
      item.nftSymbol.toLowerCase().includes(search.toLowerCase())
  );

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-6 animate-bounce">🖼️</div>
        <h1 className="text-3xl font-bold text-white mb-3">NFT ของฉัน</h1>
        <p className="text-white/50 mb-8">เชื่อมต่อกระเป๋าเพื่อดูคอลเลกชัน NFT บัตรสมาชิกที่คุณถืออยู่</p>
        <button
          onClick={() => setWalletModalOpen(true)}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-purple-500/25"
        >
          เชื่อมต่อกระเป๋า
        </button>
        {walletModalOpen && <WalletModal onClose={() => setWalletModalOpen(false)} />}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">🖼️ NFT ของฉัน</h1>
            <span className="bg-purple-600/30 text-purple-300 text-xs px-3 py-1 rounded-full font-mono border border-purple-500/30">
              {loading ? 'กำลังโหลด...' : `${nfts.length} Items`}
            </span>
          </div>
          <p className="text-white/50 text-sm mt-1">
            บัตรสมาชิก NFT ที่คุณถืออยู่ในกระเป๋า <span className="font-mono text-purple-400">{shortenAddress(address!)}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10 text-sm transition-colors flex items-center gap-2"
          >
            <span>👤</span> จัดการโปรไฟล์
          </Link>
          <Link
            href="/explore"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-md"
          >
            + ค้นหาครีเอเตอร์เพิ่ม
          </Link>
        </div>
      </div>

      {/* Network Warning */}
      {isWrongNetwork && (
        <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-between">
          <span className="text-yellow-400 text-sm flex items-center gap-2">
            <span>⚠️</span> กรุณาสลับไปใช้ Sepolia Network เพื่อดึงข้อมูล NFT
          </span>
          <button
            onClick={switchToSepolia}
            className="px-4 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-semibold hover:bg-yellow-500/30 transition-colors"
          >
            สลับเป็น Sepolia
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Search Filter */}
      {nfts.length > 0 && (
        <div className="mb-8 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหาชื่อ NFT, Symbol หรือ ครีเอเตอร์..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#13131a] border border-white/10 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            <span className="absolute left-3.5 top-3 text-white/30 text-sm">🔍</span>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-[#13131a] border border-white/5 animate-pulse" />
          ))}
        </div>
      )}

      {/* Main Grid */}
      {!loading && (
        <>
          {filteredNfts.length === 0 ? (
            <div className="bg-[#13131a] border border-white/5 rounded-3xl p-12 text-center max-w-lg mx-auto my-12">
              <div className="text-6xl mb-4 opacity-40">🖼️</div>
              <h3 className="text-xl font-bold text-white mb-2">
                {search ? 'ไม่พบ NFT ที่ค้นหา' : 'คุณยังไม่มี NFT ในกระเป๋านี้'}
              </h3>
              <p className="text-white/40 text-sm mb-6">
                {search
                  ? 'ลองค้นหาด้วยคำอื่น หรือล้างช่องค้นหา'
                  : 'ซื้อ NFT จากครีเอเตอร์ที่คุณชื่นชอบเพื่อปลดล็อกโพสต์พิเศษระดับ Exclusive'}
              </p>
              <div className="flex justify-center gap-3">
                {search ? (
                  <button
                    onClick={() => setSearch('')}
                    className="px-5 py-2.5 rounded-xl border border-white/10 text-white text-sm hover:bg-white/5 transition-colors"
                  >
                    ล้างการค้นหา
                  </button>
                ) : (
                  <Link
                    href="/explore"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-purple-500/25"
                  >
                    สำรวจครีเอเตอร์
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNfts.map((nft) => (
                <div
                  key={nft.nftContract}
                  className="bg-[#13131a] border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 group flex flex-col"
                >
                  {/* Card Cover Background */}
                  <div className="relative h-44 bg-slate-800 overflow-hidden">
                    <img
                      src={nft.creatorCover}
                      alt={nft.nftName}
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#13131a] via-transparent to-black/40" />

                    {/* Token Count Badge */}
                    <div className="absolute top-3 right-3 bg-purple-600/90 backdrop-blur-md border border-purple-400/40 text-white text-xs px-3 py-1 rounded-full font-mono font-bold shadow-lg">
                      {nft.tokenCount > 1 ? `x${nft.tokenCount} NFTs` : `Token #${nft.firstTokenId || '0'}`}
                    </div>

                    {/* Symbol Badge */}
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border border-white/20 text-purple-300 text-xs px-2.5 py-0.5 rounded-md font-mono">
                      ${nft.nftSymbol}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 pt-0 relative flex-1 flex flex-col justify-between">
                    <div>
                      {/* Avatar & Membership Status */}
                      <div className="-mt-8 mb-3 flex items-end justify-between">
                        <div className="w-14 h-14 rounded-2xl border-2 border-[#13131a] bg-purple-600 overflow-hidden shadow-xl flex-shrink-0">
                          <img
                            src={nft.creatorAvatar}
                            alt={nft.creatorName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${nft.creatorUsername}`;
                            }}
                          />
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium flex items-center gap-1">
                          <span>🎫</span> สมาชิกตลอดชีพ
                        </span>
                      </div>

                      {/* Title & Creator Info */}
                      <h3 className="font-bold text-white text-lg line-clamp-1 group-hover:text-purple-300 transition-colors">
                        {nft.nftName}
                      </h3>
                      <p className="text-white/50 text-xs mb-3">
                        โดย <span className="text-white/80 font-medium">{nft.creatorName}</span> (@{nft.creatorUsername})
                      </p>

                      {/* Etherscan Contract Link */}
                      <a
                        href={`https://sepolia.etherscan.io/address/${nft.nftContract}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/30 text-xs font-mono hover:text-purple-400 transition-colors inline-block truncate mb-4 max-w-full"
                      >
                        Contract: {nft.nftContract.slice(0, 8)}...{nft.nftContract.slice(-6)} ↗
                      </a>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-white/5">
                      <Link
                        href={`/creator/${nft.creatorUsername}`}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold text-center hover:opacity-90 transition-opacity shadow-md flex items-center justify-center gap-1"
                      >
                        <span>👑</span> ดูคอนเทนต์ครีเอเตอร์
                      </Link>
                      <Link
                        href="/feed"
                        className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-xs transition-colors flex items-center justify-center"
                        title="ดูในหน้าฟีด"
                      >
                        📰
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
