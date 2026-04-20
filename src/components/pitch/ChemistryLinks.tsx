'use client';

import type { ChemistryLink, Formation } from '@/types';
import { getChemistryColorClass } from '@/lib/chemistry';

interface ChemistryLinksProps {
  links: ChemistryLink[];
  formation: Formation;
  pitchWidth: number;
  pitchHeight: number;
}

export function ChemistryLinks({ links, formation, pitchWidth, pitchHeight }: ChemistryLinksProps) {
  const slotPositions: Record<string, { x: number; y: number }> = {};

  for (const slot of formation.slots) {
    slotPositions[slot.id] = {
      x: (slot.x / 100) * pitchWidth,
      y: (slot.y / 100) * pitchHeight,
    };
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={pitchWidth}
      height={pitchHeight}
      style={{ zIndex: 1 }}
    >
      <defs>
        <filter id="link-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {links.map((link) => {
        const p1 = slotPositions[link.slotId1];
        const p2 = slotPositions[link.slotId2];
        if (!p1 || !p2) return null;

        const color = getChemistryColorClass(link.strength);
        const opacity = link.strength === 'strong' ? 0.75 : link.strength === 'medium' ? 0.5 : 0.3;
        const strokeWidth = link.strength === 'strong' ? 1.5 : link.strength === 'medium' ? 1 : 0.75;

        const key = `${link.slotId1}-${link.slotId2}`;

        // Mid point for label
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;

        if (link.strength === 'weak' && link.value <= 0) {
          // Only draw a faint dash for weak/negative
          return (
            <line
              key={key}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={color}
              strokeWidth={0.75}
              strokeOpacity={0.2}
              strokeDasharray="3 4"
            />
          );
        }

        return (
          <g key={key}>
            {/* Glow layer */}
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={color}
              strokeWidth={strokeWidth * 3}
              strokeOpacity={0.12}
            />
            {/* Main line */}
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeOpacity={opacity}
              strokeDasharray={link.strength === 'medium' ? '4 3' : undefined}
            />
            {/* Value dot at midpoint */}
            {link.strength === 'strong' && (
              <circle
                cx={mx}
                cy={my}
                r={4}
                fill="#04060f"
                stroke={color}
                strokeWidth={1}
                strokeOpacity={0.8}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
