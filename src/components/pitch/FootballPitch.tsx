'use client';

import { useMemo } from 'react';
import { useSquad } from '@/context/SquadContext';
import { useT } from '@/context/I18nContext';
import { usePitchView } from '@/context/PitchViewContext';
import { PLAYERS } from '@/data/players';
import { useRecruits } from '@/data/recruitsStore';
import { FORMATIONS } from '@/data/formations';
import { PLAYER_SLOT_PINS } from '@/data/playerSlotPins';
import { PositionTable } from './PositionTable';
import { PitchTokens } from './PitchTokens';
import { buildPositionTables } from '@/lib/positionTables';
import type { Player } from '@/types';

export function FootballPitch() {
  const {
    state,
    selectPlayer,
    selectSlot,
    assignPlayerToSlot,
  } = useSquad();
  const recruits = useRecruits();
  const t = useT();
  const { view, setView } = usePitchView();
  const formation = FORMATIONS.find((f) => f.id === state.formation);

  const allPlayers = useMemo<Player[]>(() => {
    const seen = new Set<string>();
    const out: Player[] = [];
    for (const p of PLAYERS) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        out.push(p);
      }
    }
    for (const p of recruits) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        out.push(p);
      }
    }
    return out;
  }, [recruits]);

  const tables = useMemo(
    () =>
      formation
        ? buildPositionTables(
            formation,
            state.lineup,
            allPlayers,
            state.scores,
            PLAYER_SLOT_PINS[formation.id] ?? {}
          )
        : null,
    [formation, state.lineup, state.scores, allPlayers]
  );

  if (!formation || !tables) return null;

  const onSlotHeadClick = (slotId: string) => {
    const toggleOff = slotId === state.selectedSlotId;
    selectSlot(toggleOff ? null : slotId);
    selectPlayer(null);
  };

  const onPickRow = (id: string) => {
    selectPlayer(id);
    selectSlot(null);
  };

  return (
    <div className="pitch-wrap">
      <div className="pitch-bar">
        <div className="left">
          <div
            style={{
              fontSize: 10,
              color: 'var(--ink-3)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {formation.displayName}
            {' · '}
            {t(`style.${state.tacticalSettings.playingStyle}`)}
          </div>
        </div>
        <div className="right">
          <div className="view-toggle" role="group" aria-label={t('pitch.view.label')}>
            <span className="label">{t('pitch.view.label')}</span>
            <button
              type="button"
              className={view === 'tables' ? 'on' : ''}
              onClick={() => setView('tables')}
              aria-pressed={view === 'tables'}
            >
              {t('pitch.view.tables')}
            </button>
            <button
              type="button"
              className={view === 'tokens' ? 'on' : ''}
              onClick={() => setView('tokens')}
              aria-pressed={view === 'tokens'}
            >
              {t('pitch.view.tokens')}
            </button>
          </div>
        </div>
      </div>

      <div className="pitch-stage">
        <div className="pitch">
          <div className="box-top" />
          <div className="box-top small" />
          <div className="box-bottom" />
          <div className="box-bottom small" />
          <div className="center-dot" />
          <div className="pen-dot-top" />
          <div className="pen-dot-bottom" />

          {view === 'tables' ? (
            formation.slots.map((slot) => {
              const entry = tables[slot.id];
              const trimmed = entry.ordered.slice(0, 6);
              return (
                <PositionTable
                  key={slot.id}
                  slot={slot}
                  candidates={trimmed}
                  starterId={entry.starter?.id ?? null}
                  selectedPlayerId={state.selectedPlayerId}
                  selectedSlotId={state.selectedSlotId}
                  scores={state.scores}
                  onPickRow={onPickRow}
                  onAssignToSlot={(id) => assignPlayerToSlot(slot.id, id)}
                  onSlotHeadClick={() => onSlotHeadClick(slot.id)}
                />
              );
            })
          ) : (
            <PitchTokens />
          )}
        </div>
      </div>
    </div>
  );
}
