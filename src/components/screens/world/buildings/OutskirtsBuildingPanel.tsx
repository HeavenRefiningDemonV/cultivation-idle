import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useShallow } from 'zustand/shallow';
import { useActivityStore } from '../../../../stores/activityStore.js';
import { useCombatStore } from '../../../../stores/combatStore.js';
import { useContentStore } from '../../../../stores/contentStore.js';
import { useOutskirtsStore } from '../../../../stores/outskirtsStore.js';
import { useUIStore } from '../../../../stores/uiStore.js';
import { pickEnemyFromPool, resolveModuleRef } from '../worldUtils.js';
import cultivatorFight from "../../../../assets/onscreen/cultivator_backshots.png"
import { hpPercent } from '../../../../systems/combat/minibarModel.js';
import { formatNumber } from '../../../../utils/numbers.js';
import { AI_PROFILE_OPTIONS } from '../../../../systems/combat/aiProfiles.js';
import { InkCombatShell } from '../../../../ui/combat/InkCombatShell.js';
import { InkHealthBar } from '../../../../ui/combat/InkHealthBar.js';
import { buildOutskirtsActivityRewardReadModel } from '../../../../systems/economy/activityRewardReadModel.js';
import { useBountyStore } from '../../../../stores/bountyStore.js';
import { buildCurrentCombatPostureContext, evaluateCurrentCombatPostureFit } from '../../../../systems/builds/combatPostureFit.js';
import { useRunCompassSurface } from '../../../../ui/status/useRunCompassSurface.js';
import { OutskirtsSummaryCard } from '../../../../ui/world/OutskirtsSummaryCard.js';
import { TrackedBountyProgressLine } from '../../../../ui/world/TrackedBountyProgressLine.js';
import { CombatModuleTopLane } from '../../../../ui/world/combat/CombatModuleTopLane.js';
import { getWorldCombatModuleTopLaneCopy } from '../../../../ui/world/combat/combatModuleTopLaneModel.js';
import { buildOutskirtsInformationHierarchySurface } from '../../../../ui/world/buildOutskirtsInformationHierarchySurface.js';
import { buildOutskirtsActionStripState } from '../../../../ui/world/buildOutskirtsActionStripState.js';
import { buildOutskirtsSupportContextSurface } from '../../../../ui/world/buildOutskirtsSupportContextSurface.js';
import { openWorldModule } from '../../../../systems/world/openWorldModule.js';
import { useFxQuality } from '../../../../ui/fx/FxQualityProvider.js';
import { buildOutskirtsFxProfile } from '../../../../ui/world/buildOutskirtsFxProfile.js';
import { buildOutskirtsMockupSurfaceFromStores } from '../../../../features/world/outskirts/buildOutskirtsMockupSurface.js';
import { OutskirtsExactMockupScreen } from '../../../../features/world/outskirts/OutskirtsExactMockupScreen.js';
import { OutskirtsActiveContainment } from '../../../../features/world/outskirts/components/OutskirtsActiveContainment.js';
import { getOutskirtsModuleViewState } from '../../../../features/world/outskirts/getOutskirtsModuleViewState.js';
import '../../../../features/world/outskirts/OutskirtsExactMockupScreen.scss';

import wildBoar from "../../../../assets/enemies/widboar.png";

import "./CombatStyles.scss";

const SEGMENT_COUNT = 14;
const FLOATING_TEXT_DURATION_MS = 900;

type FloatingHitKind = 'normal' | 'crit' | 'dodge';

