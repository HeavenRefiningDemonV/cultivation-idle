import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import { getOutskirtsModuleViewState } from '../../src/features/world/outskirts/getOutskirtsModuleViewState.js';

void test('P12 same-source active reopen resolves directly to active without planning/unavailable fallback', async () => {
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
  assert.equal(fromActivity, 'active');

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
  assert.equal(fromCombat, 'active');

  const panelSource = await fs.readFile('src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', 'utf8');
  assert.match(panelSource, /if \(viewState === 'unavailable'\) \{/);
  assert.match(panelSource, /return <OutskirtsScreenOwner cityId=\{cityId\} \/>/);
  assert.doesNotMatch(panelSource, /outskirts-active-boundary-loading/);
});

void test('P12 no hybrid owner contract keeps planning and active on same owner', () => {
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
  ];

  assert.deepEqual(cases, ['planning', 'active']);
});

void test('P12 owner/screen purity rejects legacy active-shell visuals from live owner path', async () => {
  const owner = await fs.readFile('src/features/world/outskirts/OutskirtsScreenOwner.tsx', 'utf8');
  const screen = await fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.ts', 'utf8');

  for (const token of [
    /InkHealthBar/,
    /InkCombatShell/,
    /CombatModuleTopLane/,
    /outskirts-view-active-contained/,
    /OutskirtsLegacyActiveSurface/,
    /outskirtsActiveContainment/,
  ]) {
    assert.doesNotMatch(owner, token);
    assert.doesNotMatch(screen, token);
  }

  assert.match(owner, /data-testid="outskirts-view-screen"/);
});

void test('P12 stop/end transition returns from active back to planning without hybrid overlap', () => {
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
  assert.equal(activeDuringRun, 'active');

  const planningAfterStop = getOutskirtsModuleViewState({
    cityId: 'city_pinewind_hamlet',
    outskirtsId: 'outskirts_pinewind',
    activity: null,
    combatContext: { type: null },
  });
  assert.equal(planningAfterStop, 'planning');
});
