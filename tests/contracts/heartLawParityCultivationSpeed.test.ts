import assert from 'node:assert/strict';
import test from 'node:test';

import type { StatusDashboardSurfaceV1 } from '../../src/systems/ui/status/statusDashboardSurface.js';
import { buildStatusLedgerSurfaceFromDashboard } from '../../src/systems/ui/status/statusLedgerSurface.js';
import {
  resolveCultivationMindAlignment,
  type CultivationMindAlignmentSnapshot,
} from '../../src/systems/cultivation/cultivationMindAlignmentResolver.js';
import { resolveHeartLawParityPreview } from '../../src/systems/daoHeart/heartLawParityResolver.js';
import { resolveBreakthroughStabilitySnapshot } from '../../src/systems/breakthrough/breakthroughStabilityResolver.js';
import { buildCultivationExactSurfaceFromSnapshots } from '../../src/features/cultivation/exact/buildCultivationExactSurface.js';
import type { CultivationExactBuildSnapshot } from '../../src/features/cultivation/exact/cultivationExactTypes.js';
import { buildDaoHeartSanctuarySurface } from '../../src/features/daoHeartSanctuary/buildDaoHeartSanctuarySurface.js';

function createMindAlignment(delta: number): CultivationMindAlignmentSnapshot {
  return resolveCultivationMindAlignment({
    cultivationStageIndex: 20,
    heartLawLevel: 20 + delta,
    clarity: 60,
    turbulence: 10,
  });
}

test('MP3 keeps the legacy Heart Law parity preview synced to the mind alignment resolver', () => {
  for (const delta of [2, 1, 0, -1, -2, -3, -4] as const) {
    const mindAlignment = createMindAlignment(delta);
    const preview = resolveHeartLawParityPreview({
      heartLawStage: mindAlignment.heartLawLevel,
      cultivationEffectiveStage: mindAlignment.cultivationStageIndex,
    });

    assert.equal(preview.parity, mindAlignment.parityDelta);
    assert.equal(preview.riskDelta, mindAlignment.breakthroughRiskDelta);
    assert.equal(preview.confirmationRequired, mindAlignment.confirmationRequired);
    assert.equal(preview.innerDemonDebateAvailable, mindAlignment.innerDemonDebateAvailable);
    assert.equal(preview.label, mindAlignment.causeRows[0]?.explanation);
  }
});

test('MP3 breakthrough risk rows consume the same mind alignment snapshot used by Qi/sec', () => {
  const mindAlignment = createMindAlignment(-2);
  const snapshot = resolveBreakthroughStabilitySnapshot({
    fromRealmIndex: 0,
    toRealmIndex: 1,
    currentQi: 120_000,
    requiredQi: 100_000,
    heartLawStage: 99,
    cultivationEffectiveStage: 1,
    clarity: 60,
    turbulence: 10,
    gateResolution: 'cleared',
    rootResonance: 'neutral',
    recklessConfirmation: false,
    mindAlignment,
  });

  const parityRow = snapshot.rows.find((row) => row.id === 'heart_law_parity');
  assert.ok(parityRow);
  assert.equal(parityRow.value, mindAlignment.breakthroughRiskDelta);
  assert.equal(parityRow.explanation, mindAlignment.causeRows[0]?.explanation);
  assert.equal(parityRow.route?.target, 'daoHeart');
});

