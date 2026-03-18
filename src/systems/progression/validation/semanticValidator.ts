import {
  adaptProgressionAuthoredContent,
  buildProgressionContract,
  getContentCapRealm,
  normalizeGateItemAlias,
  type RawProgressionContentLike,
} from '../contract/index.js';
import { collectProgressionDiagnostics, type DriftIssue } from '../diagnostics/index.js';

export interface ProgressionScenarioLike {
  kind: string;
  pathState: {
    lifePath: string | null;
    selectedPathAlias: string | null;
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
      scenario.pathState.lifePath !== null &&
      scenario.pathState.selectedPathAlias !== null &&
      scenario.pathState.lifePath !== scenario.pathState.selectedPathAlias
    ) {
      pushIssue(issues, {
        id: `scenario-path-truth-split-${scenario.kind}`,
        category: 'PATH_TRUTH_SPLIT',
        severity: 'warning',
        summary: `Scenario ${scenario.kind} carries contradictory canonical and legacy path values.`,
        evidence: [{ path: `scenario:${scenario.kind}`, detail: `${scenario.pathState.lifePath} !== ${scenario.pathState.selectedPathAlias}` }],
        suggestedOwnerPacket: '1.2',
        fixStrategySummary: 'Keep scenario fixtures aligned with the contract path truth unless intentionally modeling migration drift.',
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
        suggestedOwnerPacket: '1.6',
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
        suggestedOwnerPacket: '1.5',
        fixStrategySummary: 'Keep scenario realm state within the contract-authored semester slice.',
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
        suggestedOwnerPacket: '1.8',
        fixStrategySummary: 'Preserve only explicitly legacy fixtures with alias inventory keys.',
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
    const record = (data ?? {}) as Record<string, any>;
    const gameState = (record.gameState ?? {}) as Record<string, any>;
    const inventoryState = (record.inventoryState ?? {}) as Record<string, any>;
    const realmIndex = Number(gameState.realm?.index ?? -1);
    const itemIds = Object.keys((inventoryState.items ?? {}) as Record<string, number>);
    const prestigePurchases = ((record.prestigeState?.purchasesById ?? {}) as Record<string, number>);
    const offlineTimes = [record.meta?.lastActiveAtMs, gameState.lastActiveTime, gameState.lastTickTime].filter(
      (value): value is number => typeof value === 'number',
    );

    if (
      typeof gameState.lifePath === 'string' &&
      typeof gameState.selectedPath === 'string' &&
      gameState.lifePath !== gameState.selectedPath
    ) {
      pushIssue(issues, {
        id: `migration-path-truth-split-${name}`,
        category: 'PATH_TRUTH_SPLIT',
        severity: 'warning',
        summary: `Migration fixture ${name} carries conflicting lifePath and selectedPath values.`,
        evidence: [{ path: `fixture:${name}`, detail: `${gameState.lifePath} !== ${gameState.selectedPath}` }],
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
          suggestedOwnerPacket: '1.8',
          fixStrategySummary: 'Use these fixtures to prove alias migration behavior without reintroducing runtime truth splits.',
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
        suggestedOwnerPacket: '1.5',
        fixStrategySummary: 'Preserve only fixtures intentionally exercising cap normalization or blocking behavior.',
        autoFixable: true,
      });
    }


    const deferredPrestigePurchases = Object.keys(prestigePurchases).filter(
      (nodeId) => contract.prestigeHooks.classifyNode(nodeId) === 'deferred',
    );
    if (deferredPrestigePurchases.length > 0) {
      pushIssue(issues, {
        id: `migration-hidden-prestige-${name}`,
        category: 'HIDDEN_PRESTIGE_RUNTIME_CONSUMER',
        severity: 'warning',
        summary: `Migration fixture ${name} contains deferred prestige purchases that should remain hidden from live runtime flows.`,
        evidence: deferredPrestigePurchases.map((nodeId) => ({ path: `fixture:${name}`, detail: nodeId })),
        suggestedOwnerPacket: '1.7',
        fixStrategySummary: 'Retain this fixture for regression coverage until prestige cleanup routes all deferred nodes through contract-backed projections.',
        autoFixable: false,
      });
    }

    const hasPartialResetResidue =
      realmIndex === 0 &&
      (Array.isArray(record.cityState?.unlockedCityIds) && record.cityState.unlockedCityIds.length > 1 ||
        Object.keys((record.trialState?.progressByTrialId ?? {}) as Record<string, unknown>).length > 0 ||
        Object.keys((record.ruinsState?.progressByRuinId ?? {}) as Record<string, unknown>).length > 0 ||
        Object.values((record.equipmentState?.refineLevelBySlot ?? {}) as Record<string, number>).some((value) => Number(value) > 0));
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
        suggestedOwnerPacket: '1.6',
        fixStrategySummary: 'Retain only fixtures that explicitly exercise offline timestamp reconciliation.',
        autoFixable: true,
      });
    }
  });

  return issues;
};

export const validateProgressionSemantics = ({
  rawContent,
  runtimeFileTextByPath = {},
  scenarios = [],
  migrationFixtures = [],
}: ValidateProgressionSemanticsOptions): DriftIssue[] => {
  const authoredContent = adaptProgressionAuthoredContent(rawContent);
  const contract = buildProgressionContract(authoredContent);
  const issues = collectProgressionDiagnostics(contract, {
    authoredContent: buildAuthoredDiagnosticsInput(authoredContent),
    runtimeFileTextByPath,
  });

  validateScenarioSemantics(contract, scenarios).forEach((entry) => pushIssue(issues, entry));
  readMigrationFixtureIssues(contract, migrationFixtures).forEach((entry) => pushIssue(issues, entry));

  return issues;
};
