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
import { InkCombatShell } from '../../../../ui/combat/InkCombatShell.js';
import { InkHealthBar } from '../../../../ui/combat/InkHealthBar.js';
import cultivatorFight from '../../../../assets/onscreen/cultivator_backshots.png';
import wildBoar from '../../../../assets/enemies/widboar.png';
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
import { COMBAT_TRIO_TRUTH } from '../../../../systems/world/combatTrioTruth.js';
import { GateTrialSummaryCard } from '../../../../ui/world/GateTrialSummaryCard.js';

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

  const getItemCount = useInventoryStore((state) => state.getItemCount);
  const merit = useInventoryStore((state) => state.merit);
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
  const showFirstFailureStrap = Boolean(postFailureSurface?.state === 'available'
    && trialProgress?.lastAttemptSummary
    && (trialProgress?.attempts ?? 0) > 0
    && !onboardingLifeKeys.includes(ONBOARDING_INLINE_LIFE_KEYS.firstFailureStrap));

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
    <div className="worldScreenPlaceholder worldScreenPlaceholder--gate-trial">
      <InkCombatShell
        title="Gate Trial"
        subtitle={`Gate state: ${labelForState(lifecycle.state)}`}
        onClose={closeWorldBuildingModal}
        className="ink-combat-shell--gate-trial"
        leftSidebar={
          <>
            {attemptPresentation ? (
              <div className="ink-combat-shell__section gateTrialPanel__actions">
                <GateTrialAttemptCluster
                  presentation={attemptPresentation}
                  onPrimary={() => {
                    if (attemptPresentation.state === 'break_through') {
                      handleBreakThrough();
                      return;
                    }
                    handleChallengeTrial();
                  }}
                  onStop={handleStopTrial}
                  onBuySafetyNet={handleFailSafePurchase}
                />
              </div>
            ) : null}
            <div className="ink-combat-shell__section gateTrialPanel__summary">
              <GateTrialSummaryCard
                roleTag={COMBAT_TRIO_TRUTH.gateTrial.roleTag}
                bestUsedWhen={COMBAT_TRIO_TRUTH.gateTrial.bestUsedWhenSentence}
              />
            </div>
            {gateReadinessSurface ? (
              <div className="ink-combat-shell__section gateTrialPanel__readiness">
                <GateTrialReadinessCard surface={gateReadinessSurface} />
                <div className="gateTrialPanel__checklists">
                  <GateTrialChecklist title="Minimum Floor" lines={gateReadinessSurface.minimumChecklist} />
                  <GateTrialChecklist title="Recommended Floor" lines={gateReadinessSurface.recommendedChecklist} />
                </div>
              </div>
            ) : null}
            <div className="ink-combat-shell__section gateTrialPanel__support">
              <GateTrialSafetyNetCard
                lifecycle={lifecycle}
                reserveHeadline={supportSurface.reserveHeadline}
                reserveGapLine={supportSurface.reserveGapLine}
                eligibleDefeatRewardLine={supportSurface.eligibleDefeatRewardLine}
                currentMerit={supportSurface.readModel.currentMerit}
                currentSpiritStones={supportSurface.readModel.currentSpiritStones}
              />
            </div>
            <div className="ink-combat-shell__section">
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
            <div className="ink-combat-shell__section">
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
            <div className="ink-combat-shell__section">
              <div className="ink-combat-shell__section-title">Gate Facts</div>
              <div className="ink-combat-shell__stat-line">Trial: {trialDef.name ?? trialDef.id}</div>
              <div className="ink-combat-shell__stat-line">Gate state: {labelForState(lifecycle.state)}</div>
              <div className="ink-combat-shell__stat-line">Gate reward: {gateItemName ?? 'Unknown'}</div>
              <div className="ink-combat-shell__stat-line">Eligibility rule: {eligibilitySummary.summary}</div>
              {requiredItemName ? (
                <div className="ink-combat-shell__stat-line">Required item: {requiredItemName}</div>
              ) : null}
              <div className="ink-combat-shell__stat-line">
                {GATE_SUPPORT_LABELS.support}: {lifecycle.failSafe.status === 'resolved' ? 'Resolved' : lifecycle.failSafe.canPurchase ? 'Available' : `Locked (${eligibleFailures}/${lifecycle.failSafe.threshold} Eligible Defeats)`}
              </div>
              {trialProgress?.resolution === 'bypassed' ? <div className="ink-combat-shell__stat-line">Resolved via bypass.</div> : null}
              {eligibilitySummary.raw ? (
                <details className="gate-trial__eligibility-details">
                  <summary>Show requirements</summary>
                  <pre>{eligibilitySummary.raw}</pre>
                </details>
              ) : null}
            </div>
            <div className="ink-combat-shell__section">
              <div className="ink-combat-shell__section-title">Run Options</div>
              <div className="ink-combat-shell__stat-line">Activity: {isTrialActive ? 'Active' : 'Inactive'}</div>
            </div>
            <div className="ink-combat-shell__section ink-combat-shell__section--fill">
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
          </>
        }
        stage={
          <div className="outskirts-combat__stage">
            <div className="outskirts-combat__healthbars">
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
            <div className="images-div">
              <div className="cultivator-image-wrapper">
                <img className="cultivator-image" src={cultivatorFight} alt="" />
              </div>
              <div className={`enemy-image-wrapper${activeEnemy ? '' : ' enemy-image-wrapper--inactive'}`}>
                <img className="enemy-image" src={wildBoar} alt="" />
                <div className="enemy-stats"></div>
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}
