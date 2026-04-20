import React from 'react';

/**
 * NK Celje inspired crest — stylised SVG reproduction.
 * Navy roundel with stars, three castle towers, football and NK CELJE text.
 */
export function CeljeLogo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block' }}
      aria-label="NK Celje"
    >
      {/* Outer ring */}
      <circle cx="50" cy="50" r="48" fill="#0a1530" stroke="#ffffff" strokeWidth="2" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="#f4c430" strokeWidth="0.5" opacity="0.4" />

      {/* Top three stars (Counts of Celje heritage) */}
      <g fill="#ffffff">
        <Star cx={38} cy={22} size={3} />
        <Star cx={50} cy={18} size={3.5} />
        <Star cx={62} cy={22} size={3} />
      </g>

      {/* Three towers / battlements on top */}
      <g fill="#ffffff">
        <rect x={32} y={30} width={7} height={10} />
        <rect x={46.5} y={28} width={7} height={12} />
        <rect x={61} y={30} width={7} height={10} />
        {/* Battlement crenellations */}
        <rect x={32} y={29} width={2} height={2} />
        <rect x={36} y={29} width={2} height={2} />
        <rect x={46.5} y={27} width={2} height={2} />
        <rect x={50} y={27} width={2} height={2} />
        <rect x={53.5} y={27} width={2} height={2} />
        <rect x={61} y={29} width={2} height={2} />
        <rect x={65} y={29} width={2} height={2} />
      </g>

      {/* Football (centre) */}
      <g transform="translate(50,60)">
        <circle r="14" fill="#ffffff" stroke="#0a1530" strokeWidth="1" />
        {/* Football pentagon pattern */}
        <polygon
          points="0,-7 6.6,-2.2 4.1,5.7 -4.1,5.7 -6.6,-2.2"
          fill="#0a1530"
        />
        <line x1="0" y1="-7" x2="0" y2="-13.5" stroke="#0a1530" strokeWidth="1" />
        <line x1="6.6" y1="-2.2" x2="12.5" y2="-5.5" stroke="#0a1530" strokeWidth="1" />
        <line x1="-6.6" y1="-2.2" x2="-12.5" y2="-5.5" stroke="#0a1530" strokeWidth="1" />
        <line x1="4.1" y1="5.7" x2="8" y2="11.5" stroke="#0a1530" strokeWidth="1" />
        <line x1="-4.1" y1="5.7" x2="-8" y2="11.5" stroke="#0a1530" strokeWidth="1" />
      </g>

      {/* NOGOMETNI KLUB CELJE text arc */}
      <text
        fill="#ffffff"
        fontSize="6"
        fontWeight="800"
        letterSpacing="0.5"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
      >
        <textPath
          href="#celje-top-arc"
          startOffset="50%"
        >
          NOGOMETNI KLUB
        </textPath>
      </text>
      <text
        fill="#ffffff"
        fontSize="7"
        fontWeight="800"
        letterSpacing="1.5"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
      >
        <textPath
          href="#celje-bottom-arc"
          startOffset="50%"
        >
          CELJE
        </textPath>
      </text>

      <defs>
        <path
          id="celje-top-arc"
          d="M 12 50 A 38 38 0 0 1 88 50"
          fill="none"
        />
        <path
          id="celje-bottom-arc"
          d="M 18 62 A 32 32 0 0 0 82 62"
          fill="none"
        />
      </defs>
    </svg>
  );
}

function Star({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? size : size * 0.4;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    points.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return <polygon points={points.join(' ')} />;
}
