import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import type { TechniqueDef } from '../../src/content/index.js';
import { TECHNIQUE_FAMILY_ORDER, TECHNIQUE_SUPPORT_FLAG_ORDER } from '../../src/systems/builds/techniqueFamilies.js';
import { buildTechniqueTaxonomyFromDefinitions } from '../../src/systems/builds/techniqueTaxonomy.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

async function loadTechniqueDefinitions(): Promise<TechniqueDef[]> {
  const raw = await fs.readFile(path.join(CONTENT_DIR, 'techniques.json'), 'utf8');
  return JSON.parse(raw).techniques as TechniqueDef[];
}

function canonicalFamilies(values: readonly string[]): string[] {
  const set = new Set(values);
  return TECHNIQUE_FAMILY_ORDER.filter((family) => set.has(family));
}

function canonicalSupportFlags(values: readonly string[]): string[] {
  const set = new Set(values);
  return TECHNIQUE_SUPPORT_FLAG_ORDER.filter((flag) => set.has(flag));
}

test('live techniques build a complete taxonomy catalog', async () => {
  const defs = await loadTechniqueDefinitions();
  const catalog = buildTechniqueTaxonomyFromDefinitions(defs);

  assert.equal(defs.length, 60);
  assert.equal(Object.keys(catalog).length, 60);

  defs.forEach((def) => {
    const profile = catalog[def.id];
    assert.ok(profile);
    assert.equal(profile.techId, def.id);
    assert.equal(profile.path, def.path);
    assert.equal(profile.type, def.type);
    assert.equal(profile.nativeAlignment === 'strong' || profile.nativeAlignment === 'neutral', true);
    assert.equal(profile.alignment, profile.nativeAlignment);
    assert.ok(profile.families.length > 0);
    assert.deepEqual(profile.families, canonicalFamilies(profile.families));
    assert.deepEqual(profile.supportFlags, canonicalSupportFlags(profile.supportFlags));
    assert.deepEqual(profile.derivedFrom, [...new Set(profile.derivedFrom)].sort((a, b) => a.localeCompare(b)));
  });
});

