'use client';

import { useSquad } from '@/context/SquadContext';
import { getPlayerById } from '@/data/players';
import { FORMATIONS } from '@/data/formations';
import { PitchPlayerCard } from './PlayerCard';
import { ChemistryLinks } from './ChemistryLinks';

// Pitch dimensions (display)
const PITCH_W = 480;
const PITCH_H = 640;

export function FootballPitch() {
  const { state, selectPlayer, selectSlot, assignPlayerToSlot } = useSquad();
  const formation = FORMATIONS.find((f) => f.id === state.formation);

  if (!formation) return null;

  const handleSlotClick = (slotId: string) => {
    const playerId = state.lineup[slotId];
    if (playerId) {
      selectPlayer(playerId === state.selectedPlayerId ? null : playerId);
      selectSlot(null);
    } else {
      selectSlot(slotId === state.selectedSlotId ? null : slotId);
    }
  };

  return (
    <div className="relative" style={{ width: PITCH_W, height: PITCH_H, maxWidth: '100%' }}>
      {/* Pitch background */}
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #0e2a18 0%, #112e1c 20%, #0f2a19 40%, #112e1c 60%, #0f2a19 80%, #0a2213 100%)',
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)',
        }}
      >
        <PitchSVG />
      </div>

      {/* Chemistry links layer */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ zIndex: 2 }}>
        <ChemistryLinks
          links={state.chemistryLinks}
          formation={formation}
          pitchWidth={PITCH_W}
          pitchHeight={PITCH_H}
        />
      </div>

      {/* Player cards */}
      <div className="absolute inset-0" style={{ zIndex: 3 }}>
        {formation.slots.map((slot) => {
          const playerId = state.lineup[slot.id];
          const player = playerId ? getPlayerById(playerId) : null;
          const score = playerId ? state.scores[playerId] : null;

          const x = (slot.x / 100) * PITCH_W;
          const y = (slot.y / 100) * PITCH_H;

          const dropHandlers = {
            onDragOver: (e: React.DragEvent) => {
              if (e.dataTransfer.types.includes('text/player-id')) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                (e.currentTarget as HTMLDivElement).classList.add('drop-target-active');
              }
            },
            onDragLeave: (e: React.DragEvent) => {
              (e.currentTarget as HTMLDivElement).classList.remove('drop-target-active');
            },
            onDrop: (e: React.DragEvent) => {
              e.preventDefault();
              (e.currentTarget as HTMLDivElement).classList.remove('drop-target-active');
              const droppedId = e.dataTransfer.getData('text/player-id');
              if (droppedId) assignPlayerToSlot(slot.id, droppedId);
            },
          };

          if (player && score) {
            return (
              <div
                key={slot.id}
                className="absolute"
                style={{ left: x - 36, top: y - 40 }}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/player-id', player.id);
                  e.dataTransfer.effectAllowed = 'move';
                  (e.currentTarget as HTMLDivElement).classList.add('dragging');
                }}
                onDragEnd={(e) => {
                  (e.currentTarget as HTMLDivElement).classList.remove('dragging');
                }}
                {...dropHandlers}
              >
                <PitchPlayerCard
                  player={player}
                  score={score}
                  slotLabel={slot.label}
                  isSelected={state.selectedPlayerId === playerId}
                  onClick={() => handleSlotClick(slot.id)}
                />
              </div>
            );
          }

          // Empty slot
          return (
            <div
              key={slot.id}
              className={`absolute flex flex-col items-center justify-center cursor-pointer transition-all duration-150 ${
                state.selectedSlotId === slot.id
                  ? 'scale-110'
                  : 'hover:scale-105'
              }`}
              style={{ left: x - 28, top: y - 28, width: 56, height: 56 }}
              onClick={() => handleSlotClick(slot.id)}
              {...dropHandlers}
            >
              <div
                className={`w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-150 ${
                  state.selectedSlotId === slot.id
                    ? 'border-accent bg-accent/15'
                    : 'border-surface-5 bg-surface-1/40 hover:border-border-bright hover:bg-surface-2/50'
                }`}
              >
                <span className="text-[9px] font-bold uppercase" style={{ color: 'rgba(230,240,255,0.75)' }}>{slot.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pitch overlay gradient at edges */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(4,6,15,0.4) 100%)',
          zIndex: 4,
        }}
      />
    </div>
  );
}

