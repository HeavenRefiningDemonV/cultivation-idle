import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { buildCultivationExactSurfaceFromSnapshots } from '../../src/features/cultivation/exact/buildCultivationExactSurface.js';
import type { CultivationExactBuildSnapshot } from '../../src/features/cultivation/exact/cultivationExactTypes.js';

function readSource(path: string): string {
  return readFileSync(path, 'utf8');
}

const screenSource = readSource('src/features/cultivation/exact/CultivationExactScreen.tsx');
const builderSource = readSource('src/features/cultivation/exact/buildCultivationExactSurface.ts');
const typesSource = readSource('src/features/cultivation/exact/cultivationExactTypes.ts');
const controllerSource = readSource('src/features/cultivation/exact/useCultivationExactActionController.ts');
const defaultViewSource = screenSource.split('function CultivationExactDrawerLayer')[0] ?? screenSource;

const forbiddenDefaultCopy = [
  'Open Apothecary',
  'Open Forge',
  'Tune Techniques',
  'Raise Forge Floor',
  'Restock Apothecary',
  'Brew Medicine',
  'Cultivate Qi',
  'Mandate points elsewhere',
  'Primary Route',
  'Best Next Action',
  'Biggest Shortfall',
];

const baseSnapshot = {
  realm: { index: 0, substage: 7, name: 'Qi Condensation' },
  realmName: 'Qi Condensation',
  realmSubstages: 9,
  nextRealmName: 'Foundation Establishment',
  qi: '5500000',
  breakthroughRequirement: '24400000',
  qiPerSecond: '265.682',
  breathQiRateMultiplier: 1.1,
  breathModeLabel: 'Balanced',
  focusModeLabel: 'Balanced',
  activeActivityType: 'meditate',
  activeActivityLabel: 'Cultivating',
  stability: 100,
  stabilityCap: 100,
  selectedPathLabel: 'Heaven',
  selectedPathSummary: 'Heaven path doctrine.',
  spiritRootLabel: 'Fire / Rare',
  spiritRootDetail: 'Refined foundation',
  spiritRootElement: 'fire',
  heartLawName: 'Ember Thread Sutra',
  heartLawDetail: 'Fire sutra',
  heartLawTags: ['fire'],
  chapter: 1,
  comprehension: 2,
  comprehensionRequirement: 10,
  resonanceLine: 'Resonant',
  resonanceDetail: 'Aligned.',
  requiredGateItemId: null,
  requiredGateItemName: null,
  requiredGateItemCount: 0,
  atContentCap: false,
  canPrestige: false,
  activeBuffSummary: 'No active cultivation tonics.',
  runCompassActions: [],
} satisfies CultivationExactBuildSnapshot;

function buildSurface(overrides: Partial<CultivationExactBuildSnapshot> = {}) {
  return buildCultivationExactSurfaceFromSnapshots({
    ...baseSnapshot,
    ...overrides,
  }) as any;
}

