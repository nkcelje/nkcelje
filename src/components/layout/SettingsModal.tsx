'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSquad } from '@/context/SquadContext';
import { useT } from '@/context/I18nContext';
import { FORMATIONS } from '@/data/formations';
import { TacticalPanel } from '@/components/tactical/TacticalPanel';
import type { FormationName } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: Props) {
  const { state, setFormation } = useSquad();
  const t = useT();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // lock scroll while modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      onMouseDown={onClose}
    >
      {/* backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.35)' }}
        aria-hidden
      />

      {/* panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('settings.title')}
        className="relative w-full max-w-md max-h-[85vh] flex flex-col rounded-modal border border-border-subtle shadow-2xl overflow-hidden"
        style={{ background: 'var(--surface-1)' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-base">⚙️</span>
            <h2 className="text-sm font-bold text-text-primary tracking-wide">
              {t('settings.title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:bg-surface-3 hover:text-text-primary transition-colors"
            aria-label={t('settings.close')}
          >
            ✕
          </button>
        </div>

        {/* body (scrollable) */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-6">
          {/* Formation */}
          <div>
            <div className="text-[11px] uppercase tracking-widest font-bold text-text-muted mb-2.5">
              {t('settings.formation')}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FORMATIONS.map((f) => {
                const active = state.formation === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormation(f.id as FormationName)}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-semibold border transition-all duration-150 ${
                      active
                        ? 'text-white border-transparent'
                        : 'bg-surface-3 text-text-secondary border-border-subtle hover:bg-surface-4 hover:text-text-primary'
                    }`}
                    style={active ? { background: '#3b82f6', boxShadow: '0 0 10px #3b82f640' } : {}}
                  >
                    <span className="font-mono tracking-wider">{f.displayName}</span>
                    {active && <span className="text-[10px]">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tactics */}
          <div className="pt-2 border-t border-border-subtle">
            <div className="text-[11px] uppercase tracking-widest font-bold text-text-muted mb-3 mt-3">
              {t('squad.tactics')}
            </div>
            <TacticalPanel />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
