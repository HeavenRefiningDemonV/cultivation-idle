import assert from 'node:assert/strict';
import test from 'node:test';

import type { LiveWorldModuleKey } from '../../src/content/index.js';
import {
  buildDaoMandateModuleSourceSinkSurface,
  buildDaoMandateSurfaceFromRunCompassV2,
  type DaoMandateRoute,
  type DaoMandateSurfaceV1,
} from '../../src/systems/ui/daoMandate/index.js';
import type {
  RunCompassBlockerKindV2,
  RunCompassRouteV2 as RunCompassRoute,
} from '../../src/systems/ui/runCompass/types.js';
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

type ModuleNeedCase = {
  name: string;
  kind: RunCompassBlockerKindV2;
  moduleKey: LiveWorldModuleKey | 'techniques';
  route: RunCompassRoute;
  expectedProblemKind: RegExp;
  expectedNeed: RegExp;
  expectedSink: RegExp;
  expectedImpact: RegExp;
};

function worldRoute(moduleKey: LiveWorldModuleKey, overrides: Partial<RunCompassRoute> = {}): RunCompassRoute {
  return {
    id: `route-${moduleKey}`,
    label: moduleKey === 'gateTrial' ? 'Return to Gate' : `Open ${moduleKey}`,
    actionLabel: moduleKey === 'gateTrial' ? 'Open Gate Trial' : `Open ${moduleKey}`,
    detail: `Route to ${moduleKey} for the current Mandate.`,
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

function tabRoute(tab: 'techniques' | 'inventory', overrides: Partial<RunCompassRoute> = {}): RunCompassRoute {
  return {
    id: `route-${tab}`,
    label: `Open ${tab}`,
    actionLabel: `Open ${tab}`,
    detail: `Route to ${tab} for the current Mandate.`,
    destinationLabel: tab,
    target: { kind: 'tab', tab },
    blocked: false,
    blockedReason: null,
    expectedDeltaLabel: null,
    source: 'readiness',
    priority: 20,
    ...overrides,
  };
}

function makeMandateSurface(args: {
  kind: RunCompassBlockerKindV2;
  primaryRoute: RunCompassRoute;
  secondaryRoutes?: RunCompassRoute[];
  visibleModules?: LiveWorldModuleKey[];
  shortfallLabel?: string | null;
}): DaoMandateSurfaceV1 {
  return buildDaoMandateSurfaceFromRunCompassV2(
    makeRunCompassV2Fixture({
      milestone: {
        id: `preparing:${args.kind}`,
        label: 'Prepare for Novice Clearing',
        detail: 'The current Mandate needs one production support route.',
        state: 'preparing',
        currentRealmLabel: 'Qi Condensation',
        nextRealmLabel: 'Foundation Establishment',
        contextLine: 'Qi Condensation -> Foundation Establishment',
        chapterLine: 'Current city: Pinewind Hamlet',
      },
      primaryBlocker: {
        kind: args.kind,
        label: `P6 ${args.kind}`,
        detail: 'A P6 source/sink fixture is active.',
        severity: 'warning',
        source: args.primaryRoute.source,
        confidence: 'high',
      },
      primaryRoute: args.primaryRoute,
      secondaryRoutes: args.secondaryRoutes ?? [
        worldRoute('outskirts', {
          id: 'fallback-outskirts',
          label: 'Field herb source',
          actionLabel: 'Open Outskirts',
          destinationLabel: 'Outskirts',
          detail: 'Gather broad materials from the field route.',
          source: 'economy',
          priority: 45,
        }),
        worldRoute('expeditions', {
          id: 'fallback-expeditions',
          label: 'Background yield source',
          actionLabel: 'Open Expeditions',
          destinationLabel: 'Expeditions',
          detail: 'Let idle routes smooth the shortage.',
          source: 'economy',
          priority: 55,
        }),
      ],
      readiness: {
        score: 61,
        label: 'Thin',
        band: 'below_recommended',
        diagnosisLabel: 'Needs production support',
        primaryShortfallLabel: args.shortfallLabel ?? null,
        rows: [
          {
            id: `row-${args.kind}`,
            label: 'P6 support row',
            detail: 'The production support row should route through the source map.',
            tone: 'warning',
          },
        ],
      },
      currentCity: {
        cityId: CITY_ID,
        cityName: 'Pinewind Hamlet',
        visibleModuleKeys: args.visibleModules ?? VISIBLE_MODULES,
        recommendedModuleKey: args.primaryRoute.target?.kind === 'world_module'
          ? args.primaryRoute.target.moduleKey
          : null,
      },
    }),
    { guidanceProfile: 'jade', now: 456 },
  );
}

function collectRoutes(surface: DaoMandateSurfaceV1): DaoMandateRoute[] {
  return surface.sourceMap.flatMap((entry) => [
    ...(entry.route ? [entry.route] : []),
    ...entry.bestSources.flatMap((source) => (source.route ? [source.route] : [])),
    ...entry.fallbackSources.flatMap((source) => (source.route ? [source.route] : [])),
  ]);
}

const CASES: ModuleNeedCase[] = [
  {
    name: 'medicine reserve shortfall',
    kind: 'apothecary_prep_shortfall',
    moduleKey: 'apothecary',
    route: worldRoute('apothecary', {
      id: 'primary-apothecary',
      label: 'Prepare medicine reserve',
      actionLabel: 'Open Apothecary',
      destinationLabel: 'Apothecary',
      expectedDeltaLabel: 'Medicine reserve improves.',
      source: 'economy',
      priority: 10,
    }),
    expectedProblemKind: /medicine|apothecary/i,
    expectedNeed: /medicine|reserve/i,
    expectedSink: /gate|reserve|novice clearing/i,
    expectedImpact: /medicine|reserve|gate/i,
  },
  {
    name: 'forge floor shortfall',
    kind: 'forge_floor_shortfall',
    moduleKey: 'forge',
    route: worldRoute('forge', {
      id: 'primary-forge',
      label: 'Raise power floor',
      actionLabel: 'Open Forge',
      destinationLabel: 'Forge',
      expectedDeltaLabel: 'Power floor improves.',
      source: 'readiness',
      priority: 10,
    }),
    expectedProblemKind: /forge|power/i,
    expectedNeed: /power|forge|floor/i,
    expectedSink: /gate|floor|novice clearing/i,
    expectedImpact: /forge|floor|readiness/i,
  },
  {
    name: 'manual knowledge gap',
    kind: 'manual_pavilion_gap',
    moduleKey: 'manualPavilion',
    route: worldRoute('manualPavilion', {
      id: 'primary-manual-pavilion',
      label: 'Find doctrine source',
      actionLabel: 'Open Manual Pavilion',
      destinationLabel: 'Manual Pavilion',
      expectedDeltaLabel: 'Doctrine source found.',
      source: 'readiness',
      priority: 10,
    }),
    expectedProblemKind: /manual|doctrine|knowledge/i,
    expectedNeed: /doctrine|manual|knowledge/i,
    expectedSink: /build|gate|novice clearing/i,
    expectedImpact: /build|knowledge|doctrine/i,
  },
  {
    name: 'technique expression gap',
    kind: 'build_correction_gap',
    moduleKey: 'techniques',
    route: tabRoute('techniques', {
      id: 'primary-techniques',
      label: 'Refine build expression',
      actionLabel: 'Open Techniques',
      destinationLabel: 'Techniques',
      expectedDeltaLabel: 'Build expression improves.',
      source: 'readiness',
      priority: 10,
    }),
    expectedProblemKind: /technique|expression|loadout/i,
    expectedNeed: /build|expression|technique/i,
    expectedSink: /build|gate|novice clearing/i,
    expectedImpact: /build|expression|readiness/i,
  },
  {
    name: 'bounty merit support',
    kind: 'bounty_merit_shortfall',
    moduleKey: 'bounties',
    route: worldRoute('bounties', {
      id: 'primary-bounties',
      label: 'Build Merit reserve',
      actionLabel: 'Open Bounties',
      destinationLabel: 'Bounties',
      expectedDeltaLabel: 'Merit reserve improves.',
      source: 'economy',
      priority: 10,
    }),
    expectedProblemKind: /bounty|merit/i,
    expectedNeed: /merit|bounty/i,
    expectedSink: /safety|reserve|gate/i,
    expectedImpact: /merit|reserve|safety/i,
  },
  {
    name: 'expedition background support',
    kind: 'expedition_shortage_smoothing',
    moduleKey: 'expeditions',
    route: worldRoute('expeditions', {
      id: 'primary-expeditions',
      label: 'Smooth shortage in background',
      actionLabel: 'Open Expeditions',
      destinationLabel: 'Expeditions',
      expectedDeltaLabel: 'Background support improves.',
      source: 'economy',
      priority: 10,
    }),
    expectedProblemKind: /expedition|background|yield/i,
    expectedNeed: /background|expedition|support/i,
    expectedSink: /support|shortage|gate/i,
    expectedImpact: /smooth|background|cultivate/i,
  },
];

test('V2-9 source map emits concrete source/sink entries for production module needs', () => {
  for (const entryCase of CASES) {
    const surface = makeMandateSurface({
      kind: entryCase.kind,
      primaryRoute: entryCase.route,
      shortfallLabel: entryCase.route.label,
    });
    const [entry] = surface.sourceMap;

    assert.ok(entry, `${entryCase.name} should produce a source-map entry`);
    assert.match(entry.problemKind ?? '', entryCase.expectedProblemKind);
    assert.match(entry.neededThingLabel, entryCase.expectedNeed);
    assert.match(entry.sinkLabel, entryCase.expectedSink);
    assert.match(entry.expectedImpactLabel ?? '', entryCase.expectedImpact);
    assert.equal(entry.bestSources.length > 0, true, `${entryCase.name} needs a best source`);
    assert.equal(entry.bestSources[0].route?.id, entryCase.route.id);
    assert.equal(entry.fallbackSources.length > 0, true, `${entryCase.name} needs at least one fallback source in Jade`);
  }
});

test('V2-9 source routes are deterministic and valid or safely blocked', () => {
  const first = makeMandateSurface({
    kind: 'forge_floor_shortfall',
    primaryRoute: worldRoute('forge', { id: 'primary-forge', priority: 10 }),
  });
  const second = makeMandateSurface({
    kind: 'forge_floor_shortfall',
    primaryRoute: worldRoute('forge', { id: 'primary-forge', priority: 10 }),
  });

  assert.deepEqual(first.sourceMap.map((entry) => entry.id), second.sourceMap.map((entry) => entry.id));
  assert.deepEqual(
    first.sourceMap.map((entry) => entry.fallbackSources.map((source) => source.id)),
    second.sourceMap.map((entry) => entry.fallbackSources.map((source) => source.id)),
  );

  for (const route of collectRoutes(first)) {
    if (route.blocked) {
      assert.ok(route.blockedReason, `${route.id} is blocked without a player-safe reason`);
      assert.doesNotMatch(route.blockedReason ?? '', /owner|wired|Packet|TODO|deferred|implementation/i);
      continue;
    }
    assert.ok(route.target, `${route.id} is available without a target`);
    if (route.target?.kind === 'world_module') {
      assert.equal(VISIBLE_MODULES.includes(route.target.moduleKey), true, `${route.id} targets a hidden module`);
    }
  }
});

test('V2-9 source rows use provenance proof copy instead of source-map/scaffold copy', () => {
  const surface = makeMandateSurface({
    kind: 'apothecary_prep_shortfall',
    primaryRoute: worldRoute('apothecary', { id: 'primary-apothecary', source: 'economy', priority: 10 }),
  });
  const proofLines = surface.requirementLedger.sourceRoutes.map((row) => row.proofLine ?? '');

  assert.equal(proofLines.length > 0, true);
  for (const proofLine of proofLines) {
    assert.match(proofLine, /known source provenance/i);
    assert.doesNotMatch(proofLine, /source map|scaffold|Packet|deferred|TODO|implementation/i);
  }
});

test('V2-9 module source/sink surfaces keep modules local instead of becoming Status', () => {
  const surface = makeMandateSurface({
    kind: 'manual_pavilion_gap',
    primaryRoute: worldRoute('manualPavilion', {
      id: 'primary-manual-pavilion',
      label: 'Find doctrine source',
      destinationLabel: 'Manual Pavilion',
      priority: 10,
    }),
  });

  const manual = buildDaoMandateModuleSourceSinkSurface({
    mandate: surface,
    currentCityId: CITY_ID,
    currentModuleKey: 'manualPavilion',
    guidanceProfile: 'elder',
  });
  const bounties = buildDaoMandateModuleSourceSinkSurface({
    mandate: surface,
    currentCityId: CITY_ID,
    currentModuleKey: 'bounties',
    guidanceProfile: 'sealed',
  });
  const records = buildDaoMandateModuleSourceSinkSurface({
    mandate: surface,
    currentCityId: CITY_ID,
    currentModuleKey: 'records',
    guidanceProfile: 'jade',
  });

  assert.equal(manual?.relation, 'primary-evidence');
  assert.match(manual?.headline ?? '', /Doctrine|Manual/i);
  assert.equal(manual?.primaryEntry?.id, surface.sourceMap[0]?.id);
  assert.equal(bounties, null, 'Sealed quiet modules should not show source/sink rows');
  assert.match(records?.headline ?? '', /Evidence|Source memory|Records/i);
  assert.doesNotMatch(`${records?.headline ?? ''} ${records?.detail ?? ''}`, /do this now|best next|primary guide/i);
});

test('V2-9 module source/sink surfaces do not branch on legacy Guidance Oath profile levels', () => {
  const surface = makeMandateSurface({
    kind: 'apothecary_prep_shortfall',
    primaryRoute: worldRoute('apothecary', {
      id: 'primary-apothecary',
      label: 'Prepare medicine reserve',
      destinationLabel: 'Apothecary',
      priority: 10,
    }),
  });

  const profileFingerprint = (profile: 'sealed' | 'elder' | 'jade') => {
    const sourceSink = buildDaoMandateModuleSourceSinkSurface({
      mandate: surface,
      currentCityId: CITY_ID,
      currentModuleKey: 'apothecary',
      guidanceProfile: profile,
    });
    return {
      relation: sourceSink?.relation ?? null,
      headline: sourceSink?.headline ?? null,
      primaryEntryId: sourceSink?.primaryEntry?.id ?? null,
      entries: sourceSink?.entries.map((entry) => ({
        id: entry.id,
        bestSources: entry.bestSources.map((source) => source.id),
        fallbackSources: entry.fallbackSources.map((source) => source.id),
      })) ?? [],
    };
  };

  assert.deepEqual(profileFingerprint('sealed'), profileFingerprint('elder'));
  assert.deepEqual(profileFingerprint('elder'), profileFingerprint('jade'));
});
