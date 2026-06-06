import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import type { LiveWorldModuleKey } from '../../src/content/types.js';
import type { GameTab } from '../../src/stores/uiStore.js';
import {
  guardOnboardingTabRoute,
  guardOnboardingWorldModuleRoute,
} from '../../src/systems/onboarding/onboardingRouteGuards.js';
import { buildOnboardingSourceSinkGuards } from '../../src/systems/onboarding/onboardingSourceSinkGuards.js';
import type {
  BuildOnboardingTabPolicyInput,
  OnboardingTabPolicy,
} from '../../src/systems/onboarding/onboardingTabPolicy.js';
import { buildOnboardingTabPolicy } from '../../src/systems/onboarding/onboardingTabPolicy.js';
import type {
  BuildOnboardingWorldModulePolicyInput,
  OnboardingWorldModulePolicy,
} from '../../src/systems/onboarding/onboardingWorldModulePolicy.js';
import { buildOnboardingWorldModulePolicy } from '../../src/systems/onboarding/onboardingWorldModulePolicy.js';
import type {
  OnboardingRouteTarget,
  OnboardingRuntimeMilestoneId,
  SaveOnboardingState,
} from '../../src/systems/onboarding/onboardingTypes.js';
import { DEFAULT_ONBOARDING_UNLOCKS_BY_MILESTONE } from '../../src/systems/onboarding/onboardingTypes.js';

export type OnboardingMatrixScenarioId =
  | 'M0_life_start'
  | 'M1_cultivation_only'
  | 'M2_status_unlock'
  | 'M3_world_outskirts'
  | 'M4_pavilion_satchel'
  | 'M5_techniques_loadout'
  | 'M6_apothecary_expedition'
  | 'M7_forge'
  | 'M8_ruins_bounties'
  | 'M9_gate_trial'
  | 'M10_foundation_graduation'
  | 'complete_first_life'
  | 'foundation_plus_existing_save'
  | 'second_life_reclaim'
  | 'dev_override_unlock_all'
  | 'exact_fixture_capture_mode';

export interface OnboardingRouteEscapeCheck {
  kind: 'tab' | 'world_module';
  key: string;
  expectedAllowed: boolean;
  actualAllowed: boolean;
  pass: boolean;
  reason: string | null;
}

export interface OnboardingSourceSinkGuardCheck {
  guardId: string;
  severity: string;
  targetKind: OnboardingRouteTarget['kind'] | 'none';
  targetKey: string | null;
  pass: boolean;
  reason: string | null;
}

export interface OnboardingReleaseMatrixRow {
  id: OnboardingMatrixScenarioId;
  activeMilestoneId: OnboardingRuntimeMilestoneId | null;
  description: string;
  visibleTabs: GameTab[];
  hiddenTabs: GameTab[];
  utilityTabs: GameTab[];
  availableWorldModules: LiveWorldModuleKey[];
  teaserWorldModules: LiveWorldModuleKey[];
  hiddenWorldModules: LiveWorldModuleKey[];
  tabEscapeChecks: OnboardingRouteEscapeCheck[];
  worldModuleEscapeChecks: OnboardingRouteEscapeCheck[];
  sourceSinkGuardChecks: OnboardingSourceSinkGuardCheck[];
  pass: boolean;
  notes: string[];
}

export interface OnboardingReleaseMatrixReport {
  schemaVersion: 'onboarding-release-matrix-v1';
  generatedAt: string;
  overallPass: boolean;
  blockerCount: number;
  warningCount: number;
  rows: OnboardingReleaseMatrixRow[];
  sourceSinkRouteViolations: string[];
}

interface ScenarioDefinition {
  id: OnboardingMatrixScenarioId;
  activeMilestoneId: OnboardingRuntimeMilestoneId | null;
  description: string;
  firstLifeOnlyComplete?: boolean;
  storyOrLifeStartBlocking?: boolean;
  hasInventoryEvidence?: boolean;
  isExistingAdvancedSave?: boolean;
  exactFixtureOrCaptureMode?: boolean;
  devOverride?: SaveOnboardingState['devOverride'];
}

