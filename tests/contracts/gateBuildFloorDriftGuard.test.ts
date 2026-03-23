import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import * as readiness from '../../src/systems/readiness/index.js';

const REGISTRY_PATH = path.join(process.cwd(), 'src/systems/readiness/gateBuildFloorRegistry.ts');

async function readRegistrySource(): Promise<string> {
  return fs.readFile(REGISTRY_PATH, 'utf8');
}

test('packet 4.12 readiness registry stays store-free and UI-free', async () => {
  const source = await readRegistrySource();

  [
    'useGameStore',
    'useTechniqueStore',
    'useTechCollectionStore',
    'useContentStore',
    'zustand',
    'React',
    'tsx',
    'Math.random',
  ].forEach((term) => {
    assert.equal(source.includes(term), false);
  });
});

test('packet 4.12 registry stays anchored to the live semester slice', async () => {
  const source = await readRegistrySource();

  assert.equal(source.includes('SEMESTER_SLICE_CONTRACT'), true);
  assert.equal(source.includes('GATE_BUILD_FLOOR_TRIAL_ORDER'), true);
  assert.equal(source.includes('GATE_BUILD_FLOOR_REGISTRY'), true);
});

test('packet 4.12 readiness namespace exports the public registry surface', () => {
  assert.equal(typeof readiness.getGateBuildFloor, 'function');
  assert.equal(typeof readiness.getAllGateBuildFloors, 'function');
  assert.notEqual(readiness.GATE_BUILD_FLOOR_TRIAL_ORDER, undefined);
  assert.notEqual(readiness.GATE_BUILD_FLOOR_REGISTRY, undefined);
  assert.notEqual(readiness.GATE_BUILD_FLOOR_BY_TRIAL_ID, undefined);
});

test('packet 4.12 registry module does not contain readiness scoring logic', async () => {
  const source = await readRegistrySource();

  [
    'readiness',
    'band',
    'scoreBuild',
    'evaluateGateReadiness',
  ].forEach((term) => {
    assert.equal(source.includes(term), false);
  });
});
