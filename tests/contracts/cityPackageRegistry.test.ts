import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { type CityDef } from '../../src/content/types.js';
import { SEMESTER_SLICE_CONTRACT } from '../../src/systems/progression/contract/semesterSlice.js';
import { getCityArrivalLesson, CITY_ARRIVAL_QUICK_OPEN_ORDER } from '../../src/systems/world/cityArrivalContract.js';
import {
  CITY_PACKAGE_REGISTRY,
  CITY_PACKAGE_REGISTRY_BY_ID,
  inspectCityPackageCoverage,
} from '../../src/systems/world/cityPackageRegistry.js';
import { LIVE_CITY_MODULE_ORDER } from '../../src/systems/world/liveWorldSchema.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

const buildCity = (overrides: Partial<CityDef> & Pick<CityDef, 'id' | 'index'>): CityDef => ({
  id: overrides.id,
  index: overrides.index,
  name: overrides.name ?? overrides.id,
  unlockMajorRealm: overrides.unlockMajorRealm ?? 'qi_condensation',
  modules: overrides.modules ?? [...LIVE_CITY_MODULE_ORDER],
  refs:
    overrides.refs ??
    ({
      outskirtsId: `${overrides.id}_outskirts`,
      gateTrialId: `${overrides.id}_trial`,
      ruinId: `${overrides.id}_ruin`,
      pavilionId: `${overrides.id}_pavilion`,
      apothecaryId: `${overrides.id}_shop`,
    } as CityDef['refs']),
  themeTags: overrides.themeTags,
});

const buildResolutionMaps = (city: CityDef) => ({
  outskirtsById: { [city.refs.outskirtsId]: { id: city.refs.outskirtsId, cityId: city.id, cityIndex: city.index } },
  trialsById: { [city.refs.gateTrialId]: { id: city.refs.gateTrialId, cityId: city.id, cityIndex: city.index } },
  ruinsById: { [city.refs.ruinId]: { id: city.refs.ruinId, cityId: city.id, cityIndex: city.index } },
  pavilionsById: { [city.refs.pavilionId]: { id: city.refs.pavilionId, cityId: city.id, cityIndex: city.index } },
  apothecaryById: { [city.refs.apothecaryId]: { id: city.refs.apothecaryId, cityId: city.id, cityIndex: city.index } },
});

test('city package registry exactly covers the five-city semester slice in order', () => {
  assert.equal(CITY_PACKAGE_REGISTRY.length, 5);
  assert.deepEqual(
    CITY_PACKAGE_REGISTRY.map((entry) => entry.cityId),
    SEMESTER_SLICE_CONTRACT.liveCityIds,
  );
  assert.deepEqual(
    CITY_PACKAGE_REGISTRY.map((entry) => CITY_PACKAGE_REGISTRY_BY_ID[entry.cityId]?.cityId ?? null),
    SEMESTER_SLICE_CONTRACT.liveCityIds,
  );

  const modelCities = CITY_PACKAGE_REGISTRY.filter((entry) => entry.isModelCity);
  assert.equal(modelCities.length, 1);
  assert.equal(modelCities[0]?.cityId, 'city_pinewind_hamlet');
});

