import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Docs – OnlyHold',
  description: 'Developer documentation for the OnlyHold smart contract platform.',
};

const SECTIONS = [
  {
    id: 'overview',
    title: '📖 Overview',
    content: (
      <>
        <p>
          OnlyHold is a decentralised creator-monetisation platform. It consists of three Solidity contracts
          deployed per creator:
        </p>
        <ul className="mt-3 space-y-2 list-none">
          {[
            ['OnlyHoldFactory', 'Singleton. Registers creators, deploys their NFT + Subscription contracts, and resolves usernames.'],
            ['OnlyHoldNFT', 'Per-creator ERC-721. One-time mint for lifetime access.'],
            ['OnlyHoldSubscription', 'Per-creator ERC-20-deposit streaming contract. USDC/USDT deposits stream to the creator per-second.'],
          ].map(([name, desc]) => (
            <li key={name} className="flex gap-3">
              <code className="text-purple-400 font-mono text-xs shrink-0 mt-0.5">{name}</code>
              <span className="text-white/50 text-sm">{desc}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: 'factory',
    title: '🏭 OnlyHoldFactory',
    content: (
      <>
        <p className="mb-3">The factory is the single entry point for all on-chain actions.</p>
        <div className="space-y-3">
          {[
            {
              sig: 'launchCreator(string username, string metadataURI, NFTParams nft, SubParams sub) → (address nftContract, address subContract)',
              desc: 'Registers a new creator and deploys their contracts. Emits CreatorLaunched.',
            },
            {
              sig: 'checkAccess(address creatorAddress, address fan) → (bool hasAccess, string via)',
              desc: 'Returns whether `fan` has access to `creatorAddress` content and how (\"nft\" | \"subscription\" | \"none\").',
            },
            {
              sig: 'resolveUsername(string username) → (address creator, address nft, address sub)',
              desc: 'Resolves a username string to the creator wallet and their deployed contract addresses.',
            },
          ].map((item) => (
            <div key={item.sig} className="bg-[#0a0a0f] border border-white/5 rounded-xl p-4">
              <code className="text-green-400 font-mono text-xs break-all">{item.sig}</code>
              <p className="text-white/50 text-sm mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: 'nft',
    title: '🖼️ OnlyHoldNFT',
    content: (
      <>
        <p className="mb-3">ERC-721 membership token for one-time lifetime access.</p>
        <div className="space-y-3">
          {[
            { sig: 'mint(address to, string tokenURI) payable', desc: 'Mint a membership NFT. Must send exactly mintPrice in ETH.' },
            { sig: 'isMember(address account) → bool', desc: 'Returns true if `account` holds at least one token from this contract.' },
            { sig: 'mintPrice() → uint256', desc: 'Returns the current mint price in wei.' },
            { sig: 'totalMinted() → uint256', desc: 'Number of tokens minted so far.' },
            { sig: 'maxSupply() → uint256', desc: 'Maximum supply cap (0 = unlimited).' },
          ].map((item) => (
            <div key={item.sig} className="bg-[#0a0a0f] border border-white/5 rounded-xl p-4">
              <code className="text-purple-400 font-mono text-xs break-all">{item.sig}</code>
              <p className="text-white/50 text-sm mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: 'subscription',
    title: '💵 OnlyHoldSubscription',
    content: (
      <>
        <p className="mb-3">Stablecoin streaming subscription. Fans deposit; access lasts until balance runs out.</p>
        <div className="space-y-3">
          {[
            { sig: 'subscribe(uint256 amount)', desc: 'Deposit `amount` of stablecoin. Requires prior ERC-20 approval. Access is streamed at monthlyPrice per 30 days.' },
            { sig: 'withdrawBalance()', desc: 'Fan withdraws remaining deposited balance and cancels subscription.' },
            { sig: 'withdrawEarnings()', desc: 'Creator withdraws accumulated earnings.' },
            { sig: 'isSubscribed(address account) → bool', desc: 'Returns true if `account` has an active subscription (balance > 0 and not expired).' },
            { sig: 'getSubscription(address account) → (uint256 deposited, uint256 expiresAt, bool isActive, uint256 remainingSeconds)', desc: 'Full subscription state for a fan address.' },
            { sig: 'monthlyPrice() → uint256', desc: 'Monthly price in stablecoin base units (e.g. 10_000_000 for $10 USDC).' },
            { sig: 'pendingCreatorEarnings() → uint256', desc: 'Creator earnings available for withdrawal.' },
          ].map((item) => (
            <div key={item.sig} className="bg-[#0a0a0f] border border-white/5 rounded-xl p-4">
              <code className="text-green-400 font-mono text-xs break-all">{item.sig}</code>
              <p className="text-white/50 text-sm mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: 'integration',
    title: '🔌 Frontend Integration',
    content: (
      <>
        <p className="mb-3">
          The <code className="text-purple-400 font-mono text-xs">useOnlyHold</code> hook in{' '}
          <code className="text-white/60 font-mono text-xs">src/lib/useOnlyHold.ts</code> wraps all contract calls:
        </p>
        <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-4 font-mono text-xs text-white/70 overflow-x-auto">
          <pre>{`import { useOnlyHold } from '@/lib/useOnlyHold';

const {
  checkAccess,       // Check if wallet has content access
  mintNFT,           // Mint a creator's NFT membership
  subscribeWithStablecoin, // Deposit USDC for monthly access
  cancelSubscription,// Withdraw remaining balance
  registerCreator,   // Launch a new creator on-chain
} = useOnlyHold();

// Check access
const { hasAccess, via } = await checkAccess(creatorAddress);

// Mint NFT  (0.05 ETH)
const { success, hash } = await mintNFT(nftContractAddress, '0.05');

// Subscribe (3 months × 10 USDC)
const result = await subscribeWithStablecoin(
  subContractAddress,
  3,
  10_000_000n // monthlyPrice in USDC base units
);`}</pre>
        </div>
        <p className="text-white/40 text-xs mt-3">
          Set <code className="text-white/60">NEXT_PUBLIC_FACTORY_ADDRESS</code> and{' '}
          <code className="text-white/60">NEXT_PUBLIC_USDC_ADDRESS</code> in your <code className="text-white/60">.env.local</code> after deploying the contracts.
        </p>
      </>
    ),
  },
  {
    id: 'deploy',
    title: '🚀 Deploying Contracts',
    content: (
      <>
        <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-4 font-mono text-xs text-white/70 overflow-x-auto mb-3">
          <pre>{`# 1. Install deps
npm install

# 2. Compile contracts
npx hardhat compile

# 3. Run tests
npx hardhat test

# 4. Deploy to local Hardhat node
npx hardhat node
npx hardhat run scripts/deploy.ts --network localhost

# 5. Deploy to Sepolia testnet
npx hardhat run scripts/deploy.ts --network sepolia`}</pre>
        </div>
        <p className="text-white/40 text-xs">
          See <code className="text-white/60">.env.example</code> for required environment variables.
        </p>
      </>
    ),
  },
];

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-white mb-3">Documentation</h1>
        <p className="text-white/50 text-lg">
          Smart contract reference and integration guide for OnlyHold.
        </p>
      </div>

      {/* TOC */}
      <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5 mb-12">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Contents</p>
        <ul className="space-y-2">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Sections */}
      <div className="space-y-14">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-20">
            <h2 className="text-xl font-bold text-white mb-5">{section.title}</h2>
            <div className="text-white/60 text-sm leading-relaxed space-y-3">
              {section.content}
            </div>
          </section>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <p className="text-white/30 text-sm">Have questions? Join the community.</p>
        <div className="flex gap-3">
          <a
            href="https://discord.gg"
            target="_blank"
            rel="noopener"
            className="px-5 py-2 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 text-sm transition-all"
          >
            Discord
          </a>
          <Link
            href="/become-creator"
            className="px-5 py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition-colors"
          >
            Launch on OnlyHold
          </Link>
        </div>
      </div>
    </div>
  );
}
