import type { CityDef, MajorRealmId, TrialDef, ValidatedContent } from '../../content';
import { GATE_ITEMS } from '../loot';

export type ContractSourceOfTruth = 'content' | 'runtime' | 'mixed' | 'unknown';

export interface ContractSourceMetadata {
  source: ContractSourceOfTruth;
  contentRefs: string[];
  runtimeRefs: string[];
  notes?: string[];
}

export interface ProgressionTransition {
  fromMajorRealm: MajorRealmId | null;
  toMajorRealm: MajorRealmId;
  gatingTrialId: string | null;
  gateItemIdFromContent: string | null;
  requiredStageCondition: string | null;
  failSafeInfo: string | null;
  cityUnlockIdsForTargetRealm: string[];
  sourceMetadata: ContractSourceMetadata;
  driftWarnings: string[];
}

export interface CityUnlockContract {
  cityId: string;
  unlockMajorRealmFromContent: MajorRealmId;
  runtimeWiringAppearsToHonorUnlock: boolean;
  driftWarnings: string[];
}

export type ResetClassification = 'perLife' | 'metaPermanent' | 'hybrid' | 'unknown';

export interface PrestigeResetContractNote {
  storeOrSystem: string;
  observedResetMethods: string[];
  likelyClassification: ResetClassification;
  evidenceNotes: string[];
  driftWarnings: string[];
}

export interface OfflineContractNote {
  activeImplementationEntryPoints: string[];
  alternateOrLegacyEntryPoints: string[];
  inferredRules: string[];
  driftWarnings: string[];
}

export interface ProgressionIssue {
  severity: 'info' | 'warn' | 'error';
  code: string;
  title: string;
  message: string;
  evidenceFiles: string[];
  impactedWorkstream?: string;
}

export interface ProgressionContractDiagnostics {
  issues: ProgressionIssue[];
}

export interface RuntimeProgressionHints {
  breakthroughGateItemsByRealmIndex: Record<number, string>;
  cityUnlockByRealmWiringPresent: boolean;
}

export interface ProgressionContract {
  transitions: ProgressionTransition[];
  cityUnlockContracts: CityUnlockContract[];
  prestigeResetNotes: PrestigeResetContractNote[];
  offlineContractNotes: OfflineContractNote[];
  diagnostics: ProgressionContractDiagnostics;
}

export type ProgressionContentSlice = Pick<ValidatedContent, 'economy' | 'trials' | 'cities'>;

const DEFAULT_RUNTIME_HINTS: RuntimeProgressionHints = {
  breakthroughGateItemsByRealmIndex: GATE_ITEMS,
  cityUnlockByRealmWiringPresent: false,
};

function trialEligibilityToCondition(trial: TrialDef): string | null {
  if (!trial.eligibilityRule) return null;
  if (typeof trial.eligibilityRule === 'string') return trial.eligibilityRule;

  const rule = trial.eligibilityRule as Record<string, unknown>;
  const fromRealm = typeof rule.fromMajorRealm === 'string' ? rule.fromMajorRealm : 'unknown';
  const type = typeof rule.type === 'string' ? rule.type : 'custom';
  return `${type} (fromMajorRealm=${fromRealm})`;
}

function trialFailSafeToText(trial: TrialDef): string | null {
  const rawTrial = trial as TrialDef & {
    failSafePurchase?: { enabled?: boolean; afterEligibleFails?: number; costRef?: string };
  };

  if (rawTrial.failSafePurchase) {
    const enabled = rawTrial.failSafePurchase.enabled ? 'enabled' : 'disabled';
    return `failSafePurchase.${enabled}; afterEligibleFails=${rawTrial.failSafePurchase.afterEligibleFails ?? 'n/a'}; costRef=${rawTrial.failSafePurchase.costRef ?? 'n/a'}`;
  }

  if (trial.failSafe) {
    const threshold = trial.failSafe.thresholdAttempts ?? 'n/a';
    const hasCost = trial.failSafe.cost ? 'with cost' : 'without cost';
    return `failSafe.thresholdAttempts=${threshold}; ${hasCost}`;
  }

  return null;
}

