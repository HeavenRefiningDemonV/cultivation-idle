import { runSaveMigrations } from './migrationRunner.js';
import { CURRENT_SAVE_VERSION, type LegacySaveVersionKind } from './saveVersion.js';
import type { MigrationRunReport } from './migrationTypes.js';
import {
  RELEASE_MIGRATION_FIXTURE_CATALOG,
  type ReleaseMigrationExpectationResult,
  type ReleaseMigrationFixtureDefinition,
  type ReleaseMigrationFixtureGroup,
  type ReleaseMigrationSemanticSnapshot,
} from './releaseMigrationFixtureCatalog.js';
import { readOfflineTimestampSnapshot } from '../offlineTimestampNormalization.js';
import { normalizeGateItemAlias, isRefundableHiddenPrestigeNode } from '../../systems/progression/contract/index.js';
import { CANONICAL_MAJOR_REALMS, getCanonicalMajorRealmName } from '../../systems/progression/contract/realmMap.js';
import { SEMESTER_SLICE_CONTRACT } from '../../systems/progression/contract/semesterSlice.js';
import { listHiddenCraftOutputItemIds } from '../../systems/economy/index.js';

const HIDDEN_CRAFT_OUTPUT_ITEM_IDS = new Set(listHiddenCraftOutputItemIds());

type MatrixFixtureInput = {
  fixtureId: string;
  save: Record<string, unknown>;
};

export type ReleaseMigrationStepSummary = {
  activeStepIds: string[];
  plannedStepIds: string[];
  reportOnlyStepIds: string[];
  warningCount: number;
  errorCount: number;
  touchedPaths: string[];
  finalVersion: string;
};

export type ReleaseMigrationMatrixEntry = {
  fixtureId: string;
  title: string;
  group: ReleaseMigrationFixtureGroup;
  riskClassId: ReleaseMigrationFixtureDefinition['riskClassId'];
  sourceVersion: string;
  sourceVersionKind: LegacySaveVersionKind;
  dryRun: ReleaseMigrationStepSummary;
  apply: ReleaseMigrationStepSummary;
  semanticSnapshot: ReleaseMigrationSemanticSnapshot;
  expectationResults: ReleaseMigrationExpectationResult[];
  overallPass: boolean;
  issues: string[];
};

export type ReleaseMigrationMatrixReport = {
  suiteVersion: '7.2b';
  generatedAt: number;
  targetVersion: string;
  overallPass: boolean;
  primaryRiskPass: boolean;
  compatibilityPass: boolean;
  totalFixtures: number;
  failedFixtureIds: string[];
  issueSummary: {
    totalIssues: number;
    byGroup: Record<ReleaseMigrationFixtureGroup, number>;
    totalWarnings: number;
    totalErrors: number;
  };
  entries: ReleaseMigrationMatrixEntry[];
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const readNumber = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);

const uniq = (values: string[]): string[] => Array.from(new Set(values));

const summarizeReport = (report: MigrationRunReport): ReleaseMigrationStepSummary => ({
  activeStepIds: [...report.appliedTransformSteps],
  plannedStepIds: [...report.plannedTransformSteps],
  reportOnlyStepIds: [...report.reportOnlySteps],
  warningCount: report.warnings.length,
  errorCount: report.errors.length,
  touchedPaths: uniq(report.touchedFieldPaths.map((touch) => touch.path)),
  finalVersion: report.finalVersion,
});

const readFirstTrialResolution = (save: Record<string, unknown>): string | null => {
  const trialState = asRecord(save.trialState);
  const progress = asRecord(trialState.progressByTrialId);
  const firstTrialId = SEMESTER_SLICE_CONTRACT.liveTrialIds[0] as string | undefined;
  if (!firstTrialId) return null;
  const trial = asRecord(progress[firstTrialId]);
  return typeof trial.resolution === 'string' ? trial.resolution : null;
};

const listLegacyGateAliasIds = (save: Record<string, unknown>): string[] => {
  const items = asRecord(asRecord(save.inventoryState).items);
  return Object.entries(items)
    .filter(([itemId, qty]) => {
      if (!(typeof qty === 'number' && qty > 0)) return false;
      if (itemId.startsWith('gate_')) return false;
      return normalizeGateItemAlias(itemId) !== null;
    })
    .map(([itemId]) => itemId)
    .sort();
};

