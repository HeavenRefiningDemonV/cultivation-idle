import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import {
  auditTechniqueTaxonomy,
  auditTechniqueTaxonomyFromDefinitions,
  buildTechniqueTaxonomy,
  buildTechniqueTaxonomyFromDefinitions,
  getPathAlignmentScoreForTechnique,
  getPathAlignmentStrengthForTechnique,
  getTechniqueFamilies,
  getTechniqueSupportFlags,
  getTechniqueTaxonomyProfile,
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
});

test.afterEach(() => {
  resetContentStore();
});

test('taxonomy wrappers are safe with no content loaded', () => {
  assert.deepEqual(buildTechniqueTaxonomy(), {});
  assert.equal(getTechniqueTaxonomyProfile('tech_heaven_starfire_bolt'), null);
  assert.deepEqual(getTechniqueFamilies('tech_heaven_starfire_bolt'), []);
  assert.deepEqual(getTechniqueSupportFlags('tech_heaven_starfire_bolt'), []);
  assert.equal(getPathAlignmentScoreForTechnique('tech_heaven_starfire_bolt', 'heaven'), 0);
  assert.equal(getPathAlignmentStrengthForTechnique('tech_heaven_starfire_bolt', 'heaven'), 'off');
  assert.equal(auditTechniqueTaxonomy().totalTechniques, 0);
});

test('taxonomy wrappers match the pure builder once content is primed', () => {
  primeContentStore(content);

  const wrapperCatalog = buildTechniqueTaxonomy();
  const pureCatalog = buildTechniqueTaxonomyFromDefinitions(content.techniques);
  const wrapperAudit = auditTechniqueTaxonomy();
  const pureAudit = auditTechniqueTaxonomyFromDefinitions(content.techniques);

  assert.equal(Object.keys(wrapperCatalog).length, 60);
  assert.equal(Object.keys(pureCatalog).length, 60);
  assert.deepEqual(wrapperCatalog.tech_heaven_starfire_bolt, pureCatalog.tech_heaven_starfire_bolt);
  assert.deepEqual(wrapperCatalog.tech_martial_executioner_mark, pureCatalog.tech_martial_executioner_mark);
  assert.equal(wrapperAudit.totalTechniques, pureAudit.totalTechniques);
  assert.deepEqual(wrapperAudit.techniquesMissingFamilies, pureAudit.techniquesMissingFamilies);
  assert.deepEqual(wrapperAudit.unknownPrimaryEffectTypes, pureAudit.unknownPrimaryEffectTypes);
  assert.deepEqual(wrapperAudit.unknownSecondaryEffectTypes, pureAudit.unknownSecondaryEffectTypes);
  assert.deepEqual(wrapperAudit.overriddenTechniques, pureAudit.overriddenTechniques);
});
