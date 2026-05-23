import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildDaoOmenProjectionV1,
  createDaoOmenProjectionRawFixture,
  daoOmenRouteTargetsGateTrial,
  decideDaoOmenDirectRoute,
  isDaoOmenOrdinaryPressure,
  type DaoMandateRoute,
  type DaoOmenDirectRouteReason,
  type DaoOmenKind,
  type DaoOmenProjectionFixtureState,
  type DaoOmenProjectionV1,
} from '../../src/systems/ui/daoMandate/index.js';

const ROUTE_ELIGIBILITY_CASES = [
  { state: 'life_setup_missing_path', omen: 'life_setup', direct: true, reason: 'setup' },
  { state: 'qi_short_before_realm_edge', omen: 'threshold_unreached', direct: false, reason: undefined },
  { state: 'gate_proof_missing_attemptable', omen: 'proof_missing', direct: true, reason: 'hard_lock' },
  { state: 'medicine_floor_short', omen: 'reserve_thin', direct: false, reason: undefined },
  { state: 'forge_floor_shortfall', omen: 'gear_floor_strained', direct: false, reason: undefined },
  { state: 'doctrine_gap', omen: 'doctrine_uncertain', direct: false, reason: undefined },
  { state: 'merit_reserve_low', omen: 'support_reserve_low', direct: false, reason: undefined },
  { state: 'source_drought_herbs', omen: 'source_drought', direct: false, reason: undefined },
  { state: 'attemptable_gate_viable', omen: 'attemptable', direct: true, reason: 'hard_lock' },
  { state: 'attemptable_gate_risky', omen: 'risky_attempt', direct: true, reason: 'hard_lock' },
  { state: 'repeated_underprepared_failure', omen: 'reflection', direct: true, reason: 'repeated_failure' },
  { state: 'safety_net_ready', omen: 'safety_net_ready', direct: true, reason: 'safety_net' },
  { state: 'breakthrough_ready', omen: 'breakthrough_ready', direct: true, reason: 'breakthrough' },
  { state: 'prestige_viable_not_recommended', omen: 'reincarnation_viable', direct: true, reason: 'reincarnation' },
  { state: 'content_cap_reached', omen: 'content_cap', direct: true, reason: 'content_cap' },
] as const satisfies readonly {
  state: DaoOmenProjectionFixtureState;
  omen: DaoOmenKind;
  direct: boolean;
  reason: DaoOmenDirectRouteReason | undefined;
}[];

const ORDINARY_PRESSURE_STATES = [
  'qi_short_before_realm_edge',
  'medicine_floor_short',
  'forge_floor_shortfall',
  'doctrine_gap',
  'merit_reserve_low',
  'source_drought_herbs',
] as const satisfies readonly DaoOmenProjectionFixtureState[];

const ORDINARY_OMEN_KINDS = [
  'threshold_unreached',
  'reserve_thin',
  'gear_floor_strained',
  'doctrine_uncertain',
  'support_reserve_low',
  'currency_reserve_low',
  'source_drought',
] as const satisfies readonly DaoOmenKind[];

const FORBIDDEN_DEFAULT_ROUTE_COPY =
  /Open Apothecary|Restock Apothecary|Brew Medicine|Stock Healing|Open Forge|Raise Forge|Refine Weapon|Temper Gear|Tune Techniques|Open Techniques|Equip Iron Palm|Change AI|Cultivate Qi|Go Cultivate|Launch Expedition|Run Ruins|Farm Outskirts|Go to Bounties|Primary Route|Best Next Action|Biggest Shortfall|Mandate points elsewhere/i;

function project(state: DaoOmenProjectionFixtureState): DaoOmenProjectionV1 {
  return buildDaoOmenProjectionV1(createDaoOmenProjectionRawFixture(state), {
    includeDebug: true,
    now: 1_777_222,
  });
}

function collectDefaultProjectionText(projection: DaoOmenProjectionV1): string {
  return [
    projection.currentOmen.title,
    projection.currentOmen.detail,
    ...projection.proofSeals.map((seal) => `${seal.label} ${seal.detail}`),
    ...projection.pressureBadges.map((badge) => `${badge.label} ${badge.detail}`),
    ...projection.reflections.map((reflection) => `${reflection.label} ${reflection.detail}`),
    ...projection.sourceThreads.map((thread) => (
      `${thread.label} ${thread.missingThing} ${thread.sinkLabel} ${thread.evidenceLine}`
    )),
  ].join(' ');
}

function routeTargetId(route: DaoMandateRoute): string {
  if (!route.target) return 'none';
  if (route.target.kind === 'tab') return `tab:${route.target.tab}`;
  return `world_module:${route.target.moduleKey}`;
}

function routeText(route: DaoMandateRoute): string {
  return `${route.label} ${route.actionLabel} ${route.detail} ${route.destinationLabel}`;
}

