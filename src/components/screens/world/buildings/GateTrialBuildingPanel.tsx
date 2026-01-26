import { useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useActivityStore } from '../../../../stores/activityStore';
import { useCityStore } from '../../../../stores/cityStore';
import { useCombatStore } from '../../../../stores/combatStore';
import { useContentStore } from '../../../../stores/contentStore';
import { useInventoryStore } from '../../../../stores/inventoryStore';
import { useTrialStore } from '../../../../stores/trialStore';
import { RewardService } from '../../../../services/rewards';
import { resolveModuleRef } from '../worldUtils';
import { useUIStore } from '../../../../stores/uiStore';
import { hpPercent } from '../../../../systems/combat/minibarModel';
import { formatNumber } from '../../../../utils/numbers';
import { InkCombatShell } from '../../../../ui/combat/InkCombatShell';
import { InkHealthBar } from '../../../../ui/combat/InkHealthBar';
import cultivatorFight from '../../../../assets/onscreen/cultivator_backshots.png';
import wildBoar from '../../../../assets/enemies/widboar.png';
import './CombatStyles.scss';

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
  if (!eligibility) {
    return { summary: 'No eligibility rule provided' };
  }

  if (typeof eligibility === 'string') {
    return { summary: eligibility };
  }

  if (typeof eligibility === 'number' || typeof eligibility === 'boolean') {
    return { summary: String(eligibility) };
  }

  try {
    const raw = JSON.stringify(eligibility, null, 2);
    return { summary: 'See requirements', raw };
  } catch (error) {
    return { summary: 'See requirements', raw: String(eligibility) };
  }
}