test('city package registry entries expose the exact packet 2.7 authored contract facts', () => {
  assert.deepEqual(CITY_PACKAGE_REGISTRY_BY_ID.city_pinewind_hamlet, {
    cityId: 'city_pinewind_hamlet',
    cityIndex: 0,
    leadOutskirtsId: 'outskirts_training_forest',
    leadRuinId: 'ruin_hollow_log_den',
    leadGateTrialId: 'trial_novices_clearing',
    leadSupportIdentity: 'starter-loop',
    isModelCity: true,
    defaultQuickOpenOrder: [...CITY_ARRIVAL_QUICK_OPEN_ORDER],
    mustExposeModules: [...LIVE_CITY_MODULE_ORDER],
    lesson: 'Learn the loop.',
    phaseRole: 'Teaches the full loop once.',
    expeditionEmphasis: 'Keep one route running for city support.',
  });

  assert.equal(CITY_PACKAGE_REGISTRY_BY_ID.city_stonecrag_town.cityIndex, 1);
  assert.equal(CITY_PACKAGE_REGISTRY_BY_ID.city_stonecrag_town.leadOutskirtsId, 'outskirts_rockfall_quarry');
  assert.equal(CITY_PACKAGE_REGISTRY_BY_ID.city_stonecrag_town.leadRuinId, 'ruin_broken_kiln');
  assert.equal(CITY_PACKAGE_REGISTRY_BY_ID.city_stonecrag_town.leadGateTrialId, 'trial_stone_core_sanctum');
  assert.equal(CITY_PACKAGE_REGISTRY_BY_ID.city_stonecrag_town.leadSupportIdentity, 'forge-and-ore');

  assert.equal(CITY_PACKAGE_REGISTRY_BY_ID.city_spirit_cavern_city.cityIndex, 2);
  assert.equal(CITY_PACKAGE_REGISTRY_BY_ID.city_spirit_cavern_city.leadOutskirtsId, 'outskirts_spirit_cavern');
  assert.equal(CITY_PACKAGE_REGISTRY_BY_ID.city_spirit_cavern_city.leadRuinId, 'ruin_echo_crystal_tunnels');
  assert.equal(CITY_PACKAGE_REGISTRY_BY_ID.city_spirit_cavern_city.leadGateTrialId, 'trial_patriarchs_seal');
  assert.equal(CITY_PACKAGE_REGISTRY_BY_ID.city_spirit_cavern_city.leadSupportIdentity, 'fragments-and-build-correction');

  assert.equal(CITY_PACKAGE_REGISTRY_BY_ID.city_lotusford.cityIndex, 3);
  assert.equal(CITY_PACKAGE_REGISTRY_BY_ID.city_lotusford.leadOutskirtsId, 'outskirts_mist_marsh');
  assert.equal(CITY_PACKAGE_REGISTRY_BY_ID.city_lotusford.leadRuinId, 'ruin_sunken_pavilion');
  assert.equal(CITY_PACKAGE_REGISTRY_BY_ID.city_lotusford.leadGateTrialId, 'trial_soul_lantern_vault');
  assert.equal(CITY_PACKAGE_REGISTRY_BY_ID.city_lotusford.leadSupportIdentity, 'reagents-and-survival-prep');

  assert.equal(CITY_PACKAGE_REGISTRY_BY_ID.city_ironpeak_bastion.cityIndex, 4);
  assert.equal(CITY_PACKAGE_REGISTRY_BY_ID.city_ironpeak_bastion.leadOutskirtsId, 'outskirts_razor_ridge');
  assert.equal(CITY_PACKAGE_REGISTRY_BY_ID.city_ironpeak_bastion.leadRuinId, 'ruin_old_furnace_complex');
  assert.equal(CITY_PACKAGE_REGISTRY_BY_ID.city_ironpeak_bastion.leadGateTrialId, 'trial_severing_court');
  assert.equal(CITY_PACKAGE_REGISTRY_BY_ID.city_ironpeak_bastion.leadSupportIdentity, 'final-convergence');
  assert.equal(CITY_PACKAGE_REGISTRY_BY_ID.city_ironpeak_bastion.isModelCity, false);
});

test('city package registry reuses packet 2.1 and 2.6 truths instead of drifting duplicate tables', () => {
  CITY_PACKAGE_REGISTRY.forEach((entry) => {
    assert.deepEqual(entry.defaultQuickOpenOrder, [...CITY_ARRIVAL_QUICK_OPEN_ORDER]);
    assert.deepEqual(entry.mustExposeModules, [...LIVE_CITY_MODULE_ORDER]);
    assert.equal(entry.lesson, getCityArrivalLesson(entry.cityId));
  });
});

test('city package coverage requires exact local bounty support instead of older-city fallback templates', () => {
  const registryEntry = CITY_PACKAGE_REGISTRY_BY_ID.city_ironpeak_bastion;
  const city = buildCity({
    id: registryEntry.cityId,
    index: registryEntry.cityIndex,
    refs: {
      outskirtsId: registryEntry.leadOutskirtsId,
      gateTrialId: registryEntry.leadGateTrialId,
      ruinId: registryEntry.leadRuinId,
      pavilionId: 'pavilion_ironpeak',
      apothecaryId: 'shop_apothecary_ironpeak',
    } as CityDef['refs'],
  });
  const report = inspectCityPackageCoverage({
    city,
    registryEntry,
    ...buildResolutionMaps(city),
    bountyRewardTiersByCityIndex: { '4': { easy: {} } },
    bountyTemplates: [
      { id: 'older-craft', kind: 'CRAFT_COMPLETE', minCityIndex: 0 },
      { id: 'older-expedition', kind: 'EXPEDITION_COMPLETE', minCityIndex: 1 },
    ],
    expeditionTypes: [
      { id: 'forage', yieldTags: ['herbs'] },
      { id: 'mine', yieldTags: ['ore'] },
      { id: 'scout', yieldTags: ['fragments'] },
    ],
    expeditionCityYields: [{ cityIndex: 4, yieldsByTag: { herbs: {}, ore: {}, fragments: {} } }],
  });

  assert.equal(report.isComplete, false);
  assert.match(report.missingSupportCoverage.join(' | '), /local craft support coverage/i);
  assert.match(report.missingSupportCoverage.join(' | '), /local expedition support coverage/i);
});