function buildTransitionWarnings(
  trial: TrialDef,
  fromRealm: MajorRealmId | null,
  fromRealmIndex: number | null,
  runtimeHints: RuntimeProgressionHints,
): string[] {
  const warnings: string[] = [];

  const contentItem = trial.gateItemId ?? null;
  if (fromRealm !== null && fromRealmIndex !== null) {
    const runtimeItem = runtimeHints.breakthroughGateItemsByRealmIndex[fromRealmIndex];
    if (runtimeItem && contentItem && runtimeItem !== contentItem) {
      warnings.push(
        `Gate item namespace drift: content trial rewards '${contentItem}', but runtime breakthrough table consumes '${runtimeItem}'.`,
      );
    }
  }

  if ('failSafePurchase' in (trial as object) && trial.failSafe) {
    warnings.push('Trial defines both failSafePurchase and failSafe surfaces; runtime may not consume both.');
  }

  return warnings;
}

function citiesByUnlockRealm(cities: CityDef[]): Map<MajorRealmId, string[]> {
  const byRealm = new Map<MajorRealmId, string[]>();
  for (const city of cities) {
    const existing = byRealm.get(city.unlockMajorRealm) ?? [];
    byRealm.set(city.unlockMajorRealm, [...existing, city.id]);
  }
  return byRealm;
}

function collectRealmTransitions(
  content: ProgressionContentSlice,
  runtimeHints: RuntimeProgressionHints,
): ProgressionTransition[] {
  const trials = [...content.trials].sort((a, b) => (a.cityIndex ?? 0) - (b.cityIndex ?? 0));
  const unlockByRealm = citiesByUnlockRealm(content.cities);
  const realmIndexById = new Map(content.economy.majorRealms.map((realm) => [realm.id, realm.index] as const));

  return trials
    .filter((trial) => Boolean(trial.gatesToMajorRealm))
    .map((trial) => {
      const toMajorRealm = trial.gatesToMajorRealm as MajorRealmId;
      const rule = trial.eligibilityRule as Record<string, unknown> | undefined;
      const fromMajorRealm = typeof rule?.fromMajorRealm === 'string' ? (rule.fromMajorRealm as MajorRealmId) : null;

      const fromRealmIndex = fromMajorRealm ? (realmIndexById.get(fromMajorRealm) ?? null) : null;
      const driftWarnings = buildTransitionWarnings(trial, fromMajorRealm, fromRealmIndex, runtimeHints);

      return {
        fromMajorRealm,
        toMajorRealm,
        gatingTrialId: trial.id,
        gateItemIdFromContent: trial.gateItemId ?? null,
        requiredStageCondition: trialEligibilityToCondition(trial),
        failSafeInfo: trialFailSafeToText(trial),
        cityUnlockIdsForTargetRealm: unlockByRealm.get(toMajorRealm) ?? [],
        sourceMetadata: {
          source: 'content',
          contentRefs: [
            'public/cultivation_idle_content_bible_v1_config/trials.json',
            'public/cultivation_idle_content_bible_v1_config/cities.json',
          ],
          runtimeRefs: ['src/stores/gameStore.ts', 'src/systems/loot.ts'],
          notes: ['Transition row is content-authored; drift warnings include known runtime breakpoints.'],
        },
        driftWarnings,
      };
    });
}

function collectCityUnlockContracts(
  cities: CityDef[],
  runtimeHints: RuntimeProgressionHints,
): CityUnlockContract[] {
  const sorted = [...cities].sort((a, b) => a.index - b.index);
  const starterCityId = sorted[0]?.id;

  return sorted.map((city) => {
    const appearsHonored = city.id === starterCityId || runtimeHints.cityUnlockByRealmWiringPresent;

    return {
      cityId: city.id,
      unlockMajorRealmFromContent: city.unlockMajorRealm,
      runtimeWiringAppearsToHonorUnlock: appearsHonored,
      driftWarnings: appearsHonored
        ? []
        : [
            'City unlock intent exists in content, but no central realm->city unlock wiring is currently active in runtime.',
          ],
    };
  });
}

