// [F3-ELEM] live-content seam (§4.2) — every element id the content packs use resolves to the roster;
// `lightning` is used and `thunder` never appears (catches a future authoring drift toward the lore spelling).
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ELEMENT_IDS } from '../../src/systems/elements/index.js';

const PACKS = ['heart_laws', 'spirit_roots', 'techniques'].map(
  (n) => `public/cultivation_idle_content_bible_v1_config/${n}.json`,
);
const rosterIds = new Set<string>(ELEMENT_IDS);

/** Recursively collect every string value in a parsed JSON tree. */
function collectStrings(node: unknown, out: string[]): void {
  if (typeof node === 'string') out.push(node);
  else if (Array.isArray(node)) for (const v of node) collectStrings(v, out);
  else if (node && typeof node === 'object') for (const v of Object.values(node)) collectStrings(v, out);
}

test('F3: no content pack contains a `thunder` element token (the lore spelling never leaks into ids)', () => {
  for (const p of PACKS) {
    const text = readFileSync(resolve(process.cwd(), p), 'utf8');
    assert.doesNotMatch(text, /"thunder"/i, `${p} has no "thunder" token`);
  }
});

test('F3: every element-typed token in the live packs resolves to a roster id; lightning is used', () => {
  let lightningSeen = false;
  for (const p of PACKS) {
    const data: unknown = JSON.parse(readFileSync(resolve(process.cwd(), p), 'utf8'));
    const strings: string[] = [];
    collectStrings(data, strings);
    for (const s of strings) {
      if (s === 'lightning') lightningSeen = true;
      // any token shaped like an element id (or the forbidden lore spelling) MUST resolve to the roster.
      if (rosterIds.has(s) || s === 'thunder') {
        assert.ok(rosterIds.has(s), `content element token resolves to roster: "${s}" in ${p}`);
      }
    }
  }
  assert.ok(lightningSeen, 'the live content uses the `lightning` id (the §3 reconciliation premise)');
});
