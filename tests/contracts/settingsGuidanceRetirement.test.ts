import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { mergeWithDefaults } from '../../src/save/defaultSaveState.js';
import {
  applyDaoMandateVisibility,
  createDaoMandateFixture,
  createDefaultDaoMandateGuidanceSettings,
  sanitizeDaoMandateGuidanceSettings,
  type DaoMandateRoute,
  type DaoMandateSurfaceV1,
  type DaoReadinessRow,
  type DaoRequirementRow,
  type DaoSourceMapEntry,
} from '../../src/systems/ui/daoMandate/index.js';

function routeTargetKey(route: DaoMandateRoute): string | null {
  const target = route.target;
  if (!target) return null;
  if (target.kind === 'world_module') return `${target.kind}:${target.moduleKey}`;
  if (target.kind === 'tab') return `${target.kind}:${target.tab}`;
  return null;
}

function routeKey(route: DaoMandateRoute | null | undefined): string | null {
  if (!route) return null;
  return [
    route.id,
    route.label,
    route.destinationLabel,
    routeTargetKey(route),
    route.blocked ? 'blocked' : 'open',
  ].filter(Boolean).join('::');
}

function rowKey(row: DaoRequirementRow): string {
  return [
    row.id,
    row.bucket,
    row.label,
    row.state,
    routeKey(row.route),
  ].filter(Boolean).join('::');
}

function readinessRowKey(row: DaoReadinessRow): string {
  return [
    row.id,
    row.label,
    row.tone,
    routeKey(row.route),
  ].filter(Boolean).join('::');
}

function strategicVisibilityFingerprint(surface: DaoMandateSurfaceV1) {
  const ledger = surface.requirementLedger;
  return {
    guidanceProfile: surface.meta.guidanceProfile,
    primaryRoute: routeKey(surface.primaryRoute),
    secondaryRoutes: surface.secondaryRoutes.map(routeKey),
    ledgerRows: {
      hardGates: ledger.hardGates.map(rowKey),
      readinessFloors: ledger.readinessFloors.map(rowKey),
      supportReserves: ledger.supportReserves.map(rowKey),
      sourceRoutes: ledger.sourceRoutes.map(rowKey),
      optionalOptimizations: ledger.optionalOptimizations.map(rowKey),
      recentOmens: ledger.recentOmens.map(rowKey),
    },
    readinessRows: surface.readiness.rows.map(readinessRowKey),
    sourceMap: surface.sourceMap.map((entry) => [
      entry.id,
      entry.neededThingLabel,
      entry.bestSources.length,
      entry.fallbackSources.length,
      routeKey(entry.route),
    ].join('::')),
    backgroundRoutes: surface.backgroundPlan.routes.map(routeKey),
    recentOmens: surface.recentOmens.map((omen) => `${omen.id}:${omen.source}:${omen.tone}`),
    lessonSlips: surface.lessonSlips.map((slip) => `${slip.conceptId}:${slip.trigger}`),
    localLens: surface.localLens ? `${surface.localLens.screenId}:${surface.localLens.relation}` : null,
    prestigeState: surface.prestige?.state ?? null,
    safetyNetState: surface.safetyNet?.state ?? null,
  };
}

function sourceFingerprint(surface: DaoMandateSurfaceV1) {
  return {
    sourceRoutes: surface.requirementLedger.sourceRoutes.map(rowKey),
    sourceMap: surface.sourceMap.map((entry) => ({
      id: entry.id,
      bestSources: entry.bestSources.map((source) => source.id),
      fallbackSources: entry.fallbackSources.map((source) => source.id),
    })),
  };
}

function sourceRow(surface: DaoMandateSurfaceV1): DaoRequirementRow {
  return {
    id: 'v2-3-source-row',
    bucket: 'source_route',
    label: 'Find missing proof',
    detail: 'A provenance drawer can explain where this proof comes from.',
    currentLabel: null,
    targetLabel: '1 proof',
    state: 'unmet',
    tone: 'warning',
    route: surface.secondaryRoutes[0] ?? surface.primaryRoute,
    source: 'economy',
    proofLine: 'Fixture proof source is missing.',
    sourceLine: 'Fixture source provenance remains available.',
    priority: 10,
  };
}

function sourceMapEntry(surface: DaoMandateSurfaceV1): DaoSourceMapEntry {
  const route = surface.secondaryRoutes[0] ?? surface.primaryRoute;
  return {
    id: 'v2-3-source-map',
    neededThingLabel: 'Missing proof',
    neededThingId: 'v2_3_missing_proof',
    problemKind: 'required_item_missing',
    sinkLabel: 'Gate proof',
    expectedImpactLabel: 'Unblocks proof inspection',
    route,
    bestSources: [{
      id: 'v2-3-best-source',
      label: 'Inspect proof source',
      detail: 'Shows provenance without becoming a default route command.',
      route,
      lockedReason: null,
      activityMode: 'active',
      confidence: 'high',
    }],
    fallbackSources: [{
      id: 'v2-3-fallback-source',
      label: 'Fallback provenance',
      detail: 'Expanded provenance can show this fallback after inspection.',
      route,
      lockedReason: null,
      activityMode: 'background',
      confidence: 'medium',
    }],
  };
}

function withSourceProvenance(surface: DaoMandateSurfaceV1): DaoMandateSurfaceV1 {
  return {
    ...surface,
    primaryRoute: {
      ...surface.primaryRoute,
      source: 'economy',
    },
    obstruction: {
      ...surface.obstruction,
      kind: 'required_item_missing',
      source: 'economy',
    },
    requirementLedger: {
      ...surface.requirementLedger,
      sourceRoutes: [sourceRow(surface)],
    },
    sourceMap: [sourceMapEntry(surface)],
  };
}

