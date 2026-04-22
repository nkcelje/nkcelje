'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { useSquad } from '@/context/SquadContext';
import { SHORTLIST_CANDIDATES } from '@/data/shortlistCandidates';
import { addRecruit, useRecruits } from '@/data/recruitsStore';
import { getScoreColor } from '@/lib/scoring';
import { getPassportBorder } from '@/lib/passport';
import { PlayerDetailPanel } from '@/components/player/PlayerDetailPanel';
import { useT } from '@/context/I18nContext';
import type { Player, Position, League } from '@/types';

type AmpluaGroup = 'GK' | 'DEF' | 'MID' | 'FWD';

const AMPLUA_KEYS: Record<AmpluaGroup, string> = {
  GK: 'filter.gk',
  DEF: 'filter.def',
  MID: 'filter.mid',
  FWD: 'filter.fwd',
};

const GK: Position[] = ['GK'];
const DEF: Position[] = ['CB', 'LB', 'RB', 'LWB', 'RWB'];
const MID: Position[] = ['CDM', 'CM', 'CAM', 'LM', 'RM'];
const FWD: Position[] = ['LW', 'RW', 'CF', 'ST'];

function ampluaOf(pos: Position): AmpluaGroup {
  if (GK.includes(pos)) return 'GK';
  if (DEF.includes(pos)) return 'DEF';
  if (MID.includes(pos)) return 'MID';
  return 'FWD';
}

