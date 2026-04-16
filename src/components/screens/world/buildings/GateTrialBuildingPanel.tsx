import { useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useActivityStore } from '../../../../stores/activityStore.js';
import { useCombatStore } from '../../../../stores/combatStore.js';
import { useContentStore } from '../../../../stores/contentStore.js';
import { useInventoryStore } from '../../../../stores/inventoryStore.js';
import { useGameStore } from '../../../../stores/gameStore.js';
import { getTrialGateRewardBundle, getTrialLifecycleSnapshot } from '../../../../systems/progression/runtime/index.js';
import { useTrialStore } from '../../../../stores/trialStore.js';
import { RewardService } from '../../../../services/rewards/index.js';
import { resolveModuleRef } from '../worldUtils.js';
import { useUIStore } from '../../../../stores/uiStore.js';
import { hpPercent } from '../../../../systems/combat/minibarModel.js';
import { formatNumber } from '../../../../utils/numbers.js';
import { buildSupportEconomySurfaceModel } from '../../../../systems/economy/supportEconomySurfaceModel.js';
import { InkHealthBar } from '../../../../ui/combat/InkHealthBar.js';
import cultivatorFight from '../../../../assets/onscreen/cultivator_backshots.png';
import wildBoar from '../../../../assets/enemies/widboar.png';
import entryGate from '../../../../assets/onscreen/entrygate.png';
import gateSymbol from '../../../../assets/onscreen/gate.png';
import cityGateBackground from '../../../../assets/background/citystates/city_gate.png';
import './CombatStyles.scss';
import { GATE_SUPPORT_LABELS } from '../../../../ui/text/playerFacingLabels.js';
import {
  buildGateTrialAttemptPresentation,
  buildGateTrialReadinessSurface,
  buildSection5PostFailureSurface,
} from '../../../../systems/readiness/section5Adapters.js';
import { GateTrialReadinessCard } from '../../../../ui/trials/GateTrialReadinessCard.js';
import { GateTrialChecklist } from '../../../../ui/trials/GateTrialChecklist.js';
import { GateTrialSafetyNetCard } from '../../../../ui/trials/GateTrialSafetyNetCard.js';
import { GateTrialTopFixes } from '../../../../ui/trials/GateTrialTopFixes.js';
import { GateTrialAttemptCluster } from '../../../../ui/trials/GateTrialAttemptCluster.js';
import { performPostFailureFixAction } from '../../../../systems/ui/postFailure/index.js';
import { InlineOnboardingCallout } from '../../../system/InlineOnboardingCallout.js';
import { ONBOARDING_INLINE_LIFE_KEYS } from '../../../../systems/ui/onboardingPromptRegistry.js';
import { useRunCompassSurface } from '../../../../ui/status/useRunCompassSurface.js';
import { CombatModuleTopLane } from '../../../../ui/world/combat/CombatModuleTopLane.js';
import { getWorldCombatModuleTopLaneCopy } from '../../../../ui/world/combat/combatModuleTopLaneModel.js';
import { buildGateTrialScreenContract } from '../../../../systems/readiness/gateTrialScreenContract.js';
import { GateTrialWorldLayout } from '../../../../ui/trials/GateTrialWorldLayout.js';
import { ScreenFxStage } from '../../../../ui/fx/ScreenFxStage.js';
import { FX_STAGE_IDS } from '../../../../ui/fx/constants.js';
import { FxStagePortal } from '../../../../ui/fx/FxStagePortal.js';
import { useFxQuality, useFxStageSnapshot } from '../../../../ui/fx/FxQualityProvider.js';
import { buildFxSceneContract } from '../../../../ui/fx/runtime.js';
import { GateTrialFxScene } from '../../../../ui/fx/scenes/GateTrialFxScene.js';
import { listMissingGateTrialSupportArtFiles, resolveGateTrialSupportArt } from '../../../../assets/ui/chrome/gate_trial_support/index.js';

interface GateTrialBuildingPanelProps {
  cityId: string;
}

