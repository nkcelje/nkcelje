'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Player, Position, PreferredFoot, StyleTag } from '@/types';
import { useSquad } from '@/context/SquadContext';
import { useT } from '@/context/I18nContext';
import { getPlayerById } from '@/data/players';
import { useRecruits, removeRecruit } from '@/data/recruitsStore';
import { getFormationById } from '@/data/formations';
import { getScoreColor } from '@/lib/scoring';
import { getPassportBorder } from '@/lib/passport';

type Tab = 'club' | 'shortlist';

const ALL_STYLE_TAGS: StyleTag[] = [
  'Technical', 'Physical', 'Pacey', 'Creative', 'Clinical',
  'Press Resistant', 'High Work Rate', 'Leader', 'Set Piece Threat',
  'Ball Winner', 'Aerial', 'One-on-One', 'Dead Ball Specialist',
  'Dribbler', 'Long Range', 'Pressing', 'Positional',
];

const ALL_POSITIONS: Position[] = [
  'GK',
  'CB', 'LB', 'RB', 'LWB', 'RWB',
  'CDM', 'CM', 'CAM', 'LM', 'RM',
  'LW', 'RW', 'CF', 'ST',
];

const DEFAULTS = {
  search: '',
  positions: [] as Position[],
  minAge: 16,
  maxAge: 45,
  minRating: 40,
  foot: 'Any' as PreferredFoot | 'Any',
  styleTags: [] as StyleTag[],
};

