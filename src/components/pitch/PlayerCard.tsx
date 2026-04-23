'use client';

import type { Player, ScoreBreakdown } from '@/types';
import { getScoreColor } from '@/lib/scoring';
import { getPassportBorder } from '@/lib/passport';
import { useT } from '@/context/I18nContext';
import { translateScoreMessage } from '@/i18n/scoreMessage';

interface PlayerCardProps {
  player: Player;
  score: ScoreBreakdown;
  slotLabel: string;
  isSelected: boolean;
  onClick: () => void;
  compact?: boolean;
}

function PlayerAvatar({ player, size }: { player: Player; size: number }) {
  const initials = `${player.firstName[0]}${player.lastName[0]}`;
  const color = player.avatarColor ?? '#1e40af';

  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0 select-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 35%, ${color}dd, ${color}88)`,
        border: `1px solid ${color}60`,
        fontSize: size * 0.32,
        boxShadow: `0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)`,
      }}
    >
      {initials}
    </div>
  );
}

export function PitchPlayerCard({
  player,
  score,
  slotLabel,
  isSelected,
  onClick,
}: PlayerCardProps) {
  const t = useT();
  const color = getScoreColor(score.total);
  const passportColor = getPassportBorder(player);
  const hasWarning = score.warnings.length > 0;
  const firstWarning = score.warnings[0];

  return (
    <div
      className="relative flex flex-col items-center cursor-pointer group"
      style={{ width: 72 }}
      onClick={onClick}
    >
      {/* Score badge */}
      <div
        className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-md px-1.5 py-0.5 z-10 font-bold score-number text-[11px] leading-tight score-pop"
        style={{
          color: '#0a0e1a',
          background: color,
          boxShadow: `0 2px 6px ${color}80`,
          minWidth: 28,
          textAlign: 'center',
        }}
      >
        {score.total}
      </div>

      {/* Card body */}
      <div
        className={`relative w-full rounded-xl overflow-hidden transition-all duration-200 ${
          isSelected ? 'ring-2 ring-offset-1 ring-offset-transparent scale-105' : 'group-hover:scale-105'
        }`}
        style={{
          background: isSelected
            ? `linear-gradient(160deg, ${color}22 0%, #0d1424 60%)`
            : 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(13,20,36,0.9) 100%)',
          border: `2px solid ${isSelected ? color : passportColor}`,
          boxShadow: isSelected
            ? `0 4px 20px ${color}30, 0 0 0 2px ${color}60`
            : `0 2px 12px rgba(0,0,0,0.5), 0 0 0 1px ${passportColor}40`,
        }}
      >
        {/* Warning stripe */}
        {hasWarning && !isSelected && firstWarning && (
          <div
            className="absolute top-0 right-0 w-2 h-2 rounded-bl-md"
            style={{ background: '#f97316' }}
            title={translateScoreMessage(t, firstWarning)}
          />
        )}

        <div className="flex flex-col items-center px-1.5 pt-3 pb-2 gap-1">
          <PlayerAvatar player={player} size={34} />

          {/* Name */}
          <div className="w-full text-center">
            <div className="text-[10px] font-semibold leading-tight truncate" style={{ color: '#f5f7fb' }}>
              {player.name}
            </div>
            <div
              className="text-[9px] font-bold uppercase tracking-wide leading-tight"
              style={{ color }}
            >
              {slotLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Flag + foot indicators */}
      <div className="flex items-center gap-1 mt-1">
        <span className="text-[11px]" title={player.nationality}>{player.flag}</span>
        <span className="text-[9px]" style={{ color: 'rgba(230,240,255,0.75)' }}>
          {player.preferredFoot === 'Both' ? '⇌' : player.preferredFoot === 'Left' ? 'L' : 'R'}
        </span>
      </div>
    </div>
  );
}

// ─── Compact list variant ─────────────────────────────────────────────────────

interface CompactPlayerCardProps {
  player: Player;
  score?: ScoreBreakdown;
  isSelected: boolean;
  onClick: () => void;
}