function createCultivationSnapshot(mindAlignment: CultivationMindAlignmentSnapshot): CultivationExactBuildSnapshot {
  return {
    realm: { index: 0, substage: 9, name: 'Qi Condensation' },
    realmName: 'Qi Condensation',
    realmSubstages: 9,
    nextRealmName: 'Foundation Establishment',
    qi: '120000',
    breakthroughRequirement: '100000',
    qiPerSecond: '100',
    breathQiRateMultiplier: 1,
    breathModeLabel: 'Balanced',
    focusModeLabel: 'Balanced',
    activeActivityType: null,
    activeActivityLabel: 'Idle',
    stability: 100,
    stabilityCap: 100,
    selectedPathLabel: 'Heaven',
    selectedPathSummary: 'Heaven path doctrine.',
    spiritRootLabel: 'Fire / Rare',
    spiritRootDetail: '100% purity',
    spiritRootElement: 'fire',
    heartLawName: 'Quiet Breath Method',
    heartLawDetail: 'Quiet Breath Method',
    heartLawTags: ['breath'],
    chapter: 1,
    comprehension: 0,
    comprehensionRequirement: 10,
    resonanceLine: 'Neutral',
    resonanceDetail: 'No resonance pressure.',
    requiredGateItemId: null,
    requiredGateItemName: null,
    requiredGateItemCount: 0,
    atContentCap: false,
    canPrestige: false,
    activeBuffSummary: 'No active cultivation tonics.',
    runCompassActions: [],
    runCompassFull: null,
    runCompassCompact: null,
    mindAlignment,
    breakthroughRisk: resolveBreakthroughStabilitySnapshot({
      fromRealmIndex: 0,
      toRealmIndex: 1,
      currentQi: 120_000,
      requiredQi: 100_000,
      heartLawStage: mindAlignment.heartLawLevel,
      cultivationEffectiveStage: mindAlignment.cultivationStageIndex,
      clarity: 60,
      turbulence: 10,
      gateResolution: 'cleared',
      rootResonance: 'neutral',
      recklessConfirmation: false,
      mindAlignment,
    }),
  };
}

function createStatusDashboard(): Omit<StatusDashboardSurfaceV1, 'statusLedger'> {
  return {
    meta: { rootTestId: 'status-dashboard', mode: 'live', contentLoaded: true, generatedAt: 1, debugNotes: [] },
    mandate: {} as Omit<StatusDashboardSurfaceV1, 'statusLedger'>['mandate'],
    statusV2: {} as Omit<StatusDashboardSurfaceV1, 'statusLedger'>['statusV2'],
    hero: {
      realmName: 'Qi Condensation',
      stageText: 'Stage IX',
      pathLabel: 'Heaven',
      heartLawLabel: 'Quiet Breath Method',
      spiritRootLabel: 'Fire - Rare',
      archetypeLabel: 'Heaven',
      nextMajorGoalLabel: 'Foundation breakthrough',
      nextMajorGoalDetail: 'Fill Qi and align the Heart Law.',
      biggestShortfallLabel: 'Mind alignment',
      primaryAction: null,
    },
    metrics: [],
    milestone: {
      title: 'Foundation breakthrough',
      detail: 'Fill Qi and align the Heart Law.',
      readinessLabel: 'Ready',
      tone: 'success',
      nodes: [],
    },
    currentWork: {
      foregroundActivity: {
        label: 'No foreground activity',
        detail: 'No foreground activity is running.',
        tone: 'muted',
        icon: 'hourglassEmpty',
        target: null,
      },
      activeCombat: null,
      trackedBounty: null,
      expeditions: null,
      queues: [],
    },
    readiness: {
      title: 'Gate Readiness',
      stateLabel: 'Ready',
      diagnosisLabel: 'Stable',
      postureLabel: 'Stable',
      rows: [],
    },
    requirements: { title: 'Mission Requirements', rows: [], emptyState: null },
    bestNextActions: [],
    safetyNet: {
      title: 'Safety Net',
      stateLabel: 'Available',
      progressLabel: 'Ready',
      rows: [],
      action: null,
    },
    runCompass: {
      milestoneLabel: 'Foundation breakthrough',
      primaryBlockerLabel: 'Mind alignment',
      primaryRouteLabel: 'Dao Heart',
      recentDeltas: [],
    },
    identity: {
      rows: [
        { id: 'path', label: 'Path', value: 'Heaven', detail: 'Selected cultivation path.', tone: 'info', icon: 'bookHeaven', source: 'test' },
        { id: 'heart-law', label: 'Heart Law', value: 'Quiet Breath Method', detail: 'Chapter 1', tone: 'info', icon: 'bookMartial', source: 'test' },
        { id: 'resonance', label: 'Resonance', value: 'Neutral', detail: 'No resonance pressure.', tone: 'muted', icon: 'inkSwirl', source: 'test' },
        { id: 'focus', label: 'Focus', value: 'Balanced', detail: 'Current focus posture.', tone: 'muted', icon: 'inkBolt', source: 'test' },
        { id: 'breath', label: 'Breath', value: 'Balanced', detail: 'Current breath posture.', tone: 'muted', icon: 'inkHeart', source: 'test' },
      ],
      spiritRootElement: 'fire',
      spiritRootTone: 'fire',
      spiritRootGrade: 'Rare',
      spiritRootPurityLabel: '100%',
      spiritRootTotalMultiplierLabel: '1.00x',
    },
    preparation: { rows: [], buildRows: [] },
  };
}

