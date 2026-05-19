import { RewardService } from '../../../services/rewards/index.js';
import { useActivityStore } from '../../../stores/activityStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { useTrialStore } from '../../../stores/trialStore.js';
import { useUIStore } from '../../../stores/uiStore.js';
import { getTrialGateRewardBundle, getTrialLifecycleSnapshot } from '../../progression/runtime/index.js';
import { openWorldModule } from '../../world/openWorldModule.js';
import type { PostFailureFixSurface } from './postFailureSurface.js';
import { GATE_SUPPORT_LABELS } from '../../../ui/text/playerFacingLabels.js';

export interface PerformPostFailureFixActionArgs {
  action: PostFailureFixSurface;
  cityId: string | null;
  trialId: string | null;
  onRetryGate?: () => void;
  onBuySafetyNet?: () => void;
  onFocusTrialSection?: (section: 'combat_options' | 'safety_net' | 'readiness') => void;
}

interface PostFailureFixActionDeps {
  closeCombatPresentation: () => void;
  closeWorldBuildingModal: () => void;
  setActiveTab: ReturnType<typeof useUIStore.getState>['setActiveTab'];
  openWorldModule: typeof openWorldModule;
  addNotification: ReturnType<typeof useUIStore.getState>['addNotification'];
}

function resolveDefaultDeps(): PostFailureFixActionDeps {
  const ui = useUIStore.getState();
  return {
    closeCombatPresentation: ui.closeCombatPresentation,
    closeWorldBuildingModal: ui.closeWorldBuildingModal,
    setActiveTab: ui.setActiveTab,
    openWorldModule,
    addNotification: ui.addNotification,
  };
}

function routeToTab(tab: 'cultivation' | 'techniques', deps: PostFailureFixActionDeps) {
  deps.closeCombatPresentation();
  deps.closeWorldBuildingModal();
  deps.setActiveTab(tab);
}

function performSafetyNetPurchase(trialId: string, deps: PostFailureFixActionDeps): boolean {
  const trialDef = useContentStore.getState().maps.trialsById[trialId] ?? null;
  if (!trialDef) {
    deps.addNotification('warning', 'Gate Trial is unavailable.');
    return false;
  }

  const trialProgress = useTrialStore.getState().getProgress(trialId);
  const requiredItemSatisfied = !trialDef.requiredItemId || useInventoryStore.getState().getItemCount(trialDef.requiredItemId) > 0;
  const game = useGameStore.getState();
  const lifecycle = getTrialLifecycleSnapshot({
    content: useContentStore.getState().raw,
    trial: trialDef,
    progress: trialProgress,
    realm: game.realm,
    qi: game.qi,
    breakthroughRequirement: game.getBreakthroughRequirement(),
    requiredItemSatisfied,
  });

  if (!lifecycle.failSafe.canPurchase || !lifecycle.failSafe.cost) {
    deps.addNotification('warning', lifecycle.failSafe.blockedReason ?? `${GATE_SUPPORT_LABELS.support} is not available.`);
    return false;
  }

  const isTrialActive = useActivityStore.getState().active?.type === 'trial' && useActivityStore.getState().active?.sourceId === trialId;
  if (isTrialActive) {
    deps.addNotification('warning', `${GATE_SUPPORT_LABELS.support} cannot be purchased during an active trial.`);
    return false;
  }

  const inventory = useInventoryStore.getState();
  const cost = {
    gold: lifecycle.failSafe.cost.gold,
    spiritStones: lifecycle.failSafe.cost.spiritStones,
    merit: lifecycle.failSafe.cost.merit,
  };

  if (!inventory.canAffordCurrency(cost)) {
    deps.addNotification('warning', `Cannot afford ${GATE_SUPPORT_LABELS.support} purchase.`);
    return false;
  }

  if (!inventory.spendCurrencies(cost)) {
    deps.addNotification('warning', `Failed to deduct currencies for ${GATE_SUPPORT_LABELS.support} purchase.`);
    return false;
  }

  RewardService.grantRewards(getTrialGateRewardBundle(useContentStore.getState().raw, trialDef), `${GATE_SUPPORT_LABELS.support} gate purchase`);
  useTrialStore.getState().markBypassed(trialId);
  deps.addNotification('success', `${GATE_SUPPORT_LABELS.support} purchased. Gate resolved.`);
  return true;
}

export function performPostFailureFixActionWithDeps(
  args: PerformPostFailureFixActionArgs,
  deps: PostFailureFixActionDeps,
): void {
  const { action, cityId, trialId, onRetryGate, onBuySafetyNet, onFocusTrialSection } = args;

  if (action.blocked) {
    deps.addNotification('warning', action.blockedReason ?? 'This action is currently unavailable.');
    return;
  }

  if (action.target.kind === 'tab') {
    if (action.target.tab === 'cultivation' || action.target.tab === 'techniques') {
      routeToTab(action.target.tab, deps);
      return;
    }
    deps.closeCombatPresentation();
    deps.closeWorldBuildingModal();
    deps.setActiveTab(action.target.tab);
    return;
  }

  if (action.target.kind === 'world_module') {
    if (!cityId && !action.target.cityId) {
      deps.addNotification('warning', 'No city selected for this module action.');
      return;
    }
    deps.closeCombatPresentation();
    deps.openWorldModule({
      cityId: action.target.cityId ?? cityId!,
      moduleKey: action.target.moduleKey,
      source: 'post-failure-fix',
    });
    return;
  }

  if (action.target.kind === 'apothecary_surface') {
    if (!cityId && !action.target.cityId) {
      deps.addNotification('warning', 'No city selected for Apothecary routing.');
      return;
    }
    deps.closeCombatPresentation();
    deps.openWorldModule({
      cityId: action.target.cityId ?? cityId!,
      moduleKey: 'apothecary',
      source: 'post-failure-fix',
      intent: { apothecarySurface: action.target.surface },
    });
    return;
  }

  if (action.target.kind === 'trial_local') {
    if (action.target.action === 'retry') {
      onRetryGate?.();
      return;
    }
    if (action.target.action === 'buy_safety_net') {
      if (onBuySafetyNet) {
        onBuySafetyNet();
        return;
      }
      if (!trialId) {
        deps.addNotification('warning', `${GATE_SUPPORT_LABELS.support} purchase needs an active gate trial context.`);
        return;
      }
      performSafetyNetPurchase(trialId, deps);
      return;
    }
    if (action.target.action === 'focus_combat_options') {
      onFocusTrialSection?.('combat_options');
      return;
    }
    if (action.target.action === 'focus_safety_net') {
      onFocusTrialSection?.('safety_net');
      return;
    }
    return;
  }

  deps.addNotification('warning', 'No route available for this action yet.');
}

export function performPostFailureFixAction(args: PerformPostFailureFixActionArgs): void {
  performPostFailureFixActionWithDeps(args, resolveDefaultDeps());
}
