import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import type { CityDef } from '../../src/content/types.js';
import { validateProgressionSemantics } from '../../src/systems/progression/validation/index.js';
import { SEMESTER_SLICE_CONTRACT } from '../../src/systems/progression/contract/semesterSlice.js';
import {
  CITY_PACKAGE_REGISTRY,
  CITY_PACKAGE_REGISTRY_BY_ID,
  inspectSemesterCityPackageCoverage,
} from '../../src/systems/world/cityPackageRegistry.js';
import { LIVE_CITY_MODULE_ORDER } from '../../src/systems/world/liveWorldSchema.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

const buildValidatedMaps = (validated: ReturnType<typeof validateLoadedContent>) => ({
  outskirtsById: Object.fromEntries(validated.outskirts.map((entry) => [entry.id, entry])),
  trialsById: Object.fromEntries(validated.trials.map((entry) => [entry.id, entry])),
  ruinsById: Object.fromEntries(validated.ruins.map((entry) => [entry.id, entry])),
  pavilionsById: Object.fromEntries(validated.pavilions.map((entry) => [entry.id, entry])),
  apothecaryById: Object.fromEntries(validated.apothecary_shops.map((entry) => [entry.id, entry])),
});

const buildRegistryReports = (validated: ReturnType<typeof validateLoadedContent>) =>
  inspectSemesterCityPackageCoverage({
    cities: validated.cities,
    ...buildValidatedMaps(validated),
    bounties: validated.bounties,
    expeditions: validated.expeditions,
  });

test('real validated content fully satisfies the city-package registry', async () => {
  const validated = validateLoadedContent(await loadRawProgressionContent() as never);
  const reports = buildRegistryReports(validated);

  assert.equal(reports.length, 5);
  reports.forEach((report) => {
    assert.equal(report.isComplete, true);
    assert.deepEqual(report.missingModules, []);
    assert.deepEqual(report.missingRefs, []);
    assert.deepEqual(report.refResolutionIssues, []);
    assert.deepEqual(report.missingSupportCoverage, []);
    assert.deepEqual(report.quickOpenCoverageIssues, []);
  });
});

test('real validated content resolves registry lead ids back to same-city content and authored refs', async () => {
  const rawContent = await loadRawProgressionContent();
  const validated = validateLoadedContent(rawContent as never);
  const maps = buildValidatedMaps(validated);
  const rawCities = Array.isArray(rawContent.cities) ? rawContent.cities : rawContent.cities.cities;
  const rawCitiesById = Object.fromEntries(rawCities.map((city) => [city.id, city]));

  SEMESTER_SLICE_CONTRACT.liveCityIds.forEach((cityId) => {
    const entry = CITY_PACKAGE_REGISTRY_BY_ID[cityId];
    const city = validated.cities.find((candidate) => candidate.id === cityId);
    const rawCity = rawCitiesById[cityId];
    assert.ok(city);
    assert.ok(rawCity);

    assert.equal(maps.outskirtsById[entry.leadOutskirtsId]?.cityId, cityId);
    assert.equal(maps.ruinsById[entry.leadRuinId]?.cityId, cityId);
    assert.equal(maps.trialsById[entry.leadGateTrialId]?.cityId, cityId);
    assert.equal(city?.refs.outskirtsId, entry.leadOutskirtsId);
    assert.equal(city?.refs.ruinId, entry.leadRuinId);
    assert.equal(city?.refs.gateTrialId, entry.leadGateTrialId);
    assert.equal(rawCity?.refs?.outskirtsId, entry.leadOutskirtsId);
    assert.equal(rawCity?.refs?.ruinId, entry.leadRuinId);
    assert.equal(rawCity?.refs?.gateTrialId, entry.leadGateTrialId);
  });
});

test('real validated content has local bounty support coverage for every city index', async () => {
  const validated = validateLoadedContent(await loadRawProgressionContent() as never);

  validated.cities.forEach((city) => {
    assert.ok(validated.bounties.rewardTiersByCityIndex[String(city.index)]);
    assert.equal(
      validated.bounties.templates.some(
        (template) => template.kind === 'CRAFT_COMPLETE' && template.minCityIndex === city.index,
      ),
      true,
    );
    assert.equal(
      validated.bounties.templates.some(
        (template) => template.kind === 'EXPEDITION_COMPLETE' && template.minCityIndex === city.index,
      ),
      true,
    );
  });
});