test('MP3 Cultivation and Status surfaces share the same mind alignment cause-row text', () => {
  const mindAlignment = createMindAlignment(-2);
  const cultivation = buildCultivationExactSurfaceFromSnapshots(createCultivationSnapshot(mindAlignment));
  const status = buildStatusLedgerSurfaceFromDashboard(createStatusDashboard(), {
    generatedAt: 1,
    contentLoaded: true,
    cityLabel: 'Pinewind Hamlet',
    currentCityId: 'city_pinewind_hamlet',
    debugNotes: [],
    game: {
      qi: '120000',
      qiPerSecond: '100',
      focusMode: 'balanced',
      realmIndex: 0,
      substage: 9,
      stats: { hp: '100', atk: '10', def: '10', crit: '0' },
      breakthroughRequirementLabel: '100000',
    },
    cultivation: {
      stability: 100,
      stabilityCap: 100,
      chapter: 1,
      breathMode: 'balanced',
      daoHeartClarity: 80,
      turbulence: 0,
    },
    mindAlignment,
  });

  const cultivationRow = cultivation.breakthroughReadiness.rows.find((row) => row.id === 'mind-alignment');
  const statusRow = status.cultivationBase.rows.find((row) => row.id === 'cultivation-mind-alignment');

  assert.equal(cultivationRow?.value, mindAlignment.summaryText);
  assert.equal(statusRow?.value, mindAlignment.summaryText);
});

test('MP3 Dao Heart Sanctuary exposes speed/risk recommendations and disables Inner Demon Debate at severe lag', () => {
  const practices = [
    { id: 'verse_recitation', displayName: 'Verse Recitation', description: 'Practice the verse.', offlineAllowed: true },
    { id: 'silent_sitting', displayName: 'Silent Sitting', description: 'Calm turbulence.', offlineAllowed: true },
    { id: 'inner_demon_debate', displayName: 'Inner Demon Debate', description: 'Debate inner demons.', offlineAllowed: false },
  ] as never;

  const lagging = buildDaoHeartSanctuarySurface({
    selectedHeartLawId: 'heart_quiet_breath_method',
    heartLaw: null,
    practices,
    levelById: { heart_quiet_breath_method: 18 },
    xpById: { heart_quiet_breath_method: 0 },
    verseMasteryByLawId: {},
    clarity: 60,
    turbulence: 10,
    activePracticeId: null,
    cultivationEffectiveStage: 20,
  });

  const severe = buildDaoHeartSanctuarySurface({
    selectedHeartLawId: 'heart_quiet_breath_method',
    heartLaw: null,
    practices,
    levelById: { heart_quiet_breath_method: 17 },
    xpById: { heart_quiet_breath_method: 0 },
    verseMasteryByLawId: {},
    clarity: 60,
    turbulence: 10,
    activePracticeId: null,
    cultivationEffectiveStage: 20,
  });

  const alignmentMetric = lagging.metrics.find((metric) => metric.id === 'mind_alignment');
  const recommendation = lagging.recommendations.find((row) => row.id === 'mind-alignment-fix');
  const innerDemon = severe.practices.find((practice) => practice.id === 'inner_demon_debate');

  assert.equal(alignmentMetric?.detail, createMindAlignment(-2).summaryText);
  assert.equal(recommendation?.targetPracticeId, 'verse_recitation');
  assert.equal(innerDemon?.disabled, true);
  assert.match(innerDemon?.disabledReason ?? '', /Inner Demon Debate unavailable/i);
});
