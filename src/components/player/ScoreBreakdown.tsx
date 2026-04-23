'use client';

import type { ScoreBreakdown } from '@/types';
import { useT } from '@/context/I18nContext';

interface ScoreBreakdownPanelProps {
  breakdown: ScoreBreakdown;
}

const MODIFIER_CONFIG = [
  {
    key: 'positionFamiliarity' as const,
    labelKey: 'mod.positionFamiliarity',
    icon: '📍',
    maxAbs: 15,
  },
  { key: 'roleFit' as const, labelKey: 'mod.roleFit', icon: '🎯', maxAbs: 5 },
  { key: 'chemistry' as const, labelKey: 'mod.chemistry', icon: '🔗', maxAbs: 6 },
  { key: 'tacticalFit' as const, labelKey: 'mod.tacticalFit', icon: '⚙️', maxAbs: 5 },
  { key: 'matchInstructions' as const, labelKey: 'mod.matchInstructions', icon: '📋', maxAbs: 3 },
  { key: 'opponentContext' as const, labelKey: 'mod.opponentContext', icon: '🎭', maxAbs: 3 },
  { key: 'benchPenalty' as const, labelKey: 'mod.benchPenalty', icon: '🪑', maxAbs: 3 },
];

export function ScoreBreakdownPanel({ breakdown }: ScoreBreakdownPanelProps) {
  const t = useT();
  return (
    <div className="space-y-1">
      {/* Base row */}
      <div className="flex items-center justify-between py-1.5 border-b border-border-subtle mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">⚡</span>
          <span className="text-xs text-text-secondary">{t('breakdown.baseScore')} ({breakdown.positionLabel})</span>
        </div>
        <span className="text-sm font-bold text-text-primary score-number">{breakdown.base}</span>
      </div>

      {/* Modifier rows */}
      {MODIFIER_CONFIG.map(({ key, labelKey, icon, maxAbs }) => {
        const value = breakdown.modifiers[key];
        if (value === 0 && key === 'benchPenalty') return null;

        const isPositive = value > 0;
        const isNegative = value < 0;
        const pct = Math.abs(value) / maxAbs;

        return (
          <div key={key} className="flex items-center gap-2 py-1">
            <span className="text-xs w-4">{icon}</span>
            <span className="text-[11px] text-text-secondary flex-1 truncate">{t(labelKey)}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Mini visual bar */}
              <div className="w-16 h-1 rounded-full bg-surface-4 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${pct * 100}%`,
                    marginLeft: isNegative ? 'auto' : undefined,
                    background: isPositive
                      ? 'linear-gradient(90deg, #10b981, #34d399)'
                      : isNegative
                      ? 'linear-gradient(90deg, #f97316, #ef4444)'
                      : '#475569',
                  }}
                />
              </div>
              <span
                className={`text-xs font-bold score-number w-7 text-right ${
                  isPositive ? 'text-score-elite' : isNegative ? 'text-score-low' : 'text-text-muted'
                }`}
              >
                {value > 0 ? '+' : ''}{value}
              </span>
            </div>
          </div>
        );
      })}

      {/* Total */}
      <div className="flex items-center justify-between pt-2 mt-1 border-t border-border-subtle">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{t('breakdown.dynamicScore')}</span>
        <span className="text-xl font-bold score-number text-gold-bright">{breakdown.total}</span>
      </div>
    </div>
  );
}
