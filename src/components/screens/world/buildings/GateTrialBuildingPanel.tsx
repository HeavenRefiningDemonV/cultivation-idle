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
import { buildGateTrialReadinessSurface } from '../../../../systems/readiness/section5Adapters.js';
import { GateTrialReadinessCard } from '../../../../ui/trials/GateTrialReadinessCard.js';
import { GateTrialChecklist } from '../../../../ui/trials/GateTrialChecklist.js';

interface GateTrialBuildingPanelProps {
  cityId: string;
}

const DEFAULT_SEGMENT_COUNT = 3;
const MAX_SEGMENT_COUNT = 6;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function clampSegmentCount(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SEGMENT_COUNT;
  return Math.min(MAX_SEGMENT_COUNT, Math.max(1, Math.round(value)));
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
  const totalSegments = clampSegmentCount(lifecycle.failSafe.threshold ?? DEFAULT_SEGMENT_COUNT);
  const progressRatio = clamp01(eligibleFailures / Math.max(1, totalSegments));
  const filledSegments = Math.floor(progressRatio * totalSegments);
  const nextSegment = Math.min(totalSegments, filledSegments + 1);
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

  const handleChallengeTrial = () => {
    if (!city || !trialDef) return;
    if (!lifecycle.canStart) {
      addNotification('warning', lifecycle.reason);
      return;
    }
    openCombatPreview({ type: 'trial', cityId, sourceId: trialDef.id });
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

    const spent = inventory.spendCurrencies({
      gold: goldCost,
      spiritStones: spiritStoneCost,
      merit: meritCost,
    });

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
            <div className="ink-combat-shell__section">
              <div className="ink-combat-shell__actions">
                <button className="button-standard" onClick={handleChallengeTrial} disabled={!lifecycle.canStart} type="button">
                  Challenge Trial
                </button>
                <button className="button-standard button-standard--ghost" onClick={handleStopTrial} type="button">
                  Stop
                </button>
                {lifecycle.failSafe.canPurchase ? (
                  <button className="button-standard" onClick={handleFailSafePurchase} type="button">
                    Purchase {GATE_SUPPORT_LABELS.support} (
                    {
                      [
                        lifecycle.failSafe.cost?.gold ? `${lifecycle.failSafe.cost.gold} Gold` : null,
                        lifecycle.failSafe.cost?.spiritStones ? `${lifecycle.failSafe.cost.spiritStones} Spirit Stones` : null,
                        lifecycle.failSafe.cost?.merit ? `${lifecycle.failSafe.cost.merit} Merit` : null,
                      ]
                        .filter(Boolean)
                        .join(' / ')
                    }
                    )
                  </button>
                ) : null}
              </div>
              {!lifecycle.canStart ? <div className="ink-combat-shell__stat-line">Start blocked: {lifecycle.reason}</div> : null}
            </div>
            <div className="ink-combat-shell__section">
              <div className="ink-combat-shell__section-title">Eligible Defeats</div>
              <div className="gate-trial__progress">
                <div className="gate-trial__segments" style={{ gridTemplateColumns: `repeat(${Math.min(totalSegments, MAX_SEGMENT_COUNT)}, minmax(0, 1fr))` }}>
                  {Array.from({ length: totalSegments }).map((_, idx) => {
                    const segmentIndex = idx + 1;
                    const completed = segmentIndex <= filledSegments;
                    const current = segmentIndex === nextSegment && filledSegments < totalSegments;
                    return (
                      <div
                        key={segmentIndex}
                        className={`gate-trial__segment${completed ? ' gate-trial__segment--filled' : ''}${current ? ' gate-trial__segment--current' : ''}`}
                      />
                    );
                  })}
                  {lifecycle.failSafe.threshold > MAX_SEGMENT_COUNT ? (
                    <div className="gate-trial__segment gate-trial__segment--overflow">+</div>
                  ) : null}
                </div>
                <div className="gate-trial__progress-text">
                  Eligible defeats: {eligibleFailures} / {lifecycle.failSafe.threshold}
                </div>
              </div>
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
            <div className="ink-combat-shell__section">
              <div className="ink-combat-shell__section-title">Gate Status</div>
              <div className="ink-combat-shell__stat-line">Trial: {trialDef.name ?? trialDef.id}</div>
              <div className="ink-combat-shell__stat-line">Gate state: {labelForState(lifecycle.state)}</div>
              <div className="ink-combat-shell__stat-line">Gate reward: {gateItemName ?? 'Unknown'}</div>
              <div className="ink-combat-shell__stat-line">Eligibility rule: {eligibilitySummary.summary}</div>
              {requiredItemName ? (
                <div className="ink-combat-shell__stat-line">Required item: {requiredItemName}</div>
              ) : null}
              <div className="ink-combat-shell__stat-line">
                {GATE_SUPPORT_LABELS.support}: {lifecycle.failSafe.status === 'resolved' ? 'Resolved' : lifecycle.failSafe.canPurchase ? 'Available' : `Locked (${eligibleFailures}/${lifecycle.failSafe.threshold} eligible defeats)`}
              </div>
              {trialProgress?.resolution === 'bypassed' ? (
                <div className="ink-combat-shell__stat-line">Resolved via bypass.</div>
              ) : null}
              {eligibilitySummary.raw ? (
                <details className="gate-trial__eligibility-details">
                  <summary>Show requirements</summary>
                  <pre>{eligibilitySummary.raw}</pre>
                </details>
              ) : null}
            </div>
            <div className="ink-combat-shell__section gate-trial__support-summary">
              <div className="ink-combat-shell__section-title">{GATE_SUPPORT_LABELS.support} Reserve</div>
              <div className="ink-combat-shell__stat-line">{supportSurface.reserveHeadline}</div>
              <div className="ink-combat-shell__stat-line">
                Merit on hand: {supportSurface.readModel.currentMerit} / Safety Net cost {supportSurface.readModel.nextGateFailSafeCost?.merit ?? '0'}
              </div>
              <div className="ink-combat-shell__stat-line">
                Merit safe band: {supportSurface.readModel.meritMinimumReserveLow}–{supportSurface.readModel.meritMinimumReserveHigh} • target {supportSurface.readModel.targetMeritReserve}
              </div>
              <div className="ink-combat-shell__stat-line">
                Spirit Stones: {supportSurface.readModel.currentSpiritStones} / Safety Net cost {supportSurface.readModel.nextGateFailSafeCost?.spiritStones ?? '0'}
              </div>
              <div className="ink-combat-shell__stat-line">
                Spirit reserve minimum {supportSurface.readModel.spiritStoneMinimumReserve} • ideal {supportSurface.readModel.spiritStoneIdealReserve}
              </div>
              <div className="ink-combat-shell__stat-line">{supportSurface.reserveGapLine}</div>
              <div className="ink-combat-shell__stat-line gate-trial__eligible-merit-line">{supportSurface.eligibleDefeatRewardLine}</div>
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
