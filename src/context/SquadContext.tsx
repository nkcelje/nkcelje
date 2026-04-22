'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
} from 'react';
import type {
  SquadState,
  FormationName,
  TacticalSettings,
} from '@/types';
import { getPlayerById } from '@/data/players';
import { getFormationById } from '@/data/formations';
import {
  recomputeFromScratch,
  recomputeScoresOnly,
  recomputeIncremental,
} from '@/lib/squadCompute';

// ─── Default Tactical Settings ────────────────────────────────────────────────

const DEFAULT_TACTICS: TacticalSettings = {
  formation: '4-3-3',
  pressingIntensity: 7,
  defensiveLineHeight: 6,
  possessionFocus: 6,
  width: 6,
  directness: 4,
  attackingMentality: 6,
  counterPress: true,
  highLine: false,
  gameState: 'drawing',
  opponentStyle: 'balanced',
  playingStyle: 'balanced',
};

// ─── Default Lineup ───────────────────────────────────────────────────────────

// 4-3-3 starting XI (single pivot)
const DEFAULT_LINEUP: Record<string, string | null> = {
  gk: 'leban',
  lb: 'vukasovic',
  'cb-l': 'castro',
  'cb-r': 'bejger',
  rb: 'karnicnik',
  cdm: 'kvesic',
  'cm-l': 'zabukovnik',
  'cm-r': 'seslar',
  lw: 'iosifov',
  st: 'kucys',
  rw: 'avdyli',
};

const DEFAULT_BENCH = ['sluga', 'tutyskinas', 'vuklisevic', 'nieto', 'hrka', 'poplatnik', 'kotnik', 'pozeg-vancas', 'pranjic'];

// ─── State Computation ────────────────────────────────────────────────────────

