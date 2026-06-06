import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  DAO_OMEN_PROJECTION_FIXTURE_STATES,
  buildDaoOmenProjectionV1,
  createDaoOmenProjectionRawFixture,
  type DaoOmenDirectRouteReason,
  type DaoOmenKind,
  type DaoOmenProjectionFixtureState,
  type DaoProofSealKind,
  type DaoPressureBadgeKind,
} from '../../src/systems/ui/daoMandate/index.js';

const EXPECTED_OMEN_KIND: Record<DaoOmenProjectionFixtureState, DaoOmenKind> = {
  life_setup_missing_path: 'life_setup',
  qi_short_before_realm_edge: 'threshold_unreached',
  gate_proof_missing_attemptable: 'proof_missing',
  medicine_floor_short: 'reserve_thin',
  forge_floor_shortfall: 'gear_floor_strained',
  doctrine_gap: 'doctrine_uncertain',
  merit_reserve_low: 'support_reserve_low',
  source_drought_herbs: 'source_drought',
  attemptable_gate_viable: 'attemptable',
  attemptable_gate_risky: 'risky_attempt',
  repeated_underprepared_failure: 'reflection',
  safety_net_ready: 'safety_net_ready',
  breakthrough_ready: 'breakthrough_ready',
  prestige_viable_not_recommended: 'reincarnation_viable',
  content_cap_reached: 'content_cap',
};

const DIRECT_ROUTE_REASONS: Partial<Record<DaoOmenProjectionFixtureState, DaoOmenDirectRouteReason>> = {
  life_setup_missing_path: 'setup',
  gate_proof_missing_attemptable: 'hard_lock',
  attemptable_gate_viable: 'hard_lock',
  attemptable_gate_risky: 'hard_lock',
  repeated_underprepared_failure: 'repeated_failure',
  safety_net_ready: 'safety_net',
  breakthrough_ready: 'breakthrough',
  prestige_viable_not_recommended: 'reincarnation',
  content_cap_reached: 'content_cap',
};

const NON_HARD_STATES: DaoOmenProjectionFixtureState[] = [
  'qi_short_before_realm_edge',
  'medicine_floor_short',
  'forge_floor_shortfall',
  'doctrine_gap',
  'merit_reserve_low',
  'source_drought_herbs',
];

const FORBIDDEN_DEFAULT_COPY =
  /Open Apothecary|Open Forge|Raise Forge|Tune Techniques|Cultivate Qi|Best Next Action|Primary Route|Mandate points elsewhere|Brew Medicine|Launch Expedition/i;

function project(state: DaoOmenProjectionFixtureState, profile: 'sealed' | 'elder' | 'jade' = 'jade') {
  return buildDaoOmenProjectionV1(createDaoOmenProjectionRawFixture(state, profile), {
    includeDebug: true,
    now: 1_777_101,
  });
}

function assertHasProofSeal(state: DaoOmenProjectionFixtureState, kinds: DaoProofSealKind[]): void {
  const projection = project(state);
  assert.equal(
    projection.proofSeals.some((seal) => kinds.includes(seal.kind)),
    true,
    `${state} should include one of proof seals: ${kinds.join(', ')}`,
  );
}

function assertHasPressureBadge(state: DaoOmenProjectionFixtureState, kinds: DaoPressureBadgeKind[]): void {
  const projection = project(state);
  assert.equal(
    projection.pressureBadges.some((badge) => kinds.includes(badge.kind)),
    true,
    `${state} should include one of pressure badges: ${kinds.join(', ')}`,
  );
}

