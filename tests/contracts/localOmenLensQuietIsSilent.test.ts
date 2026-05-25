import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import type { LiveWorldModuleKey } from '../../src/content/index.js';
import {
  buildDaoMandateSurfaceFromRunCompassV2,
  type DaoLocalLensSurface,
  type DaoMandateSurfaceV1,
} from '../../src/systems/ui/daoMandate/index.js';
import { buildDaoMandateModuleSourceSinkSurface } from '../../src/systems/ui/daoMandate/daoMandateSourceMap.js';
import type { RunCompassRouteV2 } from '../../src/systems/ui/runCompass/types.js';
import {
  buildLocalMandateLensSurface,
  buildWorldMandateRoutingLensSurface,
} from '../../src/systems/world/localMandateLensSurface.js';
import { LocalMandateLensHeader } from '../../src/ui/daoMandate/LocalMandateLensHeader.js';
import { makeRunCompassV2Fixture } from '../helpers/daoMandate/runCompassFixture.js';

const CITY_ID = 'city_pinewind_hamlet';
const VISIBLE_MODULES = [
  'outskirts',
  'ruins',
  'gateTrial',
  'apothecary',
  'forge',
  'manualPavilion',
  'bounties',
  'expeditions',
] as const satisfies readonly LiveWorldModuleKey[];

function worldRoute(
  moduleKey: LiveWorldModuleKey,
  overrides: Partial<RunCompassRouteV2> = {},
): RunCompassRouteV2 {
  return {
    id: `route-${moduleKey}`,
    label: `Review ${moduleKey}`,
    actionLabel: `Review ${moduleKey}`,
    detail: `Review ${moduleKey} for current proof or source support.`,
    destinationLabel: moduleKey,
    target: { kind: 'world_module', cityId: CITY_ID, moduleKey },
    blocked: false,
    blockedReason: null,
    expectedDeltaLabel: null,
    source: 'readiness',
    priority: 20,
    ...overrides,
  };
}

function gatePrimaryMandate(): DaoMandateSurfaceV1 {
  return buildDaoMandateSurfaceFromRunCompassV2(
    makeRunCompassV2Fixture({
      primaryRoute: worldRoute('gateTrial', {
        id: 'attempt-gate',
        label: 'Gate proof',
        actionLabel: 'Review Gate Proof',
        detail: 'Check the proof ledger, then attempt when readiness is viable.',
        destinationLabel: 'Gate Trial',
        source: 'trial_lifecycle',
        priority: 1,
      }),
      currentCity: {
        cityId: CITY_ID,
        cityName: 'Pinewind Hamlet',
        visibleModuleKeys: [...VISIBLE_MODULES],
        recommendedModuleKey: 'gateTrial',
      },
    }),
    { guidanceProfile: 'jade', currentScreen: 'world' },
  );
}

function supportMandate(): DaoMandateSurfaceV1 {
  return buildDaoMandateSurfaceFromRunCompassV2(
    makeRunCompassV2Fixture({
      primaryRoute: worldRoute('gateTrial', {
        id: 'attempt-gate',
        label: 'Gate proof',
        actionLabel: 'Review Gate Proof',
        destinationLabel: 'Gate Trial',
        source: 'trial_lifecycle',
        priority: 1,
      }),
      secondaryRoutes: [
        worldRoute('outskirts', {
          id: 'field-support',
          label: 'Field support',
          actionLabel: 'Inspect field support',
          detail: 'Outskirts can support reserves without replacing the gate proof owner.',
          destinationLabel: 'Outskirts',
          source: 'economy',
          priority: 35,
        }),
      ],
      currentCity: {
        cityId: CITY_ID,
        cityName: 'Pinewind Hamlet',
        visibleModuleKeys: [...VISIBLE_MODULES],
        recommendedModuleKey: 'gateTrial',
      },
    }),
    { guidanceProfile: 'jade', currentScreen: 'world' },
  );
}

test('V2-8 quiet local modules produce no public Mandate lens or visible World relation', () => {
  const mandate = gatePrimaryMandate();

  const quietLens = buildLocalMandateLensSurface({
    mandate,
    cityId: CITY_ID,
    moduleKey: 'ruins',
    visibleModules: VISIBLE_MODULES,
  });
  const routing = buildWorldMandateRoutingLensSurface({
    mandate,
    cityId: CITY_ID,
    visibleModules: VISIBLE_MODULES,
    guidanceSettings: { localLensBanners: 'full' },
  });

  assert.equal(quietLens, null);
  assert.equal(routing.visibleRelationByModuleKey.ruins ?? null, null);
  assert.equal(routing.relationByModuleKey.ruins ?? null, null);
  assert.equal(routing.strongestModuleKey, 'gateTrial');
});

