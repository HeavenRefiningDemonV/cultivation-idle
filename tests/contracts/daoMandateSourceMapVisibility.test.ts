import assert from 'node:assert/strict';
import test from 'node:test';

import type { LiveWorldModuleKey } from '../../src/content/index.js';
import {
  applyDaoMandateVisibility,
  buildDaoMandateSurfaceFromRunCompassV2,
  type DaoMandateSurfaceV1,
} from '../../src/systems/ui/daoMandate/index.js';
import type { RunCompassRouteV2 } from '../../src/systems/ui/runCompass/types.js';
import { makeRunCompassV2Fixture } from '../helpers/daoMandate/runCompassFixture.js';

const CITY_ID = 'city_pinewind_hamlet';
const VISIBLE_MODULES: LiveWorldModuleKey[] = [
  'outskirts',
  'ruins',
  'gateTrial',
  'manualPavilion',
  'apothecary',
  'forge',
  'bounties',
  'expeditions',
];

function worldRoute(moduleKey: LiveWorldModuleKey, overrides: Partial<RunCompassRouteV2> = {}): RunCompassRouteV2 {
  return {
    id: `route-${moduleKey}`,
    label: `Open ${moduleKey}`,
    actionLabel: `Open ${moduleKey}`,
    detail: `Route to ${moduleKey} for current source/sink support.`,
    destinationLabel: moduleKey,
    target: { kind: 'world_module', cityId: CITY_ID, moduleKey },
    blocked: false,
    blockedReason: null,
    expectedDeltaLabel: null,
    source: 'economy',
    priority: 20,
    ...overrides,
  };
}

function makeApothecarySourceSurface(): DaoMandateSurfaceV1 {
  return buildDaoMandateSurfaceFromRunCompassV2(
    makeRunCompassV2Fixture({
      primaryBlocker: {
        kind: 'apothecary_prep_shortfall',
        label: 'Medicine reserve is thin',
        detail: 'The current gate needs a stronger medicine reserve.',
        severity: 'warning',
        source: 'economy',
        confidence: 'high',
      },
      primaryRoute: worldRoute('apothecary', {
        id: 'primary-apothecary',
        label: 'Prepare medicine reserve',
        actionLabel: 'Open Apothecary',
        destinationLabel: 'Apothecary',
        detail: 'Brew or buy the reserve for this gate.',
        expectedDeltaLabel: 'Medicine reserve improves.',
        priority: 10,
      }),
      secondaryRoutes: [
        worldRoute('outskirts', {
          id: 'fallback-outskirts',
          label: 'Herb source',
          actionLabel: 'Open Outskirts',
          destinationLabel: 'Outskirts',
          detail: 'Gather missing herbs through the field route.',
          priority: 40,
        }),
        worldRoute('expeditions', {
          id: 'fallback-expeditions',
          label: 'Background herb support',
          actionLabel: 'Open Expeditions',
          destinationLabel: 'Expeditions',
          detail: 'Use idle support to smooth the herb shortage.',
          priority: 50,
        }),
      ],
      currentCity: {
        cityId: CITY_ID,
        cityName: 'Pinewind Hamlet',
        visibleModuleKeys: VISIBLE_MODULES,
        recommendedModuleKey: 'apothecary',
      },
      readiness: {
        score: 52,
        label: 'Thin',
        band: 'below_recommended',
        diagnosisLabel: 'Medicine reserve shortfall',
        primaryShortfallLabel: 'Healing reserve below gate floor',
        rows: [
          {
            id: 'medicine-floor',
            label: 'Medicine floor',
            detail: 'Healing reserve is below the gate floor.',
            tone: 'warning',
          },
        ],
      },
    }),
    { guidanceProfile: 'jade' },
  );
}

test('P6 Source Map visibility follows source detail setting rather than legacy profile', () => {
  const raw = makeApothecarySourceSurface();
  const sealed = applyDaoMandateVisibility(raw, {
    profile: 'sealed',
    settings: { sourceRouteDetail: 'needed_only' },
  });
  const jade = applyDaoMandateVisibility(raw, {
    profile: 'jade',
    settings: { sourceRouteDetail: 'needed_only' },
  });
  const hidden = applyDaoMandateVisibility(raw, {
    profile: 'elder',
    settings: { sourceRouteDetail: 'never' },
  });
  const expanded = applyDaoMandateVisibility(raw, {
    profile: 'elder',
    settings: { sourceRouteDetail: 'always' },
  });

  assert.equal(raw.sourceMap.length > 0, true, 'raw surface should include source map data');
  assert.deepEqual(
    sealed.sourceMap.map((entry) => [entry.id, entry.bestSources.length, entry.fallbackSources.length]),
    jade.sourceMap.map((entry) => [entry.id, entry.bestSources.length, entry.fallbackSources.length]),
  );
  assert.equal(hidden.sourceMap.length, 0);
  assert.equal(expanded.sourceMap.length, raw.sourceMap.length);
  assert.equal(
    (expanded.sourceMap[0]?.fallbackSources.length ?? 0) >= (sealed.sourceMap[0]?.fallbackSources.length ?? 0),
    true,
  );
});

test('P6 needed-only source detail includes expedition shortage smoothing', () => {
  const raw = buildDaoMandateSurfaceFromRunCompassV2(
    makeRunCompassV2Fixture({
      primaryBlocker: {
        kind: 'expedition_shortage_smoothing',
        label: 'Background support can smooth the shortage',
        detail: 'An expedition route can support the current material drought.',
        severity: 'warning',
        source: 'economy',
        confidence: 'high',
      },
      primaryRoute: worldRoute('expeditions', {
        id: 'primary-expeditions',
        label: 'Open expedition support',
        actionLabel: 'Open Expeditions',
        destinationLabel: 'Expeditions',
        detail: 'Use idle support for the current bottleneck.',
        expectedDeltaLabel: 'Background support improves.',
        priority: 10,
      }),
      currentCity: {
        cityId: CITY_ID,
        cityName: 'Pinewind Hamlet',
        visibleModuleKeys: VISIBLE_MODULES,
        recommendedModuleKey: 'expeditions',
      },
    }),
    { guidanceProfile: 'jade' },
  );

  const elder = applyDaoMandateVisibility(raw, {
    profile: 'elder',
    settings: { sourceRouteDetail: 'needed_only' },
  });

  assert.equal(elder.sourceMap.length > 0, true);
  assert.equal(elder.requirementLedger.sourceRoutes.length > 0, true);
  assert.match(elder.sourceMap[0].neededThingLabel, /background|expedition|support/i);
});

test('P6 source detail can be disabled without changing primary route truth', () => {
  const raw = makeApothecarySourceSurface();
  const hidden = applyDaoMandateVisibility(raw, {
    profile: 'jade',
    settings: { sourceRouteDetail: 'never' },
  });

  assert.equal(hidden.primaryRoute.id, raw.primaryRoute.id);
  assert.equal(hidden.sourceMap.length, 0);
  assert.equal(hidden.requirementLedger.sourceRoutes.length, 0);
});
