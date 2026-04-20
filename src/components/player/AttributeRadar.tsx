'use client';

import type { PlayerAttributes } from '@/types';

interface AttributeRadarProps {
  attributes: PlayerAttributes;
  size?: number;
  showLabels?: boolean;
  compareAttributes?: PlayerAttributes;
}

const AXES = [
  { key: 'pace', label: 'PAC', angle: -90 },
  { key: 'finishing', label: 'FIN', angle: -18 },
  { key: 'physicality', label: 'PHY', angle: 54 },
  { key: 'defending', label: 'DEF', angle: 126 },
  { key: 'creativity', label: 'CRE', angle: 198 },
  { key: 'passing', label: 'PAS', angle: 270 },
];

function polarToCart(angle: number, r: number, cx: number, cy: number) {
  const rad = (angle * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function buildPolygon(attrs: PlayerAttributes, cx: number, cy: number, maxR: number): string {
  return AXES.map(({ key, angle }) => {
    const value = attrs[key as keyof PlayerAttributes] / 100;
    const r = value * maxR;
    const pt = polarToCart(angle, r, cx, cy);
    return `${pt.x},${pt.y}`;
  }).join(' ');
}

export function AttributeRadar({
  attributes,
  size = 200,
  showLabels = true,
  compareAttributes,
}: AttributeRadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 24;
  const gridLevels = [20, 40, 60, 80, 100];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid circles */}
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={AXES.map(({ angle }) => {
            const r = (level / 100) * maxR;
            const pt = polarToCart(angle, r, cx, cy);
            return `${pt.x},${pt.y}`;
          }).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={0.5}
        />
      ))}

      {/* Axis lines */}
      {AXES.map(({ angle }) => {
        const outer = polarToCart(angle, maxR, cx, cy);
        return (
          <line
            key={angle}
            x1={cx}
            y1={cy}
            x2={outer.x}
            y2={outer.y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Compare polygon */}
      {compareAttributes && (
        <polygon
          points={buildPolygon(compareAttributes, cx, cy, maxR)}
          fill="rgba(245,158,11,0.12)"
          stroke="#f59e0b"
          strokeWidth={1.5}
          strokeOpacity={0.6}
        />
      )}

      {/* Main polygon */}
      <polygon
        points={buildPolygon(attributes, cx, cy, maxR)}
        fill="rgba(59,130,246,0.18)"
        stroke="#3b82f6"
        strokeWidth={2}
        style={{ filter: 'drop-shadow(0 0 4px rgba(59,130,246,0.4))' }}
      />

      {/* Data point dots */}
      {AXES.map(({ key, angle }) => {
        const value = attributes[key as keyof PlayerAttributes] / 100;
        const r = value * maxR;
        const pt = polarToCart(angle, r, cx, cy);
        return (
          <circle
            key={key}
            cx={pt.x}
            cy={pt.y}
            r={3}
            fill="#3b82f6"
            stroke="#04060f"
            strokeWidth={1}
            style={{ filter: 'drop-shadow(0 0 3px rgba(59,130,246,0.6))' }}
          />
        );
      })}

      {/* Labels */}
      {showLabels &&
        AXES.map(({ key, label, angle }) => {
          const r = maxR + 14;
          const pt = polarToCart(angle, r, cx, cy);
          const value = attributes[key as keyof PlayerAttributes];
          const highColor = value >= 85 ? '#fbbf24' : value >= 75 ? '#34d399' : '#94a3b8';

          return (
            <g key={key}>
              <text
                x={pt.x}
                y={pt.y - 3}
                textAnchor="middle"
                dominantBaseline="auto"
                fill="rgba(148,163,184,0.8)"
                fontSize={8}
                fontWeight={600}
                fontFamily="system-ui"
                letterSpacing={0.5}
              >
                {label}
              </text>
              <text
                x={pt.x}
                y={pt.y + 8}
                textAnchor="middle"
                dominantBaseline="auto"
                fill={highColor}
                fontSize={9}
                fontWeight={700}
                fontFamily="system-ui, monospace"
              >
                {value}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
