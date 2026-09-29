'use client';

import { useState } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { useOnlyHold } from '@/lib/useOnlyHold';
import Link from 'next/link';
import WalletModal from '@/components/WalletModal';

const STEPS = [
  { id: 1, title: 'เชื่อมต่อกระเป๋า', icon: '🔌' },
  { id: 2, title: 'โปรไฟล์ครีเอเตอร์', icon: '👤' },
  { id: 3, title: 'เลือกการสร้างรายได้', icon: '💰' },
  { id: 4, title: 'ตรวจสอบและเปิดตัว', icon: '🚀' },
];

const CATEGORIES = [
  { value: 'art', label: 'ศิลปะ' },
  { value: 'music', label: 'ดนตรี' },
  { value: 'fitness', label: 'ฟิตเนส' },
  { value: 'gaming', label: 'เกม' },
  { value: 'education', label: 'การศึกษา' },
  { value: 'lifestyle', label: 'ไลฟ์สไตล์' },
  { value: 'photography', label: 'ถ่ายภาพ' },
  { value: 'writing', label: 'งานเขียน' },
];

export default function BecomeCreatorPage() {
  const { isConnected, address, isWrongNetwork, switchToSepolia } = useWeb3();
  const { registerCreator, isLoading } = useOnlyHold();

  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [step, setStep] = useState(isConnected ? 2 : 1);
  const [launched, setLaunched] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [nftContractAddress, setNftContractAddress] = useState('');
  const [subContractAddress, setSubContractAddress] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    username: '',
    bio: '',
    category: 'art',
    enableNFT: true,
    nftPrice: '0.05',
    enableStablecoin: true,
    stablecoinPrice: '10',
  });

  // ── Launch handler — calls real contract ──────────────────────────────

  const handleLaunch = async () => {
    if (!isConnected) { setWalletModalOpen(true); return; }
    if (isWrongNetwork) { await switchToSepolia(); return; }

    setError('');

    // ── ตรวจสอบก่อนว่า address นี้ register ไปแล้วหรือยัง ──────────────
    try {
      const { ethers } = require('ethers');
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const factory = new ethers.Contract(
        process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? '',
        ['function isRegistered(address) view returns (bool)'],
        provider
      );
      const alreadyRegistered = await factory.isRegistered(address);
      if (alreadyRegistered) {
        setError('กระเป๋านี้ได้ลงทะเบียนเป็นครีเอเตอร์ไปแล้ว ไม่สามารถสมัครซ้ำได้ ไปที่ Dashboard เพื่อจัดการโปรไฟล์ของคุณ');
        return;
      }
    } catch (e) {
      // ถ้าเช็คไม่ได้ ให้ผ่าน (contract จะ revert เองถ้าซ้ำ)
    }

    // monthlyPrice: stablecoinPrice ดอลลาร์ → base units (6 decimals = USDC)
    const monthlyPriceUnits = BigInt(Math.round(parseFloat(form.stablecoinPrice) * 1_000_000));

    const result = await registerCreator({
      username: form.username,
      metadataURI: `ipfs://onlyhold/${form.username}`,
      enableNFT: form.enableNFT,
      nftName: `${form.name} NFT`,
      nftSymbol: form.username.slice(0, 5).toUpperCase(),
      nftMintPrice: form.nftPrice,
      nftMaxSupply: 0,
      nftBaseURI: `ipfs://onlyhold/${form.username}/nft/`,
      enableSub: form.enableStablecoin,
      monthlyPrice: form.enableStablecoin ? monthlyPriceUnits : 0n,
    });

    if (result.success) {
      setTxHash(result.hash ?? '');
      setNftContractAddress(result.nftContract ?? '');
      setSubContractAddress(result.subContract ?? '');
      setLaunched(true);
    } else {
      // แปล error จาก contract ให้อ่านง่าย
      const raw = result.error ?? '';
      if (raw.includes('AlreadyRegistered') || raw.includes('require(false)')) {
        setError('กระเป๋านี้ลงทะเบียนเป็นครีเอเตอร์ไปแล้ว ไปที่ Dashboard เพื่อจัดการโปรไฟล์');
      } else if (raw.includes('UsernameTaken')) {
        setError('ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว กรุณาเลือกชื่อใหม่');
      } else if (raw.includes('InvalidUsername')) {
        setError('ชื่อผู้ใช้ไม่ถูกต้อง ใช้ได้เฉพาะตัวอักษร a-z, 0-9 และ _ เท่านั้น');
      } else if (raw.includes('MustEnableAtLeastOne')) {
        setError('ต้องเลือกอย่างน้อย 1 ระบบ (NFT หรือ Stablecoin)');
      } else if (raw.includes('user rejected') || raw.includes('ACTION_REJECTED')) {
        setError('ยกเลิก Transaction');
      } else if (raw.includes('insufficient funds')) {
        setError('ETH ไม่เพียงพอสำหรับค่า Gas กรุณาไป Faucet Sepolia ETH ก่อน');
      } else {
        setError(raw || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    }
  };

  // ── Success screen ────────────────────────────────────────────────────

  if (launched) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-white mb-3">คุณพร้อมแล้ว!</h1>
        <p className="text-white/60 mb-6">
          โปรไฟล์ครีเอเตอร์ของคุณถูกสร้างบน Sepolia Testnet แล้ว เริ่มโพสต์คอนเทนต์พิเศษให้แฟนคลับได้เลย!
        </p>

        {/* TX details */}
        <div className="bg-white/3 border border-white/5 rounded-xl p-4 mb-6 text-left space-y-2 text-xs">
          {txHash && (
            <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-purple-400 hover:text-purple-300">
              <span>Transaction</span><span className="font-mono">{txHash.slice(0, 12)}...{txHash.slice(-6)} →</span>
            </a>
          )}
          {nftContractAddress && (
            <a href={`https://sepolia.etherscan.io/address/${nftContractAddress}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-blue-400 hover:text-blue-300">
              <span>NFT Contract</span><span className="font-mono">{nftContractAddress.slice(0, 10)}...{nftContractAddress.slice(-6)} →</span>
            </a>
          )}
          {subContractAddress && (
            <a href={`https://sepolia.etherscan.io/address/${subContractAddress}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-green-400 hover:text-green-300">
              <span>Subscription Contract</span><span className="font-mono">{subContractAddress.slice(0, 10)}...{subContractAddress.slice(-6)} →</span>
            </a>
          )}
        </div>

        <div className="space-y-3">
          <Link href={`/creator/${form.username}`} className="block w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition-all">
            ดูโปรไฟล์ของฉัน
          </Link>
          <Link href="/dashboard" className="block w-full py-3 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition-all">
            ไปที่แดชบอร์ด
          </Link>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">เป็นครีเอเตอร์</h1>
          <p className="text-white/50">ตั้งค่าโปรไฟล์ครีเอเตอร์บน Blockchain ได้ภายในไม่กี่นาที</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-10 px-4">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className={`flex flex-col items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${step > s.id ? 'bg-green-500 text-white' : step === s.id ? 'bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-2 ring-offset-[#0a0a0f]' : 'bg-white/5 text-white/20'}`}>
                  {step > s.id ? '✓' : s.icon}
                </div>
                <p className={`text-[10px] mt-1 text-center ${step >= s.id ? 'text-white/60' : 'text-white/20'}`}>{s.title}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 mx-2 mb-4 transition-colors ${step > s.id + 1 ? 'bg-green-500/40' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-[#13131a] border border-white/5 rounded-2xl p-6">

          {/* ── Step 1: Connect ── */}
          {step === 1 && (
            <div className="text-center">
              <div className="text-5xl mb-4">🔌</div>
              <h2 className="text-xl font-bold text-white mb-2">เชื่อมต่อกระเป๋าของคุณ</h2>
              <p className="text-white/50 text-sm mb-6">ที่อยู่กระเป๋าของคุณจะเป็นตัวตนครีเอเตอร์บน Sepolia Testnet</p>
              {isConnected ? (
                <div>
                  <p className="text-green-400 text-sm mb-2">✓ เชื่อมต่อแล้ว: {address?.slice(0, 10)}...{address?.slice(-6)}</p>
                  {isWrongNetwork && (
                    <p className="text-yellow-400 text-xs mb-4">⚠️ กรุณาสลับไป Sepolia ก่อน
                      <button onClick={switchToSepolia} className="ml-2 underline">สลับเลย</button>
                    </p>
                  )}
                  <button onClick={() => setStep(2)} disabled={isWrongNetwork} className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-40">ถัดไป →</button>
                </div>
              ) : (
                <button onClick={() => setWalletModalOpen(true)} className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition-all">
                  เชื่อมต่อกระเป๋า
                </button>
              )}
            </div>
          )}

          {/* ── Step 2: Profile ── */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">โปรไฟล์ครีเอเตอร์</h2>
              <div>
                <label className="text-white/60 text-sm block mb-1.5">ชื่อที่แสดง *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น Aria Nakamura" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-500/50" />
              </div>
              <div>
                <label className="text-white/60 text-sm block mb-1.5">ชื่อผู้ใช้ * <span className="text-white/30">(ใช้ตัวอักษรภาษาอังกฤษและ _ เท่านั้น)</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">@</span>
                  <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} placeholder="aria_nft" className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-500/50" />
                </div>
              </div>
              <div>
                <label className="text-white/60 text-sm block mb-1.5">ประวัติโดยย่อ</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="บอกแฟนคลับเกี่ยวกับคอนเทนต์พิเศษที่คุณสร้าง..." rows={3} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-500/50 resize-none" />
              </div>
              <div>
                <label className="text-white/60 text-sm block mb-1.5">หมวดหมู่</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50">
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value} className="bg-[#13131a]">{c.label}</option>)}
                </select>
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 text-sm">← ย้อนกลับ</button>
                <button onClick={() => setStep(3)} disabled={!form.name || !form.username} className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-medium text-sm hover:bg-purple-500 transition-colors disabled:opacity-40">ถัดไป →</button>
              </div>
            </div>
          )}

          {/* ── Step 3: Monetization ── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-white mb-4">เลือกการสร้างรายได้</h2>

              {/* NFT */}
              <div className={`border rounded-2xl p-4 transition-all ${form.enableNFT ? 'border-purple-500/40 bg-purple-500/5' : 'border-white/5'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div onClick={() => setForm({ ...form, enableNFT: !form.enableNFT })} className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-all ${form.enableNFT ? 'bg-purple-600 border-purple-600' : 'border-white/20'}`}>
                    {form.enableNFT && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="font-bold text-white">🖼️ NFT Membership</span>
                </div>
                {form.enableNFT && (
                  <div>
                    <label className="text-white/50 text-xs block mb-1.5">ราคา Mint (ETH บน Sepolia)</label>
                    <input type="number" value={form.nftPrice} onChange={(e) => setForm({ ...form, nftPrice: e.target.value })} step="0.001" min="0.001" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50" />
                    <p className="text-white/30 text-xs mt-1">แฟนคลับจ่ายครั้งเดียวสำหรับสิทธิ์ตลอดชีพ NFT ซื้อขายได้</p>
                  </div>
                )}
              </div>

              {/* Stablecoin */}
              <div className={`border rounded-2xl p-4 transition-all ${form.enableStablecoin ? 'border-green-500/40 bg-green-500/5' : 'border-white/5'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div onClick={() => setForm({ ...form, enableStablecoin: !form.enableStablecoin })} className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-all ${form.enableStablecoin ? 'bg-green-600 border-green-600' : 'border-white/20'}`}>
                    {form.enableStablecoin && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="font-bold text-white">💵 Stablecoin Subscription (Mock USDC)</span>
                </div>
                {form.enableStablecoin && (
                  <div>
                    <label className="text-white/50 text-xs block mb-1.5">ราคารายเดือน (USD)</label>
                    <input type="number" value={form.stablecoinPrice} onChange={(e) => setForm({ ...form, stablecoinPrice: e.target.value })} min="1" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-green-500/50" />
                    <p className="text-white/30 text-xs mt-1">ใช้ Mock USDC บน Sepolia testnet</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(2)} className="px-5 py-2.5 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 text-sm">← ย้อนกลับ</button>
                <button onClick={() => setStep(4)} disabled={!form.enableNFT && !form.enableStablecoin} className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-medium text-sm hover:bg-purple-500 transition-colors disabled:opacity-40">ถัดไป →</button>
              </div>
            </div>
          )}

          {/* ── Step 4: Review & Launch ── */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">ตรวจสอบและเปิดตัว</h2>

              <div className="bg-white/3 border border-white/5 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-white/50">ชื่อ</span><span className="text-white font-medium">{form.name}</span></div>
                <div className="flex justify-between"><span className="text-white/50">ชื่อผู้ใช้</span><span className="text-white font-mono">@{form.username}</span></div>
                <div className="flex justify-between"><span className="text-white/50">หมวดหมู่</span><span className="text-white">{CATEGORIES.find(c => c.value === form.category)?.label}</span></div>
                {form.enableNFT && <div className="flex justify-between"><span className="text-white/50">ราคา NFT</span><span className="text-purple-400 font-mono">{form.nftPrice} ETH</span></div>}
                {form.enableStablecoin && <div className="flex justify-between"><span className="text-white/50">สมาชิกรายเดือน</span><span className="text-green-400 font-mono">${form.stablecoinPrice} USDC</span></div>}
                <div className="flex justify-between"><span className="text-white/50">Network</span><span className="text-yellow-400">Sepolia Testnet</span></div>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-xs text-purple-300">
                <strong>ค่าธรรมเนียมแพลตฟอร์ม:</strong> OnlyHold เก็บ 5% ของรายได้ทั้งหมด คุณเก็บ 95%
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  ❌ {error}
                  {(error.includes('ลงทะเบียน') || error.includes('ไปแล้ว')) && (
                    <div className="mt-2">
                      <a href="/dashboard" className="inline-block px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs hover:bg-purple-500 transition-colors">
                        ไปที่ Dashboard →
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(3)} className="px-5 py-2.5 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 text-sm">← ย้อนกลับ</button>
                <button
                  onClick={handleLaunch}
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? (
                    <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" /></svg>กำลัง Deploy...</>
                  ) : '🚀 เปิดตัวโปรไฟล์'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {walletModalOpen && (
        <WalletModal onClose={() => { setWalletModalOpen(false); if (isConnected) setStep(2); }} />
      )}
    </>
  );
}
