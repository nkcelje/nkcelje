'use client';

import { useSquad } from '@/context/SquadContext';
import { getPlayerById } from '@/data/players';
import { getScoreColor } from '@/lib/scoring';

export function BenchSection() {
  const { state, selectPlayer, swapWithBench } = useSquad();

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-[10px] text-text-muted uppercase tracking-widest">Substitutes</div>
        <div className="flex-1 h-px bg-border-subtle" />
        <div className="text-[10px] text-text-muted">{state.bench.length} available</div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {state.bench.map((playerId) => {
          const player = getPlayerById(playerId);
          if (!player) return null;
          const score = state.scores[playerId];
          const color = score ? getScoreColor(score.total) : '#94a3b8';
          const isSelected = state.selectedPlayerId === playerId;

          return (
            <div
              key={playerId}
              className={`flex flex-col items-center gap-1 cursor-pointer group`}
              onClick={() => selectPlayer(isSelected ? null : playerId)}
            >
              {/* Avatar with score */}
              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white transition-all duration-150 ${
                    isSelected ? 'ring-2 scale-110' : 'group-hover:ring-1 group-hover:scale-105'
                  }`}
                  style={{
                    background: `radial-gradient(circle at 35% 35%, ${player.avatarColor ?? '#1e40af'}dd, ${player.avatarColor ?? '#1e40af'}88)`,
                    border: `1px solid ${player.avatarColor ?? '#1e40af'}60`,
                    boxShadow: isSelected ? `0 0 0 2px ${color}, 0 0 12px ${color}40` : undefined,
                  }}
                >
                  {player.firstName[0]}{player.lastName[0]}
                </div>
                {score && (
                  <div
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold score-number"
                    style={{ background: color, color: '#04060f', boxShadow: `0 1px 4px ${color}60` }}
                  >
                    {score.total}
                  </div>
                )}
              </div>

              {/* Name + position */}
              <div className="text-center">
                <div className="text-[9px] font-semibold text-text-primary truncate max-w-[52px]">
                  {player.lastName}
                </div>
                <div className="text-[8px] font-bold uppercase tracking-wide" style={{ color }}>
                  {player.primaryPosition}
                </div>
              </div>

              {/* Quick-sub button */}
              {state.selectedPlayerId && state.selectedPlayerId !== playerId && (() => {
                const selectedId = state.selectedPlayerId;
                const isInLineup = Object.values(state.lineup).includes(selectedId);
                if (!isInLineup) return null;

                return (
                  <button
                    className="text-[9px] px-1.5 py-0.5 rounded bg-accent/20 text-accent-bright border border-accent/30 hover:bg-accent/30 transition-all duration-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      swapWithBench(selectedId!, playerId);
                    }}
                    title={`Bring on ${player.name}`}
                  >
                    SUB
                  </button>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