const ALL_TABS: readonly GameTab[] = [
  'cultivation',
  'status',
  'adventure',
  'inventory',
  'records',
  'techniques',
  'prestige',
  'settings',
];

const LIVE_WORLD_MODULES: readonly LiveWorldModuleKey[] = [
  'outskirts',
  'manualPavilion',
  'apothecary',
  'expeditions',
  'forge',
  'ruins',
  'bounties',
  'gateTrial',
];

const SELECTED_CITY_MODULES: readonly string[] = [
  ...LIVE_WORLD_MODULES,
  'alchemy',
  'talismanStudio',
];

const FORBIDDEN_PUBLIC_COPY = [
  'Current Omen',
  'Gate Proof',
  'Recent Omens',
  'Source Thread',
  'Proof Detail',
  'Preparation Health',
  'Mandate Lens',
  'Module Source-Sink',
  'Threshold Omen',
  'Omen evidence',
  'Proof sealed',
  'Source sealed',
  'Dao Mandate Interface',
  'Current Mandate',
];

const SCENARIOS: readonly ScenarioDefinition[] = [
  {
    id: 'M0_life_start',
    activeMilestoneId: 'M0_life_start',
    description: 'Fresh save before life identity is committed.',
    storyOrLifeStartBlocking: true,
  },
  { id: 'M1_cultivation_only', activeMilestoneId: 'M1_cultivation_only', description: 'Cultivation-only first lesson.' },
  { id: 'M2_status_unlock', activeMilestoneId: 'M2_status_unlock', description: 'Status unlock lesson.' },
  { id: 'M3_world_outskirts', activeMilestoneId: 'M3_world_outskirts', description: 'World and Outskirts unlock lesson.' },
  { id: 'M4_pavilion_satchel', activeMilestoneId: 'M4_pavilion_satchel', description: 'Manual Pavilion and satchel lesson.' },
  { id: 'M5_techniques_loadout', activeMilestoneId: 'M5_techniques_loadout', description: 'Technique loadout lesson.' },
  { id: 'M6_apothecary_expedition', activeMilestoneId: 'M6_apothecary_expedition', description: 'Medicine and expedition support lesson.' },
  { id: 'M7_forge', activeMilestoneId: 'M7_forge', description: 'Forge floor lesson.' },
  { id: 'M8_ruins_bounties', activeMilestoneId: 'M8_ruins_bounties', description: 'Ruins and Bounty Board support lesson.' },
  { id: 'M9_gate_trial', activeMilestoneId: 'M9_gate_trial', description: 'Gate Trial attempt lesson with defeated-attempt correction.' },
  { id: 'M10_foundation_graduation', activeMilestoneId: 'M10_foundation_graduation', description: 'Foundation graduation pending breakthrough.' },
  {
    id: 'complete_first_life',
    activeMilestoneId: 'complete',
    description: 'Completed first-life onboarding after Foundation breakthrough.',
    firstLifeOnlyComplete: true,
  },
  {
    id: 'foundation_plus_existing_save',
    activeMilestoneId: 'M2_status_unlock',
    description: 'Existing Foundation+ save must not lose advanced tabs or modules.',
    isExistingAdvancedSave: true,
  },
  {
    id: 'second_life_reclaim',
    activeMilestoneId: 'complete',
    description: 'Second-life or reclaim save keeps contextual help and no first-life replay.',
    firstLifeOnlyComplete: true,
  },
  {
    id: 'dev_override_unlock_all',
    activeMilestoneId: 'M1_cultivation_only',
    description: 'Developer override opens all supported onboarding surfaces.',
    devOverride: { unlockAll: true },
  },
  {
    id: 'exact_fixture_capture_mode',
    activeMilestoneId: 'M3_world_outskirts',
    description: 'Exact fixture/capture mode bypasses normal route guards for visual proof.',
    exactFixtureOrCaptureMode: true,
  },
];

