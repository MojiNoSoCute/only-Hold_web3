'use client';

/**
 * adminData.ts — Admin data store & seed content provider
 */

import type { Creator, Content } from './types';

// ─── Admin address ─────────────────────────────────────────────────────────

export const ADMIN_ADDRESS = '0x2bB2A9aB6e9fe4d3C8990aD10e247C830A0b9776';

export function isAdmin(address: string | null | undefined): boolean {
  if (!address) return false;
  return address.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
}

// ─── localStorage keys ──────────────────────────────────────────────────────

const KEY_CREATORS = 'onlyhold_mock_creators';
const KEY_CONTENT  = 'onlyhold_mock_content';

// ─── Default Seed Content for Creators ──────────────────────────────────────

export const DEFAULT_SEED_CONTENT: Content[] = [
  // Yumi Posts
  {
    id: 'c_yumi_1',
    creatorId: 'yumi',
    creatorName: 'Yumi',
    creatorUsername: 'yumi',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop',
    title: 'เล่นเกมคุยกับแฟนคลับยามดึก 🎮✨',
    description: 'วันนี้มาสตรีมเกมผ่อนคลาย ขอบคุณทุกคนที่เข้ามาคุยกันนะคะ! ใครถือ NFT รับวอลเปเปอร์แจกฟรีไปเลย 💖',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop',
    type: 'image',
    isExclusive: false,
    likes: 42,
    comments: 5,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    tags: ['gaming', 'lifestyle', 'stream'],
  },
  {
    id: 'c_yumi_2',
    creatorId: 'yumi',
    creatorName: 'Yumi',
    creatorUsername: 'yumi',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop',
    title: '🔒 Exclusive Behind The Scenes Vlog & Setup Photo',
    description: 'พรีวิวโต๊ะคอมใหม่พร้อมเบื้องหลังการจัดไฟสตรีมเฉพาะสมาชิก NFT & Subscription เท่านั้นค่ะ!',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop',
    type: 'image',
    isExclusive: true,
    requiredTier: 'nft',
    likes: 89,
    comments: 12,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    tags: ['exclusive', 'vlog', 'setup'],
  },

  // Moji Posts
  {
    id: 'c_moji_1',
    creatorId: 'moji',
    creatorName: 'Moji',
    creatorUsername: 'moji',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop',
    title: '🎨 New Digital NFT Artwork: "Cyber Horizon"',
    description: 'ผลงานดิจิทัลอาร์ตชิ้นใหม่ล่าสุดในแนว Cyberpunk Futuristic หวังว่าทุกคนจะชอบงานชิ้นนี้นะครับ! สามารถรับชมและสะสมภาพความละเอียดสูงได้ฟรีสำหรับผู้ถือ NFT',
    thumbnail: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&auto=format&fit=crop',
    type: 'image',
    isExclusive: false,
    likes: 65,
    comments: 8,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    tags: ['art', 'nft', 'cyberpunk'],
  },
  {
    id: 'c_moji_2',
    creatorId: 'moji',
    creatorName: 'Moji',
    creatorUsername: 'moji',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop',
    title: '🔒 Speed Painting Video & Brush Preset Pack (NFT Exclusive)',
    description: 'วิดีโอแสดงขั้นตอนการวาดภาพตั้งแต่ร่างภาพจนถึงเก็บรายละเอียด พร้อมแจก Brush Preset สำหรับ Photoshop/Procreate ฟรีเฉพาะผู้ถือ NFT ครับ!',
    thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop',
    type: 'video',
    isExclusive: true,
    requiredTier: 'nft',
    likes: 120,
    comments: 19,
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    tags: ['exclusive', 'tutorial', 'brushpack'],
  },

  // Asdf Posts
  {
    id: 'c_asdf_1',
    creatorId: 'asdf',
    creatorName: 'Asdf Music',
    creatorUsername: 'asdf',
    creatorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop',
    title: '🎵 New Beat Drop: "Midnight Neon Session"',
    description: 'เพิ่งทำบีท Lo-Fi Synthwave เสร็จเมื่อคืน ลองฟังตัวอย่างสั้นๆ กันได้เลยครับ สามารถใช้เป็นเพลงประกอบฟรี!',
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&auto=format&fit=crop',
    type: 'audio',
    isExclusive: false,
    likes: 54,
    comments: 6,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    tags: ['music', 'lofi', 'beat'],
  },
  {
    id: 'c_asdf_2',
    creatorId: 'asdf',
    creatorName: 'Asdf Music',
    creatorUsername: 'asdf',
    creatorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop',
    title: '🔒 FL Studio Project Stems & Sample Pack (Subscriber Only)',
    description: 'ดาวน์โหลดไฟล์โปรเจกต์เพลงฉบับเต็ม พร้อม Stems เครื่องดนตรีแยกแทร็ก สำหรับผู้สมัครสมาชิกรายเดือนเท่านั้นครับ',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop',
    type: 'audio',
    isExclusive: true,
    requiredTier: 'stablecoin',
    likes: 98,
    comments: 15,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    tags: ['exclusive', 'stems', 'flstudio'],
  },
];

