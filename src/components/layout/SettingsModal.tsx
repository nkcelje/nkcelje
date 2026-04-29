'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSquad } from '@/context/SquadContext';
import { useT } from '@/context/I18nContext';
import { FORMATIONS } from '@/data/formations';
import { TacticalPanel } from '@/components/tactical/TacticalPanel';
import {
  COLUMN_LABEL_KEYS,
  COLUMN_ORDER,
  useColumnPrefs,
} from '@/context/ColumnPrefsContext';
import type { FormationName } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: Props) {
  const { state, setFormation } = useSquad();
  const { prefs, setColumn, resetColumns } = useColumnPrefs();
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
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const modal = (
    <div className="modal-bg" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('settings.title')}
        className="modal"
        style={{ maxHeight: '85vh', width: 'min(560px, 92vw)' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-0)' }}>
            {t('settings.title')}
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label={t('settings.close')}
          >
            ×
          </button>
        </div>

        <div
          className="modal-body"
          style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}
        >
          {/* Formation */}
          <Section title={t('settings.formation')}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {FORMATIONS.map((f) => {
                const active = state.formation === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormation(f.id as FormationName)}
                    className={active ? 'btn primary' : 'btn'}
                    style={{
                      flex: 0,
                      padding: '10px 14px',
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {f.displayName}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Position-table columns */}
          <Section
            title={t('settings.columns.title')}
            hint={t('settings.columns.hint')}
            action={
              <button
                type="button"
                onClick={resetColumns}
                style={{
                  background: 'none',
                  border: 0,
                  color: 'var(--ink-3)',
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {t('settings.columns.reset')}
              </button>
            }
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {COLUMN_ORDER.map((key) => (
                <ColumnRow
                  key={key}
                  label={t(COLUMN_LABEL_KEYS[key])}
                  checked={prefs[key]}
                  onToggle={(v) => setColumn(key, v)}
                />
              ))}
            </div>
          </Section>

          {/* Tactics */}
          <Section title={t('squad.tactics')}>
            <TacticalPanel />
          </Section>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function Section({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ paddingTop: 14, borderTop: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hint ? 4 : 12 }}>
        <div
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            fontWeight: 600,
            color: 'var(--ink-3)',
          }}
        >
          {title}
        </div>
        {action}
      </div>
      {hint && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 10 }}>{hint}</div>}
      {children}
    </div>
  );
}

function ColumnRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!checked)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '8px 10px',
        background: checked ? 'rgba(250,140,22,0.08)' : 'var(--bg-2)',
        border: `1px solid ${checked ? 'rgba(250,140,22,0.40)' : 'var(--line)'}`,
        borderRadius: 6,
        cursor: 'pointer',
        color: 'var(--ink-0)',
        fontSize: 12,
      }}
    >
      <span>{label}</span>
      <span
        aria-hidden
        style={{
          width: 30,
          height: 16,
          borderRadius: 9,
          background: checked ? 'var(--celje-yellow)' : 'var(--bg-4)',
          position: 'relative',
          transition: 'background 150ms',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 16 : 2,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: checked ? 'var(--accent-ink)' : 'var(--ink-1)',
            transition: 'left 150ms',
          }}
        />
      </span>
    </button>
  );
}
