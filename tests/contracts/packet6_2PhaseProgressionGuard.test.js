import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const exists = (path) => existsSync(new URL(`../../${path}`, import.meta.url));

const phaseMapPath = 'src/features/progression/currentBranchPhaseMap.ts';
const progressionPath = 'src/features/progression/currentBranchProgression.ts';
const phaseTimingPath = 'src/features/progression/phaseTimingStore.ts';

test('Packet 6.2 guard: authoritative phase files exist', () => {
  assert.equal(exists(phaseMapPath), true, 'Missing currentBranchPhaseMap.ts phase contract file.');
  assert.equal(exists(progressionPath), true, 'Missing currentBranchProgression.ts progression resolver file.');
});

test('Packet 6.2 guard: bridge timing target ranges remain pinned', () => {
  const source = read(phaseMapPath);
  assert.match(source, /firstDungeonAvailableMinutes:\s*\{\s*min:\s*20,\s*max:\s*30\s*\}/);
  assert.match(source, /firstMajorBreakthroughMinutes:\s*\{\s*min:\s*35,\s*max:\s*50\s*\}/);
  assert.match(source, /firstPrestigeViableMinutes:\s*\{\s*min:\s*135,\s*max:\s*165\s*\}/);
  assert.match(source, /deepRunCapMinutes:\s*\{\s*min:\s*210,\s*max:\s*330\s*\}/);
});

test('Packet 6.2 guard: AdventureScreen does not reintroduce hardcoded zone ladder table', () => {
  const source = read('src/components/screens/AdventureScreen.tsx');
  assert.equal(/const\s+ZONES\s*=\s*\[/.test(source), false, 'Hardcoded const ZONES table reintroduced in AdventureScreen.');
  assert.equal(/training_forest[\s\S]*spirit_cavern[\s\S]*mystic_mountains/.test(source), false, 'AdventureScreen appears to carry inline zone ladder metadata again.');
});

test('Packet 6.2 guard: novice dungeon is not boot-unlocked by default', () => {
  const source = read('src/stores/dungeonStore.ts');
  assert.equal(/novice_clearing:\s*true/.test(source), false, 'Fresh boot novice_clearing unlock regression detected.');
});

test('Packet 6.2 guard: progression sync helper is wired into live runtime files', () => {
  const gameStore = read('src/stores/gameStore.ts');
  const zoneStore = read('src/stores/zoneStore.ts');
  const combatStore = read('src/stores/combatStore.ts');
  const gameLoop = read('src/systems/gameLoop.ts');

  assert.match(gameStore, /syncCurrentBranchAvailability\(/, 'gameStore no longer uses syncCurrentBranchAvailability.');
  assert.match(zoneStore + '\n' + gameLoop + '\n' + combatStore, /syncProgressionAvailability\(/, 'No live runtime file appears to trigger syncProgressionAvailability.');
});

test('Packet 6.2 guard: visible zone requirements match tuned bridge ladder', () => {
  const zones = JSON.parse(read('public/config/zones.json')).zones;
  const training = zones.find((zone) => zone.id === 'training_forest');
  const spirit = zones.find((zone) => zone.id === 'spirit_cavern');
  const mystic = zones.find((zone) => zone.id === 'mystic_mountains');

  assert.equal(training?.realmRequirement?.index, 0, 'training_forest should remain starting zone requirement.');
  assert.equal(spirit?.realmRequirement?.index, 1, 'spirit_cavern should remain Foundation-tier in visible config.');
  assert.equal(mystic?.realmRequirement?.index, 2, 'mystic_mountains should remain Golden Core-tier in visible config.');
});

test('Packet 6.2 guard: first three dungeon rewards stay coherent for gate chain', () => {
  const dungeons = JSON.parse(read('public/config/dungeons.json')).dungeons;
  const novice = dungeons.find((dungeon) => dungeon.id === 'novice_clearing');
  const stone = dungeons.find((dungeon) => dungeon.id === 'stone_core_sanctum');
  const nascent = dungeons.find((dungeon) => dungeon.id === 'nascent_soul_chamber');

  assert.equal(novice?.rewards?.guaranteedDrop?.itemId, 'foundation_pill');
  assert.equal(stone?.rewards?.guaranteedDrop?.itemId, 'core_catalyst');
  assert.equal(nascent?.rewards?.guaranteedDrop?.itemId, 'core_stabilizer');
});

test('Packet 6.2 guard: stale static dungeon unlocked booleans stay removed', () => {
  const source = read('public/config/dungeons.json');
  assert.equal(/"unlocked"\s*:/.test(source), false, 'Static unlocked booleans reintroduced in dungeons config.');
});

test('Packet 6.2 guard: phase timing store exists and keeps snapshot surface', () => {
  assert.equal(exists(phaseTimingPath), true, 'Missing phaseTimingStore.ts instrumentation file.');
  const source = read(phaseTimingPath);
  assert.match(source, /getTimingSnapshot\s*:\s*\(\)\s*=>/);
  assert.match(source, /firstDungeonUnlockedAt/);
  assert.match(source, /firstDungeonClearedAt/);
  assert.match(source, /firstPrestigeViableAt/);
});
