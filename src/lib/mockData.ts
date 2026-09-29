// ============================================================
// OnlyHold - Mock Data (replace with real blockchain data)
// ============================================================

import { Creator, Content } from './types';

export const MOCK_CREATORS: Creator[] = [];

export const MOCK_CONTENT: Content[] = [];

export const CATEGORIES = [
  { value: 'all', label: 'ทั้งหมด', icon: '🌐' },
  { value: 'art', label: 'ศิลปะ', icon: '🎨' },
  { value: 'music', label: 'ดนตรี', icon: '🎵' },
  { value: 'fitness', label: 'ฟิตเนส', icon: '💪' },
  { value: 'gaming', label: 'เกม', icon: '🎮' },
  { value: 'education', label: 'การศึกษา', icon: '📚' },
  { value: 'lifestyle', label: 'ไลฟ์สไตล์', icon: '✨' },
  { value: 'photography', label: 'ถ่ายภาพ', icon: '📷' },
  { value: 'writing', label: 'งานเขียน', icon: '✍️' },
];

export const SUPPORTED_CHAINS = {
  mainnet: { id: 1, name: 'Ethereum' },
  polygon: { id: 137, name: 'Polygon' },
  arbitrum: { id: 42161, name: 'Arbitrum' },
  base: { id: 8453, name: 'Base' },
};
