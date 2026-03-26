import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const exists = (path) => fs.existsSync(path);

const PROFILE_PATH = 'src/features/economy/currentBranchRewardProfiles.ts';
const DIAGNOSTICS_PATH = 'src/features/economy/rewardDiagnostics.ts';
const DUNGEONS_PATH = 'public/config/dungeons.json';
const ENEMIES_PATH = 'public/config/enemies.json';
const LOOT_PATH = 'src/systems/loot.ts';
const ITEMS_PATH = 'src/constants/itemsDatabase.ts';
const ADVENTURE_SCREEN_PATH = 'src/components/screens/AdventureScreen.tsx';
const COMBAT_STORE_PATH = 'src/stores/combatStore.ts';

test('Packet 6.3 guard: helper files + authoritative reward constants remain present', () => {
  assert.equal(exists(PROFILE_PATH), true, `Missing required helper file: ${PROFILE_PATH}`);
  assert.equal(exists(DIAGNOSTICS_PATH), true, `Missing required helper file: ${DIAGNOSTICS_PATH}`);

  const source = read(PROFILE_PATH);
  for (const symbol of [
    'CURRENT_BRANCH_ACTIVITY_ROLES',
    'CURRENT_BRANCH_ZONE_REWARD_TARGETS',
    'CURRENT_BRANCH_DUNGEON_REWARD_TARGETS',
    'getCurrentBranchRewardProfile',
  ]) {
    assert.match(source, new RegExp(symbol), `Missing Packet 6.3 symbol in reward profile module: ${symbol}`);
  }

  for (const activityId of [
    'training_forest',
    'spirit_cavern',
    'mystic_mountains',
    'novice_clearing',
    'stone_core_sanctum',
    'nascent_soul_chamber',
  ]) {
    assert.match(source, new RegExp(activityId), `Missing current-branch activity id in reward profile module: ${activityId}`);
  }
});