test('city package coverage requires expedition yield coverage for every live expedition tag', () => {
  const registryEntry = CITY_PACKAGE_REGISTRY_BY_ID.city_ironpeak_bastion;
  const city = buildCity({
    id: registryEntry.cityId,
    index: registryEntry.cityIndex,
    refs: {
      outskirtsId: registryEntry.leadOutskirtsId,
      gateTrialId: registryEntry.leadGateTrialId,
      ruinId: registryEntry.leadRuinId,
      pavilionId: 'pavilion_ironpeak',
      apothecaryId: 'shop_apothecary_ironpeak',
    } as CityDef['refs'],
  });
  const report = inspectCityPackageCoverage({
    city,
    registryEntry,
    ...buildResolutionMaps(city),
    bountyRewardTiersByCityIndex: { '4': { easy: {} } },
    bountyTemplates: [
      { id: 'ironpeak-craft', kind: 'CRAFT_COMPLETE', minCityIndex: 4 },
      { id: 'ironpeak-expedition', kind: 'EXPEDITION_COMPLETE', minCityIndex: 4 },
    ],
    expeditionTypes: [
      { id: 'forage', yieldTags: ['herbs'] },
      { id: 'mine', yieldTags: ['ore'] },
      { id: 'scout', yieldTags: ['fragments'] },
    ],
    expeditionCityYields: [{ cityIndex: 4, yieldsByTag: { herbs: {}, ore: {} } }],
  });

  assert.equal(report.isComplete, false);
  assert.match(report.missingSupportCoverage.join(' | '), /missing expedition yield tag coverage/i);
  assert.match(report.missingSupportCoverage.join(' | '), /fragments/i);
});

test('model city still requires the full quick-open package and live module surface', () => {
  const registryEntry = CITY_PACKAGE_REGISTRY_BY_ID.city_pinewind_hamlet;
  const city = buildCity({
    id: registryEntry.cityId,
    index: registryEntry.cityIndex,
    modules: LIVE_CITY_MODULE_ORDER.filter((moduleKey) => moduleKey !== 'ruins'),
    refs: {
      outskirtsId: registryEntry.leadOutskirtsId,
      gateTrialId: registryEntry.leadGateTrialId,
      ruinId: registryEntry.leadRuinId,
      pavilionId: 'pavilion_pinewind',
      apothecaryId: 'shop_apothecary_pinewind',
    } as CityDef['refs'],
  });
  const report = inspectCityPackageCoverage({
    city,
    registryEntry,
    ...buildResolutionMaps(city),
    bountyRewardTiersByCityIndex: { '0': { easy: {} } },
    bountyTemplates: [
      { id: 'pinewind-craft', kind: 'CRAFT_COMPLETE', minCityIndex: 0 },
      { id: 'pinewind-expedition', kind: 'EXPEDITION_COMPLETE', minCityIndex: 0 },
    ],
    expeditionTypes: [
      { id: 'forage', yieldTags: ['herbs'] },
      { id: 'mine', yieldTags: ['ore'] },
      { id: 'scout', yieldTags: ['fragments'] },
    ],
    expeditionCityYields: [{ cityIndex: 0, yieldsByTag: { herbs: {}, ore: {}, fragments: {} } }],
  });

  assert.equal(report.isComplete, false);
  assert.deepEqual(report.missingModules, ['ruins']);
  assert.match(report.quickOpenCoverageIssues.join(' | '), /quick-open package hole/i);
  assert.match(report.quickOpenCoverageIssues.join(' | '), /ruins/i);
});

test('real validated content still satisfies the packet 2.7 registry contract shape', async () => {
  const validated = validateLoadedContent(await loadRawProgressionContent() as never);
  assert.deepEqual(
    validated.cities.map((city) => city.id),
    SEMESTER_SLICE_CONTRACT.liveCityIds,
  );
  assert.deepEqual(
    validated.cities.map((city) => CITY_PACKAGE_REGISTRY_BY_ID[city.id]?.cityIndex ?? -1),
    validated.cities.map((city) => city.index),
  );
});
