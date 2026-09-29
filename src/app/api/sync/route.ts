import { NextResponse } from 'next/server';
import type { Creator, Content } from '@/lib/types';

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

// Global server memory store (persists across warm Vercel serverless invocations)
const globalStore = globalThis as unknown as {
  _onlyhold_sync_store?: SyncStore;
};

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

const DEFAULT_CONTENT: Content[] = [
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

function getStore(): SyncStore {
  if (!globalStore._onlyhold_sync_store) {
    globalStore._onlyhold_sync_store = {
      creators: [...DEFAULT_CREATORS],
      content: [...DEFAULT_CONTENT],
      deletedContentIds: [],
      deletedCreatorIds: [],
      comments: {},
      version: Date.now(),
    };
  }
  return globalStore._onlyhold_sync_store;
}

export async function GET() {
  const store = getStore();
  return NextResponse.json(store);
}

export async function POST(req: Request) {
  const store = getStore();
  try {
    const body = await req.json();
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
          c.id.toLowerCase() === data.id.toLowerCase() ||
          (c.username && data.username && c.username.toLowerCase() === data.username.toLowerCase()) ||
          (c.address && data.address && c.address.toLowerCase() === data.address.toLowerCase())
      );
      if (idx >= 0) {
        store.creators[idx] = { ...store.creators[idx], ...data };
      } else {
        store.creators.push(data);
      }
    } else if (action === 'add_creator' && data) {
      const idx = store.creators.findIndex(
        (c) => c.id.toLowerCase() === data.id.toLowerCase() || c.username?.toLowerCase() === data.username?.toLowerCase()
      );
      if (idx >= 0) {
        store.creators[idx] = data;
      } else {
        store.creators.push(data);
      }
      store.deletedCreatorIds = store.deletedCreatorIds.filter((cid) => cid !== data.id && cid !== data.username);
    } else if (action === 'delete_creator' && id) {
      store.creators = store.creators.filter((c) => c.id !== id && c.username !== id);
      if (!store.deletedCreatorIds.includes(id)) {
        store.deletedCreatorIds.push(id);
      }
      store.content = store.content.filter((c) => c.creatorId !== id && c.creatorUsername !== id);
    } else if (action === 'add_comment' && postId && comment) {
      const current = store.comments[postId] || [];
      store.comments[postId] = [comment, ...current];
      // Update comment count on post
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

    store.version = Date.now();
    return NextResponse.json(store);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
