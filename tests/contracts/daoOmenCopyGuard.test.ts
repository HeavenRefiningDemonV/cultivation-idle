import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  DAO_OMEN_DEFAULT_COPY,
  DAO_OMEN_KIND_LIST,
  assertDaoOmenCopyBudget,
  buildDaoOmenProjectionV1,
  containsDaoOmenForbiddenDefaultCopy,
  createDaoOmenProjectionRawFixture,
  getDaoOmenDefaultCopy,
  type DaoOmenDirectRouteReason,
  type DaoOmenKind,
  type DaoOmenProjectionFixtureState,
  type DaoOmenProjectionV1,
} from '../../src/systems/ui/daoMandate/index.js';

const ORDINARY_PRESSURE_STATES = [
  'qi_short_before_realm_edge',
  'medicine_floor_short',
  'forge_floor_shortfall',
  'doctrine_gap',
  'merit_reserve_low',
  'source_drought_herbs',
] as const satisfies readonly DaoOmenProjectionFixtureState[];

const ALLOWED_ROUTE_STATES = [
  { state: 'life_setup_missing_path', reason: 'setup', allowed: /Choose|Review|Anchor|Path|Heart Law|Life Setup/i },
  { state: 'gate_proof_missing_attemptable', reason: 'hard_lock', allowed: /Inspect Gate|Review Gate Proof|Gate Trial|Attempt Gate/i },
  { state: 'attemptable_gate_viable', reason: 'hard_lock', allowed: /Inspect Gate|Review Gate Proof|Gate Trial|Attempt Gate/i },
  { state: 'attemptable_gate_risky', reason: 'hard_lock', allowed: /Inspect Gate|Review Gate Proof|Gate Trial|Attempt Gate/i },
  { state: 'repeated_underprepared_failure', reason: 'repeated_failure', allowed: /Review|Inspect|Evidence|Reflection|Pressure/i },
  { state: 'safety_net_ready', reason: 'safety_net', allowed: /Review Mercy Proof|Review Safety Net|Mercy Proof/i },
  { state: 'breakthrough_ready', reason: 'breakthrough', allowed: /Break Through|Enter Next Realm/i },
  { state: 'prestige_viable_not_recommended', reason: 'reincarnation', allowed: /Review Reincarnation|Review Decree/i },
  { state: 'content_cap_reached', reason: 'content_cap', allowed: /Review Records|Review Reincarnation|Review Chapter/i },
] as const satisfies readonly {
  state: DaoOmenProjectionFixtureState;
  reason: DaoOmenDirectRouteReason;
  allowed: RegExp;
}[];

const REQUIRED_COPY: Record<DaoOmenKind, { title: RegExp; detail: RegExp }> = {
  quiet: { title: /No pressure/i, detail: /No pressure/i },
  life_setup: { title: /Doctrine anchor/i, detail: /no doctrine anchor/i },
  threshold_unreached: { title: /Realm edge/i, detail: /gate remains silent/i },
  proof_missing: { title: /Gate proof/i, detail: /proof has not been sealed/i },
  reserve_thin: { title: /Survival reserve/i, detail: /reserve looks thin/i },
  gear_floor_strained: { title: /Weapon floor/i, detail: /weapon floor is under pressure/i },
  doctrine_uncertain: { title: /Doctrine expression/i, detail: /expression looks incomplete/i },
  support_reserve_low: { title: /Background support/i, detail: /support looks thin/i },
  currency_reserve_low: { title: /Mercy reserve/i, detail: /mercy reserve is low/i },
  source_drought: { title: /Source thread/i, detail: /source thread has run dry/i },
  attemptable: { title: /Gate open/i, detail: /open to an attempt/i },
  risky_attempt: { title: /Gate open/i, detail: /proof feels thin/i },
  reflection: { title: /Pattern repeated/i, detail: /same pattern has appeared again/i },
  safety_net_ready: { title: /Mercy proof/i, detail: /mercy proof can now be sealed/i },
  breakthrough_ready: { title: /Breakthrough proof/i, detail: /Qi and proof are sealed/i },
  reincarnation_viable: { title: /Reincarnation viable/i, detail: /permanent progress/i },
  content_cap: { title: /Authored chapter/i, detail: /authored chapter is complete/i },
};

const FORBIDDEN_ROUTE_COPY =
  /Open Apothecary|Restock Apothecary|Brew Medicine|Stock Healing|Open Forge|Raise Forge|Refine Weapon|Temper Gear|Tune Techniques|Open Techniques|Equip Iron Palm|Change AI|Cultivate Qi|Go Cultivate|Launch Expedition|Run Ruins|Farm Outskirts|Go to Bounties|Primary Route|Best Next Action|Biggest Shortfall|Mandate points elsewhere|Current Mandate Primary Route|Mandate Chamber Primary Route|route-led|do this now|must go/i;

function project(state: DaoOmenProjectionFixtureState): DaoOmenProjectionV1 {
  return buildDaoOmenProjectionV1(createDaoOmenProjectionRawFixture(state), {
    includeDebug: true,
    now: 1_777_222,
  });
}