type FloatingHit = {
  id: string;
  text: string;
  x: number;
  y: number;
  kind: FloatingHitKind;
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function darkenHexColor(color: string, factor: number): string {
  if (!color.startsWith('#')) return color;
  const normalized = color.length === 4
    ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
    : color;
  if (normalized.length !== 7) return color;
  const rgb = Number.parseInt(normalized.slice(1), 16);
  if (Number.isNaN(rgb)) return color;
  const clamped = clamp01(factor);
  const r = Math.round(((rgb >> 16) & 0xff) * clamped);
  const g = Math.round(((rgb >> 8) & 0xff) * clamped);
  const b = Math.round((rgb & 0xff) * clamped);
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function extractDamageAmount(text: string): string | null {
  const match = text.match(/for ([\d,.]+)/i);
  return match ? match[1] : null;
}

interface OutskirtsBuildingPanelProps {
  cityId: string;
}

export function OutskirtsBuildingPanel({ cityId }: OutskirtsBuildingPanelProps) {
  const city = useContentStore((state) => state.maps.citiesById[cityId]);
  const outskirtsById = useContentStore((state) => state.maps.outskirtsById);
  const enemiesById = useContentStore((state) => state.maps.enemiesById);
  const itemsById = useContentStore((state) => state.maps.itemsById);
  const contentRaw = useContentStore((state) => state.raw);

  const progressByOutskirtsId = useOutskirtsStore((state) => state.progressByOutskirtsId);
  const activity = useActivityStore((state) => state.active);
  const startActivity = useActivityStore((state) => state.startActivity);
  const stopActivity = useActivityStore((state) => state.stopActivity);

  const combatContext = useCombatStore((state) => state.combatContext);
  const exitCombat = useCombatStore((state) => state.exitCombat);
  const setAutoAttack = useCombatStore((state) => state.setAutoAttack);
  const startCombat = useCombatStore((state) => state.startCombat);
  const { currentEnemy, playerHP, playerMaxHP, enemyHP, enemyMaxHP } = useCombatStore(
    useShallow((state) => ({
      currentEnemy: state.currentEnemy,
      playerHP: state.playerHP,
      playerMaxHP: state.playerMaxHP,
      enemyHP: state.enemyHP,
      enemyMaxHP: state.enemyMaxHP,
    })),
  );

  const stopCombatAndClose = useUIStore((state) => state.stopCombatAndClose);
  const closeWorldBuildingModal = useUIStore((state) => state.closeWorldBuildingModal);
  const setSettings = useUIStore((state) => state.setSettings);
  const uiSettings = useUIStore(
    useShallow((state) => ({
      profile: state.settings.combatAIProfile,
      preferredTarget: state.settings.preferredTarget,
      autoRetryOnDeath: state.settings.autoRetryOnDeath,
      useConsumablesInCombat: state.settings.useConsumablesInCombat,
    })),
  );
  const combatLog = useCombatStore((state) => state.combatLog);
  const autoContinue = useOutskirtsStore((state) => state.autoContinue);
  const stopAtBoss = useOutskirtsStore((state) => state.stopAtBoss);
  const setAutoContinue = useOutskirtsStore((state) => state.setAutoContinue);
  const setStopAtBoss = useOutskirtsStore((state) => state.setStopAtBoss);
  const getProgress = useOutskirtsStore((state) => state.getProgress);
  const trackedBounty = useBountyStore((state) => state.getTrackedBounty(cityId));
  const runCompass = useRunCompassSurface();
  const { effectiveQuality, prefersReducedMotion } = useFxQuality();

  const outskirtsRefId = useMemo(() => resolveModuleRef(city ?? null, 'outskirts'), [city]);
  const outskirtsDef = outskirtsRefId ? outskirtsById[outskirtsRefId] : undefined;
  const outskirtsProgress = outskirtsRefId
    ? progressByOutskirtsId[outskirtsRefId] ?? { killsSinceBoss: 0, totalKills: 0, bossDefeated: false }
    : null;
  const bossName = outskirtsDef ? enemiesById[outskirtsDef.bossId]?.name ?? outskirtsDef.bossId : null;
  const playerHpPct = hpPercent(playerHP, playerMaxHP);
  const enemyHpPct = hpPercent(enemyHP, enemyMaxHP);
  const playerHpLabel = `${formatNumber(playerHP)} / ${formatNumber(playerMaxHP)} (${playerHpPct.toFixed(1)}%)`;
  const enemyHpLabel = currentEnemy
    ? `${formatNumber(enemyHP)} / ${formatNumber(enemyMaxHP)} (${enemyHpPct.toFixed(1)}%)`
    : 'Waiting for next fight…';
  const playerBarPercent = currentEnemy ? playerHpPct : 100;
  const enemyName = currentEnemy?.name ?? bossName ?? 'No active enemy';
  const visibleLogEntries = combatLog.slice(-6);
  const killsSinceBoss = outskirtsProgress?.killsSinceBoss ?? 0;
  const killsToBoss = outskirtsDef?.killsToBoss ?? 1;
  const progressRatio = clamp01(killsSinceBoss / Math.max(1, killsToBoss));
  const filledSegments = Math.floor(progressRatio * SEGMENT_COUNT);
  const lastLogTimestampRef = useRef(0);
  const combatMainRef = useRef<HTMLDivElement | null>(null);
  const [floatingHits, setFloatingHits] = useState<FloatingHit[]>([]);
  const floatingHitIdRef = useRef(0);
  const floatingHitTimeoutsRef = useRef<Map<string, number>>(new Map());
  const outskirtsRewardModel = useMemo(
    () => buildOutskirtsActivityRewardReadModel(contentRaw, cityId),
    [cityId, contentRaw],
  );
  const postureFit = useMemo(() => evaluateCurrentCombatPostureFit('outskirts'), [uiSettings.profile, uiSettings.useConsumablesInCombat]);
  const postureContext = useMemo(() => buildCurrentCombatPostureContext('outskirts'), [uiSettings.profile, uiSettings.useConsumablesInCombat]);
  const trackedOutskirtsBounty =
    trackedBounty && (trackedBounty.kind === 'OUTSKIRTS_KILL' || trackedBounty.kind === 'OUTSKIRTS_BOSS_KILL')
      ? trackedBounty
      : null;
  const outskirtsTopLaneCopy = useMemo(
    () => getWorldCombatModuleTopLaneCopy({ moduleKey: 'outskirts', content: contentRaw, cityId }),
    [cityId, contentRaw],
  );
  const hierarchySurface = useMemo(
    () => buildOutskirtsInformationHierarchySurface({
      model: outskirtsRewardModel,
      resolveItemName: (itemId) => itemsById[itemId]?.name ?? null,
      killsSinceBoss,
      killsToBoss,
      postureFit,
      postureProfile: uiSettings.profile,
      hasTrackedBounty: Boolean(trackedOutskirtsBounty),
      hasFarmTool: postureContext.loadoutSignals.hasFarmTool,
      cultivationPath: postureContext.path,
    }),
    [itemsById, killsSinceBoss, killsToBoss, outskirtsRewardModel, postureContext.loadoutSignals.hasFarmTool, postureContext.path, postureFit, trackedOutskirtsBounty, uiSettings.profile],
  );
  const supportContext = useMemo(
    () => buildOutskirtsSupportContextSurface({
      trackedOutskirtsBounty,
      runCompassActions: runCompass.full?.bestNextActions,
      farmerRecommendationLine: hierarchySurface.recommendedAiLine,
      cityId,
    }),
    [cityId, hierarchySurface.recommendedAiLine, runCompass.full?.bestNextActions, trackedOutskirtsBounty],
  );

  const triggerMotion = (target: 'player' | 'enemy', kind: 'attack' | 'dodge') => {
    const container = combatMainRef.current;
    if (!container) return;
    const selector = target === 'player' ? '.cultivator-image-wrapper' : '.enemy-image-wrapper';
    const className = target === 'player'
      ? kind === 'attack'
        ? 'combat-motion--player-attack'
        : 'combat-motion--player-dodge'
      : kind === 'attack'
        ? 'combat-motion--enemy-attack'
        : 'combat-motion--enemy-dodge';
    const element = container.querySelector<HTMLElement>(selector);
    if (!element) return;

    element.classList.remove(
      'combat-motion',
      'combat-motion--player-attack',
      'combat-motion--player-dodge',
      'combat-motion--enemy-attack',
      'combat-motion--enemy-dodge',
    );
    void element.offsetWidth;
    element.classList.add('combat-motion', className);

    const handleAnimationEnd = () => {
      element.classList.remove('combat-motion', className);
      element.removeEventListener('animationend', handleAnimationEnd);
    };
    element.addEventListener('animationend', handleAnimationEnd);
  };

  useEffect(() => {
    if (combatLog.length === 0) {
      lastLogTimestampRef.current = 0;
      return;
    }

    const newEntries = combatLog.filter((entry) => entry.timestamp > lastLogTimestampRef.current);
    if (newEntries.length === 0) return;
    lastLogTimestampRef.current = newEntries[newEntries.length - 1].timestamp;

    for (const entry of newEntries) {
      const text = entry.text;
      const isPlayerAttack = text.includes('You attacked');
      const isPlayerAttackMiss = isPlayerAttack && text.includes('missed');
      const isEnemyAttackMiss = entry.type === 'enemy' && text.includes('attacked but it missed');
      const isEnemyAttack =
        text.includes('attacked you') ||
        text.includes('landed a critical hit') ||
        text.includes('attacked, but your shield absorbed it');
      const isPlayerCrit = entry.type === 'damage' || text.includes('Critical hit!');
      const damageAmount = isPlayerAttack && !isPlayerAttackMiss ? extractDamageAmount(text) : null;

      if (isPlayerAttackMiss) {
        const id = `hit-${floatingHitIdRef.current++}`;
        const newHit: FloatingHit = {
          id,
          text: 'Dodge!',
          x: randomBetween(30, 70),
          y: randomBetween(20, 70),
          kind: 'dodge',
        };
        setFloatingHits((prev) => [...prev, newHit]);
        const timeoutId = window.setTimeout(() => {
          setFloatingHits((prev) => prev.filter((hit) => hit.id !== id));
          floatingHitTimeoutsRef.current.delete(id);
        }, FLOATING_TEXT_DURATION_MS);
        floatingHitTimeoutsRef.current.set(id, timeoutId);
      } else if (damageAmount) {
        const id = `hit-${floatingHitIdRef.current++}`;
        const newHit: FloatingHit = {
          id,
          text: damageAmount,
          x: randomBetween(25, 75),
          y: randomBetween(15, 65),
          kind: isPlayerCrit ? 'crit' : 'normal',
        };
        setFloatingHits((prev) => [...prev, newHit]);
        const timeoutId = window.setTimeout(() => {
          setFloatingHits((prev) => prev.filter((hit) => hit.id !== id));
          floatingHitTimeoutsRef.current.delete(id);
        }, FLOATING_TEXT_DURATION_MS);
        floatingHitTimeoutsRef.current.set(id, timeoutId);
      }

      if (isEnemyAttackMiss) {
        triggerMotion('player', 'dodge');
        continue;
      }

      if (isPlayerAttackMiss) {
        triggerMotion('enemy', 'dodge');
        continue;
      }

      if (isPlayerAttack) {
        triggerMotion('player', 'attack');
        continue;
      }

      if (isEnemyAttack) {
        triggerMotion('enemy', 'attack');
      }
    }
  }, [combatLog]);

  useEffect(() => {
    return () => {
      floatingHitTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      floatingHitTimeoutsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const container = combatMainRef.current;
    if (!container) return;
    const enemyWrapper = container.querySelector<HTMLElement>('.enemy-image-wrapper');
    if (!enemyWrapper) return;
    if (currentEnemy) {
      enemyWrapper.classList.remove('enemy-image-wrapper--inactive');
    } else {
      enemyWrapper.classList.add('enemy-image-wrapper--inactive');
    }
  }, [currentEnemy]);

  const handleStartOutskirts = () => {
    if (!city || !outskirtsDef) return;
    const progressSnapshot = getProgress(outskirtsDef.id);
    const nextIsBoss = progressSnapshot.killsSinceBoss >= outskirtsDef.killsToBoss;
    const nextEnemyId = nextIsBoss ? outskirtsDef.bossId : pickEnemyFromPool(outskirtsDef.mobPool);
    if (!nextEnemyId) return;
    startActivity('outskirts', { cityId, sourceId: outskirtsDef.id });
    setAutoAttack(true);
    startCombat(nextEnemyId, {
      type: 'outskirts',
      cityId,
      sourceId: outskirtsDef.id,
      cityIndex: outskirtsDef.cityIndex,
      isBoss: nextIsBoss,
    });
  };

  const handleStopOutskirts = () => {
    stopCombatAndClose();
    stopActivity();
    if (combatContext.type === 'outskirts') {
      exitCombat();
    }
  };

  const viewState = getOutskirtsModuleViewState({
    cityId,
    outskirtsId: outskirtsDef?.id ?? null,
    activity,
    combatContext,
  });
  const isOutskirtsActive = viewState === 'activeContained';
  const actionStripState = useMemo(
    () => buildOutskirtsActionStripState({
      isOutskirtsActive,
      killsSinceBoss,
      killsToBoss,
      autoContinue,
      stopAtBoss,
    }),
    [autoContinue, isOutskirtsActive, killsSinceBoss, killsToBoss, stopAtBoss],
  );
  const handlePrimaryAction = isOutskirtsActive ? handleStopOutskirts : handleStartOutskirts;
  const planningSurface = useMemo(
    () => buildOutskirtsMockupSurfaceFromStores(cityId),
    [cityId, killsSinceBoss, killsToBoss, trackedOutskirtsBounty?.instanceId, uiSettings.profile, uiSettings.preferredTarget, uiSettings.useConsumablesInCombat],
  );

  const outskirtsFxProfile = useMemo(
    () => buildOutskirtsFxProfile({
      effectiveQuality,
      prefersReducedMotion,
      isCombatActive: isOutskirtsActive,
      isBossReady: killsSinceBoss >= killsToBoss,
      cityId,
    }),
    [cityId, effectiveQuality, isOutskirtsActive, killsSinceBoss, killsToBoss, prefersReducedMotion],
  );

  if (viewState === 'unavailable') {
    return (
      <div className={'worldScreenPlaceholder'} data-testid="outskirts-view-unavailable">
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>Outskirts</div>
          <div className={'worldScreenPlaceholderKey'}>outskirts</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>
          <div className={'worldScreenPlaceholderLine'}>Unavailable for this city.</div>
        </div>
      </div>
    );
  }

  if (viewState === 'planning') {
    return (
      <div className="outskirtsPlanningOwner" data-testid="outskirts-view-planning">
        <OutskirtsExactMockupScreen surface={planningSurface} onStartHunt={handleStartOutskirts} />
      </div>
    );
  }

  return (
    <OutskirtsActiveContainment>
      <div className={'worldScreenPlaceholder combatPathModule combatPathModule--outskirts'}>
      <InkCombatShell
        title="Outskirts Combat"
        subtitle={isOutskirtsActive ? 'Live battle in progress.' : 'Ready to start a new run.'}
        onClose={closeWorldBuildingModal}
        className="ink-combat-shell--outskirts"
        sidebarPosition="right"
        suppressHeader
        leftSidebar={
          <div className={`ink-combat-shell__section outskirtsPanel__summary combatPathModule__contextRail ${supportContext.trackedBounty ? 'outskirtsPanel__summary--bounty' : ''}`.trim()}>
            <OutskirtsSummaryCard
              surface={hierarchySurface}
              trackedBountyLine={supportContext.trackedBounty ? (
                <TrackedBountyProgressLine
                  compact
                  title={supportContext.trackedBounty.title}
                  progressText={supportContext.trackedBounty.progressText}
                  detailLine={supportContext.trackedBounty.rewardSummary}
                />
              ) : undefined}
              farmerRecommendationLine={supportContext.farmerRecommendation?.label ?? null}
              routeHints={supportContext.routeHints}
              onRouteSelect={(destination) => {
                openWorldModule({ cityId, moduleKey: destination, source: 'outskirts-support-route' });
              }}
            />
          </div>
        }
        stage={
          <div className="outskirtsPanel__composition">
            <CombatModuleTopLane
              moduleName={outskirtsTopLaneCopy.moduleName}
              roleTag={outskirtsTopLaneCopy.roleTag}
              bestUsedWhen={outskirtsTopLaneCopy.bestUsedWhen}
              runCompassSurface={runCompass.compact}
              variant="outskirts"
              onClose={closeWorldBuildingModal}
              chipRow={(
                <>
                  <span className={`combatPathModule__chip ${isOutskirtsActive ? 'combatPathModule__chip--active' : ''}`}>
                    {isOutskirtsActive ? 'In Combat' : 'Idle'}
                  </span>
                  <span className={`combatPathModule__chip ${trackedOutskirtsBounty ? 'combatPathModule__chip--recommended' : ''}`}>
                    {trackedOutskirtsBounty ? 'Tracked Bounty' : 'No Tracked Bounty'}
                  </span>
                </>
              )}
            />
            <div className="outskirtsPanel__mainBand">
              <div className="outskirts-combat__stage combatPathModule__scene" ref={combatMainRef}>
                <div
                  className="outskirts-combat__atmosphere"
                  data-quality={outskirtsFxProfile.quality}
                  data-animate={outskirtsFxProfile.animateContinuously ? '1' : '0'}
                  data-combat-active={isOutskirtsActive ? '1' : '0'}
                  data-boss-ready={killsSinceBoss >= killsToBoss ? '1' : '0'}
                  style={{ '--outskirts-haze-opacity': `${outskirtsFxProfile.hazeOpacity}` } as CSSProperties}
                  aria-hidden="true"
                >
                  <span className="outskirts-combat__haze" />
                  {Array.from({ length: outskirtsFxProfile.moteCount }).map((_, idx) => (
                    <span key={idx} className={`outskirts-combat__mote outskirts-combat__mote--${(idx % 6) + 1}`} />
                  ))}
                  {Array.from({ length: outskirtsFxProfile.leafCount }).map((_, idx) => (
                    <span key={`leaf-${idx}`} className={`outskirts-combat__leaf outskirts-combat__leaf--${(idx % 2) + 1}`} />
                  ))}
                  {Array.from({ length: outskirtsFxProfile.glintCount }).map((_, idx) => (
                    <span key={`glint-${idx}`} className="outskirts-combat__glint" />
                  ))}
                </div>
                <div className="outskirts-combat__sceneLabel">Current Encounter</div>
                <div className="outskirts-combat__healthbars">
                  <InkHealthBar name="You" current={playerHP} max={playerMaxHP} label={playerHpLabel} fillPercent={playerBarPercent} />
                  <InkHealthBar
                    name={enemyName}
                    current={enemyHP}
                    max={enemyMaxHP}
                    label={enemyHpLabel}
                    fillPercent={enemyHpPct}
                    inactive={!currentEnemy}
                  />
                </div>

                <div className="images-div"> {/* do not touch anything in this div */}
                  <div className="cultivator-image-wrapper">
                    <img className="cultivator-image" src={cultivatorFight}></img>
                  </div>
                  <div className="enemy-image-wrapper">
                    <img className="enemy-image" src={wildBoar}></img>
                    <div className="enemy-stats"></div>
                    <div className="enemy-hit-overlay" aria-hidden="true">
                      {floatingHits.map((hit) => (
                        <span
                          key={hit.id}
                          className={`enemy-hit-text enemy-hit-text--${hit.kind}`}
                          style={{ left: `${hit.x}%`, top: `${hit.y}%` }}
                        >
                          {hit.text}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="ink-combat-shell__section combatPathModule__actionZone outskirtsPanel__actionStrip">
              <div className="outskirtsPanel__actionPrimaryLane">
                <button
                  className={`button-standard outskirtsPanel__primaryAction outskirtsPanel__primaryAction--${actionStripState.primaryActionTone}`}
                  onClick={handlePrimaryAction}
                >
                  {actionStripState.primaryActionLabel}
                </button>
                <div className="outskirtsPanel__cadenceMini">
                  <div className="outskirtsPanel__cadenceMiniTop">
                    <span className="outskirtsPanel__cadenceLabel">{actionStripState.progressLabel}</span>
                    <span className="outskirtsPanel__cadenceStatus">{actionStripState.bossStatusLabel}</span>
                  </div>
                  <div className="outskirtsPanel__cadenceSegments" aria-hidden="true">
                    {Array.from({ length: 8 }).map((_, idx) => {
                      const threshold = ((idx + 1) / 8) * Math.max(1, killsToBoss);
                      const filled = killsSinceBoss >= threshold || killsSinceBoss >= killsToBoss;
                      return (
                        <span
                          key={idx}
                          className={`outskirtsPanel__cadenceSegment ${filled ? 'outskirtsPanel__cadenceSegment--filled' : ''}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="outskirtsPanel__actionContext">
                <label className="ink-combat-shell__control ink-combat-shell__control--checkbox outskirtsPanel__stripToggle">
                  <input
                    type="checkbox"
                    checked={autoContinue}
                    onChange={(e) => setAutoContinue(e.target.checked)}
                  />
                  <span className="ink-combat-shell__control-label">{actionStripState.loopToggleLines[0]}</span>
                </label>
                <label className="ink-combat-shell__control ink-combat-shell__control--checkbox outskirtsPanel__stripToggle">
                  <input
                    type="checkbox"
                    checked={stopAtBoss}
                    onChange={(e) => setStopAtBoss(e.target.checked)}
                  />
                  <span className="ink-combat-shell__control-label">{actionStripState.loopToggleLines[1]}</span>
                </label>
              </div>
            </div>
            <div className="ink-combat-shell__section outskirtsPanel__secondary">
              <div className="outskirtsPanel__secondaryTitle">Utility Tray</div>
              <div className="outskirtsPanel__secondaryGrid">
                <div className="combatPathModule__supportCluster outskirtsPanel__secondaryCard">
                  <div className="ink-combat-shell__section-title">Boss Cadence</div>
                  <div className="ink-combat-shell__meter">
                    <div className="ink-combat-shell__segments">
                      {Array.from({ length: SEGMENT_COUNT }).map((_, idx) => {
                        const filled = idx < filledSegments;
                        return (
                          <div
                            key={idx}
                            className={`ink-combat-shell__segment${filled ? ' ink-combat-shell__segment--filled' : ''}`}
                          />
                        );
                      })}
                    </div>
                    <div className="ink-combat-shell__meter-text">
                      {killsSinceBoss} / {killsToBoss}
                    </div>
                  </div>
                </div>
                <div className="combatPathModule__supportCluster outskirtsPanel__secondaryCard">
                  <div className="ink-combat-shell__section-title">Combat Options</div>
                  <div className="ink-combat-shell__controls">
                    <label className="ink-combat-shell__control">
                      <span className="ink-combat-shell__control-label">AI Profile</span>
                      <select
                        value={uiSettings.profile}
                        onChange={(e) => setSettings({ combatAIProfile: e.target.value as typeof uiSettings.profile })}
                      >
                        {AI_PROFILE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="ink-combat-shell__control">
                      <span className="ink-combat-shell__control-label">Preferred target</span>
                      <select
                        value={uiSettings.preferredTarget}
                        onChange={(e) =>
                          setSettings({ preferredTarget: e.target.value as typeof uiSettings.preferredTarget })
                        }
                      >
                        <option value="trash">Trash</option>
                        <option value="elite">Elite</option>
                        <option value="boss">Boss</option>
                      </select>
                    </label>

                    <label className="ink-combat-shell__control ink-combat-shell__control--checkbox">
                      <input
                        type="checkbox"
                        checked={uiSettings.useConsumablesInCombat}
                        onChange={(e) => setSettings({ useConsumablesInCombat: e.target.checked })}
                      />
                      <span className="ink-combat-shell__control-label">Auto use items</span>
                    </label>

                    <label className="ink-combat-shell__control ink-combat-shell__control--checkbox">
                      <input
                        type="checkbox"
                        checked={uiSettings.autoRetryOnDeath}
                        onChange={(e) => setSettings({ autoRetryOnDeath: e.target.checked })}
                      />
                      <span className="ink-combat-shell__control-label">Auto retry</span>
                    </label>
                  </div>
                </div>
                <div className="combatPathModule__routeHints outskirtsPanel__secondaryCard">
                  <div className="ink-combat-shell__section-title">Run Options</div>
                  <div className="outskirtsPanel__runOptionsNote">
                    Loop toggles are now in the action strip for faster Start/Stop flow.
                  </div>
                </div>
                <div className="outskirtsPanel__secondaryCard outskirtsPanel__secondaryCard--fill">
                  <div className="ink-combat-shell__section-title">Combat Log</div>
                  <div className="ink-combat-shell__log">
                    {visibleLogEntries.length === 0 ? (
                      <div className="ink-combat-shell__log-empty">Combat log is empty</div>
                    ) : (
                      visibleLogEntries.map((entry, index) => (
                        <div
                          key={`${entry.timestamp}-${index}`}
                          className="ink-combat-shell__log-entry"
                          style={{ color: darkenHexColor(entry.color, 0.7) }}
                        >
                          {entry.text}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      />
      </div>
    </OutskirtsActiveContainment>
  );
}
