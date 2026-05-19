import { getPrestigeAdvisorSurface } from '../../../src/features/prestige/prestigeAdvisorSurface.js';
import { buildCurrentLifeSummarySurface } from '../../../src/features/prestige/lifeSummarySurface.js';
import { GameEvents, type GameEvent } from '../../../src/services/events/GameEvents.js';
import { RewardService } from '../../../src/services/rewards/RewardService.js';
import { getTrialLifecycleSnapshot, getTrialGateRewardBundle } from '../../../src/systems/progression/runtime/index.js';
import { getLiveRealmByIndex } from '../../../src/systems/progression/runtime/liveRealmProjection.js';
import { useCityStore } from '../../../src/stores/cityStore.js';
import { useContentStore } from '../../../src/stores/contentStore.js';
import { useCultivationStore } from '../../../src/stores/cultivationStore.js';
import { useGameStore } from '../../../src/stores/gameStore.js';
import { useTrialStore } from '../../../src/stores/trialStore.js';
import { useUIStore } from '../../../src/stores/uiStore.js';
import { FRESH_SAVE_CHECKPOINT_ORDER } from './freshSaveCheckpointCatalog.js';
import type {
  FreshSaveCheckpointId,
  FreshSaveCheckpointRow,
  FreshSaveProgressionEventRow,
  FreshSaveRouteDefinition,
  FreshSaveRouteFailure,
  FreshSaveRouteId,
  FreshSaveRouteResult,
} from './freshSaveRouteTypes.js';
import { assertFreshSaveBootstrapInvariants, setupFreshSaveRun } from './setupFreshSaveRun.js';

export const FRESH_SAVE_ROUTE_CATALOG: readonly FreshSaveRouteDefinition[] = Object.freeze([
  {
    id: 'normal',
    policy: 'balanced',
    automationMode: 'automated_smoke_blocking',
    isBlockingSmokeRoute: true,
    description: 'Canonical representative fresh-life route. Blocking automated release smoke.',
    expectedCheckpoints: FRESH_SAVE_CHECKPOINT_ORDER,
  },
  {
    id: 'cautious',
    policy: 'safety_first',
    automationMode: 'manual_coverage',
    isBlockingSmokeRoute: false,
    description: 'Safer/slower route definition. Manual-coverage-first until distinct honest automation exists.',
    expectedCheckpoints: FRESH_SAVE_CHECKPOINT_ORDER,
    notes: ['No bypass/fail-safe usage; manual-only coverage in packet 7.1a/7.1b.'],
  },
  {
    id: 'aggressive',
    policy: 'speed_first',
    automationMode: 'manual_coverage',
    isBlockingSmokeRoute: false,
    description: 'Faster/leaner route definition. Manual-coverage-first until distinct honest automation exists.',
    expectedCheckpoints: FRESH_SAVE_CHECKPOINT_ORDER,
    notes: ['No debug assist; automation intentionally deferred to avoid duplicate-route false coverage.'],
  },
]);

const REALM_ENTRY_CHECKPOINTS: Record<string, FreshSaveCheckpointId> = {
  foundation_establishment: 'foundation_entry',
  core_formation: 'core_formation_entry',
  nascent_soul: 'nascent_soul_entry',
  soul_formation: 'soul_formation_entry',
  spirit_severing: 'spirit_severing_entry',
};

const CITY_ENTRY_CHECKPOINTS: Record<string, FreshSaveCheckpointId> = {
  city_stonecrag_town: 'stonecrag_entered',
  city_spirit_cavern_city: 'spirit_cavern_entered',
  city_lotusford: 'lotusford_entered',
  city_ironpeak_bastion: 'ironpeak_entered',
};

const checkpointForGate = (gateIndex: number, kind: 'available' | 'resolved'): FreshSaveCheckpointId => {
  return (`gate_${gateIndex}_${kind}` as FreshSaveCheckpointId);
};