function PitchSVG() {
  const lc = 'rgba(255,255,255,0.28)';
  const lw = 1;

  return (
    <svg
      width={PITCH_W}
      height={PITCH_H}
      viewBox={`0 0 ${PITCH_W} ${PITCH_H}`}
      className="absolute inset-0"
    >
      {/* Pitch stripes */}
      {Array.from({ length: 8 }).map((_, i) => (
        <rect
          key={i}
          x={0}
          y={(i * PITCH_H) / 8}
          width={PITCH_W}
          height={PITCH_H / 8}
          fill={i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent'}
        />
      ))}

      {/* Outer boundary */}
      <rect x={16} y={12} width={PITCH_W - 32} height={PITCH_H - 24} fill="none" stroke={lc} strokeWidth={lw} />

      {/* Halfway line */}
      <line x1={16} y1={PITCH_H / 2} x2={PITCH_W - 16} y2={PITCH_H / 2} stroke={lc} strokeWidth={lw} />

      {/* Centre circle */}
      <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r={56} fill="none" stroke={lc} strokeWidth={lw} />
      <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r={3} fill={lc} />

      {/* Top penalty box */}
      <rect
        x={PITCH_W / 2 - 96}
        y={12}
        width={192}
        height={90}
        fill="none"
        stroke={lc}
        strokeWidth={lw}
      />
      {/* Top goal box */}
      <rect
        x={PITCH_W / 2 - 52}
        y={12}
        width={104}
        height={36}
        fill="none"
        stroke={lc}
        strokeWidth={lw}
      />
      {/* Top goal */}
      <rect
        x={PITCH_W / 2 - 28}
        y={4}
        width={56}
        height={12}
        fill="none"
        stroke={lc}
        strokeWidth={lw}
      />
      {/* Top penalty spot */}
      <circle cx={PITCH_W / 2} cy={80} r={2} fill={lc} />
      {/* Top penalty arc */}
      <path
        d={`M ${PITCH_W / 2 - 44} 102 A 52 52 0 0 0 ${PITCH_W / 2 + 44} 102`}
        fill="none"
        stroke={lc}
        strokeWidth={lw}
      />

      {/* Bottom penalty box */}
      <rect
        x={PITCH_W / 2 - 96}
        y={PITCH_H - 102}
        width={192}
        height={90}
        fill="none"
        stroke={lc}
        strokeWidth={lw}
      />
      {/* Bottom goal box */}
      <rect
        x={PITCH_W / 2 - 52}
        y={PITCH_H - 48}
        width={104}
        height={36}
        fill="none"
        stroke={lc}
        strokeWidth={lw}
      />
      {/* Bottom goal */}
      <rect
        x={PITCH_W / 2 - 28}
        y={PITCH_H - 16}
        width={56}
        height={12}
        fill="none"
        stroke={lc}
        strokeWidth={lw}
      />
      {/* Bottom penalty spot */}
      <circle cx={PITCH_W / 2} cy={PITCH_H - 80} r={2} fill={lc} />
      {/* Bottom penalty arc */}
      <path
        d={`M ${PITCH_W / 2 - 44} ${PITCH_H - 102} A 52 52 0 0 1 ${PITCH_W / 2 + 44} ${PITCH_H - 102}`}
        fill="none"
        stroke={lc}
        strokeWidth={lw}
      />

      {/* Corner arcs */}
      <path d="M 16 28 A 12 12 0 0 1 28 12" fill="none" stroke={lc} strokeWidth={lw} />
      <path d={`M ${PITCH_W - 16} 28 A 12 12 0 0 0 ${PITCH_W - 28} 12`} fill="none" stroke={lc} strokeWidth={lw} />
      <path d={`M 16 ${PITCH_H - 28} A 12 12 0 0 0 28 ${PITCH_H - 12}`} fill="none" stroke={lc} strokeWidth={lw} />
      <path d={`M ${PITCH_W - 16} ${PITCH_H - 28} A 12 12 0 0 1 ${PITCH_W - 28} ${PITCH_H - 12}`} fill="none" stroke={lc} strokeWidth={lw} />
    </svg>
  );
}
