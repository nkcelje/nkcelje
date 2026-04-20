'use client';

import { useSquad } from '@/context/SquadContext';
import { getPlayerById } from '@/data/players';
import { useRecruits } from '@/data/recruitsStore';
import { getScoreColor } from '@/lib/scoring';
import { getPassportBorder } from '@/lib/passport';
import { useT } from '@/context/I18nContext';

/**
 * Right-side squad roster: all players currently in bench (including
 * those added from Recruitment via "+" button). Each row is draggable —
 * drop it onto a pitch slot to substitute that player in.
 */
export function RosterPanel() {
  const { state, selectPlayer } = useSquad();
  const recruits = useRecruits();
  const t = useT();

  const lookup = (id: string) => getPlayerById(id) ?? recruits.find((r) => r.id === id);
  const lineupIds = Object.values(state.lineup).filter(Boolean) as string[];
  const startingXI = lineupIds.map(lookup).filter(Boolean);
  const benchPlayers = state.bench.map(lookup).filter(Boolean);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border-subtle shrink-0">
        <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1">{t('roster.title')}</div>
        <div className="text-xs text-text-secondary">
          {t('squad.subheader')}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Starting XI */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2 px-1">
            {t('roster.starting')} ({startingXI.length})
          </div>
          <div className="space-y-1.5">
            {startingXI.map((p) => {
              if (!p) return null;
              const score = state.scores[p.id];
              return (
                <RosterRow
                  key={p.id}
                  playerId={p.id}
                  name={p.name}
                  position={p.primaryPosition}
                  number={p.jerseyNumber}
                  flag={p.flag}
                  score={score?.total ?? p.baseRating}
                  avatarColor={p.avatarColor ?? '#4d9fff'}
                  passportColor={getPassportBorder(p)}
                  onClick={() => selectPlayer(p.id)}
                  selected={state.selectedPlayerId === p.id}
                />
              );
            })}
          </div>
        </div>

        {/* Bench */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 px-1">
            {t('roster.bench')} ({benchPlayers.length})
          </div>
          {benchPlayers.length === 0 ? (
            <div className="text-[11px] text-text-muted px-1 py-2 italic">
              {t('roster.empty')}
            </div>
          ) : (
            <div className="space-y-1.5">
              {benchPlayers.map((p) => {
                if (!p) return null;
                const score = state.scores[p.id];
                return (
                  <RosterRow
                    key={p.id}
                    playerId={p.id}
                    name={p.name}
                    position={p.primaryPosition}
                    number={p.jerseyNumber}
                    flag={p.flag}
                    score={score?.total ?? p.baseRating}
                    avatarColor={p.avatarColor ?? '#4d9fff'}
                    passportColor={getPassportBorder(p)}
                    onClick={() => selectPlayer(p.id)}
                    selected={state.selectedPlayerId === p.id}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface RosterRowProps {
  playerId: string;
  name: string;
  position: string;
  number?: number;
  flag: string;
  score: number;
  avatarColor: string;
  passportColor: string;
  onClick: () => void;
  selected: boolean;
}

function RosterRow({
  playerId,
  name,
  position,
  number,
  flag,
  score,
  avatarColor,
  passportColor,
  onClick,
  selected,
}: RosterRowProps) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/player-id', playerId);
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
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${avatarColor}dd, ${avatarColor}88)`,
          border: `1px solid ${avatarColor}60`,
        }}
      >
        {number ?? '?'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-text-primary truncate">
          <span>{flag}</span>
          <span className="truncate">{name}</span>
        </div>
        <div className="text-[9px] uppercase tracking-wider text-text-muted">{position}</div>
      </div>

      {/* Score */}
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-black score-number shrink-0"
        style={{ color: getScoreColor(score), background: 'rgba(255,255,255,0.04)' }}
      >
        {score}
      </div>

      {/* Drag hint */}
      <div className="text-text-muted text-sm opacity-0 group-hover:opacity-100 transition-opacity shrink-0" aria-hidden>
        ⋮⋮
      </div>
    </div>
  );
}
