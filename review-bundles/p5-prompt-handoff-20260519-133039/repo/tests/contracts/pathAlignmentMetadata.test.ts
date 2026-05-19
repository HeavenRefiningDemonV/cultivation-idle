import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import {
  buildTechniqueTaxonomyFromDefinitions,
  getPathAlignmentScoreForTechnique,
  getPathAlignmentStrengthForTechnique,
} from '../../src/systems/builds/index.js';
import { useContentStore } from '../../src/stores/contentStore.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

async function readJson(fileName: string) {
  return JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8'));
}

async function loadValidatedContent() {
  return validateLoadedContent({
    economy: await readJson('economy.json'),
    cities: await readJson('cities.json'),
    items: await readJson('items.json'),
    techniques: await readJson('techniques.json'),
    pavilions: await readJson('pavilions.json'),
    outskirts: await readJson('outskirts.json'),
    enemies: await readJson('enemies.json'),
    trials: await readJson('trials.json'),
    ruins: await readJson('ruins.json'),
    alchemy_recipes: await readJson('alchemy_recipes.json'),
    forge_blueprints: await readJson('forge_blueprints.json'),
    runes: await readJson('runes.json'),
    talisman_recipes: await readJson('talisman_recipes.json'),
    apothecary_shops: await readJson('apothecary_shops.json'),
    expeditions: await readJson('expeditions.json'),
    bounties: await readJson('bounties.json'),
    heart_laws: await readJson('heart_laws.json'),
    prestige_store: await readJson('prestige_store.json'),
  } as never);
}

function primeContentStore(content: Awaited<ReturnType<typeof loadValidatedContent>>) {
  useContentStore.setState({
    raw: content,
    isLoaded: true,
    isLoading: false,
    error: null,
    citiesSorted: [...content.cities].sort((a, b) => a.index - b.index),
    maps: {
      ...useContentStore.getState().maps,
      techniquesById: Object.fromEntries(content.techniques.map((entry) => [entry.id, entry])) as never,
    },
  });
}

function resetContentStore() {
  useContentStore.setState({
    raw: null,
    isLoaded: false,
    isLoading: false,
    error: null,
  });
}

let content: Awaited<ReturnType<typeof loadValidatedContent>>;

test.before(async () => {
  content = await loadValidatedContent();
});

test.beforeEach(() => {
  resetContentStore();
  primeContentStore(content);
  buildTechniqueTaxonomyFromDefinitions(content.techniques);
});

test.afterEach(() => {
  resetContentStore();
});

test('null selected path means no fit', () => {
  assert.equal(getPathAlignmentScoreForTechnique('tech_heaven_starfire_bolt', null), 0);
  assert.equal(getPathAlignmentStrengthForTechnique('tech_heaven_starfire_bolt', null), 'off');
});

test('same-path strong offensive and support signatures score 2', () => {
  assert.equal(getPathAlignmentStrengthForTechnique('tech_heaven_starfire_bolt', 'heaven'), 'strong');
  assert.equal(getPathAlignmentScoreForTechnique('tech_heaven_starfire_bolt', 'heaven'), 2);

  assert.equal(getPathAlignmentStrengthForTechnique('tech_earth_world_pillar_slam', 'earth'), 'strong');
  assert.equal(getPathAlignmentScoreForTechnique('tech_earth_world_pillar_slam', 'earth'), 2);

  assert.equal(getPathAlignmentStrengthForTechnique('tech_martial_windstep_footwork', 'martial'), 'strong');
  assert.equal(getPathAlignmentScoreForTechnique('tech_martial_windstep_footwork', 'martial'), 2);
});

test('same-path neutral support and farm passives score 1', () => {
  assert.equal(getPathAlignmentStrengthForTechnique('tech_heaven_astral_focus', 'heaven'), 'neutral');
  assert.equal(getPathAlignmentScoreForTechnique('tech_heaven_astral_focus', 'heaven'), 1);

  assert.equal(getPathAlignmentStrengthForTechnique('tech_earth_forge_bone', 'earth'), 'neutral');
  assert.equal(getPathAlignmentScoreForTechnique('tech_earth_forge_bone', 'earth'), 1);

  assert.equal(getPathAlignmentStrengthForTechnique('tech_martial_executioner_mark', 'martial'), 'neutral');
  assert.equal(getPathAlignmentScoreForTechnique('tech_martial_executioner_mark', 'martial'), 1);
});

test('cross-path offensive techniques are off', () => {
  assert.equal(getPathAlignmentStrengthForTechnique('tech_heaven_starfire_bolt', 'earth'), 'off');
  assert.equal(getPathAlignmentScoreForTechnique('tech_heaven_starfire_bolt', 'earth'), 0);

  assert.equal(getPathAlignmentStrengthForTechnique('tech_earth_world_pillar_slam', 'martial'), 'off');
  assert.equal(getPathAlignmentScoreForTechnique('tech_earth_world_pillar_slam', 'martial'), 0);

  assert.equal(getPathAlignmentStrengthForTechnique('tech_martial_ninefold_sword_rain', 'heaven'), 'off');
  assert.equal(getPathAlignmentScoreForTechnique('tech_martial_ninefold_sword_rain', 'heaven'), 0);
});

test('cross-path support techniques remain neutral support', () => {
  assert.equal(getPathAlignmentStrengthForTechnique('tech_heaven_golden_seal', 'earth'), 'neutral');
  assert.equal(getPathAlignmentScoreForTechnique('tech_heaven_golden_seal', 'earth'), 1);

  assert.equal(getPathAlignmentStrengthForTechnique('tech_heaven_astral_needle', 'martial'), 'neutral');
  assert.equal(getPathAlignmentScoreForTechnique('tech_heaven_astral_needle', 'martial'), 1);

  assert.equal(getPathAlignmentStrengthForTechnique('tech_earth_forge_bone', 'heaven'), 'neutral');
  assert.equal(getPathAlignmentScoreForTechnique('tech_earth_forge_bone', 'heaven'), 1);

  assert.equal(getPathAlignmentStrengthForTechnique('tech_martial_executioner_mark', 'earth'), 'neutral');
  assert.equal(getPathAlignmentScoreForTechnique('tech_martial_executioner_mark', 'earth'), 1);
});
