import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { courtPerceptionValue } from '../../src/features/court/courtSharedStats.js';
import { runCourtTrainingTick } from '../../src/features/court/courtTrainingTick.js';
import { useCourtMeridianStore } from '../../src/features/court/useCourtMeridianStore.js';
import type { PathMeridianDef } from '../../src/systems/meridians/index.js';

/**
 * W13a-4 — the live training tick (the game-loop hook). Locks: perception resolution from
 * live ratings, advance-while-training, and forge-heat recovery while idle. Drives the
 * already-tested store, so this proves the glue, not the engine.
 */

let DEFS: PathMeridianDef[] = [];
const reset = () =>
  useCourtMeridianStore.setState({
    activeMeridianId: null,
    rootByMeridianId: {},
    progressByMeridianId: {},
    lifetimeTotals: {},
    intensityId: 'steady',
    fatigue: 0,
  });

test('W13a load pack', async () => {
  const file = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config', 'path_meridians.json');
  DEFS = (JSON.parse(await fs.readFile(file, 'utf8')) as { meridians: PathMeridianDef[] }).meridians;
  assert.ok(DEFS.length > 0);
});

test('W13a courtPerceptionValue reads the mapped live stat (recovery_depth → Perception)', () => {
  assert.equal(courtPerceptionValue({ recovery_depth: 30 }), 30);
  assert.equal(courtPerceptionValue({}), 0);
});

test('W13a runCourtTrainingTick advances the active meridian while training', () => {
  reset();
  const active = DEFS.find((d) => d.path === 'martial' && d.unlockRealm === 1)!;
  useCourtMeridianStore.getState().setActiveMeridian(active.id);
  useCourtMeridianStore.getState().ensureRootsForPath([active.id], () => 0.5);

  runCourtTrainingTick(600_000, { trainingAllowed: true, realmIndex0Based: 3, perception: 30, meridianDefs: DEFS });
  const s = useCourtMeridianStore.getState();
  const p = s.progressByMeridianId[active.id];
  assert.ok(p.rating > 0 || p.ratingXp > 0, 'active meridian advanced under the tick');
  assert.ok(s.fatigue > 0, 'forge heat accrued while training');
});

test('W13a runCourtTrainingTick recovers forge heat while NOT training', () => {
  reset();
  useCourtMeridianStore.setState({ fatigue: 20 });
  runCourtTrainingTick(60_000, { trainingAllowed: false, realmIndex0Based: 3, perception: 30, meridianDefs: DEFS });
  assert.ok(useCourtMeridianStore.getState().fatigue < 20, 'forge heat eased while idle');
});

test('W13a runCourtTrainingTick is a no-op for non-positive elapsed', () => {
  reset();
  const active = DEFS.find((d) => d.path === 'martial' && d.unlockRealm === 1)!;
  useCourtMeridianStore.getState().setActiveMeridian(active.id);
  runCourtTrainingTick(0, { trainingAllowed: true, realmIndex0Based: 3, perception: 30, meridianDefs: DEFS });
  assert.equal(useCourtMeridianStore.getState().progressByMeridianId[active.id].rating, 0);
  assert.equal(useCourtMeridianStore.getState().fatigue, 0);
});
