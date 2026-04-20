'use client';

import { useState } from 'react';
import type { Player } from '@/types';
import { PLAYERS } from '@/data/players';
import { getScoreColor } from '@/lib/scoring';
import { AttributeRadar } from '@/components/player/AttributeRadar';
import { Badge } from '@/components/ui/Badge';
import { useSquad } from '@/context/SquadContext';
import { useT } from '@/context/I18nContext';

const ATTR_KEYS = [
  'pace',
  'passing',
  'defending',
  'finishing',
  'tacticalIntelligence',
  'physicality',
  'pressResistance',
  'ballProgression',
  'duels',
  'creativity',
] as const;

export function ComparisonView() {
  const { state } = useSquad();
  const t = useT();
  const [slot1, setSlot1] = useState<string>(PLAYERS[0]?.id ?? '');
  const [slot2, setSlot2] = useState<string>(PLAYERS[1]?.id ?? '');
  const [slot3, setSlot3] = useState<string | null>(null);

  const player1 = PLAYERS.find((p) => p.id === slot1);
  const player2 = PLAYERS.find((p) => p.id === slot2);
  const player3 = slot3 ? PLAYERS.find((p) => p.id === slot3) : null;

  const score1 = state.scores[slot1];
  const score2 = state.scores[slot2];
  const score3 = slot3 ? state.scores[slot3] : undefined;

  const activePlayers = [player1, player2, player3].filter(Boolean) as Player[];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('cmp.title')}</h1>
        <p className="text-sm text-text-secondary mt-1">{t('cmp.subtitle')}</p>
      </div>

      {/* Player selectors */}
      <div className="grid grid-cols-3 gap-4">
        <PlayerSelector label={t('cmp.playerA')} selectedId={slot1} onSelect={setSlot1} />
        <PlayerSelector label={t('cmp.playerB')} selectedId={slot2} onSelect={setSlot2} />
        <PlayerSelector
          label={t('cmp.playerC')}
          selectedId={slot3 ?? ''}
          onSelect={(id) => setSlot3(id || null)}
          optional
        />
      </div>

      {/* Radar overlay comparison */}
      {player1 && player2 && (
        <div
          className="rounded-panel p-5 border border-border-subtle"
          style={{ background: 'var(--surface-1)' }}
        >
          <div className="text-[10px] text-text-muted uppercase tracking-widest mb-4">
            {t('cmp.radarOverlay')}
          </div>
          <div className="flex items-center justify-center gap-12 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-accent rounded" />
              <span className="text-xs text-text-secondary">{player1.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 rounded" style={{ background: '#f59e0b' }} />
              <span className="text-xs text-text-secondary">{player2.name}</span>
            </div>
          </div>
          <div className="flex justify-center mt-4">
            <AttributeRadar
              attributes={player1.attributes}
              compareAttributes={player2.attributes}
              size={260}
              showLabels
            />
          </div>
        </div>
      )}

      {/* Side-by-side cards */}
      <div className={`grid gap-4 ${activePlayers.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {activePlayers.map((player, idx) => {
          const scores = [score1, score2, score3][idx];
          const dynamicScore = scores?.total;
          const color = dynamicScore ? getScoreColor(dynamicScore) : '#94a3b8';
          const initials = `${player.firstName[0]}${player.lastName[0]}`;

          return (
            <div
              key={player.id}
              className="rounded-panel overflow-hidden border border-border-subtle"
              style={{ background: 'var(--surface-1)' }}
            >
              {/* Top accent */}
              <div
                className="h-0.5"
                style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
              />

              {/* Player header */}
              <div className="p-4 flex items-center gap-3 border-b border-border-subtle">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, ${player.avatarColor ?? '#1e40af'}dd, ${player.avatarColor ?? '#1e40af'}88)`,
                    border: `1px solid ${player.avatarColor ?? '#1e40af'}60`,
                  }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-text-primary text-sm truncate">{player.name}</div>
                  <div className="text-[11px] text-text-muted">
                    {player.flag} {player.nationality} · {player.age} {t('filter.ageSuffix')}
                  </div>
                  <div className="text-[11px] text-text-muted truncate">{player.club}</div>
                </div>
                {dynamicScore !== undefined && (
                  <div
                    className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
                    style={{ background: `${color}18`, border: `1.5px solid ${color}40`, color }}
                  >
                    <span className="text-xl font-bold score-number leading-none">{dynamicScore}</span>
                    <span className="text-[8px] text-text-muted">{t('chip.ovr')}</span>
                  </div>
                )}
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 divide-x divide-border-subtle border-b border-border-subtle">
                {[
                  { label: t('cmp.position'), value: player.primaryPosition },
                  { label: t('cmp.value'), value: `€${player.marketValue}M` },
                  { label: t('cmp.potential'), value: player.potential },
                ].map(({ label, value }) => (
                  <div key={label} className="py-2 text-center">
                    <div className="text-[9px] text-text-muted uppercase tracking-wide">{label}</div>
                    <div className="text-xs font-bold text-text-primary mt-0.5">{value}</div>
                  </div>
                ))}
              </div>

              {/* Attributes */}
              <div className="p-4 space-y-1.5">
                {ATTR_KEYS.map((key) => {
                  const val = player.attributes[key];
                  const maxVal = Math.max(...activePlayers.map((p) => p.attributes[key]));
                  const isBest = val === maxVal && activePlayers.length > 1;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span
                        className={`text-[10px] shrink-0 w-28 ${
                          isBest ? 'text-text-primary font-semibold' : 'text-text-secondary'
                        }`}
                      >
                        {isBest ? '▸ ' : ''}
                        {t(`attr.${key}`)}
                      </span>
                      <div className="flex-1 h-1 rounded-full bg-surface-4 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${val}%`,
                            background: isBest
                              ? `linear-gradient(90deg, ${color}, ${color}bb)`
                              : 'rgba(59,130,246,0.5)',
                          }}
                        />
                      </div>
                      <span
                        className={`text-[11px] font-bold score-number w-6 text-right shrink-0 ${
                          isBest ? '' : 'text-text-muted'
                        }`}
                        style={isBest ? { color } : {}}
                      >
                        {val}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Score breakdown summary */}
              {scores && (
                <div className="px-4 pb-4 space-y-1">
                  <div className="text-[10px] text-text-muted uppercase tracking-widest mb-2">
                    {t('cmp.scoreModifiers')}
                  </div>
                  {Object.entries(scores.modifiers).map(([key, val]) => {
                    if (val === 0 && key !== 'positionFamiliarity') return null;
                    return (
                      <div key={key} className="flex items-center justify-between text-[10px]">
                        <span className="text-text-muted">{t(`mod.${key}`)}</span>
                        <span
                          className={
                            val > 0
                              ? 'text-score-elite'
                              : val < 0
                              ? 'text-score-low'
                              : 'text-text-muted'
                          }
                        >
                          {val > 0 ? '+' : ''}
                          {val}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Roles */}
              <div className="px-4 pb-4">
                <div className="text-[10px] text-text-muted uppercase tracking-widest mb-2">
                  {t('cmp.bestRoles')}
                </div>
                <div className="flex flex-wrap gap-1">
                  {player.preferredRoles.slice(0, 3).map((role) => (
                    <Badge key={role} label={role} variant="blue" size="xs" />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary verdict */}
      {player1 && player2 && score1 && score2 && (
        <ComparisonVerdict
          player1={player1}
          player2={player2}
          score1={score1.total}
          score2={score2.total}
        />
      )}
    </div>
  );
}

function PlayerSelector({
  label,
  selectedId,
  onSelect,
  optional = false,
}: {
  label: string;
  selectedId: string;
  onSelect: (id: string) => void;
  optional?: boolean;
}) {
  const t = useT();
  return (
    <div>
      <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1.5">
        {label}
      </label>
      <select
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-150"
      >
        {optional && <option value="">{t('cmp.none')}</option>}
        {PLAYERS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.primaryPosition}) — {t('chip.ovr')} {p.baseRating}
          </option>
        ))}
      </select>
    </div>
  );
}

function ComparisonVerdict({
  player1,
  player2,
  score1,
  score2,
}: {
  player1: Player;
  player2: Player;
  score1: number;
  score2: number;
}) {
  const t = useT();
  const winner = score1 > score2 ? player1 : player2;
  const diff = Math.abs(score1 - score2);
  const verdict =
    diff <= 2
      ? t('cmp.verdict.equal')
      : diff <= 5
      ? t('cmp.verdict.slight', { name: winner.name })
      : t('cmp.verdict.clear', { name: winner.name });

  const winColor = getScoreColor(Math.max(score1, score2));

  return (
    <div
      className="rounded-panel p-5 border border-border-subtle"
      style={{ background: `linear-gradient(135deg, ${winColor}14 0%, var(--surface-1) 100%)` }}
    >
      <div className="text-[10px] text-text-muted uppercase tracking-widest mb-2">
        {t('cmp.verdict')}
      </div>
      <div className="text-sm text-text-primary font-medium">{verdict}</div>
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        <div className="text-center">
          <div className="text-2xl font-bold score-number" style={{ color: getScoreColor(score1) }}>
            {score1}
          </div>
          <div className="text-[10px] text-text-muted">{player1.name}</div>
        </div>
        <div className="text-text-muted text-sm">vs</div>
        <div className="text-center">
          <div className="text-2xl font-bold score-number" style={{ color: getScoreColor(score2) }}>
            {score2}
          </div>
          <div className="text-[10px] text-text-muted">{player2.name}</div>
        </div>
        <div className="ml-auto text-[11px] text-text-muted">
          {t('cmp.diff')}: <span className="text-text-primary font-bold">{diff} {t('cmp.pts')}</span>
        </div>
      </div>
    </div>
  );
}
