import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { buildPrestigeEffectAuditReport } from '../../src/systems/prestige/runtime/prestigeRuntimeCatalog.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

const readJson = async <T>(fileName: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;

test('prestige runtime effect audit is deterministic and blocks unsupported purchasable promises', async () => {
  const content = {
    prestige_store: await readJson('prestige_store.json'),
  };

  const report = buildPrestigeEffectAuditReport(content as never, { generatedAt: 1 });

  assert.equal(report.generatedAt, 1);
  assert.equal(report.blockers.length, 0);
  assert.equal(report.visibleLiveCount, 16);
  assert.equal(report.deferredCount, 5);
  assert.equal(report.hiddenUnsupportedCount > 0, true);
  assert.equal(report.rows.every((row) => (row.purchaseAllowed ? row.status === 'visible_live' : true)), true);
  assert.equal(report.rows.some((row) => row.upgradeId === 'ap_fragment_gain_boost' && row.status === 'hidden_unsupported'), true);
  assert.equal(report.rows.some((row) => row.upgradeId === 'ap_unlock_pagoda' && row.status === 'deferred'), true);
  assert.equal(report.rows.some((row) => row.upgradeId === 'form_memory' && row.status === 'visible_live'), true);
  assert.equal(report.rows.some((row) => row.upgradeId === 'doctrine_archive' && row.status === 'hidden_unsupported'), true);
});
