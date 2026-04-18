import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { getOutskirtsModuleViewState } from '../../src/features/world/outskirts/getOutskirtsModuleViewState.js';

void test('P9 module view state routes unavailable/planning/activeContained deterministically', () => {
  const cityId = 'city_pinewind_hamlet';
  const outskirtsDefId = 'outskirts_pinewind';

  assert.equal(
    getOutskirtsModuleViewState({
      cityId,
      outskirtsDefId: null,
      activity: null,
      combatContext: null,
    }),
    'unavailable',
  );

  assert.equal(
    getOutskirtsModuleViewState({
      cityId,
      outskirtsDefId,
      activity: null,
      combatContext: null,
    }),
    'planning',
  );

  assert.equal(
    getOutskirtsModuleViewState({
      cityId,
      outskirtsDefId,
      activity: {
        type: 'outskirts',
        cityId,
        sourceId: outskirtsDefId,
        startedAt: 0,
        payload: {},
      },
      combatContext: null,
    }),
    'activeContained',
  );

  assert.equal(
    getOutskirtsModuleViewState({
      cityId,
      outskirtsDefId,
      activity: null,
      combatContext: {
        type: 'outskirts',
        cityId,
        sourceId: outskirtsDefId,
        cityIndex: 0,
        isBoss: false,
      },
    }),
    'activeContained',
  );
});

void test('P9 outskirts panel wires planning to exact mockup and active to containment wrapper', () => {
  const panelPath = path.resolve(process.cwd(), 'src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx');
  const source = fs.readFileSync(panelPath, 'utf-8');

  assert.match(source, /const viewState = getOutskirtsModuleViewState\(/);
  assert.match(source, /if \(viewState === 'planning'\) \{/);
  assert.match(source, /OutskirtsExactMockupScreen surface=\{planningSurface\} onStartHunt=\{handleStartHunt\}/);
  assert.match(source, /<OutskirtsActiveCombatContainment>/);
  assert.doesNotMatch(source, /if \(isPlanningState\) \{/);
});
