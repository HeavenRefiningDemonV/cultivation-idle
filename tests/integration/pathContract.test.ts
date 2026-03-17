import assert from 'node:assert/strict';
import test from 'node:test';

import { getPathTruthContract } from '../../src/systems/progression/contract/index.js';
import {
  assertNoContradictoryPathState,
  createFreshLifeScenario,
  loadProgressionContract,
} from '../helpers/progression/index.js';

test('fresh life scenario can be built without contradictory path fixture', async () => {
  const contract = await loadProgressionContract();
  const scenario = createFreshLifeScenario({ contract });
  assert.equal(scenario.kind, 'fresh_life');
  assertNoContradictoryPathState(scenario);
});

test('contract exposes canonical path truth hook for later runtime consumers', async () => {
  const contract = await loadProgressionContract();
  const pathTruth = getPathTruthContract(contract);
  assert.equal(pathTruth.canonicalField, 'lifePath');
  assert.deepEqual(pathTruth.legacyAliases, ['selectedPath']);
});

// Future runtime assertions (packet 1.2): activate when stores consume progression contract path truth.
test('TODO(packet 1.2): life-start path choice becomes the real mechanical path', { todo: true }, () => {});
test('TODO(packet 1.2): contradictory second path-selection flow cannot overwrite life path', { todo: true }, () => {});
