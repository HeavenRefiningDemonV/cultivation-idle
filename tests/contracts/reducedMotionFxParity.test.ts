import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readRepoFile = (relativePath: string) => fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

test('CultivationFxScene includes explicit reducedMotion style branch and static fallback attrs', async () => {
  const style = await readRepoFile('src/ui/fx/scenes/CultivationFxScene.scss');
  const scene = await readRepoFile('src/ui/fx/scenes/CultivationFxScene.tsx');

  assert.match(style, /data-quality='reducedMotion'/);
  assert.match(style, /animation:\s*none;/);
  assert.match(scene, /data-static=/);
  assert.match(scene, /data-can-animate=/);
});
