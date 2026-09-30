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
      const parsedRaw = JSON.parse(raw);
      const parsed = Array.isArray(parsedRaw) ? (parsedRaw.filter(Boolean) as Creator[]) : [];
      const existingIds = new Set(
        parsed
          .map((c) => (c && (c.username || c.id) ? (c.username || c.id).toLowerCase() : ''))
          .filter(Boolean)
      );
      const merged = [...parsed];
      INITIAL_GLOBAL_CREATORS.forEach((c) => {
        if (!c) return;
        const uKey = c.username?.toLowerCase() || c.id?.toLowerCase() || '';
        const cId = c.id || '';
        const cUname = c.username || '';
        if (uKey && !existingIds.has(uKey) && (!cId || !deleted.has(cId)) && (!cUname || !deleted.has(cUname))) {
          merged.push(c);
        }
      });
      baseList = merged;
    }
    return baseList.filter(
      (c) =>
        c &&
        c.id &&
        c.id.trim() !== '' &&
        c.username &&
        c.username.trim() !== '' &&
        !deleted.has(c.id) &&
        !deleted.has(c.username)
    );
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
  pushSync('add_creator', { data: creator });
}

export function updateAdminCreator(updated: Creator): void {
  const list = getAdminCreators().map((c) => (c && c.id === updated.id ? updated : c));
  saveAdminCreators(list);

  // Also update creator avatar & name in saved posts
  try {
    const rawContent = localStorage.getItem(KEY_CONTENT);
    if (rawContent) {
      const parsedContent = JSON.parse(rawContent) as Content[];
      if (Array.isArray(parsedContent)) {
        const updatedContent = parsedContent.map((item) => {
          if (!item) return item;
          const isMatch =
            (updated.username && item.creatorUsername?.toLowerCase() === updated.username.toLowerCase()) ||
            (updated.id && item.creatorId?.toLowerCase() === updated.id.toLowerCase()) ||
            (updated.address && item.creatorId?.toLowerCase() === updated.address.toLowerCase());
          if (isMatch) {
            return {
              ...item,
              creatorName: updated.name || item.creatorName,
              creatorAvatar: updated.avatar || item.creatorAvatar,
            };
          }
          return item;
        });
        localStorage.setItem(KEY_CONTENT, JSON.stringify(updatedContent));
      }
    }
  } catch {}

  pushSync('update_creator', { data: updated });
}

export function deleteAdminCreator(id: string): void {
  if (typeof window === 'undefined') return;
  const deleted = getDeletedCreatorIds();
  deleted.add(id);
  const target = getAdminCreators().find((c) => c && (c.id === id || c.username === id));
  if (target) {
    if (target.id) deleted.add(target.id);
    if (target.username) deleted.add(target.username);
  }
  saveDeletedCreatorIds(deleted);

  const list = getAdminCreators().filter((c) => c && c.id !== id && c.username !== id);
  saveAdminCreators(list);

  // Delete creator's content as well
  const content = getAdminContent();
  content.forEach((item) => {
    if (item && (item.creatorId === id || item.creatorUsername === id)) {
      deleteAdminContent(item.id);
    }
  });
  pushSync('delete_creator', { id });
}

const MOCK_POST_IDS = new Set(['post_yumi_1', 'post_hana_1', 'post_moji_1', 'post_asdf_1']);

export const INITIAL_GLOBAL_CONTENT: Content[] = [];

export function getAdminContent(): Content[] {
  if (typeof window === 'undefined') return [];
  try {
    const deleted = getDeletedContentIds();
    const raw = localStorage.getItem(KEY_CONTENT);
    let baseList: Content[] = [];
    if (raw) {
      const parsedRaw = JSON.parse(raw);
      baseList = Array.isArray(parsedRaw) ? (parsedRaw.filter(Boolean) as Content[]) : [];
    }
    return baseList.filter(
      (c) =>
        c &&
        c.id &&
        !MOCK_POST_IDS.has(c.id) &&
        !deleted.has(c.id) &&
        c.title &&
        (c.creatorName || c.creatorUsername || c.creatorId)
    );
  } catch {
    return [];
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
  pushSync('add_post', { data: item });
}

export function updateAdminContent(updated: Content): void {
  const list = getAdminContent().map((c) => (c.id === updated.id ? updated : c));
  saveAdminContent(list);
  pushSync('add_post', { data: updated });
}

export function deleteAdminContent(id: string): void {
  if (typeof window === 'undefined') return;
  const deleted = getDeletedContentIds();
  deleted.add(id);
  saveDeletedContentIds(deleted);

  const list = getAdminContent().filter((c) => c.id !== id);
  saveAdminContent(list);
  pushSync('delete_post', { id });
}

// ─── Reset to defaults ───────────────────────────────────────────────────────

export function resetAdminData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY_CREATORS);
  localStorage.removeItem(KEY_CONTENT);
  localStorage.removeItem(KEY_DELETED_CONTENT);
  localStorage.removeItem(KEY_DELETED_CREATORS);
  bustCache();
  pushSync('reset');
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