function collectProjectionDefaultText(projection: DaoOmenProjectionV1): string {
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

function routeDisplayText(projection: DaoOmenProjectionV1): string {
  return projection.hardRoutes
    .map((route) => `${route.label} ${route.actionLabel} ${route.detail} ${route.destinationLabel}`)
    .join(' ');
}

test('default Omen copy dictionary covers every Omen kind', () => {
  assert.deepEqual(
    Object.keys(DAO_OMEN_DEFAULT_COPY).sort(),
    [...DAO_OMEN_KIND_LIST].sort(),
  );

  for (const kind of DAO_OMEN_KIND_LIST) {
    const copy = getDaoOmenDefaultCopy(kind);
    assert.match(copy.title, REQUIRED_COPY[kind].title, kind);
    assert.match(copy.detail, REQUIRED_COPY[kind].detail, kind);
    assert.equal(assertDaoOmenCopyBudget(copy), true, kind);
    assert.equal(containsDaoOmenForbiddenDefaultCopy(`${copy.title} ${copy.detail}`), false, kind);
    assert.doesNotMatch(`${copy.title} ${copy.detail}`, FORBIDDEN_ROUTE_COPY, kind);
  }
});

test('default Omen copy stays compact enough for first-layer UI', () => {
  for (const kind of DAO_OMEN_KIND_LIST) {
    const copy = getDaoOmenDefaultCopy(kind);

    assert.equal(copy.title.length <= 40, true, `${kind} title too long`);
    assert.equal(copy.detail.length <= 130, true, `${kind} detail too long`);
    assert.equal(copy.title.includes('\n'), false, kind);
    assert.equal(copy.detail.includes('\n'), false, kind);
  }
});

test('ordinary pressure default projection text does not include route commands', () => {
  for (const state of ORDINARY_PRESSURE_STATES) {
    const projection = project(state);
    const defaultText = collectProjectionDefaultText(projection);

    assert.equal(projection.currentOmen.allowDirectRoute, false, state);
    assert.deepEqual(projection.hardRoutes, [], state);
    assert.equal(containsDaoOmenForbiddenDefaultCopy(defaultText), false, state);
    assert.doesNotMatch(defaultText, FORBIDDEN_ROUTE_COPY, state);
  }
});

test('copy guard ignores debug-only suppression notes', () => {
  const projection = project('medicine_floor_short');
  assert.ok(projection.debug?.notes.length);

  const defaultText = collectProjectionDefaultText(projection);
  const debugText = projection.debug.notes.join(' ');

  assert.doesNotMatch(defaultText, FORBIDDEN_ROUTE_COPY);
  assert.notEqual(debugText.length, 0);
});

test('allowed hard-route fixtures use reason-specific public language', () => {
  for (const testCase of ALLOWED_ROUTE_STATES) {
    const projection = project(testCase.state);
    const routeText = routeDisplayText(projection);

    assert.equal(projection.currentOmen.directRouteReason, testCase.reason, testCase.state);
    assert.equal(routeText.length > 0, true, testCase.state);
    assert.match(routeText, testCase.allowed, testCase.state);
    assert.doesNotMatch(routeText, /Open Apothecary|Open Forge|Tune Techniques|Go to Bounties|Launch Expedition|Run Ruins|Cultivate Qi/i, testCase.state);
  }
});

test('source threads remain provenance, not default instructions', () => {
  const projection = project('source_drought_herbs');
  assert.equal(projection.sourceThreads.length >= 1, true);
  assert.equal(projection.sourceThreads.every((thread) => thread.routeVisibility !== 'hard_lock'), true);

  const defaultText = collectProjectionDefaultText(projection);
  assert.match(defaultText, /Source thread|Herbs|Medicine reserve/i);
  assert.doesNotMatch(defaultText, /Launch Expedition|Run Ruins|Farm Outskirts|Open Apothecary/i);
});

test('Omen Projection defaults exclude old route-led vocabulary', () => {
  const allDefaultCopy = DAO_OMEN_KIND_LIST
    .map((kind) => {
      const copy = getDaoOmenDefaultCopy(kind);
      return `${copy.title} ${copy.detail}`;
    })
    .join(' ');

  assert.doesNotMatch(allDefaultCopy, /Mandate points elsewhere/i);
  assert.doesNotMatch(allDefaultCopy, /Primary Route|Best Next Action|Biggest Shortfall/i);
  assert.doesNotMatch(allDefaultCopy, /route-led|do this now|must go/i);
});

test('safety net and content cap copy stay honest and non-shaming', () => {
  const safetyNet = getDaoOmenDefaultCopy('safety_net_ready');
  const contentCap = getDaoOmenDefaultCopy('content_cap');

  assert.match(`${safetyNet.title} ${safetyNet.detail}`, /Mercy proof/i);
  assert.doesNotMatch(`${safetyNet.title} ${safetyNet.detail}`, /pity|shame|failed enough|bail out/i);

  assert.match(`${contentCap.title} ${contentCap.detail}`, /authored chapter/i);
  assert.doesNotMatch(`${contentCap.title} ${contentCap.detail}`, /hidden content|future grind|keep grinding/i);
});

test('V2-2 copy and route policy modules stay model-only', () => {
  const sources = [
    readFileSync('src/systems/ui/daoMandate/daoOmenCopy.ts', 'utf8'),
    readFileSync('src/systems/ui/daoMandate/daoOmenPriority.ts', 'utf8'),
    readFileSync('src/systems/ui/daoMandate/buildDaoOmenProjectionV1.ts', 'utf8'),
  ].join('\n');
  const forbidden =
    /from ['"].*react|React\b|\.tsx|useGameStore|useUIStore|useCombatStore|useTrialStore|usePrestigeStore|RewardService|CombatStore|ActivityStore|TrialStore|PrestigeResetService|components\/screens|src\/ui|features\/.*Screen|window\b|document\b|localStorage|fetch\b|XMLHttpRequest|eval\b|Function\(|child_process|fs\.writeFile|grantRewards|spendCurrency|recordFailure|markCleared|markBypassed|resetPrestige/;

  assert.doesNotMatch(sources, forbidden);
});
