import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

import {
  resolveCultivationPathIdentity,
  getPathMeridianRoster,
} from '../../src/systems/cultivation/cultivationPathIdentityResolver.js';
import { MERIDIAN_DERIVED_MAP } from '../../src/systems/meridians/derivedStats.js';

const PATHS = ['heaven', 'earth', 'martial'] as const;

void test('M.II.1-C — the three lives resolve to three distinct path identities', () => {
  const identities = PATHS.map((path) => resolveCultivationPathIdentity(path));

  assert.equal(new Set(identities.map((i) => i.signatureMeridianId)).size, 3, 'distinct signature meridians');
  assert.equal(new Set(identities.map((i) => i.accentTokenId)).size, 3, 'distinct accent tokens');
  assert.equal(new Set(identities.map((i) => i.glyphId)).size, 3, 'distinct glyphs');
  assert.equal(new Set(identities.map((i) => i.stageNameScheme)).size, 3, 'distinct stage-name schemes');

  for (const identity of identities) {
    assert.match(identity.accentTokenId, /^path\.(heaven|earth|martial)\.accent$/, 'accent is a token id');
    assert.doesNotMatch(identity.accentTokenId, /#/, 'never a raw hex');
    assert.match(identity.glyphId, /^glyph\.(heaven|earth|martial)$/);
    assert.notEqual(identity.pathId, null);
    // the signature meridian must belong to that path's drip roster
    const roster = getPathMeridianRoster(identity.pathId);
    const signature = roster.find((m) => m.meridianId === identity.signatureMeridianId);
    assert.ok(signature, `${identity.signatureMeridianId} is in the ${identity.pathId} roster`);
    assert.equal(identity.signatureMeridianLabel, signature?.label);
  }
});

void test('M.II.1-C — the null path yields the "No Path selected" identity', () => {
  const none = resolveCultivationPathIdentity(null);
  assert.equal(none.pathId, null);
  assert.equal(none.pathLabel, 'No Path selected');
  assert.equal(none.signatureMeridianId, null);
  assert.equal(none.signatureMeridianLabel, null);
});

void test('M.II.1-C — the vendored roster is byte-equivalent to path_meridians.json and a subset of MERIDIAN_DERIVED_MAP', () => {
  const pack = JSON.parse(
    readFileSync('public/cultivation_idle_content_bible_v1_config/path_meridians.json', 'utf8'),
  ) as { meridians: Array<{ id: string; path: string; name: string; unlockRealm: number; pathEffect: string }> };

  const engineMeridianIds = Object.keys(MERIDIAN_DERIVED_MAP);

  for (const path of PATHS) {
    const authored = pack.meridians
      .filter((m) => m.path === path)
      .sort((a, b) => a.unlockRealm - b.unlockRealm);
    const roster = getPathMeridianRoster(path);

    assert.equal(roster.length, 7, `${path} roster has 7 slips`);
    assert.equal(authored.length, 7, `${path} authored pack has 7 meridians`);

    roster.forEach((entry, index) => {
      assert.equal(entry.meridianId, authored[index].id, `${path} slot ${index + 1} id matches content`);
      assert.equal(entry.slot, authored[index].unlockRealm, `${path} slot ${index + 1} unlockRealm matches content`);
      assert.equal(entry.label, authored[index].name, `${path} slot ${index + 1} label matches content`);
      assert.equal(entry.effectLine, authored[index].pathEffect, `${path} slot ${index + 1} effectLine matches content`);
      assert.ok(engineMeridianIds.includes(entry.meridianId), `${entry.meridianId} exists in MERIDIAN_DERIVED_MAP`);
    });
  }
});
