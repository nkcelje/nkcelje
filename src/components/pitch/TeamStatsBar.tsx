'use client';

import { useSquad } from '@/context/SquadContext';
import { getScoreColor, getScoreLabel } from '@/lib/scoring';
import { FORMATIONS } from '@/data/formations';
import { useT } from '@/context/I18nContext';

interface Props {
  compact?: boolean;
}

export function TeamStatsBar({ compact = false }: Props) {
  const { state, setFormation } = useSquad();
  const t = useT();
  const { teamScore, chemistryScore, tacticalFitScore, formation } = state;
  const styleLabel = t(`style.${state.tacticalSettings.playingStyle}`);

  if (compact) {
    return (
      <div className="flex flex-col gap-3">
        {/* OVR big */}
        <div>
          <div className="text-[10px] text-text-muted uppercase tracking-widest mb-0.5">{t('stats.rating')}</div>
          <div className="flex items-baseline gap-2">
            <span
              className="text-3xl font-black score-number leading-none"
              style={{ color: getScoreColor(teamScore) }}
            >
              {teamScore}
            </span>
            <span className="text-[11px] text-text-secondary">{getScoreLabel(teamScore)}</span>
          </div>
        </div>

        {/* Bars */}
        <PercentRow label={t('stats.chemistry')} value={chemistryScore} color="#10b981" />
        <PercentRow label={t('stats.tacticalFit')} value={tacticalFitScore} color="#06b6d4" />

        {/* Style */}
        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border-subtle">
          <span className="text-text-muted uppercase tracking-wide">{t('stats.style')}</span>
          <span className="font-semibold text-text-primary">
            {styleLabel}
          </span>
        </div>
      </div>
    );
  }

  // Horizontal (legacy) layout
  return (
    <div className="flex items-stretch gap-3">
      <div className="flex flex-col gap-1">
        <div className="text-[10px] text-text-muted uppercase tracking-widest">{t('stats.formation')}</div>
        <div className="flex gap-1">
          {FORMATIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFormation(f.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                formation === f.id
                  ? 'bg-accent text-white shadow-glow-accent'
                  : 'bg-surface-3 text-text-secondary hover:bg-surface-4 hover:text-text-primary border border-border-subtle'
              }`}
            >
              {f.displayName}
            </button>
          ))}
        </div>
      </div>
      <div className="w-px bg-border-subtle" />
      <ScoreStat label={t('stats.ratingShort')} value={teamScore} description={getScoreLabel(teamScore)} />
      <div className="w-px bg-border-subtle" />
      <PercentStat label={t('stats.chemistry')} value={chemistryScore} color="#10b981" />
      <div className="w-px bg-border-subtle" />
      <PercentStat label={t('stats.tacticalFit')} value={tacticalFitScore} color="#06b6d4" />
    </div>
  );
}

function PercentRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-text-muted uppercase tracking-widest">{label}</span>
        <span className="text-xs font-bold score-number" style={{ color }}>{value}</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-surface-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color, boxShadow: `0 0 6px ${color}60` }}
        />
      </div>
    </div>
  );
}

function ScoreStat({ label, value, description }: { label: string; value: number; description: string }) {
  const color = getScoreColor(value);
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] text-text-muted uppercase tracking-widest">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold score-number leading-none" style={{ color }}>
          {value}
        </span>
        <span className="text-xs text-text-muted">{description}</span>
      </div>
    </div>
  );
}

function PercentStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] text-text-muted uppercase tracking-widest">{label}</div>
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 rounded-full bg-surface-4 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${value}%`, background: color, boxShadow: `0 0 6px ${color}60` }}
          />
        </div>
        <span className="text-sm font-bold score-number" style={{ color }}>
          {value}
        </span>
      </div>
    </div>
  );
}
