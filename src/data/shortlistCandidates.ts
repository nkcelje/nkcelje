import type { Player, Position, League, PreferredFoot, Role, StyleTag } from '@/types';

/**
 * Placeholder pool of scouting targets — real scouting AI output would
 * live here. Each candidate is labelled "Новый игрок N" until the user
 * adds them to their roster (at which point metadata is preserved).
 */

interface Seed {
  pos: Position;
  nat: string;
  flag: string;
  club: string;
  league: League;
  age: number;
  foot: PreferredFoot;
  rating: number;
  potential: number;
  value: number;
  contract: string;
  roles: Role[];
  styles: StyleTag[];
  color: string;
  // relative strengths
  bias: 'speed' | 'technique' | 'physical' | 'creative' | 'defensive' | 'clinical';
}

const SEEDS: Seed[] = [
  // Goalkeepers
  { pos: 'GK', nat: 'Croatian', flag: '🇭🇷', club: 'HNK Rijeka', league: 'Pro League', age: 22, foot: 'Right', rating: 76, potential: 84, value: 3.2, contract: '2027', roles: ['Sweeper Keeper'], styles: ['Press Resistant'], color: '#22d3ee', bias: 'technique' },
  { pos: 'GK', nat: 'Serbian', flag: '🇷🇸', club: 'FK Partizan', league: 'Pro League', age: 25, foot: 'Right', rating: 78, potential: 82, value: 4.5, contract: '2026', roles: ['Shot Stopper', 'Command Keeper'], styles: ['Leader', 'Aerial'], color: '#f59e0b', bias: 'defensive' },

  // Defenders
  { pos: 'CB', nat: 'Hungarian', flag: '🇭🇺', club: 'Ferencváros', league: 'Pro League', age: 24, foot: 'Left', rating: 78, potential: 83, value: 6.5, contract: '2027', roles: ['Ball-Playing CB'], styles: ['Press Resistant', 'Aerial'], color: '#10b981', bias: 'technique' },
  { pos: 'CB', nat: 'Austrian', flag: '🇦🇹', club: 'LASK Linz', league: 'Bundesliga', age: 22, foot: 'Right', rating: 75, potential: 85, value: 5.8, contract: '2027', roles: ['Stopper CB', 'Ball-Playing CB'], styles: ['Physical', 'Aerial'], color: '#ef4444', bias: 'physical' },
  { pos: 'LB', nat: 'Portuguese', flag: '🇵🇹', club: 'Vitória Guimarães', league: 'Primeira Liga', age: 23, foot: 'Left', rating: 77, potential: 84, value: 7.2, contract: '2028', roles: ['Attacking Fullback'], styles: ['Pacey', 'Set Piece Threat'], color: '#f97316', bias: 'speed' },
  { pos: 'RB', nat: 'Dutch', flag: '🇳🇱', club: 'Go Ahead Eagles', league: 'Eredivisie', age: 21, foot: 'Right', rating: 74, potential: 86, value: 5.5, contract: '2027', roles: ['Inverted Fullback', 'Attacking Fullback'], styles: ['High Work Rate', 'Pacey'], color: '#06b6d4', bias: 'speed' },
  { pos: 'CB', nat: 'Bosnian', flag: '🇧🇦', club: 'HŠK Zrinjski', league: 'Pro League', age: 28, foot: 'Right', rating: 76, potential: 76, value: 2.8, contract: '2026', roles: ['Stopper CB'], styles: ['Aerial', 'Leader'], color: '#3b82f6', bias: 'physical' },

  // Defensive / central mids
  { pos: 'CDM', nat: 'Polish', flag: '🇵🇱', club: 'Lech Poznań', league: 'Pro League', age: 24, foot: 'Right', rating: 77, potential: 82, value: 5.9, contract: '2027', roles: ['Anchor', 'Deep-Lying Playmaker'], styles: ['Ball Winner', 'Positional'], color: '#7c3aed', bias: 'defensive' },
  { pos: 'CM', nat: 'Italian', flag: '🇮🇹', club: 'Frosinone', league: 'Serie A', age: 23, foot: 'Right', rating: 78, potential: 85, value: 8.1, contract: '2027', roles: ['Box-to-Box', 'Mezzala'], styles: ['Technical', 'High Work Rate'], color: '#d97706', bias: 'creative' },
  { pos: 'CM', nat: 'Croatian', flag: '🇭🇷', club: 'NK Varaždin', league: 'Pro League', age: 20, foot: 'Left', rating: 72, potential: 86, value: 3.6, contract: '2028', roles: ['Advanced Playmaker'], styles: ['Technical', 'Creative'], color: '#ec4899', bias: 'creative' },
  { pos: 'CAM', nat: 'Argentine', flag: '🇦🇷', club: 'Defensa y Justicia', league: 'Pro League', age: 25, foot: 'Left', rating: 79, potential: 84, value: 9.2, contract: '2026', roles: ['Advanced Playmaker', 'Shadow Striker'], styles: ['Creative', 'Dribbler'], color: '#8b5cf6', bias: 'creative' },
  { pos: 'CM', nat: 'Slovakian', flag: '🇸🇰', club: 'Spartak Trnava', league: 'Pro League', age: 27, foot: 'Right', rating: 76, potential: 78, value: 3.3, contract: '2026', roles: ['Box-to-Box'], styles: ['High Work Rate', 'Leader'], color: '#059669', bias: 'defensive' },

  // Wingers / wide forwards
  { pos: 'LW', nat: 'Brazilian', flag: '🇧🇷', club: 'RB Bragantino', league: 'Pro League', age: 22, foot: 'Right', rating: 78, potential: 86, value: 10.5, contract: '2027', roles: ['Inverted Winger', 'Inside Forward'], styles: ['Pacey', 'Dribbler'], color: '#10b981', bias: 'speed' },
  { pos: 'RW', nat: 'Nigerian', flag: '🇳🇬', club: 'FC Sheriff', league: 'Pro League', age: 21, foot: 'Left', rating: 76, potential: 87, value: 8.4, contract: '2028', roles: ['Inside Forward', 'Winger'], styles: ['Pacey', 'Dribbler'], color: '#eab308', bias: 'speed' },
  { pos: 'RM', nat: 'Ukrainian', flag: '🇺🇦', club: 'Zorya Luhansk', league: 'Pro League', age: 24, foot: 'Right', rating: 75, potential: 81, value: 4.2, contract: '2026', roles: ['Winger'], styles: ['High Work Rate', 'Pacey'], color: '#fbbf24', bias: 'speed' },
  { pos: 'LW', nat: 'Swedish', flag: '🇸🇪', club: 'Hammarby IF', league: 'Pro League', age: 23, foot: 'Right', rating: 77, potential: 83, value: 6.9, contract: '2027', roles: ['Inside Forward'], styles: ['Technical', 'Clinical'], color: '#2563eb', bias: 'clinical' },

  // Forwards
  { pos: 'ST', nat: 'Norwegian', flag: '🇳🇴', club: 'Lillestrøm', league: 'Pro League', age: 22, foot: 'Right', rating: 78, potential: 87, value: 9.8, contract: '2027', roles: ['Pressing Forward', 'Complete Forward'], styles: ['Clinical', 'Pressing'], color: '#dc2626', bias: 'clinical' },
  { pos: 'CF', nat: 'Greek', flag: '🇬🇷', club: 'AEK Athens', league: 'Pro League', age: 26, foot: 'Right', rating: 79, potential: 81, value: 6.5, contract: '2026', roles: ['Complete Forward', 'Target Man'], styles: ['Physical', 'Aerial'], color: '#7c2d12', bias: 'physical' },
  { pos: 'ST', nat: 'Ivorian', flag: '🇨🇮', club: 'Maccabi Haifa', league: 'Pro League', age: 20, foot: 'Left', rating: 72, potential: 88, value: 4.4, contract: '2028', roles: ['Pressing Forward', 'Poacher'], styles: ['Pacey', 'Clinical'], color: '#f97316', bias: 'speed' },
  { pos: 'ST', nat: 'Danish', flag: '🇩🇰', club: 'FC Midtjylland', league: 'Pro League', age: 25, foot: 'Right', rating: 80, potential: 83, value: 11.2, contract: '2026', roles: ['Poacher', 'Complete Forward'], styles: ['Clinical', 'One-on-One'], color: '#db2777', bias: 'clinical' },
];

