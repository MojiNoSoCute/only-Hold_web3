'use client';

/**
 * adminData.ts — Real data store for Creators and Content
 */

import type { Creator, Content } from './types';

// ─── Admin address ─────────────────────────────────────────────────────────

export const ADMIN_ADDRESS = '0x2bB2A9aB6e9fe4d3C8990aD10e247C830A0b9776';

export function isAdmin(address: string | null | undefined): boolean {
  if (!address) return false;
  return address.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
}

// ─── localStorage keys ──────────────────────────────────────────────────────

const KEY_CREATORS = 'onlyhold_mock_creators';
const KEY_CONTENT  = 'onlyhold_mock_content';

// ─── Creators ───────────────────────────────────────────────────────────────

export function getAdminCreators(): Creator[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY_CREATORS);
    if (!raw) return [];
    const list = JSON.parse(raw) as Creator[];
    return list;
  } catch {
    return [];
  }
}

export function saveAdminCreators(creators: Creator[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_CREATORS, JSON.stringify(creators));
  bustCache();
}

export function addAdminCreator(creator: Creator): void {
  const list = getAdminCreators();
  list.push(creator);
  saveAdminCreators(list);
}

export function updateAdminCreator(updated: Creator): void {
  const list = getAdminCreators().map((c) => (c.id === updated.id ? updated : c));
  saveAdminCreators(list);
}

export function deleteAdminCreator(id: string): void {
  const list = getAdminCreators().filter((c) => c.id !== id);
  saveAdminCreators(list);
  const content = getAdminContent().filter((c) => c.creatorId !== id);
  saveAdminContent(content);
}

// ─── Content ────────────────────────────────────────────────────────────────

export function getAdminContent(): Content[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY_CONTENT);
    if (!raw) return [];
    return JSON.parse(raw) as Content[];
  } catch {
    return [];
  }
}

export function saveAdminContent(content: Content[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY_CONTENT, JSON.stringify(content));
  bustCache();
}

export function addAdminContent(item: Content): void {
  const list = getAdminContent();
  list.push(item);
  saveAdminContent(list);
}

export function updateAdminContent(updated: Content): void {
  const list = getAdminContent().map((c) => (c.id === updated.id ? updated : c));
  saveAdminContent(list);
}

export function deleteAdminContent(id: string): void {
  const list = getAdminContent().filter((c) => c.id !== id);
  saveAdminContent(list);
}

// ─── Reset to defaults ───────────────────────────────────────────────────────

export function resetAdminData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY_CREATORS);
  localStorage.removeItem(KEY_CONTENT);
  bustCache();
}

// ─── Cache buster ────────────────────────────────────────────────────────────

const CACHE_KEY = 'onlyhold_admin_version';

export function bustCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CACHE_KEY, String(Date.now()));
  window.dispatchEvent(new Event('onlyhold-admin-update'));
}

export function getAdminVersion(): number {
  if (typeof window === 'undefined') return 0;
  return Number(localStorage.getItem(CACHE_KEY) ?? 0);
}
