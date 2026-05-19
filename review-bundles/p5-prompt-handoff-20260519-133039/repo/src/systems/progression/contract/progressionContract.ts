import type {
  CityUnlockContract,
  GateItemId,
  GateTransitionContract,
  MajorRealmId,
  ProgressionAuthoredContent,
  ProgressionContract,
} from './contractTypes.js';
import { DEFERRED_SYSTEMS } from './deferredContent.js';
import { toTransitionId } from './gateTransitions.js';
import { OFFLINE_PROGRESSION_CONTRACT } from './offlineContract.js';
import { createPrestigeClassificationHooks } from './prestigeContract.js';
import { normalizeMajorRealmId } from './realmMap.js';
import { createResetClassificationHooks } from './resetContract.js';
import { SEMESTER_SLICE_CONTRACT } from './semesterSlice.js';

const GATE_ITEM_ALIASES: Record<string, GateItemId> = {
  foundation_pill: 'gate_foundation_pill',
  core_catalyst: 'gate_core_catalyst',
  core_stabilizer: 'gate_core_stabilizer',
  soul_condensate: 'gate_soul_condensate',
};

const normalizeGateItemId = (value: string): GateItemId | null => {
  if (value.startsWith('gate_')) return value as GateItemId;
  return GATE_ITEM_ALIASES[value] ?? null;
};

const readFromRealm = (trial: ProgressionAuthoredContent['trials'][number]): MajorRealmId | null => {
  if (!trial.eligibilityRule || typeof trial.eligibilityRule === 'string') return null;
  return normalizeMajorRealmId(trial.eligibilityRule.fromMajorRealm ?? '');
};

export const buildProgressionContract = (content: ProgressionAuthoredContent): ProgressionContract => {
  const majorRealms = content.economy.majorRealms.reduce<ProgressionContract['majorRealms']>((acc, realm) => {
    const normalized = normalizeMajorRealmId(realm.id);
    if (!normalized) return acc;
    acc[normalized] = { id: normalized, index: realm.index };
    return acc;
  }, {} as ProgressionContract['majorRealms']);

  const gateTransitions = content.trials
    .flatMap<GateTransitionContract>((trial) => {
      const fromRealmId = readFromRealm(trial);
      const toRealmId = normalizeMajorRealmId(trial.gatesToMajorRealm ?? '');
      const gateItemId = normalizeGateItemId(trial.gateItemId);
      if (!fromRealmId || !toRealmId || !gateItemId) return [];
      return [{
        id: toTransitionId(fromRealmId, toRealmId),
        fromRealmId,
        toRealmId,
        trialId: trial.id as GateTransitionContract['trialId'],
        gateItemId,
        cityId: trial.cityId as GateTransitionContract['cityId'],
      }];
    });

  const cityUnlocks = content.cities
    .flatMap<CityUnlockContract>((city) => {
      const unlockOnRealmEntry = normalizeMajorRealmId(city.unlockMajorRealm);
      if (!unlockOnRealmEntry) return [];
      return [{
        cityId: city.id as CityUnlockContract['cityId'],
        unlockOnRealmEntry,
      }];
    });

  return {
    semesterSlice: SEMESTER_SLICE_CONTRACT,
    majorRealms,
    gateTransitions,
    cityUnlocks,
    contentCap: { realmId: 'spirit_severing', state: 'end_of_slice' },
    deferredSystems: DEFERRED_SYSTEMS,
    pathTruth: { canonicalField: 'selectedPath', legacyAliases: ['lifePath'] },
    offline: OFFLINE_PROGRESSION_CONTRACT,
    prestigeHooks: createPrestigeClassificationHooks(),
    resetHooks: createResetClassificationHooks(),
    aliases: {
      gateItems: Object.entries(GATE_ITEM_ALIASES).map(([alias, canonical]) => ({ canonical, aliases: [alias] })),
      failSafeFieldAliases: [{ canonical: 'failSafe', aliases: ['failSafePurchase'] }],
    },
  };
};

let singleton: ProgressionContract | null = null;

export const getProgressionContract = (content?: ProgressionAuthoredContent): ProgressionContract => {
  if (!singleton) {
    if (!content) {
      throw new Error('Progression contract has not been initialized. Provide authored content once.');
    }
    singleton = buildProgressionContract(content);
  }
  return singleton;
};

export const getMajorRealmIds = (contract: ProgressionContract): MajorRealmId[] => Object.keys(contract.majorRealms) as MajorRealmId[];
export const getMajorRealmById = (contract: ProgressionContract, id: MajorRealmId) => contract.majorRealms[id] ?? null;
export const getTransitionByFromRealm = (contract: ProgressionContract, fromRealmId: MajorRealmId) =>
  contract.gateTransitions.find((t) => t.fromRealmId === fromRealmId) ?? null;
export const getTransitionByToRealm = (contract: ProgressionContract, toRealmId: MajorRealmId) =>
  contract.gateTransitions.find((t) => t.toRealmId === toRealmId) ?? null;
export const getTransitionByTrialId = (contract: ProgressionContract, trialId: string) =>
  contract.gateTransitions.find((t) => t.trialId === trialId) ?? null;
export const getGateItemForTransition = (
  contract: ProgressionContract,
  query: { transitionId?: string; fromRealmId?: MajorRealmId; toRealmId?: MajorRealmId },
) => {
  const match = contract.gateTransitions.find((transition) => {
    if (query.transitionId) return transition.id === query.transitionId;
    if (query.fromRealmId) return transition.fromRealmId === query.fromRealmId;
    if (query.toRealmId) return transition.toRealmId === query.toRealmId;
    return false;
  });
  return match?.gateItemId ?? null;
};
export const getCityUnlockForRealm = (contract: ProgressionContract, majorRealmId: MajorRealmId) =>
  contract.cityUnlocks.find((unlock) => unlock.unlockOnRealmEntry === majorRealmId) ?? null;
export const getContentCapRealm = (contract: ProgressionContract) => contract.contentCap.realmId;
export const isRealmInLiveSlice = (contract: ProgressionContract, majorRealmId: MajorRealmId) =>
  contract.semesterSlice.liveMajorRealms.includes(majorRealmId);
export const isDeferredSystem = (contract: ProgressionContract, systemId: string) =>
  contract.deferredSystems.includes(systemId as (typeof contract.deferredSystems)[number]);
export const getOfflineProgressionContract = (contract: ProgressionContract) => contract.offline;
export const getResetClassificationHooks = (contract: ProgressionContract) => contract.resetHooks;
export const getPrestigeClassificationHooks = (contract: ProgressionContract) => contract.prestigeHooks;
export const normalizeGateItemAlias = (value: string) => normalizeGateItemId(value);

export const getPathTruthContract = (contract: ProgressionContract) => contract.pathTruth;
