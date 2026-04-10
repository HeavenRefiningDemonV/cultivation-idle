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

test('world building modal keeps one centralized entry surface model and explicit live module mounts', async () => {
  const modalSource = await readRepoFile('src/components/modals/WorldBuildingModal.tsx');

  assert.match(modalSource, /type WorldModalEntrySurface/);
  assert.match(modalSource, /function resolveWorldModalEntrySurface/);
  assert.match(modalSource, /showContextStrip: shellMode === 'context-strip'/);
  assert.match(modalSource, /WORLD_MODAL_LIVE_KEYS/);

  LIVE_MODULE_CASES.forEach((moduleKey) => {
    assert.match(modalSource, new RegExp(`case '${moduleKey}'\\s*:`));
  });

  assert.match(modalSource, /case 'apothecary':\s+case 'alchemy':\s+backgroundVariant = 'apothecary'/s);
  assert.match(modalSource, /default:\s+content = isCombatModule\(buildingKey\)\s+\? null/s);
});
