import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

import { buildFxSceneContract } from '../../src/ui/fx/runtime.js';
import { FX_STAGE_IDS } from '../../src/ui/fx/constants.js';

test('ruins fx scene contract uses bounded local atmosphere families', async () => {
  const source = await readFile('src/ui/fx/scenes/RuinsFxScene.tsx', 'utf8');
  const style = await readFile('src/ui/fx/scenes/RuinsFxScene.scss', 'utf8');

  assert.match(source, /ruinsFxScene__haze/);
  assert.match(source, /ruinsFxScene__torchGlow/);
  assert.match(source, /ruinsFxScene__dustField/);
  assert.match(source, /ruinsFxScene__anchorGlint/);

  assert.match(style, /ruinsHazeDrift/);
  assert.match(style, /ruinsTorchBreathe/);
  assert.match(style, /ruinsDustDrift/);
  assert.match(style, /ruinsAnchorGlint/);
});

test('reduced motion resolves to static-safe no continuous atmosphere requirement', () => {
  const scene = buildFxSceneContract({
    stageId: FX_STAGE_IDS.ruins,
    sceneKind: 'ruins',
    snapshot: {
      stageId: FX_STAGE_IDS.ruins,
      hostElement: { isConnected: true } as HTMLDivElement,
      bounds: { width: 1200, height: 700 },
      dpr: 1,
      hostReady: true,
      dormant: false,
      updatedAt: 1,
    },
    requestedQuality: 'low',
    effectiveQuality: 'reducedMotion',
    prefersReducedMotion: true,
    documentHidden: false,
  });

  assert.equal(scene.sceneKind, 'ruins');
  assert.equal(scene.canAnimateContinuously, false);
  assert.equal(scene.isStatic, true);
});
