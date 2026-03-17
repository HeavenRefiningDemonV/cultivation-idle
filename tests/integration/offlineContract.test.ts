import assert from 'node:assert/strict';
import test from 'node:test';

import { getOfflineProgressionContract } from '../../src/systems/progression/contract/index.js';
import {
  assertScenarioUsesContractOfflinePipeline,
  createCapReachedScenario,
  createLegacyAliasScenario,
  loadProgressionContract,
} from '../helpers/progression/index.js';

test('offline contract exposes one canonical pipeline shape', async () => {
  const contract = await loadProgressionContract();
  const offline = getOfflineProgressionContract(contract);
  assert.equal(offline.pipelineId, 'offline_progression_v1');
  assert.deepEqual(offline.excludes, ['combat']);
});

test('offline cap and efficiency fields are queryable', async () => {
  const contract = await loadProgressionContract();
  const offline = getOfflineProgressionContract(contract);
  assert.equal(offline.maxCatchupSeconds > 0, true);
  assert.equal(offline.efficiencyModel, 'full_for_supported_systems');
});

test('cap-reached and legacy-alias scenarios are usable in offline-related harness checks', async () => {
  const contract = await loadProgressionContract();
  const capScenario = createCapReachedScenario({ contract });
  const legacyScenario = createLegacyAliasScenario({ contract });
  assertScenarioUsesContractOfflinePipeline(capScenario, contract);
  assert.equal(legacyScenario.kind, 'legacy_alias');
});

// Future runtime assertions (packet 1.6): activate when old offline paths are consolidated.
test('TODO(packet 1.6): only one offline pipeline remains live at runtime', { todo: true }, () => {});
test('TODO(packet 1.6): offline summary matches single contract pipeline', { todo: true }, () => {});
test('TODO(packet 1.6): contradictory offline legacy logic is no longer live truth', { todo: true }, () => {});
