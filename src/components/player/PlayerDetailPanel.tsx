'use client';

import { useState } from 'react';
import type { Player, ScoreBreakdown } from '@/types';
import { useSquad } from '@/context/SquadContext';
import { getPlayerById } from '@/data/players';
import { useRecruits } from '@/data/recruitsStore';
import { SHORTLIST_CANDIDATES } from '@/data/shortlistCandidates';
import {
  setInjury,
  setLoanReturn,
  setWantExtend,
  setWantTerminate,
  usePlayerStatus,
} from '@/data/playerStatusStore';
import { useT } from '@/context/I18nContext';
import { translateScoreMessage } from '@/i18n/scoreMessage';
import { getPassportTag } from '@/lib/passport';
import { getScoreLabelKey } from '@/lib/scoring';
import { formatContractEnd, formatSalary, getSalaryAnnual } from '@/lib/playerFields';
import { BarRow } from '@/components/pitch/RightRail';

function synthBreakdown(player: Player): ScoreBreakdown {
  return {
    playerId: player.id,
    base: player.baseRating,
    modifiers: {
      positionFamiliarity: 0,
      roleFit: 0,
      chemistry: 0,
      tacticalFit: 0,
      matchInstructions: 0,
      opponentContext: 0,
      benchPenalty: 0,
    },
    total: player.baseRating,
    positionLabel: player.primaryPosition,
    warnings: [],
    positives: [],
  };
}

