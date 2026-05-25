import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

import {
  buildGateTrialExactSurfaceFromStores,
  createGateTrialExactMockupFixture,
} from '../../src/features/world/gateTrialExact/buildGateTrialExactSurface.js';
import {
  buildDaoMandateSurfaceFromRunCompassV2,
  type DaoMandateSurfaceV1,
} from '../../src/systems/ui/daoMandate/index.js';
import {
  buildLocalMandateLensSurface,
  buildWorldMandateRoutingLensSurface,
} from '../../src/systems/world/localMandateLensSurface.js';
import { makeRunCompassV2Fixture } from '../helpers/daoMandate/runCompassFixture.js';

const VISIBLE = ['outskirts', 'ruins', 'gateTrial', 'apothecary', 'forge', 'manualPavilion', 'bounties', 'expeditions'] as const;

function gatePrimaryMandate(): DaoMandateSurfaceV1 {
  return buildDaoMandateSurfaceFromRunCompassV2(
    makeRunCompassV2Fixture({
      primaryRoute: {
        id: 'attempt-gate',
        label: 'Attempt Gate Trial',
        actionLabel: 'Open Gate Trial',
        detail: 'Check the proof ledger, then attempt when readiness is viable.',
        destinationLabel: 'Gate Trial',
        target: { kind: 'world_module', cityId: 'city_pinewind_hamlet', moduleKey: 'gateTrial' },
        blocked: false,
        blockedReason: null,
        expectedDeltaLabel: 'Gate proof can resolve.',
        source: 'trial_lifecycle',
        priority: 1,
      },
    }),
    { guidanceProfile: 'jade', currentScreen: 'status' },
  );
}

test('internal Dao Mandate world route helpers still agree after public lens retirement', () => {
  const mandate = gatePrimaryMandate();
  assert.deepEqual(mandate.primaryRoute.target, {
    kind: 'world_module',
    cityId: 'city_pinewind_hamlet',
    moduleKey: 'gateTrial',
  });

  const world = buildWorldMandateRoutingLensSurface({
    mandate,
    cityId: 'city_pinewind_hamlet',
    visibleModules: VISIBLE,
  });
  const gateLens = buildLocalMandateLensSurface({
    mandate,
    cityId: 'city_pinewind_hamlet',
    moduleKey: 'gateTrial',
    visibleModules: VISIBLE,
  });
  const outskirtsLens = buildLocalMandateLensSurface({
    mandate,
    cityId: 'city_pinewind_hamlet',
    moduleKey: 'outskirts',
    visibleModules: VISIBLE,
  });

  assert.equal(world.strongestModuleKey, 'gateTrial');
  assert.equal(world.relationByModuleKey.gateTrial?.relation, 'primary-evidence');
  assert.equal(gateLens?.relation, 'primary-evidence');
  assert.equal(gateLens?.route?.target?.kind, 'world_module');
  assert.equal(gateLens?.route?.target?.kind === 'world_module' ? gateLens.route.target.moduleKey : null, 'gateTrial');
  assert.equal(outskirtsLens, null);
});

test('Gate Trial exact surface removes public Mandate lens while preserving readiness and action surfaces', () => {
  const surface = buildGateTrialExactSurfaceFromStores('city_pinewind_hamlet', { mode: 'fixture' });

  assert.equal(surface.minimumChecklist.title, 'Minimum Checklist');
  assert.equal(surface.recommendedPanel.failSafeTitle, 'Fail-Safe');
  assert.ok(surface.minimumChecklist.rows.length > 0);
  assert.ok(surface.readinessRail.nodes.length > 0);
  assert.equal(surface.primaryAction.visible, true);
  assert.equal(surface.shell.useScreenOwnedExactPage, true);
  assert.equal(surface.shell.showExternalCombatPreview, false);
  assert.equal('mandateLens' in surface, false);
  assert.equal((surface as { runCompass?: unknown }).runCompass, undefined);
});

test('Gate Trial exact screen no longer accepts or renders a local lens header', () => {
  const surface = createGateTrialExactMockupFixture();
  const source = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.ts', 'utf8');

  assert.equal('mandateLens' in surface, false);
  assert.doesNotMatch(source, /LocalMandateLensHeader|surface\.mandateLens|GateTrialMandateLens/);
});

test('Gate Trial exact screen does not hardcode local lens profile, variant, or motion', () => {
  const source = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.ts', 'utf8');

  assert.doesNotMatch(source, /profile:\s*'elder'/);
  assert.doesNotMatch(source, /variant:\s*'compact'/);
  assert.doesNotMatch(source, /motionMode:\s*'low'/);
  assert.doesNotMatch(source, /surface\.mandateLens\.profile/);
  assert.doesNotMatch(source, /surface\.mandateLens\.variant/);
  assert.doesNotMatch(source, /surface\.mandateLens\.motionMode/);
});
