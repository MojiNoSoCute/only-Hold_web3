'use client';

/**
 * useChainData — ดึงข้อมูลครีเอเตอร์และ content จาก Sepolia จริง
 *
 * - ดึง creator list ทั้งหมดจาก OnlyHoldFactory.allCreators()
 * - ดึง profile แต่ละคนจาก creatorProfiles()
 * - ใช้ MOCK_CONTENT เป็น off-chain data (ในอนาคตเปลี่ยนเป็น IPFS)
 * - cache ไว้ใน module-level เพื่อไม่ต้อง refetch ทุก render
 */

import { useCallback, useEffect, useState } from 'react';
import { MOCK_CONTENT, CATEGORIES } from './mockData';
import type { Creator, Content } from './types';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? '';
const SEPOLIA_RPC = 'https://ethereum-sepolia.publicnode.com';

const FACTORY_ABI = [
  'function allCreators() view returns (address[])',
  'function creatorProfiles(address) view returns (address creatorAddress, address nftContract, address subscriptionContract, string username, string metadataURI, uint256 registeredAt, bool isActive)',
];

const NFT_ABI = [
  'function mintPrice() view returns (uint256)',
  'function maxSupply() view returns (uint256)',
  'function totalMinted() view returns (uint256)',
];

const SUB_ABI = [
  'function monthlyPrice() view returns (uint256)',
  'function activeSubscriberCount() view returns (uint256)',
];

// ─── Module-level cache ────────────────────────────────────────────────────
let _cachedCreators: Creator[] | null = null;
let _fetchPromise: Promise<Creator[]> | null = null;

// ─── Helpers ──────────────────────────────────────────────────────────────

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
}

function coverUrl(seed: number) {
  const covers = [
    'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop',
  ];
  return covers[seed % covers.length];
}

const CATEGORIES_LIST = ['art', 'music', 'fitness', 'gaming', 'education', 'lifestyle', 'photography', 'writing'];

// ─── Main fetch function ───────────────────────────────────────────────────

async function fetchCreatorsFromChain(): Promise<Creator[]> {
  if (!FACTORY_ADDRESS) return [];
  try {
    const { ethers } = await import('ethers');
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

    const addresses: string[] = await factory.allCreators();
    if (!addresses || addresses.length === 0) return [];

    const creators: Creator[] = await Promise.all(
      addresses.map(async (addr, i) => {
        try {
          const p = await factory.creatorProfiles(addr);
          const username = p.username || `creator_${addr.slice(2, 8)}`;

          // Fetch NFT price
          let nftPrice = '';
          if (p.nftContract && p.nftContract !== ethers.ZeroAddress) {
            try {
              const nft = new ethers.Contract(p.nftContract, NFT_ABI, provider);
              const price = await nft.mintPrice();
              nftPrice = ethers.formatEther(price);
            } catch {}
          }

          // Fetch monthly sub price
          let stablecoinPrice = '';
          let totalSubscribers = 0;
          if (p.subscriptionContract && p.subscriptionContract !== ethers.ZeroAddress) {
            try {
              const sub = new ethers.Contract(p.subscriptionContract, SUB_ABI, provider);
              const mp = await sub.monthlyPrice();
              stablecoinPrice = (Number(mp) / 1_000_000).toFixed(0);
              try {
                const count = await sub.activeSubscriberCount();
                totalSubscribers = Number(count);
              } catch {}
            } catch {}
          }

          return {
            id: addr.toLowerCase(),
            address: addr,
            name: username.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            username,
            avatar: avatarUrl(username),
            coverImage: coverUrl(i),
            bio: `ครีเอเตอร์บน OnlyHold Sepolia Testnet — @${username}`,
            category: CATEGORIES_LIST[i % CATEGORIES_LIST.length],
            totalSubscribers,
            totalEarnings: '0',
            isVerified: false,
            nftContractAddress: p.nftContract !== ethers.ZeroAddress ? p.nftContract : undefined,
            nftPrice: nftPrice || undefined,
            stablecoinPrice: stablecoinPrice || undefined,
            contentCount: 0,
            joinedAt: new Date(Number(p.registeredAt) * 1000).toISOString().split('T')[0],
            isActive: p.isActive,
          } satisfies Creator & { isActive: boolean };
        } catch {
          return null;
        }
      })
    );

    return creators.filter(Boolean) as Creator[];
  } catch (err) {
    console.error('fetchCreatorsFromChain error:', err);
    return [];
  }
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export interface ChainData {
  creators: Creator[];
  content: Content[];
  categories: typeof CATEGORIES;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useChainData(): ChainData {
  const [creators, setCreators] = useState<Creator[]>(_cachedCreators ?? []);
  const [isLoading, setIsLoading] = useState(!_cachedCreators);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (_cachedCreators) { setCreators(_cachedCreators); setIsLoading(false); return; }
    if (_fetchPromise) { _fetchPromise.then(setCreators).finally(() => setIsLoading(false)); return; }

    setIsLoading(true);
    _fetchPromise = fetchCreatorsFromChain();
    _fetchPromise
      .then((data) => {
        _cachedCreators = data;
        setCreators(data);
        setError(null);
      })
      .catch((e) => setError(String(e)))
      .finally(() => { setIsLoading(false); _fetchPromise = null; });
  }, []);

  useEffect(() => { load(); }, [load]);

  const refetch = useCallback(() => {
    _cachedCreators = null;
    _fetchPromise = null;
    load();
  }, [load]);

  // Build content: attach real creator data where username matches
  const content: Content[] = MOCK_CONTENT.map((c) => {
    const chainCreator = creators.find((cr) => cr.username === c.creatorUsername);
    if (!chainCreator) return c;
    return {
      ...c,
      creatorId: chainCreator.id,
      creatorName: chainCreator.name,
      creatorAvatar: chainCreator.avatar,
    };
  });

  return { creators, content, categories: CATEGORIES, isLoading, error, refetch };
}

// ─── Standalone resolver (no hook — for server/util use) ──────────────────

export async function resolveCreatorByUsername(username: string): Promise<Creator | null> {
  const list = await (_fetchPromise ?? fetchCreatorsFromChain());
  return list.find((c) => c.username === username) ?? null;
}
