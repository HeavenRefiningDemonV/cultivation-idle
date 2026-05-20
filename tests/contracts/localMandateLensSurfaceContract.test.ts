import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyDaoMandateVisibility,
  buildDaoMandateSurfaceFromRunCompassV2,
  type DaoMandateRoute,
  type DaoMandateSurfaceV1,
} from '../../src/systems/ui/daoMandate/index.js';
import {
  applyLocalMandateLensVisibility,
  buildLocalMandateLensSurface,
  buildWorldMandateRoutingLensSurface,
} from '../../src/systems/world/localMandateLensSurface.js';
import { makeRunCompassV2Fixture } from '../helpers/daoMandate/runCompassFixture.js';

const PINEWIND_MODULES = [
  'outskirts',
  'ruins',
  'gateTrial',
  'apothecary',
  'forge',
  'manualPavilion',
  'bounties',
  'expeditions',
] as const;

function worldRoute(
  id: string,
  moduleKey: (typeof PINEWIND_MODULES)[number],
  overrides: Partial<DaoMandateRoute> = {},
): DaoMandateRoute {
  return {
    id,
    label: overrides.label ?? `Open ${moduleKey}`,
    actionLabel: overrides.actionLabel ?? `Open ${moduleKey}`,
    detail: overrides.detail ?? `Route to ${moduleKey}.`,
    destinationLabel: overrides.destinationLabel ?? moduleKey,
    target: { kind: 'world_module', cityId: 'city_pinewind_hamlet', moduleKey },
    blocked: false,
    blockedReason: null,
    expectedDeltaLabel: null,
    source: 'readiness',
    priority: 50,
    ...overrides,
  };
}

function mandateWithRoutes(args: {
  primary: DaoMandateRoute;
  secondary?: DaoMandateRoute[];
}): DaoMandateSurfaceV1 {
  return buildDaoMandateSurfaceFromRunCompassV2(
    makeRunCompassV2Fixture({
      primaryRoute: {
        id: args.primary.id,
        label: args.primary.label,
        actionLabel: args.primary.actionLabel,
        detail: args.primary.detail,
        destinationLabel: args.primary.destinationLabel,
        target: args.primary.target as never,
        blocked: args.primary.blocked,
        blockedReason: args.primary.blockedReason,
        expectedDeltaLabel: args.primary.expectedDeltaLabel,
        source: args.primary.source as never,
        priority: args.primary.priority,
      },
      secondaryRoutes: (args.secondary ?? []).map((route) => ({
        id: route.id,
        label: route.label,
        actionLabel: route.actionLabel,
        detail: route.detail,
        destinationLabel: route.destinationLabel,
        target: route.target as never,
        blocked: route.blocked,
        blockedReason: route.blockedReason,
        expectedDeltaLabel: route.expectedDeltaLabel,
        source: route.source as never,
        priority: route.priority,
      })),
      currentCity: {
        cityId: 'city_pinewind_hamlet',
        cityName: 'Pinewind Hamlet',
        visibleModuleKeys: [...PINEWIND_MODULES],
        recommendedModuleKey: args.primary.target?.kind === 'world_module' ? args.primary.target.moduleKey : 'gateTrial',
      },
    }),
    { guidanceProfile: 'jade', currentScreen: 'world' },
  );
}

