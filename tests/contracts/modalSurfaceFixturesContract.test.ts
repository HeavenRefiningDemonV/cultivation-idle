import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ITEM_DETAIL_FIXTURE_SEEDS,
  ITEM_DETAIL_SCHEMA_VERSION,
  RITUAL_FRAME_FIXTURE_SEEDS,
  RITUAL_FRAME_SCHEMA_VERSION,
  buildItemDetailSurface,
  buildRitualFrameSurface,
} from '../../src/systems/ui/modals/index.js';

test('F2: item-detail fixtures cover the full matrix and build with the right schema version', () => {
  assert.equal(ITEM_DETAIL_FIXTURE_SEEDS.length, 10);
  for (const seed of ITEM_DETAIL_FIXTURE_SEEDS) {
    const s = buildItemDetailSurface(seed);
    assert.equal(s.schemaVersion, ITEM_DETAIL_SCHEMA_VERSION);
  }
});

test('F2: ritual-shell fixtures cover the full matrix and build with the right schema version', () => {
  assert.equal(RITUAL_FRAME_FIXTURE_SEEDS.length, 8);
  for (const seed of RITUAL_FRAME_FIXTURE_SEEDS) {
    const s = buildRitualFrameSurface(seed);
    assert.equal(s.schemaVersion, RITUAL_FRAME_SCHEMA_VERSION);
  }
});

test('F2: every fixture builder is DETERMINISTIC (two builds deep-equal — no live RNG)', () => {
  for (const seed of ITEM_DETAIL_FIXTURE_SEEDS) {
    assert.deepEqual(buildItemDetailSurface(seed), buildItemDetailSurface(seed), `item ${seed}`);
  }
  for (const seed of RITUAL_FRAME_FIXTURE_SEEDS) {
    assert.deepEqual(buildRitualFrameSurface(seed), buildRitualFrameSurface(seed), `ritual ${seed}`);
  }
});

test('F2: an unknown seed id throws (no silent empty surface)', () => {
  assert.throws(() => buildItemDetailSurface('nope'));
  assert.throws(() => buildRitualFrameSurface('nope'));
});
