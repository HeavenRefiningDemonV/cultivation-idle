import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TECHNIQUE_LEGENDARIES,
  LEGENDARY_TECHNIQUE_IDS,
  findLegendaryTechnique,
} from '../../src/content/techniqueLegendaries.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import {
  primeExpeditionRuntimeStores,
  resetExpeditionRuntimeStores,
} from '../integration/expeditionRuntimeTestUtils.js';

/**
 * M.IV.1 ARTS-MECH / Step 4 — the foundational legendary-technique catalog (D7 §G). Catalog-completeness: the
 * named apex ids resolve to REAL ultimate offense techniques in the live content, each carries its named
 * signature mechanic (shape; magnitudes HELD → D15), one per path. Mirrors gearLegendaries.contract.test.ts.
 */

test.beforeEach(async () => {
  resetExpeditionRuntimeStores();
  await primeExpeditionRuntimeStores();
});

test('M.IV.1 legendary techniques: non-empty, unique ids, all rarity legendary', () => {
  assert.ok(TECHNIQUE_LEGENDARIES.length > 0, 'the catalog has at least one apex art');
  assert.equal(new Set(LEGENDARY_TECHNIQUE_IDS).size, LEGENDARY_TECHNIQUE_IDS.length, 'duplicate ids');
  for (const t of TECHNIQUE_LEGENDARIES) assert.equal(t.rarity, 'legendary', `${t.id}: rarity legendary`);
});

test('M.IV.1 legendary techniques: every apex carries a named signature mechanic (name + body)', () => {
  for (const t of TECHNIQUE_LEGENDARIES) {
    assert.ok((t.signature?.name ?? '').length > 0, `${t.id}: signature name`);
    assert.ok((t.signature?.body ?? '').length > 0, `${t.id}: signature body`);
  }
});

test('M.IV.1 legendary techniques: one apex per path (heaven / earth / martial)', () => {
  const byPath = new Set(TECHNIQUE_LEGENDARIES.map((t) => t.path));
  for (const path of ['heaven', 'earth', 'martial'] as const) {
    assert.ok(byPath.has(path), `a ${path} apex art is catalogued`);
  }
});

test('M.IV.1 legendary techniques: catalog-completeness — every id resolves to a REAL ultimate offense technique', () => {
  const techniquesById = useContentStore.getState().maps.techniquesById;
  for (const t of TECHNIQUE_LEGENDARIES) {
    const real = techniquesById[t.id];
    assert.ok(real, `${t.id} is a real technique in the live content (not invented)`);
    assert.equal(real.type, 'ultimate', `${t.id} is an ultimate (apex)`);
    const role = String(real.role ?? real.scalingRole ?? '');
    assert.ok(role === 'offense' || real.scalingRole === 'ultimate', `${t.id} is an apex offense art (role=${role})`);
    assert.equal(real.path, t.path, `${t.id} path matches the catalog`);
  }
});

test('M.IV.1 legendary techniques: findLegendaryTechnique resolves catalogued ids and rejects others', () => {
  for (const t of TECHNIQUE_LEGENDARIES) assert.equal(findLegendaryTechnique(t.id)?.id, t.id, `${t.id} resolves`);
  assert.equal(findLegendaryTechnique('tech_not_a_legendary'), undefined, 'a non-apex id resolves to undefined');
});
