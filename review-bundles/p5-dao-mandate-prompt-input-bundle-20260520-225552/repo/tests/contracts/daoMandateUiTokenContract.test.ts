import assert from 'node:assert/strict';
import test from 'node:test';

import type {
  DaoMandateRoute,
  DaoMandateTone,
  DaoRequirementBucket,
  DaoRequirementState,
} from '../../src/systems/ui/daoMandate/index.js';
import {
  describeDaoRouteTarget,
  getDaoMandateMotionClassName,
  getDaoMandateProfileLabel,
  getDaoMandateToneIconId,
  getDaoMandateToneLabel,
  getDaoRequirementBucketLabel,
  getDaoRequirementStateIconId,
  getDaoRequirementStateLabel,
  getDaoRequirementStateTone,
  getDaoRouteButtonViewModel,
  getDaoRouteDisabledReason,
  getDaoRouteReasonElementId,
  isDaoRouteActionable,
  sanitizeDomIdPart,
} from '../../src/ui/daoMandate/daoMandateUiFormatters.js';

const routeBase: DaoMandateRoute = {
  id: 'fixture-route',
  label: 'Open Forge',
  actionLabel: 'Open Forge',
  detail: 'Raise the forge floor.',
  destinationLabel: 'Forge',
  target: { kind: 'world_module', cityId: 'city_pinewind_hamlet', moduleKey: 'forge' },
  blocked: false,
  blockedReason: null,
  expectedDeltaLabel: 'Forge floor improves.',
  source: 'fixture',
  priority: 10,
};

test('Dao Mandate UI tone helpers expose icon and visible labels for every tone', () => {
  const tones = ['neutral', 'muted', 'info', 'success', 'warning', 'danger'] as const satisfies readonly DaoMandateTone[];

  for (const tone of tones) {
    assert.ok(getDaoMandateToneIconId(tone).length > 0, `${tone} should map to a known icon id`);
    assert.ok(getDaoMandateToneLabel(tone).length > 0, `${tone} should map to visible text`);
  }

  assert.equal(getDaoMandateToneIconId('danger'), 'inkX');
  assert.equal(getDaoMandateToneIconId('success'), 'inkCheck');
});

test('Dao Mandate UI bucket and row-state helpers cover all requirement states', () => {
  const buckets = [
    'hard_gate',
    'readiness_floor',
    'support_reserve',
    'source_route',
    'optional_optimization',
    'recent_omen',
  ] as const satisfies readonly DaoRequirementBucket[];
  const states = ['unmet', 'partial', 'met', 'resolved', 'blocked', 'unknown'] as const satisfies readonly DaoRequirementState[];

  assert.deepEqual(buckets.map(getDaoRequirementBucketLabel), [
    'Hard Gate',
    'Readiness Floor',
    'Support Reserve',
    'Source Route',
    'Optional Optimization',
    'Recent Omen',
  ]);

  for (const state of states) {
    assert.ok(getDaoRequirementStateLabel(state).length > 0, `${state} should have a visible label`);
    assert.ok(getDaoRequirementStateIconId(state).length > 0, `${state} should have an icon`);
    assert.ok(getDaoRequirementStateTone(state).length > 0, `${state} should have a tone`);
  }

  assert.equal(getDaoRequirementStateLabel('unmet'), 'Needed');
  assert.equal(getDaoRequirementStateTone('blocked'), 'danger');
});

test('Dao Mandate UI route helpers require actionable target and explain disabled states', () => {
  assert.equal(isDaoRouteActionable(routeBase), true);
  assert.equal(describeDaoRouteTarget(routeBase), 'World module: Forge in city_pinewind_hamlet');
  assert.equal(getDaoRouteDisabledReason(routeBase), null);

  const blocked = {
    ...routeBase,
    blocked: true,
    blockedReason: 'Forge is not available in the current city.',
  } satisfies DaoMandateRoute;
  assert.equal(isDaoRouteActionable(blocked), false);
  assert.equal(getDaoRouteDisabledReason(blocked), 'Forge is not available in the current city.');

  const targetless = {
    ...routeBase,
    id: 'targetless',
    target: null,
  } satisfies DaoMandateRoute;
  assert.equal(isDaoRouteActionable(targetless), false);
  assert.equal(getDaoRouteDisabledReason(targetless), 'Route target unavailable.');
  assert.equal(describeDaoRouteTarget(null), 'No route target');
});

test('Dao Mandate route reason ids include both route id and React id for duplicate route safety', () => {
  const firstId = getDaoRouteReasonElementId('fixture route', ':r1:');
  const secondId = getDaoRouteReasonElementId('fixture route', ':r2:');

  assert.notEqual(firstId, secondId);
  assert.match(firstId, /^dao-route-reason-fixture-route-/);
  assert.match(secondId, /^dao-route-reason-fixture-route-/);
  assert.ok(firstId.endsWith('r1'), 'first id should include sanitized React id');
  assert.ok(secondId.endsWith('r2'), 'second id should include sanitized React id');
});

test('Dao Mandate route button view model uses player-safe unavailable copy', () => {
  const viewModel = getDaoRouteButtonViewModel({
    route: routeBase,
    hasHandler: false,
  });

  assert.equal(viewModel.kind, 'no-handler');
  assert.equal(viewModel.enabled, false);
  assert.equal(viewModel.reason, 'Route action is unavailable from this view.');
  assert.doesNotMatch(viewModel.reason ?? '', /owner|wired|handler/i);
  assert.match(viewModel.ariaLabel, /Route action is unavailable from this view/);
});

test('Dao Mandate UI profile, motion, and DOM id helpers stay stable', () => {
  assert.deepEqual(
    (['sealed', 'elder', 'jade'] as const).map(getDaoMandateProfileLabel),
    ['Sealed Counsel', "Elder's Counsel", 'Jade Slip Tutor'],
  );

  assert.equal(getDaoMandateMotionClassName(), 'daoMandateMotion--medium');
  assert.equal(getDaoMandateMotionClassName('reduced'), 'daoMandateMotion--reduced');
  assert.equal(sanitizeDomIdPart('route / Gate Trial'), 'route-Gate-Trial');
  assert.equal(sanitizeDomIdPart(''), 'dao');
});

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function relativeLuminance(hex: string): number {
  const [red, green, blue] = hexToRgb(hex).map((channel) => {
    const scaled = channel / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const light = Math.max(foregroundLuminance, backgroundLuminance);
  const dark = Math.min(foregroundLuminance, backgroundLuminance);
  return (light + 0.05) / (dark + 0.05);
}

test('Dao Mandate fallback text tokens meet body/meta contrast on parchment', () => {
  const parchment = '#e4d3b7';
  const textTokens = [
    ['ink', '#2a1a10'],
    ['ink-muted', '#6f573f'],
    ['jade-text', '#235640'],
    ['cinnabar-dark', '#6f1e19'],
    ['gold-text', '#7a4f16'],
    ['bronze-text', '#6c4a22'],
  ] as const;

  for (const [label, foreground] of textTokens) {
    assert.ok(
      contrastRatio(foreground, parchment) >= 4.5,
      `${label} should meet 4.5:1 contrast on parchment`,
    );
  }
});
