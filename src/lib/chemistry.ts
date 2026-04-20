import type { ChemistryLink, Formation, Player } from '@/types';

export function buildChemistryLinks(
  formation: Formation,
  lineup: Record<string, string | null>,
  players: Record<string, Player>
): ChemistryLink[] {
  const links: ChemistryLink[] = [];
  const seen = new Set<string>();

  for (const slot of formation.slots) {
    const playerId = lineup[slot.id];
    if (!playerId) continue;
    const player = players[playerId];
    if (!player) continue;

    for (const adjSlotId of slot.adjacentSlots) {
      const pairKey = [slot.id, adjSlotId].sort().join('--');
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);

      const adjPlayerId = lineup[adjSlotId];
      if (!adjPlayerId) continue;
      const adjPlayer = players[adjPlayerId];
      if (!adjPlayer) continue;

      const link = evaluateChemistryLink(slot.id, adjSlotId, player, adjPlayer, playerId, adjPlayerId);
      links.push(link);
    }
  }

  return links;
}

function evaluateChemistryLink(
  slotId1: string,
  slotId2: string,
  p1: Player,
  p2: Player,
  pid1: string,
  pid2: string
): ChemistryLink {
  let value = 0;
  const reasons: string[] = [];

  // Club connection
  if (p1.club === p2.club) {
    value += 2;
    reasons.push(`Club teammates (${p1.club})`);
  }

  // Nationality connection
  if (p1.nationality === p2.nationality) {
    value += 1;
    reasons.push(`Same nationality (${p1.nationality})`);
  }

  // Shared league
  if (p1.league === p2.league && p1.club !== p2.club) {
    value += 0.5;
    reasons.push(`Same league (${p1.league})`);
  }

  // Shared style tags
  const sharedTags = p1.styleTags.filter((t) => p2.styleTags.includes(t));
  if (sharedTags.length >= 3) {
    value += 2;
    reasons.push(`Strong style match (${sharedTags.slice(0, 2).join(', ')})`);
  } else if (sharedTags.length >= 1) {
    value += 1;
    reasons.push(`Compatible styles (${sharedTags[0]})`);
  }

  // Style clash — technical vs purely physical direct
  const p1Technical = p1.styleTags.includes('Technical');
  const p2DirectPhysical =
    p2.styleTags.includes('Physical') &&
    !p2.styleTags.includes('Technical') &&
    p2.styleTags.includes('Aerial');

  if (p1Technical && p2DirectPhysical) {
    value -= 1;
    reasons.push('Contrasting styles (technical vs direct/aerial)');
  }

  // Complementary roles
  const p1Roles = p1.preferredRoles;
  const p2Roles = p2.preferredRoles;
  const complementaryPairs: Array<[string, string]> = [
    ['Anchor', 'Box-to-Box'],
    ['Deep-Lying Playmaker', 'Box-to-Box'],
    ['Deep-Lying Playmaker', 'Mezzala'],
    ['Target Man', 'Inside Forward'],
    ['Target Man', 'Poacher'],
    ['False 9', 'Advanced Playmaker'],
    ['Attacking Fullback', 'Inside Forward'],
    ['Attacking Fullback', 'Inverted Winger'],
    ['Sweeper Keeper', 'Ball-Playing CB'],
  ];

  for (const [roleA, roleB] of complementaryPairs) {
    const match =
      (p1Roles.includes(roleA as never) && p2Roles.includes(roleB as never)) ||
      (p1Roles.includes(roleB as never) && p2Roles.includes(roleA as never));
    if (match) {
      value += 1;
      reasons.push(`Complementary roles: ${roleA} + ${roleB}`);
      break;
    }
  }

  const clampedValue = Math.max(-2, Math.min(4, Math.round(value)));

  let strength: 'strong' | 'medium' | 'weak';
  if (clampedValue >= 3) strength = 'strong';
  else if (clampedValue >= 1) strength = 'medium';
  else strength = 'weak';

  return {
    slotId1,
    slotId2,
    playerId1: pid1,
    playerId2: pid2,
    strength,
    value: clampedValue,
    reasons: reasons.slice(0, 3),
  };
}

export function getChemistryColorClass(strength: 'strong' | 'medium' | 'weak'): string {
  switch (strength) {
    case 'strong': return '#10b981';
    case 'medium': return '#f59e0b';
    case 'weak': return '#ef4444';
  }
}

export function getPlayerChemistryScore(
  playerId: string,
  links: ChemistryLink[]
): number {
  const playerLinks = links.filter(
    (l) => l.playerId1 === playerId || l.playerId2 === playerId
  );
  if (playerLinks.length === 0) return 0;
  return playerLinks.reduce((acc, l) => acc + l.value, 0);
}
