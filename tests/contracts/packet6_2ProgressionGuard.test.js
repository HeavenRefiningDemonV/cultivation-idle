import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

const phaseMapSource = read('src/features/progression/currentBranchPhaseMap.ts');
const adventureSource = read('src/components/screens/AdventureScreen.tsx');
const dungeonStoreSource = read('src/stores/dungeonStore.ts');
const zonesConfig = JSON.parse(read('public/config/zones.json'));
const dungeonsConfig = JSON.parse(read('public/config/dungeons.json'));

test('Packet 6.2: bridge timing targets are machine-readable and pinned', () => {
  assert.match(phaseMapSource, /firstDungeonAvailableMinutes:\s*\{\s*min:\s*20,\s*max:\s*30\s*\}/);
  assert.match(phaseMapSource, /firstMajorBreakthroughMinutes:\s*\{\s*min:\s*35,\s*max:\s*50\s*\}/);
  assert.match(phaseMapSource, /firstPrestigeViableMinutes:\s*\{\s*min:\s*135,\s*max:\s*165\s*\}/);
  assert.match(phaseMapSource, /deepRunCapMinutes:\s*\{\s*min:\s*210,\s*max:\s*330\s*\}/);
});

test('Packet 6.2: novice dungeon is not unlocked by default at fresh boot', () => {
  assert.equal(/novice_clearing:\s*true/.test(dungeonStoreSource), false);
});

test('Packet 6.2: zone config realm gates align with branch ladder', () => {
  const spirit = zonesConfig.zones.find((zone) => zone.id === 'spirit_cavern');
  const mystic = zonesConfig.zones.find((zone) => zone.id === 'mystic_mountains');
  assert.equal(spirit?.realmRequirement?.index, 1);
  assert.equal(mystic?.realmRequirement?.index, 2);
});

test('Packet 6.2: third dungeon reward matches live bridge gate chain', () => {
  const nascent = dungeonsConfig.dungeons.find((dungeon) => dungeon.id === 'nascent_soul_chamber');
  assert.equal(nascent?.rewards?.guaranteedDrop?.itemId, 'core_stabilizer');
  assert.equal(nascent?.rewards?.guaranteedDrop?.name, 'Core Stabilizer');
});

test('Packet 6.2: adventure screen no longer owns a hardcoded zone ladder table', () => {
  assert.equal(/const\s+ZONES\s*=\s*\[/.test(adventureSource), false);
});