export function GateTrialBuildingPanel({ cityId }: GateTrialBuildingPanelProps) {
  const city = useContentStore((state) => state.maps.citiesById[cityId]);
  const trialsById = useContentStore((state) => state.maps.trialsById);
  const enemiesById = useContentStore((state) => state.maps.enemiesById);
  const itemsById = useContentStore((state) => state.maps.itemsById);
  const economy = useContentStore((state) => state.raw?.economy);
  const gateTrialEconomy = (economy as any)?.manualSystem?.gateTrials;

  const cityFlags = useCityStore((state) => state.cityFlagsById[cityId]);

  const trialProgressById = useTrialStore((state) => state.progressByTrialId);

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

  const getItemCount = useInventoryStore((state) => state.getItemCount);

  const trialRefId = useMemo(() => resolveModuleRef(city ?? null, 'gateTrial'), [city]);
  const trialDef = trialRefId ? trialsById[trialRefId] : undefined;
  const trialProgress = trialRefId
    ? trialProgressById[trialRefId] ?? { attempts: 0, cleared: false, lastAttemptAt: null, lastClearAt: null }
    : null;

  const isTrialActive = activeActivity?.type === 'trial' && activeActivity.sourceId === trialRefId;
  const trialCityIndex = trialDef?.cityIndex ?? city?.index ?? 0;
  const trialBossName = trialDef ? enemiesById[trialDef.bossId]?.name ?? trialDef.bossId : null;
  const gateItemName = trialDef ? itemsById[trialDef.gateItemId]?.name ?? trialDef.gateItemId : null;
  const gateItemOwned = trialDef ? getItemCount(trialDef.gateItemId) > 0 : false;

  const trialFailSafeThreshold = useMemo(() => {
    return (
      trialDef?.failSafe?.thresholdAttempts ??
      gateTrialEconomy?.failSafe?.failThresholdEligibleAttempts ??
      3
    );
  }, [gateTrialEconomy, trialDef]);

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
  const trialAttempts = trialProgress?.attempts ?? 0;
  const totalSegments = clampSegmentCount(trialFailSafeThreshold ?? DEFAULT_SEGMENT_COUNT);
  const progressRatio = clamp01(trialAttempts / Math.max(1, totalSegments));
  const filledSegments = Math.floor(progressRatio * totalSegments);
  const nextSegment = Math.min(totalSegments, filledSegments + 1);

  const trialFailSafeCost = useMemo(() => {
    const normalize = (value: unknown) => {
      if (typeof value === 'number') return value.toString();
      if (typeof value === 'string') return value;
      return undefined;
    };

    const fallback = gateTrialEconomy?.failSafe?.purchaseCostByCityIndex?.[trialCityIndex];
    const merged = trialDef?.failSafe?.cost ?? fallback;
    if (!merged) return null;
    const cost = {
      gold: normalize((merged as any).gold),
      spiritStones: normalize((merged as any).spiritStones),
      merit: normalize((merged as any).merit),
    };
    if (!cost.gold && !cost.spiritStones && !cost.merit) return null;
    return cost;
  }, [gateTrialEconomy, trialCityIndex, trialDef?.failSafe?.cost]);

  const isTrialEligible = Boolean(trialDef && !(trialProgress?.cleared || cityFlags?.gateTrialCleared));
  const trialSubtitle = isTrialEligible ? 'One-on-one gate challenge' : 'Cleared — repeat for practice';
  const failSafeUnlocked = Boolean(
    trialDef &&
      isTrialEligible &&
      !isTrialActive &&
      !gateItemOwned &&
      trialFailSafeCost &&
      (trialProgress?.attempts ?? 0) >= trialFailSafeThreshold,
  );
  const eligibilitySummary = formatEligibility(trialDef?.eligibilityRule);

  const handleChallengeTrial = () => {
    if (!city || !trialDef || !isTrialEligible) return;
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
    if (!trialDef || !trialFailSafeCost || !isTrialEligible || isTrialActive) return;

    const inventory = useInventoryStore.getState();
    const goldCost = trialFailSafeCost.gold;
    const spiritStoneCost = trialFailSafeCost.spiritStones;
    const meritCost = trialFailSafeCost.merit;

    const canAfford = inventory.canAffordCurrency({
      gold: goldCost,
      spiritStones: spiritStoneCost,
      merit: meritCost,
    });

    if (!canAfford) {
      console.warn('[WorldScreen] Cannot afford fail-safe purchase');
      return;
    }

    const spent = inventory.spendCurrencies({
      gold: goldCost,
      spiritStones: spiritStoneCost,
      merit: meritCost,
    });

    if (!spent) {
      console.warn('[WorldScreen] Failed to deduct currencies for fail-safe purchase');
      return;
    }

    RewardService.grantRewards(
      { items: [{ itemId: trialDef.gateItemId, qty: 1 }] },
      'Gate Trial fail-safe purchase',
    );
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
    <div className={'worldScreenPlaceholder'}>
      <InkCombatShell
        title="Gate Trial"
        subtitle={trialSubtitle}
        onClose={closeWorldBuildingModal}
        className="ink-combat-shell--gate-trial"
        leftSidebar={
          <>
            <div className="ink-combat-shell__section">
              <div className="ink-combat-shell__actions">
                <button
                  className="button-standard"
                  onClick={handleChallengeTrial}
                  disabled={!isTrialEligible || !trialDef}
                  type="button"
                >
                  Challenge Trial
                </button>
                <button className="button-standard button-standard--ghost" onClick={handleStopTrial} type="button">
                  Stop
                </button>
                {failSafeUnlocked && trialFailSafeCost && (
                  <button className="button-standard" onClick={handleFailSafePurchase} type="button">
                    Emergency Gate Item Purchase (
                    {
                      [
                        trialFailSafeCost.gold ? `${trialFailSafeCost.gold} Gold` : null,
                        trialFailSafeCost.spiritStones ? `${trialFailSafeCost.spiritStones} Spirit Stones` : null,
                        trialFailSafeCost.merit ? `${trialFailSafeCost.merit} Merit` : null,
                      ]
                        .filter(Boolean)
                        .join(' / ')
                    }
                    )
                  </button>
                )}
              </div>
            </div>
            <div className="ink-combat-shell__section">
              <div className="ink-combat-shell__section-title">Trial Progress</div>
              <div className="gate-trial__progress">
                <div className="gate-trial__segments" style={{ gridTemplateColumns: `repeat(${Math.min(totalSegments, MAX_SEGMENT_COUNT)}, minmax(0, 1fr))` }}>
                  {Array.from({ length: totalSegments }).map((_, idx) => {
                    const segmentIndex = idx + 1;
                    const completed = segmentIndex <= filledSegments;
                    const current = segmentIndex === nextSegment && filledSegments < totalSegments;
                    return (
                      <div
                        key={segmentIndex}
                        className={`gate-trial__segment${completed ? ' gate-trial__segment--filled' : ''}${
                          current ? ' gate-trial__segment--current' : ''
                        }`}
                      />
                    );
                  })}
                  {trialFailSafeThreshold > MAX_SEGMENT_COUNT ? (
                    <div className="gate-trial__segment gate-trial__segment--overflow">+</div>
                  ) : null}
                </div>
                <div className="gate-trial__progress-text">
                  Progress: {trialAttempts} / {trialFailSafeThreshold}
                </div>
              </div>
            </div>
            <div className="ink-combat-shell__section">
              <div className="ink-combat-shell__section-title">Combat Options</div>
              <div className="ink-combat-shell__stat-line">Trial: {trialDef.name ?? trialDef.id}</div>
              <div className="ink-combat-shell__stat-line">Eligibility: {eligibilitySummary.summary}</div>
              <div className="ink-combat-shell__stat-line">
                Required item: {gateItemName ?? 'Unknown'} ({gateItemOwned ? 'Owned' : 'Missing'})
              </div>
              <div className="ink-combat-shell__stat-line">
                Cleared: {trialProgress?.cleared || cityFlags?.gateTrialCleared ? 'Yes' : 'No'}
              </div>
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
