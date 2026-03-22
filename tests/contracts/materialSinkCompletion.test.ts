import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import {
  buildLiveEconomyAuditReport,
  getPacket36AMaterialSinkStatus,
} from '../../src/systems/economy/index.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ReturnType<typeof validateLoadedContent>> | null = null;

async function getValidated() {
  if (!validatedPromise) {
    validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedPromise;
}

test('packet 3.6A named live material blockers now resolve through visible live sinks only', async () => {
  const validated = await getValidated();
  const report = buildLiveEconomyAuditReport(validated);
  const status = getPacket36AMaterialSinkStatus(report);

  assert.equal(status.mat_spirit_dew.hasVisibleLiveSink, true);
  assert.deepEqual(status.mat_spirit_dew.sinkIds, ['forge_temper_accessory_t1']);

  assert.equal(status.mat_artifact_shard.hasVisibleLiveSink, true);
  assert.ok(status.mat_artifact_shard.sinkIds.includes('forge_refine_uncommon_t3'));
  assert.ok(status.mat_artifact_shard.sinkIds.includes('forge_refine_rare_t4'));
  assert.ok(status.mat_artifact_shard.sinkIds.includes('forge_refine_legendary_t5'));

  assert.equal(status.mat_spirit_dew.sinkIds.includes('formation_plate_basic'), false);
  assert.equal(status.mat_artifact_shard.sinkIds.includes('forge_jade_core_shell_t1'), false);
});
