import assert from 'node:assert/strict';
import test from 'node:test';

import { ITEM_DETAIL_SCHEMA_VERSION } from '../../src/systems/ui/modals/index.js';
import {
  EQUIPMENT_EXACT_VISUAL_STATE_OPTIONS,
  PANOPLY_EXACT_FIXTURE_SEEDS,
  PANOPLY_EXACT_SCHEMA_VERSION,
  VAULT_EXACT_FIXTURE_SEEDS,
  VAULT_EXACT_SCHEMA_VERSION,
  buildPanoplyExactFixture as buildPanoplyExactSurface,
  buildVaultExactFixture as buildVaultExactSurface,
} from '../../src/systems/ui/equipment/index.js';

/** The render-only guard: no field anywhere in the surface may be a function (no methods, no callbacks). */
const assertNoFunctions = (value: unknown, path: string): void => {
  if (typeof value === 'function') {
    throw new Error(`render-only violation: function-typed field at ${path}`);
  }
  if (Array.isArray(value)) {
    value.forEach((entry, idx) => assertNoFunctions(entry, `${path}[${idx}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) assertNoFunctions(entry, `${path}.${key}`);
  }
};

test('S0: panoply fixtures cover the full state matrix and build with the right schema version', () => {
  assert.deepEqual(
    [...PANOPLY_EXACT_FIXTURE_SEEDS].sort(),
    [...EQUIPMENT_EXACT_VISUAL_STATE_OPTIONS].sort(),
    'every visualState has exactly one panoply fixture',
  );
  for (const seed of PANOPLY_EXACT_FIXTURE_SEEDS) {
    const s = buildPanoplyExactSurface(seed);
    assert.equal(s.schemaVersion, PANOPLY_EXACT_SCHEMA_VERSION);
    assert.equal(s.visualState, seed, 'the seed id is the visual state it produces');
  }
});

test('S0: vault fixtures cover the full state matrix and build with the right schema version', () => {
  assert.deepEqual(
    [...VAULT_EXACT_FIXTURE_SEEDS].sort(),
    [...EQUIPMENT_EXACT_VISUAL_STATE_OPTIONS].sort(),
    'every visualState has exactly one vault fixture',
  );
  for (const seed of VAULT_EXACT_FIXTURE_SEEDS) {
    const s = buildVaultExactSurface(seed);
    assert.equal(s.schemaVersion, VAULT_EXACT_SCHEMA_VERSION);
    assert.equal(s.visualState, seed);
  }
});

test('S0: selectedDetail (when present) is a valid F2 ItemDetailSurfaceV1', () => {
  for (const seed of PANOPLY_EXACT_FIXTURE_SEEDS) {
    const detail = buildPanoplyExactSurface(seed).selectedDetail;
    if (detail) assert.equal(detail.schemaVersion, ITEM_DETAIL_SCHEMA_VERSION, `panoply ${seed}`);
  }
  for (const seed of VAULT_EXACT_FIXTURE_SEEDS) {
    const detail = buildVaultExactSurface(seed).selectedDetail;
    if (detail) assert.equal(detail.schemaVersion, ITEM_DETAIL_SCHEMA_VERSION, `vault ${seed}`);
  }
  // the detail-* states must actually carry a detail payload (the inspector is open)
  assert.ok(buildPanoplyExactSurface('detail-affix').selectedDetail);
  assert.ok(buildPanoplyExactSurface('detail-legendary').selectedDetail);
  assert.ok(buildVaultExactSurface('detail-affix').selectedDetail);
  assert.ok(buildVaultExactSurface('detail-legendary').selectedDetail);
});

test('S0: bond is Martial-only and never a stub — null on non-bonded panoply states', () => {
  // the empty/blocked/contentCap/unknown panoply fixtures carry no weapon bond
  for (const seed of ['empty', 'blocked', 'contentCap', 'unknown'] as const) {
    assert.equal(buildPanoplyExactSurface(seed).bond, null, `${seed} must not stub a bond`);
  }
});

test('S0: every surface is render-only — no function-typed field anywhere', () => {
  for (const seed of PANOPLY_EXACT_FIXTURE_SEEDS) assertNoFunctions(buildPanoplyExactSurface(seed), `panoply:${seed}`);
  for (const seed of VAULT_EXACT_FIXTURE_SEEDS) assertNoFunctions(buildVaultExactSurface(seed), `vault:${seed}`);
});

test('S0: every fixture builder is DETERMINISTIC (two builds deep-equal — no live RNG)', () => {
  for (const seed of PANOPLY_EXACT_FIXTURE_SEEDS) {
    assert.deepEqual(buildPanoplyExactSurface(seed), buildPanoplyExactSurface(seed), `panoply ${seed}`);
  }
  for (const seed of VAULT_EXACT_FIXTURE_SEEDS) {
    assert.deepEqual(buildVaultExactSurface(seed), buildVaultExactSurface(seed), `vault ${seed}`);
  }
});

test('S0: an unknown seed id throws (no silent empty surface)', () => {
  assert.throws(() => buildPanoplyExactSurface('nope'));
  assert.throws(() => buildVaultExactSurface('nope'));
});
