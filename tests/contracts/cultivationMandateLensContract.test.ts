import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { buildCultivationExactSurfaceFromSnapshots } from '../../src/features/cultivation/exact/buildCultivationExactSurface.js';
import type {
  CultivationExactBuildSnapshot,
  CultivationMandateLensSurface,
} from '../../src/features/cultivation/exact/cultivationExactTypes.js';
import { createDaoMandateFixture } from '../../src/systems/ui/daoMandate/daoMandateFixtures.js';
import type { DaoMandateRoute } from '../../src/systems/ui/daoMandate/index.js';

function readSource(path: string): string {
  return readFileSync(path, 'utf8');
}

const cultivationScreenSource = readSource('src/features/cultivation/exact/CultivationExactScreen.tsx');
const cultivationSurfaceSource = readSource('src/features/cultivation/exact/buildCultivationExactSurface.ts');
const cultivationTypesSource = readSource('src/features/cultivation/exact/cultivationExactTypes.ts');
const cultivationOwnerSource = readSource('src/features/cultivation/exact/CultivationExactScreenOwner.tsx');
const cultivationControllerSource = readSource('src/features/cultivation/exact/useCultivationExactActionController.ts');

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
  });
}

function makeMandateLensWithRoute(route: DaoMandateRoute): CultivationMandateLensSurface {
  const surface = createDaoMandateFixture('attemptable_gate', 'elder');
  return {
    surface: {
      ...surface,
      primaryRoute: route,
      secondaryRoutes: [route],
    },
    profile: 'elder',
    motionMode: 'medium',
    regionLabel: 'Threshold Mandate',
  };
}