test('local Mandate lens marks Gate Trial primary without marking Outskirts or Ruins primary', () => {
  const mandate = mandateWithRoutes({
    primary: worldRoute('attempt-gate', 'gateTrial', {
      label: 'Attempt Gate Trial',
      actionLabel: 'Open Gate Trial',
      detail: 'Challenge the gate now.',
      destinationLabel: 'Gate Trial',
      source: 'trial_lifecycle',
      priority: 10,
    }),
  });

  const gate = buildLocalMandateLensSurface({
    mandate,
    cityId: 'city_pinewind_hamlet',
    moduleKey: 'gateTrial',
    visibleModules: PINEWIND_MODULES,
  });
  const outskirts = buildLocalMandateLensSurface({
    mandate,
    cityId: 'city_pinewind_hamlet',
    moduleKey: 'outskirts',
    visibleModules: PINEWIND_MODULES,
  });
  const ruins = buildLocalMandateLensSurface({
    mandate,
    cityId: 'city_pinewind_hamlet',
    moduleKey: 'ruins',
    visibleModules: PINEWIND_MODULES,
  });

  assert.equal(gate?.relation, 'primary');
  assert.match(gate?.label ?? '', /gate|threshold|proof/i);
  assert.match(gate?.detail ?? '', /gate|proof|readiness/i);
  assert.doesNotMatch(`${gate?.label} ${gate?.detail}`, /Run Compass|field route|low-risk/i);
  assert.equal(outskirts?.relation, 'quiet');
  assert.equal(ruins?.relation, 'quiet');
});

test('local Mandate lens marks secondary and source-map module routes as support with stable evidence', () => {
  const mandate = mandateWithRoutes({
    primary: worldRoute('raise-forge-floor', 'forge', {
      label: 'Raise Forge Floor',
      destinationLabel: 'Forge',
      source: 'build',
      priority: 10,
    }),
    secondary: [
      worldRoute('field-support', 'outskirts', {
        label: 'Gather Field Support',
        destinationLabel: 'Outskirts',
        detail: 'Gather gold and common materials.',
        source: 'economy',
        priority: 40,
      }),
      worldRoute('ruin-relief', 'ruins', {
        label: 'Search Ruins',
        destinationLabel: 'Ruins',
        detail: 'Patch scarce material droughts.',
        source: 'economy',
        priority: 45,
      }),
    ],
  });

  const outskirts = buildLocalMandateLensSurface({
    mandate,
    cityId: 'city_pinewind_hamlet',
    moduleKey: 'outskirts',
    visibleModules: PINEWIND_MODULES,
  });
  const ruins = buildLocalMandateLensSurface({
    mandate,
    cityId: 'city_pinewind_hamlet',
    moduleKey: 'ruins',
    visibleModules: PINEWIND_MODULES,
  });

  assert.equal(outskirts?.relation, 'support');
  assert.match(outskirts?.detail ?? '', /gold|common materials|safe combat/i);
  assert.equal(ruins?.relation, 'support');
  assert.match(ruins?.detail ?? '', /ruins|relief|drought|scarce/i);
  assert.equal((outskirts?.evidenceIds.length ?? 0) > 0, true);
  assert.equal((ruins?.evidenceIds.length ?? 0) > 0, true);
});

test('blocked Mandate world route stays blocked and exposes user-safe reason', () => {
  const mandate = mandateWithRoutes({
    primary: worldRoute('blocked-gate', 'gateTrial', {
      blocked: true,
      blockedReason: 'Finish the active attempt before traveling.',
      label: 'Open Gate Trial',
      destinationLabel: 'Gate Trial',
      source: 'trial_lifecycle',
      priority: 5,
    }),
  });

  const gate = buildLocalMandateLensSurface({
    mandate,
    cityId: 'city_pinewind_hamlet',
    moduleKey: 'gateTrial',
    visibleModules: PINEWIND_MODULES,
  });

  assert.equal(gate?.relation, 'blocked');
  assert.equal(gate?.route?.blocked, true);
  assert.match(gate?.detail ?? '', /blocked|Finish the active attempt/i);
  assert.doesNotMatch(gate?.detail ?? '', /owner|undefined|not wired|TODO|Packet/i);
});

test('World Mandate routing lens resolves one strongest visible module and ignores hidden primary targets', () => {
  const mandate = mandateWithRoutes({
    primary: worldRoute('attempt-gate', 'gateTrial', { priority: 1 }),
    secondary: [worldRoute('field-support', 'outskirts', { priority: 30 })],
  });

  const allVisible = buildWorldMandateRoutingLensSurface({
    mandate,
    cityId: 'city_pinewind_hamlet',
    visibleModules: PINEWIND_MODULES,
  });
  const hiddenPrimary = buildWorldMandateRoutingLensSurface({
    mandate,
    cityId: 'city_pinewind_hamlet',
    visibleModules: PINEWIND_MODULES.filter((moduleKey) => moduleKey !== 'gateTrial'),
  });

  assert.equal(allVisible.primaryModuleKey, 'gateTrial');
  assert.equal(allVisible.strongestModuleKey, 'gateTrial');
  assert.deepEqual(allVisible.secondaryModuleKeys, ['outskirts']);
  assert.equal(hiddenPrimary.primaryModuleKey, null);
  assert.equal(hiddenPrimary.strongestModuleKey, 'outskirts');
});

