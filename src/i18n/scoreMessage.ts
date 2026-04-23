import type { ScoreMessage } from '@/types';

type T = (key: string, vars?: Record<string, string | number>) => string;

/**
 * Render a ScoreMessage to a translated string.
 *
 * Any var whose name ends in `Key` is treated as a nested translation key:
 * its value is first translated, then injected under the base name (e.g.
 * `roleKey` → translated → available as `{role}` in the parent template).
 */
export function translateScoreMessage(t: T, msg: ScoreMessage): string {
  if (!msg.vars) return t(msg.key);
  const resolved: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(msg.vars)) {
    if (k.endsWith('Key') && typeof v === 'string') {
      resolved[k.slice(0, -3)] = t(v);
    } else {
      resolved[k] = v;
    }
  }
  return t(msg.key, resolved);
}
