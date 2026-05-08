import { useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { useCombatStore } from '../../stores/combatStore.js';
import { useZoneStore } from '../../stores/zoneStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useMedicinePouchStore } from '../../stores/medicinePouchStore.js';
import { useTrialStore } from '../../stores/trialStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { formatNumber, formatPercentFromValue } from '../../utils/numbers.js';
import { StatusSummaryHeader } from '../../ui/status/StatusSummaryHeader.js';
import { CombatStatTile } from '../../ui/status/CombatStatTile.js';
import { RunCompass } from '../../ui/status/RunCompass.js';
import { useRunCompassSurface } from '../../ui/status/useRunCompassSurface.js';
import { StatusMiniCard } from '../../ui/status/StatusMiniCard.js';
import { SpiritRootDisplay } from '../SpiritRootDisplay.js';
import { buildStatusTroubleshootingSurface } from '../../systems/ui/status/statusTroubleshootingSurface.js';
import { Crosshair, Droplets, Footprints, Heart, Shield, Sparkles, Sword } from 'lucide-react';
import { ScreenFxStage } from '../../ui/fx/ScreenFxStage.js';
import { FX_STAGE_IDS } from '../../ui/fx/constants.js';
import { FxStagePortal } from '../../ui/fx/FxStagePortal.js';
import { useFxQuality, useFxStageSnapshot } from '../../ui/fx/FxQualityProvider.js';
import { buildFxSceneContract } from '../../ui/fx/runtime.js';
import { StatusFxScene } from '../../ui/fx/scenes/StatusFxScene.js';
import { performRunCompassAction } from '../../systems/ui/runCompass/performRunCompassAction.js';
import { useShallow } from 'zustand/shallow';
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
  const runCompass = useRunCompassSurface();
  const { realm, qi, qiPerSecond, focusMode, selectedPath, stats } = useGameStore(
    useShallow((state) => ({
      realm: state.realm,
      qi: state.qi,
      qiPerSecond: state.qiPerSecond,
      focusMode: state.focusMode,
      selectedPath: state.selectedPath,
      stats: state.stats,
    })),
  );
  const playerLuck = useGameStore((state) => state.playerLuck);
  const { currencies, items, gold } = useInventoryStore(
    useShallow((state) => ({
      currencies: state.currencies,
      items: state.items,
      gold: state.gold,
    })),
  );
  const { selectedHeartLawId, chapter, breathMode } = useCultivationStore(
    useShallow((state) => ({
      selectedHeartLawId: state.selectedHeartLawId,
      chapter: state.chapter,
      breathMode: state.breathMode,
    })),
  );
  const spiritRoot = usePrestigeStore((state) => state.spiritRoot);
  const pouchSlots = useMedicinePouchStore((state) => state.slots);
  const progressByTrialId = useTrialStore((state) => state.progressByTrialId);
  const autoStartCombat = useUIStore((state) => state.autoStartCombat);
  const contentRaw = useContentStore((state) => state.raw);
  const combatLog = useCombatStore((state) => state.combatLog);
  const getTotalEnemiesDefeated = useZoneStore((state) => state.getTotalEnemiesDefeated);
  const fxStageSnapshot = useFxStageSnapshot(FX_STAGE_IDS.status);
  const { requestedQuality, effectiveQuality, prefersReducedMotion } = useFxQuality();

  const troubleshooting = useMemo(
    () => buildStatusTroubleshootingSurface(),
    [
      autoStartCombat,
      chapter,
      contentRaw,
      currencies,
      focusMode,
      gold,
      items,
      pouchSlots,
      progressByTrialId,
      qi,
      qiPerSecond,
      realm,
      selectedHeartLawId,
      selectedPath,
      spiritRoot,
      stats,
      breathMode,
    ],
  );

  const totalEnemiesDefeated = getTotalEnemiesDefeated('all');
  const statusFxScene = useMemo(() => {
    if (!fxStageSnapshot) return null;
    return buildFxSceneContract({
      stageId: FX_STAGE_IDS.status,
      sceneKind: 'status',
      snapshot: fxStageSnapshot,
      requestedQuality,
      effectiveQuality,
      prefersReducedMotion,
      documentHidden: typeof document !== 'undefined' ? document.hidden : false,
    });
  }, [effectiveQuality, fxStageSnapshot, prefersReducedMotion, requestedQuality]);

  const primaryStatusAction = useMemo(
    () => runCompass.full?.bestNextActions.find((action) => !action.blocked && Boolean(action.target)) ?? null,
    [runCompass.full?.bestNextActions],
  );

  return (
    <ScreenFxStage
      stageId={FX_STAGE_IDS.status}
      className="statusScreenFxStage"
      stageClassName="statusScreenFxStage__layer"
      contentClassName="statusScreenFxStage__content"
      stageZIndex={0}
      contentZIndex={1}
    >
      {statusFxScene ? (
        <FxStagePortal stageId={FX_STAGE_IDS.status}>
          <StatusFxScene
            {...statusFxScene}
            urgency={troubleshooting.urgentCardId}
            resonance={troubleshooting.identity.resonanceLabel}
          />
        </FxStagePortal>
      ) : null}
      <div className="statusScreenRoot">
        <div className="statusScreenContent">
          <StatusSummaryHeader
            realmName={troubleshooting.realmName}
            stageText={troubleshooting.stageText}
            pathLabel={troubleshooting.pathLabel}
            spiritRootLine={`${troubleshooting.identity.spiritRootSummary.element} • ${troubleshooting.identity.spiritRootSummary.grade}`}
            archetypeLabel={troubleshooting.archetypeLabel}
            archetypeSummary={troubleshooting.archetypeSummary}
            biggestShortfallLine={troubleshooting.shortfall.headline}
            topFixLine={troubleshooting.shortfall.topFix}
            topFixAction={primaryStatusAction}
            onRunCompassAction={performRunCompassAction}
            combatStrip={troubleshooting.combatStrip}
          />
          <section className="statusActionStrip statusScreenCardBase statusScreenCardBase--subordinate" aria-label="Status primary next fix">
            <div className="statusActionStrip__main">
              <div className="statusActionStrip__title">Best Next Action</div>
              <div className="statusActionStrip__reason">{troubleshooting.shortfall.headline}</div>
            </div>
            <div className="statusActionStrip__ctaLane">
              {primaryStatusAction ? (
                <button
                  type="button"
                  className="statusActionStrip__cta uiNoShift"
                  onClick={() => performRunCompassAction(primaryStatusAction)}
                  disabled={primaryStatusAction.blocked}
                  title={primaryStatusAction.blockedReason ?? primaryStatusAction.why}
                >
                  {primaryStatusAction.label}
                </button>
              ) : (
                <span className="statusActionStrip__quiet">No stronger action is surfaced right now.</span>
              )}
            </div>
          </section>
          <RunCompass
            surface={runCompass.full}
            tone="paper"
            density="dense"
            className="statusScreenRunCompass statusScreenCardBase"
            onAction={performRunCompassAction}
          />

          <section className="statusChamberLayout" aria-label="Status troubleshooting chamber">
            <div className="statusChamberRail statusChamberRail--left">
              <StatusMiniCard title="Identity" urgent={troubleshooting.urgentCardId === 'identity'} className="statusTroubleshootingCard--identity">
                <div className="statusIdentityRootAura">
                  <SpiritRootDisplay variant="status" />
                </div>
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

            <div className="statusChamberCoreStack">
              <StatusMiniCard
                title="Readiness"
                urgent={troubleshooting.urgentCardId === 'readiness'}
                className="statusTroubleshootingCard--readiness statusTroubleshootingCard--crown"
              >
                <StatusLine label="State" value={troubleshooting.readiness.readinessLabel} />
                <StatusLine label="Gate" value={troubleshooting.readiness.gateTrialName} />
                <StatusLine label="Diagnosis" value={troubleshooting.readiness.diagnosisLabel} />
                {troubleshooting.readiness.reasons.map((reason, index) => (
                  <StatusLine key={`${reason}-${index}`} label={`Reason ${index + 1}`} value={reason} />
                ))}
                {troubleshooting.readiness.warnings.map((warning) => <StatusLine key={warning} label="Warning" value={warning} />)}
                <StatusLine label="Biggest Shortfall" value={troubleshooting.readiness.shortfallLine} />
              </StatusMiniCard>
              <div className="statusChamberCore" aria-hidden>
                <div className="statusChamberCorePlate">
                  <div className="statusChamberCoreOrb">
                    <div className="statusChamberCoreReadinessValue">{troubleshooting.readiness.readinessLabel}</div>
                    <div className="statusChamberCoreReadinessSub">{troubleshooting.readiness.diagnosisLabel}</div>
                  </div>
                  <div className="statusChamberCoreSeal">Diagnostic Chamber</div>
                </div>
              </div>
            </div>

            <div className="statusChamberRail statusChamberRail--right">
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
    </ScreenFxStage>
  );
}