test('DaoOmenProjectionV1 builds bounded projections for every fixture state', () => {
  for (const state of DAO_OMEN_PROJECTION_FIXTURE_STATES) {
    const raw = createDaoOmenProjectionRawFixture(state);
    const projection = buildDaoOmenProjectionV1(raw, { includeDebug: true, now: 1_777_101 });

    assert.equal(projection.projectionVersion, 1);
    assert.equal(projection.generatedAt, 1_777_101);
    assert.equal(projection.sourceSurface.rawSurfaceId, raw.milestone.id);
    assert.equal(projection.sourceSurface.mode, raw.meta.mode);
    assert.equal(projection.currentOmen.id.length > 0, true);
    assert.equal(projection.currentOmen.kind, EXPECTED_OMEN_KIND[state]);
    assert.equal(projection.currentOmen.title.length > 0, true);
    assert.equal(projection.currentOmen.detail.length > 0, true);
    assert.equal(projection.currentOmen.evidenceIds.length > 0, true);
    assert.equal(projection.proofSeals.length > 0, true);
    assert.equal(projection.proofSeals.length <= 4, true);
    assert.equal(projection.pressureBadges.length <= 4, true);
    assert.equal(projection.recentOmens.length <= 3, true);

    for (const seal of projection.proofSeals) {
      assert.equal(seal.id.length > 0, true);
      assert.equal(seal.label.length > 0, true);
      assert.equal(seal.detail.length > 0, true);
      assert.equal(seal.evidenceIds.length > 0, true);
      assert.equal(seal.ownerScreen.length > 0, true);
    }

    for (const badge of projection.pressureBadges) {
      assert.equal(badge.id.length > 0, true);
      assert.equal(badge.label.length > 0, true);
      assert.equal(badge.detail.length > 0, true);
      assert.equal(badge.evidenceIds.length > 0, true);
      assert.equal(badge.ownerScreen.length > 0, true);
    }

    for (const thread of projection.sourceThreads) {
      assert.match(thread.routeVisibility, /^(hidden|drawer|local_owner|hard_lock)$/);
    }

    if (projection.currentOmen.allowDirectRoute) {
      assert.ok(projection.currentOmen.directRouteReason);
      assert.ok(projection.currentOmen.route);
      assert.ok(projection.hardRoutes.some((route) => route.id === projection.currentOmen.route?.id));
    } else {
      assert.equal(projection.currentOmen.directRouteReason, undefined);
      assert.equal(projection.currentOmen.route, undefined);
    }
  }
});

test('DaoOmenProjectionV1 maps every fixture to the expected current omen kind', () => {
  for (const state of DAO_OMEN_PROJECTION_FIXTURE_STATES) {
    assert.equal(project(state).currentOmen.kind, EXPECTED_OMEN_KIND[state], state);
  }
});

test('DaoOmenProjectionV1 suppresses direct routes for ordinary pressure states', () => {
  for (const state of NON_HARD_STATES) {
    const projection = project(state);

    assert.equal(projection.currentOmen.allowDirectRoute, false, state);
    assert.equal(projection.currentOmen.route, undefined, state);
    assert.deepEqual(projection.hardRoutes, [], state);
    assert.equal(
      projection.sourceThreads.every((thread) => thread.routeVisibility !== 'hard_lock'),
      true,
      state,
    );
  }
});

test('DaoOmenProjectionV1 allows direct routes only for hard V2-1 states', () => {
  for (const [state, reason] of Object.entries(DIRECT_ROUTE_REASONS) as [DaoOmenProjectionFixtureState, DaoOmenDirectRouteReason][]) {
    const projection = project(state);

    assert.equal(projection.currentOmen.allowDirectRoute, true, state);
    assert.equal(projection.currentOmen.directRouteReason, reason, state);
    assert.ok(projection.currentOmen.route, state);
    assert.equal(projection.hardRoutes.length <= 1, true, state);
    assert.ok(projection.hardRoutes.some((route) => route.id === projection.currentOmen.route?.id), state);
  }
});

test('DaoOmenProjectionV1 exposes proof seal and pressure badge taxonomy without dumping ledgers', () => {
  assertHasProofSeal('qi_short_before_realm_edge', ['realm_edge', 'qi_threshold']);
  assertHasProofSeal('gate_proof_missing_attemptable', ['gate_proof']);
  assertHasProofSeal('safety_net_ready', ['mercy_seal']);
  assertHasProofSeal('repeated_underprepared_failure', ['failure_reflection']);
  assertHasProofSeal('content_cap_reached', ['reincarnation']);

  assertHasPressureBadge('medicine_floor_short', ['survival']);
  assertHasPressureBadge('forge_floor_shortfall', ['forge']);
  assertHasPressureBadge('doctrine_gap', ['doctrine']);
  assertHasPressureBadge('merit_reserve_low', ['support']);
  assertHasPressureBadge('source_drought_herbs', ['source']);

  const breakthrough = project('breakthrough_ready');
  assert.equal(
    breakthrough.pressureBadges.some((badge) => ['thin', 'strained', 'low'].includes(badge.state)),
    false,
  );
});

