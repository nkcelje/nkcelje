import type { FormationName } from '@/types';

/**
 * Manual `playerId → slotId` overrides applied on top of the position-table
 * auto-distribution. Pins are honoured BEFORE the rating-based fallback —
 * so when two players fit the same slot equally well, the user can force
 * the side they should appear on.
 *
 * Notes:
 *  - Starters (`state.lineup[slot.id]`) always win over a pin: a pinned
 *    player who is currently the starter at a different slot stays where
 *    the lineup says they are.
 *  - A pin pointing at a slot that doesn't exist in the active formation
 *    is silently ignored, so we can keep this map opinionated about 4-3-3
 *    without breaking the other layouts.
 */
export const PLAYER_SLOT_PINS: Record<FormationName, Record<string, string>> = {
  '4-3-3': {
    // Centre-backs: per the recruitment screenshot, Hrka pairs with the
    // left CB and Vodeb sits on the right.
    hrka: 'cb-l',
    vodeb: 'cb-r',
    // Centre-mids: Čalušić to the left of Kvesić, Vidović next to Sešlar.
    calusic: 'cm-l',
    vidovic: 'cm-r',
  },
  '4-4-2': {},
  '4-2-3-1': {},
  '3-5-2': {},
};
