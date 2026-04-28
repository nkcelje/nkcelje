'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PLAYERS } from '@/data/players';
import { useT } from '@/context/I18nContext';
import { getPassportTag } from '@/lib/passport';
import type { Player, PlayerAttributes } from '@/types';

const ATTRS: { key: keyof PlayerAttributes; labelKey: string }[] = [
  { key: 'pace', labelKey: 'attr.pace' },
  { key: 'finishing', labelKey: 'attr.finishing' },
  { key: 'passing', labelKey: 'attr.passing' },
  { key: 'creativity', labelKey: 'attr.creativity' },
  { key: 'defending', labelKey: 'attr.defending' },
  { key: 'physicality', labelKey: 'attr.physicality' },
];

const COLORS = ['var(--celje-yellow)', 'var(--info)', '#FF8C8C', 'var(--good)'];

const DEFAULT_IDS = ['bejger', 'seslar', 'kucys'];

export function ComparisonView() {
  const t = useT();
  const [compareIds, setCompareIds] = useState<string[]>(() =>
    DEFAULT_IDS.filter((id) => PLAYERS.some((p) => p.id === id))
  );
  const [pickerForIndex, setPickerForIndex] = useState<number | null>(null);

  const players = useMemo(
    () => compareIds.map((id) => PLAYERS.find((p) => p.id === id)).filter((p): p is Player => !!p),
    [compareIds]
  );

  // Squad average per attribute (deltas)
  const squadAvg = useMemo(() => {
    const out: Record<string, number> = {};
    for (const { key } of ATTRS) {
      const sum = PLAYERS.reduce((s, p) => s + p.attributes[key], 0);
      out[key] = Math.round(sum / PLAYERS.length);
    }
    return out;
  }, []);

  const replaceAt = (idx: number, id: string) => {
    setCompareIds((prev) => {
      const next = [...prev];
      next[idx] = id;
      return next;
    });
  };
  const removeAt = (idx: number) => {
    setCompareIds((prev) => prev.filter((_, i) => i !== idx));
  };
  const addPlayer = () => {
    const candidate = PLAYERS.find((p) => !compareIds.includes(p.id));
    if (candidate) setCompareIds((prev) => [...prev, candidate.id]);
  };

  const headerCols = `280px ${players.map(() => '1fr').join(' ')}`;

  return (
    <div className="view-compare">
      <div className="page-head">
        <div>
          <div className="page-title">{t('cmp.title').toUpperCase()}</div>
          <div className="page-sub mono">
            {players.length} PLAYERS · ATTRIBUTES + DELTA + RADAR
          </div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn ghost" style={{ flex: 0 }}>Save view</button>
          <button type="button" className="btn primary" style={{ flex: 0 }}>Export PDF</button>
        </div>
      </div>

      {/* Radar */}
      {players.length >= 2 && (
        <div className="radar-card">
          <div className="radar-wrap">
            <RadarChart players={players} />
            <div>
              <div
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: 'var(--ink-3)',
                  marginBottom: 10,
                }}
              >
                {t('cmp.radarOverlay')}
              </div>
              <div className="radar-legend">
                {players.map((p, i) => (
                  <div key={p.id} className="legend-row">
                    <span className="swatch" style={{ background: COLORS[i] }} />
                    <span>
                      {p.firstName} {p.lastName}{' '}
                      <span className="muted">· {p.primaryPosition}</span>
                    </span>
                    <span className="mono" style={{ color: 'var(--ink-1)' }}>
                      {p.baseRating}
                    </span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 14,
                  borderTop: '1px dashed var(--line)',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color: 'var(--ink-3)',
                    marginBottom: 8,
                  }}
                >
                  {t('cmp.verdict')}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--ink-1)',
                    lineHeight: 1.5,
                  }}
                >
                  <Verdict players={players} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison grid */}
      <div className="compare-grid" style={{ gridTemplateColumns: headerCols }}>
        <div className="compare-row head">
          <div
            className="compare-label"
            style={{ alignSelf: 'end', color: 'var(--ink-2)' }}
          >
            —
          </div>
          {players.map((p) => (
            <div key={p.id} className={`compare-head-card pp-card-${getPassportTag(p)}`}>
              <div className={`pcard-disc pp-${getPassportTag(p)}`}>
                {p.firstName[0]}
                {p.lastName[0]}
              </div>
              <div>
                <div className="name">
                  <span style={{ marginRight: 6 }}>{p.flag}</span>
                  {p.firstName} {p.lastName}
                </div>
                <div className="role">
                  {p.primaryPosition} · {p.preferredRoles[0] ?? '—'}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="compare-row">
          <div className="compare-label">{t('chip.ovr')}</div>
          {players.map((p) => (
            <div
              key={p.id}
              className="compare-cell"
              style={{
                fontSize: 22,
                fontFamily: 'var(--font-display)',
                color: 'var(--celje-yellow)',
              }}
            >
              {p.baseRating}{' '}
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--ink-3)',
                  letterSpacing: '0.08em',
                }}
              >
                → {p.potential}
              </span>
            </div>
          ))}
        </div>

        {ATTRS.map(({ key, labelKey }) => {
          const vals = players.map((p) => p.attributes[key]);
          const max = Math.max(...vals);
          const min = Math.min(...vals);
          return (
            <div key={key} className="compare-row">
              <div className="compare-label">{t(labelKey)}</div>
              {players.map((p, i) => {
                const v = vals[i];
                const cls = v === max ? 'max' : v === min && max !== min ? 'min' : '';
                const delta = v - squadAvg[key];
                return (
                  <div key={p.id} className="compare-cell bar-cell">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 11,
                      }}
                    >
                      <span
                        className={`mono ${cls}`}
                        style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}
                      >
                        {v}
                      </span>
                      <span
                        className="mono"
                        style={{
                          fontSize: 10,
                          color: delta >= 0 ? 'var(--good)' : 'var(--bad)',
                        }}
                      >
                        {delta >= 0 ? '+' : ''}
                        {delta}
                      </span>
                    </div>
                    <div className="bar">
                      <i style={{ width: `${v}%`, background: COLORS[i] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Base rows */}
        <BaseRow label={t('player.age')} players={players} fn={(p) => `${p.age}`} />
        <BaseRow label={t('player.foot')} players={players} fn={(p) => p.preferredFoot} />
        <BaseRow label={t('player.height')} players={players} fn={(p) => `${p.height} cm`} />
        <BaseRow label={t('player.contract')} players={players} fn={(p) => p.contractEnds} />
        <BaseRow label={t('player.value')} players={players} fn={(p) => `€${p.marketValue.toFixed(1)}M`} />

        <div className="compare-row">
          <div className="compare-label">Action</div>
          {players.map((p, i) => (
            <div key={p.id} className="compare-cell" style={{ gap: 6 }}>
              <button
                type="button"
                className="btn ghost"
                style={{ flex: 0, padding: '6px 10px' }}
                onClick={() => setPickerForIndex(i)}
              >
                Replace
              </button>
              <button
                type="button"
                className="btn ghost"
                style={{ flex: 0, padding: '6px 10px' }}
                onClick={() => removeAt(i)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {players.length < 4 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: headerCols,
            marginTop: 12,
          }}
        >
          <div />
          {players.map((_, i) =>
            i === players.length - 1 ? (
              <div key={i} className="compare-add" onClick={addPlayer}>
                + Add player
              </div>
            ) : (
              <div key={i} />
            )
          )}
        </div>
      )}

      {pickerForIndex !== null && (
        <PlayerPicker
          excludeIds={compareIds}
          onPick={(p) => {
            replaceAt(pickerForIndex, p.id);
            setPickerForIndex(null);
          }}
          onClose={() => setPickerForIndex(null)}
          title="Replace player"
        />
      )}
    </div>
  );
}

function BaseRow({
  label,
  players,
  fn,
}: {
  label: string;
  players: Player[];
  fn: (p: Player) => string;
}) {
  return (
    <div className="compare-row">
      <div className="compare-label">{label}</div>
      {players.map((p) => (
        <div key={p.id} className="compare-cell">
          {fn(p)}
        </div>
      ))}
    </div>
  );
}

function bestAttr(p: Player, all: Player[]): keyof PlayerAttributes {
  let best: keyof PlayerAttributes = 'pace';
  let bestDiff = -Infinity;
  for (const { key } of ATTRS) {
    const others = all.filter((x) => x.id !== p.id).map((x) => x.attributes[key]);
    if (others.length === 0) continue;
    const avg = others.reduce((a, b) => a + b, 0) / others.length;
    const diff = p.attributes[key] - avg;
    if (diff > bestDiff) {
      bestDiff = diff;
      best = key;
    }
  }
  return best;
}

function Verdict({ players }: { players: Player[] }) {
  const t = useT();
  if (players.length < 2) return null;
  const a = players[0];
  const b = players[1];
  const bestA = bestAttr(a, players);
  const bestB = bestAttr(b, players);
  return (
    <span>
      <b style={{ color: 'var(--celje-yellow)' }}>{a.lastName}</b> leads on{' '}
      {t(`attr.${bestA}`).toLowerCase()},{' '}
      <b style={{ color: 'var(--info)' }}>{b.lastName}</b> on{' '}
      {t(`attr.${bestB}`).toLowerCase()}.
      {players[2] && (
        <>
          {' '}
          Pair <b>{a.lastName}</b> + <b>{players[2].lastName}</b> for tactical balance.
        </>
      )}
    </span>
  );
}

// ─── Radar chart (SVG) ──────────────────────────────────────
function RadarChart({ players }: { players: Player[] }) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = 130;
  const n = ATTRS.length;
  const t = useT();

  const points = (vals: number[]) =>
    vals.map((v, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const rad = (v / 100) * r;
      return [cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad] as [number, number];
    });

  const labelPoints = ATTRS.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rad = r + 18;
    return [cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad] as [number, number];
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', margin: '0 auto' }}
    >
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon
          key={s}
          points={ATTRS.map((_, i) => {
            const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
            return `${cx + Math.cos(angle) * r * s},${cy + Math.sin(angle) * r * s}`;
          }).join(' ')}
          fill="none"
          stroke="var(--line)"
          strokeDasharray={s === 1 ? '' : '2 3'}
        />
      ))}
      {ATTRS.map((_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(angle) * r}
            y2={cy + Math.sin(angle) * r}
            stroke="var(--line)"
          />
        );
      })}
      {players.map((p, idx) => {
        const pts = points(ATTRS.map(({ key }) => p.attributes[key]));
        return (
          <polygon
            key={p.id}
            points={pts.map((pt) => pt.join(',')).join(' ')}
            fill={COLORS[idx]}
            fillOpacity="0.12"
            stroke={COLORS[idx]}
            strokeWidth="1.5"
          />
        );
      })}
      {players.map((p, idx) => {
        const pts = points(ATTRS.map(({ key }) => p.attributes[key]));
        return pts.map((pt, i) => (
          <circle
            key={`${p.id}-${i}`}
            cx={pt[0]}
            cy={pt[1]}
            r="3"
            fill={COLORS[idx]}
          />
        ));
      })}
      {ATTRS.map(({ labelKey }, i) => {
        const [x, y] = labelPoints[i];
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="var(--font-mono)"
            fontSize="10"
            fill="var(--ink-2)"
            letterSpacing="0.1em"
          >
            {t(labelKey).toUpperCase().slice(0, 3)}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Player picker modal ────────────────────────────────────
function PlayerPicker({
  excludeIds,
  onPick,
  onClose,
  title,
}: {
  excludeIds: string[];
  onPick: (p: Player) => void;
  onClose: () => void;
  title: string;
}) {
  const t = useT();
  const [q, setQ] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  const filtered = PLAYERS.filter((p) => {
    if (excludeIds.includes(p.id)) return false;
    if (!q) return true;
    return `${p.firstName} ${p.lastName}`.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
          <button type="button" className="icon-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)' }}>
          <input
            ref={ref}
            className="input"
            placeholder={t('filter.searchPlaceholder')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="modal-body">
          {filtered.map((p) => (
            <div key={p.id} className="modal-row" onClick={() => onPick(p)}>
              <span
                className="mono"
                style={{ color: 'var(--ink-3)', textAlign: 'right' }}
              >
                {p.jerseyNumber ?? '—'}
              </span>
              <span>{p.flag}</span>
              <span>
                {p.firstName} {p.lastName}
              </span>
              <span className="pos">{p.primaryPosition}</span>
              <span
                className="mono"
                style={{
                  color: 'var(--celje-yellow)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  width: 32,
                  textAlign: 'right',
                }}
              >
                {p.baseRating}
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                color: 'var(--ink-3)',
                fontSize: 12,
              }}
            >
              No players
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
