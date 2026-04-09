import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readRepoFile = (relativePath: string) => fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

test('CultivationFxScene stays scoped to one halo, one mist family, one mote family, and optional glints', async () => {
  const source = await readRepoFile('src/ui/fx/scenes/CultivationFxScene.tsx');

  assert.match(source, /cultivationFxScene__halo/);
  assert.match(source, /cultivationFxScene__mist/);
  assert.match(source, /cultivationFxScene__motes/);
  assert.match(source, /cultivationFxScene__glint/);
  assert.doesNotMatch(source, /ember|confetti|spark|storm/i);
});

test('Cultivation screen mounts only one cultivation scene owner via ScreenFxStage + FxStagePortal', async () => {
  const source = await readRepoFile('src/components/screens/CultivateScreen.tsx');

  assert.match(source, /<ScreenFxStage[\s\S]*stageId=\{FX_STAGE_IDS\.cultivation\}/);
  assert.equal((source.match(/<CultivationFxScene/g) ?? []).length, 1);
});
