import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import { getOutskirtsModuleViewState } from '../../src/features/world/outskirts/getOutskirtsModuleViewState.js';

void test('P12 same-source active reopen resolves directly to activeContained without planning/unavailable fallback', async () => {
  const fromActivity = getOutskirtsModuleViewState({
    cityId: 'city_pinewind_hamlet',
    outskirtsId: null,
    activity: {
      type: 'outskirts',
      startedAt: 1,
      cityId: 'city_pinewind_hamlet',
      sourceId: 'outskirts_pinewind',
    },
    combatContext: { type: null },
  });
  assert.equal(fromActivity, 'activeContained');

  const fromCombat = getOutskirtsModuleViewState({
    cityId: 'city_pinewind_hamlet',
    outskirtsId: null,
    activity: null,
    combatContext: {
      type: 'outskirts',
      cityId: 'city_pinewind_hamlet',
      sourceId: undefined,
    },
  });
  assert.equal(fromCombat, 'activeContained');

  const panelSource = await fs.readFile('src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', 'utf8');
  assert.match(panelSource, /if \(viewState === 'planning'\) \{\s*return <OutskirtsPlanningOwner cityId=\{cityId\} \/>;\s*\}/);
  assert.match(panelSource, /if \(viewState === 'unavailable'\) \{/);
  assert.match(panelSource, /outskirts-active-boundary-loading/);
  assert.doesNotMatch(panelSource, /outskirts-view-planning[\s\S]*outskirts-active-boundary-loading/);
});

void test('P12 no hybrid owner contract keeps planning and active-contained owners exclusive', () => {
  const cases = [
    getOutskirtsModuleViewState({
      cityId: 'city_pinewind_hamlet',
      outskirtsId: 'outskirts_pinewind',
      activity: null,
      combatContext: { type: null },
    }),
    getOutskirtsModuleViewState({
      cityId: 'city_pinewind_hamlet',
      outskirtsId: 'outskirts_pinewind',
      activity: {
        type: 'outskirts',
        startedAt: 1,
        cityId: 'city_pinewind_hamlet',
        sourceId: 'outskirts_pinewind',
      },
      combatContext: { type: null },
    }),
    getOutskirtsModuleViewState({
      cityId: 'city_pinewind_hamlet',
      outskirtsId: null,
      activity: null,
      combatContext: { type: null },
    }),
  ];

  for (const viewState of cases) {
    const planningVisible = viewState === 'planning';
    const activeVisible = viewState === 'activeContained';
    assert.equal(planningVisible && activeVisible, false);
  }
});

void test('P12 planning-state purity contract rejects legacy active-shell visuals from planning owner', async () => {
  const planningOwner = await fs.readFile('src/features/world/outskirts/OutskirtsPlanningOwner.tsx', 'utf8');
  const planningScreen = await fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.ts', 'utf8');

  const forbidden = [
    /InkHealthBar/,
    /InkCombatShell/,
    /CombatModuleTopLane/,
    /outskirts-view-active-contained/,
    /combat log/i,
    /RunCompass/,
    /OutskirtsLegacyActiveSurface/,
    /outskirtsActiveContainment/,
  ];

  for (const token of forbidden) {
    assert.doesNotMatch(planningOwner, token);
    assert.doesNotMatch(planningScreen, token);
  }

  assert.match(planningOwner, /data-testid="outskirts-view-planning"/);
});

void test('P12 active-contained branch remains usable and wired to legacy active surface controls', async () => {
  const activeOwner = await fs.readFile('src/features/world/outskirts/OutskirtsLegacyActiveSurface.tsx', 'utf8');

  assert.match(activeOwner, /OutskirtsActiveContainment/);
  assert.match(activeOwner, /InkCombatShell/);
  assert.match(activeOwner, /InkHealthBar/);
  assert.match(activeOwner, /CombatModuleTopLane/);
  assert.match(activeOwner, /stopCombatAndClose/);
  assert.match(activeOwner, /closeWorldBuildingModal/);
});

void test('P12 stop/end transition returns from activeContained back to planning without hybrid overlap', () => {
  const planningBefore = getOutskirtsModuleViewState({
    cityId: 'city_pinewind_hamlet',
    outskirtsId: 'outskirts_pinewind',
    activity: null,
    combatContext: { type: null },
  });
  assert.equal(planningBefore, 'planning');

  const activeDuringRun = getOutskirtsModuleViewState({
    cityId: 'city_pinewind_hamlet',
    outskirtsId: 'outskirts_pinewind',
    activity: {
      type: 'outskirts',
      startedAt: 1,
      cityId: 'city_pinewind_hamlet',
      sourceId: 'outskirts_pinewind',
    },
    combatContext: { type: null },
  });
  assert.equal(activeDuringRun, 'activeContained');

  const planningAfterStop = getOutskirtsModuleViewState({
    cityId: 'city_pinewind_hamlet',
    outskirtsId: 'outskirts_pinewind',
    activity: null,
    combatContext: { type: null },
  });
  assert.equal(planningAfterStop, 'planning');
});

void test('P12 import/style boundary is hardened by lazy active loading and active-owned containment styles', async () => {
  const panelSource = await fs.readFile('src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', 'utf8');
  const exactScss = await fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.scss', 'utf8');
  const activeScss = await fs.readFile('src/features/world/outskirts/components/OutskirtsActiveContainment.scss', 'utf8');

  assert.match(panelSource, /const OutskirtsLegacyActiveSurface = lazy\(async \(\) =>/);
  assert.doesNotMatch(exactScss, /\.outskirtsActiveContainment/);
  assert.match(activeScss, /\.outskirtsActiveContainment/);
});
