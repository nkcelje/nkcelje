'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Player, Position, PreferredFoot, StyleTag } from '@/types';
import { useSquad } from '@/context/SquadContext';
import { useT } from '@/context/I18nContext';
import { getPlayerById } from '@/data/players';
import { useRecruits, removeRecruit } from '@/data/recruitsStore';
import { getFormationById } from '@/data/formations';
import { getPassportTag } from '@/lib/passport';

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

  const contextPosition = useMemo<Position | null>(() => {
    if (!state.selectedSlotId) return null;
    const formation = getFormationById(state.tacticalSettings.formation);
    return formation?.slots.find((s) => s.id === state.selectedSlotId)?.role ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedSlotId, state.tacticalSettings.formation]);

  const clearContextPosition = () => selectSlot(null);

  const handleRowClick = (id: string) => {
    selectPlayer(id);
    selectSlot(null);
  };

  const lookup = (id: string) => getPlayerById(id) ?? recruits.find((r) => r.id === id) ?? null;

  const startingIds = useMemo(() => {
    const formation = getFormationById(state.tacticalSettings.formation);
    if (!formation) return [] as { id: string; slotPos: Position; slotLabel: string }[];
    return formation.slots
      .map((slot) => {
        const pid = state.lineup[slot.id];
        if (!pid) return null;
        return { id: pid, slotPos: slot.role, slotLabel: slot.label };
      })
      .filter((x): x is { id: string; slotPos: Position; slotLabel: string } => !!x);
  }, [state.lineup, state.tacticalSettings.formation]);

  const benchIds = state.bench;

  const startingPlayers = useMemo(
    () =>
      startingIds
        .map((s) => {
          const p = lookup(s.id);
          if (!p) return null;
          return { player: p, slotPos: s.slotPos, slotLabel: s.slotLabel };
        })
        .filter((x): x is { player: Player; slotPos: Position; slotLabel: string } => !!x),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startingIds, recruits]
  );

  const benchPlayers = useMemo(
    () => benchIds.map(lookup).filter((p): p is Player => !!p),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [benchIds, recruits]
  );

  const shortlistPlayers = recruits;

  const matchesFilters = (p: Player): boolean => {
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
    const displayedRating = state.scores[p.id]?.total ?? p.baseRating;
    if (displayedRating < minRating) return false;
    if (foot !== 'Any' && p.preferredFoot !== foot) return false;
    if (styleTags.length > 0 && !styleTags.every((tag) => p.styleTags.includes(tag))) return false;
    if (search.trim()) {
      const hay = `${p.name} ${p.firstName} ${p.lastName} ${p.club} ${p.nationality}`.toLowerCase();
      if (!hay.includes(search.trim().toLowerCase())) return false;
    }
    return true;
  };

  const toggleTag = (tag: StyleTag) =>
    setStyleTags((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));

  const onPlayerListClick = (id: string) => handleRowClick(id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tabs */}
      <div className="col-head">
        <div style={{ display: 'flex', gap: 10 }}>
          <TabButton label={t('roster.tab.club')} active={tab === 'club'} onClick={() => setTab('club')} />
          <TabButton label={t('roster.tab.shortlist')} active={tab === 'shortlist'} onClick={() => setTab('shortlist')} count={shortlistPlayers.length} />
        </div>
        <span className="badge mono">
          {tab === 'club'
            ? `${startingPlayers.length} / 11`
            : `${shortlistPlayers.length}`}
        </span>
      </div>

      {/* Passport legend + search */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--line)' }}>
        <div className="pp-legend" style={{ marginBottom: 8 }}>
          <span className="si"><span className="dot" />SLO</span>
          <span className="eu"><span className="dot" />EU</span>
          <span className="for"><span className="dot" />FOR</span>
        </div>
        <input
          className="input"
          placeholder={t('filter.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Slot context badge */}
      {contextPosition && (
        <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--line)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 4,
              background: 'rgba(250,140,22,0.10)',
              border: '1px solid rgba(250,140,22,0.30)',
            }}
          >
            <span
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontWeight: 700,
                color: 'var(--celje-yellow)',
              }}
            >
              {t('filter.slotContext')}:
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--celje-yellow)' }}>
              {contextPosition}
            </span>
            <button
              type="button"
              onClick={clearContextPosition}
              aria-label={t('filter.clearSlot')}
              style={{
                marginLeft: 'auto',
                width: 16,
                height: 16,
                display: 'grid',
                placeItems: 'center',
                color: 'var(--celje-yellow)',
                background: 'none',
                border: 0,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Filters collapsible */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--line)' }}>
        <button
          type="button"
          className="btn ghost"
          onClick={() => setFiltersOpen((v) => !v)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {t('filter.title')}
            {filtersActive && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--celje-yellow)',
                }}
              />
            )}
          </span>
          <Chevron open={filtersOpen} />
        </button>

        {filtersOpen && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FilterRow label={t('filter.age')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <NumInput value={minAge} onChange={setMinAge} min={15} max={45} />
                <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>—</span>
                <NumInput value={maxAge} onChange={setMaxAge} min={15} max={45} />
                <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>{t('filter.ageSuffix')}</span>
              </div>
            </FilterRow>

            <FilterRow label={t('filter.minRating')}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--celje-yellow)',
                }}
              >
                ≥ {minRating}
              </div>
              <input
                type="range"
                min={40}
                max={99}
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </FilterRow>

            <FilterRow label={t('filter.foot')}>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['Any', 'Left', 'Right', 'Both'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFoot(f)}
                    className="btn"
                    style={{
                      flex: 1,
                      padding: '5px 6px',
                      fontSize: 10,
                      ...(foot === f
                        ? {
                            background: 'rgba(250,140,22,0.18)',
                            color: 'var(--celje-yellow)',
                            borderColor: 'rgba(250,140,22,0.50)',
                          }
                        : {}),
                    }}
                  >
                    {f === 'Any' ? t('filter.any') : t(`foot.${f}`)}
                  </button>
                ))}
              </div>
            </FilterRow>

            <FilterRow label={t('filter.positions')}>
              <MultiSelectDropdown<Position>
                options={ALL_POSITIONS}
                selected={positions}
                onToggle={(pos) =>
                  setPositions((prev) =>
                    prev.includes(pos) ? prev.filter((x) => x !== pos) : [...prev, pos]
                  )
                }
                onClear={() => setPositions([])}
                placeholder={t('filter.any')}
                clearLabel={t('filter.clearSelection')}
              />
            </FilterRow>

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
              <button type="button" className="btn ghost" onClick={resetFilters}>
                {t('filter.reset')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'club' ? (
          <>
            <div className="section-head">
              <span>{t('roster.starting')}</span>
              <span className="mono">{startingPlayers.filter((s) => matchesFilters(s.player)).length}</span>
            </div>
            <div className="plist">
              {startingPlayers.filter((s) => matchesFilters(s.player)).map(({ player, slotPos, slotLabel }) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  slotPos={slotPos}
                  slotLabel={slotLabel}
                  active={state.selectedPlayerId === player.id}
                  onClick={() => onPlayerListClick(player.id)}
                  ovr={state.scores[player.id]?.total ?? player.baseRating}
                />
              ))}
              {startingPlayers.filter((s) => matchesFilters(s.player)).length === 0 && (
                <EmptyHint>{t('players.empty')}</EmptyHint>
              )}
            </div>

            <div className="section-head">
              <span>{t('roster.bench')}</span>
              <span className="mono">{benchPlayers.filter(matchesFilters).length}</span>
            </div>
            <div className="plist">
              {benchPlayers.filter(matchesFilters).map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  active={state.selectedPlayerId === player.id}
                  onClick={() => onPlayerListClick(player.id)}
                  ovr={state.scores[player.id]?.total ?? player.baseRating}
                />
              ))}
              {benchPlayers.filter(matchesFilters).length === 0 && (
                <EmptyHint>{t('players.empty')}</EmptyHint>
              )}
            </div>
          </>
        ) : (
          <div className="plist">
            {shortlistPlayers.length === 0 ? (
              <EmptyHint>{t('roster.shortlistEmpty')}</EmptyHint>
            ) : (
              shortlistPlayers.filter(matchesFilters).map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  active={state.selectedPlayerId === player.id}
                  onClick={() => onPlayerListClick(player.id)}
                  ovr={state.scores[player.id]?.total ?? player.baseRating}
                  onRemove={() => removeRecruit(player.id)}
                  removeLabel={t('roster.removeFromShortlist')}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ───────── helpers ─────────

function tierClass(ovr: number) {
  if (ovr >= 85) return 't-elite';
  if (ovr >= 80) return 't-good';
  if (ovr >= 72) return 't-mid';
  return 't-low';
}

function PlayerRow({
  player,
  slotPos,
  slotLabel,
  active,
  onClick,
  ovr,
  onRemove,
  removeLabel,
}: {
  player: Player;
  slotPos?: Position;
  slotLabel?: string;
  active: boolean;
  onClick: () => void;
  ovr: number;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  const passport = getPassportTag(player);
  const mismatch = !!slotPos && player.primaryPosition !== slotPos;
  return (
    <div
      className={`prow pp-row-${passport} ${active ? 'active' : ''}`}
      onClick={onClick}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/player-id', player.id);
        e.dataTransfer.effectAllowed = 'move';
        (e.currentTarget as HTMLDivElement).classList.add('dragging');
      }}
      onDragEnd={(e) => {
        (e.currentTarget as HTMLDivElement).classList.remove('dragging');
      }}
    >
      <span className="pnum">{player.jerseyNumber ?? '—'}</span>
      <span className="pflag" title={player.nationality}>{player.flag}</span>
      <span className="pname">
        {player.lastName}
        {player.isCaptain ? ' ©' : ''}
      </span>
      <span
        className="ppos"
        style={mismatch ? { color: 'var(--warn)', borderColor: 'var(--warn)' } : undefined}
        title={slotPos ? `Slot: ${slotPos}` : undefined}
      >
        {slotLabel ?? player.primaryPosition}
      </span>
      <span className={`povr ${tierClass(ovr)}`}>{ovr}</span>
      {onRemove && (
        <button
          type="button"
          aria-label={removeLabel}
          title={removeLabel}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            position: 'absolute',
            right: 4,
            top: 4,
            width: 18,
            height: 18,
            display: 'grid',
            placeItems: 'center',
            background: 'none',
            border: 0,
            color: 'var(--ink-3)',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '20px 16px',
        textAlign: 'center',
        color: 'var(--ink-3)',
        fontSize: 11,
        fontStyle: 'italic',
      }}
    >
      {children}
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
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none',
        border: 0,
        padding: '4px 0',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: active ? 'var(--celje-yellow)' : 'var(--ink-2)',
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {label}
      {count !== undefined && (
        <span style={{ marginLeft: 4, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
          ({count})
        </span>
      )}
      {active && (
        <span
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: -14,
            height: 2,
            background: 'var(--celje-yellow)',
          }}
        />
      )}
    </button>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: 'var(--ink-3)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      {children}
    </div>
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
      className="input"
      style={{ width: 56, padding: '4px 6px', fontSize: 11, textAlign: 'center' }}
    />
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }}
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
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

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        className="input"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          minHeight: 32,
          padding: '4px 8px',
          cursor: 'pointer',
        }}
      >
        {selected.length === 0 ? (
          <span style={{ flex: 1, fontSize: 11, color: 'var(--ink-3)' }}>{placeholder}</span>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {selected.map((value) => (
              <span
                key={value}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '0 4px',
                  fontSize: 10,
                  fontWeight: 600,
                  background: 'rgba(250,140,22,0.16)',
                  color: 'var(--celje-yellow)',
                  border: '1px solid rgba(250,140,22,0.40)',
                  borderRadius: 3,
                }}
              >
                <span>{value}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(value);
                  }}
                  style={{
                    background: 'none',
                    border: 0,
                    color: 'inherit',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: 10,
                  }}
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
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            marginTop: 4,
            background: 'var(--bg-1)',
            border: '1px solid var(--line-2)',
            borderRadius: 8,
            boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
            zIndex: 30,
            overflow: 'hidden',
          }}
        >
          <div style={{ maxHeight: 220, overflowY: 'auto', padding: '4px 0' }}>
            {options.map((tag) => {
              const active = selected.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggle(tag)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    fontSize: 11,
                    textAlign: 'left',
                    background: active ? 'rgba(250,140,22,0.10)' : 'transparent',
                    color: active ? 'var(--celje-yellow)' : 'var(--ink-1)',
                    border: 0,
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      border: '1px solid var(--line)',
                      background: active ? 'var(--celje-yellow)' : 'var(--bg-2)',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--accent-ink)',
                      fontSize: 9,
                      fontWeight: 900,
                    }}
                  >
                    {active ? '✓' : ''}
                  </span>
                  <span style={{ flex: 1 }}>{tag}</span>
                </button>
              );
            })}
          </div>
          {selected.length > 0 && (
            <div style={{ borderTop: '1px solid var(--line)' }}>
              <button
                type="button"
                onClick={onClear}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  fontSize: 10,
                  textAlign: 'left',
                  color: 'var(--ink-3)',
                  background: 'none',
                  border: 0,
                  cursor: 'pointer',
                }}
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