export default function ShortlistPage() {
  const { state, selectPlayer, addToBench } = useSquad();
  const recruits = useRecruits();
  const t = useT();

  // Filters
  const [query, setQuery] = useState('');
  const [amplua, setAmplua] = useState<'ALL' | AmpluaGroup>('ALL');
  const [minAge, setMinAge] = useState<number>(16);
  const [maxAge, setMaxAge] = useState<number>(40);
  const [league, setLeague] = useState<'ALL' | League>('ALL');
  const [country, setCountry] = useState('');

  // Teamed/recruited set — hide + button if already added
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
    const c = country.trim().toLowerCase();
    return SHORTLIST_CANDIDATES.filter((p) => {
      if (amplua !== 'ALL' && ampluaOf(p.primaryPosition) !== amplua) return false;
      if (p.age < minAge || p.age > maxAge) return false;
      if (league !== 'ALL' && p.league !== league) return false;
      if (c && !p.nationality.toLowerCase().includes(c)) return false;
      if (q) {
        const hay = `${p.name} ${p.firstName} ${p.lastName} ${p.club} ${p.league} ${p.nationality}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [query, amplua, minAge, maxAge, league, country]);

  const hasSelection = !!state.selectedPlayerId;

  // Stable handlers — keep CandidateCard.memo effective across selection toggles.
  const handleAdd = useCallback(
    (id: string) => {
      const candidate = SHORTLIST_CANDIDATES.find((p) => p.id === id);
      if (!candidate) return;
      addRecruit(candidate);
      addToBench(id);
    },
    [addToBench]
  );

  const handleSelect = useCallback(
    (id: string | null) => selectPlayer(id),
    [selectPlayer]
  );

  const ageSuffix = t('filter.ageSuffix');
  const addLabel = t('shortlist.add');
  const alreadyLabel = t('shortlist.alreadyAdded');

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left: filters */}
      <aside
        className="w-[280px] border-r border-border-subtle shrink-0 overflow-y-auto"
        style={{ background: 'var(--surface-1)' }}
      >
        <div className="px-4 py-4">
          <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1">{t('filter.title')}</div>
          <div className="text-xs text-text-secondary mb-5">{t('shortlist.candidates')} — {SHORTLIST_CANDIDATES.length}</div>

          <FilterSection label={t('filter.search')}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('filter.searchPlaceholder')}
              className="w-full bg-surface-2 border border-border-subtle rounded-md px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent"
            />
          </FilterSection>

          <FilterSection label={t('filter.position')}>
            <div className="flex flex-col gap-1">
              <RadioChip label={t('filter.all')} active={amplua === 'ALL'} onClick={() => setAmplua('ALL')} />
              {(['GK', 'DEF', 'MID', 'FWD'] as AmpluaGroup[]).map((a) => (
                <RadioChip
                  key={a}
                  label={t(AMPLUA_KEYS[a])}
                  active={amplua === a}
                  onClick={() => setAmplua(a)}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection label={t('filter.age')}>
            <div className="flex items-center gap-2">
              <NumInput value={minAge} onChange={setMinAge} min={15} max={45} />
              <span className="text-text-muted text-xs">—</span>
              <NumInput value={maxAge} onChange={setMaxAge} min={15} max={45} />
              <span className="text-[10px] text-text-muted">{t('filter.ageSuffix')}</span>
            </div>
          </FilterSection>

          <FilterSection label={t('filter.league')}>
            <select
              value={league}
              onChange={(e) => setLeague(e.target.value as 'ALL' | League)}
              className="w-full bg-surface-2 border border-border-subtle rounded-md px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="ALL">{t('filter.allLeagues')}</option>
              {leagues.map((lg) => (
                <option key={lg} value={lg}>
                  {lg}
                </option>
              ))}
            </select>
          </FilterSection>

          <FilterSection label={t('filter.country')}>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder={t('filter.countryPlaceholder')}
              className="w-full bg-surface-2 border border-border-subtle rounded-md px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent"
            />
          </FilterSection>

          <button
            onClick={() => {
              setQuery('');
              setAmplua('ALL');
              setMinAge(16);
              setMaxAge(40);
              setLeague('ALL');
              setCountry('');
            }}
            className="w-full mt-2 py-2 text-[11px] rounded-md bg-surface-3 text-text-muted hover:bg-surface-4 hover:text-text-secondary border border-border-subtle"
          >
            {t('filter.reset')}
          </button>
        </div>
      </aside>

      {/* Middle: candidate grid */}
      <main className="flex-1 min-w-0 overflow-y-auto p-5">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-text-primary">{t('shortlist.title')}</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            {t('players.found')}: {filtered.length} {t('players.of')} {SHORTLIST_CANDIDATES.length}. {t('shortlist.subtitle')}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="text-sm text-text-muted italic py-10 text-center">
            {t('shortlist.empty')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((p) => {
              const selected = state.selectedPlayerId === p.id;
              const already = teamedIds.has(p.id);
              return (
                <CandidateCard
                  key={p.id}
                  player={p}
                  selected={selected}
                  already={already}
                  ageSuffix={ageSuffix}
                  addLabel={addLabel}
                  alreadyLabel={alreadyLabel}
                  onSelect={handleSelect}
                  onAdd={handleAdd}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Right: detail panel */}
      <aside
        className="w-[340px] border-l border-border-subtle shrink-0 overflow-hidden flex flex-col"
        style={{ background: 'var(--surface-1)' }}
      >
        {hasSelection ? (
          <PlayerDetailPanel />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-surface-3 flex items-center justify-center mb-3 text-2xl">
              🔍
            </div>
            <div className="text-sm text-text-muted">{t('shortlist.select')}</div>
            <div className="text-[11px] text-text-dim mt-1">{t('shortlist.select.sub')}</div>
          </div>
        )}
      </aside>
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">{label}</div>
      {children}
    </div>
  );
}

function RadioChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border ${
        active
          ? 'bg-accent/15 text-accent border-accent/40'
          : 'bg-surface-2 text-text-secondary border-border-subtle hover:bg-surface-3'
      }`}
    >
      {label}
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
      className="w-16 bg-surface-2 border border-border-subtle rounded-md px-2 py-1 text-xs text-text-primary text-center focus:outline-none focus:border-accent"
    />
  );
}

// Memoized candidate card. Keeps the grid from re-rendering all ~N cards on
// every selection toggle — only the two cards whose `selected` flag flipped.
type CandidateCardProps = {
  player: Player;
  selected: boolean;
  already: boolean;
  ageSuffix: string;
  addLabel: string;
  alreadyLabel: string;
  onSelect: (id: string | null) => void;
  onAdd: (id: string) => void;
};

const CandidateCard = memo(function CandidateCard({
  player,
  selected,
  already,
  ageSuffix,
  addLabel,
  alreadyLabel,
  onSelect,
  onAdd,
}: CandidateCardProps) {
  const avatar = player.avatarColor ?? '#1e40af';
  const rating = player.baseRating;
  return (
    <div
      className={`rounded-lg p-3 border-2 transition-all duration-150 ${
        selected ? 'bg-accent/10' : 'bg-surface-1 hover:bg-surface-2'
      }`}
      style={{ borderColor: selected ? 'var(--accent)' : getPassportBorder(player) }}
    >
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => onSelect(selected ? null : player.id)}
          className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 text-[11px]"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${avatar}dd, ${avatar}88)`,
              border: `1px solid ${avatar}60`,
            }}
          >
            {player.primaryPosition}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-xs font-semibold text-text-primary truncate">
              <span>{player.flag}</span>
              <span className="truncate">{player.name}</span>
            </div>
            <div className="text-[10px] text-text-muted truncate">
              {player.club} · {player.league}
            </div>
            <div className="text-[10px] text-text-dim">
              {player.age} {ageSuffix} · {player.nationality} · €{player.marketValue.toFixed(1)}M
            </div>
          </div>
          <div
            className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center text-sm font-black score-number"
            style={{
              color: getScoreColor(rating),
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {rating}
          </div>
        </button>
        <button
          onClick={() => !already && onAdd(player.id)}
          disabled={already}
          title={already ? alreadyLabel : addLabel}
          className={`shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-base font-black transition-colors ${
            already
              ? 'bg-surface-3 text-text-dim cursor-not-allowed border border-border-subtle'
              : 'bg-accent/15 text-accent border border-accent/40 hover:bg-accent/25'
          }`}
        >
          {already ? '✓' : '+'}
        </button>
      </div>
    </div>
  );
});