const listHiddenPrestigePurchaseIds = (save: Record<string, unknown>): string[] => {
  const purchases = asRecord(asRecord(save.prestigeState).purchasesById);
  return Object.entries(purchases)
    .filter(([nodeId, rawLevel]) => typeof rawLevel === 'number' && rawLevel > 0 && isRefundableHiddenPrestigeNode(nodeId))
    .map(([nodeId]) => nodeId)
    .sort();
};

const listHiddenCraftResidueIds = (save: Record<string, unknown>): string[] => {
  const residues = new Set<string>();

  const items = asRecord(asRecord(save.inventoryState).items);
  Object.entries(items).forEach(([itemId, qty]) => {
    if (typeof qty === 'number' && qty > 0 && HIDDEN_CRAFT_OUTPUT_ITEM_IDS.has(itemId)) residues.add(itemId);
  });

  const professionState = asRecord(save.professionState);
  asArray<Record<string, unknown>>(professionState.alchemyQueue).forEach((entry) => {
    if (typeof entry.recipeId === 'string') residues.add(`alchemy:${entry.recipeId}`);
  });
  asArray<Record<string, unknown>>(professionState.talismanQueue).forEach((entry) => {
    if (typeof entry.recipeId === 'string') residues.add(`talisman:${entry.recipeId}`);
  });
  asArray<Record<string, unknown>>(professionState.forgeQueue).forEach((entry) => {
    const id = typeof entry.blueprintId === 'string' ? entry.blueprintId : typeof entry.recipeId === 'string' ? entry.recipeId : null;
    if (id) residues.add(`forge:${id}`);
  });

  const activeSession = asRecord(asRecord(save.craftSessionState).activeSession);
  if (typeof activeSession.sourceId === 'string') residues.add(`session:${activeSession.sourceId}`);

  asArray<Record<string, unknown>>(asRecord(save.buffState).activeTalismans).forEach((entry) => {
    if (typeof entry.itemId === 'string' && HIDDEN_CRAFT_OUTPUT_ITEM_IDS.has(entry.itemId)) residues.add(`buff:${entry.itemId}`);
  });

  const slots = asRecord(asRecord(save.medicinePouchState).slots);
  Object.entries(slots).forEach(([slotKey, slotRaw]) => {
    const slot = asRecord(slotRaw);
    if (typeof slot.equippedItemId === 'string' && HIDDEN_CRAFT_OUTPUT_ITEM_IDS.has(slot.equippedItemId)) {
      residues.add(`pouch:${slotKey}:${slot.equippedItemId}`);
    }
  });

  return Array.from(residues).sort();
};

const buildSemanticSnapshot = (
  fixture: ReleaseMigrationFixtureDefinition,
  applyReport: MigrationRunReport,
  migratedSave: Record<string, unknown>,
): ReleaseMigrationSemanticSnapshot => {
  const gameState = asRecord(migratedSave.gameState);
  const realm = asRecord(gameState.realm);
  const cityState = asRecord(migratedSave.cityState);
  const unlockedCityIds = asArray<string>(cityState.unlockedCityIds).filter((entry): entry is string => typeof entry === 'string');
  const offlineSnapshot = readOfflineTimestampSnapshot(migratedSave);
  const offlineValues = Object.values(offlineSnapshot).filter((value): value is number => value !== null);

  const realmIndex = readNumber(realm.index);
  const realmName = typeof realm.name === 'string'
    ? realm.name
    : realmIndex !== null && realmIndex >= 0 && realmIndex < CANONICAL_MAJOR_REALMS.length
      ? getCanonicalMajorRealmName(CANONICAL_MAJOR_REALMS[realmIndex]!)
      : null;

  return {
    fixtureId: fixture.fixtureId,
    riskClassId: fixture.riskClassId,
    sourceVersion: applyReport.sourceVersion,
    sourceVersionKind: applyReport.sourceVersionKind,
    finalVersion: applyReport.finalVersion,
    selectedPath: typeof gameState.selectedPath === 'string' ? gameState.selectedPath : gameState.selectedPath === null ? null : null,
    realmIndex,
    realmName,
    highestRealmReached: readNumber(asRecord(migratedSave.prestigeState).highestRealmReached),
    currentCityId: typeof cityState.currentCityId === 'string' ? cityState.currentCityId : cityState.currentCityId === null ? null : null,
    unlockedCityIds,
    firstTrialResolution: readFirstTrialResolution(migratedSave),
    legacyGateAliasIdsRemaining: listLegacyGateAliasIds(migratedSave),
    hiddenPrestigePurchaseIdsRemaining: listHiddenPrestigePurchaseIds(migratedSave),
    hiddenCraftOutputIdsRemaining: listHiddenCraftResidueIds(migratedSave),
    offlineTimestampSnapshot: offlineSnapshot,
    offlineTimestampsAligned: offlineValues.length <= 1 || new Set(offlineValues).size <= 1,
    noFakeCitySix: !unlockedCityIds.includes('city_six') && unlockedCityIds.every((cityId) => SEMESTER_SLICE_CONTRACT.liveCityIds.includes(cityId as never)),
  };
};