// ─── Creators ───────────────────────────────────────────────────────────────

export function getAdminCreators(): Creator[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY_CREATORS);
    if (!raw) return [];
    const list = JSON.parse(raw) as Creator[];
    return list;
  } catch {
    return [];
  }
}

export function saveAdminCreators(creators: Creator[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_CREATORS, JSON.stringify(creators));
  bustCache();
}

export function addAdminCreator(creator: Creator): void {
  const list = getAdminCreators();
  list.push(creator);
  saveAdminCreators(list);
}

export function updateAdminCreator(updated: Creator): void {
  const list = getAdminCreators().map((c) => (c.id === updated.id ? updated : c));
  saveAdminCreators(list);
}

export function deleteAdminCreator(id: string): void {
  const list = getAdminCreators().filter((c) => c.id !== id);
  saveAdminCreators(list);
  const content = getAdminContent().filter((c) => c.creatorId !== id);
  saveAdminContent(content);
}

// ─── Content ────────────────────────────────────────────────────────────────

export function getAdminContent(): Content[] {
  if (typeof window === 'undefined') return DEFAULT_SEED_CONTENT;
  try {
    const raw = localStorage.getItem(KEY_CONTENT);
    if (!raw) {
      // Seed default content on first load
      localStorage.setItem(KEY_CONTENT, JSON.stringify(DEFAULT_SEED_CONTENT));
      return DEFAULT_SEED_CONTENT;
    }
    const parsed = JSON.parse(raw) as Content[];
    if (parsed.length === 0) {
      localStorage.setItem(KEY_CONTENT, JSON.stringify(DEFAULT_SEED_CONTENT));
      return DEFAULT_SEED_CONTENT;
    }
    return parsed;
  } catch {
    return DEFAULT_SEED_CONTENT;
  }
}

export function saveAdminContent(content: Content[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_CONTENT, JSON.stringify(content));
  bustCache();
}

export function addAdminContent(item: Content): void {
  const list = getAdminContent();
  list.push(item);
  saveAdminContent(list);
}

export function updateAdminContent(updated: Content): void {
  const list = getAdminContent().map((c) => (c.id === updated.id ? updated : c));
  saveAdminContent(list);
}

export function deleteAdminContent(id: string): void {
  const list = getAdminContent().filter((c) => c.id !== id);
  saveAdminContent(list);
}

// ─── Reset to defaults ───────────────────────────────────────────────────────

export function resetAdminData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY_CREATORS);
  localStorage.removeItem(KEY_CONTENT);
  bustCache();
}

// ─── Cache buster ────────────────────────────────────────────────────────────

const CACHE_KEY = 'onlyhold_admin_version';

export function bustCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CACHE_KEY, String(Date.now()));
  window.dispatchEvent(new Event('onlyhold-admin-update'));
}

export function getAdminVersion(): number {
  if (typeof window === 'undefined') return 0;
  return Number(localStorage.getItem(CACHE_KEY) ?? 0);
}
