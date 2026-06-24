import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FORTUNE_DRAW_FIXTURE_SEEDS,
  FORTUNE_DRAW_FIXTURE_LIST,
} from '../../src/systems/ui/fortune/fortuneDrawFixtures.js';
import {
  FORTUNE_DRAW_SCHEMA_VERSION,
  FORTUNE_DRAW_VISUAL_STATE_OPTIONS,
  FORTUNE_RARITY_FRAME_OPTIONS,
} from '../../src/systems/ui/fortune/fortuneDrawTypes.js';
import { ITEM_DETAIL_SCHEMA_VERSION } from '../../src/systems/ui/modals/itemDetailTypes.js';

/**
 * M.IV.1 ARTS-MECH / Step 1 — the Fortune Draw surface is the render-only contract the M.IV.2 artifact targets
 * and the M.IV.3 port consumes. Mirrors EquipmentExactSurface.fixture: schema/state-matrix coverage, the
 * render-only law (no functions, no store handles), rarity-never-hue-alone, the fate-thread invariants, and
 * selectedDetail = the EXACT F2 ItemDetailSurfaceV1.
 */

/** Deep walk — the render-only law: no field anywhere may be a function. */
function assertNoFunctions(node: unknown, path: string): void {
  if (node === null || node === undefined) return;
  assert.notEqual(typeof node, 'function', `render-only law violated: function at ${path}`);
  if (Array.isArray(node)) {
    node.forEach((v, i) => assertNoFunctions(v, `${path}[${i}]`));
  } else if (typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) assertNoFunctions(v, `${path}.${k}`);
  }
}

test('Fortune Draw: every state in the matrix has a fixture with the right schema + visualState', () => {
  for (const state of FORTUNE_DRAW_VISUAL_STATE_OPTIONS) {
    const s = FORTUNE_DRAW_FIXTURE_SEEDS[state];
    assert.ok(s, `fixture for ${state} present`);
    assert.equal(s.schemaVersion, FORTUNE_DRAW_SCHEMA_VERSION, `${state}: schemaVersion`);
    assert.equal(s.visualState, state, `${state}: visualState matches its key`);
  }
  assert.equal(FORTUNE_DRAW_FIXTURE_LIST.length, FORTUNE_DRAW_VISUAL_STATE_OPTIONS.length, 'list covers the matrix');
});

test('Fortune Draw: render-only law — no functions, no store handles anywhere in any fixture', () => {
  for (const s of FORTUNE_DRAW_FIXTURE_LIST) assertNoFunctions(s, s.visualState);
});

test('Fortune Draw: rarity is never hue-alone — every offer pairs a frame grade with a label', () => {
  for (const s of FORTUNE_DRAW_FIXTURE_LIST) {
    for (const o of s.offers) {
      assert.ok(FORTUNE_RARITY_FRAME_OPTIONS.includes(o.rarityFrameGrade), `${s.visualState}/${o.stockId}: valid frame`);
      assert.ok((o.rarityLabel ?? '').length > 0, `${s.visualState}/${o.stockId}: rarityLabel present`);
      assert.ok((o.kindLabel ?? '').length > 0, `${s.visualState}/${o.stockId}: kindLabel present`);
      assert.ok((o.gradeLabel ?? '').length > 0, `${s.visualState}/${o.stockId}: gradeLabel present`);
    }
  }
});

test('Fortune Draw: the fate-thread (pity) is never-regress-shaped — ratios in [0,1], guaranteed iff at threshold', () => {
  for (const s of FORTUNE_DRAW_FIXTURE_LIST) {
    for (const trackName of ['epic', 'legendary'] as const) {
      const t = s.fateThread[trackName];
      assert.ok(t.ratio >= 0 && t.ratio <= 1, `${s.visualState}/${trackName}: ratio in [0,1]`);
      assert.ok(t.current <= t.threshold, `${s.visualState}/${trackName}: current never exceeds threshold (clamped)`);
      assert.equal(t.guaranteed, t.current >= t.threshold, `${s.visualState}/${trackName}: guaranteed iff at threshold`);
    }
    assert.ok((s.fateThread.headline ?? '').length > 0, `${s.visualState}: fate-thread headline present`);
  }
});

test('Fortune Draw: pityGuaranteed surfaces a guaranteed track; the reroll note is never-regress', () => {
  const g = FORTUNE_DRAW_FIXTURE_SEEDS.pityGuaranteed;
  assert.ok(g.fateThread.epic.guaranteed || g.fateThread.legendary.guaranteed, 'a guarantee is live');
  for (const s of FORTUNE_DRAW_FIXTURE_LIST) {
    assert.ok((s.reroll.note ?? '').length > 0, `${s.visualState}: reroll note (never-regress promise) present`);
  }
});

test('Fortune Draw: a reveal carries a verbatim aria-live announcement; postDraw-rare reveals a rare+ tier', () => {
  const rare = FORTUNE_DRAW_FIXTURE_SEEDS['postDraw-rare'];
  assert.ok(rare.reveal, 'postDraw-rare has a reveal');
  assert.ok(['rare', 'epic', 'legendary'].includes(rare.reveal!.rarity), 'postDraw-rare is a rare+ tier');
  assert.ok(rare.reveal!.announce.toLowerCase().includes('manual'), 'announce names the drawn manual');
  const common = FORTUNE_DRAW_FIXTURE_SEEDS['postDraw-common'];
  assert.equal(common.reveal?.rarity, 'common', 'postDraw-common reveals a common');
});

test('Fortune Draw: selectedDetail, when present, is the EXACT F2 ItemDetailSurfaceV1', () => {
  for (const s of FORTUNE_DRAW_FIXTURE_LIST) {
    if (s.selectedDetail) {
      assert.equal(s.selectedDetail.schemaVersion, ITEM_DETAIL_SCHEMA_VERSION, `${s.visualState}: F2 inspector schema`);
    }
  }
});

test('Fortune Draw: the empty state declares its legend; satchel count matches its entries', () => {
  const empty = FORTUNE_DRAW_FIXTURE_SEEDS.empty;
  assert.ok((empty.emptyLegend ?? '').length > 0, 'empty legend present');
  for (const s of FORTUNE_DRAW_FIXTURE_LIST) {
    assert.equal(s.satchel.count, s.satchel.entries.length, `${s.visualState}: satchel count matches entries`);
  }
});
