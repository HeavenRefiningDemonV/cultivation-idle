import { REALMS } from '../../constants/index.js';
import { PRESTIGE_TARGETS, type PrestigeCheckpointId } from '../balance/prestigeTargets.js';
import type { TrialProgress } from '../../stores/trialStore.js';

export type PrestigeAdvisorLabel = 'Too Early' | 'Viable' | 'Recommended';

export type PrestigeProgressionSnapshot = {
  highestRealmIndex: number;
  highestRealmId: string;
  currentRealmIndex: number;
  currentSubstage: number;
  resolvedGateCount: number;
  atContentCap: boolean;
};

export type PrestigeApForecast = {
  unlockEligible: boolean;
  checkpoint: PrestigeCheckpointId;
  components: {
    realmBase: number;
    substageBonus: number;
    resolvedGateBonus: number;
  };
  totalAp: number;
  snapshot: PrestigeProgressionSnapshot;
};

export type PrestigeApBreakdownRow = {
  key: string;
  label: string;
  value: number;
  hint?: string;
};

const clampRealmIndex = (index: number) => Math.max(0, Math.min(REALMS.length - 1, Math.floor(index)));
const asRealmId = (index: number) => REALMS[clampRealmIndex(index)]?.majorRealm ?? REALMS[0].majorRealm;

const resolveCheckpoint = (realmIndex: number): PrestigeCheckpointId => {
  if (realmIndex <= 1) return 'foundation_entry';
  if (realmIndex === 2) return 'core_entry';
  if (realmIndex === 3) return 'nascent_entry';
  if (realmIndex === 4) return 'soul_entry';
  return 'spirit_severing_entry';
};

export function countResolvedSemesterGateTrials(args: {
  progressByTrialId: Record<string, TrialProgress>;
  liveTrialIds: readonly string[];
}): number {
  const liveTrialIds = new Set(args.liveTrialIds);
  return Object.entries(args.progressByTrialId).reduce((count, [trialId, progress]) => {
    if (!liveTrialIds.has(trialId)) return count;
    return progress.resolution === 'cleared' || progress.resolution === 'bypassed' ? count + 1 : count;
  }, 0);
}

export function extractLiveTrialIds(trialsPayload: unknown): string[] {
  if (Array.isArray(trialsPayload)) {
    return trialsPayload
      .map((entry) => (entry && typeof entry === 'object' && typeof (entry as { id?: unknown }).id === 'string'
        ? (entry as { id: string }).id
        : null))
      .filter((id): id is string => Boolean(id));
  }
  if (trialsPayload && typeof trialsPayload === 'object' && Array.isArray((trialsPayload as { trials?: unknown }).trials)) {
    return extractLiveTrialIds((trialsPayload as { trials: unknown[] }).trials);
  }
  return [];
}

export function buildPrestigeProgressionSnapshot(input: {
  currentRealmIndex: number;
  currentSubstage: number;
  highestRealmReached: number;
  resolvedGateCount: number;
}): PrestigeProgressionSnapshot {
  const currentRealmIndex = clampRealmIndex(input.currentRealmIndex);
  const highestRealmIndex = clampRealmIndex(Math.max(input.highestRealmReached, currentRealmIndex));
  const currentRealmSubstages = REALMS[currentRealmIndex]?.substages ?? 1;
  const substageAtHighestRealm = highestRealmIndex === currentRealmIndex
    ? Math.max(1, Math.min(currentRealmSubstages, Math.floor(input.currentSubstage || 1)))
    : 1;

  return {
    highestRealmIndex,
    highestRealmId: asRealmId(highestRealmIndex),
    currentRealmIndex,
    currentSubstage: substageAtHighestRealm,
    resolvedGateCount: Math.max(0, Math.floor(input.resolvedGateCount || 0)),
    atContentCap: highestRealmIndex >= REALMS.length - 1 || asRealmId(highestRealmIndex) === PRESTIGE_TARGETS.unlock.contentCapRealmId,
  };
}

export function calculatePrestigeApForecast(snapshot: PrestigeProgressionSnapshot): PrestigeApForecast {
  const unlockEligible = snapshot.highestRealmIndex >= PRESTIGE_TARGETS.unlock.unlockRealmIndex;
  const checkpoint = resolveCheckpoint(snapshot.highestRealmIndex);
  if (!unlockEligible && PRESTIGE_TARGETS.apComponents.zeroBeforeUnlock) {
    return {
      unlockEligible,
      checkpoint,
      components: { realmBase: 0, substageBonus: 0, resolvedGateBonus: 0 },
      totalAp: 0,
      snapshot,
    };
  }

  const realmBase = PRESTIGE_TARGETS.apComponents.realmBaseByRealmIndex[
    snapshot.highestRealmIndex as keyof typeof PRESTIGE_TARGETS.apComponents.realmBaseByRealmIndex
  ] ?? 0;

  const maxSubstageBonus = PRESTIGE_TARGETS.apComponents.maxSubstageBonusByRealmIndex[
    snapshot.highestRealmIndex as keyof typeof PRESTIGE_TARGETS.apComponents.maxSubstageBonusByRealmIndex
  ] ?? 0;
  const substages = REALMS[snapshot.highestRealmIndex]?.substages ?? 1;
  const substageProgress = Math.max(0, (snapshot.currentSubstage - 1) / Math.max(1, substages - 1));
  const substageBonus = Math.max(0, Math.floor(substageProgress * maxSubstageBonus));

  const resolvedGateBonus = Math.min(
    PRESTIGE_TARGETS.apComponents.maxResolvedGateCount,
    snapshot.resolvedGateCount,
  ) * PRESTIGE_TARGETS.apComponents.resolvedGateBonusPerGate;

  return {
    unlockEligible,
    checkpoint,
    components: { realmBase, substageBonus, resolvedGateBonus },
    totalAp: Math.max(0, Math.floor(realmBase + substageBonus + resolvedGateBonus)),
    snapshot,
  };
}

export function buildPrestigeApBreakdownRows(forecast: PrestigeApForecast): PrestigeApBreakdownRow[] {
  if (!forecast.unlockEligible) {
    return [{
      key: 'too_early',
      label: 'Too early for Reincarnation',
      value: 0,
      hint: `Reach ${PRESTIGE_TARGETS.unlock.unlockRealmId.replace(/_/g, ' ')} to begin earning AP.`,
    }];
  }
  return [
    { key: 'realm', label: 'Realm advancement', value: forecast.components.realmBase, hint: 'Realm milestones grant Ascension Points.' },
    { key: 'substage', label: 'Substage progress', value: forecast.components.substageBonus, hint: 'Current-realm substage progress adds bonus AP.' },
    { key: 'gates', label: 'Resolved gate trials', value: forecast.components.resolvedGateBonus, hint: 'Only cleared or bypassed gate trials count.' },
  ];
}

export function resolvePrestigeAdvisorLabel(forecast: PrestigeApForecast): PrestigeAdvisorLabel {
  if (!forecast.unlockEligible) return 'Too Early';
  if (forecast.snapshot.atContentCap) return 'Recommended';
  return 'Viable';
}
