'use client';

import { FootballPitch } from '@/components/pitch/FootballPitch';
import { PlayerDetailPanel } from '@/components/player/PlayerDetailPanel';
import { SquadSidebar } from '@/components/pitch/SquadSidebar';
import { TeamRatingBlock, UclFunnel, FormStrip } from '@/components/pitch/RightRail';
import { useSquad } from '@/context/SquadContext';

export default function SquadBuilderPage() {
  const { state } = useSquad();
  const hasSelection = !!state.selectedPlayerId;

  return (
    <div className="view-squad">
      {/* Left: lineup + bench list */}
      <div className="col">
        <SquadSidebar />
      </div>

      {/* Center: pitch */}
      <div className="col pitch-wrap" style={{ overflow: 'hidden' }}>
        <FootballPitch />
      </div>

      {/* Right: ratings or selected player */}
      <div className="col">
        {hasSelection ? (
          <PlayerDetailPanel />
        ) : (
          <>
            <TeamRatingBlock />
            <UclFunnel />
            <FormStrip />
          </>
        )}
      </div>
    </div>
  );
}
