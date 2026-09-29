'use client';

import { useWeb3 } from '@/lib/Web3Provider';
import { shortenAddress } from '@/lib/utils';
import Link from 'next/link';
import WalletModal from '@/components/WalletModal';
import { useState, useEffect } from 'react';

import { getAdminCreators } from '@/lib/adminData';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? '';
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS ?? '';

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

const SUB_ABI = [
  'function getSubscription(address account) view returns (uint256 deposited, uint256 expiresAt, bool isActive, uint256 remainingSeconds)',
  'function monthlyPrice() view returns (uint256)',
  'function withdrawBalance()',
];

const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
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

interface SubItem {
  creatorAddress: string;
  creatorUsername: string;
  subContract: string;
  deposited: bigint;
  expiresAt: bigint;
  isActive: boolean;
  remainingSeconds: bigint;
  monthlyPrice: bigint;
}

export default function ProfilePage() {
  const { isConnected, address, isWrongNetwork, switchToSepolia } = useWeb3();
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'nfts' | 'subscriptions'>('nfts');

  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [subs, setSubs] = useState<SubItem[]>([]);
  const [usdcBalance, setUsdcBalance] = useState(0n);
  const [loading, setLoading] = useState(false);
  const [cancellingFor, setCancellingFor] = useState<string | null>(null);
  const [error, setError] = useState('');

  // ── Load on-chain data ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isConnected || !address || !FACTORY_ADDRESS) return;
    setLoading(true);
    setError('');

    const { ethers } = require('ethers');
    const provider = new ethers.BrowserProvider((window as any).ethereum);

    async function load() {
      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

      // USDC balance
      if (USDC_ADDRESS) {
        const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
        usdc.balanceOf(address).then(setUsdcBalance).catch(() => {});
      }

      // Get all creators
      let allAddresses: string[] = [];
      try { allAddresses = await factory.allCreators(); } catch { return; }

      const nftResults: NFTItem[] = [];
      const subResults: SubItem[] = [];

      await Promise.all(
        allAddresses.map(async (creatorAddr: string) => {
          try {
            const profile = await factory.creatorProfiles(creatorAddr);
            const username = profile.username;

            // Check NFT
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
                  const custom = localList.find((c) => c.username?.toLowerCase() === username.toLowerCase() || c.address?.toLowerCase() === creatorAddr.toLowerCase());

                  nftResults.push({
                    creatorAddress: creatorAddr,
                    creatorName: custom?.name || username.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                    creatorUsername: username,
                    creatorAvatar: custom?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
                    creatorCover: custom?.coverImage || 'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=1200&auto=format&fit=crop',
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

            // Check Subscription
            if (profile.subscriptionContract && profile.subscriptionContract !== ethers.ZeroAddress) {
              try {
                const sub = new ethers.Contract(profile.subscriptionContract, SUB_ABI, provider);
                const info = await sub.getSubscription(address);
                if (info.deposited > 0n || info.isActive) {
                  const mp = await sub.monthlyPrice().catch(() => 0n);
                  subResults.push({
                    creatorAddress: creatorAddr,
                    creatorUsername: username,
                    subContract: profile.subscriptionContract,
                    deposited: info.deposited,
                    expiresAt: info.expiresAt,
                    isActive: info.isActive,
                    remainingSeconds: info.remainingSeconds,
                    monthlyPrice: mp,
                  });
                }
              } catch {}
            }
          } catch {}
        })
      );

      setNfts(nftResults);
      setSubs(subResults);
    }

    load().catch((e) => setError(String(e))).finally(() => setLoading(false));
  }, [isConnected, address]);

  // ── Cancel subscription ──────────────────────────────────────────────────
  const handleCancel = async (sub: SubItem) => {
    if (isWrongNetwork) { await switchToSepolia(); return; }
    setCancellingFor(sub.subContract);
    try {
      const { ethers } = require('ethers');
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(sub.subContract, SUB_ABI, signer);
      const tx = await contract.withdrawBalance();
      await tx.wait();
      // Remove from list
      setSubs((prev) => prev.filter((s) => s.subContract !== sub.subContract));
    } catch (e: any) {
      setError(e.reason ?? e.message ?? 'ยกเลิกไม่สำเร็จ');
    } finally {
      setCancellingFor(null);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatUSDC = (raw: bigint) => (Number(raw) / 1_000_000).toFixed(2);
  const remainingMonths = (s: SubItem) => Math.floor(Number(s.remainingSeconds) / (30 * 86400));
  const expiryDate = (s: SubItem) => new Date(Number(s.expiresAt) * 1000).toLocaleDateString('th-TH');

  // ── Not connected ────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-6">👤</div>
        <h1 className="text-2xl font-bold text-white mb-3">โปรไฟล์ของฉัน</h1>
        <p className="text-white/50 mb-8">เชื่อมต่อกระเป๋าเพื่อดูโปรไฟล์ NFT และสมาชิกของคุณ</p>
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Profile Card */}
      <div className="bg-[#13131a] border border-white/5 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl text-white font-bold flex-shrink-0">
            {address?.slice(2, 4).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-bold text-white text-lg font-mono">{shortenAddress(address!)}</p>
            <p className="text-white/40 text-sm">แฟนคลับ · Sepolia Testnet</p>
            {usdcBalance > 0n && (
              <p className="text-green-400 text-xs mt-0.5 font-mono">💵 {formatUSDC(usdcBalance)} Mock USDC</p>
            )}
          </div>
          <Link href="/dashboard" className="px-4 py-2 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 text-sm transition-colors">
            แดชบอร์ด →
          </Link>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white/3 rounded-xl p-3 text-center">
            <p className="text-purple-400 font-bold text-lg">{loading ? '...' : nfts.length}</p>
            <p className="text-white/40 text-xs">NFT ที่ถือ</p>
          </div>
          <div className="bg-white/3 rounded-xl p-3 text-center">
            <p className="text-green-400 font-bold text-lg">{loading ? '...' : subs.filter(s => s.isActive).length}</p>
            <p className="text-white/40 text-xs">Subscription</p>
          </div>
          <div className="bg-white/3 rounded-xl p-3 text-center">
            <p className="text-yellow-400 font-bold text-lg font-mono">{formatUSDC(usdcBalance)}</p>
            <p className="text-white/40 text-xs">USDC คงเหลือ</p>
          </div>
        </div>
      </div>

      {/* Wrong network warning */}
      {isWrongNetwork && (
        <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-between">
          <span className="text-yellow-400 text-sm">⚠️ สลับไป Sepolia เพื่อใช้งาน</span>
          <button onClick={switchToSepolia} className="px-3 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs hover:bg-yellow-500/30">สลับเลย</button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">❌ {error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white/3 border border-white/5 rounded-xl p-1 mb-6 w-fit">
        {(['nfts', 'subscriptions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}
          >
            {tab === 'nfts' ? `🖼️ NFT (${loading ? '...' : nfts.length})` : `💵 Subscription (${loading ? '...' : subs.length})`}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-white/3 animate-pulse" />
          ))}
        </div>
      )}

      {/* NFTs Tab */}
      {!loading && activeTab === 'nfts' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {nfts.length === 0 ? (
            <div className="col-span-2 text-center py-16 text-white/30">
              <div className="text-4xl mb-3">🖼️</div>
              <p>ยังไม่มี NFT ในกระเป๋า</p>
              <Link href="/explore" className="mt-4 inline-block text-purple-400 text-sm hover:underline">ค้นหาครีเอเตอร์ →</Link>
            </div>
          ) : (
            <>
              {nfts.map((nft) => (
                <div key={nft.nftContract} className="bg-[#13131a] border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/40 transition-all duration-300 group shadow-lg">
                  {/* Card Cover Background */}
                  <div className="relative h-32 bg-slate-800 overflow-hidden">
                    <img
                      src={nft.creatorCover}
                      alt={nft.nftName}
                      className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#13131a] via-transparent to-black/30" />

                    {/* Token Count Badge */}
                    <div className="absolute top-3 right-3 bg-purple-600/80 backdrop-blur-sm border border-purple-400/40 text-white text-xs px-2.5 py-0.5 rounded-full font-mono font-bold shadow-md">
                      {nft.tokenCount > 1 ? `x${nft.tokenCount} NFTs` : `Token #${nft.firstTokenId || '0'}`}
                    </div>

                    {/* NFT Symbol Tag */}
                    <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm border border-white/20 text-purple-300 text-[10px] px-2 py-0.5 rounded-md font-mono">
                      ${nft.nftSymbol}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 pt-0 relative">
                    <div className="-mt-7 mb-3 flex items-end justify-between">
                      <div className="w-12 h-12 rounded-xl border-2 border-[#13131a] bg-purple-600 overflow-hidden shadow-md flex-shrink-0">
                        <img
                          src={nft.creatorAvatar}
                          alt={nft.creatorName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${nft.creatorUsername}`;
                          }}
                        />
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                        🎫 สมาชิกตลอดชีพ
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-sm line-clamp-1">{nft.nftName}</h4>
                    <p className="text-white/40 text-xs mb-3">โดย {nft.creatorName} (@{nft.creatorUsername})</p>

                    <a
                      href={`https://sepolia.etherscan.io/address/${nft.nftContract}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/30 text-[11px] font-mono hover:text-purple-400 transition-colors block truncate mb-4"
                    >
                      Contract: {nft.nftContract.slice(0, 10)}...{nft.nftContract.slice(-6)} ↗
                    </a>

                    <div className="flex gap-2">
                      <Link
                        href={`/creator/${nft.creatorUsername}`}
                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold text-center hover:opacity-90 transition-opacity shadow-md"
                      >
                        ดูคอนเทนต์พิเศษ →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              <Link href="/explore" className="border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-8 text-white/20 hover:border-purple-500/30 hover:text-purple-400 transition-all min-h-[200px]">
                <span className="text-3xl mb-2">+</span>
                <p className="text-sm">ค้นหาครีเอเตอร์อื่น</p>
              </Link>
            </>
          )}
        </div>
      )}

      {/* Subscriptions Tab */}
      {!loading && activeTab === 'subscriptions' && (
        <div className="space-y-4">
          {subs.length === 0 ? (
            <div className="text-center py-16 text-white/30">
              <div className="text-4xl mb-3">💵</div>
              <p>ยังไม่มี Subscription ที่ใช้งานอยู่</p>
              <Link href="/explore" className="mt-4 inline-block text-purple-400 text-sm hover:underline">ค้นหาครีเอเตอร์ →</Link>
            </div>
          ) : (
            subs.map((sub) => (
              <div key={sub.subContract} className={`bg-[#13131a] border rounded-2xl p-4 transition-colors ${sub.isActive ? 'border-green-500/20' : 'border-white/5 opacity-60'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
                    {sub.creatorUsername.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">@{sub.creatorUsername}</p>
                    <a href={`https://sepolia.etherscan.io/address/${sub.subContract}`} target="_blank" rel="noopener noreferrer" className="text-white/30 text-xs font-mono hover:text-green-400 transition-colors">
                      {sub.subContract.slice(0, 12)}...
                    </a>
                  </div>
                  <div className={`flex items-center gap-1.5 ${sub.isActive ? 'text-green-400' : 'text-white/30'}`}>
                    <div className={`w-2 h-2 rounded-full ${sub.isActive ? 'bg-green-400' : 'bg-white/20'}`} />
                    <span className="text-xs">{sub.isActive ? 'ใช้งานอยู่' : 'หมดอายุ'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <p className="text-white/30 text-xs">รายเดือน</p>
                    <p className="text-green-400 font-mono font-bold text-sm">${formatUSDC(sub.monthlyPrice)}</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs">ฝากไว้</p>
                    <p className="text-white font-bold text-sm">${formatUSDC(sub.deposited)}</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs">เหลือ</p>
                    <p className="text-yellow-400 font-bold text-sm">{remainingMonths(sub)} เดือน</p>
                  </div>
                </div>

                {sub.isActive && (
                  <div className="mb-4">
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                        style={{ width: `${Math.min(100, (remainingMonths(sub) / 12) * 100)}%` }}
                      />
                    </div>
                    <p className="text-white/20 text-[10px] mt-1">หมดอายุ: {expiryDate(sub)}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Link href={`/creator/${sub.creatorUsername}`} className="flex-1 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs text-center hover:bg-green-500/20 transition-colors">
                    ดูคอนเทนต์
                  </Link>
                  {sub.isActive && remainingMonths(sub) > 0 && (
                    <button
                      onClick={() => handleCancel(sub)}
                      disabled={cancellingFor === sub.subContract}
                      className="flex-1 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors disabled:opacity-40"
                    >
                      {cancellingFor === sub.subContract ? 'กำลังยกเลิก...' : 'ยกเลิก + รับเงินคืน'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
