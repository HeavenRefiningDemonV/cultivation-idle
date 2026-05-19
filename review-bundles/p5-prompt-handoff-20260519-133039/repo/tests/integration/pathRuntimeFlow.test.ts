import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('game store source keeps selectedPath one-shot and resets it for a new life', async () => {
  const gameStore = await fs.readFile(path.resolve(process.cwd(), 'src/stores/gameStore.ts'), 'utf8');

  assert.equal(gameStore.includes("if (state.selectedPath !== null)"), true);
  assert.equal(gameStore.includes("console.warn('Path already selected!')"), true);
  assert.equal(gameStore.includes('const baseState = createInitialGameState();'), true);
  assert.equal(gameStore.includes('Object.assign(state, baseState);'), true);
  assert.equal(gameStore.includes('selectedPath: null as CultivationPath | null'), true);
});

test('current save serialization and hydration source treat lifePath as legacy-only input', async () => {
  const defaultSaveState = await fs.readFile(path.resolve(process.cwd(), 'src/save/defaultSaveState.ts'), 'utf8');
  const saveload = await fs.readFile(path.resolve(process.cwd(), 'src/utils/saveload.ts'), 'utf8');

  assert.equal(defaultSaveState.includes('lifePath: gameState.lifePath'), false);
  assert.equal(saveload.includes('if (gameState && typeof gameState.selectedPath === \'string\''), true);
  assert.equal(saveload.includes('if (gameState && typeof gameState.lifePath === \'string\''), true);
  assert.equal(saveload.includes('return gameState.selectedPath as SaveData'), true);
  assert.equal(saveload.includes('return gameState.lifePath as SaveData'), true);
});
