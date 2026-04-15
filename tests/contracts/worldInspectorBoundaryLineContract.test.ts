import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveWorldInspectorBoundaryLine } from '../../src/systems/ui/world/worldInspectorSurface.js';
import { OUTSKIRTS_BOUNDARY_LINE, RUINS_GOLD_SECONDARY_LINE } from '../../src/systems/economy/activityRewardReadModel.js';

void test('world inspector boundary line is shown for outskirts and ruins, and suppressed for other modules', () => {
  assert.equal(
    resolveWorldInspectorBoundaryLine({ moduleKey: 'outskirts', boundaryLineFromHandoff: OUTSKIRTS_BOUNDARY_LINE }),
    OUTSKIRTS_BOUNDARY_LINE,
  );

  assert.equal(
    resolveWorldInspectorBoundaryLine({ moduleKey: 'ruins', boundaryLineFromHandoff: RUINS_GOLD_SECONDARY_LINE }),
    RUINS_GOLD_SECONDARY_LINE,
  );

  assert.equal(
    resolveWorldInspectorBoundaryLine({ moduleKey: 'outskirts', boundaryLineFromHandoff: null }),
    null,
  );

  assert.equal(
    resolveWorldInspectorBoundaryLine({ moduleKey: 'gateTrial', boundaryLineFromHandoff: 'not-used' }),
    null,
  );
});
