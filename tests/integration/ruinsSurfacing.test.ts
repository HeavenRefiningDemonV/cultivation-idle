import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { useActivityStore } from '../../src/stores/activityStore.js';
import { useCityStore } from '../../src/stores/cityStore.js';
import { useCombatStore } from '../../src/stores/combatStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useRuinsStore } from '../../src/stores/ruinsStore.js';
import { useUIStore } from '../../src/stores/uiStore.js';
import { SEMESTER_SLICE_CONTRACT } from '../../src/systems/progression/contract/semesterSlice.js';
import { bootstrapLiveWorldStores } from '../../src/systems/world/bootstrapLiveWorld.js';
import { openWorldModule } from '../../src/systems/world/openWorldModule.js';
import { resolveModuleRef } from '../../src/components/screens/world/worldUtils.js';
import { resolveBountyDestination } from '../../src/utils/bountyRouting.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

const repoPath = (relativePath: string) => path.resolve(process.cwd(), relativePath);
const LIVE_CITY_ID_SET = new Set<string>(SEMESTER_SLICE_CONTRACT.liveCityIds);

const primeStores = async () => {
  const validated = validateLoadedContent(await loadRawProgressionContent() as never);
  const citiesSorted = [...validated.cities].sort((a, b) => a.index - b.index);
  useContentStore.setState({
    raw: validated,
    economy: validated.economy,
    isLoaded: true,
    isLoading: false,
    error: null,
    citiesSorted,
    maps: {
      ...useContentStore.getState().maps,
      citiesById: Object.fromEntries(validated.cities.map((city) => [city.id, city])) as never,
      ruinsById: Object.fromEntries(validated.ruins.map((ruin) => [ruin.id, ruin])) as never,
      enemiesById: Object.fromEntries(validated.enemies.map((enemy) => [enemy.id, enemy])) as never,
    },
  });

  return validated;
};

const resetStores = () => {
  useCityStore.getState().hardResetCity();
  useRuinsStore.getState().hardResetRuins();
  useUIStore.getState().hardResetUI();
  useActivityStore.getState().hardResetActivity();
  useCombatStore.getState().hardResetCombat();
};

test.beforeEach(async () => {
  resetStores();
  await primeStores();
});

test('real validated content exposes a ruins module and matching ruins ref for every live city', () => {
  const content = useContentStore.getState().raw;
  assert.ok(content);

  const liveCities = content.cities
    .filter((city) => LIVE_CITY_ID_SET.has(city.id))
    .sort((a, b) => a.index - b.index);
  const ruinsById = Object.fromEntries(content.ruins.map((ruin) => [ruin.id, ruin]));

  assert.equal(liveCities.length, 5);

  liveCities.forEach((city) => {
    assert.equal(city.modules.includes('ruins'), true, `${city.id} should expose ruins`);
    const ruinId = resolveModuleRef(city, 'ruins');
    assert.ok(ruinId, `${city.id} should resolve a ruins ref`);
    assert.ok(ruinsById[ruinId], `${city.id} should point at an authored ruin`);
    assert.equal(ruinsById[ruinId].cityId, city.id);
  });
});

test('world shell source wiring keeps deferred modules hidden while leaving ruins surfaced and mounts the ruins panel explicitly', async () => {
  const worldScreenSource = await readFile(repoPath('src/components/screens/WorldScreen.tsx'), 'utf8');
  const cityMapHubSource = await readFile(repoPath('src/components/screens/CityMapHub.tsx'), 'utf8');
  const modalSource = await readFile(repoPath('src/components/modals/WorldBuildingModal.tsx'), 'utf8');

  const worldHiddenMatch = worldScreenSource.match(/WORLD_SCREEN_HIDDEN_MODULES\s*=\s*new Set<string>\(\[(.*?)\]\)/s);
  assert.ok(worldHiddenMatch);
  assert.match(worldHiddenMatch[1], /alchemy/);
  assert.match(worldHiddenMatch[1], /talismanStudio/);
  assert.doesNotMatch(worldHiddenMatch[1], /ruins/);

  const hubHiddenMatch = cityMapHubSource.match(/HIDDEN_HUB_MODULES\s*=\s*new Set<string>\(\[(.*?)\]\)/s);
  assert.ok(hubHiddenMatch);
  assert.match(hubHiddenMatch[1], /alchemy/);
  assert.match(hubHiddenMatch[1], /talismanStudio/);
  assert.doesNotMatch(hubHiddenMatch[1], /ruins/);

  assert.match(modalSource, /RuinsBuildingPanel/);
  assert.match(modalSource, /case\s+['"]ruins['"]\s*:/);
  assert.match(modalSource, /case\s+['"]ruins['"]\s*:\s*content\s*=\s*<RuinsBuildingPanel\s+cityId=\{storeCityId\}\s*\/>/s);
});

test('openWorldModule can route to ruins for every unlocked live city', () => {
  const content = useContentStore.getState().raw;
  assert.ok(content);

  bootstrapLiveWorldStores({
    cities: content.cities,
    ruins: content.ruins,
    majorRealmId: 'soul_formation',
  });

  const liveCities = content.cities
    .filter((city) => LIVE_CITY_ID_SET.has(city.id))
    .sort((a, b) => a.index - b.index);

  liveCities.forEach((city) => {
    openWorldModule({ cityId: city.id, moduleKey: 'ruins', source: 'test-ruins-surfacing' });

    const uiState = useUIStore.getState();
    const cityState = useCityStore.getState();
    assert.equal(uiState.showWorldBuildingModal, true);
    assert.equal(uiState.worldBuildingModalCityId, city.id);
    assert.equal(uiState.worldBuildingModalKey, 'ruins');
    assert.equal(cityState.currentCityId, city.id);

    useUIStore.getState().closeWorldBuildingModal();
  });
});

test('ruins bounty destinations now resolve to the live ruins module for every live city', () => {
  const content = useContentStore.getState().raw;
  assert.ok(content);

  const liveCities = content.cities
    .filter((city) => LIVE_CITY_ID_SET.has(city.id))
    .sort((a, b) => a.index - b.index);

  liveCities.forEach((city) => {
    const roomClear = resolveBountyDestination({
      cityId: city.id,
      bountyKind: 'RUINS_ROOM_CLEAR',
      cityModules: city.modules,
    });
    const runClear = resolveBountyDestination({
      cityId: city.id,
      bountyKind: 'RUINS_RUN_CLEAR',
      cityModules: city.modules,
    });

    assert.deepEqual(roomClear, { kind: 'module', moduleKey: 'ruins', cityId: city.id });
    assert.deepEqual(runClear, { kind: 'module', moduleKey: 'ruins', cityId: city.id });
  });
});
