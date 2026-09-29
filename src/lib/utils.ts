// ============================================================
// OnlyHold - Utility Functions
// ============================================================

/**
 * Shortens an Ethereum address for display
 * @example "0x1234...5678"
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Formats a number with K/M suffixes
 */
export function formatNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null || num === '') return '0';
  const n = typeof num === 'number' ? num : parseFloat(String(num));
  if (isNaN(n)) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/**
 * Formats a USD value with commas
 */
export function formatUSD(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === '') return '$0';
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return '$0';
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Formats ETH value with symbol
 */
export function formatETH(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === '') return '0 ETH';
  return `${value} ETH`;
}

/**
 * Returns a relative time string in Thai (e.g., "2 วันที่แล้ว")
 */
export function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return 'เมื่อกี้';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'เมื่อกี้';
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 0) return 'เมื่อกี้';

    const intervals: [number, string][] = [
      [31536000, 'ปี'],
      [2592000, 'เดือน'],
      [86400, 'วัน'],
      [3600, 'ชั่วโมง'],
      [60, 'นาที'],
    ];

    for (const [secs, label] of intervals) {
      const count = Math.floor(seconds / secs);
      if (count >= 1) return `${count} ${label}ที่แล้ว`;
    }
    return 'เมื่อกี้';
  } catch {
    return 'เมื่อกี้';
  }
}

/**
 * Content type icons
 */
export const CONTENT_TYPE_ICONS: Record<string, string> = {
  video: '🎬',
  audio: '🎵',
  image: '🖼️',
  text: '📄',
};

/**
 * Category colors for badges
 */
export const CATEGORY_COLORS: Record<string, string> = {
  art: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  music: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  fitness: 'bg-green-500/20 text-green-400 border-green-500/30',
  gaming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  education: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  lifestyle: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  photography: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  writing: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

/**
 * Merge class names conditionally
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates an Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Compresses an image file and converts to Base64 Data URL (JPEG)
 * to ensure it fits comfortably within localStorage and renders quickly.
 */
export function compressImageFile(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('ไฟล์ที่เลือกไม่ใช่รูปภาพ'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

