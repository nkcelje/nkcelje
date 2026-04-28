'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { LANGS, type Lang } from '@/i18n/translations';
import { SettingsModal } from './SettingsModal';

const NAV_ITEMS: { href: string; numKey: string; labelKey: string }[] = [
  { href: '/', numKey: '01', labelKey: 'nav.squad' },
  { href: '/shortlist', numKey: '02', labelKey: 'nav.shortlist' },
  { href: '/comparison', numKey: '03', labelKey: 'nav.comparison' },
];

export function Navigation() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="topbar">
      {/* Brand */}
      <Link href="/" className="brand" style={{ textDecoration: 'none' }}>
        <div className="brand-mark">A</div>
        <div className="brand-text">
          <div className="brand-name">ALGORYTHM</div>
          <div className="brand-sub">{t('brand.club')} · {t('brand.tagline')}</div>
        </div>
      </Link>

      {/* Tabs */}
      <nav className="nav">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="num">{item.numKey}</span>
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* Right cluster */}
      <div className="topbar-right">
        <span className="chip">Season 25/26</span>
        <span className="chip">MD 28</span>
        <span className="chip">
          <span className="dot" />
          Sync · 2m
        </span>

        <div className="divider-v" />

        <button
          type="button"
          className="theme-toggle"
          title={theme === 'dark' ? t('theme.toggle.toLight') : t('theme.toggle.toDark')}
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        <div className="divider-v" />

        <LangToggle lang={lang} setLang={setLang} />

        <button
          type="button"
          className="icon-btn"
          onClick={() => setSettingsOpen(true)}
          title={t('settings.open')}
          aria-label={t('settings.open')}
        >
          <GearIcon />
        </button>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}

function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="lang-toggle">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          className={l.code === lang ? 'on' : ''}
          title={l.label}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
