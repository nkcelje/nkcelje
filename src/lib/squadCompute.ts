import type {
  ChemistryLink,
  Formation,
  FormationSlot,
  Player,
  ScoreBreakdown,
  TacticalSettings,
} from '@/types';
import { PLAYERS } from '@/data/players';
import { getRecruits } from '@/data/recruitsStore';
import { getFormationById } from '@/data/formations';
import {
  calculatePlayerScore,
  calculateTeamScore,
  calculateChemistryScore,
  calculateTacticalFitScore,
} from '@/lib/scoring';
import { buildChemistryLinks, buildChemistryLinksForSlots } from '@/lib/chemistry';

export interface ComputedState {
  scores: Record<string, ScoreBreakdown>;
  chemistryLinks: ChemistryLink[];
  teamScore: number;
  chemistryScore: number;
  tacticalFitScore: number;
}

const PLAYERS_MAP: Record<string, Player> = Object.fromEntries(
  PLAYERS.map((p) => [p.id, p])
);

const EMPTY: ComputedState = {
  scores: {},
  chemistryLinks: [],
  teamScore: 0,
  chemistryScore: 50,
  tacticalFitScore: 50,
};

/**
 * Build the Player lookup pool for one compute call. The base roster is static
 * (PLAYERS_MAP), but recruits added from the Shortlist can also end up in the
 * lineup or on the bench — so we layer them on top each time. Called once per
 * entry point; inner helpers receive this map as `pool` instead of touching
 * the module-level PLAYERS_MAP directly.
 */
function buildPool(): Record<string, Player> {
  const pool: Record<string, Player> = { ...PLAYERS_MAP };
  for (const r of getRecruits()) pool[r.id] = r;
  return pool;
}

function aggregates(scores: Record<string, ScoreBreakdown>): Pick<
  ComputedState,
  'teamScore' | 'chemistryScore' | 'tacticalFitScore'
> {
  return {
    teamScore: calculateTeamScore(scores),
    chemistryScore: calculateChemistryScore(scores),
    tacticalFitScore: calculateTacticalFitScore(scores),
  };
}

function scoreLineupSlot(
  slot: FormationSlot,
  lineup: Record<string, string | null>,
  tactics: TacticalSettings,
  pool: Record<string, Player>
): ScoreBreakdown | null {
  const playerId = lineup[slot.id];
  if (!playerId) return null;
  const player = pool[playerId];
  if (!player) return null;

  const adjPlayers = slot.adjacentSlots
    .map((adjId) => {
      const adjPlayerId = lineup[adjId];
      return adjPlayerId ? pool[adjPlayerId] ?? null : null;
    })
    .filter(Boolean) as Player[];

  return calculatePlayerScore(player, slot, adjPlayers, tactics, false);
}

function scoreBenchPlayer(
  playerId: string,
  formation: Formation,
  tactics: TacticalSettings,
  pool: Record<string, Player>
): ScoreBreakdown | null {
  const player = pool[playerId];
  if (!player) return null;
  const bestSlot =
    formation.slots.find((s) => s.role === player.primaryPosition) ??
    formation.slots.find((s) => player.secondaryPositions.includes(s.role)) ??
    formation.slots[0];
  return calculatePlayerScore(player, bestSlot, [], tactics, true);
}

// ─── Full rebuild ─────────────────────────────────────────────────────────────

export function recomputeFromScratch(
  lineup: Record<string, string | null>,
  bench: string[],
  tactics: TacticalSettings
): ComputedState {
  const formation = getFormationById(tactics.formation);
  if (!formation) return EMPTY;

  const pool = buildPool();
  const chemistryLinks = buildChemistryLinks(formation, lineup, pool);
  const scores: Record<string, ScoreBreakdown> = {};

  for (const slot of formation.slots) {
    const s = scoreLineupSlot(slot, lineup, tactics, pool);
    if (s) scores[s.playerId] = s;
  }

  for (const benchId of bench) {
    const s = scoreBenchPlayer(benchId, formation, tactics, pool);
    if (s) scores[s.playerId] = s;
  }

  return { scores, chemistryLinks, ...aggregates(scores) };
}