test('Settings target retires broad Dao Mandate Interface while preserving ordinary preferences', () => {
  const source = readFileSync('src/components/screens/SettingsScreen.tsx', 'utf8');
  const forbiddenPatterns = [
    /Guidance Oath/,
    /Sealed Counsel/,
    /Elder's Counsel/,
    /Jade Slip Tutor/,
    /Low guidance/,
    /Default guidance/,
    /Maximum guidance/,
    /aria-label="Guidance Oath"/,
    /name="guidanceOath"/,
    /DAO_GUIDANCE_OATH_OPTIONS/,
    /setGuidanceOath/,
  ];

  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(source, pattern);
  }

  const agents = readFileSync('AGENTS.md', 'utf8');
  const releasePlan = readFileSync('docs/release/status_v3_dao_decommission_plan.md', 'utf8');
  assert.match(`${agents}\n${releasePlan}`, /Settings explains ordinary preferences/i);
  assert.match(`${agents}\n${releasePlan}`, /Dao Mandate Interface/i);

  for (const forbidden of [
    /Dao Mandate Interface/,
    /Jade Slip lessons/,
    /Room relation stamps/,
    /Source provenance/,
    /Formula\/detail rows/,
    /Failure reflections/,
    /Background support reminders/,
    /Recent omen memory/,
    /Mandate motion/,
    /one sparse omen-and-proof model/,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});

test('legacy Guidance Oath values sanitize to standard sparse compatibility without losing granular settings', () => {
  const standard = createDefaultDaoMandateGuidanceSettings().guidanceOath;

  for (const oldValue of ['sealed', 'elder', 'jade'] as const) {
    const settings = sanitizeDaoMandateGuidanceSettings({
      guidanceOath: oldValue,
      sourceRouteDetail: 'always',
      advancedReadinessMath: 'expanded',
      jadeSlipLessons: 'off',
      localLensBanners: 'full',
      backgroundReminders: 'full_optimization',
      recentOmensFeed: 'full',
      mandateMotionMode: 'reduced',
    });

    assert.equal(settings.guidanceOath, standard);
    assert.equal(settings.sourceRouteDetail, 'always');
    assert.equal(settings.advancedReadinessMath, 'expanded');
    assert.equal(settings.jadeSlipLessons, 'off');
    assert.equal(settings.localLensBanners, 'full');
    assert.equal(settings.backgroundReminders, 'full_optimization');
    assert.equal(settings.recentOmensFeed, 'full');
    assert.equal(settings.mandateMotionMode, 'reduced');
  }

  const malformed = sanitizeDaoMandateGuidanceSettings({
    guidanceOath: 'maximum',
    sourceRouteDetail: 'always',
    advancedReadinessMath: 'expanded',
  });
  assert.equal(malformed.guidanceOath, standard);
  assert.equal(malformed.sourceRouteDetail, 'always');
  assert.equal(malformed.advancedReadinessMath, 'expanded');
});

test('legacy Guidance Oath save values load as compatibility-only settings', () => {
  const standard = createDefaultDaoMandateGuidanceSettings().guidanceOath;

  for (const guidanceOath of ['sealed', 'elder', 'jade'] as const) {
    const merged = mergeWithDefaults({
      uiSettings: {
        guidanceOath,
        sourceRouteDetail: 'always',
        advancedReadinessMath: 'expanded',
        jadeSlipLessons: 'off',
        mandateMotionMode: 'reduced',
      },
    });

    assert.equal(merged.uiSettings?.guidanceOath, standard);
    assert.equal(merged.uiSettings?.sourceRouteDetail, 'always');
    assert.equal(merged.uiSettings?.advancedReadinessMath, 'expanded');
    assert.equal(merged.uiSettings?.jadeSlipLessons, 'off');
    assert.equal(merged.uiSettings?.mandateMotionMode, 'reduced');
  }
});

test('legacy Guidance Oath values do not change strategic visibility', () => {
  const raw = createDaoMandateFixture('gate_failed', 'jade');
  const sealed = applyDaoMandateVisibility(raw, { settings: { guidanceOath: 'sealed' } });
  const elder = applyDaoMandateVisibility(raw, { settings: { guidanceOath: 'elder' } });
  const jade = applyDaoMandateVisibility(raw, { settings: { guidanceOath: 'jade' } });

  assert.deepEqual(strategicVisibilityFingerprint(sealed), strategicVisibilityFingerprint(elder));
  assert.deepEqual(strategicVisibilityFingerprint(elder), strategicVisibilityFingerprint(jade));
});

test('source provenance visibility follows sourceRouteDetail rather than old profile', () => {
  const raw = withSourceProvenance(createDaoMandateFixture('cultivating_qi_short', 'jade'));

  const sealedNeededOnly = applyDaoMandateVisibility(raw, {
    settings: { guidanceOath: 'sealed', sourceRouteDetail: 'needed_only' },
  });
  const jadeNeededOnly = applyDaoMandateVisibility(raw, {
    settings: { guidanceOath: 'jade', sourceRouteDetail: 'needed_only' },
  });
  assert.deepEqual(sourceFingerprint(sealedNeededOnly), sourceFingerprint(jadeNeededOnly));

  const never = applyDaoMandateVisibility(raw, {
    settings: { guidanceOath: 'elder', sourceRouteDetail: 'never' },
  });
  const always = applyDaoMandateVisibility(raw, {
    settings: { guidanceOath: 'elder', sourceRouteDetail: 'always' },
  });
  assert.notDeepEqual(sourceFingerprint(never), sourceFingerprint(always));
});