const bool = (value: boolean) => (value ? 'true' : 'false');

const evaluateExpectations = (
  definition: ReleaseMigrationFixtureDefinition,
  snapshot: ReleaseMigrationSemanticSnapshot,
  applyReport: MigrationRunReport,
  dryRunReport: MigrationRunReport,
  applySave: Record<string, unknown>,
  applyIdempotent: boolean,
): ReleaseMigrationExpectationResult[] => {
  const results: ReleaseMigrationExpectationResult[] = [];
  const expected = definition.expectations;

  if (expected.selectedPath !== undefined) {
    results.push({
      key: 'selectedPath',
      pass: snapshot.selectedPath === expected.selectedPath,
      expected: String(expected.selectedPath),
      actual: String(snapshot.selectedPath),
      message: 'selectedPath matches expected canonical truth.',
    });
  }

  if (expected.currentCityId !== undefined) {
    results.push({
      key: 'currentCityId',
      pass: snapshot.currentCityId === expected.currentCityId,
      expected: String(expected.currentCityId),
      actual: String(snapshot.currentCityId),
      message: 'currentCityId normalized as expected.',
    });
  }

  if (expected.unlockedCityIdsExact) {
    const actual = JSON.stringify(snapshot.unlockedCityIds);
    const wanted = JSON.stringify(expected.unlockedCityIdsExact);
    results.push({
      key: 'unlockedCityIdsExact',
      pass: actual === wanted,
      expected: wanted,
      actual,
      message: 'unlocked city chain equals expected canonical chain.',
    });
  }

  if (expected.unlockedCityIdsSubsetOfLiveSlice) {
    const inSlice = snapshot.unlockedCityIds.every((cityId) => SEMESTER_SLICE_CONTRACT.liveCityIds.includes(cityId as never));
    results.push({
      key: 'unlockedCityIdsSubsetOfLiveSlice',
      pass: inSlice,
      expected: 'all unlocked cities are in live slice',
      actual: snapshot.unlockedCityIds.join(',') || '(none)',
      message: 'unlocked city ids stay within live slice.',
    });
  }

  if (expected.firstTrialResolution !== undefined) {
    results.push({
      key: 'firstTrialResolution',
      pass: snapshot.firstTrialResolution === expected.firstTrialResolution,
      expected: expected.firstTrialResolution,
      actual: String(snapshot.firstTrialResolution),
      message: 'first trial resolution normalized correctly.',
    });
  }

  if (expected.maxRealmIndex !== undefined) {
    results.push({
      key: 'maxRealmIndex',
      pass: snapshot.realmIndex !== null && snapshot.realmIndex <= expected.maxRealmIndex,
      expected: `<= ${expected.maxRealmIndex}`,
      actual: String(snapshot.realmIndex),
      message: 'realm index is clamped to expected cap.',
    });
  }

  if (expected.realmName !== undefined) {
    results.push({
      key: 'realmName',
      pass: snapshot.realmName === expected.realmName,
      expected: expected.realmName,
      actual: String(snapshot.realmName),
      message: 'realm name matches expected canonical cap realm.',
    });
  }

  if (expected.highestRealmReached !== undefined) {
    results.push({
      key: 'highestRealmReached',
      pass: snapshot.highestRealmReached === expected.highestRealmReached,
      expected: String(expected.highestRealmReached),
      actual: String(snapshot.highestRealmReached),
      message: 'highestRealmReached is normalized as expected.',
    });
  }

  if (expected.noLegacyGateAliasIds) {
    results.push({
      key: 'noLegacyGateAliasIds',
      pass: snapshot.legacyGateAliasIdsRemaining.length === 0,
      expected: '(none)',
      actual: snapshot.legacyGateAliasIdsRemaining.join(',') || '(none)',
      message: 'legacy gate alias ids are fully removed.',
    });
  }

  if (expected.requireCanonicalGateIds && expected.requireCanonicalGateIds.length > 0) {
    const items = asRecord(asRecord(applySave.inventoryState).items);
    const missing = expected.requireCanonicalGateIds.filter((id) => !(typeof items[id] === 'number' && (items[id] as number) > 0));
    results.push({
      key: 'requireCanonicalGateIds',
      pass: missing.length === 0,
      expected: expected.requireCanonicalGateIds.join(','),
      actual: missing.length === 0 ? 'all present' : `missing: ${missing.join(',')}`,
      message: 'canonical gate ids exist post-migration where expected.',
    });
  }

  if (expected.noHiddenPrestigePurchases) {
    results.push({
      key: 'noHiddenPrestigePurchases',
      pass: snapshot.hiddenPrestigePurchaseIdsRemaining.length === 0,
      expected: '(none)',
      actual: snapshot.hiddenPrestigePurchaseIdsRemaining.join(',') || '(none)',
      message: 'hidden prestige purchases are cleared.',
    });
  }

  if (expected.noHiddenCraftOutputs) {
    results.push({
      key: 'noHiddenCraftOutputs',
      pass: snapshot.hiddenCraftOutputIdsRemaining.length === 0,
      expected: '(none)',
      actual: snapshot.hiddenCraftOutputIdsRemaining.join(',') || '(none)',
      message: 'hidden craft residues are cleared from all tracked surfaces.',
    });
  }

  if (expected.offlineTimestampsAligned !== undefined) {
    results.push({
      key: 'offlineTimestampsAligned',
      pass: snapshot.offlineTimestampsAligned === expected.offlineTimestampsAligned,
      expected: bool(expected.offlineTimestampsAligned),
      actual: bool(snapshot.offlineTimestampsAligned),
      message: 'offline timestamps are aligned to canonical timestamp.',
    });
  }

  if (expected.noFakeCitySix !== undefined) {
    results.push({
      key: 'noFakeCitySix',
      pass: snapshot.noFakeCitySix === expected.noFakeCitySix,
      expected: bool(expected.noFakeCitySix),
      actual: bool(snapshot.noFakeCitySix),
      message: 'city unlock state does not include fake city six.',
    });
  }

  if (expected.finalVersionIsCurrent) {
    results.push({
      key: 'finalVersionIsCurrent',
      pass: snapshot.finalVersion === CURRENT_SAVE_VERSION,
      expected: CURRENT_SAVE_VERSION,
      actual: snapshot.finalVersion,
      message: 'final save version reaches current target.',
    });
  }

  if (expected.sourceVersionKind !== undefined) {
    results.push({
      key: 'sourceVersionKind',
      pass: snapshot.sourceVersionKind === expected.sourceVersionKind,
      expected: expected.sourceVersionKind,
      actual: snapshot.sourceVersionKind,
      message: 'source version detection kind matches expectation.',
    });
  }

  if (definition.expectedSourceVersionKind) {
    results.push({
      key: 'expectedSourceVersionKind',
      pass: dryRunReport.sourceVersionKind === definition.expectedSourceVersionKind,
      expected: definition.expectedSourceVersionKind,
      actual: dryRunReport.sourceVersionKind,
      message: 'catalog expectedSourceVersionKind matches dry-run report.',
    });
  }

  if (definition.expectedPrimaryStepIds.length > 0) {
    const missing = definition.expectedPrimaryStepIds.filter((stepId) => !applyReport.appliedTransformSteps.includes(stepId));
    results.push({
      key: 'expectedPrimaryStepIds',
      pass: missing.length === 0,
      expected: definition.expectedPrimaryStepIds.join(','),
      actual: missing.length === 0 ? 'all present' : `missing: ${missing.join(',')}`,
      message: 'primary migration steps executed for fixture.',
    });
  }

  const expectedErrors = definition.expectedErrorCount ?? 0;
  results.push({
    key: 'errorCount',
    pass: applyReport.errors.length === expectedErrors,
    expected: String(expectedErrors),
    actual: String(applyReport.errors.length),
    message: 'error count matches expected posture.',
  });

  if (expected.applyIdempotent) {
    results.push({
      key: 'applyIdempotent',
      pass: applyIdempotent,
      expected: 'true',
      actual: bool(applyIdempotent),
      message: 'second apply pass is idempotent.',
    });
  }

  return results;
};

