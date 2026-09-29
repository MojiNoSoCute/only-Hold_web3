'use client';

/**
 * useChainData — ดึงข้อมูลครีเอเตอร์และ content จาก Sepolia จริง
 * และ merge กับ admin data จาก localStorage
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAdminCreators, getAdminContent, getAdminVersion, pullSync } from './adminData';
import { CATEGORIES } from './mockData';
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

function avatarUrl(seed: string, index = 0) {
  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop', // Yumi
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop', // Moji
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop', // Asdf
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop',
  ];
  const s = seed.toLowerCase();
  if (s.includes('yumi')) return avatars[0];
  if (s.includes('moji')) return avatars[1];
  if (s.includes('asdf')) return avatars[2];
  if (s.includes('hana')) return avatars[3];
  return avatars[index % avatars.length];
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

    const rawResults = await Promise.all(
      addresses.map(async (addr: string, i: number): Promise<Creator | null> => {
        try {
          const p = await factory.creatorProfiles(addr);
          const username: string = p.username || `creator_${addr.slice(2, 8)}`;

          // Fetch NFT price & holders
          let nftPrice = '';
          let nftHolders = 0;
          if (p.nftContract && p.nftContract !== ethers.ZeroAddress) {
            try {
              const nft = new ethers.Contract(
                p.nftContract,
                [
                  'function mintPrice() view returns (uint256)',
                  'function totalSupply() view returns (uint256)',
                ],
                provider
              );
              const price = await nft.mintPrice().catch(() => 0n);
              if (price > 0n) nftPrice = ethers.formatEther(price);

              const total = await nft.totalSupply().catch(() => 0n);
              nftHolders = Number(total);
            } catch {}
          }

          // Fetch monthly sub price & subscribers
          let stablecoinPrice = '';
          let activeSubs = 0;
          if (p.subscriptionContract && p.subscriptionContract !== ethers.ZeroAddress) {
            try {
              const sub = new ethers.Contract(p.subscriptionContract, SUB_ABI, provider);
              const mp = await sub.monthlyPrice().catch(() => 0n);
              if (mp > 0n) stablecoinPrice = (Number(mp) / 1_000_000).toFixed(0);
              const count = await sub.activeSubscriberCount().catch(() => 0n);
              activeSubs = Number(count);
            } catch {}
          }

          const realSubscribers = nftHolders + activeSubs;

          const creator: Creator = {
            id: addr.toLowerCase(),
            address: addr,
            name: username.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
            username,
            avatar: avatarUrl(username, i),
            coverImage: coverUrl(i),
            bio: `ครีเอเตอร์บน OnlyHold Sepolia Testnet — @${username}`,
            category: CATEGORIES_LIST[i % CATEGORIES_LIST.length],
            totalSubscribers: realSubscribers,
            totalEarnings: '0',
            isVerified: false,
            nftContractAddress: p.nftContract !== ethers.ZeroAddress ? p.nftContract : undefined,
            nftPrice: nftPrice || undefined,
            stablecoinPrice: stablecoinPrice || undefined,
            contentCount: 0,
            joinedAt: new Date(Number(p.registeredAt) * 1000).toISOString().split('T')[0],
          };
          return creator;
        } catch {
          return null;
        }
      })
    );

    return rawResults.filter((c): c is Creator => c !== null);
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
  const [chainCreators, setChainCreators] = useState<Creator[]>(_cachedCreators ?? []);
  const [isLoading, setIsLoading] = useState(!_cachedCreators);
  const [error, setError] = useState<string | null>(null);
  const [adminVersion, setAdminVersion] = useState(0);

  useEffect(() => {
    setAdminVersion(getAdminVersion());
  }, []);

  const load = useCallback(() => {
    if (_cachedCreators) { setChainCreators(_cachedCreators); setIsLoading(false); return; }
    if (_fetchPromise) { _fetchPromise.then(setChainCreators).finally(() => setIsLoading(false)); return; }

    setIsLoading(true);
    _fetchPromise = fetchCreatorsFromChain();
    _fetchPromise
      .then((data) => {
        _cachedCreators = data;
        setChainCreators(data);
        setError(null);
      })
      .catch((e) => setError(String(e)))
      .finally(() => { setIsLoading(false); _fetchPromise = null; });
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    pullSync();
    const interval = setInterval(() => pullSync(), 5000);
    const syncHandler = () => pullSync();
    window.addEventListener('focus', syncHandler);
    window.addEventListener('visibilitychange', syncHandler);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', syncHandler);
      window.removeEventListener('visibilitychange', syncHandler);
    };
  }, []);

  useEffect(() => {
    const handler = () => {
      _cachedCreators = null;
      setAdminVersion(getAdminVersion());
    };
    window.addEventListener('onlyhold-admin-update', handler);
    return () => window.removeEventListener('onlyhold-admin-update', handler);
  }, []);

  const refetch = useCallback(() => {
    _cachedCreators = null;
    _fetchPromise = null;
    load();
  }, [load]);

  // ── Merge chain creators + admin data ───────────────────────────────────
  const adminCreators = useMemo(() => getAdminCreators(), [adminVersion]);
  const adminContent  = useMemo(() => getAdminContent(),  [adminVersion]);

  const mergedCreators = useMemo<Creator[]>(() => {
    const adminMap = new Map<string, Creator>();
    adminCreators.forEach((c) => {
      if (c && c.username) adminMap.set(c.username.toLowerCase(), c);
      if (c && c.address) adminMap.set(c.address.toLowerCase(), c);
      if (c && c.id) adminMap.set(c.id.toLowerCase(), c);
    });

    const chainUsernames = new Set(
      chainCreators
        .map((c) => (c && c.username ? c.username.toLowerCase() : ''))
        .filter(Boolean)
    );

    const countPostsForCreator = (uName?: string, idStr?: string, addrStr?: string) => {
      const u = uName ? uName.toLowerCase() : '';
      const id = idStr ? idStr.toLowerCase() : '';
      const addr = addrStr ? addrStr.toLowerCase() : '';
      return adminContent.filter(
        (item) =>
          item &&
          ((u && item.creatorUsername?.toLowerCase() === u) ||
            (id && item.creatorId?.toLowerCase() === id) ||
            (addr && item.creatorId?.toLowerCase() === addr))
      ).length;
    };

    const enrichedChain = chainCreators.map((c) => {
      const uKey = c && c.username ? c.username.toLowerCase() : '';
      const aKey = c && c.address ? c.address.toLowerCase() : '';
      const custom = (uKey ? adminMap.get(uKey) : null) || (aKey ? adminMap.get(aKey) : null);
      const base = custom
        ? {
            ...c,
            name: custom.name || c.name,
            avatar: custom.avatar || c.avatar,
            coverImage: custom.coverImage || c.coverImage,
            bio: custom.bio || c.bio,
          }
        : c;

      return {
        ...base,
        contentCount: countPostsForCreator(base.username, base.id, base.address),
      };
    });

    const extraAdmin = adminCreators
      .filter((c) => {
        if (!c) return false;
        const u = c.username ? c.username.toLowerCase() : '';
        const a = c.address ? c.address.toLowerCase() : '';
        return (!u || !chainUsernames.has(u)) && (!a || !chainUsernames.has(a));
      })
      .map((c) => ({
        ...c,
        contentCount: countPostsForCreator(c.username, c.id, c.address || ''),
      }));

    return [...enrichedChain, ...extraAdmin].filter(
      (c) => c && c.id && c.id.trim() !== '' && c.username && c.username.trim() !== ''
    );
  }, [chainCreators, adminCreators, adminContent]);

  // Real content created by creators, dynamically enriched with creator's latest live profile
  const content = useMemo<Content[]>(() => {
    const creatorMap = new Map<string, Creator>();
    mergedCreators.forEach((c) => {
      if (!c) return;
      if (c.username) creatorMap.set(c.username.toLowerCase(), c);
      if (c.address) creatorMap.set(c.address.toLowerCase(), c);
      if (c.id) creatorMap.set(c.id.toLowerCase(), c);
    });

    return adminContent.map((item) => {
      if (!item) return item;
      const uKey = item.creatorUsername ? item.creatorUsername.toLowerCase() : '';
      const idKey = item.creatorId ? item.creatorId.toLowerCase() : '';
      const creator = (uKey ? creatorMap.get(uKey) : null) || (idKey ? creatorMap.get(idKey) : null);
      if (creator) {
        return {
          ...item,
          creatorName: creator.name || item.creatorName,
          creatorAvatar: creator.avatar || item.creatorAvatar,
        };
      }
      return item;
    });
  }, [adminContent, mergedCreators]);

  return { creators: mergedCreators, content, categories: CATEGORIES, isLoading, error, refetch };
}

// ─── Standalone resolver ──────────────────────────────────────────────────

export async function resolveCreatorByUsername(username: string): Promise<Creator | null> {
  const list = await (_fetchPromise ?? fetchCreatorsFromChain());
  return list.find((c) => c.username === username) ?? null;
}
