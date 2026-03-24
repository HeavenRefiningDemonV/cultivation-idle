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
  assert.match(uiStoreSource, /worldBuildingModalIntent/);
  assert.match(uiStoreSource, /apothecarySurface\?: 'buy' \| 'brew' \| 'pouch'/);
});