test('P4 Cultivation renders a compact Dao Mandate threshold lens instead of public Run Compass', () => {
  assert.match(cultivationScreenSource, /MandateSeal/);
  assert.match(cultivationScreenSource, /data-region="dao-mandate-threshold-lens"/);
  assert.match(cultivationScreenSource, /Threshold Mandate/);
  assert.match(cultivationScreenSource, /Breakthrough Proof/);
  assert.match(cultivationScreenSource, /RequirementLedger/);

  assert.doesNotMatch(cultivationScreenSource, /aria-label="Run Compass"/);
  assert.doesNotMatch(cultivationScreenSource, /data-region="run-compass-v2"/);
  assert.doesNotMatch(cultivationScreenSource, /from ['"][^'"]*RunCompass/);
  assert.doesNotMatch(cultivationScreenSource, /<RunCompass/);
  assert.doesNotMatch(cultivationScreenSource, /MandateChamberHero/);
});

test('P4 Cultivation surface exposes Mandate lens and breakthrough proof ledger from Dao Mandate truth', () => {
  assert.match(cultivationTypesSource, /mandateLens/);
  assert.match(cultivationTypesSource, /breakthroughProofLedger/);
  assert.match(cultivationTypesSource, /DaoMandateSurfaceV1/);
  assert.match(cultivationTypesSource, /DaoRequirementLedger/);

  assert.match(cultivationSurfaceSource, /buildLiveDaoMandateSurfaceV1/);
  assert.match(cultivationSurfaceSource, /currentScreen:\s*'cultivation'/);
  assert.match(cultivationSurfaceSource, /applyDaoMandateVisibility/);
  assert.match(cultivationSurfaceSource, /buildCultivationBreakthroughProofLedger/);
  assert.match(cultivationSurfaceSource, /Qi Reservoir/);
  assert.match(cultivationSurfaceSource, /Realm Edge/);
  assert.match(cultivationSurfaceSource, /Gate Proof/);
});

test('P4 Cultivation rerenders on Guidance Oath changes and routes through the Dao Mandate adapter', () => {
  assert.match(cultivationOwnerSource, /guidanceOath/);
  assert.match(cultivationOwnerSource, /mandateMotionMode/);
  assert.match(cultivationOwnerSource, /storyMotionMode/);
  assert.match(cultivationOwnerSource, /onMandateRouteAction=\{actions\.onMandateRouteAction\}/);

  assert.match(cultivationControllerSource, /performDaoMandateRouteAction/);
  assert.match(cultivationControllerSource, /onMandateRouteAction/);
});

test('P4.1 normal substage breakthrough proof does not mark Realm Edge as an unmet hard gate', () => {
  const surface = buildSurface();
  const hardRows = surface.breakthroughProofLedger?.hardGates ?? [];
  const qiRow = hardRows.find((row) => row.label === 'Qi Reservoir');
  const realmEdgeRow = hardRows.find((row) => row.label === 'Realm Edge');

  assert.equal(surface.meta.activityState, 'breakthrough_ready');
  assert.equal(surface.commandDeck.primary.actionKey, 'breakThrough');
  assert.equal(surface.commandDeck.primary.label, 'Break Through');
  assert.equal(qiRow?.state, 'met');
  assert.notEqual(realmEdgeRow?.state, 'unmet');
});

test('P4.1 major realm transition keeps Realm Edge and routes missing Gate Proof to Gate Trial', () => {
  const gateRoute: DaoMandateRoute = {
    id: 'test-open-gate-trial',
    label: 'Open Gate Trial',
    actionLabel: 'Open Gate Trial',
    detail: 'Earn the missing gate proof.',
    destinationLabel: 'Gate Trial',
    target: { kind: 'world_module', cityId: 'city_pinewind_hamlet', moduleKey: 'gateTrial' },
    blocked: false,
    blockedReason: null,
    expectedDeltaLabel: 'Gate proof can be earned here.',
    source: 'readiness',
    priority: 1,
  };
  const surface = buildCultivationExactSurfaceFromSnapshots({
    ...baseSnapshot,
    realm: { index: 0, substage: 9, name: 'Qi Condensation' },
    requiredGateItemId: 'gate_foundation_pill',
    requiredGateItemName: 'Foundation Pill',
    requiredGateItemCount: 0,
  }, {
    mandateLens: makeMandateLensWithRoute(gateRoute),
  });
  const hardRows = surface.breakthroughProofLedger?.hardGates ?? [];
  const realmEdgeRow = hardRows.find((row) => row.label === 'Realm Edge');
  const gateProofRow = hardRows.find((row) => row.label === 'Gate Proof');

  assert.equal(surface.meta.activityState, 'gate_blocked');
  assert.equal(realmEdgeRow?.state, 'met');
  assert.equal(gateProofRow?.state, 'unmet');
  assert.equal(gateProofRow?.tone, 'warning');
  assert.equal(gateProofRow?.route?.target?.kind, 'world_module');
  assert.equal(
    gateProofRow?.route?.target?.kind === 'world_module' ? gateProofRow.route.target.moduleKey : null,
    'gateTrial',
  );
});

test('P4.1 Cultivation command routing prefers Dao Mandate routes before Run Compass fallback', () => {
  assert.match(cultivationControllerSource, /findCommandMandateRoute/);
  assert.match(cultivationControllerSource, /performMandateRouteIfAvailable/);

  const gateHandler = cultivationControllerSource.match(/const openGateTrial[\s\S]*?\n  \}, \[/)?.[0] ?? '';
  assert.ok(gateHandler.includes('performMandateRouteIfAvailable'));
  assert.ok(gateHandler.includes('performActionIfAvailable'));
  assert.ok(
    gateHandler.indexOf('performMandateRouteIfAvailable') < gateHandler.indexOf('performActionIfAvailable'),
    'Gate command should try Dao Mandate route before Run Compass fallback.',
  );

  const prestigeHandler = cultivationControllerSource.match(/const openPrestige[\s\S]*?\n  \}, \[/)?.[0] ?? '';
  assert.ok(prestigeHandler.includes('performMandateRouteIfAvailable'));
  assert.ok(prestigeHandler.includes('performActionIfAvailable'));
  assert.ok(
    prestigeHandler.indexOf('performMandateRouteIfAvailable') < prestigeHandler.indexOf('performActionIfAvailable'),
    'Prestige command should try Dao Mandate route before Run Compass fallback.',
  );
});