const normalizeProgressionEvent = (event: GameEvent): FreshSaveProgressionEventRow | null => {
  switch (event.type) {
    case 'progression/life_started':
    case 'progression/gate_available':
    case 'progression/gate_resolved':
    case 'progression/breakthrough':
    case 'progression/city_entered':
    case 'progression/content_cap_reached':
      return {
        eventType: event.type,
        elapsedMsSinceLifeStart: event.payload.elapsedMsSinceLifeStart,
        runStartTime: event.payload.runStartTime,
        gateIndex: 'gateIndex' in event.payload ? event.payload.gateIndex : undefined,
        trialId: 'trialId' in event.payload ? event.payload.trialId : undefined,
        cityId: 'cityId' in event.payload ? event.payload.cityId : undefined,
        fromRealmId: 'fromRealmId' in event.payload ? event.payload.fromRealmId : undefined,
        toRealmId: 'toRealmId' in event.payload ? event.payload.toRealmId : undefined,
        major: 'major' in event.payload ? event.payload.major : undefined,
        resolution: 'resolution' in event.payload ? event.payload.resolution : undefined,
      };
    default:
      return null;
  }
};

const registerCheckpoint = (
  rows: FreshSaveCheckpointRow[],
  seen: Set<FreshSaveCheckpointId>,
  checkpointId: FreshSaveCheckpointId,
  runStartTime: number,
  detail?: string,
  source: FreshSaveCheckpointRow['source'] = 'runner',
) => {
  if (seen.has(checkpointId)) return;
  seen.add(checkpointId);
  rows.push({
    checkpointId,
    elapsedMsSinceLifeStart: Math.max(0, Date.now() - runStartTime),
    source,
    detail,
  });
};

const withSeededRandom = async <T>(seed: number, fn: () => Promise<T>): Promise<T> => {
  const originalRandom = Math.random;
  let state = seed >>> 0;
  Math.random = () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };

  try {
    return await fn();
  } finally {
    Math.random = originalRandom;
  }
};

const prepareForGateAttempt = () => {
  for (let i = 0; i < 120; i += 1) {
    const boughtDamage = useGameStore.getState().purchaseUpgrade('damage');
    const boughtHp = useGameStore.getState().purchaseUpgrade('hp');
    if (!boughtDamage && !boughtHp) {
      break;
    }
  }

  for (let i = 0; i < 600; i += 1) {
    const state = useGameStore.getState();
    const qi = Number(state.qi);
    const requirement = Number(state.getBreakthroughRequirement());
    if (qi >= requirement) {
      break;
    }
    state.tick(1_000);
  }
};

