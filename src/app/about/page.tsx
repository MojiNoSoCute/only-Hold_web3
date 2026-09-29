import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About – OnlyHold',
  description: 'Learn about OnlyHold — the Web3-native creator platform built on NFTs and stablecoins.',
};

const TEAM = [
  {
    name: 'Aria Nakamura',
    role: 'Co-Founder & CEO',
    bio: 'Former DeFi lead at Polygon. Passionate about creator ownership.',
    gradient: 'from-purple-600 to-pink-600',
  },
  {
    name: 'Marcus Webb',
    role: 'Co-Founder & CTO',
    bio: 'Solidity engineer with 6 years building on Ethereum.',
    gradient: 'from-blue-600 to-cyan-600',
  },
  {
    name: 'Yuki Tanaka',
    role: 'Head of Design',
    bio: 'Previously led design at two Web3 unicorns.',
    gradient: 'from-green-600 to-teal-600',
  },
];

const VALUES = [
  {
    icon: '🔐',
    title: 'Creator Ownership',
    description:
      'Creators own their audience. No platform can revoke their income or silence their content — it all lives on-chain.',
  },
  {
    icon: '⚡',
    title: 'Instant Payments',
    description:
      'No 30-day payout delays. When a fan mints or deposits, creators receive their share instantly.',
  },
  {
    icon: '🌐',
    title: 'Multi-Chain Native',
    description:
      "Ethereum, Polygon, Arbitrum, Base — fans and creators aren't locked into one ecosystem.",
  },
  {
    icon: '🔓',
    title: 'No Lock-In',
    description:
      'Fans can withdraw stablecoin deposits and sell NFT memberships at any time. Full financial freedom.',
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          Our Mission
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
          Creators deserve to{' '}
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            own their audience
          </span>
        </h1>
        <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
          OnlyHold was born from a simple belief: platforms should serve creators, not the other way
          around. We built the first subscription system where fans hold real assets — not receipts.
        </p>
      </div>

      {/* Values */}
      <section className="mb-20">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">What We Stand For</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {VALUES.map((v) => (
            <div key={v.title} className="bg-[#13131a] border border-white/5 rounded-2xl p-6">
              <div className="text-3xl mb-3">{v.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">{v.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{v.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — brief */}
      <section className="mb-20 bg-gradient-to-br from-purple-900/20 to-pink-900/10 border border-white/5 rounded-3xl p-8">
        <h2 className="text-2xl font-bold text-white mb-4">The OnlyHold Model</h2>
        <p className="text-white/60 text-sm leading-relaxed mb-6">
          Every creator who registers on OnlyHold gets two smart contracts deployed for them:
        </p>
        <div className="space-y-4">
          {[
            {
              title: 'NFT Membership Contract',
              desc: 'A custom ERC-721 contract. Fans mint a token once for lifetime access. The NFT is tradeable — fans can sell their membership on any marketplace.',
              color: 'text-purple-400',
              bg: 'bg-purple-500/10 border-purple-500/20',
            },
            {
              title: 'Stablecoin Subscription Contract',
              desc: 'Fans deposit USDC/USDT. Access is granted per-second as long as there is a balance. Fans withdraw the remainder anytime — creators earn instantly.',
              color: 'text-green-400',
              bg: 'bg-green-500/10 border-green-500/20',
            },
          ].map((item) => (
            <div key={item.title} className={`rounded-xl border p-4 ${item.bg}`}>
              <p className={`font-bold text-sm mb-1 ${item.color}`}>{item.title}</p>
              <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-white/40 text-xs mt-4">
          The platform charges a 5% fee. Creators keep 95%.
        </p>
      </section>

      {/* Team */}
      <section className="mb-20">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">The Team</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {TEAM.map((member) => (
            <div key={member.name} className="bg-[#13131a] border border-white/5 rounded-2xl p-5 text-center">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${member.gradient} mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold`}
              >
                {member.name[0]}
              </div>
              <p className="text-white font-bold text-sm">{member.name}</p>
              <p className="text-purple-400 text-xs mt-0.5 mb-2">{member.role}</p>
              <p className="text-white/40 text-xs leading-relaxed">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to join?</h2>
        <p className="text-white/50 mb-6">Start earning on-chain today. Free to set up.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/become-creator"
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition-all"
          >
            Become a Creator
          </Link>
          <Link
            href="/explore"
            className="px-8 py-3 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition-all"
          >
            Explore Creators
          </Link>
        </div>
      </div>
    </div>
  );
}
