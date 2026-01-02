import { useMemo } from 'react';

import { RewardService } from '../../../../services/rewards';
import { useActivityStore } from '../../../../stores/activityStore';
import { useCityStore } from '../../../../stores/cityStore';
import { useCombatStore } from '../../../../stores/combatStore';
import { useContentStore } from '../../../../stores/contentStore';
import { useInventoryStore } from '../../../../stores/inventoryStore';
import { useTrialStore } from '../../../../stores/trialStore';
import { resolveModuleRef } from '../worldUtils';
import { CombatTheaterPreviewCard } from './CombatTheaterPreviewCard';

interface GateTrialBuildingPanelProps {
  cityId: string;
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
  const startActivity = useActivityStore((state) => state.startActivity);
  const stopActivity = useActivityStore((state) => state.stopActivity);

  const combatContext = useCombatStore((state) => state.combatContext);
  const startCombat = useCombatStore((state) => state.startCombat);
  const exitCombat = useCombatStore((state) => state.exitCombat);
  const setAutoAttack = useCombatStore((state) => state.setAutoAttack);
  const setAutoCombatAI = useCombatStore((state) => state.setAutoCombatAI);

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
  const failSafeUnlocked = Boolean(
    trialDef &&
      isTrialEligible &&
      !isTrialActive &&
      !gateItemOwned &&
      trialFailSafeCost &&
      (trialProgress?.attempts ?? 0) >= trialFailSafeThreshold,
  );
  const trialEligibilityRule = trialDef?.eligibilityRule
    ? typeof trialDef.eligibilityRule === 'string'
      ? trialDef.eligibilityRule
      : String(trialDef.eligibilityRule)
    : 'No eligibility rule provided';

  const parsedEligibility = useMemo(() => {
    const trimmed = trialEligibilityRule?.trim();
    if (!trimmed || !trimmed.startsWith('{')) return null;
    try {
      const parsed = JSON.parse(trimmed);
      return typeof parsed === 'object' && parsed ? parsed : null;
    } catch (err) {
      console.warn('[GateTrial] Failed to parse eligibility rule', err);
      return null;
    }
  }, [trialEligibilityRule]);

  const formatFailSafeCost = () => {
    if (!trialFailSafeCost) return '';
    return [
      trialFailSafeCost.gold ? `${trialFailSafeCost.gold} Gold` : null,
      trialFailSafeCost.spiritStones ? `${trialFailSafeCost.spiritStones} Spirit Stones` : null,
      trialFailSafeCost.merit ? `${trialFailSafeCost.merit} Merit` : null,
    ]
      .filter(Boolean)
      .join(' / ');
  };

  const handleChallengeTrial = () => {
    if (!city || !trialDef || !isTrialEligible) return;

    if (combatContext.type) {
      exitCombat();
    }

    stopActivity();
    startActivity('trial', { cityId, sourceId: trialDef.id });
    setAutoAttack(true);
    setAutoCombatAI(true);

    startCombat(trialDef.bossId, {
      type: 'trial',
      cityId,
      trialId: trialDef.id,
      gateItemId: trialDef.gateItemId,
      eligible: isTrialEligible,
    });
  };

  const handleStopTrial = () => {
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
      <CombatTheaterPreviewCard moduleLabel="Gate Trial" title="Gate Trial" variant="gateTrial">
        <div className="combatPreviewCard__item">
          <div className="combatPreviewCard__label">Status</div>
          <div className="combatPreviewCard__value">Unavailable for this city.</div>
        </div>
      </CombatTheaterPreviewCard>
    );
  }

  return (
    <CombatTheaterPreviewCard
      moduleLabel="Gate Trial"
      title={trialDef.name ?? 'Gate Trial'}
      subtitle={`Boss: ${trialBossName ?? 'Unknown'}`}
      variant="gateTrial"
      statusLine={`Activity: ${isTrialActive ? 'Active' : 'Inactive'}`}
      actions={
        <>
          <button
            className="button-standard combatPreviewCard__primary"
            onClick={handleChallengeTrial}
            disabled={!isTrialEligible || !trialDef}
            type="button"
          >
            Challenge Trial
          </button>
          <button className="button-standard" onClick={handleStopTrial} type="button">
            Stop
          </button>
          {failSafeUnlocked && trialFailSafeCost && (
            <button className="button-standard" onClick={handleFailSafePurchase} type="button">
              Purchase Gate Item ({formatFailSafeCost()})
            </button>
          )}
        </>
      }
    >
      <div className="combatPreviewCard__item">
        <div className="combatPreviewCard__label">Boss</div>
        <div className="combatPreviewCard__value">{trialBossName ?? 'Unknown'}</div>
      </div>

      <div className="combatPreviewCard__item">
        <div className="combatPreviewCard__label">Eligibility</div>
        {parsedEligibility ? (
          <div className="combatPreviewCard__badgeRow">
            {Object.entries(parsedEligibility).map(([key, value]) => (
              <div key={key} className="combatPreviewCard__badge">
                {key}: {String(value)}
              </div>
            ))}
          </div>
        ) : (
          <div className="combatPreviewCard__value">{trialEligibilityRule}</div>
        )}
      </div>

      <div className="combatPreviewCard__item">
        <div className="combatPreviewCard__label">Required Item</div>
        <div className="combatPreviewCard__value">{gateItemName ?? 'Unknown'}</div>
        <div className="combatPreviewCard__badgeRow">
          <div className="combatPreviewCard__badge">{gateItemOwned ? 'Owned' : 'Missing'}</div>
        </div>
      </div>

      <div className="combatPreviewCard__item">
        <div className="combatPreviewCard__label">Cleared</div>
        <div className="combatPreviewCard__value">{trialProgress?.cleared || cityFlags?.gateTrialCleared ? 'Yes' : 'No'}</div>
      </div>

      <div className="combatPreviewCard__item">
        <div className="combatPreviewCard__label">Attempts</div>
        <div className="combatPreviewCard__value">{trialProgress?.attempts ?? 0}</div>
      </div>
    </CombatTheaterPreviewCard>
  );
}
