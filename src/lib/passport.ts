// Passport classification for Slovenian league squad rules.
// Slovenia uses EU freedom-of-movement; non-EU foreigners count against a limited quota.

export type PassportStatus = 'slovenian' | 'eu' | 'foreign';
export type PassportTag = 'SI' | 'EU' | 'FOREIGN';

const EU_NATIONALITIES = new Set<string>([
  'Austrian', 'Belgian', 'Bulgarian', 'Croatian', 'Cypriot', 'Czech', 'Danish',
  'Dutch', 'Estonian', 'Finnish', 'French', 'German', 'Greek', 'Hungarian',
  'Irish', 'Italian', 'Latvian', 'Lithuanian', 'Luxembourgish', 'Maltese',
  'Polish', 'Portuguese', 'Romanian', 'Slovakian', 'Slovak', 'Spanish', 'Swedish',
]);

// Players who are Slovenian by nationality in the dataset but should be treated
// as holding an additional EU passport for squad-rules purposes.
const EU_OVERRIDE_IDS = new Set<string>(['leban']);

export function getPassportStatus(player: { id: string; nationality: string }): PassportStatus {
  if (EU_OVERRIDE_IDS.has(player.id)) return 'eu';
  if (player.nationality === 'Slovenian') return 'slovenian';
  if (EU_NATIONALITIES.has(player.nationality)) return 'eu';
  return 'foreign';
}

export function getPassportTag(player: { id: string; nationality: string }): PassportTag {
  const status = getPassportStatus(player);
  if (status === 'slovenian') return 'SI';
  if (status === 'eu') return 'EU';
  return 'FOREIGN';
}

export const PASSPORT_BORDER: Record<PassportStatus, string> = {
  slovenian: '#4FA3FF', // blue (Algorythm)
  eu: '#5BD392',        // green (--good)
  foreign: '#FF6B6B',   // red (--bad)
};

export function getPassportBorder(player: { id: string; nationality: string }): string {
  return PASSPORT_BORDER[getPassportStatus(player)];
}
