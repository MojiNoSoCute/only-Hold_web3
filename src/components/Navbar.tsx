'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { shortenAddress } from '@/lib/utils';
import WalletModal from './WalletModal';

export default function Navbar() {
  const { address, isConnected, connect, disconnect, isConnecting } = useWeb3();
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:shadow-purple-500/40 transition-shadow">
              OH
            </div>
            <span className="font-bold text-lg tracking-tight">
              Only<span className="gradient-text">Hold</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-sm text-white/60">
            <Link href="/explore" className="hover:text-white transition-colors">
              สำรวจ
            </Link>
            <Link href="/creators" className="hover:text-white transition-colors">
              ครีเอเตอร์
            </Link>
            {isConnected && (
              <Link href="/feed" className="hover:text-white transition-colors">
                ฟีดของฉัน
              </Link>
            )}
            <Link href="/become-creator" className="hover:text-white transition-colors">
              เป็นครีเอเตอร์
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                  <span className="hidden sm:block font-mono text-white/80">{shortenAddress(address!)}</span>
                  <svg className="w-3 h-3 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#13131a] border border-white/10 shadow-xl overflow-hidden z-50"
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <Link href="/profile" className="flex items-center gap-2 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors" onClick={() => setDropdownOpen(false)}>
                      <span>👤</span> โปรไฟล์ของฉัน
                    </Link>
                    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors" onClick={() => setDropdownOpen(false)}>
                      <span>📊</span> แดชบอร์ดครีเอเตอร์
                    </Link>
                    <Link href="/my-nfts" className="flex items-center gap-2 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors" onClick={() => setDropdownOpen(false)}>
                      <span>🖼️</span> NFT ของฉัน
                    </Link>
                    <hr className="border-white/5 my-1" />
                    <button onClick={() => { disconnect(); setDropdownOpen(false); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                      <span>🔌</span> ตัดการเชื่อมต่อ
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setWalletModalOpen(true)}
                disabled={isConnecting}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium transition-all shadow-lg hover:shadow-purple-500/30 disabled:opacity-50"
              >
                {isConnecting ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อกระเป๋า'}
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#0a0a0f]/95 px-4 py-4 space-y-3">
            <Link href="/explore" className="block text-white/70 hover:text-white py-2" onClick={() => setMenuOpen(false)}>สำรวจ</Link>
            <Link href="/creators" className="block text-white/70 hover:text-white py-2" onClick={() => setMenuOpen(false)}>ครีเอเตอร์</Link>
            {isConnected && (
              <Link href="/feed" className="block text-white/70 hover:text-white py-2" onClick={() => setMenuOpen(false)}>ฟีดของฉัน</Link>
            )}
            <Link href="/become-creator" className="block text-white/70 hover:text-white py-2" onClick={() => setMenuOpen(false)}>เป็นครีเอเตอร์</Link>
          </div>
        )}
      </nav>

      {walletModalOpen && <WalletModal onClose={() => setWalletModalOpen(false)} />}
    </>
  );
}
