'use client';

import { useState, useMemo } from 'react';
import type { Player, Position } from '@/types';
import { PLAYERS } from '@/data/players';
import { FullPlayerCard } from '@/components/pitch/PlayerCard';
import { useSquad } from '@/context/SquadContext';
import { getScoreColor, getScoreLabel } from '@/lib/scoring';
import { AttributeRadar } from '@/components/player/AttributeRadar';
import { StatBar } from '@/components/ui/StatBar';
import { ScoreBreakdownPanel } from '@/components/player/ScoreBreakdown';
import type { FitTag } from '@/types';

const ALL_POSITIONS: Position[] = ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'CF', 'ST'];

function computeFitTags(player: Player, squadScores: Record<string, import('@/types').ScoreBreakdown>): FitTag[] {
  const tags: FitTag[] = [];
  const squadPlayerIds = Object.keys(squadScores);
  const score = squadScores[player.id];
  const dynamicScore = score?.total ?? player.baseRating;

  if (dynamicScore >= 82) tags.push('Strong tactical fit');
  if (dynamicScore >= 80 && player.age <= 23) tags.push('High potential');
  if (dynamicScore >= 78 && !squadPlayerIds.includes(player.id)) tags.push('Immediate starter');
  if (dynamicScore >= 72 && dynamicScore < 80) tags.push('Bench upgrade');
  if (player.age <= 21) tags.push('Development signing');
  if (score?.modifiers.chemistry ?? 0 >= 2) tags.push('Low chemistry risk');

  return tags.slice(0, 3);
}

