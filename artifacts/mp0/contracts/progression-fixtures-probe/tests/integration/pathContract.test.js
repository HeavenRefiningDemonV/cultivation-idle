import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { getPathTruthContract } from '../../src/systems/progression/contract/index.js';
import { assertNoContradictoryPathState, createFreshLifeScenario, loadProgressionContract, } from '../helpers/progression/index.js';
test('fresh life scenario can be built without contradictory path fixture', async () => {
    const contract = await loadProgressionContract();
    const scenario = createFreshLifeScenario({ contract });
    assert.equal(scenario.kind, 'fresh_life');
    assertNoContradictoryPathState(scenario);
});
test('contract exposes canonical path truth hook for later runtime consumers', async () => {
    const contract = await loadProgressionContract();
    const pathTruth = getPathTruthContract(contract);
    assert.equal(pathTruth.canonicalField, 'selectedPath');
    assert.deepEqual(pathTruth.legacyAliases, ['lifePath']);
});
test('live cultivation route no longer wires the old path-selection modal into normal progression', async () => {
    const cultivateScreen = await fs.readFile(path.resolve(process.cwd(), 'src/components/screens/CultivateScreen.tsx'), 'utf8');
    const audioBindings = await fs.readFile(path.resolve(process.cwd(), 'src/app/AudioBindings.tsx'), 'utf8');
    assert.equal(cultivateScreen.includes('PathSelectionModal'), false);
    assert.equal(cultivateScreen.includes('showPathSelection('), false);
    assert.equal(audioBindings.includes('showPathSelectionModal'), false);
});
