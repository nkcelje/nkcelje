'use client';

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  showValue?: boolean;
  color?: 'blue' | 'gold' | 'green' | 'red' | 'auto';
  size?: 'sm' | 'md';
  className?: string;
}

function getAutoColor(value: number): string {
  if (value >= 85) return 'gold';
  if (value >= 74) return 'green';
  if (value >= 60) return 'blue';
  if (value >= 48) return 'red';
  return 'red';
}

const COLOR_CLASSES = {
  blue: 'stat-bar-fill',
  gold: 'stat-bar-fill-gold',
  green: 'stat-bar-fill-green',
  red: 'stat-bar-fill-red',
};

const COLOR_TEXT = {
  blue: '#60a5fa',
  gold: '#fbbf24',
  green: '#34d399',
  red: '#f97316',
};

export function StatBar({
  label,
  value,
  max = 100,
  showValue = true,
  color = 'auto',
  size = 'md',
  className = '',
}: StatBarProps) {
  const resolvedColor = color === 'auto' ? getAutoColor(value) : color;
  const pct = Math.min(100, (value / max) * 100);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className={`text-text-secondary shrink-0 ${size === 'sm' ? 'text-[10px] w-24' : 'text-xs w-28'}`}
      >
        {label}
      </span>
      <div
        className={`flex-1 rounded-full overflow-hidden ${size === 'sm' ? 'h-1' : 'h-1.5'}`}
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${COLOR_CLASSES[resolvedColor as keyof typeof COLOR_CLASSES]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showValue && (
        <span
          className={`font-bold score-number shrink-0 ${size === 'sm' ? 'text-[11px] w-6' : 'text-xs w-7'}`}
          style={{ color: COLOR_TEXT[resolvedColor as keyof typeof COLOR_TEXT] }}
        >
          {value}
        </span>
      )}
    </div>
  );
}
