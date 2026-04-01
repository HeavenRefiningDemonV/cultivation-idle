import { useEffect, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { useCombatStore } from '../../stores/combatStore.js';
import { useZoneStore } from '../../stores/zoneStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { formatNumber, formatPercentFromValue } from '../../utils/numbers.js';
import { StatusSummaryHeader } from '../../ui/status/StatusSummaryHeader.js';
import { CombatStatTile } from '../../ui/status/CombatStatTile.js';
import { RunCompass } from '../../ui/status/RunCompass.js';
import { useRunCompassSurface } from '../../ui/status/useRunCompassSurface.js';
import { StatusMiniCard } from '../../ui/status/StatusMiniCard.js';
import { SpiritRootDisplay } from '../SpiritRootDisplay.js';
import { buildStatusTroubleshootingSurface } from '../../systems/ui/status/statusTroubleshootingSurface.js';
import { Crosshair, Droplets, Footprints, Heart, Shield, Sparkles, Sword } from 'lucide-react';
import './StatusScreen.scss';
import '../../ui/status/StatusSummaryHeader.scss';
import '../../ui/status/CombatStatTile.scss';
import '../../ui/status/StatusMiniCard.scss';

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="statusTroubleshootingLine">
      <span className="statusTroubleshootingLineLabel">{label}</span>
      <span className="statusTroubleshootingLineValue">{value}</span>
    </div>
  );
}

