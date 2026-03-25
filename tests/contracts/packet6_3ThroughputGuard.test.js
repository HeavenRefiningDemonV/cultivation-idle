import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf-8');
const exists = (path) => fs.existsSync(path);

test('packet 6.3 reward profile/diagnostics files exist with expected exports', () => {
  const profilePath = 'src/features/economy/currentBranchRewardProfiles.ts';
  const diagnosticsPath = 'src/features/economy/rewardDiagnostics.ts';

  assert.equal(exists(profilePath), true, 'Missing currentBranchRewardProfiles.ts.');
  assert.equal(exists(diagnosticsPath), true, 'Missing rewardDiagnostics.ts.');

  const profileSrc = read(profilePath);
  assert.match(profileSrc, /CURRENT_BRANCH_ACTIVITY_ROLES/);
  assert.match(profileSrc, /CURRENT_BRANCH_ZONE_REWARD_TARGETS/);
  assert.match(profileSrc, /CURRENT_BRANCH_DUNGEON_REWARD_TARGETS/);
  assert.match(profileSrc, /getCurrentBranchRewardProfile/);

  const diagSrc = read(diagnosticsPath);
  assert.match(diagSrc, /recordRewardDiagnosticEvent/);
  assert.match(diagSrc, /getRewardDiagnosticsSnapshot/);
  assert.match(diagSrc, /resetRewardDiagnostics/);
});

test('packet 6.3 removes known ghost ids and zone-boss gate leakage', () => {
  const enemies = read('public/config/enemies.json');
  const lootSource = read('src/systems/loot.ts');

  const bannedIds = [
    'lesser_health_potion',
    'health_potion',
    'greater_health_potion',
    'lesser_spirit_stone',
    'greater_spirit_stone',
    'cultivation_manual',
    'ancient_scroll',
    'heavenly_artifact',
    'supreme_elixir',
  ];

  for (const id of bannedIds) {
    assert.equal(enemies.includes(`"${id}"`), false, `Ghost id still present in enemies: ${id}`);
  }

  assert.equal(
    lootSource.includes('shadow_spider_queen: GATE_ITEMS[2]'),
    false,
    'Zone boss should not directly grant gate items.'
  );
});

test('packet 6.3 dungeon rewards use firstClear/repeat schema', () => {
  const dungeonsRaw = read('public/config/dungeons.json');
  const data = JSON.parse(dungeonsRaw);

  for (const dungeon of data.dungeons) {
    assert.equal(typeof dungeon.rewards.firstClearGold, 'number', `${dungeon.id} missing firstClearGold`);
    assert.equal(typeof dungeon.rewards.repeatGold, 'number', `${dungeon.id} missing repeatGold`);
    assert.equal(
      Object.prototype.hasOwnProperty.call(dungeon.rewards, 'gold'),
      false,
      `${dungeon.id} still uses flat rewards.gold`
    );
  }
});

test('packet 6.3 loot display uses item names (not raw item ids only)', () => {
  const lootSource = read('src/systems/loot.ts');
  assert.match(lootSource, /ITEMS_DATABASE\[item\.itemId\]\?\.name/);
});