function formatEligibility(eligibility: unknown): { summary: string; raw?: string } {
  if (!eligibility) return { summary: 'No eligibility rule provided' };
  if (typeof eligibility === 'string') return { summary: eligibility };
  if (typeof eligibility === 'number' || typeof eligibility === 'boolean') return { summary: String(eligibility) };

  try {
    const raw = JSON.stringify(eligibility, null, 2);
    return { summary: 'See requirements', raw };
  } catch {
    return { summary: 'See requirements', raw: String(eligibility) };
  }
}

const labelForState = (state: 'locked' | 'available' | 'cleared' | 'bypassed'): string => {
  switch (state) {
    case 'locked':
      return 'Locked';
    case 'available':
      return 'Available';
    case 'cleared':
      return 'Cleared';
    case 'bypassed':
      return 'Bypassed';
  }
};

export function GateTrialBuildingPanel({ cityId }: GateTrialBuildingPanelProps) {
  const city = useContentStore((state) => state.maps.citiesById[cityId]);
  const contentRaw = useContentStore((state) => state.raw);
  const trialsById = useContentStore((state) => state.maps.trialsById);
  const enemiesById = useContentStore((state) => state.maps.enemiesById);
  const itemsById = useContentStore((state) => state.maps.itemsById);

  const trialProgressById = useTrialStore((state) => state.progressByTrialId);
  const markBypassed = useTrialStore((state) => state.markBypassed);

  const activeActivity = useActivityStore((state) => state.active);
  const stopActivity = useActivityStore((state) => state.stopActivity);

  const { combatContext, exitCombat, currentEnemy, playerHP, playerMaxHP, enemyHP, enemyMaxHP, combatLog } =
    useCombatStore(
      useShallow((state) => ({
        combatContext: state.combatContext,
        exitCombat: state.exitCombat,
        currentEnemy: state.currentEnemy,
        playerHP: state.playerHP,
        playerMaxHP: state.playerMaxHP,
        enemyHP: state.enemyHP,
        enemyMaxHP: state.enemyMaxHP,
        combatLog: state.combatLog,
      })),
    );

  const openCombatPreview = useUIStore((state) => state.openCombatPreview);
  const stopCombatAndClose = useUIStore((state) => state.stopCombatAndClose);
  const closeWorldBuildingModal = useUIStore((state) => state.closeWorldBuildingModal);
  const addNotification = useUIStore((state) => state.addNotification);
  const combatAIProfile = useUIStore((state) => state.settings.combatAIProfile);
  const useConsumablesInCombat = useUIStore((state) => state.settings.useConsumablesInCombat);
  const setSettings = useUIStore((state) => state.setSettings);
  const onboardingLifeKeys = useUIStore((state) => state.dismissedOnboardingLifeKeys);
  const dismissOnboardingLifeKey = useUIStore((state) => state.dismissOnboardingLifeKey);
  const runCompass = useRunCompassSurface();
  const fxStageSnapshot = useFxStageSnapshot(FX_STAGE_IDS.gateTrial);
  const { requestedQuality, effectiveQuality, prefersReducedMotion } = useFxQuality();

  const getItemCount = useInventoryStore((state) => state.getItemCount);
  const merit = useInventoryStore((state) => state.merit);
  const gold = useInventoryStore((state) => state.gold);
  const spiritStones = useInventoryStore((state) => state.spiritStones);
  const gameRealm = useGameStore((state) => state.realm);
  const qi = useGameStore((state) => state.qi);
  const breakthroughRequirement = useGameStore((state) => state.getBreakthroughRequirement());

  const trialRefId = useMemo(() => resolveModuleRef(city ?? null, 'gateTrial'), [city]);
  const trialDef = trialRefId ? trialsById[trialRefId] : undefined;
  const trialProgress = trialRefId ? trialProgressById[trialRefId] ?? null : null;
  const requiredItemSatisfied = trialDef?.requiredItemId ? getItemCount(trialDef.requiredItemId) > 0 : true;
  const lifecycle = getTrialLifecycleSnapshot({
    content: useContentStore.getState().raw,
    trial: trialDef,
    progress: trialProgress,
    realm: gameRealm,
    qi,
    breakthroughRequirement,
    requiredItemSatisfied,
  });

  const isTrialActive = activeActivity?.type === 'trial' && activeActivity.sourceId === trialRefId;
  const trialBossName = trialDef ? enemiesById[trialDef.bossId]?.name ?? trialDef.bossId : null;
  const gateItemName = lifecycle.gateItemId ? itemsById[lifecycle.gateItemId]?.name ?? lifecycle.gateItemId : null;
  const requiredItemName = trialDef?.requiredItemId ? itemsById[trialDef.requiredItemId]?.name ?? trialDef.requiredItemId : null;

  const isTrialCombat = combatContext.type === 'trial';
  const activeEnemy = isTrialCombat ? currentEnemy : null;
  const playerHpPct = hpPercent(playerHP, playerMaxHP);
  const enemyHpPct = hpPercent(enemyHP, enemyMaxHP);
  const playerBarPercent = activeEnemy ? playerHpPct : 100;
  const playerHpLabel = `${formatNumber(playerHP)} / ${formatNumber(playerMaxHP)} (${playerHpPct.toFixed(1)}%)`;
  const enemyHpLabel = activeEnemy
    ? `${formatNumber(enemyHP)} / ${formatNumber(enemyMaxHP)} (${enemyHpPct.toFixed(1)}%)`
    : 'Awaiting trial challenge…';
  const displayEnemyName = activeEnemy?.name ?? trialBossName ?? 'Trial Guardian';
  const visibleLogEntries = combatLog.slice(-6);
  const eligibleFailures = trialProgress?.eligibleFailures ?? 0;
  const eligibilitySummary = formatEligibility(trialDef?.eligibilityRule);
  const supportSurface = useMemo(
    () =>
      buildSupportEconomySurfaceModel({
        content: useContentStore.getState().raw,
        cityId,
        currencies: { merit, spiritStones },
      }),
    [cityId, merit, spiritStones],
  );
  const gateReadinessSurface = useMemo(
    () => (trialDef ? buildGateTrialReadinessSurface(trialDef.id) : null),
    [trialDef?.id, lifecycle.state, lifecycle.reasonCode, lifecycle.failSafe.eligibleFailures, merit, spiritStones],
  );
  const postFailureSurface = useMemo(
    () => (trialDef ? buildSection5PostFailureSurface(trialDef.id) : null),
    [trialDef?.id, lifecycle.state, lifecycle.reasonCode, lifecycle.failSafe.eligibleFailures, merit, spiritStones],
  );
  const attemptPresentation = gateReadinessSurface ? buildGateTrialAttemptPresentation(gateReadinessSurface) : null;
  const gateScreenContract = gateReadinessSurface && attemptPresentation
    ? buildGateTrialScreenContract({ readinessSurface: gateReadinessSurface, attemptPresentation, postFailureSurface })
    : null;
  const showFirstFailureStrap = Boolean(postFailureSurface?.state === 'available'
    && trialProgress?.lastAttemptSummary
    && (trialProgress?.attempts ?? 0) > 0
    && !onboardingLifeKeys.includes(ONBOARDING_INLINE_LIFE_KEYS.firstFailureStrap));
  const gateTopLaneCopy = useMemo(
    () => getWorldCombatModuleTopLaneCopy({ moduleKey: 'gateTrial', content: contentRaw, cityId }),
    [cityId, contentRaw],
  );
  const gateSupportArt = useMemo(() => ({
    checklistMinimum: resolveGateTrialSupportArt('checklist_minimum_plate'),
    checklistRecommended: resolveGateTrialSupportArt('checklist_recommended_plate'),
    readinessBand: resolveGateTrialSupportArt('readiness_band_companion'),
    readinessBandAlt: resolveGateTrialSupportArt('readiness_band_companion_alt'),
    failSafeFrame: resolveGateTrialSupportArt('failsafe_frame'),
    sealAccent: resolveGateTrialSupportArt('seal_accent'),
    attemptPrimary: resolveGateTrialSupportArt('attempt_primary_plate'),
    attemptSecondary: resolveGateTrialSupportArt('attempt_secondary_plate'),
    gateHaloBase: resolveGateTrialSupportArt('gate_halo_base'),
    gateUnderglow: resolveGateTrialSupportArt('gate_underglow_soft'),
  }), []);
  const missingSupportArt = useMemo(() => listMissingGateTrialSupportArtFiles(), []);
  const gateTrialFxScene = useMemo(() => {
    if (!fxStageSnapshot || !gateReadinessSurface || !attemptPresentation) return null;
    return buildFxSceneContract({
      stageId: FX_STAGE_IDS.gateTrial,
      sceneKind: 'gateTrial',
      snapshot: fxStageSnapshot,
      requestedQuality,
      effectiveQuality,
      prefersReducedMotion,
      documentHidden: typeof document !== 'undefined' ? document.hidden : false,
    });
  }, [
    attemptPresentation,
    effectiveQuality,
    fxStageSnapshot,
    gateReadinessSurface,
    prefersReducedMotion,
    requestedQuality,
  ]);

  const handleChallengeTrial = () => {
    if (!city || !trialDef) return;
    if (!lifecycle.canStart) {
      addNotification('warning', lifecycle.reason);
      return;
    }
    openCombatPreview({ type: 'trial', cityId, sourceId: trialDef.id });
  };
  const handleBreakThrough = () => {
    useUIStore.getState().setActiveTab('cultivation');
    closeWorldBuildingModal();
  };

  const handleStopTrial = () => {
    stopCombatAndClose();
    stopActivity();
    if (combatContext.type === 'trial') {
      exitCombat();
    }
  };

  const handleFailSafePurchase = () => {
    if (!trialDef || !lifecycle.failSafe.canPurchase || !lifecycle.failSafe.cost || isTrialActive) {
      addNotification('warning', lifecycle.failSafe.blockedReason ?? `${GATE_SUPPORT_LABELS.support} is not available.`);
      return;
    }

    const inventory = useInventoryStore.getState();
    const goldCost = lifecycle.failSafe.cost.gold;
    const spiritStoneCost = lifecycle.failSafe.cost.spiritStones;
    const meritCost = lifecycle.failSafe.cost.merit;

    const canAfford = inventory.canAffordCurrency({
      gold: goldCost,
      spiritStones: spiritStoneCost,
      merit: meritCost,
    });

    if (!canAfford) {
      addNotification('warning', `Cannot afford ${GATE_SUPPORT_LABELS.support} purchase.`);
      return;
    }

    const spent = RewardService.spendCurrency({
      gold: goldCost,
      spiritStones: spiritStoneCost,
      merit: meritCost,
    }, `gate_fail_safe:${trialDef.id}`);

    if (!spent) {
      addNotification('warning', `Failed to deduct currencies for ${GATE_SUPPORT_LABELS.support} purchase.`);
      return;
    }

    RewardService.grantRewards(getTrialGateRewardBundle(useContentStore.getState().raw, trialDef), `${GATE_SUPPORT_LABELS.support} gate purchase`);
    markBypassed(trialDef.id);
  };

  if (!trialDef) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>Gate Trial</div>
          <div className={'worldScreenPlaceholderKey'}>gateTrial</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>
          <div className={'worldScreenPlaceholderLine'}>Unavailable for this city.</div>
        </div>
      </div>
    );
  }

  return (
    <ScreenFxStage
      stageId={FX_STAGE_IDS.gateTrial}
      className="gateTrialPanelFxStage"
      stageClassName="gateTrialPanelFxStage__layer"
      contentClassName="gateTrialPanelFxStage__content"
      stageZIndex={0}
      contentZIndex={1}
    >
      {gateTrialFxScene && gateReadinessSurface && attemptPresentation ? (
        <FxStagePortal stageId={FX_STAGE_IDS.gateTrial}>
          <GateTrialFxScene
            {...gateTrialFxScene}
            attemptState={attemptPresentation.state}
            readinessLabel={gateReadinessSurface.readinessLabel}
            failSafeAvailable={lifecycle.failSafe.canPurchase}
            combatActive={isTrialCombat}
          />
        </FxStagePortal>
      ) : null}
      <div className="worldScreenPlaceholder worldScreenPlaceholder--gate-trial combatPathModule combatPathModule--gateTrial">
        <GateTrialWorldLayout
        topLane={(
          <CombatModuleTopLane
            moduleName={gateTopLaneCopy.moduleName}
            roleTag={gateTopLaneCopy.roleTag}
            bestUsedWhen={gateTopLaneCopy.bestUsedWhen}
            runCompassSurface={runCompass.compact}
            variant="gate-trial"
            onClose={closeWorldBuildingModal}
            chipRow={(
              <>
                <span className={`combatPathModule__chip ${lifecycle.canStart ? 'combatPathModule__chip--active' : 'combatPathModule__chip--warning'}`}>
                  {lifecycle.canStart ? 'Ready to Attempt' : 'Build Check'}
                </span>
                <span className="combatPathModule__chip combatPathModule__chip--warning">
                  Eligible Failures {eligibleFailures}/{lifecycle.failSafe.threshold}
                </span>
              </>
            )}
          />
        )}
        identity={(
          <div className="gateTrialPanel__roleFrame">
            {gateSupportArt.readinessBand.assetUrl ? (
              <div
                className="gateTrialPanel__roleFrameArt"
                style={{ backgroundImage: `url(${gateSupportArt.readinessBand.assetUrl})` }}
                aria-hidden="true"
              />
            ) : null}
            {gateSupportArt.readinessBandAlt.assetUrl ? (
              <div
                className="gateTrialPanel__roleFrameArt gateTrialPanel__roleFrameArt--alt"
                style={{ backgroundImage: `url(${gateSupportArt.readinessBandAlt.assetUrl})` }}
                aria-hidden="true"
              />
            ) : null}
            {gateSupportArt.sealAccent.assetUrl ? (
              <span
                className="gateTrialPanel__sealAccent"
                style={{ backgroundImage: `url(${gateSupportArt.sealAccent.assetUrl})` }}
                aria-hidden="true"
              />
            ) : null}
            <div className="gateTrialPanel__roleTag">{gateScreenContract?.roleTag ?? 'Milestone Validation'}</div>
            <div className="gateTrialPanel__roleSummary">{gateScreenContract?.roleSummary ?? 'Use this screen to validate readiness and risk before attempting a breakthrough gate.'}</div>
            {gateReadinessSurface ? (
              <div className="gateTrialPanel__readinessScore">{gateScreenContract?.readinessScoreLine ?? `Readiness Score: ${gateReadinessSurface.readinessScore ?? '—'} / 100`}</div>
            ) : null}
            {missingSupportArt.length > 0 ? <div className="gateTrialPanel__supportFallbackNote">Support kit fallback active ({missingSupportArt.length} assets missing).</div> : null}
          </div>
        )}
        leftRail={gateReadinessSurface ? (
          <GateTrialChecklist
            title={gateScreenContract?.checklistMinimumTitle ?? 'Minimum Floor'}
            lines={gateReadinessSurface.minimumChecklist}
            supportArtUrl={gateSupportArt.checklistMinimum.assetUrl}
            supportArtRole={gateSupportArt.checklistMinimum.role}
          />
        ) : (
          <div className="ink-combat-shell__stat-line">Minimum checklist unavailable.</div>
        )}
        centerStage={(
          <div className={`gateTrialStage ${isTrialCombat ? 'gateTrialStage--active' : 'gateTrialStage--idle'}`}>
            {isTrialCombat ? (
              <>
                <div className="gateTrialStage__healthbars">
                  <InkHealthBar name="You" current={playerHP} max={playerMaxHP} label={playerHpLabel} fillPercent={playerBarPercent} />
                  <InkHealthBar
                    name={displayEnemyName}
                    current={enemyHP}
                    max={enemyMaxHP}
                    label={enemyHpLabel}
                    fillPercent={enemyHpPct}
                    inactive={!activeEnemy}
                  />
                </div>
                <div className="gateTrialStage__activeScene">
                  <div className="cultivator-image-wrapper">
                    <img className="cultivator-image" src={cultivatorFight} alt="" />
                  </div>
                  <div className={`enemy-image-wrapper${activeEnemy ? '' : ' enemy-image-wrapper--inactive'}`}>
                    <img className="enemy-image" src={wildBoar} alt="" />
                  </div>
                </div>
              </>
            ) : (
              <div className="gateTrialStage__idleScene">
                <img className="gateTrialStage__idleBackdrop" src={cityGateBackground} alt="" />
                {gateSupportArt.gateUnderglow.assetUrl ? (
                  <div className="gateTrialStage__underglow" style={{ backgroundImage: `url(${gateSupportArt.gateUnderglow.assetUrl})` }} aria-hidden="true" />
                ) : null}
                {gateSupportArt.gateHaloBase.assetUrl ? (
                  <div className="gateTrialStage__halo" style={{ backgroundImage: `url(${gateSupportArt.gateHaloBase.assetUrl})` }} aria-hidden="true" />
                ) : null}
                <img className="gateTrialStage__idleGate" src={gateSymbol} alt="" />
                <img className="gateTrialStage__idleEntry" src={entryGate} alt="" />
                <div className="gateTrialStage__idleLabel">{trialDef.name ?? trialDef.id}</div>
              </div>
            )}
          </div>
        )}
        rightRail={(
          <div className="gateTrialPanel__supportRail">
            {gateReadinessSurface ? (
              <>
                <GateTrialReadinessCard
                  surface={gateReadinessSurface}
                  companionArtUrl={gateSupportArt.readinessBand.assetUrl}
                  companionAltArtUrl={gateSupportArt.readinessBandAlt.assetUrl}
                />
                <GateTrialChecklist
                  title={gateScreenContract?.checklistRecommendedTitle ?? 'Recommended Floor'}
                  lines={gateReadinessSurface.recommendedChecklist}
                  supportArtUrl={gateSupportArt.checklistRecommended.assetUrl}
                  supportArtRole={gateSupportArt.checklistRecommended.role}
                />
              </>
            ) : null}
            <GateTrialSafetyNetCard
              lifecycle={lifecycle}
              reserveHeadline={supportSurface.reserveHeadline}
              reserveGapLine={supportSurface.reserveGapLine}
              eligibleDefeatRewardLine={supportSurface.eligibleDefeatRewardLine}
              currentMerit={supportSurface.readModel.currentMerit}
              currentGold={gold}
              currentSpiritStones={supportSurface.readModel.currentSpiritStones}
              frameArtUrl={gateSupportArt.failSafeFrame.assetUrl}
            />
            {showFirstFailureStrap ? (
              <InlineOnboardingCallout
                className="gateTrialPanel__failure-strap"
                title="Defeat is feedback"
                body="Read the diagnosis and take the top fix before retrying. The gate is teaching you what this life is missing."
                actionLabel="Got it"
                onAction={() => dismissOnboardingLifeKey(ONBOARDING_INLINE_LIFE_KEYS.firstFailureStrap)}
                onDismiss={() => dismissOnboardingLifeKey(ONBOARDING_INLINE_LIFE_KEYS.firstFailureStrap)}
                tone="ink"
              />
            ) : null}
            <GateTrialTopFixes
              surface={postFailureSurface}
              onAction={(fix) => {
                performPostFailureFixAction({
                  action: fix,
                  cityId,
                  trialId: trialDef?.id ?? null,
                  onRetryGate: handleChallengeTrial,
                  onBuySafetyNet: handleFailSafePurchase,
                  onFocusTrialSection: (section) => {
                    if (section === 'combat_options') {
                      setSettings({ combatAIProfile: 'survivor' });
                    } else if (section === 'safety_net') {
                      addNotification('info', `Review ${GATE_SUPPORT_LABELS.support} details in the support section.`);
                    }
                  },
                });
              }}
            />
          </div>
        )}
        bottomLane={attemptPresentation ? (
          <GateTrialAttemptCluster
            presentation={attemptPresentation}
            onPrimary={() => {
              if (attemptPresentation.state === 'break_through') {
                handleBreakThrough();
                return;
              }
              if (attemptPresentation.state === 'buy_safety_net') {
                handleFailSafePurchase();
                return;
              }
              handleChallengeTrial();
            }}
            onStop={handleStopTrial}
            onBuySafetyNet={handleFailSafePurchase}
            showStop={isTrialActive || isTrialCombat}
            primaryPlateArtUrl={gateSupportArt.attemptPrimary.assetUrl}
            secondaryPlateArtUrl={gateSupportArt.attemptSecondary.assetUrl}
          />
        ) : (
          <div className="ink-combat-shell__stat-line">Attempt state unavailable.</div>
        )}
        details={(
          <details className="gateTrialPanel__adminDetails">
            <summary>Trial Details</summary>
            <div className="gateTrialPanel__adminStack">
              <div className="combatPathModule__routeHints">
                <div className="ink-combat-shell__section-title">Combat Options</div>
                <div className="ink-combat-shell__stat-line">AI Profile: {combatAIProfile}</div>
                <button className="button-standard button-standard--ghost" type="button" onClick={() => setSettings({ combatAIProfile: 'survivor' })} disabled={combatAIProfile === 'survivor'}>
                  Set AI: Survivor
                </button>
                <div className="ink-combat-shell__stat-line">Consumables in combat: {useConsumablesInCombat ? 'Enabled' : 'Disabled'}</div>
                <button className="button-standard button-standard--ghost" type="button" onClick={() => setSettings({ useConsumablesInCombat: true })} disabled={useConsumablesInCombat}>
                  Enable Consumables
                </button>
              </div>
              <div className="combatPathModule__supportCluster">
                <div className="ink-combat-shell__section-title">Gate Facts</div>
                <div className="ink-combat-shell__stat-line">Trial: {trialDef.name ?? trialDef.id}</div>
                <div className="ink-combat-shell__stat-line">Gate state: {labelForState(lifecycle.state)}</div>
                <div className="ink-combat-shell__stat-line">Gate reward: {gateItemName ?? 'Unknown'}</div>
                <div className="ink-combat-shell__stat-line">Eligibility rule: {eligibilitySummary.summary}</div>
                {requiredItemName ? (
                  <div className="ink-combat-shell__stat-line">Required item: {requiredItemName}</div>
                ) : null}
                <div className="ink-combat-shell__stat-line">
                  {GATE_SUPPORT_LABELS.support}: {lifecycle.failSafe.status === 'resolved' ? 'Resolved' : lifecycle.failSafe.canPurchase ? 'Available' : `Locked (${eligibleFailures}/${lifecycle.failSafe.threshold} Eligible Failures)`}
                </div>
                {trialProgress?.resolution === 'bypassed' ? <div className="ink-combat-shell__stat-line">Resolved via bypass.</div> : null}
                {eligibilitySummary.raw ? (
                  <details className="gate-trial__eligibility-details">
                    <summary>Show requirements</summary>
                    <pre>{eligibilitySummary.raw}</pre>
                  </details>
                ) : null}
              </div>
              <div className="ink-combat-shell__section--fill">
                <div className="ink-combat-shell__section-title">Combat Log</div>
                <div className="ink-combat-shell__log gate-trial__log">
                  {visibleLogEntries.length === 0 ? (
                    <div className="ink-combat-shell__log-empty">Combat log is empty</div>
                  ) : (
                    visibleLogEntries.map((entry, index) => (
                      <div key={`${entry.timestamp}-${index}`} className="ink-combat-shell__log-entry">
                        {entry.text}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </details>
        )}
        />
      </div>
    </ScreenFxStage>
  );
}
