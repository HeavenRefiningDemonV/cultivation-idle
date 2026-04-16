import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { FX_ALLOWED_SCENE_KINDS_BY_STAGE } from '../../src/ui/fx/shellContract.js';
import { FX_STAGE_IDS } from '../../src/ui/fx/constants.js';

const readSource = (relativePath: string) =>
  fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

test('scene-kind policy map covers all canonical stage ids', () => {
  const keys = Object.keys(FX_ALLOWED_SCENE_KINDS_BY_STAGE).sort();
  const canonical = Object.values(FX_STAGE_IDS).slice().sort();
  assert.deepEqual(keys, canonical);

  for (const stageId of canonical) {
    const allowed = FX_ALLOWED_SCENE_KINDS_BY_STAGE[stageId] ?? [];
    assert.equal(allowed.includes('generic'), true);
    assert.equal(allowed.includes(stageId as any), true);
  }
});

test('stub scenes remain legal no-asset null-return placeholders', async () => {
  const forgeScene = await readSource('src/ui/fx/scenes/ForgeFxScene.tsx');
  const selectionScene = await readSource('src/ui/fx/scenes/SelectionFxScene.tsx');

  assert.match(forgeScene, /return null;/);
  assert.match(selectionScene, /return null;/);
});

test('proof surfaces continue using ScreenFxStage + FxStagePortal contract path', async () => {
  const cultivation = await readSource('src/components/screens/CultivateScreen.tsx');
  const status = await readSource('src/components/screens/StatusScreen.tsx');
  const ruinsPanel = await readSource('src/components/screens/world/buildings/RuinsBuildingPanel.tsx');
  const gateTrialPanel = await readSource('src/components/screens/world/buildings/GateTrialBuildingPanel.tsx');

  assert.match(cultivation, /ScreenFxStage/);
  assert.match(cultivation, /FxStagePortal/);
  assert.match(status, /ScreenFxStage/);
  assert.match(status, /FxStagePortal/);
  assert.match(ruinsPanel, /ScreenFxStage/);
  assert.match(ruinsPanel, /FxStagePortal/);
  assert.match(ruinsPanel, /RuinsFxScene/);
  assert.match(gateTrialPanel, /ScreenFxStage/);
  assert.match(gateTrialPanel, /FxStagePortal/);
  assert.match(gateTrialPanel, /GateTrialFxScene/);
});
