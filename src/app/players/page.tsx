'use client';

import { useMemo, useState } from 'react';
import { useSquad } from '@/context/SquadContext';
import { PLAYERS } from '@/data/players';
import { useRecruits } from '@/data/recruitsStore';
import { getScoreColor } from '@/lib/scoring';
import { getPassportBorder } from '@/lib/passport';
import { PlayerDetailPanel } from '@/components/player/PlayerDetailPanel';
import { useT } from '@/context/I18nContext';
import type { Position } from '@/types';

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

function contractYear(ends: string): number {
  // contractEnds usually looks like "2026" or "2026-06-30"
  const m = ends.match(/\d{4}/);
  return m ? parseInt(m[0], 10) : 2099;
}

export default function PlayersPage() {
  const { state, selectPlayer } = useSquad();
  const recruits = useRecruits();
  const t = useT();

  // Only team players (lineup + bench), not scouted ones
  const teamIds = useMemo(() => {
    const lineupIds = Object.values(state.lineup).filter(Boolean) as string[];
    return Array.from(new Set([...lineupIds, ...state.bench]));
  }, [state.lineup, state.bench]);

  const teamPlayers = useMemo(() => {
    const pool = [...PLAYERS, ...recruits];
    return pool.filter((p) => teamIds.includes(p.id));
  }, [teamIds, recruits]);

  // Filters
  const [amplua, setAmplua] = useState<'ALL' | AmpluaGroup>('ALL');
  const [maxAge, setMaxAge] = useState<number>(40);
  const [minAge, setMinAge] = useState<number>(16);
  const [contractThrough, setContractThrough] = useState<number>(2099);

  const filtered = useMemo(() => {
    return teamPlayers.filter((p) => {
      if (amplua !== 'ALL' && ampluaOf(p.primaryPosition) !== amplua) return false;
      if (p.age < minAge || p.age > maxAge) return false;
      if (contractYear(p.contractEnds) > contractThrough) return false;
      return true;
    });
  }, [teamPlayers, amplua, minAge, maxAge, contractThrough]);

  // Group by amplua
  const grouped = useMemo(() => {
    const out: Record<AmpluaGroup, typeof filtered> = { GK: [], DEF: [], MID: [], FWD: [] };
    for (const p of filtered) out[ampluaOf(p.primaryPosition)].push(p);
    return out;
  }, [filtered]);

  const hasSelection = !!state.selectedPlayerId;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left: filters */}
      <aside
        className="w-[260px] border-r border-border-subtle shrink-0 overflow-y-auto"
        style={{ background: 'var(--surface-1)' }}
      >
        <div className="px-4 py-4">
          <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1">{t('filter.title')}</div>
          <div className="text-xs text-text-secondary mb-5">{t('players.teamSize')} — {teamPlayers.length}</div>

          {/* Amplua */}
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

          {/* Age range */}
          <FilterSection label={t('filter.age')}>
            <div className="flex items-center gap-2">
              <NumInput value={minAge} onChange={setMinAge} min={15} max={45} />
              <span className="text-text-muted text-xs">—</span>
              <NumInput value={maxAge} onChange={setMaxAge} min={15} max={45} />
              <span className="text-[10px] text-text-muted">{t('filter.ageSuffix')}</span>
            </div>
          </FilterSection>

          {/* Contract */}
          <FilterSection label={t('filter.contract')}>
            <div className="flex items-center gap-2">
              <NumInput value={contractThrough} onChange={setContractThrough} min={2024} max={2035} />
            </div>
            <div className="flex gap-1 mt-2 flex-wrap">
              {[2025, 2026, 2027, 2028, 2099].map((y) => (
                <button
                  key={y}
                  onClick={() => setContractThrough(y)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                    contractThrough === y
                      ? 'bg-accent/20 text-accent border border-accent/30'
                      : 'bg-surface-3 text-text-muted border border-border-subtle hover:bg-surface-4'
                  }`}
                >
                  {y === 2099 ? t('filter.any') : y}
                </button>
              ))}
            </div>
          </FilterSection>

          <button
            onClick={() => {
              setAmplua('ALL');
              setMinAge(16);
              setMaxAge(40);
              setContractThrough(2099);
            }}
            className="w-full mt-2 py-2 text-[11px] rounded-md bg-surface-3 text-text-muted hover:bg-surface-4 hover:text-text-secondary border border-border-subtle"
          >
            {t('filter.reset')}
          </button>
        </div>
      </aside>

      {/* Middle: grouped list */}
      <main className="flex-1 min-w-0 overflow-y-auto p-5">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-text-primary">{t('players.title')}</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            {t('players.found')}: {filtered.length} {t('players.of')} {teamPlayers.length}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="text-sm text-text-muted italic py-10 text-center">
            {t('players.empty')}
          </div>
        ) : (
          <div className="space-y-6">
            {(['GK', 'DEF', 'MID', 'FWD'] as AmpluaGroup[]).map((group) => {
              const list = grouped[group];
              if (list.length === 0) return null;
              return (
                <section key={group}>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">
                    {t(AMPLUA_KEYS[group])} ({list.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {list.map((p) => {
                      const score = state.scores[p.id];
                      const rating = score?.total ?? p.baseRating;
                      const selected = state.selectedPlayerId === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => selectPlayer(selected ? null : p.id)}
                          className={`text-left rounded-lg p-3 border-2 transition-all duration-150 ${
                            selected ? 'bg-accent/10' : 'bg-surface-1 hover:bg-surface-2'
                          }`}
                          style={{ borderColor: selected ? 'var(--accent)' : getPassportBorder(p) }}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 text-[11px]"
                              style={{
                                background: `radial-gradient(circle at 35% 35%, ${p.avatarColor ?? '#1e40af'}dd, ${p.avatarColor ?? '#1e40af'}88)`,
                                border: `1px solid ${p.avatarColor ?? '#1e40af'}60`,
                              }}
                            >
                              {p.jerseyNumber ?? (p.firstName[0] + p.lastName[0])}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 text-xs font-semibold text-text-primary truncate">
                                <span>{p.flag}</span>
                                <span className="truncate">{p.name}</span>
                                {p.isCaptain && <span className="text-[9px] text-gold ml-0.5">©</span>}
                              </div>
                              <div className="text-[10px] text-text-muted">
                                {p.primaryPosition} · {p.age} {t('filter.ageSuffix')} · {contractYear(p.contractEnds)}
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
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
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
              👤
            </div>
            <div className="text-sm text-text-muted">{t('players.select')}</div>
            <div className="text-[11px] text-text-dim mt-1">{t('players.select.sub')}</div>
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