export type BuildReleaseMigrationMatrixOptions = {
  fixtures: MatrixFixtureInput[];
  catalog?: readonly ReleaseMigrationFixtureDefinition[];
  generatedAt?: number;
};

export function buildReleaseMigrationMatrixReport(options: BuildReleaseMigrationMatrixOptions): ReleaseMigrationMatrixReport {
  const catalog = options.catalog ?? RELEASE_MIGRATION_FIXTURE_CATALOG;
  const fixtureMap = new Map(options.fixtures.map((fixture) => [fixture.fixtureId, fixture.save]));

  const entries = catalog.map((definition): ReleaseMigrationMatrixEntry => {
    const save = fixtureMap.get(definition.fixtureId);
    if (!save) {
      return {
        fixtureId: definition.fixtureId,
        title: definition.title,
        group: definition.group,
        riskClassId: definition.riskClassId,
        sourceVersion: 'unknown',
        sourceVersionKind: 'legacy-unversioned',
        dryRun: {
          activeStepIds: [],
          plannedStepIds: [],
          reportOnlyStepIds: [],
          warningCount: 0,
          errorCount: 1,
          touchedPaths: [],
          finalVersion: 'unknown',
        },
        apply: {
          activeStepIds: [],
          plannedStepIds: [],
          reportOnlyStepIds: [],
          warningCount: 0,
          errorCount: 1,
          touchedPaths: [],
          finalVersion: 'unknown',
        },
        semanticSnapshot: {
          fixtureId: definition.fixtureId,
          riskClassId: definition.riskClassId,
          sourceVersion: 'unknown',
          sourceVersionKind: 'legacy-unversioned',
          finalVersion: 'unknown',
          selectedPath: null,
          realmIndex: null,
          realmName: null,
          highestRealmReached: null,
          currentCityId: null,
          unlockedCityIds: [],
          firstTrialResolution: null,
          legacyGateAliasIdsRemaining: [],
          hiddenPrestigePurchaseIdsRemaining: [],
          hiddenCraftOutputIdsRemaining: [],
          offlineTimestampSnapshot: { metaLastActiveAtMs: null, gameLastActiveTime: null, gameLastTickTime: null },
          offlineTimestampsAligned: true,
          noFakeCitySix: true,
        },
        expectationResults: [{
          key: 'fixtureLoad',
          pass: false,
          expected: 'fixture exists',
          actual: 'missing',
          message: `Missing fixture input for ${definition.fixtureId}.`,
        }],
        overallPass: false,
        issues: [`Missing fixture input for ${definition.fixtureId}.`],
      };
    }

    const dry = runSaveMigrations(save, { mode: 'dry-run', normalizeToCurrent: (input) => input });
    const apply = runSaveMigrations(save, { mode: 'apply', normalizeToCurrent: (input) => input });
    const secondApply = runSaveMigrations(apply.migrated, { mode: 'apply', normalizeToCurrent: (input) => input });

    const snapshot = buildSemanticSnapshot(definition, apply.report, apply.migrated);
    const expectationResults = evaluateExpectations(
      definition,
      snapshot,
      apply.report,
      dry.report,
      apply.migrated,
      JSON.stringify(secondApply.migrated) === JSON.stringify(apply.migrated),
    );

    const issues = expectationResults
      .filter((result) => !result.pass)
      .map((result) => `${result.key}: expected ${result.expected}, actual ${result.actual}`);

    return {
      fixtureId: definition.fixtureId,
      title: definition.title,
      group: definition.group,
      riskClassId: definition.riskClassId,
      sourceVersion: apply.report.sourceVersion,
      sourceVersionKind: apply.report.sourceVersionKind,
      dryRun: summarizeReport(dry.report),
      apply: summarizeReport(apply.report),
      semanticSnapshot: snapshot,
      expectationResults,
      overallPass: issues.length === 0,
      issues,
    };
  });

  const failedFixtureIds = entries.filter((entry) => !entry.overallPass).map((entry) => entry.fixtureId);
  const primaryEntries = entries.filter((entry) => entry.group === 'primary_risk');
  const compatibilityEntries = entries.filter((entry) => entry.group === 'compatibility');

  return {
    suiteVersion: '7.2b',
    generatedAt: options.generatedAt ?? Date.now(),
    targetVersion: CURRENT_SAVE_VERSION,
    overallPass: failedFixtureIds.length === 0,
    primaryRiskPass: primaryEntries.every((entry) => entry.overallPass),
    compatibilityPass: compatibilityEntries.every((entry) => entry.overallPass),
    totalFixtures: entries.length,
    failedFixtureIds,
    issueSummary: {
      totalIssues: entries.reduce((sum, entry) => sum + entry.issues.length, 0),
      byGroup: {
        primary_risk: primaryEntries.reduce((sum, entry) => sum + entry.issues.length, 0),
        compatibility: compatibilityEntries.reduce((sum, entry) => sum + entry.issues.length, 0),
      },
      totalWarnings: entries.reduce((sum, entry) => sum + entry.apply.warningCount + entry.dryRun.warningCount, 0),
      totalErrors: entries.reduce((sum, entry) => sum + entry.apply.errorCount + entry.dryRun.errorCount, 0),
    },
    entries,
  };
}

