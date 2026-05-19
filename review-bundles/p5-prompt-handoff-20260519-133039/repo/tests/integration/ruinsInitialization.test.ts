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
import { bootstrapLiveWorldStores } from '../../src/systems/world/bootstrapLiveWorld.js';
import { resolveModuleRef } from '../../src/components/screens/world/worldUtils.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

const repoPath = (relativePath: string) => path.resolve(process.cwd(), relativePath);
const PINEWIND_CITY_ID = 'city_pinewind_hamlet';

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

test('bootstrapLiveWorldStores seeds ruins progress for every authored ruin while preserving baseline city truth', () => {
  const content = useContentStore.getState().raw;
  assert.ok(content);

  bootstrapLiveWorldStores({
    cities: content.cities,
    ruins: content.ruins,
    majorRealmId: 'qi_condensation',
  });

  const progressByRuinId = useRuinsStore.getState().progressByRuinId;
  assert.equal(Object.keys(progressByRuinId).length, content.ruins.length);

  content.ruins.forEach((ruin) => {
    assert.deepEqual(progressByRuinId[ruin.id], {
      totalRuns: 0,
      totalRoomsCleared: 0,
      bossKills: 0,
      bossChestRareFailures: 0,
    });
  });

  const cityState = useCityStore.getState();
  assert.deepEqual(cityState.unlockedCityIds, [PINEWIND_CITY_ID]);
  assert.equal(cityState.currentCityId, PINEWIND_CITY_ID);
  assert.equal(cityState.selectedModuleByCity[PINEWIND_CITY_ID], 'outskirts');
});

test('bootstrapLiveWorldStores is additive and preserves existing ruins progress on repeated initialization', () => {
  const content = useContentStore.getState().raw;
  assert.ok(content);

  const seededRuinId = content.ruins[0]?.id;
  const missingRuinId = content.ruins.at(-1)?.id;
  assert.ok(seededRuinId);
  assert.ok(missingRuinId);

  useRuinsStore.setState({
    progressByRuinId: {
      [seededRuinId]: {
        totalRuns: 9,
        totalRoomsCleared: 44,
        bossKills: 3,
        bossChestRareFailures: 2,
        bestRunSeconds: 88.5,
      },
    },
  });

  bootstrapLiveWorldStores({
    cities: content.cities,
    ruins: content.ruins,
    majorRealmId: 'qi_condensation',
  });

  assert.deepEqual(useRuinsStore.getState().progressByRuinId[seededRuinId], {
    totalRuns: 9,
    totalRoomsCleared: 44,
    bossKills: 3,
    bossChestRareFailures: 2,
    bestRunSeconds: 88.5,
  });
  assert.deepEqual(useRuinsStore.getState().progressByRuinId[missingRuinId], {
    totalRuns: 0,
    totalRoomsCleared: 0,
    bossKills: 0,
    bossChestRareFailures: 0,
  });
});

test('ContentInitGate source uses bootstrapLiveWorldStores instead of a divergent manual bootstrap sequence', async () => {
  const source = await readFile(repoPath('src/components/system/ContentInitGate.tsx'), 'utf8');

  assert.match(source, /bootstrapLiveWorldStores/);
  assert.match(source, /bootstrapLiveWorldStores\s*\(\s*\{/s);
  assert.doesNotMatch(source, /initializeFromContent\(citiesSorted\)/);
  assert.doesNotMatch(source, /syncRealmEntry\(getLiveRealmByIndex\(realmIndex\)\.id\)/);
});

test('ruins preview start path enters an active ruins run', () => {
  const content = useContentStore.getState().raw;
  assert.ok(content);

  bootstrapLiveWorldStores({
    cities: content.cities,
    ruins: content.ruins,
    majorRealmId: 'qi_condensation',
  });

  const pinewind = content.cities.find((city) => city.id === PINEWIND_CITY_ID) ?? null;
  assert.ok(pinewind);
  const ruinId = resolveModuleRef(pinewind, 'ruins');
  assert.ok(ruinId);

  useUIStore.getState().openCombatPreview({
    type: 'ruins',
    cityId: PINEWIND_CITY_ID,
    sourceId: ruinId,
  });

  let uiState = useUIStore.getState();
  assert.equal(uiState.combatPresentation.mode, 'preview');
  assert.equal(uiState.combatPresentation.context?.type, 'ruins');
  assert.equal(uiState.combatPresentation.context?.cityId, PINEWIND_CITY_ID);
  assert.equal(uiState.combatPresentation.context?.sourceId, ruinId);

  useUIStore.getState().startCombatFromPreview();

  uiState = useUIStore.getState();
  assert.equal(useActivityStore.getState().active?.type, 'ruins');
  assert.equal(useRuinsStore.getState().activeRun?.ruinId, ruinId);
  assert.equal(uiState.combatPresentation.mode, 'active');

  useRuinsStore.getState().stopRun();
  useCombatStore.getState().exitCombat();
  useActivityStore.getState().stopActivity();
  useUIStore.getState().stopCombatAndClose();

  assert.equal(useRuinsStore.getState().activeRun, null);
  assert.equal(useActivityStore.getState().active, null);
  assert.equal(useUIStore.getState().combatPresentation.mode, 'hidden');
});
