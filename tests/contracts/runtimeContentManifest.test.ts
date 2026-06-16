import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  RUNTIME_CONTENT_DIR,
  RUNTIME_CONTENT_FILE_BY_KEY,
  RUNTIME_CONTENT_FILES,
} from '../../src/content/runtimeContentManifest.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';
import { buildRuntimeContentManifestReport } from '../../src/services/diagnostics/release/runtimeContentManifestReport.js';

test('runtime content manifest declares the exact loader file set once', () => {
  assert.equal(RUNTIME_CONTENT_DIR, 'cultivation_idle_content_bible_v1_config');
  assert.deepEqual(Object.values(RUNTIME_CONTENT_FILE_BY_KEY), RUNTIME_CONTENT_FILES);
  assert.deepEqual(RUNTIME_CONTENT_FILES, [
    'economy.json',
    'cities.json',
    'items.json',
    'techniques.json',
    'pavilions.json',
    'outskirts.json',
    'enemies.json',
    'trials.json',
    'ruins.json',
    'alchemy_recipes.json',
    'forge_blueprints.json',
    'runes.json',
    'talisman_recipes.json',
    'apothecary_shops.json',
    'expeditions.json',
    'bounties.json',
    'heart_laws.json',
    'prestige_store.json',
    'pavilion_records.json',
    'onboarding_milestones.json',
    'stats.json',
    'training_regimens.json',
    'dao_heart_practices.json',
    'spirit_roots.json',
    'readiness_categories.json',
    'path_meridians.json',
  ]);
});

test('runtime content manifest report fails by exact filenames when source directory is missing', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cultivation-runtime-content-missing-'));
  const report = buildRuntimeContentManifestReport({ root });

  assert.equal(report.source.exists, false);
  assert.equal(report.source.status, 'fail');
  assert.deepEqual(report.source.missingFiles, RUNTIME_CONTENT_FILES);
  assert.equal(report.blockers.some((entry) => entry.includes(RUNTIME_CONTENT_DIR)), true);
  assert.equal(report.blockers.some((entry) => entry.includes('economy.json')), true);
});

test('progression fixture loader reads the same runtime content keys as the manifest', async () => {
  const rawContent = await loadRawProgressionContent();
  assert.deepEqual(
    Object.keys(rawContent).sort(),
    Object.keys(RUNTIME_CONTENT_FILE_BY_KEY).sort(),
  );
});
