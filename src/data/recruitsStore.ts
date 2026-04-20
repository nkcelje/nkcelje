'use client';

import { useSyncExternalStore } from 'react';
import type { Player } from '@/types';

/**
 * Module-level store of players that were added to the team from the Shortlist.
 * Backed by localStorage so recruits persist across reloads. Reading via the
 * `useRecruits` hook makes components re-render when the list changes.
 */

const STORAGE_KEY = 'nkce-recruits';

let recruits: Player[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) recruits = JSON.parse(raw) as Player[];
  } catch {
    recruits = [];
  }
}

function persist() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recruits));
  } catch {
    /* ignore quota */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  hydrate();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): Player[] {
  hydrate();
  return recruits;
}

function getServerSnapshot(): Player[] {
  return [];
}

export function addRecruit(player: Player) {
  hydrate();
  if (recruits.some((p) => p.id === player.id)) return;
  recruits = [...recruits, player];
  persist();
  emit();
}

export function removeRecruit(id: string) {
  hydrate();
  if (!recruits.some((p) => p.id === id)) return;
  recruits = recruits.filter((p) => p.id !== id);
  persist();
  emit();
}

export function useRecruits(): Player[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
