import type { Player } from '@/types';

/**
 * Helpers that derive display-ready values from a Player. Salary and contract
 * month are synthesised when not present so the position-tables can always
 * render something sensible.
 */

const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

function seedFromId(id: string): number {
  let s = 0;
  for (let i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) >>> 0;
  return s;
}

/**
 * Annual salary in €. Capped at 400 000 per the user's spec. Generated from
 * baseRating bands with a deterministic ±30% variation derived from the
 * player id, so the values are stable across renders.
 */
export function getSalaryAnnual(player: Player): number {
  if (player.salaryAnnual != null) return player.salaryAnnual;

  const r = player.baseRating;
  const tier =
    r >= 80 ? 280_000 :
    r >= 76 ? 180_000 :
    r >= 73 ? 110_000 :
    r >= 70 ? 65_000 :
              35_000;

  const variation = ((seedFromId(player.id) % 60) - 30) / 100; // -0.30 .. +0.30
  const raw = tier * (1 + variation);
  // round to nearest €1k and cap at 400k
  return Math.min(400_000, Math.round(raw / 1000) * 1000);
}

/** "€280k", "€55k". */
export function formatSalary(annual: number): string {
  if (annual >= 1_000_000) return `€${(annual / 1_000_000).toFixed(1)}M`;
  return `€${Math.round(annual / 1000)}k`;
}

export function getContractEndMonth(player: Player): number {
  return player.contractEndMonth ?? 6;
}

/** "06.2027" */
export function formatContractEnd(player: Player): string {
  const m = MONTHS[Math.max(0, Math.min(11, getContractEndMonth(player) - 1))];
  return `${m}.${player.contractEnds}`;
}

/** Short display name: "N.Iosifov" — first letter of first name + dot + last name. */
export function shortName(player: Player): string {
  const first = player.firstName?.[0] ?? '?';
  return `${first}.${player.lastName}`;
}
