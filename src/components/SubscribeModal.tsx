'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { useOnlyHold } from '@/lib/useOnlyHold';
import { useChainData } from '@/lib/useChainData';
import WalletModal from './WalletModal';

interface SubscribeModalProps {
  creatorId: string;
  creatorName: string;
  onClose: () => void;
}

type Tab = 'nft' | 'stablecoin';

export default function SubscribeModal({ creatorId, creatorName, onClose }: SubscribeModalProps) {
  const { isConnected, address, isWrongNetwork, switchToSepolia } = useWeb3();
  const { mintNFT, subscribeWithStablecoin, resolveUsername, isLoading } = useOnlyHold();
  const { creators } = useChainData();

  const [activeTab, setActiveTab] = useState<Tab>('nft');
  const [months, setMonths] = useState(1);
  const [txSuccess, setTxSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  // Resolved on-chain contract addresses for this creator
  const [nftContract, setNftContract] = useState('');
  const [subContract, setSubContract] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState(0n);

  const creator = creators.find(
    (c) =>
      c &&
      creatorId &&
      ((c.id && c.id.toLowerCase() === creatorId.toLowerCase()) ||
        (c.username && c.username.toLowerCase() === creatorId.toLowerCase()))
  ) || {
    id: creatorId,
    username: creatorId,
    name: creatorName,
    nftPrice: '0.05',
    stablecoinPrice: '10',
  };

  const stablecoinTotal = parseFloat(creator.stablecoinPrice || '0') * months;

  // ── Resolve creator contracts on-chain ──────────────────────────────────
  useEffect(() => {
    resolveUsername(creator.username).then((res) => {
      if (res && res.nftContract && res.nftContract !== '0x0000000000000000000000000000000000000000') {
        setNftContract(res.nftContract);
        setSubContract(res.subContract);
      } else if ((creator as any).nftContractAddress) {
        setNftContract((creator as any).nftContractAddress);
      }
    });
  }, [creator, resolveUsername]);

  // ── Resolve monthly price from contract ─────────────────────────────────
  useEffect(() => {
    if (!subContract) return;
    const { ethers } = require('ethers');
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const sub = new ethers.Contract(
      subContract,
      ['function monthlyPrice() view returns (uint256)'],
      provider
    );
    sub.monthlyPrice().then(setMonthlyPrice).catch(console.error);
  }, [subContract]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleMintNFT = async () => {
    if (!isConnected) { setWalletModalOpen(true); return; }
    if (isWrongNetwork) { await switchToSepolia(); return; }

    const targetContract = nftContract || (creator as any).nftContractAddress;
    if (!targetContract || targetContract === '0x0000000000000000000000000000000000000000') {
      // Off-chain simulated NFT minting
      try {
        const creatorAddr = ((creator as any).address || creator.id || creator.username || '').toLowerCase();
        if (creatorAddr) {
          const key = `onlyhold_pending_${creatorAddr}`;
          const currentPending = parseFloat(localStorage.getItem(key) || '0');
          const addedValue = parseFloat(creator.nftPrice || '0.01') * 3000 || 30; // approx USD value
          localStorage.setItem(key, (currentPending + addedValue).toFixed(2));
        }

        const subKey = 'onlyhold_local_subscriptions';
        const existingSubs = JSON.parse(localStorage.getItem(subKey) || '[]');
        existingSubs.push({
          creatorId: creator.id || creator.username,
          subscriberAddress: address,
          type: 'nft',
          startDate: new Date().toISOString(),
        });
        localStorage.setItem(subKey, JSON.stringify(existingSubs));

        setTxHash(`simulated_nft_${Date.now()}`);
        setTxSuccess(true);
        return;
      } catch {
        setError('เกิดข้อผิดพลาดในการทำรายการ');
        return;
      }
    }

    setError('');
    const result = await mintNFT(targetContract, creator.nftPrice || '0.05');
    if (result.success) {
      setTxHash(result.hash ?? '');
      setTxSuccess(true);
    } else {
      setError(result.error ?? 'เกิดข้อผิดพลาดในการ Mint NFT');
    }
  };

  const handleSubscribe = async () => {
    if (!isConnected) { setWalletModalOpen(true); return; }
    if (isWrongNetwork) { await switchToSepolia(); return; }

    if (!subContract || subContract === '0x0000000000000000000000000000000000000000') {
      // Off-chain simulated stablecoin subscription
      try {
        const creatorAddr = ((creator as any).address || creator.id || creator.username || '').toLowerCase();
        if (creatorAddr) {
          const key = `onlyhold_pending_${creatorAddr}`;
          const currentPending = parseFloat(localStorage.getItem(key) || '0');
          const addedValue = stablecoinTotal || 10;
          localStorage.setItem(key, (currentPending + addedValue).toFixed(2));
        }

        const subKey = 'onlyhold_local_subscriptions';
        const existingSubs = JSON.parse(localStorage.getItem(subKey) || '[]');
        existingSubs.push({
          creatorId: creator.id || creator.username,
          subscriberAddress: address,
          type: 'stablecoin',
          startDate: new Date().toISOString(),
          months,
        });
        localStorage.setItem(subKey, JSON.stringify(existingSubs));

        setTxHash(`simulated_sub_${Date.now()}`);
        setTxSuccess(true);
        return;
      } catch {
        setError('เกิดข้อผิดพลาดในการทำรายการ');
        return;
      }
    }

    if (monthlyPrice === 0n) { setError('กำลังโหลดราคา กรุณารอสักครู่'); return; }

    setError('');
    const result = await subscribeWithStablecoin(subContract, months, monthlyPrice);
    if (result.success) {
      setTxHash(result.hash ?? '');
      setTxSuccess(true);
    } else {
      setError(result.error ?? 'เกิดข้อผิดพลาด');
    }
  };

  // ── Success screen ───────────────────────────────────────────────────────

  if (txSuccess) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 w-full max-w-sm bg-[#13131a] border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4 text-3xl">🎉</div>
          <h2 className="text-xl font-bold text-white mb-2">เข้าร่วมแล้ว!</h2>
          <p className="text-white/60 text-sm mb-4">
            {activeTab === 'nft'
              ? `NFT สมาชิก ${creatorName} ของคุณถูก Mint แล้ว`
              : `คุณสมัครสมาชิก ${creatorName} เป็นเวลา ${months} เดือนแล้ว`}
          </p>
          {txHash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-purple-400 hover:text-purple-300 mb-6 truncate"
            >
              ดู Transaction บน Etherscan →
            </a>
          )}
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:opacity-90 transition-opacity">
            ดูคอนเทนต์พิเศษ
          </button>
        </div>
      </div>
    );
  }

  // ── Main modal ───────────────────────────────────────────────────────────

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <div className="relative z-10 w-full max-w-md bg-[#13131a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-white text-lg">สมัครสมาชิก {creatorName}</h2>
                <p className="text-white/40 text-sm mt-0.5">เลือกวิธีการเข้าถึง</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 transition-colors">✕</button>
            </div>
          </div>

          {/* Wrong network warning */}
          {isWrongNetwork && (
            <div className="mx-4 mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-between">
              <span className="text-yellow-400 text-xs">⚠️ สลับไป Sepolia Testnet ก่อน</span>
              <button onClick={switchToSepolia} className="text-xs px-3 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors">สลับ</button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex p-1.5 m-4 bg-white/3 rounded-xl border border-white/5">
            <button onClick={() => setActiveTab('nft')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'nft' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}>
              🖼️ ถือ NFT
            </button>
            <button onClick={() => setActiveTab('stablecoin')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'stablecoin' ? 'bg-green-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}>
              💵 Stablecoin
            </button>
          </div>

          <div className="px-4 pb-4">
            {/* Error */}
            {error && (
              <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                ❌ {error}
              </div>
            )}

            {activeTab === 'nft' ? (
              /* ── NFT Tab ── */
              <div className="space-y-4">
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-xl flex-shrink-0">🎫</div>
                    <div>
                      <h3 className="font-bold text-white text-sm">NFT สมาชิก {creatorName}</h3>
                      <p className="text-white/50 text-xs mt-1">Mint NFT ที่มอบสิทธิ์เข้าถึงตลอดชีพ ซื้อขายหรือโอนสมาชิกภาพได้ทุกเมื่อ</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between py-2 border-t border-purple-500/20">
                    <span className="text-white/50 text-sm">ราคา Mint</span>
                    <span className="text-purple-300 font-bold">{creator.nftPrice} ETH</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {['เข้าถึงคอนเทนต์พิเศษตลอดชีพ', 'ซื้อขายได้บน OpenSea และ marketplace อื่นๆ', 'เข้าร่วมชุมชน token-gated', 'สิทธิ์เข้าถึงก่อนใครสำหรับ drops ใหม่'].map((b) => (
                    <div key={b} className="flex items-center gap-2 text-white/60">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {b}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleMintNFT}
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" /></svg>กำลัง Mint NFT...</>
                  ) : !isConnected ? 'เชื่อมต่อกระเป๋าเพื่อ Mint'
                  : isWrongNetwork ? 'สลับไป Sepolia ก่อน'
                  : `Mint ในราคา ${creator.nftPrice} ETH`}
                </button>
              </div>
            ) : (
              /* ── Stablecoin Tab ── */
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-xl flex-shrink-0">💰</div>
                    <div>
                      <h3 className="font-bold text-white text-sm">ฝากและสมัครสมาชิก</h3>
                      <p className="text-white/50 text-xs mt-1">ฝาก USDC การเข้าถึงจะใช้งานได้ตลอดที่ยอดเงินครอบคลุมค่าสมาชิก ถอนได้ทุกเมื่อ</p>
                    </div>
                  </div>
                </div>

                {/* Months selector */}
                <div>
                  <label className="text-white/60 text-sm mb-2 block">เลือกระยะเวลา</label>
                  <div className="flex gap-2">
                    {[1, 3, 6, 12].map((m) => (
                      <button key={m} onClick={() => setMonths(m)} className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${months === m ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-white/3 border-white/10 text-white/40 hover:border-white/20'}`}>
                        {m} เดือน
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-white/3 border border-white/5 rounded-xl p-3 space-y-2 text-sm">
                  <div className="flex justify-between text-white/50">
                    <span>ราคา</span>
                    <span>${creator.stablecoinPrice} USDC/เดือน</span>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span>ระยะเวลา</span>
                    <span>{months} เดือน</span>
                  </div>
                  <div className="border-t border-white/5 pt-2 flex justify-between text-white font-bold">
                    <span>ยอดฝากรวม</span>
                    <span className="text-green-400">${stablecoinTotal} USDC</span>
                  </div>
                </div>

                <button
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" /></svg>กำลังฝาก USDC...</>
                  ) : !isConnected ? 'เชื่อมต่อกระเป๋า'
                  : isWrongNetwork ? 'สลับไป Sepolia ก่อน'
                  : `ฝาก $${stablecoinTotal} USDC`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {walletModalOpen && <WalletModal onClose={() => setWalletModalOpen(false)} />}
    </>
  );
}
