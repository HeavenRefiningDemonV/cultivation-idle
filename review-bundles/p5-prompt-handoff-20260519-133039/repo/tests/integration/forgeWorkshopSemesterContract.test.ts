import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { buildForgeSurfaceModel, buildLiveForgeCatalog } from '../../src/content/index.js';
import { buildForgeFloorReadModel } from '../../src/systems/forge/forgeFloorReadModel.js';
import { listForgeBlueprintsForCity } from '../../src/stores/contentStore.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

const readRepoFile = (relativePath: string) => fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

let validatedPromise: Promise<ReturnType<typeof validateLoadedContent>> | null = null;
async function getValidated() {
  if (!validatedPromise) validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  return validatedPromise;
}

test('packet 3.5B mounted live Forge surface keeps semester tabs and semester-clean data only', async () => {
  const validated = await getValidated();
  useContentStore.setState({ raw: validated, isLoaded: true, isLoading: false, error: null });
  const blueprints = listForgeBlueprintsForCity({ cityId: 'city_pinewind_hamlet' });
  const surface = buildForgeSurfaceModel({
    blueprints,
    activeTab: 'refine',
    floor: buildForgeFloorReadModel({
      weaponRefineFloor: 2,
      accessoryRefineFloor: 1,
      temperSuccessesBySlot: { weapon: 0, accessory: 0 },
      inventoryRuneCounts: {},
      socketedRuneIds: [],
      cityIndex: 0,
    }),
  });
  const catalog = buildLiveForgeCatalog(validated);

  assert.deepEqual(surface.tabs.map((tab) => tab.label), ['Refine', 'Temper', 'Runes']);
  assert.equal(surface.tabs.some((tab) => tab.label === 'All'), false);
  assert.equal(surface.tabs.some((tab) => tab.label === 'Components'), false);
  assert.equal(surface.tabs.some((tab) => tab.label === 'Formation'), false);

  const visibleIds = new Set(surface.tabs.flatMap((tab) => tab.blueprints.map((blueprint) => blueprint.id)));
  assert.equal(visibleIds.has('formation_plate_basic'), false);
  assert.equal(visibleIds.has('forge_jade_core_shell_t1'), false);
  assert.equal(visibleIds.has('rune_inscription_basic'), false);
  assert.equal(catalog.entriesById.forge_temper_weapon_t1?.status, 'visible_live');
});

test('packet 3.5B world modal defaults to Forge Exact while preserving the semester-safe legacy ForgeWorkshop fallback', async () => {
  const [modalSource, workshopSource, legacyPanelSource, entrySurfaceSource] = await Promise.all([
    readRepoFile('src/components/modals/WorldBuildingModal.tsx'),
    readRepoFile('src/features/professions/forge/ForgeWorkshop.tsx'),
    readRepoFile('src/components/screens/ForgePanel.tsx'),
    readRepoFile('src/systems/ui/world/worldBuildingModalEntrySurface.ts'),
  ]);

  assert.match(modalSource, /case 'forge':/);
  assert.match(modalSource, /forgeExactMode === 'legacy'/);
  assert.match(modalSource, /<ForgeExactScreenOwner/);
  assert.match(modalSource, /<ForgeWorkshop cityId=\{storeCityId\} \/>/);
  assert.match(entrySurfaceSource, /backgroundVariant = 'forge-exact'/);
  assert.match(entrySurfaceSource, /shellFamily = 'forge-scenic'/);
  assert.match(workshopSource, /buildForgeSurfaceModel/);
  assert.match(workshopSource, /surfaceModel\.headline/);
  assert.match(workshopSource, /type LiveForgeSurfaceTab/);
  assert.match(workshopSource, /useState<LiveForgeSurfaceTab>\('refine'\)/);
  assert.doesNotMatch(workshopSource, /useState<LiveForgeSurfaceTab>\('all'\)/);
  assert.doesNotMatch(workshopSource, /useState<LiveForgeSurfaceTab>\('components'\)/);
  assert.match(legacyPanelSource, /return <ForgeWorkshop cityId=\{cityId\} \/>;/);
});
