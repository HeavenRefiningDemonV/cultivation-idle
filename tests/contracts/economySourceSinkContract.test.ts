import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import {
  buildLiveEconomyAuditReport,
  getLiveEconomyItemAuditById,
  getPacket36AMaterialSinkStatus,
  getSinklessLiveMaterials,
  getVisibleAlchemyRecipes,
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

test('packet 3.1 every visible live material now has at least one visible live sink', async () => {
  const validated = await getValidated();
  const report = buildLiveEconomyAuditReport(validated);
  const sinkless = getSinklessLiveMaterials(report);

  assert.deepEqual(sinkless, []);
  assert.deepEqual(listKnownLiveEconomyBlockers(), []);
  assert.deepEqual(report.activeBlockerIds, []);
});

test('packet 3.1 spirit dew and artifact shards resolve to real live sinks', async () => {
  const validated = await getValidated();
  const report = buildLiveEconomyAuditReport(validated);
  const spiritDew = getLiveEconomyItemAuditById(report, 'mat_spirit_dew');
  const artifactShard = getLiveEconomyItemAuditById(report, 'mat_artifact_shard');
  const namedStatus = getPacket36AMaterialSinkStatus(report);

  assert.equal(namedStatus.mat_spirit_dew.hasVisibleLiveSink, true);
  assert.equal(namedStatus.mat_artifact_shard.hasVisibleLiveSink, true);
  assert.ok(spiritDew?.liveSinks.some((entry) => entry.kind === 'forge_input' && entry.refId === 'forge_temper_accessory_t1'));
  assert.equal(spiritDew?.liveSinks.some((entry) => entry.refId === 'formation_plate_basic'), false);
  assert.ok(artifactShard?.liveSinks.some((entry) => entry.kind === 'forge_input' && entry.refId === 'forge_refine_uncommon_t3'));
  assert.ok(artifactShard?.liveSinks.some((entry) => entry.kind === 'forge_input' && entry.refId === 'forge_refine_rare_t4'));
  assert.ok(artifactShard?.liveSinks.some((entry) => entry.kind === 'forge_input' && entry.refId === 'forge_refine_legendary_t5'));
  assert.equal(artifactShard?.liveSinks.some((entry) => entry.refId === 'forge_jade_core_shell_t1'), false);
});

test('packet 3.1 legendary refine now resolves to a live Quenching Oil t2 source path', async () => {
  const validated = await getValidated();
  const report = buildLiveEconomyAuditReport(validated);
  const legendaryPath = report.reagentPathAudits.find((entry) => entry.blueprintId === 'forge_refine_legendary_t5');
  const liveAlchemyIds = getVisibleAlchemyRecipes(validated).map((recipe) => recipe.id);
  const quenchingOilT2 = report.itemAudits.find((entry) => entry.itemId === 'reagent_quenching_oil_t2');

  assert.equal(legendaryPath?.missingDependencyIds.length ?? 0, 0);
  assert.ok(liveAlchemyIds.includes('alc_reagent_quenching_oil_t2'));
  assert.ok(quenchingOilT2?.liveSources.some((entry) => entry.kind === 'alchemy_output' && entry.refId === 'alc_reagent_quenching_oil_t2'));
  assert.ok(quenchingOilT2?.liveSinks.some((entry) => entry.kind === 'forge_input' && entry.refId === 'forge_refine_legendary_t5'));
});
