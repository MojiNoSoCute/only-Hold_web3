// ============================================================
// OnlyHold - Type Definitions
// ============================================================

export type SubscriptionTier = 'nft' | 'stablecoin';

export interface Creator {
  id: string;
  address: string;
  name: string;
  username: string;
  avatar: string;
  coverImage: string;
  bio: string;
  category: string;
  totalSubscribers: number;
  totalEarnings: string;
  isVerified: boolean;
  nftContractAddress?: string;
  nftPrice?: string; // in ETH
  stablecoinPrice?: string; // USDC per month
  contentCount: number;
  joinedAt: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}

export interface Content {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  creatorUsername: string;
  title: string;
  description: string;
  type: 'image' | 'video' | 'text' | 'audio';
  thumbnail?: string;
  isExclusive: boolean;
  requiredTier?: SubscriptionTier;
  likes: number;
  comments: number;
  createdAt: string;
  isLiked?: boolean;
  tags: string[];
}

export interface Subscription {
  creatorId: string;
  subscriberAddress: string;
  type: SubscriptionTier;
  nftTokenId?: string;
  depositAmount?: string; // USDC
  startDate: string;
  expiryDate?: string; // for stablecoin subs
  isActive: boolean;
  transactionHash: string;
}

export interface NFTMembership {
  tokenId: string;
  contractAddress: string;
  creatorId: string;
  creatorName: string;
  ownerAddress: string;
  tier: string;
  mintedAt: string;
  metadata: {
    name: string;
    image: string;
    attributes: Array<{ trait_type: string; value: string }>;
  };
}

export interface UserProfile {
  address: string;
  displayName?: string;
  avatar?: string;
  subscriptions: Subscription[];
  nftsHeld: NFTMembership[];
  totalDeposited: string; // USDC
}

export interface StablecoinDeposit {
  amount: string;
  currency: 'USDC' | 'USDT' | 'DAI';
  creatorId: string;
  monthsAccess: number;
  transactionHash?: string;
}

export type ContentCategory =
  | 'art'
  | 'music'
  | 'fitness'
  | 'gaming'
  | 'education'
  | 'lifestyle'
  | 'photography'
  | 'writing';

export interface Notification {
  id: string;
  type: 'new_content' | 'subscription' | 'nft_minted' | 'comment' | 'like';
  message: string;
  createdAt: string;
  isRead: boolean;
  link?: string;
}