function apothecaryRoute(overrides: Partial<DaoMandateRoute> = {}): DaoMandateRoute {
  return {
    id: 'test-open-apothecary',
    label: 'Open Apothecary',
    actionLabel: 'Open Apothecary',
    detail: 'Apothecary is a prep room, not a Gate Trial hard route.',
    destinationLabel: 'Apothecary',
    target: { kind: 'world_module', cityId: 'city_pinewind_hamlet', moduleKey: 'apothecary' },
    blocked: false,
    blockedReason: null,
    expectedDeltaLabel: null,
    source: 'economy',
    priority: 10,
    activityMode: 'active',
    ...overrides,
  };
}

function readTextFilesRecursively(root: string): string {
  return readdirSync(root)
    .flatMap((entry) => {
      const path = join(root, entry);
      const stat = statSync(path);
      if (stat.isDirectory()) return readTextFilesRecursively(path);
      if (!/\.(ts|tsx)$/.test(path)) return [];
      return readFileSync(path, 'utf8');
    })
    .join('\n');
}

test('direct routes follow V2 policy for every Omen Projection fixture', () => {
  for (const testCase of ROUTE_ELIGIBILITY_CASES) {
    const projection = project(testCase.state);

    assert.equal(projection.currentOmen.kind, testCase.omen, testCase.state);
    assert.equal(projection.currentOmen.allowDirectRoute, testCase.direct, testCase.state);
    assert.equal(projection.currentOmen.directRouteReason, testCase.reason, testCase.state);

    if (testCase.direct) {
      assert.ok(projection.currentOmen.route, testCase.state);
      assert.equal(projection.hardRoutes.length <= 1, true, testCase.state);
      assert.ok(projection.hardRoutes.some((route) => route.id === projection.currentOmen.route?.id), testCase.state);
    } else {
      assert.equal(projection.currentOmen.route, undefined, testCase.state);
      assert.deepEqual(projection.hardRoutes, [], testCase.state);
    }
  }
});

test('ordinary pressure states suppress raw primary and secondary routes', () => {
  for (const state of ORDINARY_PRESSURE_STATES) {
    const raw = createDaoOmenProjectionRawFixture(state);
    assert.ok(raw.primaryRoute.target, `${state} raw fixture should include a raw route to suppress`);

    const projection = buildDaoOmenProjectionV1(raw, { includeDebug: true });

    assert.equal(projection.currentOmen.allowDirectRoute, false, state);
    assert.equal(projection.currentOmen.directRouteReason, undefined, state);
    assert.equal(projection.currentOmen.route, undefined, state);
    assert.deepEqual(projection.hardRoutes, [], state);
    assert.equal(
      projection.sourceThreads.every((thread) => thread.routeVisibility !== 'hard_lock'),
      true,
      state,
    );
    assert.doesNotMatch(collectDefaultProjectionText(projection), FORBIDDEN_DEFAULT_ROUTE_COPY, state);
  }
});

test('allowed hard route targets stay inside their owning legal screens', () => {
  for (const testCase of ROUTE_ELIGIBILITY_CASES.filter((entry) => entry.direct)) {
    const projection = project(testCase.state);
    const route = projection.currentOmen.route;
    assert.ok(route, testCase.state);
    const targetId = routeTargetId(route);

    switch (testCase.reason) {
      case 'setup':
        assert.match(targetId, /^tab:cultivation$|^world_module:gateTrial$/, testCase.state);
        break;
      case 'hard_lock':
      case 'safety_net':
        assert.equal(targetId, 'world_module:gateTrial', testCase.state);
        assert.equal(daoOmenRouteTargetsGateTrial(route), true, testCase.state);
        break;
      case 'breakthrough':
        assert.equal(targetId, 'tab:cultivation', testCase.state);
        break;
      case 'reincarnation':
      case 'content_cap':
        assert.match(targetId, /^tab:prestige$|^tab:records$/, testCase.state);
        break;
      case 'repeated_failure':
        assert.equal(projection.hardRoutes.length, 1, testCase.state);
        break;
      default:
        assert.fail('Unhandled direct route reason');
    }
  }
});

test('attemptable and risky omens do not expose non-Gate-Trial routes by default', () => {
  for (const state of ['attemptable_gate_viable', 'attemptable_gate_risky'] satisfies DaoOmenProjectionFixtureState[]) {
    const raw = createDaoOmenProjectionRawFixture(state);
    raw.primaryRoute = apothecaryRoute();

    const projection = buildDaoOmenProjectionV1(raw, { includeDebug: true });

    assert.match(projection.currentOmen.kind, /^attemptable$|^risky_attempt$/, state);
    assert.equal(projection.currentOmen.allowDirectRoute, false, state);
    assert.equal(projection.currentOmen.directRouteReason, undefined, state);
    assert.equal(projection.currentOmen.route, undefined, state);
    assert.deepEqual(projection.hardRoutes, [], state);
  }
});

