'use client';

import type { Player, ScoreBreakdown } from '@/types';
import { getScoreColor, getScoreLabelKey } from '@/lib/scoring';
import { AttributeRadar } from './AttributeRadar';
import { ScoreBreakdownPanel } from './ScoreBreakdown';
import { StatBar } from '@/components/ui/StatBar';
import { Badge } from '@/components/ui/Badge';
import { useSquad } from '@/context/SquadContext';
import { getPlayerById } from '@/data/players';
import { useRecruits } from '@/data/recruitsStore';
import { SHORTLIST_CANDIDATES } from '@/data/shortlistCandidates';
import { useT } from '@/context/I18nContext';
import { translateScoreMessage } from '@/i18n/scoreMessage';

function synthBreakdown(player: Player): ScoreBreakdown {
  return {
    playerId: player.id,
    base: player.baseRating,
    modifiers: {
      positionFamiliarity: 0,
      roleFit: 0,
      chemistry: 0,
      tacticalFit: 0,
      matchInstructions: 0,
      opponentContext: 0,
      benchPenalty: 0,
    },
    total: player.baseRating,
    positionLabel: player.primaryPosition,
    warnings: [],
    positives: [],
  };
}

export function PlayerDetailPanel() {
  const { state, selectPlayer, removeFromLineup } = useSquad();
  const recruits = useRecruits();
  const t = useT();
  const { selectedPlayerId } = state;

  const player = selectedPlayerId
    ? (getPlayerById(selectedPlayerId) ??
       recruits.find((p) => p.id === selectedPlayerId) ??
       SHORTLIST_CANDIDATES.find((p) => p.id === selectedPlayerId) ??
       null)
    : null;
  const breakdown = selectedPlayerId
    ? (state.scores[selectedPlayerId] ?? (player ? synthBreakdown(player) : null))
    : null;

  // Find the slot the selected player currently occupies (if any).
  const lineupSlotId = selectedPlayerId
    ? Object.entries(state.lineup).find(([, pid]) => pid === selectedPlayerId)?.[0] ?? null
    : null;

  if (!player || !breakdown) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-3 flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-text-muted">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <div className="text-sm text-text-muted">{t('player.selectOnPitch')}</div>
        <div className="text-[11px] text-text-dim mt-1">{t('player.selectOnPitch.sub')}</div>
      </div>
    );
  }

  return (
    <PlayerProfile
      player={player}
      breakdown={breakdown}
      onClose={() => selectPlayer(null)}
      onRemoveFromLineup={lineupSlotId ? () => removeFromLineup(lineupSlotId) : undefined}
    />
  );
}