export function CompactPlayerCard({ player, score, isSelected, onClick }: CompactPlayerCardProps) {
  const color = score ? getScoreColor(score.total) : '#94a3b8';
  const passportColor = getPassportBorder(player);

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 border-2 ${
        isSelected ? 'bg-accent/10' : 'hover:bg-surface-3'
      }`}
      style={{ borderColor: isSelected ? 'var(--accent)' : passportColor }}
      onClick={onClick}
    >
      <PlayerAvatar player={player} size={28} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-text-primary truncate">{player.name}</div>
        <div className="text-[10px] text-text-muted">{player.primaryPosition} · {player.flag}</div>
      </div>
      {score && (
        <div
          className="text-sm font-bold score-number shrink-0"
          style={{ color }}
        >
          {score.total}
        </div>
      )}
    </div>
  );
}

// ─── Full player card for recruitment ─────────────────────────────────────────

interface FullPlayerCardProps {
  player: Player;
  score?: number;
  fitTags?: string[];
  isShortlisted?: boolean;
  onToggleShortlist?: () => void;
  onAddToRoster?: () => void;
  isInRoster?: boolean;
  onClick: () => void;
}

export function FullPlayerCard({
  player,
  score,
  fitTags = [],
  isShortlisted = false,
  onToggleShortlist,
  onAddToRoster,
  isInRoster = false,
  onClick,
}: FullPlayerCardProps) {
  const color = score ? getScoreColor(score) : '#94a3b8';
  const passportColor = getPassportBorder(player);
  const t = useT();

  return (
    <div
      className="relative rounded-panel overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] group"
      style={{
        background: 'linear-gradient(145deg, #111b30 0%, #0d1424 100%)',
        border: `2px solid ${passportColor}`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${passportColor}30`,
      }}
      onClick={onClick}
    >
      {/* Top accent line */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <PlayerAvatar player={player} size={48} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold text-text-primary text-sm leading-tight">{player.name}</div>
                <div className="text-[11px] text-text-muted mt-0.5">
                  {player.flag} {player.nationality} · {player.age} {t('filter.ageSuffix')} · {player.club}
                </div>
              </div>
              {score !== undefined && (
                <div
                  className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg score-number"
                  style={{
                    background: `${color}18`,
                    border: `1px solid ${color}40`,
                    color,
                  }}
                >
                  {score}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span
                className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                style={{ background: `${color}18`, color }}
              >
                {player.primaryPosition}
              </span>
              <span className="text-[11px] text-text-muted">{player.league}</span>
              <span className="text-[11px] text-text-muted ml-auto">€{player.marketValue}M</span>
            </div>
          </div>
        </div>

        {/* Fit tags */}
        {fitTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {fitTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent-bright border border-accent/20"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Attribute mini bars */}
        <div className="mt-3 grid grid-cols-5 gap-1">
          {[
            { label: 'PAC', value: player.attributes.pace },
            { label: 'PAS', value: player.attributes.passing },
            { label: 'DEF', value: player.attributes.defending },
            { label: 'FIN', value: player.attributes.finishing },
            { label: 'PHY', value: player.attributes.physicality },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div
                className="text-[11px] font-bold score-number"
                style={{ color: value >= 80 ? '#10b981' : value >= 65 ? '#94a3b8' : '#ef4444' }}
              >
                {value}
              </div>
              <div className="text-[9px] text-text-dim uppercase">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top-right action buttons */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
        {onAddToRoster && (
          <button
            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-base transition-all duration-150 ${
              isInRoster
                ? 'bg-score-elite/25 text-score-elite cursor-default'
                : 'bg-accent/15 text-accent-bright hover:bg-accent/30 hover:scale-110'
            }`}
            onClick={(e) => { e.stopPropagation(); if (!isInRoster) onAddToRoster(); }}
            title={isInRoster ? t('roster.inLineup') : t('roster.addToLineup')}
            disabled={isInRoster}
          >
            {isInRoster ? '✓' : '+'}
          </button>
        )}
        {onToggleShortlist && (
          <button
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 ${
              isShortlisted ? 'bg-gold/20 text-gold' : 'bg-surface-4 text-text-muted hover:text-gold hover:bg-gold/10'
            }`}
            onClick={(e) => { e.stopPropagation(); onToggleShortlist(); }}
            title={isShortlisted ? t('roster.removeFromShortlist') : t('roster.addToShortlist')}
          >
            <svg viewBox="0 0 24 24" fill={isShortlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </button>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-panel" />
    </div>
  );
}
