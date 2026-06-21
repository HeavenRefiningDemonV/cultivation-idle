// [F3-ELEM] anti-fork (§3) — the resolver speaks the ONE live vocabulary; `lightning`, never `thunder`.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ELEMENT_IDS, D3_LORE_NAME_BY_ELEMENT } from '../../src/systems/elements/index.js';
import { CANONICAL_SPIRIT_ROOT_ELEMENTS } from '../../src/systems/spiritRoots/spiritRootProgressionResolver.js';

const read = (p: string): string => readFileSync(resolve(process.cwd(), p), 'utf8');

test('F3: the resolver roster id-set === CANONICAL_SPIRIT_ROOT_ELEMENTS (same 14, no fork)', () => {
  assert.deepEqual([...ELEMENT_IDS].sort(), [...CANONICAL_SPIRIT_ROOT_ELEMENTS].sort());
  assert.equal(ELEMENT_IDS.length, 14);
});

test('F3: the second Storm is `lightning` (id), "Thunder" (lore) — never `thunder` as an id', () => {
  assert.ok(ELEMENT_IDS.includes('lightning'), 'roster has lightning');
  assert.ok(!(ELEMENT_IDS as readonly string[]).includes('thunder'), 'roster has NO thunder id');
  assert.equal(D3_LORE_NAME_BY_ELEMENT.lightning, 'Thunder', 'lore label survives as Thunder');
});

test('F3: source guard — no `id: \'thunder\'` in the catalog; the lore label is present for lightning', () => {
  const catalog = read('src/systems/elements/elementCatalog.ts');
  const reactions = read('src/systems/elements/reactionCatalog.ts');
  assert.doesNotMatch(catalog, /id:\s*'thunder'/);
  assert.doesNotMatch(reactions, /'thunder'/);
  // the lightning row carries the Thunder lore name + 雷 glyph (identity vs lore are separate fields).
  assert.match(catalog, /id: 'lightning'[^}]*loreName: 'Thunder'/);
  assert.match(catalog, /雷/);
});