test('V2-6 Cultivation exposes a compact Omen Projection surface instead of raw public Mandate truth', () => {
  assert.match(typesSource, /CultivationCompactOmenSurfaceV1/);
  assert.match(typesSource, /compactOmen/);
  assert.match(typesSource, /DaoOmenProjectionV1/);
  assert.doesNotMatch(typesSource, /interface\s+CultivationMandateLensSurface[\s\S]*surface:\s*DaoMandateSurfaceV1/);
  assert.doesNotMatch(typesSource, /mandateLens:\s*CultivationMandateLensSurface/);

  assert.match(builderSource, /buildDaoOmenProjectionV1/);
  assert.match(builderSource, /currentScreen:\s*'cultivation'/);
  assert.doesNotMatch(builderSource, /applyDaoMandateVisibility\(raw/);
});

test('V2-6 Cultivation default view renders compact OmenSeal and ProofSealRow only', () => {
  assert.match(screenSource, /OmenSeal/);
  assert.match(screenSource, /ProofSealRow/);
  assert.match(screenSource, /data-region="cultivation-compact-omen"/);
  assert.match(screenSource, /testId="cultivation-compact-omen-seal"/);
  assert.match(screenSource, /testId="cultivation-threshold-proof-seals"/);

  for (const forbidden of [
    '<MandateSeal',
    '<RequirementLedger',
    '<ReadinessLedger',
    '<SourceRouteSlip',
    'data-region="dao-mandate-threshold-lens"',
    'Threshold Mandate',
    'Breakthrough Proof',
  ]) {
    assert.equal(defaultViewSource.includes(forbidden), false, `default Cultivation must not render ${forbidden}`);
  }
});

test('V2-6 compact Omen source keeps proof seals bounded and threshold-relevant', () => {
  const surface = buildSurface();
  assert.equal(surface.compactOmen?.regionLabel, 'Threshold Omen');
  assert.equal(surface.compactOmen?.defaultCopyPolicy, 'symptom_proof_first');
  assert.ok((surface.compactOmen?.proofSeals.length ?? 0) >= 2);
  assert.ok((surface.compactOmen?.proofSeals.length ?? 0) <= 3);

  const proofKinds = surface.compactOmen?.proofSeals.map((seal: any) => seal.kind) ?? [];
  assert.ok(proofKinds.includes('qi_threshold'));
  assert.ok(proofKinds.includes('realm_edge') || proofKinds.includes('gate_proof'));
  assert.equal(proofKinds.some((kind: string) => ['survival_reserve', 'forge_floor', 'doctrine_expression', 'support_reserve', 'source_thread'].includes(kind)), false);
  assert.equal(surface.compactOmen?.sourceThreadsOpenByDefault, false);
});

test('V2-6 direct route policy is explicit for threshold, gate proof, breakthrough, and content cap states', () => {
  const qiShort = buildSurface({
    qi: '1200',
    breakthroughRequirement: '10000',
    activeActivityType: null,
    activeActivityLabel: 'Idle',
  });
  assert.equal(qiShort.compactOmen?.currentOmen.kind, 'threshold_unreached');
  assert.equal(qiShort.compactOmen?.currentOmen.allowDirectRoute, false);
  assert.equal(qiShort.compactOmen?.allowedDirectRoute, null);

  const gateBlocked = buildSurface({
    realm: { index: 0, substage: 9, name: 'Qi Condensation' },
    requiredGateItemId: 'token_gate',
    requiredGateItemName: 'Gate Proof',
    requiredGateItemCount: 0,
    qi: '30000000',
    breakthroughRequirement: '24400000',
    runCompassActions: [{
      id: 'gate',
      label: 'Challenge the Gate Trial',
      why: 'Gate proof is missing.',
      destinationLabel: 'Gate Trial',
      blocked: false,
      blockedReason: null,
      target: { kind: 'world_module', cityId: 'city_pinewind_hamlet', moduleKey: 'gateTrial' },
    }],
  });
  assert.equal(gateBlocked.meta.activityState, 'gate_blocked');
  assert.equal(gateBlocked.compactOmen?.currentOmen.kind, 'proof_missing');
  assert.equal(gateBlocked.compactOmen?.allowedDirectRoute?.target?.kind, 'world_module');

  const ready = buildSurface({
    qi: '30000000',
    breakthroughRequirement: '24400000',
  });
  assert.equal(ready.meta.activityState, 'breakthrough_ready');
  assert.equal(ready.commandDeck.primary.label, 'Break Through');
  assert.equal(ready.compactOmen?.currentOmen.kind, 'breakthrough_ready');

  const contentCap = buildSurface({ atContentCap: true, canPrestige: true });
  assert.equal(contentCap.meta.activityState, 'content_cap');
  assert.equal(contentCap.commandDeck.primary.actionKey, 'openPrestige');
  assert.equal(contentCap.compactOmen?.currentOmen.kind, 'content_cap');
});

test('V2-6 Cultivation Omen copy and controller do not reintroduce route-led defaults', () => {
  for (const forbidden of forbiddenDefaultCopy) {
    assert.equal(defaultViewSource.includes(forbidden), false, `default Omen copy must not include ${forbidden}`);
  }

  assert.match(controllerSource, /collectCommandOmenRoutes/);
  assert.match(controllerSource, /compactOmen\?\.projection/);
  assert.match(controllerSource, /allowDirectRoute/);
  assert.doesNotMatch(controllerSource, /surface\.mandateLens\?\.surface/);
  assert.doesNotMatch(controllerSource, /requirementLedger\.(hardGates|readinessFloors|supportReserves|sourceRoutes)/);
});
