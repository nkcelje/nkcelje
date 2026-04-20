'use client';

import type { TacticalSettings, OpponentStyle, GameState, PlayingStyle } from '@/types';
import { useSquad } from '@/context/SquadContext';
import { useT } from '@/context/I18nContext';

interface SliderProps {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  color?: string;
}

function TacticsSlider({ label, leftLabel, rightLabel, value, onChange, min = 1, max = 10, color = '#3b82f6' }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-text-primary">{label}</span>
        <span className="text-[11px] font-bold score-number" style={{ color }}>{value}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-text-muted w-14 text-right shrink-0 leading-tight">{leftLabel}</span>
        <div className="flex-1 relative">
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full"
            style={{
              background: `linear-gradient(90deg, ${color} ${pct}%, rgba(255,255,255,0.08) ${pct}%)`,
            }}
          />
        </div>
        <span className="text-[9px] text-text-muted w-14 shrink-0 leading-tight">{rightLabel}</span>
      </div>
    </div>
  );
}

interface ToggleButtonProps {
  label: string;
  active: boolean;
  onToggle: () => void;
  color?: string;
}

function ToggleButton({ label, active, onToggle, color = '#3b82f6' }: ToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 border ${
        active
          ? 'text-white border-transparent'
          : 'bg-surface-3 text-text-secondary border-border-subtle hover:bg-surface-4 hover:text-text-primary'
      }`}
      style={active ? { background: color, boxShadow: `0 0 10px ${color}40` } : {}}
    >
      {label}
    </button>
  );
}

interface SelectButtonGroupProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (v: T) => void;
  color?: string;
}

function SelectButtonGroup<T extends string>({
  label,
  options,
  selected,
  onSelect,
  color = '#3b82f6',
}: SelectButtonGroupProps<T>) {
  return (
    <div className="space-y-1.5">
      <div className="text-[11px] font-semibold text-text-primary">{label}</div>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 border ${
              selected === opt.value
                ? 'text-white border-transparent'
                : 'bg-surface-3 text-text-secondary border-border-subtle hover:bg-surface-4'
            }`}
            style={selected === opt.value ? { background: color, boxShadow: `0 0 8px ${color}40` } : {}}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TacticalPanel() {
  const { state, setTactics } = useSquad();
  const tac = state.tacticalSettings;
  const t = useT();

  const update = <K extends keyof TacticalSettings>(key: K, value: TacticalSettings[K]) =>
    setTactics({ [key]: value } as Partial<TacticalSettings>);

  return (
    <div className="space-y-6">
      {/* In-Possession */}
      <Section title={t('tac.section.inPossession')} icon="⚡">
        <TacticsSlider
          label={t('tac.slider.pressing')}
          leftLabel={t('tac.slider.pressing.low')}
          rightLabel={t('tac.slider.pressing.high')}
          value={tac.pressingIntensity}
          onChange={(v) => update('pressingIntensity', v)}
          color="#3b82f6"
        />
        <TacticsSlider
          label={t('tac.slider.possession')}
          leftLabel={t('tac.slider.possession.counter')}
          rightLabel={t('tac.slider.possession.control')}
          value={tac.possessionFocus}
          onChange={(v) => update('possessionFocus', v)}
          color="#06b6d4"
        />
        <TacticsSlider
          label={t('tac.slider.width')}
          leftLabel={t('tac.slider.width.narrow')}
          rightLabel={t('tac.slider.width.wide')}
          value={tac.width}
          onChange={(v) => update('width', v)}
          color="#06b6d4"
        />
        <TacticsSlider
          label={t('tac.slider.directness')}
          leftLabel={t('tac.slider.directness.patient')}
          rightLabel={t('tac.slider.directness.direct')}
          value={tac.directness}
          onChange={(v) => update('directness', v)}
          color="#f59e0b"
        />
      </Section>

      {/* Out of Possession */}
      <Section title={t('tac.section.outOfPossession')} icon="🛡️">
        <TacticsSlider
          label={t('tac.slider.defLine')}
          leftLabel={t('tac.slider.defLine.low')}
          rightLabel={t('tac.slider.defLine.high')}
          value={tac.defensiveLineHeight}
          onChange={(v) => update('defensiveLineHeight', v)}
          color="#ef4444"
        />
        <TacticsSlider
          label={t('tac.slider.mentality')}
          leftLabel={t('tac.slider.mentality.defensive')}
          rightLabel={t('tac.slider.mentality.attacking')}
          value={tac.attackingMentality}
          onChange={(v) => update('attackingMentality', v)}
          color="#10b981"
        />
        <div className="flex flex-wrap gap-2 pt-1">
          <ToggleButton
            label={t('tac.counterPress')}
            active={tac.counterPress}
            onToggle={() => update('counterPress', !tac.counterPress)}
            color="#f97316"
          />
          <ToggleButton
            label={t('tac.highLine')}
            active={tac.highLine}
            onToggle={() => update('highLine', !tac.highLine)}
            color="#ef4444"
          />
        </div>
      </Section>

      {/* Playing Style */}
      <Section title={t('tac.section.playingStyle')} icon="🎭">
        <SelectButtonGroup<PlayingStyle>
          label={t('tac.identity')}
          options={(['balanced', 'tiki-taka', 'gegenpressing', 'counter-attack', 'direct'] as PlayingStyle[]).map((v) => ({
            value: v,
            label: t(`style.${v}`),
          }))}
          selected={tac.playingStyle}
          onSelect={(v) => update('playingStyle', v)}
          color="#7c3aed"
        />
      </Section>

      {/* Match Context */}
      <Section title={t('tac.section.matchContext')} icon="📊">
        <SelectButtonGroup<GameState>
          label={t('tac.gameScore')}
          options={(['leading', 'drawing', 'chasing'] as GameState[]).map((v) => ({
            value: v,
            label: t(`tac.gameState.${v}`),
          }))}
          selected={tac.gameState}
          onSelect={(v) => update('gameState', v)}
          color="#f59e0b"
        />
        <SelectButtonGroup<OpponentStyle>
          label={t('tac.opponentStyle')}
          options={(['balanced', 'high-press', 'low-block', 'possession', 'counter-attack', 'direct'] as OpponentStyle[]).map((v) => ({
            value: v,
            label: t(`tac.opp.${v}`),
          }))}
          selected={tac.opponentStyle}
          onSelect={(v) => update('opponentStyle', v)}
          color="#06b6d4"
        />
      </Section>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-bold text-text-primary uppercase tracking-wide">{title}</span>
        <div className="flex-1 h-px bg-border-subtle ml-1" />
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
