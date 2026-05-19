import { useCallback, useMemo } from 'react';

import { useActivityStore } from '../../../stores/activityStore.js';
import { useCombatStore } from '../../../stores/combatStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { useTrialStore } from '../../../stores/trialStore.js';
import { useUIStore } from '../../../stores/uiStore.js';

import { RewardService } from '../../../services/rewards/index.js';
import { getTrialLifecycleSnapshot } from '../../../systems/progression/runtime/trialLifecycle.js';
import { getTrialGateRewardBundle } from '../../../systems/progression/runtime/gateResolver.js';
import { resolveModuleRef } from '../../../components/screens/world/worldUtils.js';

import type {
  GateTrialExactSurfaceV1,
  GateTrialFixSurface,
  GateTrialReadinessNodeId,
  GateTrialTacticalCellId,
} from './gateTrialExactTypes.js';

export interface GateTrialExactActionControllerOptions {
  cityId: string;
  trialId?: string | null;
  surface: GateTrialExactSurfaceV1;
}

export interface GateTrialExactActionController {
  onPrimaryAction: () => void;
  onSafetyNetAction: () => void;
  onTopFixAction: (fix: GateTrialFixSurface) => void;
  onTacticalCellAction: (cellId: GateTrialTacticalCellId) => void;
  onReadinessNodeAction: (nodeId: GateTrialReadinessNodeId) => void;
}

function resolveGateTrialActionContext(cityId: string, requestedTrialId?: string | null) {
  const contentStore = useContentStore.getState();
  const city = contentStore.maps.citiesById[cityId] ?? null;
  const resolvedTrialId =
    requestedTrialId ??
    resolveModuleRef(city, 'gateTrial') ??
    null;

  const trialDef = resolvedTrialId
    ? contentStore.maps.trialsById[resolvedTrialId] ?? null
    : null;

  return { contentStore, city, resolvedTrialId, trialDef };
}

type GateTrialActionTrialDef = NonNullable<ReturnType<typeof resolveGateTrialActionContext>['trialDef']>;

function buildLatestGateTrialLifecycle(trialDef: GateTrialActionTrialDef | null | undefined) {
  if (!trialDef) return null;

  const contentStore = useContentStore.getState();
  const trialStore = useTrialStore.getState();
  const inventory = useInventoryStore.getState();
  const gameState = useGameStore.getState();

  const progress = trialStore.getProgress(trialDef.id);
  const requiredItemSatisfied = trialDef.requiredItemId
    ? inventory.getItemCount(trialDef.requiredItemId) > 0
    : true;

  return getTrialLifecycleSnapshot({
    content: contentStore.raw,
    trial: trialDef,
    progress,
    realm: gameState.realm,
    qi: gameState.qi,
    breakthroughRequirement: gameState.getBreakthroughRequirement(),
    requiredItemSatisfied,
  });
}

function isMatchingTrialAttemptActive(trialId: string): boolean {
  const active = useActivityStore.getState().active;
  const combatContext = useCombatStore.getState().combatContext;

  return (
    (active?.type === 'trial' && active.sourceId === trialId) ||
    (combatContext.type === 'trial' && combatContext.trialId === trialId)
  );
}

function openApothecaryPouch(cityId: string) {
  useUIStore.getState().openWorldBuildingModal({
    cityId,
    buildingKey: 'apothecary',
    intent: { apothecarySurface: 'pouch' },
  });
}

function openForgeModule(cityId: string) {
  useUIStore.getState().openWorldBuildingModal({
    cityId,
    buildingKey: 'forge',
  });
}

function openRuinsModule(cityId: string) {
  useUIStore.getState().openWorldBuildingModal({
    cityId,
    buildingKey: 'ruins',
  });
}

function openBountiesModule(cityId: string) {
  useUIStore.getState().openWorldBuildingModal({
    cityId,
    buildingKey: 'bounties',
  });
}

function openExpeditionsModule(cityId: string) {
  useUIStore.getState().openWorldBuildingModal({
    cityId,
    buildingKey: 'expeditions',
  });
}

function openTechniquesTab() {
  useUIStore.getState().setActiveTab('techniques');
  useUIStore.getState().closeWorldBuildingModal();
}

function openCultivationTab() {
  useUIStore.getState().setActiveTab('cultivation');
  useUIStore.getState().closeWorldBuildingModal();
}

