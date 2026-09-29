'use client';

import { useWeb3 } from '@/lib/Web3Provider';
import { useOnlyHold } from '@/lib/useOnlyHold';
import Link from 'next/link';
import WalletModal from '@/components/WalletModal';
import { useState, useEffect } from 'react';
import { formatNumber } from '@/lib/utils';

interface CreatorProfile {
  nftContract: string;
  subscriptionContract: string;
  username: string;
  isActive: boolean;
}

export default function DashboardPage() {
  const { isConnected, address, isWrongNetwork, switchToSepolia } = useWeb3();
  const { FACTORY_ADDRESS, USDC_ADDRESS } = useOnlyHold();
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  // On-chain state
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [pendingEarnings, setPendingEarnings] = useState(0n);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawTxHash, setWithdrawTxHash] = useState('');
  const [error, setError] = useState('');

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
  }, [isConnected, address, FACTORY_ADDRESS]);

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

  // ── Format USDC amount (6 decimals) ─────────────────────────────────────
  const formatUSDC = (raw: bigint) => (Number(raw) / 1_000_000).toFixed(2);

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
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">แดชบอร์ดครีเอเตอร์</h1>
          <p className="text-white/40 text-sm mt-1">@{profile.username} · Sepolia Testnet</p>
        </div>
        <Link
          href={`/creator/${profile.username}`}
          className="px-4 py-2 rounded-xl border border-white/10 text-white/70 text-sm hover:bg-white/5 transition-all"
        >
          ดูโปรไฟล์ →
        </Link>
      </div>

      {/* Wrong network */}
      {isWrongNetwork && (
        <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-between">
          <span className="text-yellow-400 text-sm">⚠️ สลับไป Sepolia เพื่อ Withdraw</span>
          <button onClick={switchToSepolia} className="px-4 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-sm hover:bg-yellow-500/30 transition-colors">สลับเลย</button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Earnings Card ── */}
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

        {/* ── Contracts Card ── */}
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

        {/* ── Quick Actions ── */}
        <div className="space-y-4">
          <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5">
            <h3 className="font-bold text-white mb-4">⚡ Quick Actions</h3>
            <div className="space-y-2">
              {[
                { icon: '👤', label: 'ดูโปรไฟล์', href: `/creator/${profile.username}` },
                { icon: '🔍', label: 'สำรวจครีเอเตอร์อื่น', href: '/explore' },
                { icon: '🌐', label: 'ดูบน Etherscan', href: `https://sepolia.etherscan.io/address/${address}`, external: true },
              ].map((action) => (
                action.external ? (
                  <a
                    key={action.label}
                    href={action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <span className="text-base">{action.icon}</span>
                    <span className="text-sm text-white/70 group-hover:text-white transition-colors">{action.label}</span>
                    <svg className="w-4 h-4 text-white/20 group-hover:text-white/50 ml-auto transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 5l7 7-7 7" /></svg>
                  </a>
                ) : (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <span className="text-base">{action.icon}</span>
                    <span className="text-sm text-white/70 group-hover:text-white transition-colors">{action.label}</span>
                    <svg className="w-4 h-4 text-white/20 group-hover:text-white/50 ml-auto transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 5l7 7-7 7" /></svg>
                  </Link>
                )
              ))}
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-5">
            <h3 className="font-bold text-purple-300 text-sm mb-2">💡 เคล็ดลับ</h3>
            <p className="text-white/50 text-xs leading-relaxed">
              แฟนคลับต้องไป Faucet Mock USDC ก่อนสมัคร Subscription เรียก <code className="text-purple-300">faucet()</code> บนสัญญา MockUSDC บน Sepolia Etherscan
            </p>
            <a
              href={`https://sepolia.etherscan.io/address/${USDC_ADDRESS}#writeContract`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-xs text-purple-400 hover:underline"
            >
              MockUSDC Faucet →
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
