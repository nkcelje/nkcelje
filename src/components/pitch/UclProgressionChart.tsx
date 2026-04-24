'use client';

import { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { useT } from '@/context/I18nContext';
import { UCL_STAGES, type UclStageId } from '@/data/uclProjection';

/**
 * HSL-интерполяция: чем выше процент, тем зеленее; чем ниже — тем краснее.
 * 0°  — красный, 140° — зелёный.
 */
function colorForValue(v: number): string {
  const clamped = Math.max(0, Math.min(100, v));
  const hue = Math.round((clamped / 100) * 140);
  return `hsl(${hue}, 74%, 52%)`;
}

interface StageDatum {
  id: UclStageId;
  label: string;
  value: number;
  color: string;
}

export function UclProgressionChart() {
  const t = useT();

  const data = useMemo<StageDatum[]>(
    () =>
      UCL_STAGES.map((s) => ({
        id: s.id,
        label: t(`ucl.stage.${s.id}`),
        value: s.chance,
        color: colorForValue(s.chance),
      })),
    [t]
  );

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Центр по умолчанию — первый этап (ближайший матч клуба).
  const activeIdx = hoveredIdx ?? 0;
  const active = data[activeIdx];

  return (
    <div className="flex flex-col gap-3">
      <div
        className="text-[10px] uppercase tracking-widest"
        style={{ color: 'var(--text-muted)' }}
      >
        {t('ucl.title')}
      </div>

      {/* Donut */}
      <div className="relative" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={92}
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              stroke="none"
              isAnimationActive
              animationDuration={600}
              onMouseEnter={(_, idx) => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {data.map((d, i) => (
                <Cell
                  key={d.id}
                  fill={d.color}
                  opacity={hoveredIdx === null || hoveredIdx === i ? 1 : 0.45}
                  style={{ transition: 'opacity 150ms ease-out' }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Центр: процент + название активного этапа */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6 text-center">
          <div
            className="score-number font-black leading-none tabular-nums"
            style={{ color: active.color, fontSize: 32 }}
          >
            {active.value}%
          </div>
          <div
            className="text-[10px] uppercase tracking-widest mt-1.5 leading-tight"
            style={{ color: 'var(--text)' }}
          >
            {active.label}
          </div>
        </div>
      </div>

      {/* Легенда */}
      <div className="flex flex-col gap-1">
        {data.map((d, i) => {
          const dim = hoveredIdx !== null && hoveredIdx !== i;
          return (
            <button
              key={d.id}
              type="button"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex items-center gap-2 text-[11px] text-left px-1.5 py-1 rounded transition-colors"
              style={{
                opacity: dim ? 0.5 : 1,
                background:
                  hoveredIdx === i
                    ? 'color-mix(in srgb, var(--surface-3) 60%, transparent)'
                    : 'transparent',
              }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: d.color, boxShadow: `0 0 6px ${d.color}70` }}
                aria-hidden
              />
              <span className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                {d.label}
              </span>
              <span
                className="score-number font-bold tabular-nums"
                style={{ color: d.color }}
              >
                {d.value}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