// ─── Tactics-only recompute (chemistry links unchanged) ───────────────────────

export function recomputeScoresOnly(
  prev: ComputedState,
  lineup: Record<string, string | null>,
  bench: string[],
  tactics: TacticalSettings
): ComputedState {
  const formation = getFormationById(tactics.formation);
  if (!formation) return EMPTY;

  const pool = buildPool();
  const scores: Record<string, ScoreBreakdown> = {};

  for (const slot of formation.slots) {
    const s = scoreLineupSlot(slot, lineup, tactics, pool);
    if (s) scores[s.playerId] = s;
  }

  for (const benchId of bench) {
    const s = scoreBenchPlayer(benchId, formation, tactics, pool);
    if (s) scores[s.playerId] = s;
  }

  return {
    scores,
    chemistryLinks: prev.chemistryLinks,
    ...aggregates(scores),
  };
}

// ─── Incremental recompute for a single lineup/bench mutation ─────────────────

export function recomputeIncremental(
  prev: ComputedState,
  prevLineup: Record<string, string | null>,
  prevBench: readonly string[],
  lineup: Record<string, string | null>,
  bench: readonly string[],
  tactics: TacticalSettings
): ComputedState {
  const formation = getFormationById(tactics.formation);
  if (!formation) return EMPTY;

  const pool = buildPool();

  // Dirty slots: slots whose occupancy changed.
  const dirtySlots = new Set<string>();
  for (const slot of formation.slots) {
    if (prevLineup[slot.id] !== lineup[slot.id]) dirtySlots.add(slot.id);
  }

  // Affected slots: dirty ∪ their neighbours (chemistry modifier depends on neighbours).
  const affectedSlots = new Set<string>(dirtySlots);
  const slotsById = new Map(formation.slots.map((s) => [s.id, s]));
  dirtySlots.forEach((dirtyId) => {
    const slot = slotsById.get(dirtyId);
    if (!slot) return;
    for (const adj of slot.adjacentSlots) affectedSlots.add(adj);
  });

  // Start from previous scores and drop everything that might change.
  const scores: Record<string, ScoreBreakdown> = { ...prev.scores };

  affectedSlots.forEach((slotId) => {
    const prevPid = prevLineup[slotId];
    if (prevPid) delete scores[prevPid];
    const nowPid = lineup[slotId];
    if (nowPid) delete scores[nowPid];
  });

  const benchSet = new Set(bench);
  for (const bid of prevBench) {
    if (!benchSet.has(bid)) delete scores[bid];
  }

  affectedSlots.forEach((slotId) => {
    const slot = slotsById.get(slotId);
    if (!slot) return;
    const s = scoreLineupSlot(slot, lineup, tactics, pool);
    if (s) scores[s.playerId] = s;
  });

  const prevBenchSet = new Set(prevBench);
  for (const bid of bench) {
    if (!prevBenchSet.has(bid)) {
      const s = scoreBenchPlayer(bid, formation, tactics, pool);
      if (s) scores[s.playerId] = s;
    }
  }

  // Chemistry: drop every link touching a dirty slot, rebuild just those pairs.
  const retainedLinks: ChemistryLink[] = [];
  for (const link of prev.chemistryLinks) {
    if (dirtySlots.has(link.slotId1) || dirtySlots.has(link.slotId2)) continue;
    retainedLinks.push(link);
  }
  const rebuiltLinks = buildChemistryLinksForSlots(
    Array.from(dirtySlots),
    formation,
    lineup,
    pool
  );
  const chemistryLinks = retainedLinks.concat(rebuiltLinks);

  return { scores, chemistryLinks, ...aggregates(scores) };
}
