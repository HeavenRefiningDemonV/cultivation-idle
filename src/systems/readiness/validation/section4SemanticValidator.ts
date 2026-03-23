import type { ValidatedContent } from '../../../content/index.js';
import { useContentStore } from '../../../stores/contentStore.js';
import type { GateBuildFloor } from '../gateBuildFloorTypes.js';
import { getAllGateBuildFloors } from '../gateBuildFloorRegistry.js';
import { diagnoseTrialFailure } from '../failureDiagnosis.js';
import type { FailureDiagnosisCode, TrialFailureDiagnosisInput } from '../failureDiagnosisTypes.js';
import type { BuildAnalysis, BuildArchetypeProfile } from '../../builds/buildAnalysisTypes.js';
import { SEMESTER_BUILD_ARCHETYPES } from '../../builds/archetypeRegistry.js';
import { buildTechniqueTaxonomyFromDefinitions, type TechniqueTaxonomyProfile } from '../../builds/techniqueTaxonomy.js';
import { SEMESTER_SLICE_CONTRACT } from '../../progression/contract/semesterSlice.js';

export type Section4SemanticIssueCategory =
  | 'MISSING_TECHNIQUE_TAXONOMY'
  | 'MISSING_GATE_BUILD_FLOOR'
  | 'UNREACHABLE_FAILURE_DIAGNOSIS'
  | 'UNBUILDABLE_ARCHETYPE';

export interface Section4SemanticIssue {
  id: string;
  category: Section4SemanticIssueCategory;
  severity: 'error' | 'warning';
  summary: string;
  evidence: Array<{ path: string; detail: string }>;
  fixStrategySummary: string;
  autoFixable: boolean;
}

export interface Section4DiagnosisFixture {
  name: string;
  expectedPrimary: FailureDiagnosisCode;
  expectedSecondary?: FailureDiagnosisCode | null;
  input: TrialFailureDiagnosisInput;
}

export interface ValidateSection4SemanticsOptions {
  content: Pick<ValidatedContent, 'techniques'> | null | undefined;
  taxonomyByTechniqueId?: Record<string, TechniqueTaxonomyProfile | null>;
  gateFloors?: readonly GateBuildFloor[];
  archetypes?: readonly BuildArchetypeProfile[];
  diagnosisFixtures?: readonly Section4DiagnosisFixture[];
}

const CATEGORY_ORDER: readonly Section4SemanticIssueCategory[] = [
  'MISSING_TECHNIQUE_TAXONOMY',
  'MISSING_GATE_BUILD_FLOOR',
  'UNREACHABLE_FAILURE_DIAGNOSIS',
  'UNBUILDABLE_ARCHETYPE',
];

function sortIssues(issues: readonly Section4SemanticIssue[]): Section4SemanticIssue[] {
  return [...issues].sort((left, right) =>
    CATEGORY_ORDER.indexOf(left.category) - CATEGORY_ORDER.indexOf(right.category)
    || left.id.localeCompare(right.id),
  );
}

function makeBuildAnalysis(): BuildAnalysis {
  return {
    loadoutId: 'loadout_1',
    archetypeId: null,
    pathAlignmentScore: 0,
    familyCoverage: {
      coreDamage: 0,
      aoe: 0,
      execute: 0,
      guard: 0,
      heal: 0,
      buff: 0,
      setup: 0,
      control: 0,
      mobility: 0,
      cleanse: 0,
      farm: 0,
    },
    supportCoverage: {
      survival: 0,
      tempo: 0,
      boss: 0,
      farm: 0,
    },
    emptyUnlockedSlots: 0,
    masteryFloorMet: true,
    rankFloorMet: true,
    runeFloorMet: true,
    equippedTechniques: [],
    gaps: [],
  };
}