function unlocksFor(activeMilestoneId: OnboardingRuntimeMilestoneId | null) {
  if (!activeMilestoneId || activeMilestoneId === 'complete') {
    return { tabs: [], worldModules: [], teaserWorldModules: [] };
  }
  return DEFAULT_ONBOARDING_UNLOCKS_BY_MILESTONE[activeMilestoneId];
}

function buildTabPolicyForScenario(scenario: ScenarioDefinition): OnboardingTabPolicy {
  const unlocks = unlocksFor(scenario.activeMilestoneId);
  const input: BuildOnboardingTabPolicyInput = {
    activeMilestoneId: scenario.activeMilestoneId,
    unlockedTabs: [...unlocks.tabs],
    supportedTabs: ALL_TABS,
    settingsAsUtility: true,
    firstLifeOnlyComplete: scenario.firstLifeOnlyComplete,
    storyOrLifeStartBlocking: scenario.storyOrLifeStartBlocking,
    hasInventoryEvidence: scenario.hasInventoryEvidence,
    isExistingAdvancedSave: scenario.isExistingAdvancedSave,
    exactFixtureOrCaptureMode: scenario.exactFixtureOrCaptureMode,
    devOverride: scenario.devOverride,
  };
  return buildOnboardingTabPolicy(input);
}

function buildWorldPolicyForScenario(scenario: ScenarioDefinition): OnboardingWorldModulePolicy {
  const unlocks = unlocksFor(scenario.activeMilestoneId);
  const input: BuildOnboardingWorldModulePolicyInput = {
    activeMilestoneId: scenario.activeMilestoneId,
    completedMilestoneIds: [],
    unlockedWorldModules: [...unlocks.worldModules],
    teaserWorldModules: [...unlocks.teaserWorldModules],
    selectedCityModuleKeys: SELECTED_CITY_MODULES,
    deferredWorldModuleKeys: ['alchemy', 'talismanStudio'],
    firstLifeOnlyComplete: scenario.firstLifeOnlyComplete,
    isExistingAdvancedSave: scenario.isExistingAdvancedSave,
    exactFixtureOrCaptureMode: scenario.exactFixtureOrCaptureMode,
    devOverride: scenario.devOverride,
  };
  return buildOnboardingWorldModulePolicy(input);
}

function buildTabEscapeChecks(
  scenario: ScenarioDefinition,
  policy: OnboardingTabPolicy,
): OnboardingRouteEscapeCheck[] {
  return ALL_TABS.map((tab) => {
    const guard = guardOnboardingTabRoute({
      policy,
      tab,
      exactFixtureOrCaptureMode: scenario.exactFixtureOrCaptureMode,
    });
    const expectedAllowed = scenario.exactFixtureOrCaptureMode === true
      || policy.visibleTabs.includes(tab)
      || policy.utilityTabs.includes(tab);
    return {
      kind: 'tab',
      key: tab,
      expectedAllowed,
      actualAllowed: guard.allowed,
      pass: guard.allowed === expectedAllowed,
      reason: guard.reason,
    };
  });
}

function buildWorldEscapeChecks(
  scenario: ScenarioDefinition,
  policy: OnboardingWorldModulePolicy,
): OnboardingRouteEscapeCheck[] {
  return LIVE_WORLD_MODULES.map((moduleKey) => {
    const guard = guardOnboardingWorldModuleRoute({
      policy,
      moduleKey,
      exactFixtureOrCaptureMode: scenario.exactFixtureOrCaptureMode,
    });
    const state = policy.moduleStates[moduleKey];
    const expectedAllowed = state === 'available'
      || (scenario.exactFixtureOrCaptureMode === true && state !== 'deferred');
    return {
      kind: 'world_module',
      key: moduleKey,
      expectedAllowed,
      actualAllowed: guard.allowed,
      pass: guard.allowed === expectedAllowed,
      reason: guard.reason,
    };
  });
}

