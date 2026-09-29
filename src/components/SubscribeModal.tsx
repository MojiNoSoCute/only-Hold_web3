'use client';

import { useState } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { MOCK_CREATORS } from '@/lib/mockData';
import WalletModal from './WalletModal';

interface SubscribeModalProps {
  creatorId: string;
  creatorName: string;
  onClose: () => void;
}

type Tab = 'nft' | 'stablecoin';

export default function SubscribeModal({ creatorId, creatorName, onClose }: SubscribeModalProps) {
  const { isConnected, address } = useWeb3();
  const [activeTab, setActiveTab] = useState<Tab>('nft');
  const [months, setMonths] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txSuccess, setTxSuccess] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const creator = MOCK_CREATORS.find((c) => c.id === creatorId);
  if (!creator) return null;

  const stablecoinTotal = parseFloat(creator.stablecoinPrice || '0') * months;

  const handleSubscribe = async () => {
    if (!isConnected) {
      setWalletModalOpen(true);
      return;
    }
    setIsProcessing(true);
    // Simulating blockchain transaction
    await new Promise((r) => setTimeout(r, 2500));
    setIsProcessing(false);
    setTxSuccess(true);
  };

  if (txSuccess) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 w-full max-w-sm bg-[#13131a] border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4 text-3xl">
            🎉
          </div>
          <h2 className="text-xl font-bold text-white mb-2">You're In!</h2>
          <p className="text-white/60 text-sm mb-6">
            {activeTab === 'nft'
              ? `Your ${creatorName} NFT membership has been minted.`
              : `You're now subscribed to ${creatorName} for ${months} month(s).`}
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Explore Exclusive Content
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <div className="relative z-10 w-full max-w-md bg-[#13131a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-white text-lg">Subscribe to {creatorName}</h2>
                <p className="text-white/40 text-sm mt-0.5">Choose your access method</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 transition-colors">✕</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex p-1.5 m-4 bg-white/3 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('nft')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'nft' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
            >
              🖼️ Hold NFT
            </button>
            <button
              onClick={() => setActiveTab('stablecoin')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'stablecoin' ? 'bg-green-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
            >
              💵 Stablecoin
            </button>
          </div>

          <div className="px-4 pb-4">
            {activeTab === 'nft' ? (
              /* NFT Tab */
              <div className="space-y-4">
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-xl flex-shrink-0">
                      🎫
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{creatorName} Membership NFT</h3>
                      <p className="text-white/50 text-xs mt-1">
                        Mint a soulbound NFT that grants you lifetime access. Trade or sell your membership anytime.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between py-2 border-t border-purple-500/20">
                    <span className="text-white/50 text-sm">Mint Price</span>
                    <span className="text-purple-300 font-bold">{creator.nftPrice} ETH</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {[
                    'Lifetime access to all exclusive content',
                    'Tradeable on OpenSea & other marketplaces',
                    'Access to token-gated community',
                    'Early access to new drops',
                  ].map((benefit) => (
                    <div key={benefit} className="flex items-center gap-2 text-white/60">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {benefit}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSubscribe}
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                      </svg>
                      Minting NFT...
                    </>
                  ) : !isConnected ? (
                    'Connect Wallet to Mint'
                  ) : (
                    `Mint for ${creator.nftPrice} ETH`
                  )}
                </button>
              </div>
            ) : (
              /* Stablecoin Tab */
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-xl flex-shrink-0">
                      💰
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Deposit & Subscribe</h3>
                      <p className="text-white/50 text-xs mt-1">
                        Deposit USDC. Access remains active as long as your balance covers the subscription. Withdraw anytime.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Months Selector */}
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Select Duration</label>
                  <div className="flex gap-2">
                    {[1, 3, 6, 12].map((m) => (
                      <button
                        key={m}
                        onClick={() => setMonths(m)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${months === m ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-white/3 border-white/10 text-white/40 hover:border-white/20'}`}
                      >
                        {m}mo
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pricing breakdown */}
                <div className="bg-white/3 border border-white/5 rounded-xl p-3 space-y-2 text-sm">
                  <div className="flex justify-between text-white/50">
                    <span>Rate</span>
                    <span>${creator.stablecoinPrice} USDC/month</span>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span>Duration</span>
                    <span>{months} month{months > 1 ? 's' : ''}</span>
                  </div>
                  <div className="border-t border-white/5 pt-2 flex justify-between text-white font-bold">
                    <span>Total Deposit</span>
                    <span className="text-green-400">${stablecoinTotal} USDC</span>
                  </div>
                </div>

                <button
                  onClick={handleSubscribe}
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                      </svg>
                      Depositing USDC...
                    </>
                  ) : !isConnected ? (
                    'Connect Wallet'
                  ) : (
                    `Deposit $${stablecoinTotal} USDC`
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {walletModalOpen && (
        <WalletModal onClose={() => setWalletModalOpen(false)} />
      )}
    </>
  );
}
