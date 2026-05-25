import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildDaoMandateSurfaceFromRunCompassV2,
  type DaoMandateRoute,
} from '../../src/systems/ui/daoMandate/index.js';
import { buildLocalMandateLensSurface } from '../../src/systems/world/localMandateLensSurface.js';
import { makeRunCompassV2Fixture } from '../helpers/daoMandate/runCompassFixture.js';

const VISIBLE = ['outskirts', 'ruins', 'gateTrial', 'apothecary', 'forge', 'manualPavilion', 'bounties', 'expeditions'] as const;

function route(moduleKey: (typeof VISIBLE)[number], detail: string): DaoMandateRoute {
  return {
    id: `route-${moduleKey}`,
    label: `Open ${moduleKey}`,
    actionLabel: `Open ${moduleKey}`,
    detail,
    destinationLabel: moduleKey,
    target: { kind: 'world_module', cityId: 'city_pinewind_hamlet', moduleKey },
    blocked: false,
    blockedReason: null,
    expectedDeltaLabel: null,
    source: 'economy',
    priority: 10,
  };
}

function mandateFor(moduleKey: (typeof VISIBLE)[number], detail: string) {
  const primary = route(moduleKey, detail);
  return buildDaoMandateSurfaceFromRunCompassV2(
    makeRunCompassV2Fixture({
      primaryRoute: {
        id: primary.id,
        label: primary.label,
        actionLabel: primary.actionLabel,
        detail: primary.detail,
        destinationLabel: primary.destinationLabel,
        target: primary.target as never,
        blocked: primary.blocked,
        blockedReason: primary.blockedReason,
        expectedDeltaLabel: primary.expectedDeltaLabel,
        source: primary.source as never,
        priority: primary.priority,
      },
      secondaryRoutes: [],
    }),
    { guidanceProfile: 'jade', currentScreen: moduleKey },
  );
}

test('combat route local lens copy keeps Gate Trial, Outskirts, and Ruins identities distinct', () => {
  const gate = buildLocalMandateLensSurface({
    mandate: mandateFor('gateTrial', 'Check proof before attempting the gate.'),
    cityId: 'city_pinewind_hamlet',
    moduleKey: 'gateTrial',
    visibleModules: VISIBLE,
  });
  const outskirts = buildLocalMandateLensSurface({
    mandate: mandateFor('outskirts', 'Gather gold and common materials safely.'),
    cityId: 'city_pinewind_hamlet',
    moduleKey: 'outskirts',
    visibleModules: VISIBLE,
  });
  const ruins = buildLocalMandateLensSurface({
    mandate: mandateFor('ruins', 'Break a scarce material drought.'),
    cityId: 'city_pinewind_hamlet',
    moduleKey: 'ruins',
    visibleModules: VISIBLE,
  });

  assert.match(`${gate?.label} ${gate?.detail}`, /gate|proof|threshold|readiness/i);
  assert.doesNotMatch(`${gate?.label} ${gate?.detail}`, /field|low-risk|farm|drought/i);

  assert.match(`${outskirts?.label} ${outskirts?.detail}`, /field|gold|common materials|safe combat/i);
  assert.doesNotMatch(`${outskirts?.label} ${outskirts?.detail}`, /proof ledger|Safety Net|drought-breaking/i);

  assert.match(`${ruins?.label} ${ruins?.detail}`, /relief|drought|ruins|scarce/i);
  assert.doesNotMatch(`${ruins?.label} ${ruins?.detail}`, /low-risk field|proof ledger|Safety Net/i);
});

test('Packet D active route screens remove public local Mandate lens wiring', () => {
  const worldScreen = readFileSync(resolve(process.cwd(), 'src/components/screens/WorldScreen.tsx'), 'utf8');
  const worldModal = readFileSync(resolve(process.cwd(), 'src/components/modals/WorldBuildingModal.tsx'), 'utf8');
  const gateScreen = readFileSync(resolve(process.cwd(), 'src/features/world/gateTrialExact/GateTrialExactScreen.ts'), 'utf8');
  const gateTypes = readFileSync(resolve(process.cwd(), 'src/features/world/gateTrialExact/gateTrialExactTypes.ts'), 'utf8');
  const ruinsSurface = readFileSync(resolve(process.cwd(), 'src/features/world/ruinsExact/buildRuinsExactSurface.ts'), 'utf8');
  const docs = [
    readFileSync(resolve(process.cwd(), 'AGENTS.md'), 'utf8'),
    readFileSync(resolve(process.cwd(), 'docs/release/status_v3_dao_decommission_plan.md'), 'utf8'),
  ].join('\n');

  assert.doesNotMatch(worldScreen, /useRunCompassSurface/);
  assert.doesNotMatch(worldScreen, /inspectorRunCompassLine/);

  assert.doesNotMatch(worldModal, /<ModuleRoleBanner/);
  assert.match(docs, /LocalMandateLensHeader/);
  assert.match(docs, /must not render|Forbidden public components|decommission/i);

  assert.doesNotMatch(gateScreen, /aria-label': 'Run Compass'|gate-trial-run-compass|gateTrialRunCompassSlip/);
  assert.doesNotMatch(gateTypes, /runCompass\?: GateTrialRunCompassSurface/);
  assert.doesNotMatch(ruinsSurface, /Ruins Run Compass/);

  for (const source of [worldScreen, worldModal, gateScreen, gateTypes, ruinsSurface]) {
    assert.doesNotMatch(source, /LocalMandateLensHeader|buildLiveDaoMandateSurfaceV1|buildWorldMandateRoutingLensSurface|mandateLens\?:/);
  }
});

test('active player-facing local lens copy avoids implementation-phase language', () => {
  const files = [
    'src/systems/world/localMandateLensSurface.ts',
    'src/components/screens/WorldScreen.tsx',
    'src/components/modals/WorldBuildingModal.tsx',
    'src/features/world/outskirts/components/OutskirtsTopRegion.ts',
    'src/features/world/ruinsExact/components/RuinsTopRegion.ts',
  ];
  const forbidden = /Packet|not expanded|owner not wired|TODO|implementation|deferred|later packet|cut over/i;
  const stringLiteralPattern = /(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/g;

  for (const file of files) {
    const source = readFileSync(resolve(process.cwd(), file), 'utf8');
    const playerFacingStrings = [...source.matchAll(stringLiteralPattern)]
      .map((match) => match[2])
      .filter((text) => !text.startsWith('.') && !text.startsWith('/') && !text.includes('__') && !/^[a-z0-9-]+$/i.test(text));
    assert.doesNotMatch(playerFacingStrings.join('\n'), forbidden, file);
  }
});
