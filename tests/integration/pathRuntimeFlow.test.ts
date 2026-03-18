import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { useGameStore } from '../../src/stores/gameStore.js';
import { resolveCanonicalSelectedPath } from '../../src/utils/saveload.js';

test('selectedPath is the one-shot live runtime path field and resets for a new life', () => {
  useGameStore.getState().hardResetGameState();

  useGameStore.getState().selectPath('heaven');
  assert.equal(useGameStore.getState().selectedPath, 'heaven');

  useGameStore.getState().selectPath('earth');
  assert.equal(useGameStore.getState().selectedPath, 'heaven');

  useGameStore.getState().resetRun();
  assert.equal(useGameStore.getState().selectedPath, null);
});

test('current save serialization code no longer writes lifePath as live save truth', async () => {
  const defaultSaveState = await fs.readFile(path.resolve(process.cwd(), 'src/save/defaultSaveState.ts'), 'utf8');
  const saveload = await fs.readFile(path.resolve(process.cwd(), 'src/utils/saveload.ts'), 'utf8');

  assert.equal(defaultSaveState.includes('lifePath: gameState.lifePath'), false);
  assert.equal(saveload.includes('lifePath: gameState.lifePath'), false);
});

test('hydration resolves selectedPath first and only falls back to legacy lifePath when needed', () => {
  assert.equal(resolveCanonicalSelectedPath({ selectedPath: 'earth', lifePath: 'heaven' }), 'earth');
  assert.equal(resolveCanonicalSelectedPath({ selectedPath: null, lifePath: 'martial' }), 'martial');
  assert.equal(resolveCanonicalSelectedPath({ selectedPath: 'invalid', lifePath: 'heaven' }), 'heaven');
  assert.equal(resolveCanonicalSelectedPath({ selectedPath: null, lifePath: null }), null);
});
