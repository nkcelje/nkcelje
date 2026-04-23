import type {
  Player,
  Position,
  Role,
  FormationSlot,
  TacticalSettings,
  ScoreBreakdown,
  ScoreModifiers,
} from '@/types';

// ─── Position Familiarity ─────────────────────────────────────────────────────

const POSITION_GROUPS: Record<string, Position[]> = {
  GK: ['GK'],
  CB: ['CB', 'CDM'],
  FB: ['LB', 'RB', 'LWB', 'RWB', 'CB'],
  LWB: ['LWB', 'LB', 'LM', 'LW'],
  RWB: ['RWB', 'RB', 'RM', 'RW'],
  CDM: ['CDM', 'CM', 'CB'],
  CM: ['CM', 'CDM', 'CAM'],
  CAM: ['CAM', 'CM', 'CF', 'LW', 'RW'],
  LM: ['LM', 'LW', 'CM'],
  RM: ['RM', 'RW', 'CM'],
  LW: ['LW', 'LM', 'CAM', 'CF'],
  RW: ['RW', 'RM', 'CAM', 'CF'],
  CF: ['CF', 'ST', 'CAM', 'LW', 'RW'],
  ST: ['ST', 'CF'],
};

export function getPositionFamiliarityModifier(
  player: Player,
  slotRole: Position
): { value: number; label: string } {
  if (player.primaryPosition === slotRole) {
    return { value: 0, label: 'Natural position' };
  }
  if (player.secondaryPositions.includes(slotRole)) {
    return { value: -3, label: 'Secondary position' };
  }
  const naturalGroup = POSITION_GROUPS[player.primaryPosition] ?? [];
  if (naturalGroup.includes(slotRole)) {
    return { value: -6, label: 'Adjacent position' };
  }
  return { value: -14, label: 'Out of position' };
}

// ─── Base Score by Position ────────────────────────────────────────────────────

const POSITION_ATTRIBUTE_WEIGHTS: Record<Position, Partial<Record<keyof import('@/types').PlayerAttributes, number>>> = {
  GK: { defending: 0.4, physicality: 0.2, tacticalIntelligence: 0.2, pressResistance: 0.1, passing: 0.1 },
  CB: { defending: 0.35, physicality: 0.25, tacticalIntelligence: 0.15, duels: 0.15, passing: 0.1 },
  LB: { pace: 0.2, defending: 0.2, physicality: 0.15, ballProgression: 0.2, passing: 0.15, tacticalIntelligence: 0.1 },
  RB: { pace: 0.2, defending: 0.2, physicality: 0.15, ballProgression: 0.2, passing: 0.15, tacticalIntelligence: 0.1 },
  LWB: { pace: 0.25, ballProgression: 0.2, passing: 0.15, defending: 0.15, physicality: 0.15, creativity: 0.1 },
  RWB: { pace: 0.25, ballProgression: 0.2, passing: 0.15, defending: 0.15, physicality: 0.15, creativity: 0.1 },
  CDM: { defending: 0.3, duels: 0.2, tacticalIntelligence: 0.2, physicality: 0.15, passing: 0.15 },
  CM: { passing: 0.2, tacticalIntelligence: 0.2, pressResistance: 0.15, ballProgression: 0.2, duels: 0.15, physicality: 0.1 },
  CAM: { creativity: 0.25, passing: 0.2, ballProgression: 0.2, tacticalIntelligence: 0.15, finishing: 0.1, pace: 0.1 },
  LM: { pace: 0.2, ballProgression: 0.2, passing: 0.2, creativity: 0.15, defending: 0.1, physicality: 0.15 },
  RM: { pace: 0.2, ballProgression: 0.2, passing: 0.2, creativity: 0.15, defending: 0.1, physicality: 0.15 },
  LW: { pace: 0.25, creativity: 0.2, ballProgression: 0.2, finishing: 0.15, duels: 0.1, passing: 0.1 },
  RW: { pace: 0.25, creativity: 0.2, ballProgression: 0.2, finishing: 0.15, duels: 0.1, passing: 0.1 },
  CF: { finishing: 0.25, creativity: 0.2, pace: 0.15, tacticalIntelligence: 0.15, passing: 0.15, ballProgression: 0.1 },
  ST: { finishing: 0.3, physicality: 0.2, pace: 0.15, tacticalIntelligence: 0.15, duels: 0.1, creativity: 0.1 },
};

export function calculateBaseScore(player: Player, slotRole: Position): number {
  const weights = POSITION_ATTRIBUTE_WEIGHTS[slotRole] ?? POSITION_ATTRIBUTE_WEIGHTS[player.primaryPosition];
  let weighted = 0;
  let totalWeight = 0;
  const attrs = player.attributes;

  for (const [key, weight] of Object.entries(weights)) {
    const attrVal = attrs[key as keyof typeof attrs] ?? 0;
    weighted += attrVal * (weight as number);
    totalWeight += weight as number;
  }

  const attrScore = totalWeight > 0 ? weighted / totalWeight : 70;
  // Blend attribute score with player's base rating (65/35 split)
  return Math.round(attrScore * 0.65 + player.baseRating * 0.35);
}

