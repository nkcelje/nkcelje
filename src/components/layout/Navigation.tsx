'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSquad } from '@/context/SquadContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/context/I18nContext';
import { LANGS, type Lang } from '@/i18n/translations';
import { useState, useRef, useEffect } from 'react';
import { SettingsModal } from './SettingsModal';

export function Navigation() {
  const pathname = usePathname();
  const { state } = useSquad();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const navItems = [
    { href: '/', label: t('nav.squad') },
    { href: '/shortlist', label: t('nav.shortlist') },
    { href: '/comparison', label: t('nav.comparison') },
  ];

  return (
    <header
      className="sticky top-0 z-40 border-b border-border-subtle flex items-center gap-4 px-5 h-14 shrink-0"
      style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(14px)' }}
    >
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2.5 pr-3 shrink-0 group">
        <Image
          src="/logo.png"
          alt="NKCE_AI"
          width={32}
          height={32}
          priority
          className="w-8 h-8 object-contain shrink-0"
        />
        <div className="leading-tight hidden md:block">
          <div className="font-black text-text-primary text-[13px] tracking-wider">NKCE_AI</div>
          <div className="text-[9px] text-text-muted uppercase tracking-widest">{t('brand.club')}</div>
        </div>
      </Link>

      <div className="w-px h-6 bg-border-subtle shrink-0 hidden md:block" />

      {/* Tabs */}
      <nav className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-3 border border-transparent'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right: score chips + language + theme */}
      <div className="flex items-center gap-3 shrink-0">
        <MiniChip label={t('chip.ovr')} value={state.teamScore} color="#f59e0b" />
        <MiniChip label={t('chip.chm')} value={state.chemistryScore} color="#10b981" />
        <MiniChip label={t('chip.tac')} value={state.tacticalFitScore} color="#06b6d4" />

        <div className="w-px h-6 bg-border-subtle" />

        <LangSwitcher lang={lang} onChange={setLang} title={t('lang.label')} />

        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? t('theme.toggle.toLight') : t('theme.toggle.toDark')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border-subtle text-[11px] text-text-secondary transition-colors"
        >
          <span aria-hidden>{theme === 'dark' ? '🌙' : '☀️'}</span>
          <span className="hidden lg:inline">{theme === 'dark' ? t('theme.dark') : t('theme.light')}</span>
        </button>

        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          title={t('settings.open')}
          aria-label={t('settings.open')}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border-subtle text-text-secondary hover:text-text-primary transition-colors"
        >
          <GearIcon />
        </button>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}

function GearIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function MiniChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-2 border border-border-subtle">
      <span className="text-[9px] text-text-muted uppercase tracking-widest font-bold">{label}</span>
      <span className="text-sm font-bold score-number leading-none" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function LangSwitcher({ lang, onChange, title }: { lang: Lang; onChange: (l: Lang) => void; title: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={title}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border-subtle text-[11px] text-text-secondary transition-colors"
      >
        <span aria-hidden>{current.flag}</span>
        <span className="font-bold tracking-wider">{current.short}</span>
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1.5 rounded-lg border border-border-subtle shadow-xl overflow-hidden z-50 min-w-[140px]"
          style={{ background: 'var(--surface-2)' }}
        >
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                onChange(l.code);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] text-left transition-colors ${
                l.code === lang
                  ? 'bg-accent/15 text-accent'
                  : 'text-text-secondary hover:bg-surface-3 hover:text-text-primary'
              }`}
            >
              <span aria-hidden>{l.flag}</span>
              <span>{l.label}</span>
              {l.code === lang && <span className="ml-auto text-[10px]">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