function makeReadiness(input: {
  buildBand: 'below_minimum' | 'minimum_met_below_recommended' | 'recommended_met';
  forgeBand: 'below_minimum' | 'minimum_met_below_recommended' | 'recommended_met';
  economicBand: 'below_minimum' | 'minimum_met_below_recommended' | 'recommended_met';
  postureBand: 'below_minimum' | 'minimum_met_below_recommended' | 'recommended_met';
  shortfalls: TrialFailureDiagnosisInput['readiness']['shortfalls'];
}): TrialFailureDiagnosisInput['readiness'] {
  const component = (band: typeof input.buildBand, shortfalls: TrialFailureDiagnosisInput['readiness']['shortfalls']) => ({
    band,
    minimumMet: band !== 'below_minimum',
    recommendedMet: band === 'recommended_met',
    shortfalls,
  });

  return {
    trialId: 'trial_novices_clearing',
    build: component(input.buildBand, input.shortfalls.filter((shortfall) => shortfall.code.startsWith('build_'))),
    forge: component(input.forgeBand, input.shortfalls.filter((shortfall) => shortfall.code === 'forge_floor')),
    economic: {
      ...component(input.economicBand, input.shortfalls.filter((shortfall) => shortfall.code === 'economic_shortfall')),
      majorShortfallCount: input.economicBand === 'below_minimum' ? 1 : 0,
      topShortfallIds: [],
    },
    posture: {
      ...component(input.postureBand, input.shortfalls.filter((shortfall) => shortfall.code.startsWith('posture_'))),
      warnings: [],
    },
    overallBand:
      input.buildBand === 'below_minimum' || input.forgeBand === 'below_minimum' || input.economicBand === 'below_minimum' || input.postureBand === 'below_minimum'
        ? 'below_minimum'
        : input.buildBand === 'recommended_met' && input.forgeBand === 'recommended_met' && input.economicBand === 'recommended_met' && input.postureBand === 'recommended_met'
          ? 'recommended_met'
          : 'minimum_met_below_recommended',
    shortfalls: [...input.shortfalls],
    warnings: [],
  };
}