test('representative taxonomy profiles are locked', async () => {
  const catalog = buildTechniqueTaxonomyFromDefinitions(await loadTechniqueDefinitions());

  assert.deepEqual(catalog.tech_heaven_starfire_bolt.families, ['coreDamage', 'setup']);
  assert.equal(catalog.tech_heaven_starfire_bolt.alignment, 'strong');
  assert.equal(catalog.tech_heaven_starfire_bolt.nativeAlignment, 'strong');
  assert.deepEqual(catalog.tech_heaven_starfire_bolt.supportFlags, []);

  assert.deepEqual(catalog.tech_heaven_golden_seal.families, ['guard', 'cleanse']);
  assert.equal(catalog.tech_heaven_golden_seal.alignment, 'neutral');
  assert.equal(catalog.tech_heaven_golden_seal.nativeAlignment, 'neutral');
  assert.deepEqual(catalog.tech_heaven_golden_seal.supportFlags, ['survival']);

  assert.deepEqual(catalog.tech_heaven_astral_needle.families, ['setup', 'control']);
  assert.equal(catalog.tech_heaven_astral_needle.alignment, 'strong');
  assert.deepEqual(catalog.tech_heaven_astral_needle.supportFlags, []);

  assert.deepEqual(catalog.tech_heaven_astral_focus.families, ['buff', 'farm']);
  assert.equal(catalog.tech_heaven_astral_focus.alignment, 'neutral');

  assert.deepEqual(catalog.tech_heaven_heavenly_cataclysm.families, ['coreDamage', 'aoe', 'execute']);
  assert.equal(catalog.tech_heaven_heavenly_cataclysm.alignment, 'strong');
  assert.deepEqual(catalog.tech_heaven_heavenly_cataclysm.supportFlags, ['boss', 'farm']);

  assert.deepEqual(catalog.tech_earth_rooted_breath.families, ['guard', 'heal']);
  assert.equal(catalog.tech_earth_rooted_breath.alignment, 'strong');
  assert.deepEqual(catalog.tech_earth_rooted_breath.supportFlags, ['survival']);

  assert.deepEqual(catalog.tech_earth_shatter_palm.families, ['setup', 'control']);
  assert.equal(catalog.tech_earth_shatter_palm.alignment, 'strong');
  assert.deepEqual(catalog.tech_earth_shatter_palm.supportFlags, []);

  assert.deepEqual(catalog.tech_earth_forge_bone.families, ['buff', 'farm']);
  assert.equal(catalog.tech_earth_forge_bone.alignment, 'neutral');
  assert.deepEqual(catalog.tech_earth_forge_bone.supportFlags, ['farm']);

  assert.deepEqual(catalog.tech_earth_world_pillar_slam.families, ['coreDamage', 'execute']);
  assert.equal(catalog.tech_earth_world_pillar_slam.alignment, 'strong');
  assert.deepEqual(catalog.tech_earth_world_pillar_slam.supportFlags, ['boss']);
  assert.equal(catalog.tech_earth_world_pillar_slam.families.includes('aoe'), false);

  assert.deepEqual(catalog.tech_martial_windstep_footwork.families, ['buff', 'mobility', 'cleanse']);
  assert.equal(catalog.tech_martial_windstep_footwork.alignment, 'strong');
  assert.deepEqual(catalog.tech_martial_windstep_footwork.supportFlags, ['survival', 'tempo']);

  assert.deepEqual(catalog.tech_martial_battle_hunger.families, ['heal']);
  assert.equal(catalog.tech_martial_battle_hunger.alignment, 'neutral');
  assert.deepEqual(catalog.tech_martial_battle_hunger.supportFlags, ['survival', 'boss']);

  assert.deepEqual(catalog.tech_martial_executioner_mark.families, ['buff', 'farm']);
  assert.equal(catalog.tech_martial_executioner_mark.alignment, 'neutral');
  assert.deepEqual(catalog.tech_martial_executioner_mark.supportFlags, ['boss', 'farm']);

  assert.deepEqual(catalog.tech_martial_ninefold_sword_rain.families, ['coreDamage', 'aoe', 'execute']);
  assert.equal(catalog.tech_martial_ninefold_sword_rain.alignment, 'strong');
  assert.deepEqual(catalog.tech_martial_ninefold_sword_rain.supportFlags, ['boss', 'farm']);
});

test('aoe overrides stay narrow and explicit', async () => {
  const catalog = buildTechniqueTaxonomyFromDefinitions(await loadTechniqueDefinitions());

  assert.equal(catalog.tech_earth_world_pillar_slam.families.includes('aoe'), false);
  assert.equal(catalog.tech_martial_steel_tempest.families.includes('aoe'), false);
});

test('derivation trace stays machine-readable with important markers locked', async () => {
  const catalog = buildTechniqueTaxonomyFromDefinitions(await loadTechniqueDefinitions());

  const starfire = catalog.tech_heaven_starfire_bolt.derivedFrom;
  assert.equal(starfire.includes('path:heaven'), true);
  assert.equal(starfire.includes('type:active'), true);
  assert.equal(starfire.includes('primary:damage'), true);
  assert.equal(starfire.includes('secondary:addStatusOnHit'), true);
  assert.equal(starfire.includes('status:burn'), true);

  const goldenSeal = catalog.tech_heaven_golden_seal.derivedFrom;
  assert.equal(goldenSeal.includes('primary:cleanse'), true);
  assert.equal(goldenSeal.includes('primary:shield'), true);

  const cataclysm = catalog.tech_heaven_heavenly_cataclysm.derivedFrom;
  assert.equal(cataclysm.includes('override:family:aoe'), true);
  assert.equal(cataclysm.includes('override:support:farm'), true);

  const astralFocus = catalog.tech_heaven_astral_focus.derivedFrom;
  assert.equal(astralFocus.includes('override:alignment:neutral'), true);
});