function forbiddenCopyReason(text: string): string | null {
  const match = FORBIDDEN_PUBLIC_COPY.find((entry) => text.includes(entry));
  return match ? `forbidden public label: ${match}` : null;
}

function routeKey(target: OnboardingRouteTarget | null): string | null {
  if (!target) return null;
  if (target.kind === 'tab') return target.tab;
  if (target.kind === 'world_module') return target.moduleKey;
  if (target.kind === 'modal') return target.modalKey;
  if (target.kind === 'life_start') return 'life_start';
  return null;
}

function routeIsAllowed(
  target: OnboardingRouteTarget,
  tabPolicy: OnboardingTabPolicy,
  worldPolicy: OnboardingWorldModulePolicy,
): { pass: boolean; reason: string | null } {
  if (target.kind === 'none' || target.kind === 'life_start' || target.kind === 'modal') {
    return { pass: true, reason: null };
  }
  if (target.kind === 'tab') {
    const guard = guardOnboardingTabRoute({ policy: tabPolicy, tab: target.tab });
    return {
      pass: guard.allowed,
      reason: guard.allowed ? null : `tab route locked: ${target.tab}`,
    };
  }
  if (target.kind === 'world_module') {
    const guard = guardOnboardingWorldModuleRoute({ policy: worldPolicy, moduleKey: target.moduleKey });
    return {
      pass: guard.allowed,
      reason: guard.allowed ? null : `world module route locked: ${target.moduleKey}`,
    };
  }
  return { pass: false, reason: 'unsupported route target' };
}

function buildSourceSinkGuardChecks(
  scenario: ScenarioDefinition,
  tabPolicy: OnboardingTabPolicy,
  worldPolicy: OnboardingWorldModulePolicy,
): OnboardingSourceSinkGuardCheck[] {
  const guards = buildOnboardingSourceSinkGuards({
    activeMilestoneId: scenario.activeMilestoneId,
    currentCityId: 'city_pinewind_hamlet',
    availableWorldModules: worldPolicy.availableModules,
    teaserWorldModules: worldPolicy.teaserModules,
    currencies: { gold: 0 },
    firstManualGoldCost: 10,
    eligibleTechniqueCount: 0,
    manualStudyActive: false,
    medicineStockCount: 0,
    pouchEquippedCount: 0,
    herbStockCount: 0,
    forgeMissingMaterialIds: scenario.activeMilestoneId === 'M7_forge' ? ['material_spirit_iron'] : [],
    bestSourceByItemId: {
      material_spirit_iron: {
        label: 'Hunt Outskirts',
        moduleKey: 'outskirts',
        cityId: 'city_pinewind_hamlet',
        reason: 'Outskirts supplies common ore for the first forge floor.',
      },
    },
    lastGateDefeat: scenario.activeMilestoneId === 'M9_gate_trial'
      ? {
        timestamp: 1_800_000,
        diagnosisCode: 'healing_low',
        topFixDestination: 'apothecary',
        topFixReason: 'Stock medicine before another attempt.',
      }
      : null,
    firstLifeOnlyComplete: scenario.firstLifeOnlyComplete,
  });

  return guards.map((guard) => {
    const text = [guard.title, guard.body, guard.detail ?? ''].join(' ');
    const forbiddenReason = forbiddenCopyReason(text);
    if (forbiddenReason) {
      return {
        guardId: guard.id,
        severity: guard.severity,
        targetKind: guard.primaryRoute?.target.kind ?? 'none',
        targetKey: routeKey(guard.primaryRoute?.target ?? null),
        pass: false,
        reason: forbiddenReason,
      };
    }

    if (!guard.primaryRoute) {
      return {
        guardId: guard.id,
        severity: guard.severity,
        targetKind: 'none',
        targetKey: null,
        pass: guard.id === 'foundation_no_first_life_replay',
        reason: guard.id === 'foundation_no_first_life_replay' ? null : 'guard has no primary route',
      };
    }

    const routeCheck = routeIsAllowed(guard.primaryRoute.target, tabPolicy, worldPolicy);
    return {
      guardId: guard.id,
      severity: guard.severity,
      targetKind: guard.primaryRoute.target.kind,
      targetKey: routeKey(guard.primaryRoute.target),
      pass: routeCheck.pass,
      reason: routeCheck.reason,
    };
  });
}

