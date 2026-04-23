// ─── Position & Role Types ────────────────────────────────────────────────────

export type Position =
  | 'GK'
  | 'CB' | 'LB' | 'RB' | 'LWB' | 'RWB'
  | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM'
  | 'LW' | 'RW' | 'CF' | 'ST';

export type FormationName = '4-4-2' | '4-3-3' | '4-2-3-1' | '3-5-2';

export type Role =
  // Goalkeeper
  | 'Sweeper Keeper' | 'Shot Stopper' | 'Command Keeper'
  // Defenders
  | 'Ball-Playing CB' | 'Stopper CB' | 'Cover CB'
  | 'Inverted Fullback' | 'Attacking Fullback' | 'Wide CB'
  // Midfielders
  | 'Anchor' | 'Deep-Lying Playmaker' | 'Box-to-Box'
  | 'Mezzala' | 'Advanced Playmaker' | 'Shadow Striker'
  | 'Pressing Midfielder' | 'Half-Space Runner'
  // Wide
  | 'Inside Forward' | 'Wide Playmaker' | 'Winger'
  | 'Inverted Winger' | 'Wide Forward'
  // Forwards
  | 'Pressing Forward' | 'Complete Forward' | 'False 9'
  | 'Target Man' | 'Poacher';

export type PreferredFoot = 'Left' | 'Right' | 'Both';

export type League =
  | 'Premier League' | 'La Liga' | 'Bundesliga'
  | 'Serie A' | 'Ligue 1' | 'Eredivisie'
  | 'Primeira Liga' | 'MLS' | 'Saudi Pro League' | 'Pro League';

export type StyleTag =
  | 'Technical' | 'Physical' | 'Pacey' | 'Creative' | 'Clinical'
  | 'Press Resistant' | 'High Work Rate' | 'Leader' | 'Set Piece Threat'
  | 'Ball Winner' | 'Aerial' | 'One-on-One' | 'Dead Ball Specialist'
  | 'Dribbler' | 'Long Range' | 'Pressing' | 'Positional';

export type FitTag =
  | 'Strong tactical fit'
  | 'Low chemistry risk'
  | 'Bench upgrade'
  | 'Immediate starter'
  | 'Development signing'
  | 'Rotational'
  | 'High potential'
  | 'Set piece specialist';

// ─── Player Attributes ────────────────────────────────────────────────────────

export interface PlayerAttributes {
  pace: number;                 // 0-100
  passing: number;              // 0-100
  defending: number;            // 0-100
  finishing: number;            // 0-100
  tacticalIntelligence: number; // 0-100
  physicality: number;          // 0-100
  pressResistance: number;      // 0-100
  ballProgression: number;      // 0-100
  duels: number;                // 0-100
  creativity: number;           // 0-100
}

// ─── Player ──────────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  age: number;
  nationality: string;
  flag: string;
  club: string;
  league: League;
  preferredFoot: PreferredFoot;
  primaryPosition: Position;
  secondaryPositions: Position[];
  preferredRoles: Role[];
  attributes: PlayerAttributes;
  baseRating: number;
  potential: number;
  marketValue: number;  // millions €
  contractEnds: string;
  styleTags: StyleTag[];
  height: number;  // cm
  weight: number;  // kg
  jerseyNumber?: number;
  isCaptain?: boolean;
  avatarColor?: string;  // for avatar placeholder
  photoUrl?: string;
}

// ─── Formation ───────────────────────────────────────────────────────────────

export interface FormationSlot {
  id: string;
  label: string;
  role: Position;
  x: number;            // 0-100 % on pitch
  y: number;            // 0-100 % on pitch
  adjacentSlots: string[];
}

export interface Formation {
  id: FormationName;
  name: FormationName;
  displayName: string;
  slots: FormationSlot[];
  description: string;
  strengths: string[];
  weaknesses: string[];
}

// ─── Tactical Settings ────────────────────────────────────────────────────────

export type OpponentStyle =
  | 'high-press' | 'low-block' | 'balanced'
  | 'counter-attack' | 'possession' | 'direct';

export type GameState = 'leading' | 'drawing' | 'chasing';

export type PlayingStyle =
  | 'tiki-taka' | 'gegenpressing' | 'counter-attack' | 'direct' | 'balanced';

export interface TacticalSettings {
  formation: FormationName;
  pressingIntensity: number;     // 1-10
  defensiveLineHeight: number;   // 1-10
  possessionFocus: number;       // 1-10 (1=counter, 10=possession)
  width: number;                 // 1-10
  directness: number;            // 1-10
  attackingMentality: number;    // 1-10
  counterPress: boolean;
  highLine: boolean;
  gameState: GameState;
  opponentStyle: OpponentStyle;
  playingStyle: PlayingStyle;
}

// ─── Score System ─────────────────────────────────────────────────────────────

export interface ScoreModifiers {
  positionFamiliarity: number;  // -15 to 0
  roleFit: number;              // -5 to +5
  chemistry: number;            // -6 to +6
  tacticalFit: number;          // -5 to +5
  matchInstructions: number;    // -3 to +3
  opponentContext: number;      // -3 to +3
  benchPenalty: number;         // 0 or -3 for bench
}

export interface ScoreMessage {
  key: string;
  vars?: Record<string, string | number>;
}

export interface ScoreBreakdown {
  playerId: string;
  base: number;
  modifiers: ScoreModifiers;
  total: number;
  positionLabel: string;
  warnings: ScoreMessage[];
  positives: ScoreMessage[];
}

// ─── Chemistry ───────────────────────────────────────────────────────────────

export interface ChemistryLink {
  slotId1: string;
  slotId2: string;
  playerId1: string;
  playerId2: string;
  strength: 'strong' | 'medium' | 'weak';
  value: number;  // -2 to +2
  reasons: string[];
}

// ─── Squad State ─────────────────────────────────────────────────────────────

export interface SquadState {
  formation: FormationName;
  lineup: Record<string, string | null>;   // slotId -> playerId | null
  bench: string[];                          // playerIds
  tacticalSettings: TacticalSettings;
  selectedSlotId: string | null;
  selectedPlayerId: string | null;
  scores: Record<string, ScoreBreakdown>;  // playerId -> ScoreBreakdown
  chemistryLinks: ChemistryLink[];
  teamScore: number;
  chemistryScore: number;
  tacticalFitScore: number;
}

// ─── Recruitment / Filters ────────────────────────────────────────────────────

export interface PlayerFilters {
  search: string;
  positions: Position[];
  leagues: League[];
  minAge: number;
  maxAge: number;
  minRating: number;
  maxRating: number;
  preferredFoot: PreferredFoot | 'Any';
  maxValue: number;
  styleTags: StyleTag[];
}

export type SortField = 'name' | 'rating' | 'age' | 'value' | 'fitScore';
export type SortDir = 'asc' | 'desc';
