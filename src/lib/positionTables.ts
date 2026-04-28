import type { Formation, Player, Position, ScoreBreakdown } from '@/types';

/**
 * Distribution that powers the on-pitch position tables.
 *
 * Rule from the user: each player appears in exactly ONE slot's table — the
 * slot they would substitute into. Starters keep their assigned slot; every
 * non-starter is allocated to the best-fitting slot, with ties broken by
 * load-balancing so backups are spread instead of piling on one slot.
 */

const SLOT_GROUP: Record<Position, Position[]> = {
  GK: ['GK'],
  CB: ['CB'],
  LB: ['LB', 'LWB'],
  RB: ['RB', 'RWB'],
  LWB: ['LWB', 'LB'],
  RWB: ['RWB', 'RB'],
  CDM: ['CDM', 'CM'],
  CM: ['CM', 'CDM', 'CAM'],
  CAM: ['CAM', 'CM'],
  LM: ['LM', 'LW'],
  RM: ['RM', 'RW'],
  LW: ['LW', 'LM', 'CAM'],
  RW: ['RW', 'RM', 'CAM'],
  CF: ['CF', 'ST'],
  ST: ['ST', 'CF', 'CAM'],
};

function fitScore(player: Player, slotRole: Position): number {
  const group = SLOT_GROUP[slotRole] ?? [slotRole];
  if (player.primaryPosition === slotRole) return 100;
  if (player.secondaryPositions.includes(slotRole)) return 60;
  if (group.includes(player.primaryPosition)) return 35;
  if (player.secondaryPositions.some((sp) => group.includes(sp))) return 20;
  return 0;
}

export interface PositionTableEntry {
  starter: Player | null;
  alternates: Player[];
  /** Convenience: starter + alternates, in display order. */
  ordered: Player[];
}

/**
 * Build the per-slot tables for the current formation/lineup.
 *
 * Algorithm:
 *  1. Each starter is anchored to their slot.
 *  2. Manual pins (`playerSlotPins.ts`) place specific non-starters into
 *     specific slots — bypassing the rating fallback. Pins targeting a
 *     missing slot or a player who's already a starter are silently
 *     skipped.
 *  3. Remaining non-starters are sorted by descending base rating so the
 *     strongest candidates pick their slot first.
 *  4. For each unpinned player we score every slot and pick the highest.
 *     Score is `fitScore - 4 × (current_backups)` so that, when two slots
 *     fit equally well, the less-loaded one wins.
 *  5. Within each table, alternates are sorted by displayed rating
 *     (computed total, falling back to baseRating).
 */
export function buildPositionTables(
  formation: Formation,
  lineup: Record<string, string | null>,
  allPlayers: Player[],
  scores: Record<string, ScoreBreakdown>,
  pins: Record<string, string> = {}
): Record<string, PositionTableEntry> {
  const tables: Record<string, PositionTableEntry> = {};
  const starterIds = new Set<string>();

  // 1) Anchor starters
  for (const slot of formation.slots) {
    const starterId = lineup[slot.id];
    const starter = starterId ? allPlayers.find((p) => p.id === starterId) ?? null : null;
    if (starter) starterIds.add(starter.id);
    tables[slot.id] = { starter, alternates: [], ordered: starter ? [starter] : [] };
  }

  // 2) Honour manual pins
  const slotIds = new Set(formation.slots.map((s) => s.id));
  const pinned = new Set<string>();
  for (const [playerId, slotId] of Object.entries(pins)) {
    if (!slotIds.has(slotId)) continue;
    if (starterIds.has(playerId)) continue;
    const player = allPlayers.find((p) => p.id === playerId);
    if (!player) continue;
    tables[slotId].alternates.push(player);
    pinned.add(playerId);
  }

  // 3) Allocate everyone else — strongest first
  const nonStarters = allPlayers
    .filter((p) => !starterIds.has(p.id) && !pinned.has(p.id))
    .sort((a, b) => b.baseRating - a.baseRating);

  for (const p of nonStarters) {
    let bestSlotId = formation.slots[0].id;
    let bestScore = -Infinity;
    for (const slot of formation.slots) {
      const fit = fitScore(p, slot.role);
      if (fit === 0) continue;
      const load = tables[slot.id].alternates.length;
      const score = fit - load * 4;
      if (score > bestScore) {
        bestScore = score;
        bestSlotId = slot.id;
      }
    }
    // No slot at all matched — fall back to the least-loaded slot so the
    // player still surfaces somewhere instead of vanishing.
    if (bestScore === -Infinity) {
      let leastLoad = Infinity;
      for (const slot of formation.slots) {
        const load = tables[slot.id].alternates.length;
        if (load < leastLoad) {
          leastLoad = load;
          bestSlotId = slot.id;
        }
      }
    }
    tables[bestSlotId].alternates.push(p);
  }

  // 4) Sort alternates inside each slot by displayed rating, descending
  for (const slot of formation.slots) {
    const entry = tables[slot.id];
    entry.alternates.sort((a, b) => {
      const ra = scores[a.id]?.total ?? a.baseRating;
      const rb = scores[b.id]?.total ?? b.baseRating;
      return rb - ra;
    });
    entry.ordered = entry.starter ? [entry.starter, ...entry.alternates] : entry.alternates;
  }

  return tables;
}
