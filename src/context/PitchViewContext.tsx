'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Which renderer the squad page uses for the pitch.
 *
 *  - "tables": the new per-position table layout (default)
 *  - "tokens": the legacy circular badge ("кружок") layout
 */
export type PitchView = 'tables' | 'tokens';

const STORAGE_KEY = 'nkce-pitch-view';
const DEFAULT_VIEW: PitchView = 'tables';

interface Ctx {
  view: PitchView;
  setView: (v: PitchView) => void;
  toggle: () => void;
}

const PitchViewContext = createContext<Ctx | null>(null);

function readInitial(): PitchView {
  if (typeof window === 'undefined') return DEFAULT_VIEW;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'tables' || raw === 'tokens') return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_VIEW;
}

export function PitchViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setViewState] = useState<PitchView>(DEFAULT_VIEW);

  // Hydrate after mount so SSR uses default and we avoid mismatch.
  useEffect(() => {
    setViewState(readInitial());
  }, []);

  const setView = useCallback((v: PitchView) => {
    setViewState(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      /* quota — ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setViewState((prev) => {
      const next: PitchView = prev === 'tables' ? 'tokens' : 'tables';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ view, setView, toggle }), [view, setView, toggle]);
  return <PitchViewContext.Provider value={value}>{children}</PitchViewContext.Provider>;
}

export function usePitchView() {
  const ctx = useContext(PitchViewContext);
  if (!ctx) throw new Error('usePitchView must be used inside PitchViewProvider');
  return ctx;
}