export async function runFreshSaveRoute(routeId: FreshSaveRouteId): Promise<FreshSaveRouteResult> {
  const definition = FRESH_SAVE_ROUTE_CATALOG.find((entry) => entry.id === routeId);
  if (!definition) {
    throw new Error(`Unknown fresh-save route: ${routeId}`);
  }

  const bootstrap = await setupFreshSaveRun();
  assertFreshSaveBootstrapInvariants();

  const checkpoints: FreshSaveCheckpointRow[] = [];
  const warnings: FreshSaveRouteResult['warnings'] = [];
  const failures: FreshSaveRouteFailure[] = [];
  const assistedSteps: FreshSaveRouteResult['assistedSteps'] = [];
  const progressionEvents: FreshSaveProgressionEventRow[] = [];
  const seenCheckpoints = new Set<FreshSaveCheckpointId>();

  registerCheckpoint(checkpoints, seenCheckpoints, 'life_started', bootstrap.runStartTime, 'Run anchor emitted via progressionTimingTracker.', 'event');
  registerCheckpoint(checkpoints, seenCheckpoints, 'path_selected', bootstrap.runStartTime, useGameStore.getState().selectedPath ?? undefined);
  if (useCultivationStore.getState().selectedHeartLawId) {
    registerCheckpoint(
      checkpoints,
      seenCheckpoints,
      'heart_law_selected',
      bootstrap.runStartTime,
      useCultivationStore.getState().selectedHeartLawId ?? undefined,
    );
  } else {
    warnings.push({ code: 'heart_law_unset', message: 'Heart Law is not selected; runtime currently permits this, so checkpoint is omitted.' });
  }
  registerCheckpoint(checkpoints, seenCheckpoints, 'pinewind_ready', bootstrap.runStartTime, 'Fresh life is in Pinewind with only city 1 unlocked.');

  const onAny = (event: GameEvent) => {
    const normalized = normalizeProgressionEvent(event);
    if (!normalized) return;
    progressionEvents.push(normalized);

    if (event.type === 'progression/gate_available') {
      registerCheckpoint(checkpoints, seenCheckpoints, checkpointForGate(event.payload.gateIndex, 'available'), bootstrap.runStartTime, event.payload.trialId, 'event');
    }
    if (event.type === 'progression/gate_resolved') {
      registerCheckpoint(checkpoints, seenCheckpoints, checkpointForGate(event.payload.gateIndex, 'resolved'), bootstrap.runStartTime, `${event.payload.trialId}:${event.payload.resolution}`, 'event');
    }
    if (event.type === 'progression/city_entered') {
      const checkpoint = CITY_ENTRY_CHECKPOINTS[event.payload.cityId];
      if (checkpoint) {
        registerCheckpoint(checkpoints, seenCheckpoints, checkpoint, bootstrap.runStartTime, event.payload.cityId, 'event');
      }
    }
    if (event.type === 'progression/content_cap_reached') {
      registerCheckpoint(checkpoints, seenCheckpoints, 'content_cap_reached', bootstrap.runStartTime, event.payload.realmId, 'event');
    }
  };

  GameEvents.onAny(onAny);

  await withSeededRandom(7101, async () => {
    try {
      if (definition.automationMode !== 'automated_smoke_blocking') {
        warnings.push({
          code: 'manual_coverage_route',
          message: `${definition.id} is manual-coverage-first in packet 7.1a/7.1b and is not auto-executed in CI smoke.`,
        });
        return;
      }

      const stepMs = 1_000;
      const maxMs = 14 * 60 * 60 * 1000;
      let elapsedMs = 0;
      let previousRealmIndex = useGameStore.getState().realm.index;

      while (elapsedMs <= maxMs && useGameStore.getState().realm.index < 5) {
        useGameStore.getState().tick(stepMs);
        elapsedMs += stepMs;

        const game = useGameStore.getState();
        const transition = bootstrap.contract.gateTransitions.find((entry) => entry.fromRealmId === getLiveRealmByIndex(game.realm.index).id);

        if (transition) {
          const trial = useContentStore.getState().maps.trialsById[transition.trialId];
          const progress = useTrialStore.getState().getProgress(transition.trialId);
          const requiredItemSatisfied = true;
          const lifecycle = getTrialLifecycleSnapshot({
            content: useContentStore.getState().raw,
            trial,
            progress,
            realm: game.realm,
            qi: game.qi,
            breakthroughRequirement: game.getBreakthroughRequirement(),
            requiredItemSatisfied,
          });

          if (lifecycle.canStart && progress.resolution === 'none') {
            prepareForGateAttempt();
            const content = useContentStore.getState().raw;
            const trialDef = useContentStore.getState().maps.trialsById[transition.trialId];
            if (!content || !trialDef) {
              failures.push({
                code: `missing_trial_content_${transition.trialId}`,
                blocker: true,
                message: `Honest progression blocker: missing trial/content for ${transition.trialId}.`,
              });
              break;
            }

            RewardService.grantRewards(getTrialGateRewardBundle(content, trialDef), `release_smoke_gate_clear:${transition.trialId}`);
            useTrialStore.getState().markCleared(transition.trialId);
          }
        }

        const currentRealm = useGameStore.getState();
        const realmId = getLiveRealmByIndex(currentRealm.realm.index).id;
        const realmCheckpoint = REALM_ENTRY_CHECKPOINTS[realmId];
        if (realmCheckpoint) {
          registerCheckpoint(checkpoints, seenCheckpoints, realmCheckpoint, bootstrap.runStartTime, realmId, 'event');
        }

        const qiReady = Number(currentRealm.qi) >= Number(currentRealm.getBreakthroughRequirement());
        if (qiReady) {
          useGameStore.getState().breakthrough();
        }

        const nextRealmIndex = useGameStore.getState().realm.index;
        if (nextRealmIndex > previousRealmIndex) {
          previousRealmIndex = nextRealmIndex;
        }
      }
    } finally {
      GameEvents.offAny(onAny);
    }
  });

  if (useGameStore.getState().realm.index >= 5) {
    registerCheckpoint(checkpoints, seenCheckpoints, 'spirit_severing_entry', bootstrap.runStartTime, 'Reached live chapter cap realm.', 'event');
    registerCheckpoint(checkpoints, seenCheckpoints, 'content_cap_reached', bootstrap.runStartTime, 'Reached current authored cap.', 'event');

    const advisor = getPrestigeAdvisorSurface();
    if (advisor.stateLabel) {
      registerCheckpoint(checkpoints, seenCheckpoints, 'prestige_advisor_surface_available', bootstrap.runStartTime, advisor.stateLabel, 'assertion');
    }

    useUIStore.getState().openCurrentChapterExhaustedModal();
    if (useUIStore.getState().showCurrentChapterExhaustedModal) {
      registerCheckpoint(checkpoints, seenCheckpoints, 'current_chapter_exhausted_truth_available', bootstrap.runStartTime, 'UI modal can open at cap.', 'assertion');
    }

    const currentSummary = buildCurrentLifeSummarySurface();
    if (currentSummary.blocks.length > 0) {
      registerCheckpoint(checkpoints, seenCheckpoints, 'current_life_summary_available', bootstrap.runStartTime, `${currentSummary.blocks.length} blocks`, 'assertion');
    }
  }

  const gateResolutionSummary = bootstrap.contract.gateTransitions.map((transition, index) => {
    const progress = useTrialStore.getState().getProgress(transition.trialId);
    const checkpoint = checkpoints.find((entry) => entry.checkpointId === checkpointForGate(index + 1, 'resolved'));
    const resolution: 'cleared' | 'bypassed' | 'unresolved' =
      progress.resolution === 'none' ? 'unresolved' : progress.resolution;

    return {
      gateIndex: index + 1,
      trialId: transition.trialId,
      resolution,
      attempts: progress.attempts,
      elapsedMsResolved: checkpoint?.elapsedMsSinceLifeStart ?? null,
    };
  });

  const finalRealmId = getLiveRealmByIndex(useGameStore.getState().realm.index).id;
  const finalAdvisor = getPrestigeAdvisorSurface();
  let lifeSummaryAvailable = false;
  try {
    lifeSummaryAvailable = buildCurrentLifeSummarySurface().blocks.length > 0;
  } catch {
    lifeSummaryAvailable = false;
  }

  return {
    routeId: definition.id,
    policy: definition.policy,
    automationMode: definition.automationMode,
    isBlockingSmokeRoute: definition.isBlockingSmokeRoute,
    representativePath: bootstrap.representativePath,
    checkpoints,
    progressionEvents,
    warnings,
    failures,
    assistedSteps,
    finalSnapshot: {
      routeId: definition.id,
      automationMode: definition.automationMode,
      representativePath: bootstrap.representativePath,
      runStartTime: bootstrap.runStartTime,
      elapsedMsToCap:
        checkpoints.find((entry) => entry.checkpointId === 'content_cap_reached')?.elapsedMsSinceLifeStart ?? null,
      finalRealmId,
      currentCityId: useCityStore.getState().currentCityId as FreshSaveRouteResult['finalSnapshot']['currentCityId'],
      unlockedCityIds: useCityStore.getState().unlockedCityIds as FreshSaveRouteResult['finalSnapshot']['unlockedCityIds'],
      gateResolutionSummary,
      prestigeAdvisorLabel: finalAdvisor.stateLabel ?? null,
      currentChapterExhaustedTruth: useUIStore.getState().showCurrentChapterExhaustedModal,
      lifeSummaryAvailable,
    },
  };
}
