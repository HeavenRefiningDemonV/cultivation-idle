import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { validateProgressionSemantics } from '../../src/systems/progression/validation/index.js';
import {
  createCapReachedScenario,
  createFreshLifeScenario,
  createLegacyAliasScenario,
  loadProgressionContract,
} from '../helpers/progression/index.js';
import type { RawProgressionContentLike } from '../../src/systems/progression/contract/index.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');
const FIXTURE_DIR = path.resolve(process.cwd(), 'tests', 'migrations', 'fixtures');

const FILES = {
  economy: 'economy.json',
  cities: 'cities.json',
  items: 'items.json',
  techniques: 'techniques.json',
  pavilions: 'pavilions.json',
  outskirts: 'outskirts.json',
  enemies: 'enemies.json',
  trials: 'trials.json',
  ruins: 'ruins.json',
  alchemy_recipes: 'alchemy_recipes.json',
  forge_blueprints: 'forge_blueprints.json',
  runes: 'runes.json',
  talisman_recipes: 'talisman_recipes.json',
  apothecary_shops: 'apothecary_shops.json',
  expeditions: 'expeditions.json',
  bounties: 'bounties.json',
  heart_laws: 'heart_laws.json',
  prestige_store: 'prestige_store.json',
};

const readJson = async <T>(filePath: string): Promise<T> => JSON.parse(await fs.readFile(filePath, 'utf8')) as T;

const loadRawContent = async (): Promise<RawProgressionContentLike> => {
  const entries = await Promise.all(
    Object.entries(FILES).map(async ([key, fileName]) => [key, await readJson(path.join(CONTENT_DIR, fileName))] as const),
  );
  return Object.fromEntries(entries) as unknown as RawProgressionContentLike;
};

test('semantic validator stays clean on contract-aligned content and scenarios', async () => {
  const contract = await loadProgressionContract();
  const issues = validateProgressionSemantics({
    rawContent: await loadRawContent(),
    scenarios: [createFreshLifeScenario({ contract }), createCapReachedScenario({ contract })],
    migrationFixtures: [{ name: 'current-save', data: await readJson(path.join(FIXTURE_DIR, 'current-save.json')) }],
  });

  assert.deepEqual(issues, []);
});

test('semantic validator reports drift surfaced by legacy scenarios and migration fixtures', async () => {
  const contract = await loadProgressionContract();
  const issues = validateProgressionSemantics({
    rawContent: await loadRawContent(),
    runtimeFileTextByPath: {
      'src/stores/gameStore.ts': 'selectedPath lifePath getQiMultiplier prestige reset',
      'src/systems/offline.ts': 'offline pipeline',
      'src/services/time/OfflineCatchup.ts': 'offline catchup',
    },
    scenarios: [createLegacyAliasScenario({ contract })],
    migrationFixtures: [
      { name: 'legacy-path-conflict', data: await readJson(path.join(FIXTURE_DIR, 'legacy-path-conflict.json')) },
      { name: 'legacy-gate-item-ids', data: await readJson(path.join(FIXTURE_DIR, 'legacy-gate-item-ids.json')) },
      { name: 'legacy-future-slice', data: await readJson(path.join(FIXTURE_DIR, 'legacy-future-slice.json')) },
      { name: 'legacy-offline-split', data: await readJson(path.join(FIXTURE_DIR, 'legacy-offline-split.json')) },
    ],
  });

  const categories = new Set(issues.map((entry) => entry.category));
  assert.equal(categories.has('PATH_TRUTH_SPLIT'), true);
  assert.equal(categories.has('OFFLINE_PIPELINE_SPLIT'), true);
  assert.equal(categories.has('MIGRATION_ALIAS_PRESENT'), true);
  assert.equal(categories.has('CONTENT_CAP_BREACH'), true);
  assert.equal(categories.has('HIDDEN_PRESTIGE_RUNTIME_CONSUMER'), true);
});
