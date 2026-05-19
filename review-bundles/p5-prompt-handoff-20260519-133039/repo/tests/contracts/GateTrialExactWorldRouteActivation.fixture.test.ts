import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

void test('normal World Gate Trial module open defaults to live exact intent', () => {
  const source = readFileSync('src/systems/world/openWorldModule.ts', 'utf8');

  assert.equal(source.includes("normalizedModuleKey === 'gateTrial'"), true);
  assert.equal(source.includes("gateTrialExactMode: 'fixture'"), false);
  assert.equal(source.includes("gateTrialExactMode: 'live'"), true);
  assert.equal(source.includes('intent === undefined'), true);
  assert.equal(source.includes('uiStore.openWorldBuildingModal'), true);
});

void test('Gate Trial live exact activation does not affect Outskirts or Ruins route activation', () => {
  const source = readFileSync('src/systems/world/openWorldModule.ts', 'utf8');

  assert.equal(source.includes("normalizedModuleKey === 'outskirts' && intent === undefined"), false);
  assert.equal(source.includes("normalizedModuleKey === 'ruins' && intent === undefined"), false);
  assert.equal(source.includes("ruinsExactMode: 'fixture'"), false);
  assert.equal(source.includes('outskirtsExactMode'), false);
});
