import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { LoadedContentRaw } from '../../src/content/loaders.js';
import { validateLoadedContent } from '../../src/content/validators.js';
import { buildLiveEconomySourceSinkAudit } from '../../src/systems/economy/sourceSinkAudit.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public/cultivation_idle_content_bible_v1_config');
const CONTENT_FILES: Record<keyof LoadedContentRaw, string> = {
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

async function loadValidatedContent() {
  const entries = await Promise.all(
    Object.entries(CONTENT_FILES).map(async ([key, fileName]) => {
      const raw = await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8');
      return [key, JSON.parse(raw)] as const;
    }),
  );
  return validateLoadedContent(Object.fromEntries(entries) as LoadedContentRaw);
}

test('visible live materials and reagents all have at least one live sink', async () => {
  const content = await loadValidatedContent();
  const audit = buildLiveEconomySourceSinkAudit(content);

  const sinkless = audit.items
    .filter((entry) => (entry.role === 'craft_material' || entry.role === 'craft_reagent') && entry.liveSources.length > 0 && entry.liveSinks.length === 0)
    .map((entry) => entry.itemId)
    .sort();

  assert.deepEqual(sinkless, []);
});

test('live economy audit no longer reports blocker registry leftovers', async () => {
  const content = await loadValidatedContent();
  const audit = buildLiveEconomySourceSinkAudit(content);

  assert.deepEqual(audit.items.filter((entry) => entry.blocked).map((entry) => entry.itemId).sort(), []);
  assert.deepEqual([...new Set(audit.reagentPathIssues.filter((entry) => entry.blocked).map((entry) => entry.blueprintId))].sort(), []);
});

test('no live reagent path remains unresolved', async () => {
  const content = await loadValidatedContent();
  const audit = buildLiveEconomySourceSinkAudit(content);

  const unresolved = audit.reagentPathIssues.map((entry) => `${entry.blueprintId}:${entry.missingInputItemId}`).sort();
  assert.deepEqual(unresolved, []);
});
