import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { buildCultivationExactSurfaceFromSnapshots } from '../../src/features/cultivation/exact/buildCultivationExactSurface.js';
import type { CultivationExactBuildSnapshot } from '../../src/features/cultivation/exact/cultivationExactTypes.js';

function readSource(path: string): string {
  return readFileSync(path, 'utf8');
}

const cultivationScreenSource = readSource('src/features/cultivation/exact/CultivationExactScreen.tsx');
const cultivationSurfaceSource = readSource('src/features/cultivation/exact/buildCultivationExactSurface.ts');
const cultivationTypesSource = readSource('src/features/cultivation/exact/cultivationExactTypes.ts');
const cultivationControllerSource = readSource('src/features/cultivation/exact/useCultivationExactActionController.ts');
const defaultViewSource = cultivationScreenSource.split('function CultivationExactDrawerLayer')[0] ?? cultivationScreenSource;

const baseSnapshot = {
  realm: { index: 0, substage: 4, name: 'Qi Condensation' },
  realmName: 'Qi Condensation',
  realmSubstages: 9,
  nextRealmName: 'Foundation Establishment',
  qi: '25000',
  breakthroughRequirement: '10000',
  qiPerSecond: '125',
  breathQiRateMultiplier: 1,
  breathModeLabel: 'Balanced',
  focusModeLabel: 'Balanced',
  activeActivityType: null,
  activeActivityLabel: 'Idle',
  stability: 100,
  stabilityCap: 100,
  selectedPathLabel: 'Heaven',
  selectedPathSummary: 'Heaven path doctrine.',
  spiritRootLabel: 'Earth / Mortal',
  spiritRootDetail: 'Mortal root.',
  spiritRootElement: 'earth',
  heartLawName: 'Ember Thread Sutra',
  heartLawDetail: 'A starter heart law.',
  heartLawTags: ['fire'],
  chapter: 1,
  comprehension: 0,
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

test('V2-6 Cultivation retires the default raw Mandate lens without becoming public Run Compass', () => {
  assert.match(cultivationScreenSource, /OmenSeal/);
  assert.match(cultivationScreenSource, /ProofSealRow/);
  assert.match(cultivationScreenSource, /data-region="cultivation-compact-omen"/);
  assert.match(cultivationScreenSource, /Threshold Omen/);

  for (const forbidden of [
    '<MandateSeal',
    '<RequirementLedger',
    '<SourceRouteSlip',
    'data-region="dao-mandate-threshold-lens"',
    'Threshold Mandate',
    'Breakthrough Proof',
    'aria-label="Run Compass"',
    'data-region="run-compass-v2"',
    '<RunCompass',
    'MandateChamberHero',
  ]) {
    assert.equal(defaultViewSource.includes(forbidden), false, `default Cultivation must not render ${forbidden}`);
  }
});

test('V2-6 Cultivation surface exposes compact Omen projection, not visible raw Mandate profile density', () => {
  assert.match(cultivationTypesSource, /compactOmen/);
  assert.match(cultivationTypesSource, /CultivationCompactOmenSurfaceV1/);
  assert.match(cultivationTypesSource, /DaoOmenProjectionV1/);
  assert.doesNotMatch(cultivationTypesSource, /profile:\s*DaoMandateGuidanceProfile/);
  assert.doesNotMatch(cultivationTypesSource, /mandateLens:\s*CultivationMandateLensSurface/);

  assert.match(cultivationSurfaceSource, /buildDaoOmenProjectionV1/);
  assert.match(cultivationSurfaceSource, /buildCultivationCompactOmenSurface/);
  assert.match(cultivationSurfaceSource, /pickCultivationThresholdProofSeals/);
  assert.match(cultivationSurfaceSource, /Qi Threshold|qi_threshold/);
  assert.match(cultivationSurfaceSource, /Realm Edge|realm_edge/);
  assert.match(cultivationSurfaceSource, /Gate Proof|gate_proof/);
});

test('V2-6 normal substage proof uses compact threshold seals and keeps Break Through sacred', () => {
  const surface = buildSurface();
  const proofKinds = surface.compactOmen?.proofSeals.map((seal: any) => seal.kind) ?? [];

  assert.equal(surface.meta.activityState, 'breakthrough_ready');
  assert.equal(surface.commandDeck.primary.actionKey, 'breakThrough');
  assert.equal(surface.commandDeck.primary.label, 'Break Through');
  assert.equal(surface.compactOmen?.currentOmen.kind, 'breakthrough_ready');
  assert.equal(surface.compactOmen?.proofSeals.length, 3);
  assert.deepEqual(proofKinds, ['realm_edge', 'qi_threshold', 'gate_proof']);
});

test('V2-6 major realm transition keeps Gate Proof compact and legal Gate Trial handoff only', () => {
  const surface = buildCultivationExactSurfaceFromSnapshots({
    ...baseSnapshot,
    realm: { index: 0, substage: 9, name: 'Qi Condensation' },
    requiredGateItemId: 'gate_foundation_pill',
    requiredGateItemName: 'Foundation Pill',
    requiredGateItemCount: 0,
    runCompassActions: [{
      id: 'gate',
      label: 'Challenge the Gate Trial',
      why: 'Gate proof is missing.',
      destinationLabel: 'Gate Trial',
      blocked: false,
      blockedReason: null,
      target: { kind: 'world_module', cityId: 'city_pinewind_hamlet', moduleKey: 'gateTrial' },
    }],
  }) as any;
  const gateProofSeal = surface.compactOmen?.proofSeals.find((seal: any) => seal.kind === 'gate_proof');

  assert.equal(surface.meta.activityState, 'gate_blocked');
  assert.equal(surface.compactOmen?.currentOmen.kind, 'proof_missing');
  assert.equal(gateProofSeal?.state, 'unsealed');
  assert.equal(surface.compactOmen?.allowedDirectRoute?.target?.kind, 'world_module');
  assert.equal(
    surface.compactOmen?.allowedDirectRoute?.target?.kind === 'world_module'
      ? surface.compactOmen.allowedDirectRoute.target.moduleKey
      : null,
    'gateTrial',
  );
});

test('V2-6 Cultivation command routing uses allowed Omen Projection routes before Run Compass fallback', () => {
  assert.match(cultivationControllerSource, /findCommandOmenRoute/);
  assert.match(cultivationControllerSource, /performMandateRouteIfAvailable/);
  assert.doesNotMatch(cultivationControllerSource, /mandate\.primaryRoute/);
  assert.doesNotMatch(cultivationControllerSource, /mandate\.secondaryRoutes/);
  assert.doesNotMatch(cultivationControllerSource, /backgroundPlan\.routes/);
  assert.doesNotMatch(cultivationControllerSource, /requirementLedger\.(hardGates|readinessFloors|supportReserves|sourceRoutes)/);

  const gateHandler = cultivationControllerSource.match(/const openGateTrial[\s\S]*?\n  \}, \[/)?.[0] ?? '';
  assert.ok(gateHandler.includes('performMandateRouteIfAvailable'));
  assert.ok(gateHandler.includes('performActionIfAvailable'));
  assert.ok(
    gateHandler.indexOf('performMandateRouteIfAvailable') < gateHandler.indexOf('performActionIfAvailable'),
    'Gate command should try allowed Omen route before Run Compass fallback.',
  );

  const prestigeHandler = cultivationControllerSource.match(/const openPrestige[\s\S]*?\n  \}, \[/)?.[0] ?? '';
  assert.ok(prestigeHandler.includes('performMandateRouteIfAvailable'));
  assert.ok(prestigeHandler.includes('performActionIfAvailable'));
  assert.ok(
    prestigeHandler.indexOf('performMandateRouteIfAvailable') < prestigeHandler.indexOf('performActionIfAvailable'),
    'Prestige command should try allowed Omen route before Run Compass fallback.',
  );
});
