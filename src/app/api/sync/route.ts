import { NextResponse } from 'next/server';
import type { Creator, Content } from '@/lib/types';
import fs from 'fs';
import path from 'path';

export interface CommentItem {
  id: string;
  author: string;
  authorAvatar: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
}

export interface SyncStore {
  creators: Creator[];
  content: Content[];
  deletedContentIds: string[];
  deletedCreatorIds: string[];
  comments: Record<string, CommentItem[]>;
  version: number;
}

const CLOUD_STORE_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a0ef42155c4588';

const globalStore = globalThis as unknown as {
  _onlyhold_sync_store?: SyncStore;
};

function getDbFilePath(): string {
  try {
    const dir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return path.join(dir, 'db.json');
  } catch {
    return '/tmp/onlyhold_db.json';
  }
}

function readFromDisk(): SyncStore | null {
  try {
    const filePath = getDbFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.creators)) {
          return parsed as SyncStore;
        }
      }
    }
  } catch {}
  return null;
}

function writeToDisk(store: SyncStore): void {
  try {
    const filePath = getDbFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
  } catch {}
}

// Initial default creators and content
const DEFAULT_CREATORS: Creator[] = [
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

const MOCK_POST_IDS = new Set(['post_yumi_1', 'post_hana_1', 'post_moji_1', 'post_asdf_1']);

const DEFAULT_CONTENT: Content[] = [];

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchFromCloud(): Promise<SyncStore | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(CLOUD_STORE_URL, {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const json = await res.json();
    if (json && json.data) {
      return json.data as SyncStore;
    }
  } catch {}
  return null;
}

async function saveToCloud(store: SyncStore): Promise<void> {
  // 1. Write to persistent disk database file
  writeToDisk(store);

  // 2. Update memory store
  globalStore._onlyhold_sync_store = store;

  // 3. Write to online REST API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    await fetch(CLOUD_STORE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'onlyhold_sync', data: store }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch {}
}

async function getStore(): Promise<SyncStore> {
  // 1. Memory store
  let store: SyncStore | null = globalStore._onlyhold_sync_store || null;

  // 2. Persistent disk file database
  if (!store) {
    store = readFromDisk();
  }

  // 3. Cloud REST API
  if (!store) {
    store = await fetchFromCloud();
  }

  // 4. Fallback default initial dataset
  if (!store || !Array.isArray(store.creators)) {
    store = {
      creators: [...DEFAULT_CREATORS],
      content: [],
      deletedContentIds: [],
      deletedCreatorIds: [],
      comments: {},
      version: Date.now(),
    };
  }

  // Ensure default creators exist if not deleted
  const deletedCreatorSet = new Set(store.deletedCreatorIds || []);
  const existingKeys = new Set(
    (store.creators || [])
      .map((c) => (c && (c.username || c.id) ? (c.username || c.id).toLowerCase() : ''))
      .filter(Boolean)
  );

  DEFAULT_CREATORS.forEach((c) => {
    const key = (c.username || c.id || '').toLowerCase();
    if (key && !existingKeys.has(key) && !deletedCreatorSet.has(key) && !deletedCreatorSet.has(c.id)) {
      store!.creators.push(c);
      existingKeys.add(key);
    }
  });

  // Filter out corrupted/invalid mock items
  store.content = (store.content || []).filter(
    (c: any) =>
      c &&
      c.id &&
      !MOCK_POST_IDS.has(c.id) &&
      c.title &&
      (c.creatorName || c.creatorUsername || c.creatorId)
  );

  store.creators = (store.creators || []).filter(
    (c: any) => c && c.id && c.id.trim() !== '' && c.username && c.username.trim() !== ''
  );

  globalStore._onlyhold_sync_store = store;
  return store;
}

export async function GET() {
  try {
    const store = await getStore();
    return NextResponse.json(store, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch {
    return NextResponse.json(
      globalStore._onlyhold_sync_store || {
        creators: DEFAULT_CREATORS,
        content: DEFAULT_CONTENT,
        deletedContentIds: [],
        deletedCreatorIds: [],
        comments: {},
        version: Date.now(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const store = await getStore();
    const body = await req.json().catch(() => ({}));
    const { action, data, id, postId, comment, likesCount, payload } = body;

    if (action === 'add_post' && data) {
      const idx = store.content.findIndex((c) => c.id === data.id);
      if (idx >= 0) {
        store.content[idx] = data;
      } else {
        store.content.unshift(data);
      }
      store.deletedContentIds = store.deletedContentIds.filter((did) => did !== data.id);
    } else if (action === 'delete_post' && id) {
      store.content = store.content.filter((c) => c.id !== id);
      if (!store.deletedContentIds.includes(id)) {
        store.deletedContentIds.push(id);
      }
    } else if (action === 'update_creator' && data) {
      const idx = store.creators.findIndex(
        (c) =>
          c &&
          ((c.id && data.id && c.id.toLowerCase() === data.id.toLowerCase()) ||
            (c.username && data.username && c.username.toLowerCase() === data.username.toLowerCase()) ||
            (c.address && data.address && c.address.toLowerCase() === data.address.toLowerCase()))
      );
      if (idx >= 0) {
        store.creators[idx] = { ...store.creators[idx], ...data };
      } else {
        store.creators.push(data);
      }
    } else if (action === 'add_creator' && data) {
      const idx = store.creators.findIndex(
        (c) =>
          c &&
          ((c.id && data.id && c.id.toLowerCase() === data.id.toLowerCase()) ||
            (c.username && data.username && c.username.toLowerCase() === data.username.toLowerCase()))
      );
      if (idx >= 0) {
        store.creators[idx] = data;
      } else {
        store.creators.push(data);
      }
      store.deletedCreatorIds = store.deletedCreatorIds.filter((cid) => cid !== data.id && cid !== data.username);
    } else if (action === 'delete_creator' && id) {
      store.creators = store.creators.filter((c) => c && c.id !== id && c.username !== id);
      if (!store.deletedCreatorIds.includes(id)) {
        store.deletedCreatorIds.push(id);
      }
      store.content = store.content.filter((c) => c.creatorId !== id && c.creatorUsername !== id);
    } else if (action === 'add_comment' && postId && comment) {
      const current = store.comments[postId] || [];
      store.comments[postId] = [comment, ...current];
      const post = store.content.find((c) => c.id === postId);
      if (post) {
        post.comments = store.comments[postId].length;
      }
    } else if (action === 'toggle_like' && postId && typeof likesCount === 'number') {
      const p = store.content.find((c) => c.id === postId);
      if (p) {
        p.likes = likesCount;
      }
    } else if (action === 'full_sync' && payload) {
      if (Array.isArray(payload.creators)) {
        const mergedMap = new Map<string, Creator>();
        store.creators.forEach((c) => mergedMap.set(c.id, c));
        payload.creators.forEach((c: Creator) => mergedMap.set(c.id, c));
        store.creators = Array.from(mergedMap.values());
      }
      if (Array.isArray(payload.content)) {
        const mergedMap = new Map<string, Content>();
        store.content.forEach((c) => mergedMap.set(c.id, c));
        payload.content.forEach((c: Content) => mergedMap.set(c.id, c));
        store.content = Array.from(mergedMap.values());
      }
      if (Array.isArray(payload.deletedContentIds)) {
        const set = new Set([...store.deletedContentIds, ...payload.deletedContentIds]);
        store.deletedContentIds = Array.from(set);
        store.content = store.content.filter((c) => !set.has(c.id));
      }
      if (Array.isArray(payload.deletedCreatorIds)) {
        const set = new Set([...store.deletedCreatorIds, ...payload.deletedCreatorIds]);
        store.deletedCreatorIds = Array.from(set);
        store.creators = store.creators.filter((c) => !set.has(c.id) && !set.has(c.username));
      }
    } else if (action === 'reset') {
      store.creators = [...DEFAULT_CREATORS];
      store.content = [...DEFAULT_CONTENT];
      store.deletedContentIds = [];
      store.deletedCreatorIds = [];
      store.comments = {};
    }

    if (body.fullStore) {
      if (Array.isArray(body.fullStore.creators)) {
        body.fullStore.creators.forEach((c: Creator) => {
          if (c && c.id) {
            const idx = store.creators.findIndex((sc) => sc && sc.id?.toLowerCase() === c.id?.toLowerCase());
            if (idx >= 0) {
              store.creators[idx] = { ...store.creators[idx], ...c };
            } else {
              store.creators.push(c);
            }
          }
        });
      }
      if (Array.isArray(body.fullStore.content)) {
        body.fullStore.content.forEach((c: Content) => {
          if (c && c.id) {
            const idx = store.content.findIndex((sc) => sc && sc.id === c.id);
            if (idx >= 0) {
              store.content[idx] = { ...store.content[idx], ...c };
            } else {
              store.content.unshift(c);
            }
          }
        });
      }
    }

    store.version = Date.now();
    await saveToCloud(store);
    return NextResponse.json(store, { status: 200 });
  } catch {
    const fallback = globalStore._onlyhold_sync_store || {
      creators: DEFAULT_CREATORS,
      content: DEFAULT_CONTENT,
      deletedContentIds: [],
      deletedCreatorIds: [],
      comments: {},
      version: Date.now(),
    };
    return NextResponse.json(fallback, { status: 200 });
  }
}
