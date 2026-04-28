'use client';

import type { Player, FormationSlot } from '@/types';
import { useColumnPrefs, type ColumnKey } from '@/context/ColumnPrefsContext';
import { useT } from '@/context/I18nContext';
import { usePlayerStatuses, type PlayerStatusOverlay } from '@/data/playerStatusStore';
import {
  formatContractEnd,
  formatSalary,
  getSalaryAnnual,
  shortName,
} from '@/lib/playerFields';
import { getPassportTag } from '@/lib/passport';

interface PositionTableProps {
  slot: FormationSlot;
  /** Eligible players (primary or secondary on this position). Order: starter first, then alternatives by rating desc. */
  candidates: Player[];
  starterId: string | null;
  selectedPlayerId: string | null;
  selectedSlotId: string | null;
  scores: Record<string, { total: number }>;
  onPickRow: (playerId: string) => void;
  onAssignToSlot: (playerId: string) => void;
  onSlotHeadClick: () => void;
}

function tierClass(ovr: number) {
  if (ovr >= 85) return 't-elite';
  if (ovr >= 80) return 't-good';
  if (ovr >= 72) return 't-mid';
  return 't-low';
}

const EXTRA_COL_ORDER: ColumnKey[] = [
  'contract',
  'salary',
  'injury',
  'loanReturn',
  'wantExtend',
  'wantTerminate',
];

export function PositionTable({
  slot,
  candidates,
  starterId,
  selectedPlayerId,
  selectedSlotId,
  scores,
  onPickRow,
  onAssignToSlot,
  onSlotHeadClick,
}: PositionTableProps) {
  const { prefs } = useColumnPrefs();
  const overlays = usePlayerStatuses();
  const t = useT();

  const enabledExtras = EXTRA_COL_ORDER.filter((c) => prefs[c]);

  // Footer aggregate: sum annual salary across every player attached to the slot.
  const showSalaryTotal = prefs.salaryTotal && candidates.length > 0;
  const salaryTotal = showSalaryTotal
    ? candidates.reduce((acc, p) => acc + getSalaryAnnual(p), 0)
    : 0;

  return (
    <div
      className={`ptable ${selectedSlotId === slot.id ? 'selected-slot' : ''}`}
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
    >
      <div className="ptable-head" onClick={onSlotHeadClick}>
        <span>{slot.label}</span>
        <span className={`pos-tag ${starterId ? 'starter' : ''}`}>
          {candidates.length} pl.
        </span>
      </div>

      {candidates.length === 0 ? (
        <div className="ptable-row">
          <div className="ptable-row-main">
            <span className="ptable-name muted">—</span>
          </div>
        </div>
      ) : null}
      {candidates.length > 0 && (
        candidates.map((p) => {
          const overlay = overlays[p.id] ?? {};
          const merged = { ...p, ...overlay };
          const rowFlag = pickRowFlag(merged);
          const passport = getPassportTag(p);
          const isStarter = p.id === starterId;
          const isSelected = p.id === selectedPlayerId;
          const ovr = scores[p.id]?.total ?? p.baseRating;

          // Build the chip list — only render chips that have meaningful
          // content. Boolean flags only emit a chip when set, so disabling
          // them simply removes a slot of clutter.
          const chips = enabledExtras
            .map((col) => renderChip(col, p, overlay))
            .filter((x): x is JSX.Element => x !== null);

          return (
            <div
              key={p.id}
              className={`ptable-row pp-${passport} ${isStarter ? 'starter' : ''} ${isSelected ? 'active' : ''} ${rowFlag}`}
              onClick={() => onPickRow(p.id)}
              onDoubleClick={() => !isStarter && onAssignToSlot(p.id)}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/player-id', p.id);
                e.dataTransfer.effectAllowed = 'move';
                (e.currentTarget as HTMLDivElement).classList.add('dragging');
              }}
              onDragEnd={(e) => {
                (e.currentTarget as HTMLDivElement).classList.remove('dragging');
              }}
              title={
                isStarter
                  ? 'Стартовый состав. Клик — выбрать.'
                  : 'Клик — выбрать. Двойной клик — поставить в старт.'
              }
            >
              <div className="ptable-row-main">
                <span className="ptable-name">{shortName(p)}</span>
                {prefs.rating && (
                  <span className={`ptable-cell rating ${tierClass(ovr)}`}>{ovr}</span>
                )}
              </div>
              {chips.length > 0 && (
                <div className="ptable-row-extras">{chips}</div>
              )}
            </div>
          );
        })
      )}
      {showSalaryTotal && (
        <div className="ptable-foot">
          <span className="lbl">{t('ptable.total')}</span>
          <span className="val">{formatSalary(salaryTotal)}</span>
        </div>
      )}
    </div>
  );
}

function pickRowFlag(p: Player): string {
  if (p.wantTerminate) return 'want-terminate';
  if (p.wantExtend) return 'want-extend';
  if (p.injury) return 'injury';
  if (p.loanReturn) return 'loan-return';
  return '';
}

function renderChip(col: ColumnKey, player: Player, overlay: PlayerStatusOverlay): JSX.Element | null {
  const merged = { ...player, ...overlay };
  switch (col) {
    case 'contract':
      return (
        <span key={col} className="ptable-chip contract" title="Контракт">
          {formatContractEnd(player)}
        </span>
      );
    case 'salary':
      return (
        <span key={col} className="ptable-chip salary" title="Зарплата">
          {formatSalary(getSalaryAnnual(player))}
        </span>
      );
    case 'injury':
      return merged.injury ? (
        <span key={col} className="ptable-chip injury" title={merged.injury.reason ?? 'Травма'}>
          ✚ {merged.injury.recoveryDate}
        </span>
      ) : null;
    case 'loanReturn':
      return merged.loanReturn ? (
        <span key={col} className="ptable-chip loan" title={merged.loanReturn.fromClub ?? 'Возврат из аренды'}>
          ⤴ {merged.loanReturn.date}
        </span>
      ) : null;
    case 'wantExtend':
      return merged.wantExtend ? (
        <span key={col} className="ptable-chip extend" title="Хотим продлить">★</span>
      ) : null;
    case 'wantTerminate':
      return merged.wantTerminate ? (
        <span key={col} className="ptable-chip terminate" title="Хотим разорвать">✕</span>
      ) : null;
    default:
      return null;
  }
}
