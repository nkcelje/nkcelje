'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * User-configurable visibility for the position-table columns. Persisted
 * across sessions in localStorage. Importance order matches the user's
 * spec: rating > contract > salary > injury > loan-return > flags.
 */

export type ColumnKey =
  | 'rating'        // OVR
  | 'contract'      // MM.YYYY
  | 'salary'        // €/year per player
  | 'injury'        // recovery date
  | 'loanReturn'    // loan return date
  | 'wantExtend'    // checkbox flag
  | 'wantTerminate' // checkbox flag
  | 'salaryTotal';  // per-slot footer with summed annual salary

export interface ColumnPrefs {
  rating: boolean;
  contract: boolean;
  salary: boolean;
  injury: boolean;
  loanReturn: boolean;
  wantExtend: boolean;
  wantTerminate: boolean;
  salaryTotal: boolean;
}

const DEFAULT_PREFS: ColumnPrefs = {
  rating: true,
  contract: true,
  salary: false,
  injury: true,
  loanReturn: true,
  wantExtend: false,
  wantTerminate: false,
  salaryTotal: false,
};

const STORAGE_KEY = 'nkce-column-prefs';

interface Ctx {
  prefs: ColumnPrefs;
  setColumn: (key: ColumnKey, value: boolean) => void;
  resetColumns: () => void;
}

const ColumnPrefsContext = createContext<Ctx | null>(null);

function readInitial(): ColumnPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ColumnPrefs>;
      return { ...DEFAULT_PREFS, ...parsed };
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_PREFS;
}

export function ColumnPrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<ColumnPrefs>(DEFAULT_PREFS);

  // Hydrate after mount so SSR matches default and we avoid flashing.
  useEffect(() => {
    setPrefs(readInitial());
  }, []);

  const setColumn = useCallback((key: ColumnKey, value: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* quota — ignore */
      }
      return next;
    });
  }, []);

  const resetColumns = useCallback(() => {
    setPrefs(DEFAULT_PREFS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ prefs, setColumn, resetColumns }), [prefs, setColumn, resetColumns]);
  return <ColumnPrefsContext.Provider value={value}>{children}</ColumnPrefsContext.Provider>;
}

export function useColumnPrefs() {
  const ctx = useContext(ColumnPrefsContext);
  if (!ctx) throw new Error('useColumnPrefs must be used inside ColumnPrefsProvider');
  return ctx;
}

/**
 * Importance-ordered list of columns, used by the position-table to decide
 * the order of cells when multiple are visible.
 */
export const COLUMN_ORDER: ColumnKey[] = [
  'rating',
  'contract',
  'salary',
  'injury',
  'loanReturn',
  'wantExtend',
  'wantTerminate',
  'salaryTotal',
];

export const COLUMN_LABEL_KEYS: Record<ColumnKey, string> = {
  rating: 'col.rating',
  contract: 'col.contract',
  salary: 'col.salary',
  injury: 'col.injury',
  loanReturn: 'col.loanReturn',
  wantExtend: 'col.wantExtend',
  wantTerminate: 'col.wantTerminate',
  salaryTotal: 'col.salaryTotal',
};