// ─── Role Fit ─────────────────────────────────────────────────────────────────

const ROLE_POSITION_MAP: Record<string, Position[]> = {
  'Sweeper Keeper': ['GK'],
  'Shot Stopper': ['GK'],
  'Command Keeper': ['GK'],
  'Ball-Playing CB': ['CB'],
  'Stopper CB': ['CB'],
  'Cover CB': ['CB'],
  'Wide CB': ['CB', 'LWB', 'RWB'],
  'Inverted Fullback': ['LB', 'RB'],
  'Attacking Fullback': ['LB', 'RB', 'LWB', 'RWB'],
  'Anchor': ['CDM'],
  'Deep-Lying Playmaker': ['CDM', 'CM'],
  'Box-to-Box': ['CM'],
  'Mezzala': ['CM'],
  'Advanced Playmaker': ['CAM', 'CM'],
  'Shadow Striker': ['CAM'],
  'Pressing Midfielder': ['CM', 'CDM'],
  'Half-Space Runner': ['CM', 'CAM'],
  'Inside Forward': ['LW', 'RW', 'LM', 'RM'],
  'Wide Playmaker': ['LW', 'RW', 'LM', 'RM'],
  'Winger': ['LW', 'RW', 'LWB', 'RWB'],
  'Inverted Winger': ['LW', 'RW'],
  'Wide Forward': ['LW', 'RW', 'CF'],
  'Pressing Forward': ['ST', 'CF', 'LW', 'RW'],
  'Complete Forward': ['ST', 'CF'],
  'False 9': ['ST', 'CF', 'CAM'],
  'Target Man': ['ST'],
  'Poacher': ['ST', 'CF'],
};

export function getRoleFitModifier(
  player: Player,
  slotRole: Position,
  tactics: TacticalSettings
): { value: number; label: string; detail: string; role: Role | null } {
  // Find which of player's preferred roles best matches the current slot
  let bestMatch = 0;
  let bestRole: Role | null = null;

  for (const role of player.preferredRoles) {
    const positions = ROLE_POSITION_MAP[role] ?? [];
    if (positions.includes(slotRole)) {
      bestMatch = 5;
      bestRole = role;
      break;
    }
  }

  // Tactical style bonus
  let tacticalBonus = 0;
  const tags = player.styleTags;

  if (tactics.playingStyle === 'gegenpressing' && tags.includes('Pressing')) tacticalBonus += 1;
  if (tactics.playingStyle === 'tiki-taka' && tags.includes('Technical')) tacticalBonus += 1;
  if (tactics.playingStyle === 'counter-attack' && tags.includes('Pacey')) tacticalBonus += 1;
  if (tactics.playingStyle === 'direct' && tags.includes('Physical')) tacticalBonus += 1;
  if (tactics.playingStyle === 'direct' && tags.includes('Aerial')) tacticalBonus += 1;

  const totalValue = Math.min(5, bestMatch + tacticalBonus - (bestMatch === 0 ? 3 : 0));

  if (bestMatch === 5 && bestRole) {
    return {
      value: totalValue,
      label: `Ideal role: ${bestRole}`,
      detail: `Best suited as ${bestRole} — fully aligned with squad role`,
      role: bestRole,
    };
  }

  return {
    value: totalValue,
    label: 'Role mismatch',
    detail: `No preferred role matches ${slotRole} slot — limited role familiarity`,
    role: null,
  };
}

// ─── Tactical Fit ────────────────────────────────────────────────────────────

