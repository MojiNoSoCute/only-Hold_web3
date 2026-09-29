import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Web3Provider } from '@/lib/Web3Provider';
import Navbar from '@/components/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'OnlyHold – Support Creators via NFT & Stablecoin',
  description:
    'The Web3-native creator platform. Subscribe to your favourite creators by holding their NFTs or depositing stablecoins to unlock exclusive content.',
  keywords: ['NFT', 'creator', 'blockchain', 'stablecoin', 'exclusive content', 'Web3'],
  openGraph: {
    title: 'OnlyHold',
    description: 'Support creators. Hold NFTs. Unlock content.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0f] text-white min-h-screen`}>
        <Web3Provider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
        </Web3Provider>
      </body>
    </html>
  );
}
