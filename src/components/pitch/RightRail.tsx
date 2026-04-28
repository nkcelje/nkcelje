'use client';

import { useSquad } from '@/context/SquadContext';
import { useT } from '@/context/I18nContext';
import { UCL_STAGES } from '@/data/uclProjection';
import { RECENT_MATCHES } from '@/data/recentMatches';
import { getScoreLabelKey } from '@/lib/scoring';

export function BarRow({
  label,
  value,
  customRight,
}: {
  label: string;
  value: number;
  customRight?: string;
}) {
  return (
    <div className="bar-row">
      <span className="lbl">{label}</span>
      <div className="bar"><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
      <span className="val">{customRight ?? value}</span>
    </div>
  );
}

export function TeamRatingBlock() {
  const { state } = useSquad();
  const t = useT();
  const ovr = state.teamScore;
  const styleLabel = t(`style.${state.tacticalSettings.playingStyle}`);

  return (
    <div className="rail-section">
      <h3>{t('stats.rating')}</h3>
      <div className="rating-block">
        <div className="big-rating">{ovr}</div>
        <div className="rating-meta">
          <div className="rating-tag">{t(getScoreLabelKey(ovr))}</div>
          <div className="rating-label mono">
            OVR · {state.formation} · {styleLabel}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <BarRow label={t('stats.chemistry')} value={state.chemistryScore} />
        <BarRow label={t('stats.tacticalFit')} value={state.tacticalFitScore} />
        <BarRow label={t('stats.style')} value={84} customRight={styleLabel} />
      </div>
    </div>
  );
}

export function UclFunnel() {
  const t = useT();
  return (
    <div className="rail-section">
      <h3>{t('ucl.title')}</h3>
      <div className="funnel">
        {UCL_STAGES.map((s) => {
          const dim = s.chance < 10;
          return (
            <div key={s.id} className={`funnel-row ${dim ? 'dim' : ''}`}>
              <span className="stage">{t(`ucl.stage.${s.id}`)}</span>
              <span className="pct mono">{s.chance}%</span>
              <div className="funnel-bar">
                <i style={{ width: `${s.chance}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FormStrip() {
  const matches = RECENT_MATCHES;
  const wins = matches.filter((m) => m.result === 'W').length;
  const draws = matches.filter((m) => m.result === 'D').length;
  const losses = matches.filter((m) => m.result === 'L').length;

  return (
    <div className="rail-section" style={{ borderBottom: 0 }}>
      <h3>Last 8 matches</h3>
      <div className="form-strip">
        {matches.map((m, i) => (
          <div
            key={i}
            className={`bar-i ${m.result}`}
            title={`${m.opponent} ${m.score}`}
          >
            <i style={{ height: `${(m.rating / 10) * 100}%` }} />
            <span className="res">{m.result}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 22,
          fontSize: 10,
          color: 'var(--ink-3)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span>{matches[0].date}</span>
        <span style={{ color: 'var(--ink-1)' }}>
          W:{wins} D:{draws} L:{losses}
        </span>
        <span>{matches[matches.length - 1].date}</span>
      </div>
    </div>
  );
}