test('local Mandate lens visibility uses Dao Mandate profile filtering', () => {
  const mandate = mandateWithRoutes({
    primary: worldRoute('attempt-gate', 'gateTrial', { priority: 1 }),
    secondary: [worldRoute('field-support', 'outskirts', { priority: 30 })],
  });
  const visibleMandate = applyDaoMandateVisibility(mandate, { profile: 'sealed' });
  const primaryLens = buildLocalMandateLensSurface({
    mandate: visibleMandate,
    cityId: 'city_pinewind_hamlet',
    moduleKey: 'gateTrial',
    visibleModules: PINEWIND_MODULES,
  });
  const supportLens = buildLocalMandateLensSurface({
    mandate: visibleMandate,
    cityId: 'city_pinewind_hamlet',
    moduleKey: 'outskirts',
    visibleModules: PINEWIND_MODULES,
  });
  const rawSupportLens = buildLocalMandateLensSurface({
    mandate,
    cityId: 'city_pinewind_hamlet',
    moduleKey: 'outskirts',
    visibleModules: PINEWIND_MODULES,
  });

  assert.equal(applyLocalMandateLensVisibility(primaryLens, mandate, { guidanceOath: 'sealed', localLensBanners: 'compact' })?.relation, 'primary');
  assert.equal(applyLocalMandateLensVisibility(supportLens, mandate, { guidanceOath: 'sealed', localLensBanners: 'compact' }), null);
  assert.equal(applyLocalMandateLensVisibility(rawSupportLens, mandate, { guidanceOath: 'jade', localLensBanners: 'full' })?.relation, 'support');
});

test('local Mandate lens visibility hides quiet modules while preserving relevant profile detail', () => {
  const mandate = mandateWithRoutes({
    primary: worldRoute('attempt-gate', 'gateTrial', { priority: 1 }),
    secondary: [worldRoute('field-support', 'outskirts', { priority: 30 })],
  });
  const quietLens = buildLocalMandateLensSurface({
    mandate,
    cityId: 'city_pinewind_hamlet',
    moduleKey: 'ruins',
    visibleModules: PINEWIND_MODULES,
  });
  const primaryLens = buildLocalMandateLensSurface({
    mandate,
    cityId: 'city_pinewind_hamlet',
    moduleKey: 'gateTrial',
    visibleModules: PINEWIND_MODULES,
  });
  const supportLens = buildLocalMandateLensSurface({
    mandate,
    cityId: 'city_pinewind_hamlet',
    moduleKey: 'outskirts',
    visibleModules: PINEWIND_MODULES,
  });

  assert.equal(quietLens?.relation, 'quiet');
  assert.equal(applyLocalMandateLensVisibility(quietLens, mandate, { guidanceOath: 'sealed', localLensBanners: 'compact' }), null);
  assert.equal(applyLocalMandateLensVisibility(quietLens, mandate, { guidanceOath: 'elder', localLensBanners: 'compact' }), null);
  assert.equal(applyLocalMandateLensVisibility(primaryLens, mandate, { guidanceOath: 'sealed', localLensBanners: 'compact' })?.relation, 'primary');
  assert.equal(applyLocalMandateLensVisibility(supportLens, mandate, { guidanceOath: 'elder', localLensBanners: 'compact' })?.relation, 'support');
  assert.equal(applyLocalMandateLensVisibility(supportLens, mandate, { guidanceOath: 'jade', localLensBanners: 'full' })?.relation, 'support');
});
