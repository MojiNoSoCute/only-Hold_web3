'use client';

import { useState } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import Link from 'next/link';
import WalletModal from '@/components/WalletModal';

const STEPS = [
  { id: 1, title: 'เชื่อมต่อกระเป๋า', icon: '🔌' },
  { id: 2, title: 'โปรไฟล์ครีเอเตอร์', icon: '👤' },
  { id: 3, title: 'เลือกการสร้างรายได้', icon: '💰' },
  { id: 4, title: 'ตรวจสอบและเปิดตัว', icon: '🚀' },
];

export default function BecomeCreatorPage() {
  const { isConnected, address } = useWeb3();
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [step, setStep] = useState(isConnected ? 2 : 1);
  const [launched, setLaunched] = useState(false);

  const [form, setForm] = useState({
    name: '',
    username: '',
    bio: '',
    category: 'art',
    enableNFT: true,
    nftPrice: '0.05',
    enableStablecoin: true,
    stablecoinPrice: '10',
    stablecoin: 'USDC',
  });

  const handleLaunch = async () => {
    // Simulate transaction
    await new Promise((r) => setTimeout(r, 2000));
    setLaunched(true);
  };

  if (launched) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-white mb-3">คุณพร้อมแล้ว!</h1>
        <p className="text-white/60 mb-8">
          โปรไฟล์ครีเอเตอร์ของคุณถูกสร้างบน Blockchain แล้ว เริ่มโพสต์คอนเทนต์พิเศษให้แฟนคลับของคุณได้เลย!
        </p>
        <div className="space-y-3">
          <Link href={`/creator/${form.username || 'my-profile'}`} className="block w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition-all">
            ดูโปรไฟล์ของฉัน
          </Link>
          <Link href="/dashboard" className="block w-full py-3 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition-all">
            ไปที่แดชบอร์ด
          </Link>
        </div>
      </div>
    );
  }

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
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${
                    step > s.id
                      ? 'bg-green-500 text-white'
                      : step === s.id
                      ? 'bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-2 ring-offset-[#0a0a0f]'
                      : 'bg-white/5 text-white/20'
                  }`}
                >
                  {step > s.id ? '✓' : s.icon}
                </div>
                <p className={`text-[10px] mt-1 text-center ${step >= s.id ? 'text-white/60' : 'text-white/20'}`}>
                  {s.title}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 mx-2 mb-4 transition-colors ${step > s.id + 1 ? 'bg-green-500/40' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-[#13131a] border border-white/5 rounded-2xl p-6">
          {/* Step 1: Connect */}
          {step === 1 && (
            <div className="text-center">
              <div className="text-5xl mb-4">🔌</div>
              <h2 className="text-xl font-bold text-white mb-2">เชื่อมต่อกระเป๋าของคุณ</h2>
              <p className="text-white/50 text-sm mb-6">
                ที่อยู่กระเป๋าของคุณจะเป็นตัวตนครีเอเตอร์บน Blockchain
              </p>
              {isConnected ? (
                <div>
                  <p className="text-green-400 text-sm mb-4">✓ เชื่อมต่อแล้ว: {address?.slice(0, 10)}...{address?.slice(-6)}</p>
                  <button onClick={() => setStep(2)} className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition-all">ถัดไป →</button>
                </div>
              ) : (
                <button onClick={() => setWalletModalOpen(true)} className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition-all">
                  เชื่อมต่อกระเป๋า
                </button>
              )}
            </div>
          )}

          {/* Step 2: Profile */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">โปรไฟล์ครีเอเตอร์</h2>
              <div>
                <label className="text-white/60 text-sm block mb-1.5">ชื่อที่แสดง *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น Aria Nakamura" className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-500/50" />
              </div>
              <div>
                <label className="text-white/60 text-sm block mb-1.5">ชื่อผู้ใช้ *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">@</span>
                  <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '') })} placeholder="aria_nft" className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-500/50" />
                </div>
              </div>
              <div>
                <label className="text-white/60 text-sm block mb-1.5">ประวัติโดยย่อ</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="บอกแฟนคลับเกี่ยวกับคอนเทนต์พิเศษที่คุณสร้าง..." rows={3} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-500/50 resize-none" />
              </div>
              <div>
                <label className="text-white/60 text-sm block mb-1.5">หมวดหมู่</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50">
                  {['art', 'music', 'fitness', 'gaming', 'education', 'lifestyle', 'photography', 'writing'].map((c) => (
                    <option key={c} value={c} className="bg-[#13131a] capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 text-sm">← ย้อนกลับ</button>
                <button onClick={() => setStep(3)} disabled={!form.name || !form.username} className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-medium text-sm hover:bg-purple-500 transition-colors disabled:opacity-40">ถัดไป →</button>
              </div>
            </div>
          )}

          {/* Step 3: Monetization */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-white mb-4">เลือกการสร้างรายได้</h2>

              {/* NFT Option */}
              <div className={`border rounded-2xl p-4 transition-all ${form.enableNFT ? 'border-purple-500/40 bg-purple-500/5' : 'border-white/5 bg-white/2'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => setForm({ ...form, enableNFT: !form.enableNFT })} className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${form.enableNFT ? 'bg-purple-600 border-purple-600' : 'border-white/20'}`}>
                      {form.enableNFT && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className="font-bold text-white">🖼️ NFT Membership</span>
                  </label>
                </div>
                {form.enableNFT && (
                  <div>
                    <label className="text-white/50 text-xs block mb-1.5">ราคา Mint (ETH)</label>
                    <input type="number" value={form.nftPrice} onChange={(e) => setForm({ ...form, nftPrice: e.target.value })} step="0.01" min="0.001" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50" />
                    <p className="text-white/30 text-xs mt-1">แฟนคลับจ่ายครั้งเดียวสำหรับสิทธิ์ตลอดชีพ NFT ซื้อขายได้</p>
                  </div>
                )}
              </div>

              {/* Stablecoin Option */}
              <div className={`border rounded-2xl p-4 transition-all ${form.enableStablecoin ? 'border-green-500/40 bg-green-500/5' : 'border-white/5 bg-white/2'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => setForm({ ...form, enableStablecoin: !form.enableStablecoin })} className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${form.enableStablecoin ? 'bg-green-600 border-green-600' : 'border-white/20'}`}>
                      {form.enableStablecoin && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className="font-bold text-white">💵 Stablecoin Subscription</span>
                  </label>
                </div>
                {form.enableStablecoin && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/50 text-xs block mb-1.5">ราคารายเดือน</label>
                      <input type="number" value={form.stablecoinPrice} onChange={(e) => setForm({ ...form, stablecoinPrice: e.target.value })} min="1" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-green-500/50" />
                    </div>
                    <div>
                      <label className="text-white/50 text-xs block mb-1.5">สกุลเงิน</label>
                      <select value={form.stablecoin} onChange={(e) => setForm({ ...form, stablecoin: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none">
                        {['USDC', 'USDT', 'DAI'].map((s) => <option key={s} value={s} className="bg-[#13131a]">{s}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(2)} className="px-5 py-2.5 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 text-sm">← ย้อนกลับ</button>
                <button onClick={() => setStep(4)} disabled={!form.enableNFT && !form.enableStablecoin} className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-medium text-sm hover:bg-purple-500 transition-colors disabled:opacity-40">ถัดไป →</button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">ตรวจสอบและเปิดตัว</h2>
              <div className="bg-white/3 border border-white/5 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-white/50">ชื่อ</span><span className="text-white font-medium">{form.name || 'ยังไม่ได้ตั้ง'}</span></div>
                <div className="flex justify-between"><span className="text-white/50">ชื่อผู้ใช้</span><span className="text-white font-mono">@{form.username || 'not-set'}</span></div>
                <div className="flex justify-between"><span className="text-white/50">หมวดหมู่</span><span className="text-white capitalize">{form.category}</span></div>
                {form.enableNFT && <div className="flex justify-between"><span className="text-white/50">ราคา NFT</span><span className="text-purple-400 font-mono">{form.nftPrice} ETH</span></div>}
                {form.enableStablecoin && <div className="flex justify-between"><span className="text-white/50">สมาชิก</span><span className="text-green-400 font-mono">${form.stablecoinPrice} {form.stablecoin}/เดือน</span></div>}
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-xs text-purple-300">
                <strong>ค่าธรรมเนียมแพลตฟอร์ม:</strong> OnlyHold เก็บ 5% ของรายได้ทั้งหมด คุณเก็บ 95%
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(3)} className="px-5 py-2.5 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 text-sm">← ย้อนกลับ</button>
                <button onClick={handleLaunch} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg">🚀 เปิดตัวโปรไฟล์</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {walletModalOpen && (
        <WalletModal
          onClose={() => {
            setWalletModalOpen(false);
            if (isConnected) setStep(2);
          }}
        />
      )}
    </>
  );
}
