import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readRepoFile = (relativePath: string) => fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

const LIVE_MODULE_CASES = [
  'manualPavilion',
  'apothecary',
  'forge',
  'bounties',
  'expeditions',
  'outskirts',
  'gateTrial',
  'ruins',
] as const;

test('world building modal keeps centralized entry surface model and explicit live module mounts', async () => {
  const modalSource = await readRepoFile('src/components/modals/WorldBuildingModal.tsx');
  const entrySurfaceSource = await readRepoFile('src/systems/ui/world/worldBuildingModalEntrySurface.ts');

  assert.match(modalSource, /resolveWorldModalEntrySurface/);
  assert.match(entrySurfaceSource, /export type WorldModalEntrySurface/);
  assert.match(entrySurfaceSource, /showContextStrip: shellMode === 'context-strip'/);
  assert.match(modalSource, /WORLD_MODAL_LIVE_KEYS/);

  LIVE_MODULE_CASES.forEach((moduleKey) => {
    assert.match(modalSource, new RegExp(`case '${moduleKey}'\\s*:`));
  });

  assert.match(entrySurfaceSource, /case 'apothecary':\s+case 'alchemy':\s+backgroundVariant = 'apothecary-exact'/s);
  assert.match(entrySurfaceSource, /case 'apothecary':[\s\S]*shellFamily = 'apothecary-scenic';[\s\S]*shellMode = 'screen-owned';/);
  assert.match(modalSource, /default:\s+content = isCombatModule\(buildingKey\)\s+\? null/s);
});