test('hard proof and safety-net omens do not expose prep-room routes as hard locks', () => {
  for (const state of ['gate_proof_missing_attemptable', 'safety_net_ready'] satisfies DaoOmenProjectionFixtureState[]) {
    const raw = createDaoOmenProjectionRawFixture(state);
    raw.primaryRoute = apothecaryRoute();

    const projection = buildDaoOmenProjectionV1(raw, { includeDebug: true });

    assert.equal(projection.currentOmen.allowDirectRoute, false, state);
    assert.equal(projection.currentOmen.directRouteReason, undefined, state);
    assert.equal(projection.currentOmen.route, undefined, state);
    assert.deepEqual(projection.hardRoutes, [], state);
  }
});

test('repeated failure exposes one review-oriented route, not a shopping command', () => {
  const projection = project('repeated_underprepared_failure');
  assert.equal(projection.currentOmen.directRouteReason, 'repeated_failure');
  assert.equal(projection.hardRoutes.length, 1);

  const route = projection.hardRoutes[0];
  assert.doesNotMatch(routeText(route), FORBIDDEN_DEFAULT_ROUTE_COPY);
  assert.match(routeText(route), /Review|Inspect|Evidence|Reflection|Pressure/i);
});

test('player-expanded route exposure is explicit policy and not the default builder path', () => {
  const raw = createDaoOmenProjectionRawFixture('medicine_floor_short');

  const defaultProjection = buildDaoOmenProjectionV1(raw, { includeDebug: true });
  assert.equal(defaultProjection.currentOmen.allowDirectRoute, false);

  const expandedDecision = decideDaoOmenDirectRoute('reserve_thin', raw.primaryRoute, {
    playerExpanded: true,
    currentScreen: 'apothecary',
  });
  assert.equal(expandedDecision.allowed, true);
  assert.equal(expandedDecision.exposeRoute, true);
  assert.equal(expandedDecision.reason, 'player_expanded');
});

test('route policy helper hides every ordinary pressure kind by default', () => {
  const route = apothecaryRoute();

  for (const kind of ORDINARY_OMEN_KINDS) {
    assert.equal(isDaoOmenOrdinaryPressure(kind), true, kind);
    const decision = decideDaoOmenDirectRoute(kind, route);
    assert.equal(decision.allowed, false, kind);
    assert.equal(decision.exposeRoute, false, kind);
    assert.equal(decision.reason, undefined, kind);
  }
});

test('old Guidance Oath profiles do not change default route visibility', () => {
  for (const state of ORDINARY_PRESSURE_STATES) {
    const sealed = buildDaoOmenProjectionV1(createDaoOmenProjectionRawFixture(state, 'sealed'), { includeDebug: true });
    const elder = buildDaoOmenProjectionV1(createDaoOmenProjectionRawFixture(state, 'elder'), { includeDebug: true });
    const jade = buildDaoOmenProjectionV1(createDaoOmenProjectionRawFixture(state, 'jade'), { includeDebug: true });

    assert.equal(sealed.currentOmen.kind, jade.currentOmen.kind, state);
    assert.equal(elder.currentOmen.kind, jade.currentOmen.kind, state);
    assert.equal(sealed.currentOmen.allowDirectRoute, jade.currentOmen.allowDirectRoute, state);
    assert.equal(elder.currentOmen.allowDirectRoute, jade.currentOmen.allowDirectRoute, state);
    assert.deepEqual(sealed.hardRoutes.map((route) => route.id), jade.hardRoutes.map((route) => route.id), state);
    assert.deepEqual(elder.hardRoutes.map((route) => route.id), jade.hardRoutes.map((route) => route.id), state);
  }
});

test('projection builder does not mutate raw surfaces', () => {
  const raw = createDaoOmenProjectionRawFixture('attemptable_gate_risky');
  const before = JSON.stringify(raw);

  buildDaoOmenProjectionV1(raw, { includeDebug: true });

  assert.equal(JSON.stringify(raw), before);
});

test('V2 projection production consumers keep direct-route policy bounded', () => {
  const productionSource = [
    readFileSync('src/components/screens/StatusScreen.tsx', 'utf8'),
    readFileSync('src/systems/ui/status/statusV2Surface.ts', 'utf8'),
    readFileSync('src/features/cultivation/exact/buildCultivationExactSurface.ts', 'utf8'),
    readFileSync('src/features/cultivation/exact/useCultivationExactActionController.ts', 'utf8'),
  ].join('\n');

  assert.match(productionSource, /buildDaoOmenProjectionV1/);
  assert.match(productionSource, /allowDirectRoute/);
  assert.doesNotMatch(productionSource, /Open Apothecary|Open Forge|Tune Techniques|Cultivate Qi|Mandate points elsewhere/);
  assert.doesNotMatch(productionSource, /requirementLedger\.(hardGates|readinessFloors|supportReserves|sourceRoutes)/);
});
