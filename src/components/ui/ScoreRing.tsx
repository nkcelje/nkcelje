'use client';

import { getScoreColor } from '@/lib/scoring';

interface ScoreRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  animate?: boolean;
  className?: string;
}

const SIZES = {
  sm: { ring: 36, stroke: 3, font: 'text-sm', labelFont: 'text-[8px]' },
  md: { ring: 52, stroke: 4, font: 'text-lg', labelFont: 'text-[9px]' },
  lg: { ring: 72, stroke: 5, font: 'text-2xl', labelFont: 'text-[10px]' },
  xl: { ring: 96, stroke: 6, font: 'text-4xl', labelFont: 'text-xs' },
};

export function ScoreRing({
  score,
  size = 'md',
  showLabel = false,
  animate = false,
  className = '',
}: ScoreRingProps) {
  const { ring, stroke, font, labelFont } = SIZES[size];
  const radius = (ring - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const fill = Math.min(100, Math.max(0, score)) / 100;
  const strokeDashoffset = circumference * (1 - fill);
  const color = getScoreColor(score);
  const cx = ring / 2;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: ring, height: ring }}
    >
      <svg
        width={ring}
        height={ring}
        viewBox={`0 0 ${ring} ${ring}`}
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cx}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx={cx}
          cy={cx}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 4px ${color}80)`,
            transition: animate ? 'stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1)' : undefined,
          }}
        />
      </svg>

      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-bold score-number leading-none ${font}`}
          style={{ color }}
        >
          {score}
        </span>
        {showLabel && (
          <span className={`text-text-muted uppercase tracking-widest mt-0.5 ${labelFont}`}>
            OVR
          </span>
        )}
      </div>
    </div>
  );
}