test('Packet 6.3 guard: zone value envelopes remain machine-readable', () => {
  const source = read(PROFILE_PATH);
  const envelopePatterns = [
    /training_forest:\s*{[\s\S]*?totalValueRange:\s*\[\s*70\s*,\s*110\s*\]/,
    /spirit_cavern:\s*{[\s\S]*?totalValueRange:\s*\[\s*220\s*,\s*340\s*\]/,
    /mystic_mountains:\s*{[\s\S]*?totalValueRange:\s*\[\s*650\s*,\s*950\s*\]/,
  ];

  for (const pattern of envelopePatterns) {
    assert.match(source, pattern, `Missing required Packet 6.3 zone envelope pattern: ${pattern}`);
  }
});

test('Packet 6.3 guard: dungeon first-clear/repeat schema is preserved end-to-end', () => {
  const dungeons = JSON.parse(read(DUNGEONS_PATH));
  for (const dungeon of dungeons.dungeons) {
    assert.equal(typeof dungeon.rewards.firstClearGold, 'number', `${dungeon.id} missing rewards.firstClearGold`);
    assert.equal(typeof dungeon.rewards.repeatGold, 'number', `${dungeon.id} missing rewards.repeatGold`);
    assert.equal(
      Object.prototype.hasOwnProperty.call(dungeon.rewards, 'gold'),
      false,
      `${dungeon.id} regressed to old flat rewards.gold`
    );
  }

  const nascent = dungeons.dungeons.find((d) => d.id === 'nascent_soul_chamber');
  assert.ok(nascent, 'Missing nascent_soul_chamber dungeon entry');
  assert.equal(
    nascent.rewards.guaranteedDrop?.itemId,
    'core_stabilizer',
    'nascent_soul_chamber milestone drop must remain core_stabilizer'
  );

  const combatStore = read(COMBAT_STORE_PATH);
  assert.match(combatStore, /firstClearGold/, 'CombatStore must still read rewards.firstClearGold');
  assert.match(combatStore, /repeatGold/, 'CombatStore must still read rewards.repeatGold');
  assert.doesNotMatch(combatStore, /dungeon\.rewards\.gold/, 'CombatStore regressed to dungeon.rewards.gold');
});

function parseItemDatabaseIds(itemsSource) {
  const ids = new Set();
  const entryRegex = /^\s{2}([a-z0-9_]+):\s*{/gm;
  let match;
  while ((match = entryRegex.exec(itemsSource)) !== null) {
    ids.add(match[1]);
  }
  return ids;
}

function extractLootReferencedIds(lootSource) {
  const ids = new Set();

  const pityBlock = lootSource.match(/const PITY_DROP_POOLS:[\s\S]*?};\n\nconst ITEM_ID_NORMALIZATION/);
  if (pityBlock) {
    for (const m of pityBlock[0].matchAll(/itemId:\s*'([^']+)'/g)) ids.add(m[1]);
  }

  const firstKillBlock = lootSource.match(/const firstKillAnchors:[\s\S]*?};/);
  if (firstKillBlock) {
    for (const m of firstKillBlock[0].matchAll(/:\s*'([^']+)'/g)) ids.add(m[1]);
  }

  const rareMaterialsBlock = lootSource.match(/const rareMaterials = \[([\s\S]*?)\];/);
  if (rareMaterialsBlock) {
    for (const m of rareMaterialsBlock[1].matchAll(/'([^']+)'/g)) ids.add(m[1]);
  }

  return ids;
}

test('Packet 6.3 guard: all live reward item references resolve to ITEMS_DATABASE', () => {
  const itemIds = parseItemDatabaseIds(read(ITEMS_PATH));
  const enemies = JSON.parse(read(ENEMIES_PATH));
  const dungeons = JSON.parse(read(DUNGEONS_PATH));
  const lootSource = read(LOOT_PATH);

  const referenced = new Set();
  for (const enemy of enemies.enemies) {
    for (const drop of enemy.lootTable || []) referenced.add(drop.itemId);
  }
  for (const dungeon of dungeons.dungeons) {
    if (dungeon.rewards?.guaranteedDrop?.itemId) referenced.add(dungeon.rewards.guaranteedDrop.itemId);
  }
  for (const id of extractLootReferencedIds(lootSource)) referenced.add(id);

  const missing = [...referenced].filter((id) => !itemIds.has(id));
  assert.deepEqual(
    missing,
    [],
    `Found live reward item references missing from ITEMS_DATABASE: ${missing.join(', ') || '(none)'}`
  );
});

test('Packet 6.3 guard: zone boss rewards cannot bypass gate items', () => {
  const lootSource = read(LOOT_PATH);
  assert.doesNotMatch(
    lootSource,
    /shadow_spider_queen\s*:\s*GATE_ITEMS\[/,
    'Zone boss shadow_spider_queen must never map directly to GATE_ITEMS'
  );
  assert.doesNotMatch(
    lootSource,
    /gateDropsByBoss/,
    'Legacy gateDropsByBoss mapping returned and can reintroduce gate-item bypasses'
  );
  assert.doesNotMatch(
    lootSource,
    /firstKillAnchors[\s\S]*?GATE_ITEMS/,
    'Zone boss first-kill path must not depend on GATE_ITEMS'
  );
});

test('Packet 6.3 guard: loot log and diagnostics surfaces do not regress', () => {
  const lootSource = read(LOOT_PATH);
  assert.match(
    lootSource,
    /ITEMS_DATABASE\[item\.itemId\]\?\.name\s*\?\?\s*item\.itemId/,
    'formatLootMessage must keep using player-facing item names when available'
  );

  const diagnosticsSource = read(DIAGNOSTICS_PATH);
  for (const exportName of [
    'recordRewardDiagnosticEvent',
    'getRewardDiagnosticsSnapshot',
    'resetRewardDiagnostics',
  ]) {
    assert.match(
      diagnosticsSource,
      new RegExp(`export function ${exportName}`),
      `rewardDiagnostics regression: missing export ${exportName}`
    );
  }

  if (exists(ADVENTURE_SCREEN_PATH)) {
    const adventureSource = read(ADVENTURE_SCREEN_PATH);
    assert.doesNotMatch(
      adventureSource,
      /Gold\/hr:/,
      'AdventureScreen regressed to stale hardcoded reward fiction (Gold/hr)'
    );
  }
});