export function PlayerDetailPanel() {
  const { state, selectPlayer, removeFromLineup } = useSquad();
  const recruits = useRecruits();
  const t = useT();
  const { selectedPlayerId } = state;

  const player = selectedPlayerId
    ? (getPlayerById(selectedPlayerId) ??
       recruits.find((p) => p.id === selectedPlayerId) ??
       SHORTLIST_CANDIDATES.find((p) => p.id === selectedPlayerId) ??
       null)
    : null;
  const breakdown = selectedPlayerId
    ? (state.scores[selectedPlayerId] ?? (player ? synthBreakdown(player) : null))
    : null;

  const lineupSlotId = selectedPlayerId
    ? Object.entries(state.lineup).find(([, pid]) => pid === selectedPlayerId)?.[0] ?? null
    : null;

  if (!player || !breakdown) {
    return (
      <div className="rail-section" style={{ borderBottom: 0 }}>
        <div
          style={{
            padding: '40px 8px',
            textAlign: 'center',
            color: 'var(--ink-3)',
            fontSize: 12,
            border: '1px dashed var(--line)',
            borderRadius: 8,
          }}
        >
          {t('player.selectOnPitch')}
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--ink-4)' }}>
            {t('player.selectOnPitch.sub')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProfileBody
      player={player}
      breakdown={breakdown}
      onClose={() => selectPlayer(null)}
      onRemoveFromLineup={lineupSlotId ? () => removeFromLineup(lineupSlotId) : undefined}
    />
  );
}

function ProfileBody({
  player,
  breakdown,
  onClose,
  onRemoveFromLineup,
}: {
  player: Player;
  breakdown: ScoreBreakdown;
  onClose: () => void;
  onRemoveFromLineup?: () => void;
}) {
  const t = useT();
  const passport = getPassportTag(player);
  const initials = `${player.firstName[0]}${player.lastName[0]}`;
  const a = player.attributes;

  return (
    <div className="animate-slide-in-right">
      {/* Header strip */}
      <div
        className="rail-section"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 8,
        }}
      >
        <h3 style={{ margin: 0 }}>
          Player · {player.primaryPosition}
        </h3>
        <button type="button" className="icon-btn" onClick={onClose} title="Close">
          ×
        </button>
      </div>

      <div className="rail-section" style={{ borderBottom: 0 }}>
        {/* pcard-head */}
        <div className="pcard-head">
          <div className={`pcard-disc pp-${passport}`}>{initials}</div>
          <div>
            <div className="pcard-name">
              <span style={{ marginRight: 8 }}>{player.flag}</span>
              {player.firstName} {player.lastName}
            </div>
            <div className="pcard-meta">
              {player.club} · #{player.jerseyNumber ?? '—'} · {player.preferredRoles[0] ?? player.primaryPosition}
            </div>
          </div>
          <div className="pcard-ovr">
            {breakdown.total}
            <small>{t(getScoreLabelKey(breakdown.total))}</small>
          </div>
        </div>

        {/* kv-grid */}
        <div className="kv-grid">
          <Kv k={t('player.age')} v={`${player.age} ${t('filter.ageSuffix')}`} />
          <Kv k={t('player.foot')} v={t(`foot.${player.preferredFoot}`)} />
          <Kv k={t('player.height')} v={`${player.height} ${t('unit.cm')}`} />
          <Kv k={t('player.weight')} v={`${player.weight} ${t('unit.kg')}`} />
          <Kv k={t('player.contract')} v={formatContractEnd(player)} />
          <Kv k={t('col.salary')} v={`${formatSalary(getSalaryAnnual(player))}/y`} />
          <Kv k={t('player.value')} v={`€${player.marketValue.toFixed(1)}${t('unit.m')}`} />
          <Kv k={t('player.potential')} v={String(player.potential)} />
        </div>

        {/* Attribute bars (Algorythm 6) */}
        <div style={{ marginTop: 14 }}>
          <BarRow label={t('attr.pace')} value={a.pace} />
          <BarRow label={t('attr.finishing')} value={a.finishing} />
          <BarRow label={t('attr.passing')} value={a.passing} />
          <BarRow label={t('attr.creativity')} value={a.creativity} />
          <BarRow label={t('attr.defending')} value={a.defending} />
          <BarRow label={t('attr.physicality')} value={a.physicality} />
        </div>

        {/* Advanced bars */}
        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px dashed var(--line)',
          }}
        >
          <BarRow label={t('attr.tacticalIntelligence')} value={a.tacticalIntelligence} />
          <BarRow label={t('attr.pressResistance')} value={a.pressResistance} />
          <BarRow label={t('attr.ballProgression')} value={a.ballProgression} />
          <BarRow label={t('attr.duels')} value={a.duels} />
        </div>

        {/* Warnings / positives */}
        {(breakdown.warnings.length > 0 || breakdown.positives.length > 0) && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: '1px dashed var(--line)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {breakdown.warnings.map((w) => (
              <div
                key={w.key}
                style={{
                  fontSize: 11,
                  color: 'var(--bad)',
                  display: 'flex',
                  gap: 6,
                }}
              >
                <span>⚠</span>
                <span>{translateScoreMessage(t, w)}</span>
              </div>
            ))}
            {breakdown.positives.map((p) => (
              <div
                key={p.key}
                style={{ fontSize: 11, color: 'var(--good)' }}
              >
                {translateScoreMessage(t, p)}
              </div>
            ))}
          </div>
        )}

        {/* Score modifiers */}
        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px dashed var(--line)',
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'var(--ink-3)',
              marginBottom: 8,
            }}
          >
            {t('player.breakdown')}
          </div>
          <Modifiers breakdown={breakdown} />
        </div>

        {/* Status & decisions */}
        <StatusSection player={player} />

        {/* Tags */}
        {player.styleTags.length > 0 && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: '1px dashed var(--line)',
            }}
          >
            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--ink-3)',
                marginBottom: 8,
              }}
            >
              {t('player.style')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {player.styleTags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9.5,
                    padding: '2px 6px',
                    background: 'var(--bg-2)',
                    color: 'var(--ink-2)',
                    border: '1px solid var(--line)',
                    borderRadius: 3,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {t(`styleTag.${tag}`)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="btn-row">
          <button type="button" className="btn primary">
            {t('player.profile')}
          </button>
          {onRemoveFromLineup ? (
            <button type="button" className="btn ghost" onClick={onRemoveFromLineup}>
              {t('player.removeFromLineup')}
            </button>
          ) : (
            <button type="button" className="btn ghost">
              {t('roster.addToShortlist')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div className="kv">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  );
}

function StatusSection({ player }: { player: Player }) {
  const t = useT();
  const overlay = usePlayerStatus(player.id);
  const wantExtend = overlay.wantExtend ?? player.wantExtend ?? false;
  const wantTerminate = overlay.wantTerminate ?? player.wantTerminate ?? false;
  const injury = overlay.injury ?? player.injury;
  const loanReturn = overlay.loanReturn ?? player.loanReturn;

  const [injuryDate, setInjuryDate] = useState(injury?.recoveryDate ?? '');
  const [loanDate, setLoanDate] = useState(loanReturn?.date ?? '');

  return (
    <div
      style={{
        marginTop: 12,
        paddingTop: 10,
        borderTop: '1px dashed var(--line)',
      }}
    >
      <div
        style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: 'var(--ink-3)',
          marginBottom: 8,
        }}
      >
        {t('player.status.title')}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <FlagButton
          label={t('player.status.wantExtend')}
          active={wantExtend}
          color="var(--celje-yellow)"
          onClick={() => setWantExtend(player.id, !wantExtend)}
        />
        <FlagButton
          label={t('player.status.wantTerminate')}
          active={wantTerminate}
          color="var(--bad)"
          onClick={() => setWantTerminate(player.id, !wantTerminate)}
        />
      </div>

      {/* Injury */}
      <DateRow
        label={t('player.status.injury')}
        active={!!injury}
        valueLabel={t('player.status.injuryRecover')}
        value={injuryDate}
        onChange={setInjuryDate}
        accent="var(--bad)"
        onSave={() => {
          if (injuryDate.trim()) setInjury(player.id, { recoveryDate: injuryDate.trim() });
        }}
        onClear={() => {
          setInjury(player.id, null);
          setInjuryDate('');
        }}
        clearLabel={t('player.status.clear')}
        setLabel={t('player.status.set')}
      />

      {/* Loan return */}
      <DateRow
        label={t('player.status.loanReturn')}
        active={!!loanReturn}
        valueLabel={t('player.status.loanReturnDate')}
        value={loanDate}
        onChange={setLoanDate}
        accent="var(--info)"
        onSave={() => {
          if (loanDate.trim()) setLoanReturn(player.id, { date: loanDate.trim() });
        }}
        onClear={() => {
          setLoanReturn(player.id, null);
          setLoanDate('');
        }}
        clearLabel={t('player.status.clear')}
        setLabel={t('player.status.set')}
      />
    </div>
  );
}

function FlagButton({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: '6px 8px',
        fontSize: 10.5,
        textAlign: 'left',
        background: active ? color : 'var(--bg-2)',
        color: active ? 'var(--accent-ink)' : 'var(--ink-1)',
        border: `1px solid ${active ? color : 'var(--line)'}`,
        borderRadius: 4,
        cursor: 'pointer',
        fontWeight: active ? 600 : 500,
      }}
    >
      <span style={{ marginRight: 6 }}>{active ? '✓' : '○'}</span>
      {label}
    </button>
  );
}

