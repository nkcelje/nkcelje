'use client';

import { FootballPitch } from '@/components/pitch/FootballPitch';
import { PlayerDetailPanel } from '@/components/player/PlayerDetailPanel';
import { SquadSidebar } from '@/components/pitch/SquadSidebar';
import { TeamStatsBar } from '@/components/pitch/TeamStatsBar';
import { useSquad } from '@/context/SquadContext';

export default function SquadBuilderPage() {
  const { state } = useSquad();
  const hasSelectedPlayer = !!state.selectedPlayerId;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ── Left: Team stats + Squad tabs + filters ── */}
      <aside
        className="w-[320px] border-r border-border-subtle flex flex-col shrink-0 overflow-hidden"
        style={{ background: 'var(--surface-1)' }}
      >
        <div className="px-4 py-3 border-b border-border-subtle shrink-0">
          <TeamStatsBar compact />
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <SquadSidebar />
        </div>
      </aside>

      {/* ── Centre: Pitch ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start py-6 px-4">
          <FootballPitch />
        </div>
      </div>

      {/* ── Right: sliding player detail panel ── */}
      <aside
        className={`shrink-0 overflow-hidden border-l border-border-subtle transition-[width] duration-300 ease-out ${
          hasSelectedPlayer ? 'w-[340px]' : 'w-0'
        }`}
        style={{ background: 'var(--surface-1)' }}
        aria-hidden={!hasSelectedPlayer}
      >
        <div
          className={`w-[340px] h-full transition-transform duration-300 ease-out ${
            hasSelectedPlayer ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <PlayerDetailPanel />
        </div>
      </aside>
    </div>
  );
}
