'use client';

/**
 * adminData.ts — Global Shared Data store for Creators and Content
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
const KEY_DELETED_CONTENT = 'onlyhold_deleted_content';
const KEY_DELETED_CREATORS = 'onlyhold_deleted_creators';

function getDeletedContentIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(KEY_DELETED_CONTENT);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDeletedContentIds(set: Set<string>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_DELETED_CONTENT, JSON.stringify(Array.from(set)));
}

function getDeletedCreatorIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(KEY_DELETED_CREATORS);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDeletedCreatorIds(set: Set<string>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_DELETED_CREATORS, JSON.stringify(Array.from(set)));
}

// ─── Global Base Creators & Content (Shared across all devices/browsers) ───

export const INITIAL_GLOBAL_CREATORS: Creator[] = [
  {
    id: 'yumi',
    address: '0x0000000000000000000000000000000000000001',
    name: 'Yumi',
    username: 'yumi',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop',
    bio: 'ครีเอเตอร์สายเกมและไลฟ์สไตล์ สตรีมคุยกับแฟนคลับยามดึก ✨',
    category: 'gaming',
    totalSubscribers: 1,
    totalEarnings: '0',
    isVerified: true,
    contentCount: 1,
    joinedAt: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
  },
  {
    id: 'hana',
    address: '0x0000000000000000000000000000000000000002',
    name: 'Hana',
    username: 'hana',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&auto=format&fit=crop',
    bio: 'Hello I am new here! Pls support me ✨',
    category: 'lifestyle',
    totalSubscribers: 1,
    totalEarnings: '0',
    isVerified: false,
    contentCount: 1,
    joinedAt: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
  },
  {
    id: 'moji',
    address: '0x0000000000000000000000000000000000000003',
    name: 'Moji',
    username: 'moji',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=1200&auto=format&fit=crop',
    bio: 'ดิจิทัลอาร์ทติสและดีไซน์เนอร์ Web3',
    category: 'art',
    totalSubscribers: 1,
    totalEarnings: '0',
    isVerified: false,
    contentCount: 1,
    joinedAt: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
  },
  {
    id: 'asdf',
    address: '0x0000000000000000000000000000000000000004',
    name: 'Asdf',
    username: 'asdf',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&auto=format&fit=crop',
    bio: 'คอนเทนต์ครีเอเตอร์และบล็อกเกอร์',
    category: 'lifestyle',
    totalSubscribers: 1,
    totalEarnings: '0',
    isVerified: false,
    contentCount: 1,
    joinedAt: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
  },
];

export const INITIAL_GLOBAL_CONTENT: Content[] = [
  {
    id: 'post_yumi_1',
    creatorId: 'yumi',
    creatorName: 'Yumi',
    creatorUsername: 'yumi',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop',
    title: 'เล่นเกม',
    description: 'เล่นเกม คุยกับทุกคนยามดึกนะคะ ✨',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop',
    type: 'image',
    isExclusive: false,
    likes: 0,
    comments: 0,
    createdAt: new Date(Date.now() - 3600000 * 21).toISOString(),
    tags: ['gaming', 'update'],
  },
  {
    id: 'post_hana_1',
    creatorId: 'hana',
    creatorName: 'Hana',
    creatorUsername: 'hana',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop',
    title: "Hello I'm new here",
    description: 'Pls support me ✨ ยินดีต้อนรับทุกคนเข้าสู่โปรไฟล์ของ Hana นะคะ!',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&auto=format&fit=crop',
    type: 'image',
    isExclusive: false,
    likes: 0,
    comments: 0,
    createdAt: new Date(Date.now() - 3600000 * 21).toISOString(),
    tags: ['lifestyle', 'new'],
  },
  {
    id: 'post_moji_1',
    creatorId: 'moji',
    creatorName: 'Moji',
    creatorUsername: 'moji',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop',
    title: 'Moji Artwork Showcase',
    description: 'สวัสดีครับ Moji ยินดีต้อนรับทุกท่านครับ!',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&auto=format&fit=crop',
    type: 'image',
    isExclusive: false,
    likes: 0,
    comments: 0,
    createdAt: new Date(Date.now() - 3600000 * 21).toISOString(),
    tags: ['art'],
  },
  {
    id: 'post_asdf_1',
    creatorId: 'asdf',
    creatorName: 'Asdf',
    creatorUsername: 'asdf',
    creatorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop',
    title: 'Asdf Content Update',
    description: 'อัปเดตผลงานใหม่ล่าสุด ติดตามกันได้เลยครับ!',
    thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&auto=format&fit=crop',
    type: 'image',
    isExclusive: false,
    likes: 0,
    comments: 0,
    createdAt: new Date(Date.now() - 3600000 * 21).toISOString(),
    tags: ['lifestyle'],
  },
];

// ─── Creators ───────────────────────────────────────────────────────────────

export function getAdminCreators(): Creator[] {
  if (typeof window === 'undefined') return INITIAL_GLOBAL_CREATORS;
  try {
    const deleted = getDeletedCreatorIds();
    const raw = localStorage.getItem(KEY_CREATORS);
    let baseList: Creator[] = [];
    if (!raw) {
      baseList = INITIAL_GLOBAL_CREATORS;
    } else {
      const parsed = JSON.parse(raw) as Creator[];
      const existingIds = new Set(parsed.map((c) => c.username?.toLowerCase() || c.id?.toLowerCase()));
      const merged = [...parsed];
      INITIAL_GLOBAL_CREATORS.forEach((c) => {
        const uKey = c.username?.toLowerCase() || c.id?.toLowerCase();
        if (!existingIds.has(uKey) && !deleted.has(c.id) && !deleted.has(c.username)) {
          merged.push(c);
        }
      });
      baseList = merged;
    }
    return baseList.filter((c) => !deleted.has(c.id) && !deleted.has(c.username));
  } catch {
    return INITIAL_GLOBAL_CREATORS;
  }
}

export function saveAdminCreators(creators: Creator[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_CREATORS, JSON.stringify(creators));
  bustCache();
}

export function addAdminCreator(creator: Creator): void {
  const deleted = getDeletedCreatorIds();
  if (deleted.has(creator.id) || (creator.username && deleted.has(creator.username))) {
    deleted.delete(creator.id);
    if (creator.username) deleted.delete(creator.username);
    saveDeletedCreatorIds(deleted);
  }
  const list = getAdminCreators();
  list.push(creator);
  saveAdminCreators(list);
}

export function updateAdminCreator(updated: Creator): void {
  const list = getAdminCreators().map((c) => (c.id === updated.id ? updated : c));
  saveAdminCreators(list);
}

export function deleteAdminCreator(id: string): void {
  if (typeof window === 'undefined') return;
  const deleted = getDeletedCreatorIds();
  deleted.add(id);
  const target = getAdminCreators().find((c) => c.id === id || c.username === id);
  if (target) {
    deleted.add(target.id);
    if (target.username) deleted.add(target.username);
  }
  saveDeletedCreatorIds(deleted);

  const list = getAdminCreators().filter((c) => c.id !== id && c.username !== id);
  saveAdminCreators(list);

  // Delete creator's content as well
  const content = getAdminContent();
  content.forEach((item) => {
    if (item.creatorId === id || item.creatorUsername === id) {
      deleteAdminContent(item.id);
    }
  });
}

// ─── Content ────────────────────────────────────────────────────────────────

export function getAdminContent(): Content[] {
  if (typeof window === 'undefined') return INITIAL_GLOBAL_CONTENT;
  try {
    const deleted = getDeletedContentIds();
    const raw = localStorage.getItem(KEY_CONTENT);
    let baseList: Content[] = [];
    if (!raw) {
      baseList = INITIAL_GLOBAL_CONTENT;
    } else {
      const parsed = JSON.parse(raw) as Content[];
      const existingIds = new Set(parsed.map((c) => c.id));
      const merged = [...parsed];
      INITIAL_GLOBAL_CONTENT.forEach((c) => {
        if (!existingIds.has(c.id) && !deleted.has(c.id)) {
          merged.push(c);
        }
      });
      baseList = merged;
    }
    return baseList.filter((c) => !deleted.has(c.id));
  } catch {
    return INITIAL_GLOBAL_CONTENT;
  }
}

export function saveAdminContent(content: Content[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_CONTENT, JSON.stringify(content));
  bustCache();
}

export function addAdminContent(item: Content): void {
  const deleted = getDeletedContentIds();
  if (deleted.has(item.id)) {
    deleted.delete(item.id);
    saveDeletedContentIds(deleted);
  }
  const list = getAdminContent();
  list.unshift(item);
  saveAdminContent(list);
}

export function updateAdminContent(updated: Content): void {
  const list = getAdminContent().map((c) => (c.id === updated.id ? updated : c));
  saveAdminContent(list);
}

export function deleteAdminContent(id: string): void {
  if (typeof window === 'undefined') return;
  const deleted = getDeletedContentIds();
  deleted.add(id);
  saveDeletedContentIds(deleted);

  const list = getAdminContent().filter((c) => c.id !== id);
  saveAdminContent(list);
}

// ─── Reset to defaults ───────────────────────────────────────────────────────

export function resetAdminData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY_CREATORS);
  localStorage.removeItem(KEY_CONTENT);
  localStorage.removeItem(KEY_DELETED_CONTENT);
  localStorage.removeItem(KEY_DELETED_CREATORS);
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