function buildRow(scenario: ScenarioDefinition): OnboardingReleaseMatrixRow {
  const tabPolicy = buildTabPolicyForScenario(scenario);
  const worldPolicy = buildWorldPolicyForScenario(scenario);
  const tabEscapeChecks = buildTabEscapeChecks(scenario, tabPolicy);
  const worldModuleEscapeChecks = buildWorldEscapeChecks(scenario, worldPolicy);
  const sourceSinkGuardChecks = buildSourceSinkGuardChecks(scenario, tabPolicy, worldPolicy);
  const notes = [...tabPolicy.debugReasons, ...worldPolicy.debugReasons];
  const pass = [...tabEscapeChecks, ...worldModuleEscapeChecks, ...sourceSinkGuardChecks]
    .every((check) => check.pass);

  return {
    id: scenario.id,
    activeMilestoneId: scenario.activeMilestoneId,
    description: scenario.description,
    visibleTabs: tabPolicy.visibleTabs,
    hiddenTabs: tabPolicy.hiddenTabs,
    utilityTabs: tabPolicy.utilityTabs,
    availableWorldModules: worldPolicy.availableModules,
    teaserWorldModules: worldPolicy.teaserModules,
    hiddenWorldModules: worldPolicy.hiddenModules,
    tabEscapeChecks,
    worldModuleEscapeChecks,
    sourceSinkGuardChecks,
    pass,
    notes,
  };
}

export function buildOnboardingReleaseMatrixReport(options: { generatedAt?: string } = {}): OnboardingReleaseMatrixReport {
  const rows = SCENARIOS.map(buildRow);
  const sourceSinkRouteViolations = rows.flatMap((row) =>
    row.sourceSinkGuardChecks
      .filter((check) => !check.pass)
      .map((check) => `${row.id}:${check.guardId}:${check.reason ?? 'failed'}`),
  );
  const failedRouteChecks = rows.flatMap((row) => [...row.tabEscapeChecks, ...row.worldModuleEscapeChecks])
    .filter((check) => !check.pass);
  const blockerCount = sourceSinkRouteViolations.length + failedRouteChecks.length;

  return {
    schemaVersion: 'onboarding-release-matrix-v1',
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    overallPass: blockerCount === 0 && rows.every((row) => row.pass),
    blockerCount,
    warningCount: 0,
    rows,
    sourceSinkRouteViolations,
  };
}

export function writeOnboardingReleaseMatrixReport(
  report: OnboardingReleaseMatrixReport,
  outputPath = path.resolve(process.cwd(), 'artifacts/mp6/final/onboarding-release/onboarding-release-matrix.json'),
): string {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return outputPath;
}

function runCli(): void {
  const args = process.argv.slice(2);
  const report = buildOnboardingReleaseMatrixReport();
  if (args.includes('--write')) {
    const outputPath = writeOnboardingReleaseMatrixReport(report);
    if (!args.includes('--json')) {
      console.log(`[onboarding:release-matrix] wrote ${path.relative(process.cwd(), outputPath)}`);
      console.log(`[onboarding:release-matrix] overallPass=${report.overallPass} blockers=${report.blockerCount}`);
    }
  }
  if (args.includes('--json') || !args.includes('--write')) {
    console.log(JSON.stringify(report, null, 2));
  }
  if (!report.overallPass && args.includes('--fail-on-blockers')) {
    process.exit(2);
  }
}

if (process.argv[1]?.endsWith('buildOnboardingReleaseMatrix.ts') || process.argv[1]?.endsWith('buildOnboardingReleaseMatrix.js')) {
  runCli();
}