export function StatusScreen() {
  const setHeaderTitles = useUIStore((state) => state.setHeaderTitles);
  const runCompass = useRunCompassSurface();
  const realm = useGameStore((state) => state.realm);
  const qi = useGameStore((state) => state.qi);
  const qiPerSecond = useGameStore((state) => state.qiPerSecond);
  const focusMode = useGameStore((state) => state.focusMode);
  const selectedPath = useGameStore((state) => state.selectedPath);
  const stats = useGameStore((state) => state.stats);
  const playerLuck = useGameStore((state) => state.playerLuck);
  const currencies = useInventoryStore((state) => state.currencies);
  const items = useInventoryStore((state) => state.items);
  const gold = useInventoryStore((state) => state.gold);
  const combatLog = useCombatStore((state) => state.combatLog);
  const getTotalEnemiesDefeated = useZoneStore((state) => state.getTotalEnemiesDefeated);

  const troubleshooting = useMemo(
    () => buildStatusTroubleshootingSurface(),
    [realm, qi, qiPerSecond, focusMode, selectedPath, stats, currencies, items, gold],
  );

  const totalEnemiesDefeated = getTotalEnemiesDefeated('all');

  useEffect(() => {
    setHeaderTitles('Status', 'Troubleshoot your current run and identify the active floor gap.');
  }, [setHeaderTitles]);

  return (
    <div className="statusScreenRoot">
      <div className="statusScreenContent">
        <RunCompass surface={runCompass.full} tone="paper" className="statusScreenRunCompass statusScreenCardBase" />

        <StatusSummaryHeader
          realmName={troubleshooting.realmName}
          stageText={troubleshooting.stageText}
          pathLabel={troubleshooting.pathLabel}
          archetypeLabel={troubleshooting.archetypeLabel}
          archetypeSummary={troubleshooting.archetypeSummary}
          biggestShortfallLine={`${troubleshooting.shortfall.diagnosisLabel} — ${troubleshooting.shortfall.reason}`}
          topFixLine={troubleshooting.shortfall.topFix}
          combatStrip={troubleshooting.combatStrip}
        />

        <section className="statusChamberLayout" aria-label="Status troubleshooting chamber">
          <div className="statusChamberRail statusChamberRail--left">
            <StatusMiniCard title="Identity" urgent={troubleshooting.urgentCardId === 'identity'} className="statusTroubleshootingCard--identity">
              <SpiritRootDisplay variant="summary" />
              <StatusLine label="Path" value={troubleshooting.pathLabel} />
              <StatusLine label="Archetype" value={troubleshooting.archetypeLabel} />
              <StatusLine label="Heart Law" value={`${troubleshooting.identity.heartLawName} • ${troubleshooting.identity.heartLawVerse}`} />
              <StatusLine label="Resonance" value={troubleshooting.identity.resonanceLabel} />
              <StatusLine label="Summary" value={troubleshooting.archetypeSummary} />
              <StatusLine label="Focus" value={troubleshooting.identity.focusMode} />
              <StatusLine label="Breath" value={troubleshooting.identity.breathMode} />
            </StatusMiniCard>

            <StatusMiniCard title="Permanent Floor" urgent={troubleshooting.urgentCardId === 'permanent_floor'}>
              <StatusLine label="Weapon Refine" value={`${troubleshooting.permanentFloor.weaponRefine}`} />
              <StatusLine label="Accessory Refine" value={`${troubleshooting.permanentFloor.accessoryRefine}`} />
              <StatusLine label="Temper Successes" value={`${troubleshooting.permanentFloor.temperSuccesses}`} />
              <StatusLine label="Runes" value={troubleshooting.permanentFloor.runeSummary} />
              <StatusLine label="Next Target" value={troubleshooting.permanentFloor.gateTargetLine} />
              <StatusLine label="Judgment" value={troubleshooting.permanentFloor.floorJudgment} />
            </StatusMiniCard>
          </div>

          <div className="statusChamberCore" aria-hidden>
            <div className="statusChamberCorePlate">
              <div className="statusChamberCoreOrb" />
              <div className="statusChamberCoreSeal">Diagnostic Chamber</div>
            </div>
          </div>

          <div className="statusChamberRail statusChamberRail--right">
            <StatusMiniCard
              title="Readiness"
              urgent={troubleshooting.urgentCardId === 'readiness'}
              className="statusTroubleshootingCard--readiness"
            >
              <StatusLine label="State" value={troubleshooting.readiness.readinessLabel} />
              <StatusLine label="Gate" value={troubleshooting.readiness.gateTrialName} />
              <StatusLine label="Diagnosis" value={troubleshooting.readiness.diagnosisLabel} />
              {troubleshooting.readiness.warnings.map((warning) => <StatusLine key={warning} label="Warning" value={warning} />)}
              <StatusLine label="Biggest Shortfall" value={troubleshooting.readiness.shortfallLine} />
            </StatusMiniCard>

            <StatusMiniCard title="Preparation" urgent={troubleshooting.urgentCardId === 'preparation'}>
              <StatusLine label="Merit" value={troubleshooting.preparation.meritReserve} />
              <StatusLine label="Spirit Stones" value={troubleshooting.preparation.spiritStoneReserve} />
              <StatusLine label="Pouch" value={troubleshooting.preparation.pouchSummary} />
              <StatusLine label="Pouch Fit" value={troubleshooting.preparation.pouchFit} />
              <StatusLine label="Top Warning" value={troubleshooting.preparation.topWarning} />
              {troubleshooting.preparation.gateTokenLine ? <StatusLine label="Gate Token" value={troubleshooting.preparation.gateTokenLine} /> : null}
            </StatusMiniCard>

            <StatusMiniCard title="Build" urgent={troubleshooting.urgentCardId === 'build'}>
              <StatusLine label="Path Alignment" value={troubleshooting.build.alignment} />
              <StatusLine label="Empty Slots" value={troubleshooting.build.emptySlots} />
              <StatusLine label="Mastery Floor" value={troubleshooting.build.mastery} />
              <StatusLine label="Rank Floor" value={troubleshooting.build.rank} />
              <StatusLine label="Rune Floor" value={troubleshooting.build.runes} />
              <StatusLine label="Policy Fit" value={troubleshooting.build.policyFit} />
              <StatusLine label="Top Gap" value={troubleshooting.build.topGap} />
            </StatusMiniCard>
          </div>

          <div className="statusChamberSupport">
            <StatusMiniCard
              title="Safety Net"
              urgent={troubleshooting.urgentCardId === 'safety_net'}
              positive={troubleshooting.urgentCardId === 'safety_net'}
              className="statusTroubleshootingCard--support"
            >
              <StatusLine label="State" value={troubleshooting.safetyNet.state} />
              <StatusLine label="Progress" value={troubleshooting.safetyNet.progress} />
              <StatusLine label="Threshold" value={troubleshooting.safetyNet.threshold} />
              <StatusLine label="Cost" value={troubleshooting.safetyNet.cost} />
              <StatusLine label="Affordability" value={troubleshooting.safetyNet.affordability} />
              <StatusLine label="Context" value={troubleshooting.safetyNet.blockedReason} />
            </StatusMiniCard>
          </div>
        </section>

        <div className="statusScreenGrid statusScreenRawSection">
          <div className="statusScreenColumn">
            <div className="statusScreenStatCard statusScreenCardBase statusScreenCardBase--subordinate">
              <h3 className="statusScreenStatCardTitle">Combat Statistics</h3>
              <div className="combatStatTilesGrid">
                <CombatStatTile label="Max HP" value={formatNumber(stats.hp)} icon={<Heart size={16} />} tone="hp" pulseKey={stats.hp} />
                <CombatStatTile label="Attack Power" value={formatNumber(stats.atk)} icon={<Sword size={16} />} tone="offense" pulseKey={stats.atk} />
                <CombatStatTile label="Defense" value={formatNumber(stats.def)} icon={<Shield size={16} />} tone="defense" pulseKey={stats.def} />
                <CombatStatTile label="HP Regen/s" value={formatNumber(stats.regen)} icon={<Droplets size={16} />} tone="recovery" />
                <CombatStatTile label="Critical Rate" value={formatPercentFromValue(stats.crit)} icon={<Crosshair size={16} />} tone="crit" />
                <CombatStatTile label="Critical Damage" value={formatPercentFromValue(stats.critDmg, 0)} icon={<Sparkles size={16} />} tone="crit" />
                <CombatStatTile label="Dodge Chance" value={formatPercentFromValue(stats.dodge)} icon={<Footprints size={16} />} tone="evasion" />
                <CombatStatTile label="Total Enemies Defeated" value={formatNumber(totalEnemiesDefeated)} icon={<Sword size={16} />} tone="neutral" />
              </div>
            </div>
          </div>
          <div className="statusScreenColumn">
            <div className="statusScreenStatCard statusScreenCardBase statusScreenCardBase--subordinate">
              <h3 className="statusScreenStatCardTitle">Resources</h3>
              <StatusLine label="Gold" value={formatNumber(gold)} />
              <StatusLine label="Inventory Items" value={`${Object.keys(items).length}`} />
              <StatusLine label="Combat Logs" value={`${combatLog.length}`} />
              <StatusLine label="Player Luck" value={formatNumber(playerLuck || 0)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