export function RecruitmentContent() {
  const { state, addToBench } = useSquad();
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState<Position | 'ALL'>('ALL');
  const [minRating, setMinRating] = useState(70);
  const [maxAge, setMaxAge] = useState(35);
  const [sortBy, setSortBy] = useState<'rating' | 'age' | 'value' | 'name'>('rating');
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showShortlistOnly, setShowShortlistOnly] = useState(false);

  const filtered = useMemo(() => {
    let result = [...PLAYERS];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.nationality.toLowerCase().includes(q) ||
          p.club.toLowerCase().includes(q)
      );
    }

    if (posFilter !== 'ALL') {
      result = result.filter(
        (p) => p.primaryPosition === posFilter || p.secondaryPositions.includes(posFilter)
      );
    }

    result = result.filter((p) => p.baseRating >= minRating);
    result = result.filter((p) => p.age <= maxAge);

    if (showShortlistOnly) {
      result = result.filter((p) => shortlisted.has(p.id));
    }

    result.sort((a, b) => {
      if (sortBy === 'rating') return b.baseRating - a.baseRating;
      if (sortBy === 'age') return a.age - b.age;
      if (sortBy === 'value') return b.marketValue - a.marketValue;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [search, posFilter, minRating, maxAge, sortBy, showShortlistOnly, shortlisted]);

  const toggleShortlist = (id: string) => {
    setShortlisted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex h-full">
      {/* Left: Filters + Grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="p-6 border-b border-border-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Центр рекрутинга</h1>
              <p className="text-sm text-text-secondary mt-0.5">
                Ищите и оценивайте игроков под текущую модель команды
              </p>
            </div>
            <div className="flex items-center gap-3">
              {shortlisted.size > 0 && (
                <button
                  onClick={() => setShowShortlistOnly(!showShortlistOnly)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-150 ${
                    showShortlistOnly
                      ? 'bg-gold/20 text-gold border-gold/30'
                      : 'bg-surface-3 text-text-secondary border-border-subtle hover:bg-surface-4'
                  }`}
                >
                  ⭐ Шортлист ({shortlisted.size})
                </button>
              )}
            </div>
          </div>

          {/* Filters row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Поиск по игрокам, клубам, странам..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-2 border border-border-subtle rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-150"
              />
            </div>

            {/* Position */}
            <select
              value={posFilter}
              onChange={(e) => setPosFilter(e.target.value as Position | 'ALL')}
              className="bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-all duration-150"
            >
              <option value="ALL">Все позиции</option>
              {ALL_POSITIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-all duration-150"
            >
              <option value="rating">Сорт.: Рейтинг</option>
              <option value="age">Сорт.: Возраст</option>
              <option value="value">Сорт.: Цена</option>
              <option value="name">Сорт.: Имя</option>
            </select>

            {/* Min Rating */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted whitespace-nowrap">Мин. рейтинг</span>
              <input
                type="number"
                min={60}
                max={95}
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-16 bg-surface-2 border border-border-subtle rounded-lg px-2 py-2 text-sm text-text-primary text-center focus:outline-none focus:border-accent transition-all duration-150"
              />
            </div>

            {/* Max Age */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted whitespace-nowrap">Макс. возраст</span>
              <input
                type="number"
                min={16}
                max={40}
                value={maxAge}
                onChange={(e) => setMaxAge(Number(e.target.value))}
                className="w-16 bg-surface-2 border border-border-subtle rounded-lg px-2 py-2 text-sm text-text-primary text-center focus:outline-none focus:border-accent transition-all duration-150"
              />
            </div>

            <div className="text-xs text-text-muted">
              {filtered.length} игрок{filtered.length % 10 === 1 && filtered.length % 100 !== 11 ? '' : filtered.length % 10 >= 2 && filtered.length % 10 <= 4 && (filtered.length % 100 < 10 || filtered.length % 100 >= 20) ? 'а' : 'ов'}
            </div>
          </div>
        </div>

        {/* Player grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <div className="text-text-muted text-sm">Под фильтры не подошёл ни один игрок</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((player) => {
                const score = state.scores[player.id];
                const fitTags = computeFitTags(player, state.scores);
                const inRoster =
                  state.bench.includes(player.id) ||
                  Object.values(state.lineup).includes(player.id);
                return (
                  <FullPlayerCard
                    key={player.id}
                    player={player}
                    score={score?.total ?? player.baseRating}
                    fitTags={fitTags}
                    isShortlisted={shortlisted.has(player.id)}
                    onToggleShortlist={() => toggleShortlist(player.id)}
                    onAddToRoster={() => addToBench(player.id)}
                    isInRoster={inRoster}
                    onClick={() => setSelectedPlayer(selectedPlayer?.id === player.id ? null : player)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Player detail */}
      {selectedPlayer && (
        <RecruitmentDetailPanel
          player={selectedPlayer}
          score={state.scores[selectedPlayer.id]}
          isShortlisted={shortlisted.has(selectedPlayer.id)}
          onToggleShortlist={() => toggleShortlist(selectedPlayer.id)}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}

function RecruitmentDetailPanel({
  player,
  score,
  isShortlisted,
  onToggleShortlist,
  onClose,
}: {
  player: Player;
  score: import('@/types').ScoreBreakdown | undefined;
  isShortlisted: boolean;
  onToggleShortlist: () => void;
  onClose: () => void;
}) {
  const dynamicScore = score?.total ?? player.baseRating;
  const color = getScoreColor(dynamicScore);
  const label = getScoreLabel(dynamicScore);
  const initials = `${player.firstName[0]}${player.lastName[0]}`;

  return (
    <div
      className="w-80 border-l border-border-subtle flex flex-col overflow-hidden animate-slide-in-right"
      style={{ background: '#0d1424' }}
    >
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div
          className="px-5 pt-5 pb-4 border-b border-border-subtle"
          style={{ background: `linear-gradient(135deg, ${color}12 0%, transparent 100%)` }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-lg font-bold"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${player.avatarColor ?? '#1e40af'}dd, ${player.avatarColor ?? '#1e40af'}88)`,
                border: `1px solid ${player.avatarColor ?? '#1e40af'}60`,
              }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-text-primary leading-tight">{player.name}</div>
              <div className="text-[11px] text-text-muted">{player.flag} {player.nationality}</div>
              <div className="text-[11px] text-text-muted">{player.club}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                  style={{ background: `${color}20`, color }}
                >
                  {player.primaryPosition}
                </span>
                <span className="text-[10px] text-text-muted">{player.age}y</span>
                <span className="text-[10px] text-text-muted">€{player.marketValue}M</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-surface-4 hover:bg-surface-5 flex items-center justify-center text-text-muted hover:text-text-primary transition-all duration-150"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={onToggleShortlist}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 ${
                  isShortlisted ? 'bg-gold/20 text-gold' : 'bg-surface-4 text-text-muted hover:text-gold'
                }`}
              >
                <svg viewBox="0 0 24 24" fill={isShortlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Dynamic score */}
          <div
            className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl border"
            style={{ background: `${color}10`, borderColor: `${color}30` }}
          >
            <div>
              <div className="text-[9px] text-text-muted uppercase tracking-widest">Dynamic Score vs Current Setup</div>
              <div className="text-2xl font-bold score-number leading-tight" style={{ color }}>
                {dynamicScore}
                <span className="text-sm text-text-muted ml-2 font-normal">{label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Radar */}
        <div className="p-4 border-b border-border-subtle">
          <div className="text-[10px] text-text-muted uppercase tracking-widest mb-2">Attribute Radar</div>
          <div className="flex justify-center">
            <AttributeRadar attributes={player.attributes} size={200} showLabels />
          </div>
        </div>

        {/* Attribute bars */}
        <div className="p-4 border-b border-border-subtle">
          <div className="text-[10px] text-text-muted uppercase tracking-widest mb-3">Full Attributes</div>
          <div className="space-y-1.5">
            {[
              { label: 'Pace', value: player.attributes.pace },
              { label: 'Passing', value: player.attributes.passing },
              { label: 'Defending', value: player.attributes.defending },
              { label: 'Finishing', value: player.attributes.finishing },
              { label: 'Tactical IQ', value: player.attributes.tacticalIntelligence },
              { label: 'Physicality', value: player.attributes.physicality },
              { label: 'Press Resist.', value: player.attributes.pressResistance },
              { label: 'Ball Progress.', value: player.attributes.ballProgression },
              { label: 'Duels', value: player.attributes.duels },
              { label: 'Creativity', value: player.attributes.creativity },
            ].map(({ label, value }) => (
              <StatBar key={label} label={label} value={value} size="sm" />
            ))}
          </div>
        </div>

        {/* Score breakdown */}
        {score && (
          <div className="p-4 border-b border-border-subtle">
            <div className="text-[10px] text-text-muted uppercase tracking-widest mb-3">Score Breakdown</div>
            <ScoreBreakdownPanel breakdown={score} />
          </div>
        )}

        {/* Scouting info */}
        <div className="p-4">
          <div className="text-[10px] text-text-muted uppercase tracking-widest mb-3">Scouting Profile</div>
          <div className="space-y-2">
            <InfoRow label="Preferred Foot" value={player.preferredFoot} />
            <InfoRow label="Contract Until" value={player.contractEnds} />
            <InfoRow label="Market Value" value={`€${player.marketValue}M`} />
            <InfoRow label="Potential" value={String(player.potential)} />
            <InfoRow label="Height / Weight" value={`${player.height}cm / ${player.weight}kg`} />
          </div>

          <div className="mt-4">
            <div className="text-[10px] text-text-muted uppercase tracking-widest mb-2">Style Tags</div>
            <div className="flex flex-wrap gap-1">
              {player.styleTags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-surface-4 text-text-secondary border border-border-subtle">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-[10px] text-text-muted uppercase tracking-widest mb-2">Best Roles</div>
            <div className="flex flex-wrap gap-1">
              {player.preferredRoles.map((role) => (
                <span key={role} className="text-[10px] px-2 py-0.5 rounded bg-accent/10 text-accent-bright border border-accent/20">
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-text-muted">{label}</span>
      <span className="text-[11px] font-semibold text-text-primary">{value}</span>
    </div>
  );
}
