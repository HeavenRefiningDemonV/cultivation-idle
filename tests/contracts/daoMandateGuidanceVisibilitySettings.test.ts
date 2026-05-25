import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyDaoMandateVisibility,
  createDaoMandateFixture,
  createDefaultDaoMandateGuidanceSettings,
  type DaoLocalLensSurface,
  type DaoMandateObstructionKind,
  type DaoMandateRouteSource,
  type DaoMandateSurfaceV1,
  type DaoRequirementRow,
  type DaoSourceMapEntry,
} from '../../src/systems/ui/daoMandate/index.js';

function visibleLedgerRows(surface: DaoMandateSurfaceV1) {
  return [
    ...surface.requirementLedger.hardGates,
    ...surface.requirementLedger.readinessFloors,
    ...surface.requirementLedger.supportReserves,
    ...surface.requirementLedger.sourceRoutes,
    ...surface.requirementLedger.optionalOptimizations,
    ...surface.requirementLedger.recentOmens,
  ];
}

function routeKey(route: DaoMandateSurfaceV1['primaryRoute'] | null | undefined): string | null {
  if (!route) return null;
  return [
    route.id,
    route.label,
    route.destinationLabel,
    route.target?.kind,
    route.blocked ? 'blocked' : 'open',
  ].filter(Boolean).join('::');
}

function strategicFingerprint(surface: DaoMandateSurfaceV1) {
  return {
    guidanceProfile: surface.meta.guidanceProfile,
    secondaryRoutes: surface.secondaryRoutes.map(routeKey),
    ledgerRows: visibleLedgerRows(surface).map((row) => `${row.id}:${row.bucket}:${row.state}:${routeKey(row.route)}`),
    readinessRows: surface.readiness.rows.map((row) => `${row.id}:${row.label}:${row.tone}:${routeKey(row.route)}`),
    sourceMap: surface.sourceMap.map((entry) => `${entry.id}:${entry.bestSources.length}:${entry.fallbackSources.length}`),
    backgroundRoutes: surface.backgroundPlan.routes.map(routeKey),
    recentOmens: surface.recentOmens.map((omen) => `${omen.id}:${omen.source}:${omen.tone}`),
    lessonSlips: surface.lessonSlips.map((slip) => `${slip.conceptId}:${slip.trigger}`),
    localLens: surface.localLens?.relation ?? null,
    prestige: surface.prestige?.state ?? null,
  };
}

function assertTruthInvariant(raw: DaoMandateSurfaceV1, filtered: DaoMandateSurfaceV1) {
  assert.equal(filtered.milestone.id, raw.milestone.id);
  assert.equal(filtered.milestone.state, raw.milestone.state);
  assert.equal(filtered.milestone.label, raw.milestone.label);
  assert.equal(filtered.obstruction.kind, raw.obstruction.kind);
  assert.equal(filtered.obstruction.label, raw.obstruction.label);
  assert.equal(filtered.obstruction.source, raw.obstruction.source);
  assert.equal(filtered.primaryRoute.id, raw.primaryRoute.id);
  assert.equal(filtered.primaryRoute.blocked, raw.primaryRoute.blocked);
  assert.equal(filtered.primaryRoute.blockedReason, raw.primaryRoute.blockedReason);
  assert.equal(filtered.primaryRoute.source, raw.primaryRoute.source);
  assert.deepEqual(filtered.primaryRoute.target, raw.primaryRoute.target);
  assert.equal(filtered.safetyNet?.state ?? null, raw.safetyNet?.state ?? null);
  assert.equal(filtered.prestige?.state ?? null, raw.prestige?.state ?? null);
}

function withLocalLens(
  surface: DaoMandateSurfaceV1,
  relation: DaoLocalLensSurface['relation'] = 'supporting-source',
): DaoMandateSurfaceV1 {
  return {
    ...surface,
    localLens: {
      screenId: 'apothecary',
      relation,
      label: 'Apothecary supports the current Mandate',
      detail: 'Medicine reserves can raise readiness without changing the primary route.',
      route: surface.primaryRoute,
      evidenceIds: ['fixture.localLens'],
    },
  };
}

function sourceRouteRow(surface: DaoMandateSurfaceV1, state: DaoRequirementRow['state']): DaoRequirementRow {
  return {
    id: `source-route-${state}`,
    bucket: 'source_route',
    label: 'Find the missing catalyst',
    detail: 'A source route is available for the missing proof item.',
    currentLabel: null,
    targetLabel: '1 catalyst',
    state,
    tone: state === 'met' ? 'success' : 'warning',
    route: surface.secondaryRoutes[0] ?? surface.primaryRoute,
    source: 'economy',
    proofLine: 'Fixture source-route proof.',
    sourceLine: 'Fixture source-route line.',
    priority: 10,
  };
}

