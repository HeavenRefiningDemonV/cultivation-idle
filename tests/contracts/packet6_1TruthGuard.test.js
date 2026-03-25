import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

const constantsSource = read('src/constants/index.ts');
const gameLoopSource = read('src/systems/gameLoop.ts');
const prestigeSource = read('src/stores/prestigeStore.ts');
const gameStoreSource = read('src/stores/gameStore.ts');
const calculateApGainBlock =
  prestigeSource.match(/calculateAPGain:\s*\(\)\s*=>\s*\{[\s\S]*?\n\s*\},\n\n\s*canPrestige:/)?.[0] ?? '';

function assertAbsent(source, regex, message) {
  assert.equal(regex.test(source), false, message);
}

test('Packet 6.1: constants do not carry test-speed residue', () => {
  assertAbsent(
    constantsSource,
    /TESTING:|1000x\s+faster/i,
    'Realm constants reintroduced explicit test-speed language (TESTING/1000x faster).'
  );
});

test('Packet 6.1: live game init does not inject starter freebies', () => {
  assertAbsent(
    gameLoopSource,
    /addItem\('rusty_sword'|addItem\('worn_talisman'|addItem\('health_pill'|addItem\('spirit_stone'|addGold\('1000'|Added starter items to inventory/,
    'initializeGame path appears to reintroduce starter freebie injection.'
  );
});

test('Packet 6.1: AP gain remains depth-based and excludes time-cheese terms', () => {
  assertAbsent(
    calculateApGainBlock,
    /timeBonus|runTimeHours|Date\.now\(\)\s*-\s*state\.runStartTime/,
    'calculateAPGain appears to include a time-derived AP contribution again.'
  );
});

test('Packet 6.1: breakthrough requirement stays isolated from offline/cultivation multipliers', () => {
  assertAbsent(
    gameStoreSource,
    /getBreakthroughRequirement[\s\S]*getCultivationMultiplier|getBreakthroughRequirement[\s\S]*offline_mult/,
    'Breakthrough requirement appears to route through cultivation/offline multiplier wiring.'
  );
});

test('Packet 6.1: touched balance files avoid explicit test-speed comments', () => {
  const joined = [constantsSource, gameLoopSource, prestigeSource, gameStoreSource].join('\n');
  assertAbsent(
    joined,
    /TESTING:|1000x\s+faster/i,
    'Touched live balance paths contain explicit testing-speed comment residue.'
  );
});
