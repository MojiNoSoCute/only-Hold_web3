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
  title: 'OnlyHold – สนับสนุนครีเอเตอร์ด้วย NFT & Stablecoin',
  description:
    'แพลตฟอร์มครีเอเตอร์บน Web3 สมัครสมาชิกด้วยการถือ NFT หรือฝาก Stablecoin เพื่อปลดล็อกคอนเทนต์พิเศษ',
  keywords: ['NFT', 'ครีเอเตอร์', 'blockchain', 'stablecoin', 'คอนเทนต์พิเศษ', 'Web3', 'Sepolia'],
  openGraph: {
    title: 'OnlyHold',
    description: 'สนับสนุนครีเอเตอร์ ถือ NFT ปลดล็อกทุกอย่าง',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0f] text-white min-h-screen`}>
        <Web3Provider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
        </Web3Provider>
      </body>
    </html>
  );
}
