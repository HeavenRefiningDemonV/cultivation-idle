import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

import {
  buildGateTrialExactSurfaceFromStores,
  createGateTrialExactMockupFixture,
} from '../../src/features/world/gateTrialExact/buildGateTrialExactSurface.js';
import { useUIStore, type UISettingsState } from '../../src/stores/uiStore.js';
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

function withUiSettings<T>(partial: Partial<UISettingsState>, run: () => T): T {
  const previous = useUIStore.getState().settings;
  useUIStore.setState({ settings: { ...previous, ...partial } });
  try {
    return run();
  } finally {
    useUIStore.setState({ settings: previous });
  }
}

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

test('Dao Mandate primary world route agrees across Status truth, World routing lens, and Gate Trial local lens', () => {
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
  assert.equal(world.relationByModuleKey.gateTrial?.relation, 'primary');
  assert.equal(gateLens?.relation, 'primary');
  assert.equal(gateLens?.route?.target?.kind, 'world_module');
  assert.equal(gateLens?.route?.target?.kind === 'world_module' ? gateLens.route.target.moduleKey : null, 'gateTrial');
  assert.equal(outskirtsLens?.relation, 'quiet');
});

test('Gate Trial exact surface exposes Mandate lens while preserving readiness and action surfaces', () => {
  const surface = buildGateTrialExactSurfaceFromStores('city_pinewind_hamlet', { mode: 'fixture' });

  assert.equal(surface.minimumChecklist.title, 'Minimum Checklist');
  assert.equal(surface.recommendedPanel.failSafeTitle, 'Fail-Safe');
  assert.equal(surface.primaryAction.visible, true);
  assert.equal(surface.shell.useScreenOwnedExactPage, true);
  assert.equal(surface.shell.showExternalCombatPreview, false);
  assert.ok(surface.mandateLens);
  assert.equal((surface as { runCompass?: unknown }).runCompass, undefined);
});

test('Gate Trial exact Mandate lens uses Guidance Oath profile, variant, and motion settings', () => {
  withUiSettings({
    guidanceOath: 'jade',
    localLensBanners: 'full',
    mandateMotionMode: 'full',
    storyMotionMode: 'full',
  }, () => {
    const surface = buildGateTrialExactSurfaceFromStores('city_pinewind_hamlet', { mode: 'fixture' });
    const mandateLens = surface.mandateLens as typeof surface.mandateLens & {
      profile?: string;
      variant?: string;
      motionMode?: string;
    };

    assert.equal(mandateLens?.profile, 'jade');
    assert.equal(mandateLens?.variant, 'full');
    assert.equal(mandateLens?.motionMode, 'full');
    assert.ok(mandateLens?.sourceLine);
  });

  withUiSettings({
    guidanceOath: 'elder',
    localLensBanners: 'compact',
    mandateMotionMode: 'follow_story',
    storyMotionMode: 'full',
  }, () => {
    const surface = buildGateTrialExactSurfaceFromStores('city_pinewind_hamlet', { mode: 'fixture' });
    const mandateLens = surface.mandateLens as typeof surface.mandateLens & {
      profile?: string;
      variant?: string;
      motionMode?: string;
    };

    assert.equal(mandateLens?.profile, 'elder');
    assert.equal(mandateLens?.variant, 'compact');
    assert.equal(mandateLens?.motionMode, 'full');
    assert.match(mandateLens?.compactLine ?? '', /gate|proof|readiness/i);
  });
});

test('Gate Trial exact screen accepts a filtered-hidden local lens without rendering a header', () => {
  const surface = createGateTrialExactMockupFixture({ mandateLens: null });
  const source = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.ts', 'utf8');

  assert.equal(surface.mandateLens, null);
  assert.match(source, /if \(!surface\.mandateLens\?\.lens\) return null;/);
});

test('Gate Trial exact screen does not hardcode local lens profile, variant, or motion', () => {
  const source = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.ts', 'utf8');

  assert.doesNotMatch(source, /profile:\s*'elder'/);
  assert.doesNotMatch(source, /variant:\s*'compact'/);
  assert.doesNotMatch(source, /motionMode:\s*'low'/);
  assert.match(source, /surface\.mandateLens\.profile/);
  assert.match(source, /surface\.mandateLens\.variant/);
  assert.match(source, /surface\.mandateLens\.motionMode/);
});