test('V2-8 meaningful local relations use proof/source taxonomy instead of route labels', () => {
  const mandate = supportMandate();
  const gate = buildLocalMandateLensSurface({
    mandate,
    cityId: CITY_ID,
    moduleKey: 'gateTrial',
    visibleModules: VISIBLE_MODULES,
  });
  const outskirts = buildLocalMandateLensSurface({
    mandate,
    cityId: CITY_ID,
    moduleKey: 'outskirts',
    visibleModules: VISIBLE_MODULES,
  });

  assert.equal(gate?.relation, 'primary-evidence');
  assert.match(`${gate?.label ?? ''} ${gate?.detail ?? ''}`, /proof|evidence|gate/i);
  assert.doesNotMatch(`${gate?.label ?? ''} ${gate?.detail ?? ''}`, /Primary route|points here|go here now/i);
  assert.equal(outskirts?.relation, 'supporting-source');
  assert.match(`${outskirts?.label ?? ''} ${outskirts?.detail ?? ''}`, /support|source|reserve|field/i);
  assert.doesNotMatch(`${outskirts?.label ?? ''} ${outskirts?.detail ?? ''}`, /Support route|points elsewhere/i);
});

test('V2-8 LocalMandateLensHeader renders nothing for null or quiet lenses', () => {
  const nullHtml = renderToStaticMarkup(React.createElement(LocalMandateLensHeader, { lens: null }));
  const quietLens = {
    screenId: 'world:city_pinewind_hamlet:ruins',
    relation: 'quiet',
    label: '',
    detail: '',
    route: null,
    evidenceIds: [],
  } as DaoLocalLensSurface;
  const quietHtml = renderToStaticMarkup(React.createElement(LocalMandateLensHeader, { lens: quietLens }));

  assert.equal(nullHtml, '');
  assert.equal(quietHtml, '');
});

test('V2-8 source-map quiet module surfaces are hidden instead of scolding the player', () => {
  const mandate = buildDaoMandateSurfaceFromRunCompassV2(
    makeRunCompassV2Fixture({
      primaryBlocker: {
        kind: 'manual_pavilion_gap',
        label: 'Doctrine source is thin',
        detail: 'The current proof needs clearer doctrine evidence.',
        severity: 'warning',
        source: 'readiness',
        confidence: 'high',
      },
      primaryRoute: worldRoute('manualPavilion', {
        id: 'manual-proof',
        label: 'Doctrine evidence',
        destinationLabel: 'Manual Pavilion',
        source: 'readiness',
        priority: 1,
      }),
      currentCity: {
        cityId: CITY_ID,
        cityName: 'Pinewind Hamlet',
        visibleModuleKeys: [...VISIBLE_MODULES],
        recommendedModuleKey: 'manualPavilion',
      },
    }),
    { guidanceProfile: 'jade', currentScreen: 'manualPavilion' },
  );

  const bounties = buildDaoMandateModuleSourceSinkSurface({
    mandate,
    currentCityId: CITY_ID,
    currentModuleKey: 'bounties',
    guidanceProfile: 'sealed',
  });

  assert.equal(bounties, null);
});

test('V2-8 reachable local Omen copy does not say the Mandate points elsewhere', () => {
  const reachableFiles = [
    'src/systems/world/localMandateLensSurface.ts',
    'src/systems/ui/daoMandate/daoMandateSourceMap.ts',
    'src/ui/daoMandate/LocalMandateLensHeader.tsx',
    'src/components/screens/WorldScreen.tsx',
    'src/components/screens/CityMapHub.tsx',
    'src/systems/ui/world/worldModuleRoutingSurface.ts',
  ];
  const source = reachableFiles
    .map((file) => readFileSync(path.resolve(file), 'utf8'))
    .join('\n');

  assert.doesNotMatch(source, /Mandate points elsewhere/i);
  assert.doesNotMatch(source, /current Mandate points elsewhere/i);
  assert.doesNotMatch(source, /available, but the current Mandate/i);
  assert.doesNotMatch(source, /Primary route|Support route|Future route|Quiet route/i);
  assert.doesNotMatch(source, /Mandate points to this module|current Mandate points here|Go here now/i);
});

test('Packet D public World and combat top regions do not render local Mandate lens headers', () => {
  const publicFiles = [
    'src/components/screens/WorldScreen.tsx',
    'src/components/modals/WorldBuildingModal.tsx',
    'src/ui/world/combat/CombatModuleTopLane.tsx',
    'src/features/world/outskirts/components/OutskirtsTopRegion.ts',
    'src/features/world/ruinsExact/components/RuinsTopRegion.ts',
    'src/features/world/outskirts/OutskirtsScreenOwner.tsx',
    'src/features/world/ruinsExact/RuinsScreenOwner.tsx',
  ];

  for (const file of publicFiles) {
    const source = readFileSync(path.resolve(file), 'utf8');
    assert.doesNotMatch(source, /LocalMandateLensHeader|mandateLens|buildLiveDaoMandateSurfaceV1|buildLocalMandateLensSurface/, `${file} must not expose the local mandate lens publicly.`);
  }
});
