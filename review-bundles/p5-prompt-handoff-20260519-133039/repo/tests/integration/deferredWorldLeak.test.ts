import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { getCityArrivalQuickOpenModules } from '../../src/systems/world/cityArrivalContract.js';
import { getLiveExpeditionRoutePurpose } from '../../src/systems/world/expeditionRouteContract.js';
import { SEMESTER_SLICE_CONTRACT } from '../../src/systems/progression/contract/semesterSlice.js';
import {
  inspectWorldFacingModuleTarget,
  isAllowedLiveWorldSurfaceModule,
} from '../../src/systems/world/liveWorldLeakAudit.js';
import { isDeferredWorldModule } from '../../src/systems/world/liveWorldSchema.js';
import { openWorldModule } from '../../src/systems/world/openWorldModule.js';
import { useActivityStore } from '../../src/stores/activityStore.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useCombatStore } from '../../src/stores/combatStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useUIStore } from '../../src/stores/uiStore.js';
import { resolveBountyDestination } from '../../src/utils/bountyRouting.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');
const PINEWIND_CITY_ID = 'city_pinewind_hamlet';

let validatedContentPromise: Promise<ValidatedContent> | null = null;

const loadValidatedContent = async (): Promise<ValidatedContent> => {
  if (!validatedContentPromise) {
    validatedContentPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedContentPromise;
};

const readRepoFile = async (relativePath: string): Promise<string> =>
  fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

const readContentFile = async (fileName: string): Promise<string> =>
  fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8');

const resetRuntimeStores = () => {
  useUIStore.getState().hardResetUI();
  useCityStore.getState().hardResetCity();
  useContentStore.setState({
    raw: null,
    economy: null,
    isLoaded: false,
    isLoading: false,
    error: null,
    citiesSorted: [],
    techniquesByPath: {
      heaven: [],
      earth: [],
      martial: [],
    },
    maps: {
      citiesById: {},
      itemsById: {},
      techniquesById: {},
      pavilionsById: {},
      outskirtsById: {},
      enemiesById: {},
      trialsById: {},
      trialsByCityId: {},
      ruinsById: {},
      runesById: {},
      heartLawsById: {},
      prestigeUpgradesById: {},
      apothecariesById: {},
      apothecariesByCityId: {},
    },
  });
  useActivityStore.getState().hardResetActivity();
  useCombatStore.getState().hardResetCombat();
};

const primeRuntimeStores = async () => {
  const validated = await loadValidatedContent();
  const citiesSorted = [...validated.cities].sort((a, b) => a.index - b.index);

  resetRuntimeStores();
  useContentStore.setState({
    raw: validated,
    economy: validated.economy,
    isLoaded: true,
    isLoading: false,
    error: null,
    citiesSorted,
    maps: {
      ...useContentStore.getState().maps,
      citiesById: Object.fromEntries(citiesSorted.map((city) => [city.id, city])) as never,
      itemsById: Object.fromEntries(validated.items.map((item) => [item.id, item])) as never,
      ruinsById: Object.fromEntries(validated.ruins.map((ruin) => [ruin.id, ruin])) as never,
      outskirtsById: Object.fromEntries(validated.outskirts.map((outskirts) => [outskirts.id, outskirts])) as never,
      trialsById: Object.fromEntries(validated.trials.map((trial) => [trial.id, trial])) as never,
      trialsByCityId: Object.fromEntries(validated.trials.map((trial) => [trial.cityId, trial])) as never,
      pavilionsById: Object.fromEntries(validated.pavilions.map((pavilion) => [pavilion.id, pavilion])) as never,
      apothecariesById: Object.fromEntries(validated.apothecary_shops.map((shop) => [shop.id, shop])) as never,
      apothecariesByCityId: Object.fromEntries(validated.apothecary_shops.map((shop) => [shop.cityId, shop])) as never,
    },
  });

  useCityStore.getState().initializeFromContent(citiesSorted);
  useCityStore.setState((state) => ({
    ...state,
    currentCityId: PINEWIND_CITY_ID,
    unlockedCityIds: [PINEWIND_CITY_ID],
    selectedModuleByCity: { [PINEWIND_CITY_ID]: 'outskirts' },
  }));
  useUIStore.setState({
    showWorldBuildingModal: false,
    worldBuildingModalCityId: null,
    worldBuildingModalKey: null,
  });

  return { validated, citiesSorted };
};

test.beforeEach(async () => {
  await primeRuntimeStores();
});

test('openWorldModule refuses deferred world targets', () => {
  openWorldModule({ cityId: PINEWIND_CITY_ID, moduleKey: 'alchemy', source: 'test-deferred-open' });

  assert.equal(useUIStore.getState().showWorldBuildingModal, false);
  assert.notEqual(useUIStore.getState().worldBuildingModalKey, 'alchemy');
  assert.equal(useCityStore.getState().currentCityId, PINEWIND_CITY_ID);
  assert.notEqual(useCityStore.getState().selectedModuleByCity[PINEWIND_CITY_ID], 'alchemy');

  openWorldModule({ cityId: PINEWIND_CITY_ID, moduleKey: 'talismanStudio', source: 'test-deferred-open' });

  assert.equal(useUIStore.getState().showWorldBuildingModal, false);
  assert.notEqual(useUIStore.getState().worldBuildingModalKey, 'talismanStudio');
  assert.equal(useCityStore.getState().currentCityId, PINEWIND_CITY_ID);
  assert.notEqual(useCityStore.getState().selectedModuleByCity[PINEWIND_CITY_ID], 'talismanStudio');
});

test('openWorldModule still opens real live world targets', () => {
  openWorldModule({ cityId: PINEWIND_CITY_ID, moduleKey: 'bounties', source: 'test-live-open' });

  assert.equal(useUIStore.getState().showWorldBuildingModal, true);
  assert.equal(useUIStore.getState().worldBuildingModalCityId, PINEWIND_CITY_ID);
  assert.equal(useUIStore.getState().worldBuildingModalKey, 'bounties');
});

test('world shell hidden-module sets now use canonical deferred truth and no longer hide ruins', async () => {
  const worldScreenSource = await readRepoFile('src/components/screens/WorldScreen.tsx');
  const cityMapHubSource = await readRepoFile('src/components/screens/CityMapHub.tsx');

  assert.match(worldScreenSource, /DEFERRED_WORLD_MODULES/);
  assert.match(cityMapHubSource, /DEFERRED_WORLD_MODULES/);
  assert.doesNotMatch(worldScreenSource, /hidden[^\n]*ruins/i);
  assert.doesNotMatch(cityMapHubSource, /hidden[^\n]*ruins/i);
  assert.doesNotMatch(worldScreenSource, /Coming in Prompt/i);
});

test('header tracked shortcut now routes through the safe world router', async () => {
  const headerSource = await readRepoFile('src/components/Header.tsx');

  assert.match(headerSource, /openWorldModule/);
  assert.doesNotMatch(headerSource, /options\s*\[\s*0\s*\]/);
  assert.doesNotMatch(headerSource, /destination\.kind\s*===\s*['"]moduleChoice['"]/);
  assert.doesNotMatch(headerSource, /setActiveTab\(\s*['"]adventure['"]\s*\)/);
  assert.doesNotMatch(headerSource, /setCurrentCity\(\s*currentCityId\s*\)/);
  assert.doesNotMatch(headerSource, /setSelectedModule\(\s*currentCityId\s*,\s*targetModule\s*\)/);
});

test('bounty board world-facing UI no longer surfaces deferred-module leakage', async () => {
  const bountyBoardSource = await readRepoFile('src/components/screens/BountyBoardPanel.tsx');

  assert.doesNotMatch(bountyBoardSource, /Choose Destination/);
  assert.doesNotMatch(bountyBoardSource, /moduleChoice/);
  assert.doesNotMatch(bountyBoardSource, /Alchemy/);
  assert.doesNotMatch(bountyBoardSource, /Talisman Studio/);
  assert.match(bountyBoardSource, /openWorldModule/);
  assert.match(bountyBoardSource, /Go There/);
  assert.doesNotMatch(bountyBoardSource, /Queue an Alchemy job in City A/);
});

test('expedition board world-facing UI no longer surfaces deferred-module leakage', async () => {
  const expeditionBoardSource = await readRepoFile('src/components/screens/ExpeditionBoardPanel.tsx');

  assert.doesNotMatch(expeditionBoardSource, /forage\s*:\s*['"]alchemy['"]/);
  assert.doesNotMatch(expeditionBoardSource, /Open Alchemy/);
  assert.match(expeditionBoardSource, /openWorldModule/);
  assert.match(expeditionBoardSource, /ceremony\.run\.cityId/);
  assert.doesNotMatch(expeditionBoardSource, /setSelectedModule\(\s*ceremony\.run\.cityId/);
});

test('no targeted world-facing source or content still uses legacy semester city names', async () => {
  const contents = await Promise.all([
    readRepoFile('src/components/screens/WorldScreen.tsx'),
    readRepoFile('src/components/screens/CityMapHub.tsx'),
    readRepoFile('src/components/screens/BountyBoardPanel.tsx'),
    readRepoFile('src/components/screens/ExpeditionBoardPanel.tsx'),
    readRepoFile('src/components/Header.tsx'),
    readContentFile('bounties.json'),
    readContentFile('expeditions.json'),
  ]);

  contents.forEach((text) => {
    assert.doesNotMatch(text, /Embermist/);
    assert.doesNotMatch(text, /Silverkeep/);
    assert.doesNotMatch(text, /Starsea/);
  });
});

test('final live-world route audit stays clean across the semester slice', async () => {
  const validated = await loadValidatedContent();
  const liveBountyKinds = [
    'OUTSKIRTS_KILL',
    'OUTSKIRTS_BOSS_KILL',
    'RUINS_ROOM_CLEAR',
    'RUINS_RUN_CLEAR',
    'CRAFT_COMPLETE',
    'EXPEDITION_COMPLETE',
  ];

  const liveCityIdSet = new Set<string>(SEMESTER_SLICE_CONTRACT.liveCityIds);
  const liveCities = validated.cities.filter((city) => liveCityIdSet.has(city.id));
  assert.equal(liveCities.length, 5);

  liveCities.forEach((city) => {
    city.modules.forEach((moduleKey) => {
      assert.equal(isDeferredWorldModule(moduleKey), false, `${city.id} leaked deferred module ${moduleKey}`);
      assert.equal(isAllowedLiveWorldSurfaceModule(moduleKey), true, `${city.id} leaked non-live module ${moduleKey}`);
    });

    getCityArrivalQuickOpenModules(city.modules).forEach((moduleKey) => {
      assert.equal(inspectWorldFacingModuleTarget(moduleKey).ok, true, `${city.id} quick-open leaked ${moduleKey}`);
    });

    liveBountyKinds.forEach((bountyKind) => {
      const destination = resolveBountyDestination({ cityId: city.id, bountyKind, cityModules: [...city.modules] });
      assert.equal(destination.kind, 'module', `${city.id} ${bountyKind} should resolve to a live module`);
      assert.equal(inspectWorldFacingModuleTarget(destination.moduleKey).ok, true);
    });
  });

  ['forage', 'mine', 'scout'].forEach((typeId) => {
    const routePurpose = getLiveExpeditionRoutePurpose(typeId);
    assert.ok(routePurpose, `${typeId} should expose a live route purpose`);
    assert.equal(inspectWorldFacingModuleTarget(routePurpose?.moduleKey).ok, true);
  });
});
