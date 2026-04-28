'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { useSquad } from '@/context/SquadContext';
import { SHORTLIST_CANDIDATES } from '@/data/shortlistCandidates';
import { addRecruit, useRecruits } from '@/data/recruitsStore';
import { useT } from '@/context/I18nContext';
import { getPassportTag } from '@/lib/passport';
import type { Player, Position, League } from '@/types';

type Priority = 'hot' | 'warm' | 'cold';

const POSITION_OPTIONS: Position[] = [
  'GK', 'CB', 'LB', 'RB', 'LWB', 'RWB',
  'CDM', 'CM', 'CAM', 'LM', 'RM',
  'LW', 'RW', 'CF', 'ST',
];

function priorityOf(p: Player): Priority {
  // Hot = high potential, low age. Cold = older with limited upside. Else warm.
  const upside = p.potential - p.baseRating;
  if (upside >= 8 && p.age <= 23) return 'hot';
  if (upside <= 3 && p.age >= 26) return 'cold';
  return 'warm';
}
function scoutScoreOf(p: Player): number {
  return Math.round(p.baseRating + (p.potential - p.baseRating) * 0.5);
}
function fitScoreOf(p: Player): number {
  return Math.max(40, Math.min(99, Math.round(p.baseRating - 2 + (p.attributes.tacticalIntelligence - 70) * 0.2)));
}
function notesFor(p: Player): string {
  const upside = p.potential - p.baseRating;
  if (upside >= 10) return `High-ceiling project: +${upside} POT runway, ${p.attributes.pace} pace.`;
  if (upside >= 6) return `Solid developmental signing — depth + growth.`;
  if (p.age >= 28) return `Experienced floor — proven at ${p.league} level.`;
  return `Profile fits squad: balanced numbers, ${p.styleTags[0] ?? '—'} traits.`;
}
function reportsFor(p: Player): number {
  // deterministic 2..6 from id
  return 2 + (p.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 5);
}
function lastSeenFor(p: Player): string {
  const days = 1 + (p.id.length * 3) % 28;
  return days < 7 ? `${days}d` : `${Math.floor(days / 7)}w`;
}

