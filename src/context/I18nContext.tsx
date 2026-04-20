'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { TRANSLATIONS, type Lang } from '@/i18n/translations';

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'nk-lang';

function readInitial(): Lang {
  if (typeof window === 'undefined') return 'ru';
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'ru' || v === 'en' || v === 'sl') return v;
  } catch {}
  // DOM attribute set by pre-hydration script
  const attr = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-lang') : null;
  if (attr === 'ru' || attr === 'en' || attr === 'sl') return attr;
  return 'ru';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ru');

  useEffect(() => {
    const initial = readInitial();
    setLangState(initial);
    document.documentElement.setAttribute('data-lang', initial);
    document.documentElement.setAttribute('lang', initial);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
    document.documentElement.setAttribute('data-lang', l);
    document.documentElement.setAttribute('lang', l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const dict = TRANSLATIONS[lang];
      let out = dict[key] ?? TRANSLATIONS.en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      }
      return out;
    },
    [lang]
  );

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

export function useT() {
  return useI18n().t;
}
