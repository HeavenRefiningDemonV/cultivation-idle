import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { resolveFxLayerOrder } from '../../src/ui/fx/shellContract.js';

const readSource = (relativePath: string) =>
  fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

test('ScreenFxStage z-order normalization preserves DOM-above-FX contract', () => {
  const valid = resolveFxLayerOrder(1, 2);
  assert.equal(valid.stageZIndex, 1);
  assert.equal(valid.contentZIndex, 2);
  assert.equal(valid.corrected, false);

  const corrected = resolveFxLayerOrder(4, 3);
  assert.equal(corrected.stageZIndex, 4);
  assert.equal(corrected.contentZIndex, 5);
  assert.equal(corrected.corrected, true);
});

test('ScreenFxStage source preserves canonical root/layer/content semantics including disabled path', async () => {
  const source = await readSource('src/ui/fx/ScreenFxStage.tsx');

  assert.match(source, /screenFxStage/);
  assert.match(source, /screenFxStage__layer/);
  assert.match(source, /screenFxStage__content/);
  assert.match(source, /data-fx-stage-disabled=/);
  assert.match(source, /data-fx-stage-id=/);
  assert.match(source, /aria-hidden="true"/);
  assert.match(source, /tabIndex=\{-1\}/);
});