const renderEntry = (entry: ReleaseMigrationMatrixEntry): string[] => {
  const stepIds = entry.apply.activeStepIds.length > 0 ? entry.apply.activeStepIds.join(', ') : '(none)';
  const snapshot = entry.semanticSnapshot;
  const compactSemantics = [
    `path=${snapshot.selectedPath ?? 'null'}`,
    `realm=${snapshot.realmName ?? snapshot.realmIndex ?? 'null'}`,
    `city=${snapshot.currentCityId ?? 'null'}`,
    `trial1=${snapshot.firstTrialResolution ?? 'n/a'}`,
    `gateAliasesRemaining=${snapshot.legacyGateAliasIdsRemaining.length}`,
    `hiddenPrestigeRemaining=${snapshot.hiddenPrestigePurchaseIdsRemaining.length}`,
    `hiddenCraftRemaining=${snapshot.hiddenCraftOutputIdsRemaining.length}`,
    `offlineAligned=${snapshot.offlineTimestampsAligned ? 'yes' : 'no'}`,
  ].join(' | ');

  const lines = [
    `- ${entry.overallPass ? 'PASS' : 'FAIL'} ${entry.fixtureId} — ${entry.title}`,
    `  source: ${entry.sourceVersion} (${entry.sourceVersionKind}) -> ${entry.apply.finalVersion}`,
    `  steps: ${stepIds}`,
    `  semantics: ${compactSemantics}`,
  ];

  if (!entry.overallPass) {
    entry.issues.forEach((issue) => lines.push(`  issue: ${issue}`));
  }

  return lines;
};