// ─── Global Server Sync API ──────────────────────────────────────────────────

let _lastSyncedVersion = 0;

export async function pushSync(action: string, payloadData?: any): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const rawCreators = localStorage.getItem(KEY_CREATORS);
    const rawContent = localStorage.getItem(KEY_CONTENT);
    const localCreators = rawCreators ? JSON.parse(rawCreators) : [];
    const localContent = rawContent ? JSON.parse(rawContent) : [];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        ...payloadData,
        fullStore: { creators: localCreators, content: localContent },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      applySyncedStore(data);
    }
  } catch {}
}

export async function pullSync(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`/api/sync?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      applySyncedStore(data);
    }
  } catch {}
}

export function applySyncedStore(store: any): void {
  if (typeof window === 'undefined' || !store) return;
  try {
    const version = Number(store.version ?? 0);
    if (version > 0 && version === _lastSyncedVersion) {
      return; // Already synced this version, skip to avoid infinite loop
    }
    if (version > 0) {
      _lastSyncedVersion = version;
    }

    let updated = false;
    if (Array.isArray(store.creators)) {
      const rawLocal = localStorage.getItem(KEY_CREATORS);
      const localCreators: Creator[] = rawLocal ? JSON.parse(rawLocal) : [];
      const map = new Map<string, Creator>();

      // 1. Put local creators in map first
      localCreators.forEach((c: Creator) => {
        if (!c) return;
        const key = (c.username || c.id || '').toLowerCase();
        if (key) map.set(key, c);
      });

      // 2. Apply server creators ON TOP so server updates override local cache while preserving custom uploaded images
      store.creators.forEach((c: Creator) => {
        if (!c) return;
        const key = (c.username || c.id || '').toLowerCase();
        if (key) {
          const local = map.get(key);
          if (local) {
            const isCustom = (url?: string) => url && (url.startsWith('data:') || (!url.includes('images.unsplash.com') && !url.includes('api.dicebear.com')));
            const avatar = isCustom(c.avatar) ? c.avatar : (isCustom(local.avatar) ? local.avatar : (c.avatar || local.avatar));
            const coverImage = isCustom(c.coverImage) ? c.coverImage : (isCustom(local.coverImage) ? local.coverImage : (c.coverImage || local.coverImage));
            map.set(key, { ...local, ...c, avatar, coverImage });
          } else {
            map.set(key, c);
          }
        }
      });

      localStorage.setItem(KEY_CREATORS, JSON.stringify(Array.from(map.values())));
      updated = true;
    }

    if (Array.isArray(store.content)) {
      const rawLocal = localStorage.getItem(KEY_CONTENT);
      const localContent: Content[] = rawLocal ? JSON.parse(rawLocal) : [];
      const map = new Map<string, Content>();

      // 1. Put local content in map first
      localContent.forEach((c: Content) => {
        if (c && c.id) map.set(c.id, c);
      });

      // 2. Apply server content ON TOP so server content updates override local cache
      store.content.forEach((c: Content) => {
        if (c && c.id) {
          const local = map.get(c.id);
          map.set(c.id, local ? { ...local, ...c } : c);
        }
      });

      localStorage.setItem(KEY_CONTENT, JSON.stringify(Array.from(map.values())));
      updated = true;
    }

    if (Array.isArray(store.deletedContentIds)) {
      localStorage.setItem(KEY_DELETED_CONTENT, JSON.stringify(store.deletedContentIds));
      updated = true;
    }
    if (Array.isArray(store.deletedCreatorIds)) {
      localStorage.setItem(KEY_DELETED_CREATORS, JSON.stringify(store.deletedCreatorIds));
      updated = true;
    }
    if (store.comments && typeof store.comments === 'object') {
      Object.entries(store.comments).forEach(([postId, comments]) => {
        localStorage.setItem(`onlyhold_comments_${postId}`, JSON.stringify(comments));
      });
      updated = true;
    }
    if (updated) {
      bustCache();
    }
  } catch {}
}