function attrsForBias(rating: number, bias: Seed['bias']) {
  const base = {
    pace: rating - 6,
    passing: rating - 8,
    defending: rating - 10,
    finishing: rating - 10,
    tacticalIntelligence: rating - 6,
    physicality: rating - 6,
    pressResistance: rating - 8,
    ballProgression: rating - 8,
    duels: rating - 6,
    creativity: rating - 10,
  };
  const clip = (v: number) => Math.max(35, Math.min(95, Math.round(v)));
  switch (bias) {
    case 'speed':
      base.pace += 10; base.physicality += 2; base.defending -= 4; break;
    case 'technique':
      base.passing += 8; base.pressResistance += 6; base.ballProgression += 6; break;
    case 'physical':
      base.physicality += 10; base.duels += 8; base.defending += 4; break;
    case 'creative':
      base.creativity += 12; base.passing += 6; base.defending -= 4; break;
    case 'defensive':
      base.defending += 10; base.duels += 6; base.finishing -= 6; break;
    case 'clinical':
      base.finishing += 12; base.pace += 2; base.defending -= 4; break;
  }
  return {
    pace: clip(base.pace),
    passing: clip(base.passing),
    defending: clip(base.defending),
    finishing: clip(base.finishing),
    tacticalIntelligence: clip(base.tacticalIntelligence),
    physicality: clip(base.physicality),
    pressResistance: clip(base.pressResistance),
    ballProgression: clip(base.ballProgression),
    duels: clip(base.duels),
    creativity: clip(base.creativity),
  };
}

export const SHORTLIST_CANDIDATES: Player[] = SEEDS.map((s, i) => {
  const n = i + 1;
  return {
    id: `candidate-${n}`,
    name: `Новый игрок ${n}`,
    firstName: 'Новый',
    lastName: `Игрок ${n}`,
    age: s.age,
    nationality: s.nat,
    flag: s.flag,
    club: s.club,
    league: s.league,
    preferredFoot: s.foot,
    primaryPosition: s.pos,
    secondaryPositions: [],
    preferredRoles: s.roles,
    baseRating: s.rating,
    potential: s.potential,
    marketValue: s.value,
    contractEnds: s.contract,
    styleTags: s.styles,
    height: 178 + ((n * 7) % 18),
    weight: 70 + ((n * 5) % 18),
    avatarColor: s.color,
    attributes: attrsForBias(s.rating, s.bias),
  };
});
