'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useWeb3 } from '@/lib/Web3Provider';
import { useOnlyHold } from '@/lib/useOnlyHold';
import { shortenAddress } from '@/lib/utils';
import { isAdmin } from '@/lib/adminData';
import WalletModal from './WalletModal';

export default function Navbar() {
  const pathname = usePathname();
  const { address, isConnected, disconnect, isConnecting } = useWeb3();
  const { checkIsRegistered } = useOnlyHold();
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      checkIsRegistered(address).then((res) => setIsCreator(res.isRegistered));
    } else {
      setIsCreator(false);
    }
  }, [isConnected, address, checkIsRegistered]);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(path + '/');
  };

  const navItemClass = (path: string) =>
    `px-3 py-1.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
      isActive(path)
        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
        : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
    }`;

  const dropdownItemClass = (path: string) =>
    `flex items-center gap-2 px-4 py-3 text-sm transition-colors ${
      isActive(path)
        ? 'bg-purple-600/20 text-purple-300 font-semibold border-l-2 border-purple-500'
        : 'text-white/70 hover:text-white hover:bg-white/5'
    }`;

  const mobileItemClass = (path: string) =>
    `block py-2.5 px-3 rounded-xl text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
        : 'text-white/70 hover:text-white hover:bg-white/5'
    }`;

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
          <div className="hidden md:flex items-center gap-2">
            <Link href="/explore" className={navItemClass('/explore')}>
              สำรวจ
            </Link>
            <Link href="/creators" className={navItemClass('/creators')}>
              ครีเอเตอร์
            </Link>
            {isConnected && (
              <Link href="/feed" className={navItemClass('/feed')}>
                ฟีดของฉัน
              </Link>
            )}
            {isCreator ? (
              <Link
                href="/dashboard"
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                  isActive('/dashboard')
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                    : 'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20'
                }`}
              >
                <span>📊</span> แดชบอร์ดครีเอเตอร์
              </Link>
            ) : (
              <Link href="/become-creator" className={navItemClass('/become-creator')}>
                เป็นครีเอเตอร์
              </Link>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-sm ${
                    isActive('/profile') || isActive('/my-nfts') || isActive('/dashboard')
                      ? 'bg-purple-600/20 border-purple-500/50 text-white'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0" />
                  <span className="hidden sm:block font-mono text-white/90">{shortenAddress(address!)}</span>
                  <svg className="w-3 h-3 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-[#13131a] border border-white/10 shadow-2xl overflow-hidden z-50 py-1"
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <Link
                      href="/profile"
                      className={dropdownItemClass('/profile')}
                      onClick={() => setDropdownOpen(false)}
                    >
                      <span>👤</span> โปรไฟล์ของฉัน
                    </Link>
                    <Link
                      href="/dashboard"
                      className={dropdownItemClass('/dashboard')}
                      onClick={() => setDropdownOpen(false)}
                    >
                      <span>📊</span> แดชบอร์ดครีเอเตอร์
                    </Link>
                    <Link
                      href="/my-nfts"
                      className={dropdownItemClass('/my-nfts')}
                      onClick={() => setDropdownOpen(false)}
                    >
                      <span>🖼️</span> NFT ของฉัน
                    </Link>
                    {isAdmin(address) && (
                      <Link
                        href="/admin"
                        className={dropdownItemClass('/admin')}
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span>🛠️</span> Admin Panel
                      </Link>
                    )}
                    <hr className="border-white/5 my-1" />
                    <button
                      onClick={() => {
                        disconnect();
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <span>🔌</span> ตัดการเชื่อมต่อ
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setWalletModalOpen(true)}
                disabled={isConnecting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium transition-all shadow-lg hover:shadow-purple-500/30 disabled:opacity-50"
              >
                {isConnecting ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อกระเป๋า'}
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-white/5 transition-colors"
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

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#0a0a0f]/95 px-4 py-4 space-y-2">
            <Link
              href="/explore"
              className={mobileItemClass('/explore')}
              onClick={() => setMenuOpen(false)}
            >
              🌐 สำรวจ
            </Link>
            <Link
              href="/creators"
              className={mobileItemClass('/creators')}
              onClick={() => setMenuOpen(false)}
            >
              👥 ครีเอเตอร์
            </Link>
            {isConnected && (
              <Link
                href="/feed"
                className={mobileItemClass('/feed')}
                onClick={() => setMenuOpen(false)}
              >
                📰 ฟีดของฉัน
              </Link>
            )}
            {isCreator ? (
              <Link
                href="/dashboard"
                className={mobileItemClass('/dashboard')}
                onClick={() => setMenuOpen(false)}
              >
                📊 แดชบอร์ดครีเอเตอร์
              </Link>
            ) : (
              <Link
                href="/become-creator"
                className={mobileItemClass('/become-creator')}
                onClick={() => setMenuOpen(false)}
              >
                🚀 เป็นครีเอเตอร์
              </Link>
            )}
          </div>
        )}
      </nav>

      {walletModalOpen && <WalletModal onClose={() => setWalletModalOpen(false)} />}
    </>
  );
}