export function useGateTrialExactActionController(
  options: GateTrialExactActionControllerOptions,
): GateTrialExactActionController {
  const { cityId, trialId, surface } = options;
  const addNotification = useUIStore((state) => state.addNotification);
  const isLiveSurface = surface.meta.mode === 'live';

  const notifyFixturePreview = useCallback(() => {
    addNotification('info', 'Gate Trial Exact is in fixture preview mode.');
  }, [addNotification]);

  const startGateTrialAttempt = useCallback(() => {
    if (!isLiveSurface) {
      notifyFixturePreview();
      return;
    }

    const { contentStore, city, trialDef } = resolveGateTrialActionContext(cityId, trialId);
    if (!city) {
      addNotification('error', 'Gate Trial city is unavailable.');
      return;
    }
    if (!trialDef) {
      addNotification('error', 'Gate Trial definition is unavailable.');
      return;
    }
    if (!trialDef.bossId) {
      addNotification('error', 'Gate guardian is unavailable.');
      return;
    }

    const lifecycle = buildLatestGateTrialLifecycle(trialDef);
    if (!lifecycle) {
      addNotification('error', 'Gate Trial readiness is unavailable.');
      return;
    }
    if (!lifecycle.canStart) {
      addNotification('warning', lifecycle.reason);
      return;
    }

    const activityStore = useActivityStore.getState();
    const combatStore = useCombatStore.getState();
    const active = activityStore.active;
    const combatContext = combatStore.combatContext;
    const sameTrialActivity = active?.type === 'trial' && active.sourceId === trialDef.id;
    const sameTrialCombat = combatContext.type === 'trial' && combatContext.trialId === trialDef.id;

    if (sameTrialActivity || sameTrialCombat) {
      addNotification('info', 'Gate Trial attempt is already active.');
      return;
    }
    if (active) {
      addNotification('warning', 'Stop the current activity before attempting the gate.');
      return;
    }
    if (combatStore.inCombat) {
      addNotification('warning', 'Stop current combat before attempting the gate.');
      return;
    }

    const cityIdFromContext = city.id ?? trialDef.cityId;
    activityStore.startActivity('trial', {
      cityId: cityIdFromContext,
      sourceId: trialDef.id,
    }, 'gate-trial-exact-attempt');
    combatStore.setAutoAttack(true);
    combatStore.setAutoCombatAI(true);
    combatStore.startCombat(trialDef.bossId, {
      type: 'trial',
      cityId: cityIdFromContext,
      trialId: trialDef.id,
      countsTowardFailSafe: lifecycle.countsTowardFailSafeOnStart,
      rewardBundle: getTrialGateRewardBundle(contentStore.raw, trialDef),
    });
    addNotification('success', 'Gate Trial attempt started.');
  }, [addNotification, cityId, isLiveSurface, notifyFixturePreview, trialId]);

  const purchaseSafetyNet = useCallback(() => {
    if (!isLiveSurface) {
      notifyFixturePreview();
      return;
    }

    const { contentStore, city, trialDef } = resolveGateTrialActionContext(cityId, trialId);
    if (!city) {
      addNotification('error', 'Gate Trial city is unavailable.');
      return;
    }
    if (!trialDef) {
      addNotification('error', 'Gate Trial definition is unavailable.');
      return;
    }
    if (isMatchingTrialAttemptActive(trialDef.id)) {
      addNotification('warning', 'Stop the active attempt before buying Safety Net.');
      return;
    }

    const lifecycle = buildLatestGateTrialLifecycle(trialDef);
    if (!lifecycle) {
      addNotification('error', 'Gate Trial readiness is unavailable.');
      return;
    }
    if (lifecycle.isResolved) {
      addNotification('info', 'Gate Trial is already resolved.');
      return;
    }
    if (!lifecycle.failSafe.canPurchase) {
      addNotification('warning', lifecycle.failSafe.blockedReason ?? 'Safety Net is not available yet.');
      return;
    }
    if (!lifecycle.failSafe.cost) {
      addNotification('error', 'Safety Net cost is unavailable.');
      return;
    }

    const inventory = useInventoryStore.getState();
    const canAfford = inventory.canAffordCurrency(lifecycle.failSafe.cost);
    if (!canAfford) {
      addNotification('warning', 'Cannot afford Safety Net purchase.');
      return;
    }

    const spent = RewardService.spendCurrency(
      lifecycle.failSafe.cost,
      `gate_fail_safe:${trialDef.id}`,
    );
    if (!spent) {
      addNotification('error', 'Failed to deduct currencies for Safety Net purchase.');
      return;
    }

    RewardService.grantRewards(
      getTrialGateRewardBundle(contentStore.raw, trialDef),
      'Safety Net gate purchase',
    );
    useTrialStore.getState().markBypassed(trialDef.id);
    addNotification('success', 'Safety Net secured the gate catalyst.');
  }, [addNotification, cityId, isLiveSurface, notifyFixturePreview, trialId]);

  const stopGateTrialAttempt = useCallback(() => {
    if (!isLiveSurface) {
      notifyFixturePreview();
      return;
    }

    const { trialDef } = resolveGateTrialActionContext(cityId, trialId);
    if (!trialDef) {
      addNotification('error', 'Gate Trial definition is unavailable.');
      return;
    }

    const active = useActivityStore.getState().active;
    const combat = useCombatStore.getState();
    const activeMatches = active?.type === 'trial' && active.sourceId === trialDef.id;
    const combatMatches = combat.combatContext.type === 'trial' && combat.combatContext.trialId === trialDef.id;

    if (!activeMatches && !combatMatches) {
      addNotification('info', 'No active Gate Trial attempt to stop.');
      return;
    }
    if (active && !activeMatches) {
      addNotification('warning', 'Stop the current activity before stopping the Gate Trial attempt.');
      return;
    }

    useUIStore.getState().stopCombatAndClose();
    addNotification('success', 'Gate Trial attempt stopped.');
  }, [addNotification, cityId, isLiveSurface, notifyFixturePreview, trialId]);

  const breakthroughHandoff = useCallback(() => {
    if (!isLiveSurface) {
      notifyFixturePreview();
      return;
    }

    openCultivationTab();
  }, [isLiveSurface, notifyFixturePreview]);

  const routeToFix = useCallback((fix: GateTrialFixSurface) => {
    if (!isLiveSurface) {
      notifyFixturePreview();
      return;
    }
    if (!fix.button.enabled) {
      addNotification('warning', fix.button.disabledReason ?? 'That fix is not available.');
      return;
    }

      switch (fix.routeTarget) {
      case 'forge':
        openForgeModule(cityId);
        return;
      case 'apothecary':
        openApothecaryPouch(cityId);
        return;
      case 'techniques':
      case 'loadout':
        openTechniquesTab();
        return;
      case 'ruins':
        openRuinsModule(cityId);
        return;
      case 'bounties':
        openBountiesModule(cityId);
        return;
      case 'expeditions':
        openExpeditionsModule(cityId);
        return;
      case 'cultivation':
        openCultivationTab();
        return;
      case 'gateTrial':
        addNotification('info', 'Gate Trial is already open.');
        return;
    }
  }, [addNotification, cityId, isLiveSurface, notifyFixturePreview]);

  const handlePrimaryAction = useCallback(() => {
    if (!isLiveSurface) {
      notifyFixturePreview();
      return;
    }
    if (!surface.primaryAction.enabled) {
      addNotification('warning', surface.primaryAction.disabledReason ?? 'Gate action is unavailable.');
      return;
    }

    switch (surface.primaryAction.intent) {
      case 'attempt-gate':
        startGateTrialAttempt();
        return;
      case 'stop-attempt':
        stopGateTrialAttempt();
        return;
      case 'buy-safety-net':
        purchaseSafetyNet();
        return;
      case 'breakthrough-handoff':
        breakthroughHandoff();
        return;
      default:
        addNotification('warning', 'Gate action is unavailable.');
    }
  }, [
    addNotification,
    breakthroughHandoff,
    isLiveSurface,
    notifyFixturePreview,
    purchaseSafetyNet,
    startGateTrialAttempt,
    stopGateTrialAttempt,
    surface.primaryAction.disabledReason,
    surface.primaryAction.enabled,
    surface.primaryAction.intent,
  ]);

  const handleTacticalCellAction = useCallback((cellId: GateTrialTacticalCellId) => {
    if (!isLiveSurface) {
      notifyFixturePreview();
      return;
    }

    switch (cellId) {
      case 'hp':
      case 'gate':
        return;
      case 'loadout':
      case 'aiProfile':
        openTechniquesTab();
        return;
      case 'healing':
        openApothecaryPouch(cityId);
        return;
      case 'bounty':
        openBountiesModule(cityId);
        return;
      case 'expedition':
        openExpeditionsModule(cityId);
        return;
    }
  }, [cityId, isLiveSurface, notifyFixturePreview]);

  const handleReadinessNodeAction = useCallback((nodeId: GateTrialReadinessNodeId) => {
    if (!isLiveSurface) {
      notifyFixturePreview();
      return;
    }

    switch (nodeId) {
      case 'qiCap':
        openCultivationTab();
        return;
      case 'loadout':
      case 'techniques':
        openTechniquesTab();
        return;
      case 'weapon':
        openForgeModule(cityId);
        return;
      case 'medicine':
        openApothecaryPouch(cityId);
        return;
      case 'safetyNet':
        if (surface.recommendedPanel.safetyNetButton.enabled) {
          purchaseSafetyNet();
        } else {
          addNotification(
            'warning',
            surface.recommendedPanel.safetyNetButton.disabledReason ?? 'Safety Net is not available yet.',
          );
        }
        return;
      case 'gate':
        if (surface.primaryAction.enabled) {
          handlePrimaryAction();
        } else {
          addNotification('warning', surface.primaryAction.disabledReason ?? 'Gate action is unavailable.');
        }
        return;
    }
  }, [
    addNotification,
    cityId,
    handlePrimaryAction,
    isLiveSurface,
    notifyFixturePreview,
    purchaseSafetyNet,
    surface.primaryAction.disabledReason,
    surface.primaryAction.enabled,
    surface.recommendedPanel.safetyNetButton.disabledReason,
    surface.recommendedPanel.safetyNetButton.enabled,
  ]);

  return useMemo(() => ({
    onPrimaryAction: handlePrimaryAction,
    onSafetyNetAction: purchaseSafetyNet,
    onTopFixAction: routeToFix,
    onTacticalCellAction: handleTacticalCellAction,
    onReadinessNodeAction: handleReadinessNodeAction,
  }), [
    handlePrimaryAction,
    purchaseSafetyNet,
    routeToFix,
    handleTacticalCellAction,
    handleReadinessNodeAction,
  ]);
}