function sourceMapEntry(surface: DaoMandateSurfaceV1): DaoSourceMapEntry {
  const route = surface.secondaryRoutes[0] ?? surface.primaryRoute;
  return {
    id: 'source-map-missing-catalyst',
    neededThingLabel: 'Missing catalyst',
    neededThingId: 'fixture_catalyst',
    problemKind: 'required_item_missing',
    sinkLabel: 'Gate proof',
    expectedImpactLabel: 'Unlocks the next attempt',
    route,
    bestSources: [{
      id: 'source-option-apothecary',
      label: 'Prepare the catalyst',
      detail: 'Use the existing source route to collect the proof item.',
      route,
      lockedReason: null,
      activityMode: 'active',
      confidence: 'high',
    }],
    fallbackSources: [],
  };
}

function withSourceRouteDetail(
  surface: DaoMandateSurfaceV1,
  args: {
    primarySource: DaoMandateRouteSource;
    obstructionKind: DaoMandateObstructionKind;
    sourceRouteState?: DaoRequirementRow['state'];
  },
): DaoMandateSurfaceV1 {
  return {
    ...surface,
    primaryRoute: {
      ...surface.primaryRoute,
      source: args.primarySource,
    },
    obstruction: {
      ...surface.obstruction,
      kind: args.obstructionKind,
      source: args.primarySource,
    },
    requirementLedger: {
      ...surface.requirementLedger,
      sourceRoutes: args.sourceRouteState ? [sourceRouteRow(surface, args.sourceRouteState)] : [],
    },
    sourceMap: [sourceMapEntry(surface)],
  };
}

test('Dao Mandate visibility accepts profile compatibility and settings objects', () => {
  const raw = createDaoMandateFixture('attemptable_gate', 'jade');
  const fromProfile = applyDaoMandateVisibility(raw, { profile: 'sealed' });
  const fromSettings = applyDaoMandateVisibility(raw, { settings: { guidanceOath: 'sealed' } });

  assertTruthInvariant(raw, fromProfile);
  assertTruthInvariant(raw, fromSettings);
  assert.deepEqual(strategicFingerprint(fromSettings), strategicFingerprint(fromProfile));
  assert.equal(fromSettings.meta.guidanceProfile, 'elder');
});

test('legacy Guidance Oath profiles do not change visible Mandate strategy', () => {
  const raw = createDaoMandateFixture('gate_failed', 'jade');
  const sealed = applyDaoMandateVisibility(raw, { settings: { guidanceOath: 'sealed' } });
  const elder = applyDaoMandateVisibility(raw, { settings: { guidanceOath: 'elder' } });
  const jade = applyDaoMandateVisibility(raw, { settings: { guidanceOath: 'jade' } });

  assertTruthInvariant(raw, sealed);
  assertTruthInvariant(raw, elder);
  assertTruthInvariant(raw, jade);
  assert.deepEqual(strategicFingerprint(sealed), strategicFingerprint(elder));
  assert.deepEqual(strategicFingerprint(elder), strategicFingerprint(jade));
});

test('Dao Mandate granular visibility settings filter optional detail deterministically', () => {
  const raw = withLocalLens(createDaoMandateFixture('cultivating_qi_short', 'jade'));
  const hidden = applyDaoMandateVisibility(raw, {
    settings: {
      ...createDefaultDaoMandateGuidanceSettings(),
      guidanceOath: 'jade',
      jadeSlipLessons: 'off',
      localLensBanners: 'hidden',
      sourceRouteDetail: 'never',
      advancedReadinessMath: 'off',
      recentOmensFeed: 'hidden',
    },
  });

  assertTruthInvariant(raw, hidden);
  assert.equal(hidden.lessonSlips.length, 0);
  assert.equal(hidden.localLens, null);
  assert.equal(hidden.sourceMap.length, 0);
  assert.equal(hidden.readiness.score, raw.readiness.score);
  assert.equal(hidden.readiness.label, raw.readiness.label);
  assert.equal(hidden.readiness.rows.length, 0);
  assert.equal(hidden.recentOmens.length, 0);
  assert.equal(hidden.requirementLedger.recentOmens.length, 0);
});

test('compact local lens visibility is granular and profile-invariant', () => {
  for (const relation of ['primary-evidence', 'blocked', 'supporting-source', 'completed'] as const) {
    const raw = withLocalLens(createDaoMandateFixture('cultivating_qi_short', 'jade'), relation);
    const sealed = applyDaoMandateVisibility(raw, {
      settings: { guidanceOath: 'sealed', localLensBanners: 'compact' },
    });
    const jade = applyDaoMandateVisibility(raw, {
      settings: { guidanceOath: 'jade', localLensBanners: 'compact' },
    });

    assertTruthInvariant(raw, sealed);
    assertTruthInvariant(raw, jade);
    assert.equal(sealed.localLens?.relation, relation);
    assert.equal(jade.localLens?.relation, relation);
  }

  for (const relation of ['quiet'] as const) {
    const raw = withLocalLens(createDaoMandateFixture('cultivating_qi_short', 'jade'), relation);
    const filtered = applyDaoMandateVisibility(raw, {
      settings: { guidanceOath: 'sealed', localLensBanners: 'compact' },
    });

    assertTruthInvariant(raw, filtered);
    assert.equal(filtered.localLens, null);
  }
});