export function buildDefaultSection4DiagnosisFixtures(): Section4DiagnosisFixture[] {
  const build = makeBuildAnalysis();

  return [
    {
      name: 'underbuilt',
      expectedPrimary: 'underbuilt',
      expectedSecondary: null,
      input: {
        trialId: 'trial_novices_clearing',
        summary: {
          trialId: 'trial_novices_clearing',
          startedAt: 0,
          endedAt: 10000,
          durationSec: 10,
          bossHpPct: 60,
          maxHit: 100,
          maxHitLabel: 'Boss hit',
          suggestions: [],
        },
        readiness: makeReadiness({
          buildBand: 'below_minimum',
          forgeBand: 'recommended_met',
          economicBand: 'recommended_met',
          postureBand: 'recommended_met',
          shortfalls: [{ code: 'build_slots', severity: 'high', label: '', reason: '', currentValue: 0, minimumTarget: 1, recommendedTarget: 1 }],
        }),
        build,
        bypassAvailable: false,
      },
    },
    {
      name: 'underforged',
      expectedPrimary: 'underforged',
      expectedSecondary: null,
      input: {
        trialId: 'trial_novices_clearing',
        summary: {
          trialId: 'trial_novices_clearing',
          startedAt: 0,
          endedAt: 10000,
          durationSec: 10,
          bossHpPct: 45,
          maxHit: 100,
          maxHitLabel: 'Boss hit',
          suggestions: [],
          spikeRatio: 0.7,
        },
        readiness: makeReadiness({
          buildBand: 'recommended_met',
          forgeBand: 'below_minimum',
          economicBand: 'recommended_met',
          postureBand: 'recommended_met',
          shortfalls: [{ code: 'forge_floor', severity: 'high', label: '', reason: '', currentValue: 0, minimumTarget: 1, recommendedTarget: 1 }],
        }),
        build,
        bypassAvailable: false,
      },
    },
    {
      name: 'underprepared',
      expectedPrimary: 'underprepared',
      expectedSecondary: null,
      input: {
        trialId: 'trial_novices_clearing',
        summary: {
          trialId: 'trial_novices_clearing',
          startedAt: 0,
          endedAt: 10000,
          durationSec: 10,
          bossHpPct: 45,
          maxHit: 100,
          maxHitLabel: 'Boss hit',
          suggestions: [],
        },
        readiness: makeReadiness({
          buildBand: 'recommended_met',
          forgeBand: 'recommended_met',
          economicBand: 'below_minimum',
          postureBand: 'recommended_met',
          shortfalls: [{ code: 'economic_shortfall', severity: 'critical', label: '', reason: '', currentValue: null, minimumTarget: null, recommendedTarget: null }],
        }),
        build,
        bypassAvailable: false,
      },
    },
    {
      name: 'close',
      expectedPrimary: 'close',
      expectedSecondary: null,
      input: {
        trialId: 'trial_novices_clearing',
        summary: {
          trialId: 'trial_novices_clearing',
          startedAt: 0,
          endedAt: 12000,
          durationSec: 12,
          bossHpPct: 20,
          maxHit: 100,
          maxHitLabel: 'Boss hit',
          suggestions: [],
        },
        readiness: makeReadiness({
          buildBand: 'recommended_met',
          forgeBand: 'recommended_met',
          economicBand: 'recommended_met',
          postureBand: 'recommended_met',
          shortfalls: [],
        }),
        build,
        bypassAvailable: false,
      },
    },
    {
      name: 'undercultivated',
      expectedPrimary: 'undercultivated',
      expectedSecondary: null,
      input: {
        trialId: 'trial_novices_clearing',
        summary: {
          trialId: 'trial_novices_clearing',
          startedAt: 0,
          endedAt: 10000,
          durationSec: 10,
          bossHpPct: 50,
          maxHit: 100,
          maxHitLabel: 'Boss hit',
          suggestions: [],
          timeToDieSec: 6,
        },
        readiness: makeReadiness({
          buildBand: 'recommended_met',
          forgeBand: 'recommended_met',
          economicBand: 'recommended_met',
          postureBand: 'recommended_met',
          shortfalls: [],
        }),
        build,
        bypassAvailable: false,
      },
    },
    {
      name: 'bypass_secondary',
      expectedPrimary: 'close',
      expectedSecondary: 'bypassAvailable',
      input: {
        trialId: 'trial_novices_clearing',
        summary: {
          trialId: 'trial_novices_clearing',
          startedAt: 0,
          endedAt: 12000,
          durationSec: 12,
          bossHpPct: 20,
          maxHit: 100,
          maxHitLabel: 'Boss hit',
          suggestions: [],
        },
        readiness: makeReadiness({
          buildBand: 'recommended_met',
          forgeBand: 'recommended_met',
          economicBand: 'recommended_met',
          postureBand: 'recommended_met',
          shortfalls: [],
        }),
        build,
        bypassAvailable: true,
      },
    },
  ];
}

