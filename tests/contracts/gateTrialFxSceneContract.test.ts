import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { FX_STAGE_IDS } from '../../src/ui/fx/constants.js';
import { isSceneKindAllowedForStage } from '../../src/ui/fx/shellContract.js';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('P6.3C gate trial scene is legal for gate-trial stage and mounted on world-facing screen', () => {
  const panel = read('src/components/screens/world/buildings/GateTrialBuildingPanel.tsx');
  const scene = read('src/ui/fx/scenes/GateTrialFxScene.tsx');

  assert.equal(isSceneKindAllowedForStage(FX_STAGE_IDS.gateTrial, 'gateTrial'), true);
  assert.match(panel, /stageId=\{FX_STAGE_IDS\.gateTrial\}/);
  assert.match(panel, /sceneKind: 'gateTrial'/);
  assert.match(panel, /GateTrialFxScene/);
  assert.match(scene, /gateTrialFxScene__mist/);
  assert.match(scene, /gateTrialFxScene__sealGlow/);
  assert.match(scene, /gateTrialFxScene__sealAura/);
});

test('P6.3C gate trial scene keeps local-noise profile restrained', () => {
  const scene = read('src/ui/fx/scenes/GateTrialFxScene.tsx');
  const styles = read('src/ui/fx/scenes/GateTrialFxScene.scss');

  assert.match(scene, /effectiveQuality !== 'high'/);
  assert.match(styles, /gateTrialMistDriftFar 24s/);
  assert.match(styles, /gateTrialMistDriftNear 18s/);
  assert.match(styles, /gateTrialSealBreath 14s/);
  assert.doesNotMatch(styles, /blink|strobe|flash/i);
});
