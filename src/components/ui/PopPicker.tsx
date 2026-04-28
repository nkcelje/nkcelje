'use client';

import { useEffect, useRef, useState } from 'react';

export interface PopPickerOption<V extends string = string> {
  value: V;
  label: string;
}

interface PopPickerProps<V extends string = string> {
  label: string;
  value: string;
  options: PopPickerOption<V>[];
  current: V;
  onChange: (value: V) => void;
  align?: 'left' | 'right';
  valueColor?: string;
}

export function PopPicker<V extends string = string>({
  label,
  value,
  options,
  current,
  onChange,
  align = 'left',
  valueColor = 'var(--ink-0)',
}: PopPickerProps<V>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="pop-trigger"
        onClick={() => setOpen((o) => !o)}
      >
        <span
          className="upper mono"
          style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.14em' }}
        >
          {label}
        </span>
        <span
          className="mono"
          style={{ fontSize: 12, color: valueColor, fontWeight: 600 }}
        >
          {value}
        </span>
        <span style={{ color: 'var(--ink-3)', fontSize: 9 }}>▾</span>
      </button>
      {open && (
        <div className="pop-menu" style={align === 'right' ? { right: 0 } : { left: 0 }}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`pop-opt ${opt.value === current ? 'on' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
              {opt.value === current && (
                <span style={{ color: 'var(--celje-yellow)', marginLeft: 8 }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
