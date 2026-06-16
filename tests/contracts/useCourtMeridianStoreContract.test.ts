import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { COURT_BASE_RATE_PER_MIN, useCourtMeridianStore } from '../../src/features/court/useCourtMeridianStore.js';
import { COMPREHENSION_FLOOR, SPIRIT_ROOT_GRADES, type PathMeridianDef } from '../../src/systems/meridians/index.js';

/**
 * W13a-2 — the live (in-memory) meridian-training store. Thin glue over the W3 pure
 * engine; these contracts lock the glue: set-active creates fresh progress, intensity,
 * deterministic root rolls, the advance tick (rate→advance + forge-heat accrual), and
 * fatigue recovery. Persistence is a later save-schema step.
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

test('W13a setActiveMeridian selects + seeds fresh progress at the comprehension floor', () => {
  reset();
  const id = DEFS.find((d) => d.path === 'martial' && d.unlockRealm === 1)!.id;
  useCourtMeridianStore.getState().setActiveMeridian(id);
  const s = useCourtMeridianStore.getState();
  assert.equal(s.activeMeridianId, id);
  assert.equal(s.progressByMeridianId[id].rating, 0);
  assert.equal(s.progressByMeridianId[id].comprehension, COMPREHENSION_FLOOR);
});

test('W13a setIntensity + ensureRootsForPath (deterministic, no overwrite)', () => {
  reset();
  useCourtMeridianStore.getState().setIntensity('harsh');
  assert.equal(useCourtMeridianStore.getState().intensityId, 'harsh');

  const ids = DEFS.filter((d) => d.path === 'martial').map((d) => d.id);
  useCourtMeridianStore.getState().ensureRootsForPath(ids, () => 0); // → all heavenly
  const roots = useCourtMeridianStore.getState().rootByMeridianId;
  for (const id of ids) {
    assert.ok(SPIRIT_ROOT_GRADES.includes(roots[id]));
    assert.equal(roots[id], 'heavenly');
  }
  // does not overwrite an existing roll
  useCourtMeridianStore.getState().ensureRootsForPath([ids[0]], () => 0.999);
  assert.equal(useCourtMeridianStore.getState().rootByMeridianId[ids[0]], 'heavenly');
});

test('W13a advanceActive raises the active meridian and accrues forge heat; sealed/no-active are no-ops', () => {
  reset();
  const active = DEFS.find((d) => d.path === 'martial' && d.unlockRealm === 1)!;
  const sealed = DEFS.find((d) => d.path === 'martial' && d.unlockRealm === 7)!;

  // no active → no-op
  useCourtMeridianStore.getState().advanceActive({ dtSeconds: 60, realmIndex1to7: 4, perception: 25, meridianDefs: DEFS });
  assert.equal(useCourtMeridianStore.getState().fatigue, 0);

  useCourtMeridianStore.getState().setActiveMeridian(active.id);
  useCourtMeridianStore.getState().ensureRootsForPath([active.id], () => 0.5);
  useCourtMeridianStore.getState().advanceActive({ dtSeconds: 600, realmIndex1to7: 4, perception: 25, meridianDefs: DEFS });
  const s = useCourtMeridianStore.getState();
  const p = s.progressByMeridianId[active.id];
  assert.ok(p.rating > 0 || p.ratingXp > 0, 'active meridian advanced');
  assert.ok(s.fatigue > 0, 'forge heat accrued');
  assert.equal(COURT_BASE_RATE_PER_MIN, 2.4);

  // sealed meridian (unlockRealm 7 > realm 4) gains no rating
  reset();
  useCourtMeridianStore.getState().setActiveMeridian(sealed.id);
  useCourtMeridianStore.getState().advanceActive({ dtSeconds: 600, realmIndex1to7: 4, perception: 25, meridianDefs: DEFS });
  assert.equal(useCourtMeridianStore.getState().progressByMeridianId[sealed.id].rating, 0);
});

test('W13a recoverFatigue eases forge heat toward 0 (clamped)', () => {
  reset();
  useCourtMeridianStore.setState({ fatigue: 10 });
  useCourtMeridianStore.getState().recoverFatigue(60); // 6/min × 1min = 6
  assert.ok(Math.abs(useCourtMeridianStore.getState().fatigue - 4) < 1e-9);
  useCourtMeridianStore.getState().recoverFatigue(6000); // clamps at 0
  assert.equal(useCourtMeridianStore.getState().fatigue, 0);
});