test('real validated content has expedition yield coverage for every city index and live type tag', async () => {
  const validated = validateLoadedContent(await loadRawProgressionContent() as never);
  const requiredYieldTags = [...new Set(validated.expeditions.types.flatMap((type) => type.yieldTags))];

  validated.cities.forEach((city) => {
    const cityYieldEntry = validated.expeditions.cityYields.find((entry) => entry.cityIndex === city.index);
    assert.ok(cityYieldEntry);
    requiredYieldTags.forEach((tag) => {
      assert.equal(Object.prototype.hasOwnProperty.call(cityYieldEntry?.yieldsByTag ?? {}, tag), true);
    });
  });
});

test('validateLoadedContent rejects missing bounty reward tier coverage for a semester city package', async () => {
  const rawContent = await loadRawProgressionContent();
  const broken = structuredClone(rawContent);
  if (broken.bounties?.rewardTiersByCityIndex) {
    delete broken.bounties.rewardTiersByCityIndex['3'];
  }

  assert.throws(
    () => validateLoadedContent(broken as never),
    /city_lotusford|city index 3|bounty reward tier coverage/i,
  );
});

test('validateLoadedContent rejects missing expedition yield coverage for a semester city package', async () => {
  const rawContent = await loadRawProgressionContent();
  const broken = structuredClone(rawContent);
  if (broken.expeditions?.cityYields) {
    broken.expeditions.cityYields = broken.expeditions.cityYields.filter((entry) => entry.cityIndex !== 4);
  }

  assert.throws(
    () => validateLoadedContent(broken as never),
    /city_ironpeak_bastion|city index 4|expedition yield coverage/i,
  );
});

test('semantic validator emits packet 2.7 drift on broken authored city-package support content only', async () => {
  const rawContent = await loadRawProgressionContent();
  const cleanIssues = validateProgressionSemantics({
    rawContent,
    scenarios: [],
    migrationFixtures: [],
  });
  assert.equal(
    cleanIssues.some((issue) => issue.category === 'WORLD_CITY_PACKAGE_COMPLETENESS_DRIFT'),
    false,
  );

  const broken = structuredClone(rawContent);
  if (broken.expeditions?.cityYields) {
    broken.expeditions.cityYields = broken.expeditions.cityYields.filter((entry) => entry.cityIndex !== 4);
  }

  const issues = validateProgressionSemantics({
    rawContent: broken,
    scenarios: [],
    migrationFixtures: [],
  });
  const packetIssue = issues.find((issue) => issue.category === 'WORLD_CITY_PACKAGE_COMPLETENESS_DRIFT');

  assert.ok(packetIssue);
  assert.equal(packetIssue.suggestedOwnerPacket, '2.7');
  assert.match(packetIssue.evidence.map((entry) => entry.detail).join(' | '), /expedition yield coverage|city index 4/i);
});

test('Pinewind is explicitly the model city and support identities stay distinct across the semester slice', async () => {
  const validated = validateLoadedContent(await loadRawProgressionContent() as never);
  const modelCities = CITY_PACKAGE_REGISTRY.filter((entry) => entry.isModelCity);

  assert.deepEqual(modelCities.map((entry) => entry.cityId), ['city_pinewind_hamlet']);

  const pinewind = validated.cities.find((city) => city.id === 'city_pinewind_hamlet');
  assert.ok(pinewind);
  assert.deepEqual(pinewind?.modules, [...LIVE_CITY_MODULE_ORDER]);

  validated.cities
    .filter((city) => city.id !== 'city_pinewind_hamlet')
    .forEach((city) => {
      assert.deepEqual(city.modules, [...CITY_PACKAGE_REGISTRY_BY_ID[city.id].mustExposeModules]);
    });

  assert.equal(
    new Set(CITY_PACKAGE_REGISTRY.map((entry) => entry.leadSupportIdentity)).size,
    CITY_PACKAGE_REGISTRY.length,
  );
});
