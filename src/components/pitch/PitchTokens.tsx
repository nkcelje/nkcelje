'use client';

import type React from 'react';
import { useSquad } from '@/context/SquadContext';
import { getPlayerById } from '@/data/players';
import { useRecruits } from '@/data/recruitsStore';
import { FORMATIONS } from '@/data/formations';
import { getPassportTag } from '@/lib/passport';

/**
 * Legacy circular-token renderer for the pitch — disc with initials, OVR
 * badge, flag, last-name plate. Used when the view toggle is set to
 * "tokens"; the table renderer is the default.
 */
export function PitchTokens() {
  const { state, selectPlayer, selectSlot, assignPlayerToSlot } = useSquad();
  const recruits = useRecruits();
  const formation = FORMATIONS.find((f) => f.id === state.formation);
  if (!formation) return null;

  const handleSlotClick = (slotId: string) => {
    const playerId = state.lineup[slotId];
    if (playerId) {
      const toggleOff = playerId === state.selectedPlayerId;
      selectPlayer(toggleOff ? null : playerId);
      selectSlot(toggleOff ? null : slotId);
    } else {
      const toggleOff = slotId === state.selectedSlotId;
      selectSlot(toggleOff ? null : slotId);
      selectPlayer(null);
    }
  };

  return (
    <>
      {formation.slots.map((slot) => {
        const playerId = state.lineup[slot.id];
        const player = playerId
          ? (getPlayerById(playerId) ?? recruits.find((p) => p.id === playerId) ?? null)
          : null;

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

        if (!player) {
          return (
            <div
              key={slot.id}
              className={`token empty ${state.selectedSlotId === slot.id ? 'selected' : ''}`}
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
              onClick={() => handleSlotClick(slot.id)}
              {...dropHandlers}
            >
              <div className="disc">+</div>
              <div className="pos">{slot.label}</div>
            </div>
          );
        }

        const isSelected = state.selectedPlayerId === playerId;
        const passport = getPassportTag(player);
        const score = state.scores[player.id];
        const ovr = score?.total ?? player.baseRating;
        const initials = `${player.firstName[0]}${player.lastName[0]}`;

        return (
          <div
            key={slot.id}
            className={`token pp-${passport} ${isSelected ? 'selected' : ''} ${player.isCaptain ? 'captain' : ''}`}
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/player-id', player.id);
              e.dataTransfer.effectAllowed = 'move';
              (e.currentTarget as HTMLDivElement).classList.add('dragging');
            }}
            onDragEnd={(e) => {
              (e.currentTarget as HTMLDivElement).classList.remove('dragging');
            }}
            onClick={() => handleSlotClick(slot.id)}
            title="Click: select · Drag to swap"
            {...dropHandlers}
          >
            <div className="badge-ovr">{ovr}</div>
            <div className="flag-mini">{player.flag}</div>
            <div className="disc">{initials}</div>
            <div className="name">{player.lastName}</div>
            <div className="pos">{slot.label}</div>
          </div>
        );
      })}
    </>
  );
}
