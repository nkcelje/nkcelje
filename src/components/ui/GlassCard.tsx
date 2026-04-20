import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  glowColor?: string;
  onClick?: () => void;
  as?: 'div' | 'section' | 'article';
}

export function GlassCard({
  children,
  className = '',
  glow = false,
  glowColor = 'rgba(59,130,246,0.2)',
  onClick,
  as: Tag = 'div',
}: GlassCardProps) {
  const glowStyle = glow ? { boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 20px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.06)` } : {};

  return (
    <Tag
      className={`glass-card rounded-panel ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={glowStyle}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}