export function renderReleaseMigrationMatrixReport(report: ReleaseMigrationMatrixReport): string {
  const lines: string[] = [];
  lines.push('=== Legacy-save Migration Matrix Report (Packet 7.2b) ===');
  lines.push(`generatedAt: ${new Date(report.generatedAt).toISOString()}`);
  lines.push(`targetVersion: ${report.targetVersion}`);
  lines.push(`overall: ${report.overallPass ? 'PASS' : 'FAIL'}`);
  lines.push(`primaryRisk: ${report.primaryRiskPass ? 'PASS' : 'FAIL'} | compatibility: ${report.compatibilityPass ? 'PASS' : 'FAIL'}`);
  lines.push(`fixtures: ${report.totalFixtures} | failed: ${report.failedFixtureIds.length}`);
  lines.push(`issues: ${report.issueSummary.totalIssues} | warnings(seen): ${report.issueSummary.totalWarnings} | errors(seen): ${report.issueSummary.totalErrors}`);
  lines.push('');

  lines.push('Primary risk fixtures:');
  report.entries.filter((entry) => entry.group === 'primary_risk').forEach((entry) => lines.push(...renderEntry(entry)));
  lines.push('');

  lines.push('Compatibility fixtures:');
  report.entries.filter((entry) => entry.group === 'compatibility').forEach((entry) => lines.push(...renderEntry(entry)));

  if (report.failedFixtureIds.length > 0) {
    lines.push('');
    lines.push(`Failure rollup: ${report.failedFixtureIds.join(', ')}`);
  }

  return lines.join('\n');
}

export function serializeReleaseMigrationMatrixReport(report: ReleaseMigrationMatrixReport): string {
  return JSON.stringify(report, null, 2);
}