test('Local lens banner settings override profile density deterministically', () => {
  const raw = withLocalLens(createDaoMandateFixture('cultivating_qi_short', 'jade'), 'supporting-source');

  for (const guidanceOath of ['sealed', 'elder', 'jade'] as const) {
    const hidden = applyDaoMandateVisibility(raw, {
      settings: { guidanceOath, localLensBanners: 'hidden' },
    });
    assertTruthInvariant(raw, hidden);
    assert.equal(hidden.localLens, null);
  }

  const sealedFull = applyDaoMandateVisibility(raw, {
    settings: { guidanceOath: 'sealed', localLensBanners: 'full' },
  });
  const elderCompact = applyDaoMandateVisibility(raw, {
    settings: { guidanceOath: 'elder', localLensBanners: 'compact' },
  });
  const sealedCompact = applyDaoMandateVisibility(raw, {
    settings: { guidanceOath: 'sealed', localLensBanners: 'compact' },
  });

  assert.equal(sealedFull.localLens?.relation, 'supporting-source');
  assert.equal(elderCompact.localLens?.relation, 'supporting-source');
  assert.equal(sealedCompact.localLens?.relation, 'supporting-source');
});

test('Dao Mandate source and background toggles preserve or cap detail by setting', () => {
  const raw = createDaoMandateFixture('cultivating_qi_short', 'jade');
  const sourceNever = applyDaoMandateVisibility(raw, {
    settings: { guidanceOath: 'jade', sourceRouteDetail: 'never' },
  });
  const sourceAlways = applyDaoMandateVisibility(raw, {
    settings: { guidanceOath: 'jade', sourceRouteDetail: 'always' },
  });
  const criticalBackground = applyDaoMandateVisibility(raw, {
    settings: { guidanceOath: 'jade', backgroundReminders: 'critical_idle_only' },
  });
  const normalBackground = applyDaoMandateVisibility(raw, {
    settings: { guidanceOath: 'jade', backgroundReminders: 'normal' },
  });
  const fullBackground = applyDaoMandateVisibility(raw, {
    settings: { guidanceOath: 'jade', backgroundReminders: 'full_optimization' },
  });

  assert.equal(sourceNever.sourceMap.length, 0);
  assert.equal(sourceAlways.sourceMap.length, raw.sourceMap.length);
  assert.equal(criticalBackground.backgroundPlan.routes.length <= normalBackground.backgroundPlan.routes.length, true);
  assert.equal(fullBackground.backgroundPlan.routes.length >= normalBackground.backgroundPlan.routes.length, true);
});

test('Needed-only source detail keeps actionable source evidence beyond primary route source', () => {
  const raw = withSourceRouteDetail(createDaoMandateFixture('attemptable_gate', 'jade'), {
    primarySource: 'progression',
    obstructionKind: 'attempt_gate_now',
    sourceRouteState: 'unmet',
  });
  const filtered = applyDaoMandateVisibility(raw, {
    settings: { guidanceOath: 'jade', sourceRouteDetail: 'needed_only' },
  });

  assertTruthInvariant(raw, filtered);
  assert.equal(filtered.sourceMap.length, 1);
  assert.equal(filtered.requirementLedger.sourceRoutes.length, 1);
});

test('Needed-only source detail keeps source-obvious obstructions and hides optional source detail', () => {
  const requiredItem = withSourceRouteDetail(createDaoMandateFixture('attemptable_gate', 'jade'), {
    primarySource: 'trial_lifecycle',
    obstructionKind: 'required_item_missing',
  });
  const optional = withSourceRouteDetail(createDaoMandateFixture('attemptable_gate', 'jade'), {
    primarySource: 'progression',
    obstructionKind: 'attempt_gate_now',
    sourceRouteState: 'met',
  });

  const kept = applyDaoMandateVisibility(requiredItem, {
    settings: { guidanceOath: 'jade', sourceRouteDetail: 'needed_only' },
  });
  const hidden = applyDaoMandateVisibility(optional, {
    settings: { guidanceOath: 'jade', sourceRouteDetail: 'needed_only' },
  });

  assertTruthInvariant(requiredItem, kept);
  assertTruthInvariant(optional, hidden);
  assert.equal(kept.sourceMap.length, 1);
  assert.equal(hidden.sourceMap.length, 0);
  assert.equal(hidden.requirementLedger.sourceRoutes.length, 0);
});

test('Dao Mandate visibility filtering does not mutate the raw surface', () => {
  const raw = withLocalLens(createDaoMandateFixture('gate_failed', 'jade'));
  const before = JSON.stringify(raw);

  applyDaoMandateVisibility(raw, {
    settings: {
      guidanceOath: 'sealed',
      jadeSlipLessons: 'off',
      sourceRouteDetail: 'never',
      recentOmensFeed: 'hidden',
      localLensBanners: 'hidden',
    },
  });

  assert.equal(JSON.stringify(raw), before);
});
