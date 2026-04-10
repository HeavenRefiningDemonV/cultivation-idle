import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';

test('world module opener and modal support apothecary pouch intent wiring', async () => {
  const openWorldModuleSource = await fs.readFile('src/systems/world/openWorldModule.ts', 'utf8');
  const worldBuildingModalSource = await fs.readFile('src/components/modals/WorldBuildingModal.tsx', 'utf8');
  const uiStoreSource = await fs.readFile('src/stores/uiStore.ts', 'utf8');

  assert.match(openWorldModuleSource, /intent\?: WorldBuildingModalIntent/);
  assert.match(openWorldModuleSource, /openWorldBuildingModal\(\{ cityId, buildingKey: normalizedModuleKey as WorldBuildingKey, intent \}\)/);
  assert.match(worldBuildingModalSource, /storeModalIntent\?\.apothecarySurface/);
  assert.match(worldBuildingModalSource, /Opened to Brew/);
  assert.match(worldBuildingModalSource, /Opened for Medicine Pouch/);
  assert.match(uiStoreSource, /worldBuildingModalIntent/);
  assert.match(uiStoreSource, /apothecarySurface\?: 'buy' \| 'brew' \| 'pouch'/);
});

test('world building modal hard-gates to live world modules and city-supported targets', async () => {
  const worldBuildingModalSource = await fs.readFile('src/components/modals/WorldBuildingModal.tsx', 'utf8');

  assert.match(worldBuildingModalSource, /inspectWorldFacingModuleTarget/);
  assert.match(worldBuildingModalSource, /!buildingAudit\.ok \|\| !citySupportsBuilding/);
  assert.match(worldBuildingModalSource, /WORLD_MODAL_LIVE_KEYS/);
  assert.match(worldBuildingModalSource, /case 'alchemy':\s+content = <ApothecaryPanel shopId=\{moduleRefId \?\? null\} initialSurface="brew" \/>/);
});