function PlayerProfile({
  player,
  breakdown,
  onClose,
  onRemoveFromLineup,
}: {
  player: Player;
  breakdown: ScoreBreakdown;
  onClose: () => void;
  onRemoveFromLineup?: () => void;
}) {
  const t = useT();
  const color = getScoreColor(breakdown.total);
  const label = t(getScoreLabelKey(breakdown.total));
  const initials = `${player.firstName[0]}${player.lastName[0]}`;

  const allAttrs = [
    { label: t('attr.pace'), value: player.attributes.pace },
    { label: t('attr.passing'), value: player.attributes.passing },
    { label: t('attr.defending'), value: player.attributes.defending },
    { label: t('attr.finishing'), value: player.attributes.finishing },
    { label: t('attr.tacticalIntelligence'), value: player.attributes.tacticalIntelligence },
    { label: t('attr.physicality'), value: player.attributes.physicality },
    { label: t('attr.pressResistance'), value: player.attributes.pressResistance },
    { label: t('attr.ballProgression'), value: player.attributes.ballProgression },
    { label: t('attr.duels'), value: player.attributes.duels },
    { label: t('attr.creativity'), value: player.attributes.creativity },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto animate-slide-in-right">
      {/* Header */}
      <div
        className="relative px-4 pt-5 pb-4"
        style={{ background: `linear-gradient(135deg, ${color}18 0%, var(--surface-1) 100%)` }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-surface-4/60 hover:bg-surface-5 flex items-center justify-center text-text-muted hover:text-text-primary transition-all duration-150"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${player.avatarColor ?? '#1e40af'}dd, ${player.avatarColor ?? '#1e40af'}88)`,
              border: `1px solid ${player.avatarColor ?? '#1e40af'}60`,
              boxShadow: `0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)`,
            }}
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <div>
                <div className="text-[10px] text-text-muted uppercase tracking-widest">
                  {player.flag} {player.nationality}
                </div>
                <div className="text-xl font-bold text-text-primary leading-tight">{player.name}</div>
                <div className="text-xs text-text-secondary mt-0.5">
                  {player.club} · {player.league}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span
                className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded"
                style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}
              >
                {player.primaryPosition}
              </span>
              {player.isCaptain && (
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-gold/20 text-gold border border-gold/30">
                  ©
                </span>
              )}
              <span className="text-[11px] text-text-muted">{player.age} {t('filter.ageSuffix')}</span>
              <span className="text-[11px] text-text-muted">{player.height} {t('unit.cm')}</span>
            </div>
          </div>

          {/* Dynamic Score */}
          <div
            className="shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center"
            style={{
              background: `${color}18`,
              border: `1.5px solid ${color}50`,
              boxShadow: `0 0 16px ${color}20`,
            }}
          >
            <div className="text-2xl font-bold score-number leading-none" style={{ color }}>
              {breakdown.total}
            </div>
            <div className="text-[9px] text-text-muted uppercase tracking-wide">{label}</div>
          </div>
        </div>

        {/* Secondary positions */}
        {player.secondaryPositions.length > 0 && (
          <div className="flex items-center gap-1 mt-3">
            <span className="text-[10px] text-text-muted">{t('player.alsoPlays')}: </span>
            {player.secondaryPositions.map((pos) => (
              <span
                key={pos}
                className="text-[10px] px-1.5 py-0.5 rounded bg-surface-3 text-text-secondary border border-border-subtle"
              >
                {pos}
              </span>
            ))}
          </div>
        )}

        {/* Lineup actions */}
        {onRemoveFromLineup && (
          <button
            type="button"
            onClick={onRemoveFromLineup}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold border border-score-low/30 bg-score-low/10 text-score-low hover:bg-score-low/20 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {t('player.removeFromLineup')}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Warnings / Positives */}
        {(breakdown.warnings.length > 0 || breakdown.positives.length > 0) && (
          <div className="px-4 py-3 border-b border-border-subtle space-y-1.5">
            {breakdown.warnings.map((w) => (
              <div key={w.key} className="flex items-start gap-2 text-[11px] text-score-low">
                <span className="shrink-0 mt-0.5">⚠</span>
                <span>{translateScoreMessage(t, w)}</span>
              </div>
            ))}
            {breakdown.positives.map((p) => (
              <div key={p.key} className="flex items-start gap-2 text-[11px] text-score-elite">
                <span>{translateScoreMessage(t, p)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Radar + Attributes */}
        <div className="px-4 py-4 border-b border-border-subtle">
          <div className="text-[10px] text-text-muted uppercase tracking-widest mb-3">{t('player.profile')}</div>
          <div className="flex items-center justify-center mb-3">
            <AttributeRadar attributes={player.attributes} size={200} showLabels />
          </div>
          <div className="space-y-1.5">
            {allAttrs.map(({ label, value }) => (
              <StatBar key={label} label={label} value={value} size="sm" />
            ))}
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="px-4 py-4 border-b border-border-subtle">
          <div className="text-[10px] text-text-muted uppercase tracking-widest mb-3">{t('player.breakdown')}</div>
          <ScoreBreakdownPanel breakdown={breakdown} />
        </div>

        {/* Player info */}
        <div className="px-4 py-4 border-b border-border-subtle">
          <div className="text-[10px] text-text-muted uppercase tracking-widest mb-3">{t('player.info')}</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: t('player.foot'), value: t(`foot.${player.preferredFoot}`) },
              { label: t('player.contract'), value: `${t('prefix.until')} ${player.contractEnds}` },
              { label: t('player.value'), value: `€${player.marketValue} ${t('unit.m')}` },
              { label: t('player.potential'), value: player.potential },
              { label: t('player.height'), value: `${player.height} ${t('unit.cm')}` },
              { label: t('player.weight'), value: `${player.weight} ${t('unit.kg')}` },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col">
                <span className="text-[10px] text-text-muted uppercase tracking-wide">{label}</span>
                <span className="text-xs font-semibold text-text-primary">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Preferred Roles */}
        <div className="px-4 py-4 border-b border-border-subtle">
          <div className="text-[10px] text-text-muted uppercase tracking-widest mb-3">{t('player.bestRoles')}</div>
          <div className="flex flex-wrap gap-1.5">
            {player.preferredRoles.map((role) => (
              <Badge key={role} label={t(`role.${role}`)} variant="blue" size="xs" />
            ))}
          </div>
        </div>

        {/* Style Tags */}
        <div className="px-4 py-4">
          <div className="text-[10px] text-text-muted uppercase tracking-widest mb-3">{t('player.style')}</div>
          <div className="flex flex-wrap gap-1.5">
            {player.styleTags.map((tag) => (
              <Badge key={tag} label={t(`styleTag.${tag}`)} variant="gray" size="xs" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