export function getTacticalFitModifier(
  player: Player,
  slotRole: Position,
  tactics: TacticalSettings
): { value: number; detail: string } {
  let value = 0;
  const details: string[] = [];
  const { attributes: a, styleTags } = player;

  // Pressing intensity
  if (tactics.pressingIntensity >= 7) {
    if (a.physicality >= 80 || styleTags.includes('Pressing')) {
      value += 1;
      details.push('High press suits physical profile');
    } else if (a.physicality < 68) {
      value -= 1;
      details.push('High press may overload low-stamina player');
    }
  }

  // Defensive line height
  if (tactics.defensiveLineHeight >= 8) {
    if ((slotRole === 'CB' || slotRole === 'LB' || slotRole === 'RB') && a.pace < 72) {
      value -= 2;
      details.push('High line demands faster defenders');
    } else if (a.pace >= 78) {
      value += 1;
      details.push('Pace suits high defensive line');
    }
  }

  // Possession vs transition
  if (tactics.possessionFocus >= 7) {
    if (a.pressResistance >= 80 || styleTags.includes('Technical')) {
      value += 1;
      details.push('Strong under pressure in possession system');
    }
    if (a.passing >= 80) {
      value += 1;
      details.push('High passing quality suits possession play');
    }
  } else if (tactics.possessionFocus <= 4) {
    if (styleTags.includes('Pacey') || a.pace >= 80) {
      value += 1;
      details.push('Pace exploits space on transitions');
    }
  }

  // Width
  if (tactics.width >= 7 && (slotRole === 'LW' || slotRole === 'RW' || slotRole === 'LM' || slotRole === 'RM' || slotRole === 'LWB' || slotRole === 'RWB')) {
    if (a.pace >= 80 || a.ballProgression >= 80) {
      value += 1;
      details.push('Wide system maximises pace/dribbling');
    }
  }

  // Directness
  if (tactics.directness >= 7) {
    if ((slotRole === 'ST' || slotRole === 'CF') && (styleTags.includes('Physical') || styleTags.includes('Aerial'))) {
      value += 1;
      details.push('Aerial/physical presence suits direct play');
    }
    if ((slotRole === 'ST' || slotRole === 'CF') && styleTags.includes('Technical') && !styleTags.includes('Physical')) {
      value -= 1;
      details.push('Technical striker may struggle in direct system');
    }
  }

  // Capped at ±5
  const clamped = Math.max(-5, Math.min(5, value));
  return {
    value: clamped,
    detail: details.length > 0 ? details[0] : 'Tactical context: moderate fit',
  };
}

// ─── Match Instructions / Opponent Context ────────────────────────────────────

export function getMatchInstructionModifier(
  player: Player,
  tactics: TacticalSettings
): { value: number; detail: string } {
  let value = 0;
  const { attributes: a, styleTags } = player;

  // Game state
  if (tactics.gameState === 'chasing') {
    if (styleTags.includes('Creative') || styleTags.includes('Clinical')) value += 1;
    if (styleTags.includes('Physical') && a.finishing > 70) value += 1;
  }
  if (tactics.gameState === 'leading') {
    if (styleTags.includes('Press Resistant') || styleTags.includes('Ball Winner')) value += 1;
    if (styleTags.includes('Pacey') && a.pace > 82) value += 1; // good for counterattack
  }

  return {
    value: Math.max(-3, Math.min(3, value)),
    detail:
      tactics.gameState === 'chasing'
        ? 'Chasing match — creative & goal threat prioritised'
        : tactics.gameState === 'leading'
        ? 'Protecting lead — solidity & counter threat valued'
        : 'Balanced game state — neutral instructions',
  };
}

export function getOpponentContextModifier(
  player: Player,
  tactics: TacticalSettings
): { value: number; detail: string } {
  let value = 0;
  const { attributes: a, styleTags } = player;

  if (tactics.opponentStyle === 'high-press') {
    if (styleTags.includes('Press Resistant') || a.pressResistance >= 82) {
      value += 2;
    } else if (a.pressResistance < 68) {
      value -= 2;
    }
  }

  if (tactics.opponentStyle === 'low-block') {
    if (styleTags.includes('Creative') || a.creativity >= 82) value += 1;
    if (styleTags.includes('Set Piece Threat') || styleTags.includes('Dead Ball Specialist')) value += 1;
  }

  if (tactics.opponentStyle === 'counter-attack') {
    if (a.tacticalIntelligence >= 80) value += 1;
    if (styleTags.includes('Positional')) value += 1;
  }

  if (tactics.opponentStyle === 'direct') {
    if (styleTags.includes('Aerial') || styleTags.includes('Ball Winner')) value += 1;
  }

  return {
    value: Math.max(-3, Math.min(3, value)),
    detail: `vs ${tactics.opponentStyle.replace('-', ' ')} opponent`,
  };
}

// ─── Full Score Calculator ─────────────────────────────────────────────────────

