import assert from 'node:assert/strict';
import test from 'node:test';

import { validateProgressionSemantics } from '../../src/systems/progression/validation/index.js';
import {
  buildLiveCityPackageRegistry,
  formatLiveCityPackageCoverageIssue,
} from '../../src/systems/world/cityPackageRegistry.js';
import type { CityDef } from '../../src/content/types.js';
import {
  DEFERRED_WORLD_MODULES,
  inspectLiveCitySchema,
  LIVE_CITY_MODULE_ORDER,
  normalizeCityModulesForLiveSlice,
  REQUIRED_CITY_REFS_FOR_LIVE_SLICE,
} from '../../src/systems/world/liveWorldSchema.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

const readCities = async () => {
  const rawContent = await loadRawProgressionContent();
  return {
    rawContent,
    cities: (Array.isArray(rawContent.cities) ? rawContent.cities : rawContent.cities.cities).map(
      (city): CityDef => ({
        id: city.id,
        index: city.index ?? 0,
        name: city.name ?? city.id,
        unlockMajorRealm: city.unlockMajorRealm,
        modules: city.modules ?? [],
        refs: (city.refs ?? {}) as CityDef['refs'],
        themeTags: city.themeTags,
      }),
    ),
  };
};

test('live world schema helper exposes the canonical packet 2.1 module truth', () => {
  assert.deepEqual(LIVE_CITY_MODULE_ORDER, [
    'outskirts',
    'ruins',
    'gateTrial',
    'manualPavilion',
    'apothecary',
    'forge',
    'bounties',
    'expeditions',
  ]);
  assert.equal(DEFERRED_WORLD_MODULES.includes('alchemy'), true);
  assert.equal(DEFERRED_WORLD_MODULES.includes('talismanStudio'), true);
  assert.deepEqual(
    normalizeCityModulesForLiveSlice([
      'forge',
      'ruins',
      'alchemy',
      'outskirts',
      'ruins',
      'totally_fake_module',
      'expeditions',
      'gateTrial',
      'manualPavilion',
      'bounties',
      'apothecary',
    ]),
    [
      'outskirts',
      'ruins',
      'gateTrial',
      'manualPavilion',
      'apothecary',
      'forge',
      'bounties',
      'expeditions',
    ],
  );
});

test('real authored live cities already match the canonical packet 2.1 schema', async () => {
  const { rawContent, cities } = await readCities();
  const packageRegistry = buildLiveCityPackageRegistry({
    cities,
    outskirtsById: Object.fromEntries((Array.isArray(rawContent.outskirts) ? rawContent.outskirts : rawContent.outskirts?.outskirts ?? []).map((entry) => [entry.id, entry])),
    trialsById: Object.fromEntries((Array.isArray(rawContent.trials) ? rawContent.trials : rawContent.trials.trials).map((entry) => [entry.id, entry])),
    ruinsById: Object.fromEntries((Array.isArray(rawContent.ruins) ? rawContent.ruins : rawContent.ruins?.ruins ?? []).map((entry) => [entry.id, entry])),
    pavilionsById: Object.fromEntries((Array.isArray(rawContent.pavilions) ? rawContent.pavilions : rawContent.pavilions?.pavilions ?? []).map((entry) => [entry.id, entry])),
    apothecaryById: Object.fromEntries((Array.isArray(rawContent.apothecary_shops) ? rawContent.apothecary_shops : rawContent.apothecary_shops?.shops ?? []).map((entry) => [entry.id, entry])),
  });

  assert.equal(cities.length, 5);
  assert.equal(packageRegistry.coverageIssues.length, 0);
  assert.equal(Object.keys(packageRegistry.packagesByCityId).length, cities.length);

  cities.forEach((city) => {
    assert.deepEqual(city.modules ?? [], LIVE_CITY_MODULE_ORDER);
    const drift = inspectLiveCitySchema({
      modules: city.modules ?? [],
      refs: city.refs ?? {},
    });
    assert.deepEqual(drift.deferredModulesPresent, []);
    assert.deepEqual(drift.missingRequiredRefs, []);
    assert.equal(drift.canonicalOverall, true);
    REQUIRED_CITY_REFS_FOR_LIVE_SLICE.forEach((refKey) => {
      assert.equal(typeof city.refs?.[refKey], 'string');
      assert.equal((city.refs?.[refKey] ?? '').length > 0, true);
    });
  });
});