export default function ShortlistPage() {
  const { state, addToBench } = useSquad();
  const recruits = useRecruits();
  const t = useT();

  // Filters
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState<'' | Position>('');
  const [league, setLeague] = useState<'' | League>('');
  const [maxAge, setMaxAge] = useState<number>(30);
  const [priority, setPriority] = useState<'' | Priority>('');

  const teamedIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(state.lineup).forEach((id) => id && ids.add(id));
    state.bench.forEach((id) => ids.add(id));
    recruits.forEach((r) => ids.add(r.id));
    return ids;
  }, [state.lineup, state.bench, recruits]);

  const leagues = useMemo(() => {
    const set = new Set<League>();
    SHORTLIST_CANDIDATES.forEach((p) => set.add(p.league));
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SHORTLIST_CANDIDATES.filter((p) => {
      if (pos && p.primaryPosition !== pos) return false;
      if (league && p.league !== league) return false;
      if (p.age > maxAge) return false;
      if (priority && priorityOf(p) !== priority) return false;
      if (q) {
        const hay = `${p.name} ${p.firstName} ${p.lastName} ${p.club} ${p.league} ${p.nationality}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [query, pos, league, maxAge, priority]);

  const handleAdd = useCallback(
    (id: string) => {
      const candidate = SHORTLIST_CANDIDATES.find((p) => p.id === id);
      if (!candidate) return;
      addRecruit(candidate);
      addToBench(id);
    },
    [addToBench]
  );

  const reset = () => {
    setQuery('');
    setPos('');
    setLeague('');
    setMaxAge(30);
    setPriority('');
  };

  return (
    <div className="view-shortlist">
      <div className="page-head">
        <div>
          <div className="page-title">{t('shortlist.title').toUpperCase()}</div>
          <div className="page-sub mono">
            {filtered.length} / {SHORTLIST_CANDIDATES.length} · WINDOW: SUMMER 2026
          </div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn ghost" style={{ flex: 0 }}>Board</button>
          <button type="button" className="btn primary" style={{ flex: 0 }}>+ Add target</button>
        </div>
      </div>

      <div className="filters-bar">
        <input
          className="input"
          placeholder={t('filter.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="select"
          value={pos}
          onChange={(e) => setPos((e.target.value as Position) || '')}
        >
          <option value="">{t('filter.position')} · {t('filter.any')}</option>
          {POSITION_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={league}
          onChange={(e) => setLeague((e.target.value as League) || '')}
        >
          <option value="">{t('filter.league')} · {t('filter.any')}</option>
          {leagues.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={maxAge}
          onChange={(e) => setMaxAge(parseInt(e.target.value, 10))}
        >
          {[21, 23, 25, 28, 30, 35].map((a) => (
            <option key={a} value={a}>
              ≤ {a} {t('filter.ageSuffix')}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={priority}
          onChange={(e) => setPriority((e.target.value as Priority) || '')}
        >
          <option value="">Priority · {t('filter.any')}</option>
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="cold">Cold</option>
        </select>
        <button type="button" className="btn ghost" onClick={reset} style={{ flex: 0 }}>
          {t('filter.reset')}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            color: 'var(--ink-3)',
            fontStyle: 'italic',
          }}
        >
          {t('shortlist.empty')}
        </div>
      ) : (
        <div className="target-grid">
          {filtered.map((p) => (
            <TargetCard
              key={p.id}
              player={p}
              already={teamedIds.has(p.id)}
              onAdd={handleAdd}
              addLabel={t('shortlist.add')}
              alreadyLabel={t('shortlist.alreadyAdded')}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const TargetCard = memo(function TargetCard({
  player,
  already,
  onAdd,
  addLabel,
  alreadyLabel,
}: {
  player: Player;
  already: boolean;
  onAdd: (id: string) => void;
  addLabel: string;
  alreadyLabel: string;
}) {
  const passport = getPassportTag(player);
  const prio = priorityOf(player);
  const scout = scoutScoreOf(player);
  const fit = fitScoreOf(player);
  const reports = reportsFor(player);
  const lastSeen = lastSeenFor(player);

  return (
    <div className={`target-card ${prio} pp-card-${passport}`}>
      <div className="priority-bar" />
      <div className="target-head">
        <div>
          <div className="target-name">
            <span style={{ marginRight: 8, fontSize: 18 }}>{player.flag}</span>
            {player.firstName} {player.lastName}
          </div>
          <div className="target-meta">
            {player.club} · {player.league} · {player.age}y · {player.primaryPosition}
          </div>
        </div>
        <div className="target-ovr-block">
          <div className="target-ovr">{player.baseRating}</div>
          <div className="target-pot mono">→ <b>{player.potential}</b> POT</div>
        </div>
      </div>

      <div className="score-pair">
        <div className="score">
          <div className="lbl">Scout</div>
          <div className="v acc">{scout}</div>
        </div>
        <div className="score">
          <div className="lbl">Fit</div>
          <div className="v">{fit}</div>
        </div>
      </div>

      <div className="target-notes">{notesFor(player)}</div>

      <div className="target-foot">
        <span className={`tag ${prio}`}>
          {prio === 'hot' ? 'Hot' : prio === 'warm' ? 'Warm' : 'Cold'}
        </span>
        <span>
          €{player.marketValue.toFixed(1)}M · {player.contractEnds}
        </span>
        <span>
          {reports} reports · {lastSeen}
        </span>
      </div>

      <div className="btn-row">
        <button
          type="button"
          className={already ? 'btn ghost' : 'btn primary'}
          onClick={() => !already && onAdd(player.id)}
          disabled={already}
          title={already ? alreadyLabel : addLabel}
        >
          {already ? `✓ ${alreadyLabel}` : `+ ${addLabel}`}
        </button>
      </div>
    </div>
  );
});