export function getPrestigeResetNotes(): PrestigeResetContractNote[] {
  return [
    {
      storeOrSystem: 'gameStore.performPrestigeReset',
      observedResetMethods: [
        'resetRun()',
        'useHeartLawStore.resetForNewLife()',
        'useZoneStore.resetAllZones()',
        'inventory.resetInventory()',
        'combat.resetCombat() | combat.exitCombat()',
      ],
      likelyClassification: 'hybrid',
      evidenceNotes: [
        'Run state resets while totalAuras is preserved in resetRun().',
        'Path fields selectedPath/lifePath are reset with run state, while AP and prestige purchases live in prestigeStore.',
      ],
      driftWarnings: [
        'No single contract enumerates per-life vs permanent slices across all stores, so reset expectations are implicit.',
      ],
    },
    {
      storeOrSystem: 'prestigeStore.performPrestige',
      observedResetMethods: ['AP gain computed and persisted', 'gameStore.performPrestigeReset()', 'generateSpiritRoot()'],
      likelyClassification: 'hybrid',
      evidenceNotes: [
        'prestigeStore persists AP history and purchases while delegating life reset to gameStore.',
      ],
      driftWarnings: [
        'Prestige orchestration is split between stores instead of a single reset contract.',
      ],
    },
  ];
}

export function getOfflineContractNotes(): OfflineContractNote[] {
  return [
    {
      activeImplementationEntryPoints: ['src/services/time/OfflineCatchup.ts#apply', 'src/services/save/SaveService.ts#load'],
      alternateOrLegacyEntryPoints: ['src/systems/offline.ts#applyOfflineProgressFromContext', 'src/systems/offline.ts#applyOfflineProgress'],
      inferredRules: [
        'Offline cap is 12h (MAX_OFFLINE_MS / MAX_OFFLINE_SECONDS).',
        'OfflineCatchup applies cultivation, profession queues, and expeditions; combat is excluded.',
        'Legacy offline path applies cultivation only when marked as meditating and applies a prestige-scaled efficiency multiplier.',
      ],
      driftWarnings: [
        'Two offline implementations exist with different rule surfaces and invocation paths.',
      ],
    },
  ];
}

export function buildProgressionContract(
  content: ProgressionContentSlice,
  runtimeHints: Partial<RuntimeProgressionHints> = {},
): ProgressionContract {
  const mergedHints: RuntimeProgressionHints = {
    ...DEFAULT_RUNTIME_HINTS,
    ...runtimeHints,
  };

  const transitions = collectRealmTransitions(content, mergedHints);
  const cityUnlockContracts = collectCityUnlockContracts(content.cities, mergedHints);
  const prestigeResetNotes = getPrestigeResetNotes();
  const offlineContractNotes = getOfflineContractNotes();

  return {
    transitions,
    cityUnlockContracts,
    prestigeResetNotes,
    offlineContractNotes,
    diagnostics: { issues: [] },
  };
}

export function getRealmTransitions(
  content: ProgressionContentSlice,
  runtimeHints: Partial<RuntimeProgressionHints> = {},
): ProgressionTransition[] {
  return buildProgressionContract(content, runtimeHints).transitions;
}

export function getTransitionByTargetMajorRealm(
  targetMajorRealm: MajorRealmId,
  content: ProgressionContentSlice,
  runtimeHints: Partial<RuntimeProgressionHints> = {},
): ProgressionTransition | undefined {
  return getRealmTransitions(content, runtimeHints).find((entry) => entry.toMajorRealm === targetMajorRealm);
}

export function getCityUnlockContracts(
  content: ProgressionContentSlice,
  runtimeHints: Partial<RuntimeProgressionHints> = {},
): CityUnlockContract[] {
  return buildProgressionContract(content, runtimeHints).cityUnlockContracts;
}