export function validateSection4Semantics(
  options: ValidateSection4SemanticsOptions,
): Section4SemanticIssue[] {
  const issues: Section4SemanticIssue[] = [];
  const techniques = options.content?.techniques ?? [];
  const taxonomyByTechniqueId = options.taxonomyByTechniqueId
    ?? buildTechniqueTaxonomyFromDefinitions(techniques);
  const gateFloors = options.gateFloors ?? getAllGateBuildFloors();
  const archetypes = options.archetypes ?? SEMESTER_BUILD_ARCHETYPES;
  const diagnosisFixtures = options.diagnosisFixtures ?? buildDefaultSection4DiagnosisFixtures();

  techniques.forEach((technique) => {
    const profile = taxonomyByTechniqueId[technique.id] ?? null;
    const validAlignment = profile !== null && ['strong', 'neutral', 'off'].includes(profile.alignment);
    if (profile && profile.families.length > 0 && validAlignment) return;

    issues.push({
      id: `tech-taxonomy-${technique.id}`,
      category: 'MISSING_TECHNIQUE_TAXONOMY',
      severity: 'error',
      summary: `Technique ${technique.id} is missing Section 4 taxonomy or family metadata.`,
      evidence: [{ path: `content/techniques/${technique.id}`, detail: 'taxonomy profile missing or empty.' }],
      fixStrategySummary: 'Ensure every live technique resolves through packet 4.6 taxonomy with at least one family and a native alignment.',
      autoFixable: true,
    });
  });

  const gateFloorsByTrialId = new Set(gateFloors.map((floor) => floor.trialId));
  SEMESTER_SLICE_CONTRACT.liveTrialIds.forEach((trialId) => {
    if (gateFloorsByTrialId.has(trialId)) return;
    issues.push({
      id: `gate-floor-${trialId}`,
      category: 'MISSING_GATE_BUILD_FLOOR',
      severity: 'error',
      summary: `Trial ${trialId} is missing a Section 4 gate build floor.`,
      evidence: [{ path: `readiness/gateFloors/${trialId}`, detail: 'no gate-build-floor entry found.' }],
      fixStrategySummary: 'Ensure every live semester trial has one packet-4.12 build-floor record.',
      autoFixable: true,
    });
  });

  diagnosisFixtures.forEach((fixture) => {
    const actual = diagnoseTrialFailure(fixture.input);
    const expectedSecondary = fixture.expectedSecondary ?? null;
    if (actual.primary === fixture.expectedPrimary && actual.secondary === expectedSecondary) return;
    issues.push({
      id: `failure-diagnosis-${fixture.name}`,
      category: 'UNREACHABLE_FAILURE_DIAGNOSIS',
      severity: 'error',
      summary: `Synthetic failure case ${fixture.name} no longer resolves to the expected diagnosis.`,
      evidence: [{
        path: `diagnosis/${fixture.name}`,
        detail: `expected ${fixture.expectedPrimary}/${String(expectedSecondary)}, got ${actual.primary}/${String(actual.secondary)}`,
      }],
      fixStrategySummary: 'Keep packet-4.14 failure-diagnosis routing stable so every locked failure shape resolves predictably.',
      autoFixable: true,
    });
  });

  archetypes.forEach((archetype) => {
    const profiles = techniques
      .map((technique) => taxonomyByTechniqueId[technique.id] ?? null)
      .filter((profile): profile is TechniqueTaxonomyProfile => profile !== null && profile.path === archetype.path && profile.alignment !== 'off');

    const missingPrimaryFamilies = archetype.primaryFamilies.filter(
      (family) => !profiles.some((profile) => profile.families.includes(family)),
    );
    const missingSupportFlags = archetype.preferredSupportFlags.filter(
      (flag) => !profiles.some((profile) => profile.supportFlags.includes(flag)),
    );
    const missingTokens = [...missingPrimaryFamilies, ...missingSupportFlags];
    if (missingTokens.length === 0) return;

    issues.push({
      id: `archetype-buildability-${archetype.id}`,
      category: 'UNBUILDABLE_ARCHETYPE',
      severity: 'error',
      summary: `Archetype ${archetype.id} is not buildable from the live technique pool.`,
      evidence: [{ path: `archetypes/${archetype.id}`, detail: `missing coverage for: ${missingTokens.join(', ')}` }],
      fixStrategySummary: 'Keep packet-4.11 archetypes anchored to the actual live technique pool and packet-4.6 taxonomy coverage.',
      autoFixable: false,
    });
  });

  return sortIssues(issues);
}

export function validateLiveSection4Semantics(): Section4SemanticIssue[] {
  const content = useContentStore.getState().raw;
  if (!content) {
    return [{
      id: 'section4-live-content-missing',
      category: 'MISSING_TECHNIQUE_TAXONOMY',
      severity: 'error',
      summary: 'Validated technique content is not loaded, so Section 4 semantics cannot be checked.',
      evidence: [{ path: 'content', detail: 'Validated content missing.' }],
      fixStrategySummary: 'Load validated content before running the Section 4 semantic validator.',
      autoFixable: false,
    }];
  }

  return validateSection4Semantics({ content: { techniques: content.techniques } });
}