function buildInitialState(): SquadState {
  const computed = recomputeFromScratch(DEFAULT_LINEUP, DEFAULT_BENCH, DEFAULT_TACTICS);
  return {
    formation: '4-3-3',
    lineup: DEFAULT_LINEUP,
    bench: DEFAULT_BENCH,
    tacticalSettings: DEFAULT_TACTICS,
    selectedSlotId: null,
    selectedPlayerId: null,
    ...computed,
  };
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_FORMATION'; formation: FormationName }
  | { type: 'SET_TACTICS'; tactics: Partial<TacticalSettings> }
  | { type: 'SELECT_PLAYER'; playerId: string | null }
  | { type: 'SELECT_SLOT'; slotId: string | null }
  | { type: 'ASSIGN_PLAYER_TO_SLOT'; slotId: string; playerId: string }
  | { type: 'SWAP_WITH_BENCH'; lineupPlayerId: string; benchPlayerId: string }
  | { type: 'REMOVE_FROM_LINEUP'; slotId: string }
  | { type: 'ADD_TO_BENCH'; playerId: string };

function reducer(state: SquadState, action: Action): SquadState {
  switch (action.type) {
    case 'SET_FORMATION': {
      const newFormation = getFormationById(action.formation);
      if (!newFormation) return state;

      // Try to carry over existing players to new formation slots
      const newLineup: Record<string, string | null> = {};
      const oldPlayerIds = Object.values(state.lineup).filter(Boolean) as string[];
      const assignedIds = new Set<string>();

      for (const slot of newFormation.slots) {
        // Find a player from old lineup that fits this slot
        const match = oldPlayerIds.find((pid) => {
          if (assignedIds.has(pid)) return false;
          const p = getPlayerById(pid);
          return (
            p &&
            (p.primaryPosition === slot.role || p.secondaryPositions.includes(slot.role))
          );
        });
        newLineup[slot.id] = match ?? null;
        if (match) assignedIds.add(match);
      }

      const newTactics = { ...state.tacticalSettings, formation: action.formation };
      const computed = recomputeFromScratch(newLineup, state.bench, newTactics);

      return {
        ...state,
        formation: action.formation,
        lineup: newLineup,
        tacticalSettings: newTactics,
        selectedSlotId: null,
        selectedPlayerId: null,
        ...computed,
      };
    }

    case 'SET_TACTICS': {
      const newTactics = { ...state.tacticalSettings, ...action.tactics };
      // Chemistry links don't depend on tactics — reuse them.
      const computed = recomputeScoresOnly(state, state.lineup, state.bench, newTactics);
      return { ...state, tacticalSettings: newTactics, ...computed };
    }

    case 'SELECT_PLAYER':
      return { ...state, selectedPlayerId: action.playerId, selectedSlotId: null };

    case 'SELECT_SLOT':
      return { ...state, selectedSlotId: action.slotId, selectedPlayerId: null };

    case 'ASSIGN_PLAYER_TO_SLOT': {
      const { slotId, playerId } = action;
      const prevPlayerId = state.lineup[slotId];

      let newLineup = { ...state.lineup, [slotId]: playerId };
      let newBench = [...state.bench];

      // If the player was on bench, remove from bench
      if (newBench.includes(playerId)) {
        newBench = newBench.filter((id) => id !== playerId);
        // Move displaced player to bench
        if (prevPlayerId) newBench.push(prevPlayerId);
      } else {
        // Was in another slot — swap
        const prevSlot = Object.entries(state.lineup).find(([, pid]) => pid === playerId)?.[0];
        if (prevSlot) {
          newLineup = { ...newLineup, [prevSlot]: prevPlayerId ?? null };
        }
      }

      const computed = recomputeIncremental(
        state,
        state.lineup,
        state.bench,
        newLineup,
        newBench,
        state.tacticalSettings
      );
      return {
        ...state,
        lineup: newLineup,
        bench: newBench,
        selectedSlotId: null,
        selectedPlayerId: null,
        ...computed,
      };
    }

    case 'SWAP_WITH_BENCH': {
      const { lineupPlayerId, benchPlayerId } = action;
      const slotId = Object.entries(state.lineup).find(([, pid]) => pid === lineupPlayerId)?.[0];
      if (!slotId) return state;

      const newLineup = { ...state.lineup, [slotId]: benchPlayerId };
      const newBench = state.bench.map((id) => (id === benchPlayerId ? lineupPlayerId : id));

      const computed = recomputeIncremental(
        state,
        state.lineup,
        state.bench,
        newLineup,
        newBench,
        state.tacticalSettings
      );
      return { ...state, lineup: newLineup, bench: newBench, ...computed };
    }

    case 'ADD_TO_BENCH': {
      const { playerId } = action;
      // Already in lineup or bench? ignore
      if (state.bench.includes(playerId)) return state;
      if (Object.values(state.lineup).includes(playerId)) return state;
      const newBench = [...state.bench, playerId];
      const computed = recomputeIncremental(
        state,
        state.lineup,
        state.bench,
        state.lineup,
        newBench,
        state.tacticalSettings
      );
      return { ...state, bench: newBench, ...computed };
    }

    case 'REMOVE_FROM_LINEUP': {
      const removed = state.lineup[action.slotId];
      const newLineup = { ...state.lineup, [action.slotId]: null };
      const newBench = removed ? [...state.bench, removed] : state.bench;

      const computed = recomputeIncremental(
        state,
        state.lineup,
        state.bench,
        newLineup,
        newBench,
        state.tacticalSettings
      );
      return { ...state, lineup: newLineup, bench: newBench, ...computed };
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface SquadContextValue {
  state: SquadState;
  setFormation: (f: FormationName) => void;
  setTactics: (t: Partial<TacticalSettings>) => void;
  selectPlayer: (id: string | null) => void;
  selectSlot: (id: string | null) => void;
  assignPlayerToSlot: (slotId: string, playerId: string) => void;
  swapWithBench: (lineupPlayerId: string, benchPlayerId: string) => void;
  removeFromLineup: (slotId: string) => void;
  addToBench: (playerId: string) => void;
}

const SquadContext = createContext<SquadContextValue | null>(null);

export function SquadProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);

  const setFormation = useCallback((f: FormationName) => dispatch({ type: 'SET_FORMATION', formation: f }), []);
  const setTactics = useCallback((t: Partial<TacticalSettings>) => dispatch({ type: 'SET_TACTICS', tactics: t }), []);
  const selectPlayer = useCallback((id: string | null) => dispatch({ type: 'SELECT_PLAYER', playerId: id }), []);
  const selectSlot = useCallback((id: string | null) => dispatch({ type: 'SELECT_SLOT', slotId: id }), []);
  const assignPlayerToSlot = useCallback((slotId: string, playerId: string) =>
    dispatch({ type: 'ASSIGN_PLAYER_TO_SLOT', slotId, playerId }), []);
  const swapWithBench = useCallback((lineupPlayerId: string, benchPlayerId: string) =>
    dispatch({ type: 'SWAP_WITH_BENCH', lineupPlayerId, benchPlayerId }), []);
  const removeFromLineup = useCallback((slotId: string) =>
    dispatch({ type: 'REMOVE_FROM_LINEUP', slotId }), []);
  const addToBench = useCallback((playerId: string) =>
    dispatch({ type: 'ADD_TO_BENCH', playerId }), []);

  const value = useMemo(
    () => ({ state, setFormation, setTactics, selectPlayer, selectSlot, assignPlayerToSlot, swapWithBench, removeFromLineup, addToBench }),
    [state, setFormation, setTactics, selectPlayer, selectSlot, assignPlayerToSlot, swapWithBench, removeFromLineup, addToBench]
  );

  return <SquadContext.Provider value={value}>{children}</SquadContext.Provider>;
}

export function useSquad() {
  const ctx = useContext(SquadContext);
  if (!ctx) throw new Error('useSquad must be used within SquadProvider');
  return ctx;
}