function DateRow({
  label,
  active,
  valueLabel,
  value,
  onChange,
  onSave,
  onClear,
  accent,
  clearLabel,
  setLabel,
}: {
  label: string;
  active: boolean;
  valueLabel: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onClear: () => void;
  accent: string;
  clearLabel: string;
  setLabel: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 0',
        fontSize: 11,
      }}
    >
      <span
        style={{
          flex: 1,
          color: active ? accent : 'var(--ink-2)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontSize: 10,
          fontWeight: 600,
        }}
        title={valueLabel}
      >
        {label}
      </span>
      <input
        className="input"
        placeholder="MM.YYYY"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 80, padding: '4px 6px', fontSize: 10.5, textAlign: 'center' }}
      />
      {active ? (
        <button
          type="button"
          onClick={onClear}
          style={{
            background: 'none',
            border: '1px solid var(--line)',
            color: 'var(--ink-3)',
            padding: '4px 6px',
            fontSize: 10,
            borderRadius: 3,
            cursor: 'pointer',
          }}
        >
          {clearLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onSave}
          style={{
            background: accent,
            color: 'var(--accent-ink)',
            border: 0,
            padding: '4px 8px',
            fontSize: 10,
            borderRadius: 3,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {setLabel}
        </button>
      )}
    </div>
  );
}

function Modifiers({ breakdown }: { breakdown: ScoreBreakdown }) {
  const t = useT();
  const rows: { key: keyof ScoreBreakdown['modifiers']; labelKey: string }[] = [
    { key: 'positionFamiliarity', labelKey: 'mod.positionFamiliarity' },
    { key: 'roleFit', labelKey: 'mod.roleFit' },
    { key: 'chemistry', labelKey: 'mod.chemistry' },
    { key: 'tacticalFit', labelKey: 'mod.tacticalFit' },
    { key: 'matchInstructions', labelKey: 'mod.matchInstructions' },
    { key: 'opponentContext', labelKey: 'mod.opponentContext' },
    { key: 'benchPenalty', labelKey: 'mod.benchPenalty' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {rows.map(({ key, labelKey }) => {
        const value = breakdown.modifiers[key];
        if (value === 0 && key !== 'positionFamiliarity') return null;
        const color = value > 0 ? 'var(--good)' : value < 0 ? 'var(--bad)' : 'var(--ink-3)';
        return (
          <div
            key={key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
            }}
          >
            <span style={{ color: 'var(--ink-2)' }}>{t(labelKey)}</span>
            <span className="mono" style={{ color, fontWeight: 600 }}>
              {value > 0 ? '+' : ''}
              {value}
            </span>
          </div>
        );
      })}
      <div
        style={{
          marginTop: 6,
          paddingTop: 6,
          borderTop: '1px dashed var(--line)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'var(--ink-1)',
        }}
      >
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          {t('breakdown.dynamicScore')}
        </span>
        <span
          className="mono"
          style={{ color: 'var(--celje-yellow)', fontWeight: 700, fontSize: 14 }}
        >
          {breakdown.total}
        </span>
      </div>
    </div>
  );
}
