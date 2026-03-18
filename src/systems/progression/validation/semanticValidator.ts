import {
  adaptProgressionAuthoredContent,
  buildProgressionContract,
  getContentCapRealm,
  isRefundableHiddenPrestigeNode,
  normalizeGateItemAlias,
  type RawProgressionContentLike,
} from '../contract/index.js';
import { collectProgressionDiagnostics, type DriftIssue } from '../diagnostics/index.js';

export interface ProgressionScenarioLike {
  kind: string;
  pathState: {
    selectedPath: string | null;
    lifePathAlias: string | null;
  };
  realmState: {
    currentRealm: string;
    enteredRealms: string[];
  };
  gateState: {
    inventoryGateItems: Record<string, number>;
    pendingBreakthroughTo: string | null;
  };
  offlineState: {
    pipelineId: string;
  };
}

export interface MigrationFixtureLike {
  name: string;
  data: unknown;
}

export interface ValidateProgressionSemanticsOptions {
  rawContent: RawProgressionContentLike;
  runtimeFileTextByPath?: Record<string, string>;
  scenarios?: ProgressionScenarioLike[];
  migrationFixtures?: MigrationFixtureLike[];
}

const pushIssue = (issues: DriftIssue[], issue: DriftIssue) => {
  if (!issues.some((entry) => entry.id === issue.id)) {
    issues.push(issue);
  }
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

const readTrialFromMajorRealm = (eligibilityRule: unknown): string | undefined => {
  if (!eligibilityRule) return undefined;
  if (typeof eligibilityRule === 'object') {
    const record = eligibilityRule as { fromMajorRealm?: string };
    return typeof record.fromMajorRealm === 'string' ? record.fromMajorRealm : undefined;
  }
  if (typeof eligibilityRule !== 'string') return undefined;
  return undefined;
};

const buildAuthoredDiagnosticsInput = (content: ReturnType<typeof adaptProgressionAuthoredContent>) => ({
  economyRealms: content.economy.majorRealms.map((realm) => realm.id),
  cities: content.cities.map((city) => ({ id: city.id, unlockMajorRealm: city.unlockMajorRealm })),
  trials: content.trials.map((trial) => ({
    id: trial.id,
    gateItemId: trial.gateItemId,
    fromMajorRealm: readTrialFromMajorRealm(trial.eligibilityRule),
    toMajorRealm: trial.gatesToMajorRealm,
  })),
  items: content.items.items.map((item) => item.id),
});

const legacyGateItemEntries = (items: Record<string, number>) =>
  Object.keys(items).filter((itemId) => !itemId.startsWith('gate_') && normalizeGateItemAlias(itemId) !== null);

const validateScenarioSemantics = (
  contract: ReturnType<typeof buildProgressionContract>,
  scenarios: ProgressionScenarioLike[],
): DriftIssue[] => {
  const issues: DriftIssue[] = [];
  scenarios.forEach((scenario) => {
    if (
      scenario.pathState.selectedPath !== null &&
      scenario.pathState.lifePathAlias !== null &&
      scenario.pathState.selectedPath !== scenario.pathState.lifePathAlias
    ) {
      pushIssue(issues, {
        id: `scenario-path-truth-split-${scenario.kind}`,
        category: 'PATH_TRUTH_SPLIT',
        severity: 'warning',
        summary: `Scenario ${scenario.kind} carries canonical selectedPath and legacy lifePath alias values that disagree.`,
        evidence: [{ path: `scenario:${scenario.kind}`, detail: `${scenario.pathState.selectedPath} !== ${scenario.pathState.lifePathAlias}` }],
        suggestedOwnerPacket: '1.2',
        fixStrategySummary: 'Keep scenario fixtures aligned with canonical selectedPath unless intentionally modeling legacy alias drift.',
        autoFixable: true,
      });
    }

    if (scenario.offlineState.pipelineId !== contract.offline.pipelineId) {
      pushIssue(issues, {
        id: `scenario-offline-pipeline-${scenario.kind}`,
        category: 'OFFLINE_PIPELINE_SPLIT',
        severity: 'error',
        summary: `Scenario ${scenario.kind} does not use the contract offline pipeline.`,
        evidence: [{ path: `scenario:${scenario.kind}`, detail: scenario.offlineState.pipelineId }],
        suggestedOwnerPacket: '1.8',
        fixStrategySummary: 'Always source offline pipeline expectations from the progression contract.',
        autoFixable: true,
      });
    }

    if (!contract.majorRealms[scenario.realmState.currentRealm as keyof typeof contract.majorRealms]) {
      pushIssue(issues, {
        id: `scenario-content-cap-${scenario.kind}`,
        category: 'CONTENT_CAP_BREACH',
        severity: 'error',
        summary: `Scenario ${scenario.kind} references a realm outside the semester contract.`,
        evidence: [{ path: `scenario:${scenario.kind}`, detail: scenario.realmState.currentRealm }],
        suggestedOwnerPacket: '1.1',
        fixStrategySummary: 'Keep scenario realm state within the live semester slice and clamp legacy post-cap references to Spirit Severing.',
        autoFixable: true,
      });
    }

    legacyGateItemEntries(scenario.gateState.inventoryGateItems).forEach((legacyItemId) => {
      pushIssue(issues, {
        id: `scenario-migration-alias-${scenario.kind}-${legacyItemId}`,
        category: 'MIGRATION_ALIAS_PRESENT',
        severity: 'info',
        summary: `Scenario ${scenario.kind} still carries legacy gate item alias ${legacyItemId}.`,
        evidence: [{ path: `scenario:${scenario.kind}`, detail: `normalized -> ${normalizeGateItemAlias(legacyItemId)}` }],
        suggestedOwnerPacket: '1.3',
        fixStrategySummary: 'Retain alias inventory keys only in explicitly legacy migration inputs and canonicalize current-shape outputs to gate_* ids.',
        autoFixable: true,
      });
    });
  });

  return issues;
};

const readMigrationFixtureIssues = (
  contract: ReturnType<typeof buildProgressionContract>,
  migrationFixtures: MigrationFixtureLike[],
): DriftIssue[] => {
  const issues: DriftIssue[] = [];
  const contentCapIndex = contract.majorRealms[getContentCapRealm(contract)].index;

  migrationFixtures.forEach(({ name, data }) => {
    const record = asRecord(data);
    const gameState = asRecord(record.gameState);
    const inventoryState = asRecord(record.inventoryState);
    const realmState = asRecord(gameState.realm);
    const prestigeState = asRecord(record.prestigeState);
    const metaState = asRecord(record.meta);
    const cityState = asRecord(record.cityState);
    const trialState = asRecord(record.trialState);
    const ruinsState = asRecord(record.ruinsState);
    const equipmentState = asRecord(record.equipmentState);
    const realmIndex = Number(realmState.index ?? -1);
    const canonicalUnlockedCities = contract.cityUnlocks
      .filter((unlock) => contract.majorRealms[unlock.unlockOnRealmEntry]?.index <= Math.min(realmIndex, contentCapIndex))
      .map((unlock) => unlock.cityId) as string[];
    const itemIds = Object.keys(asRecord(inventoryState.items) as Record<string, number>);
    const prestigePurchases = asRecord(prestigeState.purchasesById) as Record<string, number>;
    const offlineTimes = [metaState.lastActiveAtMs, gameState.lastActiveTime, gameState.lastTickTime].filter(
      (value): value is number => typeof value === 'number',
    );
    const unlockedCityIds = Array.isArray(cityState.unlockedCityIds)
      ? cityState.unlockedCityIds.filter((cityId): cityId is string => typeof cityId === 'string')
      : [];
    const currentCityId = typeof cityState.currentCityId === 'string' ? cityState.currentCityId : null;

    if (
      typeof gameState.lifePath === 'string' &&
      typeof gameState.selectedPath === 'string' &&
      gameState.lifePath !== gameState.selectedPath
    ) {
      pushIssue(issues, {
        id: `migration-path-truth-split-${name}`,
        category: 'PATH_TRUTH_SPLIT',
        severity: 'warning',
        summary: `Migration fixture ${name} carries canonical selectedPath and legacy lifePath alias values that disagree.`,
        evidence: [{ path: `fixture:${name}`, detail: `${gameState.selectedPath} !== ${gameState.lifePath}` }],
        suggestedOwnerPacket: '1.2',
        fixStrategySummary: 'Leave only intentional contradiction fixtures in the migration suite.',
        autoFixable: true,
      });
    }

    itemIds
      .filter((itemId) => !itemId.startsWith('gate_') && normalizeGateItemAlias(itemId) !== null)
      .forEach((itemId) => {
        pushIssue(issues, {
          id: `migration-alias-present-${name}-${itemId}`,
          category: 'MIGRATION_ALIAS_PRESENT',
          severity: 'info',
          summary: `Migration fixture ${name} still stores legacy gate item alias ${itemId}.`,
          evidence: [{ path: `fixture:${name}`, detail: `normalized -> ${normalizeGateItemAlias(itemId)}` }],
          suggestedOwnerPacket: '1.3',
          fixStrategySummary: 'Use these fixtures to prove packet 1.3 alias migration behavior without reintroducing legacy ids into canonical current-shape outputs.',
          autoFixable: true,
        });
      });

    if (realmIndex > contentCapIndex) {
      pushIssue(issues, {
        id: `migration-content-cap-${name}`,
        category: 'CONTENT_CAP_BREACH',
        severity: 'warning',
        summary: `Migration fixture ${name} exceeds the semester content cap index.`,
        evidence: [{ path: `fixture:${name}`, detail: `realm.index=${realmIndex} > ${contentCapIndex}` }],
        suggestedOwnerPacket: '1.1',
        fixStrategySummary: 'Preserve only fixtures intentionally exercising semester-slice cap normalization to Spirit Severing.',
        autoFixable: true,
      });
    }

    const cityProgressionMismatch =
      canonicalUnlockedCities.length > 0 &&
      (!record.cityState ||
        unlockedCityIds.length !== canonicalUnlockedCities.length ||
        canonicalUnlockedCities.some((cityId) => !unlockedCityIds.includes(cityId)) ||
        unlockedCityIds.some((cityId) => !canonicalUnlockedCities.includes(cityId)) ||
        (currentCityId !== null && !unlockedCityIds.includes(currentCityId)));

    if (cityProgressionMismatch) {
      pushIssue(issues, {
        id: `migration-city-progression-${name}`,
        category: 'CITY_UNLOCK_UNBOUND',
        severity: 'warning',
        summary: `Migration fixture ${name} does not preserve canonical city progression truth for its entered realm.`,
        evidence: [
          {
            path: `fixture:${name}`,
            detail: `expected cities=${canonicalUnlockedCities.join(', ') || 'none'}; actual=${unlockedCityIds.join(', ') || 'none'}; current=${currentCityId ?? 'null'}`,
          },
        ],
        suggestedOwnerPacket: '1.5',
        fixStrategySummary: 'Packet 1.5 should normalize save-shaped cityState to match canonical realm-entry unlock truth and keep currentCityId valid.',
        autoFixable: true,
      });
    }


    const hiddenPrestigePurchases = Object.keys(prestigePurchases).filter((nodeId) => isRefundableHiddenPrestigeNode(nodeId));
    if (hiddenPrestigePurchases.length > 0) {
      pushIssue(issues, {
        id: `migration-hidden-prestige-${name}`,
        category: 'HIDDEN_PRESTIGE_RUNTIME_CONSUMER',
        severity: 'warning',
        summary: `Migration fixture ${name} contains hidden prestige purchases that packet 1.6 must refund and clear from live save truth.`,
        evidence: hiddenPrestigePurchases.map((nodeId) => ({ path: `fixture:${name}`, detail: nodeId })),
        suggestedOwnerPacket: '1.6',
        fixStrategySummary: 'Retain this fixture as a regression input until packet 1.6 refund migration clears hidden prestige purchases and restores spendable AP.',
        autoFixable: false,
      });
    }

    const hasPartialResetResidue =
      realmIndex === 0 &&
      (Array.isArray(cityState.unlockedCityIds) && cityState.unlockedCityIds.length > 1 ||
        Object.keys(asRecord(trialState.progressByTrialId)).length > 0 ||
        Object.keys(asRecord(ruinsState.progressByRuinId)).length > 0 ||
        Object.values(asRecord(equipmentState.refineLevelBySlot) as Record<string, number>).some((value) => Number(value) > 0));
    if (hasPartialResetResidue) {
      pushIssue(issues, {
        id: `migration-partial-reset-${name}`,
        category: 'PARTIAL_PRESTIGE_RESET',
        severity: 'warning',
        summary: `Migration fixture ${name} leaves behind obvious per-life residue after a reset-shaped baseline.`,
        evidence: [{ path: `fixture:${name}`, detail: 'city/trial/ruins/equipment state remains populated at fresh-life realm index 0.' }],
        suggestedOwnerPacket: '1.7',
        fixStrategySummary: 'Keep this fixture as a regression target until reset cleanup is centralized and enforced.',
        autoFixable: false,
      });
    }

    if (new Set(offlineTimes).size > 1) {
      pushIssue(issues, {
        id: `migration-offline-split-${name}`,
        category: 'OFFLINE_PIPELINE_SPLIT',
        severity: 'warning',
        summary: `Migration fixture ${name} contains conflicting offline timestamps.`,
        evidence: [{ path: `fixture:${name}`, detail: offlineTimes.join(', ') }],
        suggestedOwnerPacket: '1.8',
        fixStrategySummary: 'Retain only fixtures that explicitly exercise offline timestamp reconciliation.',
        autoFixable: true,
      });
    }
  });

  return issues;
};

export const validateProgressionSemantics = (options: ValidateProgressionSemanticsOptions): DriftIssue[] => {
  const content = adaptProgressionAuthoredContent(options.rawContent);
  const contract = buildProgressionContract(content);
  const issues = collectProgressionDiagnostics(contract, {
    authoredContent: buildAuthoredDiagnosticsInput(content),
    runtimeFileTextByPath: options.runtimeFileTextByPath,
  });

  validateScenarioSemantics(contract, options.scenarios ?? []).forEach((entry) => pushIssue(issues, entry));
  readMigrationFixtureIssues(contract, options.migrationFixtures ?? []).forEach((entry) => pushIssue(issues, entry));

  return issues;
};