export function calculatePlayerScore(
  player: Player,
  slot: FormationSlot,
  adjacentPlayers: (Player | null)[],
  tactics: TacticalSettings,
  isBench = false
): ScoreBreakdown {
  const base = calculateBaseScore(player, slot.role);
  const positionMod = getPositionFamiliarityModifier(player, slot.role);
  const roleMod = getRoleFitModifier(player, slot.role, tactics);
  const tacticalMod = getTacticalFitModifier(player, slot.role, tactics);
  const instructionMod = getMatchInstructionModifier(player, tactics);
  const opponentMod = getOpponentContextModifier(player, tactics);

  // Chemistry modifier from adjacent players
  let chemValue = 0;
  const chemReasons: string[] = [];
  for (const adj of adjacentPlayers) {
    if (!adj) continue;
    if (adj.club === player.club) {
      chemValue += 1;
      chemReasons.push(`Club connection: ${adj.name}`);
    } else if (adj.nationality === player.nationality) {
      chemValue += 0.5;
      chemReasons.push(`Nationality bond: ${adj.name}`);
    }
    // Style compatibility
    const sharedTags = player.styleTags.filter((t) => adj.styleTags.includes(t));
    if (sharedTags.length >= 2) {
      chemValue += 0.5;
      chemReasons.push(`Shared style: ${sharedTags[0]}`);
    }
    // Style clash
    const hasTechnical = player.styleTags.includes('Technical');
    const adjDirect = adj.styleTags.includes('Physical') && !adj.styleTags.includes('Technical');
    if (hasTechnical && adjDirect) chemValue -= 0.5;
  }
  const chemModifier = Math.max(-6, Math.min(6, Math.round(chemValue)));

  const modifiers: ScoreModifiers = {
    positionFamiliarity: positionMod.value,
    roleFit: roleMod.value,
    chemistry: chemModifier,
    tacticalFit: tacticalMod.value,
    matchInstructions: instructionMod.value,
    opponentContext: opponentMod.value,
    benchPenalty: isBench ? -3 : 0,
  };

  const rawTotal =
    base +
    modifiers.positionFamiliarity +
    modifiers.roleFit +
    modifiers.chemistry +
    modifiers.tacticalFit +
    modifiers.matchInstructions +
    modifiers.opponentContext +
    modifiers.benchPenalty;

  const total = Math.min(99, Math.max(42, Math.round(rawTotal)));

  const warnings: ScoreBreakdown['warnings'] = [];
  const positives: ScoreBreakdown['positives'] = [];

  if (modifiers.positionFamiliarity <= -10) warnings.push({ key: 'breakdown.warn.outOfPosition' });
  else if (modifiers.positionFamiliarity === -3) warnings.push({ key: 'breakdown.warn.secondaryPosition' });
  if (modifiers.roleFit < 0) warnings.push({ key: 'breakdown.warn.roleMismatch' });
  if (modifiers.tacticalFit <= -3) warnings.push({ key: 'breakdown.warn.poorTacticalFit' });
  if (modifiers.chemistry <= -2) warnings.push({ key: 'breakdown.warn.lowChemistry' });

  if (modifiers.roleFit >= 4 && roleMod.role) {
    positives.push({ key: 'breakdown.pos.idealRole', vars: { roleKey: `role.${roleMod.role}` } });
  }
  if (modifiers.chemistry >= 3) positives.push({ key: 'breakdown.pos.strongChemistry' });
  if (modifiers.tacticalFit >= 3) positives.push({ key: 'breakdown.pos.tacticalAlignment' });
  if (modifiers.opponentContext >= 2) positives.push({ key: 'breakdown.pos.goodMatchup' });
  if (modifiers.positionFamiliarity === 0) positives.push({ key: 'breakdown.pos.naturalPosition' });

  return {
    playerId: player.id,
    base,
    modifiers,
    total,
    positionLabel: slot.label,
    warnings,
    positives,
  };
}

// ─── Team Aggregate Scores ────────────────────────────────────────────────────

export function calculateTeamScore(scores: Record<string, ScoreBreakdown>): number {
  const values = Object.values(scores)
    .filter((s) => s.modifiers.benchPenalty === 0)
    .map((s) => s.total);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function calculateChemistryScore(scores: Record<string, ScoreBreakdown>): number {
  const values = Object.values(scores).map((s) => s.modifiers.chemistry);
  if (values.length === 0) return 50;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  // Normalise from [-6,6] to [0,100]
  return Math.round(((avg + 6) / 12) * 100);
}

export function calculateTacticalFitScore(scores: Record<string, ScoreBreakdown>): number {
  const values = Object.values(scores).map((s) => s.modifiers.tacticalFit);
  if (values.length === 0) return 50;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(((avg + 5) / 10) * 100);
}

export function getScoreColor(score: number): string {
  if (score >= 87) return '#f59e0b'; // gold
  if (score >= 82) return '#10b981'; // green
  if (score >= 74) return '#22d3ee'; // cyan
  if (score >= 65) return '#f97316'; // orange
  return '#ef4444'; // red
}

export function getScoreLabelKey(score: number): string {
  if (score >= 87) return 'score.label.elite';
  if (score >= 82) return 'score.label.excellent';
  if (score >= 74) return 'score.label.good';
  if (score >= 65) return 'score.label.average';
  return 'score.label.poor';
}

/** @deprecated English-only. Use `getScoreLabelKey` with the `t()` helper. */
export function getScoreLabel(score: number): string {
  if (score >= 87) return 'Elite';
  if (score >= 82) return 'Excellent';
  if (score >= 74) return 'Good';
  if (score >= 65) return 'Average';
  return 'Poor';
}
