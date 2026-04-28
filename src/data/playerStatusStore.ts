'use client';

import { useSyncExternalStore } from 'react';
import type { PlayerInjury, PlayerLoanReturn } from '@/types';

/**
 * Per-player runtime overlay: contract intent flags, current injury, and
 * pending loan-returns. Persisted to localStorage so user edits survive
 * reloads. Read via `usePlayerStatuses()` for reactive components, or
 * `getPlayerStatuses()` from non-React code.
 */

export interface PlayerStatusOverlay {
  wantExtend?: boolean;
  wantTerminate?: boolean;
  injury?: PlayerInjury;
  loanReturn?: PlayerLoanReturn;
}

export type PlayerStatusMap = Record<string, PlayerStatusOverlay>;

const STORAGE_KEY = 'nkce-player-statuses';

const EMPTY: PlayerStatusMap = {};
let store: PlayerStatusMap = {};
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) store = JSON.parse(raw) as PlayerStatusMap;
  } catch {
    store = {};
  }
}

function persist() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota — ignore */
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

function getSnapshot(): PlayerStatusMap {
  hydrate();
  return store;
}

function getServerSnapshot(): PlayerStatusMap {
  return EMPTY;
}

function setOverlay(id: string, overlay: PlayerStatusOverlay) {
  hydrate();
  if (Object.keys(overlay).length === 0) {
    if (!(id in store)) return;
    const next = { ...store };
    delete next[id];
    store = next;
  } else {
    store = { ...store, [id]: overlay };
  }
  persist();
  emit();
}

export function getStatus(id: string): PlayerStatusOverlay {
  hydrate();
  return store[id] ?? {};
}

export function setWantExtend(id: string, value: boolean) {
  const current = getStatus(id);
  setOverlay(id, {
    ...current,
    wantExtend: value || undefined,
    // mutually exclusive with terminate
    wantTerminate: value ? undefined : current.wantTerminate,
  });
}

export function setWantTerminate(id: string, value: boolean) {
  const current = getStatus(id);
  setOverlay(id, {
    ...current,
    wantTerminate: value || undefined,
    wantExtend: value ? undefined : current.wantExtend,
  });
}

export function setInjury(id: string, injury: PlayerInjury | null) {
  const current = getStatus(id);
  setOverlay(id, { ...current, injury: injury ?? undefined });
}

export function setLoanReturn(id: string, loanReturn: PlayerLoanReturn | null) {
  const current = getStatus(id);
  setOverlay(id, { ...current, loanReturn: loanReturn ?? undefined });
}

export function clearStatus(id: string) {
  setOverlay(id, {});
}

export function usePlayerStatuses(): PlayerStatusMap {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function usePlayerStatus(id: string | null | undefined): PlayerStatusOverlay {
  const all = usePlayerStatuses();
  if (!id) return EMPTY;
  return all[id] ?? EMPTY;
}

/** Non-hook accessor for use in pure functions. */
export function getPlayerStatuses(): PlayerStatusMap {
  hydrate();
  return store;
}