test('DaoOmenProjectionV1 keeps source threads closed and reflections meaningful', () => {
  const sourceDrought = project('source_drought_herbs');
  assert.equal(sourceDrought.sourceThreads.length >= 1, true);
  assert.equal(sourceDrought.sourceThreads[0].missingThing.length > 0, true);
  assert.equal(sourceDrought.sourceThreads[0].routeVisibility, 'drawer');
  assert.deepEqual(sourceDrought.hardRoutes, []);

  const reflection = project('repeated_underprepared_failure');
  assert.equal(reflection.reflections.length, 1);
  assert.equal(reflection.reflections[0].evidenceIds.length > 0, true);
  assert.ok(reflection.reflections[0].correctionRoute);
  assert.equal(reflection.hardRoutes.length, 1);
});

test('DaoOmenProjectionV1 keeps forbidden route-led copy out of default omen and hard route fields', () => {
  for (const state of NON_HARD_STATES) {
    const projection = project(state);
    const defaultText = [
      projection.currentOmen.title,
      projection.currentOmen.detail,
      ...projection.hardRoutes.flatMap((route) => [route.label, route.actionLabel, route.detail]),
    ].join(' ');

    assert.doesNotMatch(defaultText, FORBIDDEN_DEFAULT_COPY, state);
  }
});

test('DaoOmenProjectionV1 does not mutate the raw Dao Mandate surface', () => {
  const raw = createDaoOmenProjectionRawFixture('medicine_floor_short');
  const before = JSON.stringify(raw);

  buildDaoOmenProjectionV1(raw, { includeDebug: true });

  assert.equal(JSON.stringify(raw), before);
});

test('DaoOmenProjectionV1 current truth does not change by old Guidance Oath profile', () => {
  for (const state of ['medicine_floor_short', 'forge_floor_shortfall', 'doctrine_gap'] satisfies DaoOmenProjectionFixtureState[]) {
    const sealed = project(state, 'sealed');
    const jade = project(state, 'jade');

    assert.equal(sealed.currentOmen.kind, jade.currentOmen.kind, state);
    assert.equal(sealed.currentOmen.allowDirectRoute, jade.currentOmen.allowDirectRoute, state);
    assert.deepEqual(sealed.hardRoutes.map((route) => route.id), jade.hardRoutes.map((route) => route.id), state);
  }
});

test('DaoOmenProjectionV1 remains internal while Cultivation public consumers stay decommissioned', () => {
  const statusSurface = readFileSync('src/systems/ui/status/statusV2Surface.ts', 'utf8');
  const cultivationSurface = readFileSync('src/features/cultivation/exact/buildCultivationExactSurface.ts', 'utf8');
  const docs = [
    readFileSync('AGENTS.md', 'utf8'),
    readFileSync('docs/release/status_v3_dao_decommission_plan.md', 'utf8'),
  ].join('\n');

  assert.match(statusSurface, /buildDaoOmenProjectionV1/);
  assert.doesNotMatch(cultivationSurface, /buildDaoOmenProjectionV1|currentOmen|proofSeals|pressureBadges|sourceThreads/);
  assert.match(docs, /Packet C[\s\S]*Status|Status[\s\S]*Packet C/i);
  assert.match(docs, /Packet D[\s\S]*Cultivation|Cultivation[\s\S]*Packet D/i);
});

test('DaoOmenProjectionV1 builder and types stay model-only', () => {
  const builderSource = readFileSync('src/systems/ui/daoMandate/buildDaoOmenProjectionV1.ts', 'utf8');
  const typeSource = readFileSync('src/systems/ui/daoMandate/daoOmenProjectionTypes.ts', 'utf8');
  const forbiddenImports =
    /useGameStore|useUIStore|useCombatStore|useTrialStore|usePrestigeStore|RewardService|CombatStore|ActivityStore|components\/screens|MandateChamberHero|RequirementLedger|SourceRouteSlip|features\/.*Screen/;

  assert.doesNotMatch(builderSource, forbiddenImports);
  assert.doesNotMatch(typeSource, forbiddenImports);
});
