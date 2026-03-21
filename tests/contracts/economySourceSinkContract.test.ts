import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import {
  buildLiveEconomyAuditReport,
  getSinklessLiveMaterials,
  listKnownLiveEconomyBlockers,
} from '../../src/systems/economy/index.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: ReturnType<typeof loadValidatedContent> | null = null;

async function loadValidatedContent() {
  return validateLoadedContent((await loadRawProgressionContent()) as never);
}

async function getValidated() {
  if (!validatedPromise) validatedPromise = loadValidatedContent();
  return validatedPromise;
}

test('packet 3.1A visible live materials either have live sinks or match the explicit blocker registry', async () => {
  const validated = await getValidated();
  const report = buildLiveEconomyAuditReport(validated);
  const sinkless = getSinklessLiveMaterials(report);
  const actualIds = sinkless.map((entry) => entry.itemId).sort();
  const expectedIds = ['mat_artifact_shard', 'mat_spirit_dew'];

  assert.deepEqual(actualIds, expectedIds);
  sinkless.forEach((entry) => {
    assert.equal(entry.isBlocked, true, `${entry.itemId} should be explicitly blocked`);
    assert.match(entry.blockerReason ?? '', /live sink|live source path|missing live reagent path/i);
  });
});

test('packet 3.1A blocker registry matches the actual audit exactly and does not drift silently', async () => {
  const validated = await getValidated();
  const report = buildLiveEconomyAuditReport(validated);
  const registryIds = listKnownLiveEconomyBlockers().map((entry) => entry.id).sort();

  assert.deepEqual(report.activeBlockerIds, registryIds);
  assert.deepEqual(registryIds, [
    'forge_refine_legendary_t5',
    'mat_artifact_shard',
    'mat_spirit_dew',
    'reagent_quenching_oil_t2',
  ]);
});

test('packet 3.1A reagent path audit surfaces the legendary refine blocker and no other hidden reagent-path gaps', async () => {
  const validated = await getValidated();
  const report = buildLiveEconomyAuditReport(validated);
  const missingPaths = report.reagentPathAudits.filter((entry) => entry.missingDependencyIds.length > 0);

  assert.deepEqual(
    missingPaths.map((entry) => ({ blueprintId: entry.blueprintId, missingDependencyIds: entry.missingDependencyIds })),
    [{ blueprintId: 'forge_refine_legendary_t5', missingDependencyIds: ['reagent_quenching_oil_t2'] }],
  );
  assert.equal(missingPaths[0]?.isBlocked, true);
});