test('semantic validator reports packet 2.1 world city schema drift for broken authored city schema only', async () => {
  const { rawContent, cities } = await readCities();
  const currentIssues = validateProgressionSemantics({
    rawContent,
    scenarios: [],
    migrationFixtures: [],
  });
  assert.equal(currentIssues.some((issue) => issue.category === 'WORLD_CITY_SCHEMA_DRIFT'), false);

  const brokenRawContent = structuredClone(rawContent);
  const brokenCities = Array.isArray(brokenRawContent.cities)
    ? brokenRawContent.cities
    : brokenRawContent.cities.cities;
  const brokenCity = brokenCities.find((city) => city.id === 'city_pinewind_hamlet') ?? brokenCities[0];
  assert.ok(brokenCity);

  brokenCity.modules = [
    'forge',
    'outskirts',
    'manualPavilion',
    'gateTrial',
    'alchemy',
    'forge',
    'bounties',
    'expeditions',
  ];
  if (brokenCity.refs) {
    delete brokenCity.refs.ruinId;
  }

  const issues = validateProgressionSemantics({
    rawContent: brokenRawContent,
    scenarios: [],
    migrationFixtures: [],
  });
  const schemaIssue = issues.find((issue) => issue.category === 'WORLD_CITY_SCHEMA_DRIFT');

  assert.ok(schemaIssue);
  assert.equal(schemaIssue.suggestedOwnerPacket, '2.1');
  assert.equal(schemaIssue.id, 'world-city-schema-city_pinewind_hamlet');
  assert.equal(schemaIssue.autoFixable, true);
  assert.match(schemaIssue.summary, /canonical live semester city schema/i);
  assert.match(schemaIssue.fixStrategySummary, /normalize city\.modules to LIVE_CITY_MODULE_ORDER/i);
  assert.match(schemaIssue.fixStrategySummary, /remove deferred modules/i);
  assert.match(schemaIssue.fixStrategySummary, /required live refs/i);

  const evidenceText = schemaIssue.evidence.map((entry) => entry.detail).join(' | ');
  assert.match(evidenceText, /missing live modules: ruins/i);
  assert.match(evidenceText, /duplicate modules: forge/i);
  assert.match(evidenceText, /deferred modules present: alchemy/i);
  assert.match(evidenceText, /module order does not match canonical order/i);
  assert.match(evidenceText, /missing required live refs: ruinId/i);
  assert.equal(evidenceText.includes('packet 1.8'), false);
  assert.equal(evidenceText.includes('offline'), false);

  assert.equal(cities.some((city) => city.id === 'city_pinewind_hamlet'), true);
});

test('semantic validator reports packet 2.7 city package coverage drift when a live city ref target is missing', async () => {
  const { rawContent } = await readCities();
  const brokenRawContent = structuredClone(rawContent);
  const brokenCities = Array.isArray(brokenRawContent.cities)
    ? brokenRawContent.cities
    : brokenRawContent.cities.cities;
  const brokenCity = brokenCities.find((city) => city.id === 'city_pinewind_hamlet') ?? brokenCities[0];
  assert.ok(brokenCity);

  brokenCity.refs = { ...(brokenCity.refs ?? {}), ruinId: 'ruin_missing_for_packet_2_7' };

  const issues = validateProgressionSemantics({
    rawContent: brokenRawContent,
    scenarios: [],
    migrationFixtures: [],
  });
  const coverageIssue = issues.find((issue) => issue.category === 'WORLD_CITY_PACKAGE_COVERAGE');

  assert.ok(coverageIssue);
  assert.equal(coverageIssue.suggestedOwnerPacket, '2.7');
  assert.equal(coverageIssue.id, 'world-city-package-city_pinewind_hamlet-ruinId');
  assert.equal(coverageIssue.autoFixable, true);
  assert.match(coverageIssue.summary, /complete live city package/i);
  assert.match(coverageIssue.fixStrategySummary, /packet 2\.7 city-package coverage/i);
  assert.match(coverageIssue.evidence[0]?.detail ?? '', /refs\.ruinId missing in ruins/i);

  assert.equal(
    formatLiveCityPackageCoverageIssue({
      cityId: 'city_pinewind_hamlet',
      refKey: 'ruinId',
      targetId: 'ruin_missing_for_packet_2_7',
      targetCollectionLabel: 'ruins',
    }),
    'City city_pinewind_hamlet refs.ruinId missing in ruins',
  );
});
