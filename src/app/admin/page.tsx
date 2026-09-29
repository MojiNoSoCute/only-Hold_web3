'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import {
  isAdmin,
  getAdminCreators, saveAdminCreators, addAdminCreator, updateAdminCreator, deleteAdminCreator,
  getAdminContent, addAdminContent, updateAdminContent, deleteAdminContent,
  resetAdminData, ADMIN_ADDRESS,
} from '@/lib/adminData';
import type { Creator, Content } from '@/lib/types';
import WalletModal from '@/components/WalletModal';
import Link from 'next/link';

const CATEGORIES = ['art','music','fitness','gaming','education','lifestyle','photography','writing'];
const CONTENT_TYPES = ['video','image','audio','text'] as const;

// ─── blank templates ────────────────────────────────────────────────────────

const blankCreator = (): Omit<Creator,'id'> => ({
  address: '',
  name: '',
  username: '',
  avatar: '',
  coverImage: '',
  bio: '',
  category: 'art',
  totalSubscribers: 0,
  totalEarnings: '0',
  isVerified: false,
  nftPrice: '',
  stablecoinPrice: '',
  contentCount: 0,
  joinedAt: new Date().toISOString().split('T')[0],
  socialLinks: {},
});

const blankContent = (): Omit<Content,'id'> => ({
  creatorId: '',
  creatorName: '',
  creatorAvatar: '',
  creatorUsername: '',
  title: '',
  description: '',
  type: 'text',
  thumbnail: '',
  isExclusive: false,
  requiredTier: undefined,
  likes: 0,
  comments: 0,
  createdAt: new Date().toISOString().split('T')[0],
  tags: [],
});

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { isConnected, address } = useWeb3();
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [tab, setTab] = useState<'creators' | 'content'>('creators');

  // data
  const [creators, setCreators] = useState<Creator[]>([]);
  const [content, setContent] = useState<Content[]>([]);

  // modals
  const [creatorModal, setCreatorModal] = useState<{ mode: 'add' | 'edit'; data: Creator } | null>(null);
  const [contentModal, setContentModal] = useState<{ mode: 'add' | 'edit'; data: Content } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'creator' | 'content'; id: string; name: string } | null>(null);

  const [saved, setSaved] = useState(false);

  const adminOk = isConnected && isAdmin(address);

  // load from localStorage
  useEffect(() => {
    if (!adminOk) return;
    setCreators(getAdminCreators());
    setContent(getAdminContent());
  }, [adminOk]);

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  // ── Creator actions ────────────────────────────────────────────────────────

  const openAddCreator = () => setCreatorModal({
    mode: 'add',
    data: { id: `c_${Date.now()}`, ...blankCreator() },
  });

  const openEditCreator = (c: Creator) => setCreatorModal({ mode: 'edit', data: { ...c } });

  const saveCreator = () => {
    if (!creatorModal) return;
    if (creatorModal.mode === 'add') {
      addAdminCreator(creatorModal.data);
      setCreators(getAdminCreators());
    } else {
      updateAdminCreator(creatorModal.data);
      setCreators(getAdminCreators());
    }
    setCreatorModal(null);
    flash();
  };

  const confirmDeleteCreator = (c: Creator) =>
    setConfirmDelete({ type: 'creator', id: c.id, name: c.name });

  // ── Content actions ────────────────────────────────────────────────────────

  const openAddContent = () => {
    const first = creators[0];
    setContentModal({
      mode: 'add',
      data: {
        id: `cnt_${Date.now()}`,
        ...blankContent(),
        creatorId: first?.id ?? '',
        creatorName: first?.name ?? '',
        creatorAvatar: first?.avatar ?? '',
        creatorUsername: first?.username ?? '',
      },
    });
  };

  const openEditContent = (c: Content) => setContentModal({ mode: 'edit', data: { ...c } });

  const saveContent = () => {
    if (!contentModal) return;
    // sync creator info
    const cr = creators.find(c => c.id === contentModal.data.creatorId);
    if (cr) {
      contentModal.data.creatorName    = cr.name;
      contentModal.data.creatorAvatar  = cr.avatar;
      contentModal.data.creatorUsername = cr.username;
    }
    if (contentModal.mode === 'add') {
      addAdminContent(contentModal.data);
    } else {
      updateAdminContent(contentModal.data);
    }
    setContent(getAdminContent());
    setContentModal(null);
    flash();
  };

  // ── Confirm delete ─────────────────────────────────────────────────────────

  const doDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'creator') {
      deleteAdminCreator(confirmDelete.id);
      setCreators(getAdminCreators());
      setContent(getAdminContent()); // content ที่ถูกลบตามไปด้วย
    } else {
      deleteAdminContent(confirmDelete.id);
      setContent(getAdminContent());
    }
    setConfirmDelete(null);
    flash();
  };

  const doReset = () => {
    if (!confirm('รีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้น?')) return;
    resetAdminData();
    setCreators(getAdminCreators());
    setContent(getAdminContent());
    flash();
  };

  // ── Not connected / not admin ──────────────────────────────────────────────

  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">🔐</div>
        <h1 className="text-2xl font-bold text-white mb-2">Admin Panel</h1>
        <p className="text-white/50 mb-8 text-sm">เชื่อมต่อกระเป๋า Admin เพื่อเข้าใช้งาน</p>
        <button onClick={() => setWalletModalOpen(true)} className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition-all">
          เชื่อมต่อกระเป๋า
        </button>
        {walletModalOpen && <WalletModal onClose={() => setWalletModalOpen(false)} />}
      </div>
    );
  }

  if (!adminOk) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-white mb-2">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="text-white/40 text-sm mb-2">กระเป๋าปัจจุบัน:</p>
        <p className="font-mono text-xs text-white/60 mb-4 break-all">{address}</p>
        <p className="text-white/30 text-xs">ต้องใช้ Admin address เท่านั้น</p>
        <p className="font-mono text-xs text-purple-400 mt-1 break-all">{ADMIN_ADDRESS}</p>
        <Link href="/" className="mt-8 inline-block text-purple-400 text-sm hover:underline">← กลับหน้าหลัก</Link>
      </div>
    );
  }

  // ── Admin UI ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">🛠️ Admin Panel</h1>
          <p className="text-white/40 text-xs mt-1 font-mono">{address}</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-green-400 text-sm animate-pulse">✅ บันทึกแล้ว</span>}
          <button onClick={doReset} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors">
            🔄 รีเซ็ต
          </button>
          <Link href="/" className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs hover:bg-white/10 transition-colors">
            ← หน้าหลัก
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/3 border border-white/5 rounded-xl p-1 w-fit mb-8">
        <button onClick={() => setTab('creators')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'creators' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>
          👤 Creators ({creators.length})
        </button>
        <button onClick={() => setTab('content')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'content' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>
          📄 Content ({content.length})
        </button>
      </div>

      {/* ── Creators Tab ── */}
      {tab === 'creators' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="text-white/40 text-sm">{creators.length} creators</p>
            <button onClick={openAddCreator} className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:opacity-90 transition-all">
              + เพิ่ม Creator
            </button>
          </div>
          <div className="space-y-3">
            {creators.map((c) => (
              <div key={c.id} className="flex items-center gap-4 bg-[#13131a] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                <img src={c.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.username}`} alt="" className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{c.name} <span className="text-white/30">@{c.username}</span></p>
                  <p className="text-white/30 text-xs truncate">{c.bio}</p>
                  <div className="flex gap-3 mt-1 text-xs text-white/30">
                    <span className="capitalize">{c.category}</span>
                    {c.nftPrice && <span className="text-purple-400">{c.nftPrice} ETH</span>}
                    {c.stablecoinPrice && <span className="text-green-400">${c.stablecoinPrice}/mo</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditCreator(c)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs hover:bg-white/10 transition-colors">แก้ไข</button>
                  <button onClick={() => confirmDeleteCreator(c)} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors">ลบ</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Content Tab ── */}
      {tab === 'content' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="text-white/40 text-sm">{content.length} posts</p>
            <button onClick={openAddContent} disabled={creators.length === 0} className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40">
              + เพิ่ม Content
            </button>
          </div>
          <div className="space-y-3">
            {content.map((c) => (
              <div key={c.id} className="flex items-start gap-4 bg-[#13131a] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                {c.thumbnail && <img src={c.thumbnail} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{c.title}</p>
                  <p className="text-white/30 text-xs truncate">{c.description}</p>
                  <div className="flex gap-3 mt-1 text-xs text-white/30">
                    <span>@{c.creatorUsername}</span>
                    <span>{c.type}</span>
                    {c.isExclusive && <span className="text-purple-400">🔒 Exclusive</span>}
                    {!c.isExclusive && <span className="text-green-400">🌐 Free</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditContent(c)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs hover:bg-white/10 transition-colors">แก้ไข</button>
                  <button onClick={() => setConfirmDelete({ type: 'content', id: c.id, name: c.title })} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors">ลบ</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Creator Modal ── */}
      {creatorModal && (
        <Modal title={creatorModal.mode === 'add' ? '+ เพิ่ม Creator' : '✏️ แก้ไข Creator'} onClose={() => setCreatorModal(null)} onSave={saveCreator}>
          <div className="space-y-3">
            <Row label="ชื่อ *"><input value={creatorModal.data.name} onChange={e => setCreatorModal(p => p && ({ ...p, data: { ...p.data, name: e.target.value } }))} className={inputCls} placeholder="Aria Nakamura" /></Row>
            <Row label="Username *"><input value={creatorModal.data.username} onChange={e => setCreatorModal(p => p && ({ ...p, data: { ...p.data, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,'') } }))} className={inputCls} placeholder="aria_nft" /></Row>
            <Row label="Wallet address"><input value={creatorModal.data.address} onChange={e => setCreatorModal(p => p && ({ ...p, data: { ...p.data, address: e.target.value } }))} className={inputCls} placeholder="0x..." /></Row>
            <Row label="Bio"><textarea value={creatorModal.data.bio} onChange={e => setCreatorModal(p => p && ({ ...p, data: { ...p.data, bio: e.target.value } }))} className={`${inputCls} resize-none`} rows={2} /></Row>
            <Row label="Category">
              <select value={creatorModal.data.category} onChange={e => setCreatorModal(p => p && ({ ...p, data: { ...p.data, category: e.target.value } }))} className={inputCls}>
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#13131a]">{c}</option>)}
              </select>
            </Row>
            <Row label="Avatar URL"><input value={creatorModal.data.avatar} onChange={e => setCreatorModal(p => p && ({ ...p, data: { ...p.data, avatar: e.target.value } }))} className={inputCls} placeholder="https://..." /></Row>
            <Row label="Cover URL"><input value={creatorModal.data.coverImage} onChange={e => setCreatorModal(p => p && ({ ...p, data: { ...p.data, coverImage: e.target.value } }))} className={inputCls} placeholder="https://..." /></Row>
            <div className="grid grid-cols-2 gap-3">
              <Row label="NFT Price (ETH)"><input type="number" value={creatorModal.data.nftPrice ?? ''} onChange={e => setCreatorModal(p => p && ({ ...p, data: { ...p.data, nftPrice: e.target.value } }))} className={inputCls} placeholder="0.05" step="0.001" /></Row>
              <Row label="Sub Price (USDC/mo)"><input type="number" value={creatorModal.data.stablecoinPrice ?? ''} onChange={e => setCreatorModal(p => p && ({ ...p, data: { ...p.data, stablecoinPrice: e.target.value } }))} className={inputCls} placeholder="10" /></Row>
            </div>
            <Row label="Verified">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={creatorModal.data.isVerified} onChange={e => setCreatorModal(p => p && ({ ...p, data: { ...p.data, isVerified: e.target.checked } }))} className="w-4 h-4 accent-purple-600" />
                <span className="text-white/60 text-sm">Verified Creator</span>
              </label>
            </Row>
          </div>
        </Modal>
      )}

      {/* ── Content Modal ── */}
      {contentModal && (
        <Modal title={contentModal.mode === 'add' ? '+ เพิ่ม Content' : '✏️ แก้ไข Content'} onClose={() => setContentModal(null)} onSave={saveContent}>
          <div className="space-y-3">
            <Row label="Creator *">
              <select value={contentModal.data.creatorId} onChange={e => setContentModal(p => p && ({ ...p, data: { ...p.data, creatorId: e.target.value } }))} className={inputCls}>
                {creators.map(c => <option key={c.id} value={c.id} className="bg-[#13131a]">@{c.username} — {c.name}</option>)}
              </select>
            </Row>
            <Row label="Title *"><input value={contentModal.data.title} onChange={e => setContentModal(p => p && ({ ...p, data: { ...p.data, title: e.target.value } }))} className={inputCls} placeholder="ชื่อโพสต์" /></Row>
            <Row label="Description"><textarea value={contentModal.data.description} onChange={e => setContentModal(p => p && ({ ...p, data: { ...p.data, description: e.target.value } }))} className={`${inputCls} resize-none`} rows={2} /></Row>
            <Row label="Thumbnail URL"><input value={contentModal.data.thumbnail ?? ''} onChange={e => setContentModal(p => p && ({ ...p, data: { ...p.data, thumbnail: e.target.value } }))} className={inputCls} placeholder="https://..." /></Row>
            <div className="grid grid-cols-2 gap-3">
              <Row label="Type">
                <select value={contentModal.data.type} onChange={e => setContentModal(p => p && ({ ...p, data: { ...p.data, type: e.target.value as any } }))} className={inputCls}>
                  {CONTENT_TYPES.map(t => <option key={t} value={t} className="bg-[#13131a]">{t}</option>)}
                </select>
              </Row>
              <Row label="วันที่"><input type="date" value={contentModal.data.createdAt} onChange={e => setContentModal(p => p && ({ ...p, data: { ...p.data, createdAt: e.target.value } }))} className={inputCls} /></Row>
            </div>
            <Row label="Tags (คั่นด้วย comma)">
              <input value={contentModal.data.tags.join(',')} onChange={e => setContentModal(p => p && ({ ...p, data: { ...p.data, tags: e.target.value.split(',').map(t=>t.trim()).filter(Boolean) } }))} className={inputCls} placeholder="art, nft, exclusive" />
            </Row>
            <Row label="Exclusive">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={contentModal.data.isExclusive} onChange={e => setContentModal(p => p && ({ ...p, data: { ...p.data, isExclusive: e.target.checked } }))} className="w-4 h-4 accent-purple-600" />
                <span className="text-white/60 text-sm">เนื้อหาพิเศษ (ต้องสมัครสมาชิก)</span>
              </label>
            </Row>
            {contentModal.data.isExclusive && (
              <Row label="Required Tier">
                <select value={contentModal.data.requiredTier ?? 'both'} onChange={e => setContentModal(p => p && ({ ...p, data: { ...p.data, requiredTier: e.target.value as any } }))} className={inputCls}>
                  <option value="both" className="bg-[#13131a]">🔓 ดูได้ทั้งสองแบบ (NFT หรือ Stablecoin)</option>
                  <option value="nft" className="bg-[#13131a]">🖼️ ผู้ถือ NFT สมาชิกเท่านั้น</option>
                  <option value="stablecoin" className="bg-[#13131a]">💵 สมาชิกรายเดือน Stablecoin เท่านั้น</option>
                </select>
              </Row>
            )}
          </div>
        </Modal>
      )}

      {/* ── Confirm Delete ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative z-10 bg-[#13131a] border border-red-500/30 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-white font-bold mb-2">ยืนยันการลบ</h3>
            <p className="text-white/50 text-sm mb-6">ลบ "<span className="text-white">{confirmDelete.name}</span>"?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors">ยกเลิก</button>
              <button onClick={doDelete} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition-colors">ลบเลย</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared sub-components ──────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50 placeholder-white/20';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-white/50 text-xs block mb-1">{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, onSave, children }: { title: string; onClose: () => void; onSave: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-[#13131a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="text-white font-bold">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 transition-colors">✕</button>
        </div>
        <div className="p-5 max-h-[60vh] overflow-y-auto">{children}</div>
        <div className="flex gap-3 p-5 border-t border-white/5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors">ยกเลิก</button>
          <button onClick={onSave} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:opacity-90 transition-all">💾 บันทึก</button>
        </div>
      </div>
    </div>
  );
}
