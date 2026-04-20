'use client';

import { useState } from 'react';
import { FootballPitch } from '@/components/pitch/FootballPitch';
import { PlayerDetailPanel } from '@/components/player/PlayerDetailPanel';
import { RosterPanel } from '@/components/pitch/RosterPanel';
import { TeamStatsBar } from '@/components/pitch/TeamStatsBar';
import { TacticalPanel } from '@/components/tactical/TacticalPanel';
import { useSquad } from '@/context/SquadContext';
import { useT } from '@/context/I18nContext';

type TabId = 'roster' | 'player';

export default function SquadBuilderPage() {
  const { state, selectPlayer } = useSquad();
  const t = useT();
  const [activeTab, setActiveTab] = useState<TabId>('roster');

  const hasSelectedPlayer = !!state.selectedPlayerId;
  const effectiveTab: TabId = hasSelectedPlayer ? 'player' : 'roster';

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ── Left: Team stats + Tactics ── */}
      <aside
        className="w-[310px] border-r border-border-subtle flex flex-col shrink-0 overflow-hidden"
        style={{ background: 'var(--surface-1)' }}
      >
        <div className="px-4 py-3 border-b border-border-subtle">
          <div className="text-[10px] uppercase tracking-widest text-text-muted mb-1">{t('squad.header')}</div>
          <div className="text-xs text-text-secondary">
            {t('squad.subheader')}
          </div>
        </div>

        {/* Team stats compact */}
        <div className="px-4 py-3 border-b border-border-subtle">
          <TeamStatsBar compact />
        </div>

        {/* Tactics panel */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="text-[10px] uppercase tracking-widest text-text-muted mb-3">{t('squad.tactics')}</div>
          <TacticalPanel />
        </div>
      </aside>

      {/* ── Centre: Pitch ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start py-6 px-4">
          <FootballPitch />
        </div>
      </div>

      {/* ── Right: Roster / Player ── */}
      <aside
        className="w-[320px] border-l border-border-subtle flex flex-col shrink-0 overflow-hidden"
        style={{ background: 'var(--surface-1)' }}
      >
        <div className="flex border-b border-border-subtle shrink-0">
          <PanelTab
            label={t('squad.tabs.roster')}
            icon="👥"
            active={effectiveTab === 'roster'}
            onClick={() => { selectPlayer(null); setActiveTab('roster'); }}
          />
          <PanelTab
            label={t('squad.tabs.player')}
            icon="👤"
            active={effectiveTab === 'player'}
            onClick={() => { /* selection-driven */ }}
            disabled={!hasSelectedPlayer}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          {effectiveTab === 'player' && hasSelectedPlayer && <PlayerDetailPanel />}
          {effectiveTab === 'roster' && <RosterPanel />}
        </div>
      </aside>
    </div>
  );
}

function PanelTab({
  label,
  icon,
  active,
  onClick,
  disabled,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all duration-150 ${
        active
          ? 'text-accent border-b-2 border-accent bg-accent/5'
          : disabled
          ? 'text-text-dim border-b-2 border-transparent cursor-not-allowed'
          : 'text-text-muted border-b-2 border-transparent hover:text-text-secondary'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