export function SquadSidebar() {
  const { state, selectPlayer, selectSlot } = useSquad();
  const recruits = useRecruits();
  const t = useT();

  const [tab, setTab] = useState<Tab>('club');

  // Filters
  const [search, setSearch] = useState(DEFAULTS.search);
  const [positions, setPositions] = useState<Position[]>(DEFAULTS.positions);
  const [minAge, setMinAge] = useState(DEFAULTS.minAge);
  const [maxAge, setMaxAge] = useState(DEFAULTS.maxAge);
  const [minRating, setMinRating] = useState(DEFAULTS.minRating);
  const [foot, setFoot] = useState<PreferredFoot | 'Any'>(DEFAULTS.foot);
  const [styleTags, setStyleTags] = useState<StyleTag[]>(DEFAULTS.styleTags);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const resetFilters = () => {
    setSearch(DEFAULTS.search);
    setPositions(DEFAULTS.positions);
    setMinAge(DEFAULTS.minAge);
    setMaxAge(DEFAULTS.maxAge);
    setMinRating(DEFAULTS.minRating);
    setFoot(DEFAULTS.foot);
    setStyleTags(DEFAULTS.styleTags);
  };

  const filtersActive =
    search.trim() !== '' ||
    positions.length > 0 ||
    minAge !== DEFAULTS.minAge ||
    maxAge !== DEFAULTS.maxAge ||
    minRating !== DEFAULTS.minRating ||
    foot !== DEFAULTS.foot ||
    styleTags.length > 0;

  // Context position: derived strictly from `selectedSlotId`. The pitch sets
  // both selectedSlotId + selectedPlayerId when a pitch player is clicked, so
  // the filter kicks in. Clicks from inside this sidebar clear selectedSlotId
  // (see Row onClick below), so they do NOT activate the position filter.
  const contextPosition = useMemo<Position | null>(() => {
    if (!state.selectedSlotId) return null;
    const formation = getFormationById(state.tacticalSettings.formation);
    return formation?.slots.find((s) => s.id === state.selectedSlotId)?.role ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedSlotId, state.tacticalSettings.formation]);

  const clearContextPosition = () => selectSlot(null);

  // Clicking a row in the sidebar: open detail panel for the player, but drop
  // any pitch-derived slot context so the list isn't filtered by position.
  const handleRowClick = (id: string) => {
    selectPlayer(id);
    selectSlot(null);
  };

  const lookup = (id: string) => getPlayerById(id) ?? recruits.find((r) => r.id === id) ?? null;

  const clubPlayers = useMemo<Player[]>(() => {
    const ids = new Set<string>();
    for (const pid of Object.values(state.lineup)) if (pid) ids.add(pid);
    for (const pid of state.bench) ids.add(pid);
    return Array.from(ids)
      .map(lookup)
      .filter((p): p is Player => !!p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.lineup, state.bench, recruits]);

  const shortlistPlayers = recruits;
  const sourceList = tab === 'club' ? clubPlayers : shortlistPlayers;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sourceList.filter((p) => {
      if (contextPosition) {
        const plays =
          p.primaryPosition === contextPosition ||
          p.secondaryPositions.includes(contextPosition);
        if (!plays) return false;
      }
      if (positions.length > 0) {
        const playsAny = positions.some(
          (pos) => p.primaryPosition === pos || p.secondaryPositions.includes(pos)
        );
        if (!playsAny) return false;
      }
      if (p.age < minAge || p.age > maxAge) return false;
      // Match against the same value shown in the rating badge (computed total
      // with all modifiers, falling back to baseRating when no score yet).
      const displayedRating = state.scores[p.id]?.total ?? p.baseRating;
      if (displayedRating < minRating) return false;
      if (foot !== 'Any' && p.preferredFoot !== foot) return false;
      if (styleTags.length > 0 && !styleTags.every((tag) => p.styleTags.includes(tag))) return false;
      if (q) {
        const hay = `${p.name} ${p.firstName} ${p.lastName} ${p.club} ${p.nationality}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [sourceList, contextPosition, positions, search, minAge, maxAge, minRating, foot, styleTags, state.scores]);

  const lineupIds = useMemo(
    () => new Set(Object.values(state.lineup).filter(Boolean) as string[]),
    [state.lineup]
  );

  const toggleTag = (tag: StyleTag) =>
    setStyleTags((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-border-subtle shrink-0">
        <TabButton label={t('roster.tab.club')} active={tab === 'club'} onClick={() => setTab('club')} count={clubPlayers.length} />
        <TabButton label={t('roster.tab.shortlist')} active={tab === 'shortlist'} onClick={() => setTab('shortlist')} count={shortlistPlayers.length} />
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted text-xs pointer-events-none" aria-hidden>🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('filter.searchPlaceholder')}
            className="w-full h-8 pl-7 pr-2 rounded-md bg-surface-2 border border-border-subtle text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Slot-context filter badge */}
      {contextPosition && (
        <div className="px-3 pb-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-accent/30 bg-accent/10">
            <span className="text-[10px] uppercase tracking-widest font-bold text-accent">
              {t('filter.slotContext')}:
            </span>
            <span className="text-[11px] font-bold text-accent">{contextPosition}</span>
            <button
              type="button"
              onClick={clearContextPosition}
              className="ml-auto w-4 h-4 flex items-center justify-center rounded-sm text-accent hover:bg-accent/20 transition-colors"
              aria-label={t('filter.clearSlot')}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Collapsible filters */}
      <div className="px-3 pb-2 shrink-0">
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-[11px] uppercase tracking-widest font-bold transition-colors border ${
            filtersOpen
              ? 'bg-surface-3 text-text-primary border-border-subtle'
              : 'bg-surface-2 text-text-secondary border-border-subtle hover:bg-surface-3 hover:text-text-primary'
          }`}
          aria-expanded={filtersOpen}
        >
          <span className="flex items-center gap-1.5">
            {t('filter.title')}
            {filtersActive && <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden />}
          </span>
          <Chevron open={filtersOpen} />
        </button>

        {filtersOpen && (
          <div className="mt-2 space-y-3 pt-2">
            {/* Age */}
            <FilterRow label={t('filter.age')}>
              <div className="flex items-center gap-1.5">
                <NumInput value={minAge} onChange={setMinAge} min={15} max={45} />
                <span className="text-text-muted text-[10px]">—</span>
                <NumInput value={maxAge} onChange={setMaxAge} min={15} max={45} />
                <span className="text-[10px] text-text-muted">{t('filter.ageSuffix')}</span>
              </div>
            </FilterRow>

            {/* Min rating */}
            <FilterRow label={t('filter.minRating')}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold score-number" style={{ color: getScoreColor(minRating) }}>
                  ≥ {minRating}
                </span>
              </div>
              <input
                type="range"
                min={40}
                max={99}
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full"
              />
            </FilterRow>

            {/* Foot */}
            <FilterRow label={t('filter.foot')}>
              <div className="flex gap-1">
                {(['Any', 'Left', 'Right', 'Both'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFoot(f)}
                    className={`flex-1 px-1 py-1 rounded-md text-[10px] font-semibold transition-colors border ${
                      foot === f
                        ? 'bg-accent/20 text-accent border-accent/40'
                        : 'bg-surface-2 text-text-muted border-border-subtle hover:bg-surface-3'
                    }`}
                  >
                    {f === 'Any' ? t('filter.any') : t(`foot.${f}`)}
                  </button>
                ))}
              </div>
            </FilterRow>

            {/* Position (dropdown multi-select) */}
            <FilterRow label={t('filter.positions')}>
              <MultiSelectDropdown<Position>
                options={ALL_POSITIONS}
                selected={positions}
                onToggle={(pos) =>
                  setPositions((prev) => (prev.includes(pos) ? prev.filter((x) => x !== pos) : [...prev, pos]))
                }
                onClear={() => setPositions([])}
                placeholder={t('filter.any')}
                clearLabel={t('filter.clearSelection')}
              />
            </FilterRow>

            {/* Style tags (dropdown multi-select) */}
            <FilterRow label={t('filter.styleTags')}>
              <MultiSelectDropdown<StyleTag>
                options={ALL_STYLE_TAGS}
                selected={styleTags}
                onToggle={toggleTag}
                onClear={() => setStyleTags([])}
                placeholder={t('filter.any')}
                clearLabel={t('filter.clearSelection')}
              />
            </FilterRow>

            {filtersActive && (
              <button
                onClick={resetFilters}
                className="w-full py-1.5 text-[10px] rounded-md bg-surface-3 text-text-muted hover:bg-surface-4 hover:text-text-secondary border border-border-subtle"
              >
                {t('filter.reset')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {filtered.length === 0 ? (
          <div className="text-[11px] text-text-muted italic py-6 text-center">
            {tab === 'shortlist' && shortlistPlayers.length === 0
              ? t('roster.shortlistEmpty')
              : t('players.empty')}
          </div>
        ) : tab === 'club' ? (
          <ClubSections
            players={filtered}
            lineupIds={lineupIds}
            scores={state.scores}
            selectedId={state.selectedPlayerId}
            onSelect={handleRowClick}
            labelStarting={t('roster.starting')}
            labelBench={t('roster.bench')}
          />
        ) : (
          <div className="space-y-1.5 pt-1">
            {filtered.map((p) => (
              <Row
                key={p.id}
                player={p}
                score={state.scores[p.id]?.total ?? p.baseRating}
                selected={state.selectedPlayerId === p.id}
                onClick={() => handleRowClick(p.id)}
                onRemove={() => removeRecruit(p.id)}
                removeLabel={t('roster.removeFromShortlist')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MultiSelectDropdown<T extends string>({
  options,
  selected,
  onToggle,
  onClear,
  placeholder,
  clearLabel,
}: {
  options: readonly T[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  onClear: () => void;
  placeholder: string;
  clearLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const toggleOpen = () => setOpen((v) => !v);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleOpen();
    }
  };

  return (
    <div className="relative" ref={ref}>
      <div
        role="button"
        tabIndex={0}
        onClick={toggleOpen}
        onKeyDown={onKey}
        aria-expanded={open}
        className={`w-full flex items-center gap-1.5 px-2 py-1.5 min-h-8 rounded-md border cursor-pointer transition-colors ${
          open
            ? 'bg-surface-3 border-border-subtle text-text-primary'
            : 'bg-surface-2 border-border-subtle text-text-secondary hover:bg-surface-3 hover:text-text-primary'
        }`}
      >
        {selected.length === 0 ? (
          <span className="flex-1 truncate text-[11px] text-text-muted">{placeholder}</span>
        ) : (
          <div className="flex-1 flex flex-wrap gap-1">
            {selected.map((value) => (
              <span
                key={value}
                className="inline-flex items-center gap-1 pl-1.5 pr-0.5 py-0.5 rounded text-[10px] font-semibold bg-accent/15 text-accent border border-accent/30"
              >
                <span>{value}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(value);
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                  aria-label={`Remove ${value}`}
                  className="w-3.5 h-3.5 flex items-center justify-center rounded-sm hover:bg-accent/25 transition-colors leading-none"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
        <Chevron open={open} />
      </div>

      {open && (
        <div
          className="absolute left-0 right-0 mt-1 rounded-md border border-border-subtle shadow-xl overflow-hidden z-30"
          style={{ background: 'var(--surface-2)' }}
        >
          <div className="max-h-56 overflow-y-auto py-1">
            {options.map((tag) => {
              const active = selected.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggle(tag)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-left transition-colors ${
                    active ? 'text-accent bg-accent/10' : 'text-text-secondary hover:bg-surface-3 hover:text-text-primary'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                      active ? 'border-transparent' : 'border-border-subtle bg-surface-3'
                    }`}
                    style={active ? { background: 'var(--accent)' } : {}}
                  >
                    {active && <span className="text-white text-[9px] font-black leading-none">✓</span>}
                  </span>
                  <span className="truncate">{tag}</span>
                </button>
              );
            })}
          </div>
          {selected.length > 0 && (
            <div className="border-t border-border-subtle">
              <button
                type="button"
                onClick={onClear}
                className="w-full px-2.5 py-1.5 text-[10px] text-text-muted hover:text-text-secondary hover:bg-surface-3 transition-colors text-left"
              >
                {clearLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">{label}</div>
      {children}
    </div>
  );
}

function ClubSections({
  players,
  lineupIds,
  scores,
  selectedId,
  onSelect,
  labelStarting,
  labelBench,
}: {
  players: Player[];
  lineupIds: Set<string>;
  scores: Record<string, { total: number }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  labelStarting: string;
  labelBench: string;
}) {
  const starting = players.filter((p) => lineupIds.has(p.id));
  const bench = players.filter((p) => !lineupIds.has(p.id));
  const [startingOpen, setStartingOpen] = useState(true);
  const [benchOpen, setBenchOpen] = useState(true);

  return (
    <div className="space-y-3 pt-1">
      {starting.length > 0 && (
        <CollapsibleSection
          label={labelStarting}
          count={starting.length}
          accent
          open={startingOpen}
          onToggle={() => setStartingOpen((v) => !v)}
        >
          {starting.map((p) => (
            <Row
              key={p.id}
              player={p}
              score={scores[p.id]?.total ?? p.baseRating}
              selected={selectedId === p.id}
              onClick={() => onSelect(p.id)}
            />
          ))}
        </CollapsibleSection>
      )}
      {bench.length > 0 && (
        <CollapsibleSection
          label={labelBench}
          count={bench.length}
          open={benchOpen}
          onToggle={() => setBenchOpen((v) => !v)}
        >
          {bench.map((p) => (
            <Row
              key={p.id}
              player={p}
              score={scores[p.id]?.total ?? p.baseRating}
              selected={selectedId === p.id}
              onClick={() => onSelect(p.id)}
            />
          ))}
        </CollapsibleSection>
      )}
    </div>
  );
}

function CollapsibleSection({
  label,
  count,
  accent = false,
  open,
  onToggle,
  children,
}: {
  label: string;
  count: number;
  accent?: boolean;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-2 px-1 py-1 mb-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
          accent ? 'text-accent hover:text-accent/80' : 'text-text-muted hover:text-text-secondary'
        }`}
      >
        <span>{label} ({count})</span>
        <Chevron open={open} />
      </button>
      {open && <div className="space-y-1.5">{children}</div>}
    </div>
  );
}

function Row({
  player,
  score,
  selected,
  onClick,
  onRemove,
  removeLabel,
}: {
  player: Player;
  score: number;
  selected: boolean;
  onClick: () => void;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  const avatarColor = player.avatarColor ?? '#4d9fff';
  const passportColor = getPassportBorder(player);
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/player-id', player.id);
        e.dataTransfer.effectAllowed = 'move';
        (e.currentTarget as HTMLDivElement).classList.add('dragging');
      }}
      onDragEnd={(e) => {
        (e.currentTarget as HTMLDivElement).classList.remove('dragging');
      }}
      onClick={onClick}
      className={`group flex items-center gap-2 p-2 rounded-lg cursor-grab active:cursor-grabbing transition-all border-2 ${
        selected ? 'bg-accent/10' : 'bg-surface-1 hover:bg-surface-2'
      }`}
      style={{ userSelect: 'none', borderColor: selected ? 'var(--accent)' : passportColor }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${avatarColor}dd, ${avatarColor}88)`,
          border: `1px solid ${avatarColor}60`,
        }}
      >
        {player.jerseyNumber ?? '?'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-text-primary truncate">
          <span>{player.flag}</span>
          <span className="truncate">{player.name}</span>
        </div>
        <div className="text-[9px] uppercase tracking-wider text-text-muted">{player.primaryPosition}</div>
      </div>

      <div
        className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-black score-number shrink-0"
        style={{ color: getScoreColor(score), background: 'rgba(255,255,255,0.04)' }}
      >
        {score}
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          draggable={false}
          title={removeLabel}
          aria-label={removeLabel}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-text-muted hover:text-score-low hover:bg-score-low/10 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all duration-150 ${
        active
          ? 'text-accent border-b-2 border-accent bg-accent/5'
          : 'text-text-muted border-b-2 border-transparent hover:text-text-secondary'
      }`}
    >
      <span>{label}</span>
      <span className={`text-[10px] font-bold ${active ? 'text-accent' : 'text-text-muted'}`}>({count})</span>
    </button>
  );
}

function NumInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-14 bg-surface-2 border border-border-subtle rounded-md px-1 py-0.5 text-[11px] text-text-primary text-center focus:outline-none focus:border-accent"
    />
  );
}
