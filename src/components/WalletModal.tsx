'use client';

import { useWeb3 } from '@/lib/Web3Provider';

interface WalletModalProps {
  onClose: () => void;
}

const WALLETS = [
  { id: 'metamask', name: 'MetaMask', icon: '🦊', description: 'เชื่อมต่อด้วย MetaMask extension' },
  { id: 'walletconnect', name: 'WalletConnect', icon: '🔗', description: 'สแกน QR ด้วยกระเป๋า WalletConnect' },
  { id: 'coinbase', name: 'Coinbase Wallet', icon: '💙', description: 'เชื่อมต่อด้วย Coinbase Wallet' },
  { id: 'trust', name: 'Trust Wallet', icon: '🛡️', description: 'เชื่อมต่อด้วย Trust Wallet' },
];

export default function WalletModal({ onClose }: WalletModalProps) {
  const { connect, isConnecting } = useWeb3();

  const handleConnect = async () => {
    await connect();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm bg-[#13131a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">เชื่อมต่อกระเป๋า</h2>
              <p className="text-sm text-white/50 mt-0.5">เลือกกระเป๋าที่คุณต้องการใช้</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/60"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Wallet Options */}
        <div className="p-4 space-y-2">
          {WALLETS.map((wallet) => (
            <button
              key={wallet.id}
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/5 hover:bg-white/8 hover:border-purple-500/30 transition-all text-left group disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                {wallet.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm">{wallet.name}</p>
                <p className="text-xs text-white/40 truncate">{wallet.description}</p>
              </div>
              <svg className="w-4 h-4 text-white/20 group-hover:text-purple-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-white/30">
            การเชื่อมต่อถือว่าคุณยอมรับ{' '}
            <span className="text-purple-400 cursor-pointer hover:underline">ข้อกำหนดการใช้งาน</span>{' '}
            และ{' '}
            <span className="text-purple-400 cursor-pointer hover:underline">นโยบายความเป็นส่วนตัว</span>
          </p>
        </div>
      </div>
    </div>
  );
}
