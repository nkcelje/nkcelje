import type { FitTag } from '@/types';

interface BadgeProps {
  label: string;
  variant?: 'blue' | 'green' | 'gold' | 'red' | 'gray' | 'cyan';
  size?: 'sm' | 'xs';
  className?: string;
}

const VARIANTS = {
  blue: 'bg-accent/15 text-accent-bright border-accent/25',
  green: 'bg-score-elite/15 text-score-elite border-score-elite/25',
  gold: 'bg-gold/15 text-gold-bright border-gold/25',
  red: 'bg-score-poor/15 text-score-poor border-score-poor/25',
  gray: 'bg-surface-4/50 text-text-secondary border-border-dim',
  cyan: 'bg-cyan/15 text-cyan-bright border-cyan/25',
};

export function Badge({ label, variant = 'gray', size = 'sm', className = '' }: BadgeProps) {
  const sizes = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5';
  return (
    <span
      className={`inline-block rounded-md border font-medium uppercase tracking-wide leading-tight ${sizes} ${VARIANTS[variant]} ${className}`}
    >
      {label}
    </span>
  );
}

export function FitTagBadge({ tag }: { tag: FitTag }) {
  const config: Record<FitTag, { variant: BadgeProps['variant']; icon: string }> = {
    'Strong tactical fit': { variant: 'green', icon: '✦' },
    'Low chemistry risk': { variant: 'green', icon: '⬡' },
    'Immediate starter': { variant: 'blue', icon: '▲' },
    'Bench upgrade': { variant: 'cyan', icon: '↑' },
    'Development signing': { variant: 'gold', icon: '◈' },
    'Rotational': { variant: 'gray', icon: '⇄' },
    'High potential': { variant: 'gold', icon: '⋆' },
    'Set piece specialist': { variant: 'cyan', icon: '◎' },
  };

  const { variant, icon } = config[tag] ?? { variant: 'gray' as const, icon: '·' };

  return (
    <Badge label={`${icon} ${tag}`} variant={variant} size="xs" />
  );
}
