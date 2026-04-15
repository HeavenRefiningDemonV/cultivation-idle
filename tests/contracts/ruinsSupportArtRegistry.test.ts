import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('ruins support-art registry includes the full 10-role pack', () => {
  const registry = read('src/assets/ui/chrome/ruins_support/index.ts');

  assert.match(registry, /ruin_location_plaque/);
  assert.match(registry, /ruin_sub_identity_plate/);
  assert.match(registry, /ruin_anchor_reward_underplate_a/);
  assert.match(registry, /ruin_anchor_reward_underplate_b/);
  assert.match(registry, /ruin_local_chest_frame_accent_a/);
  assert.match(registry, /ruin_local_chest_frame_accent_b/);
  assert.match(registry, /ruin_city_mood_stamp_organic/);
  assert.match(registry, /ruin_city_mood_stamp_kiln/);
  assert.match(registry, /ruin_city_mood_stamp_crystal/);
  assert.match(registry, /ruin_neutral_insignia/);
  assert.match(registry, /ruins_support_pack_sheet\.svg/);
});

test('ruins support-art pack files are present and transparent svg assets', () => {
  const readme = read('src/assets/ui/chrome/ruins_support/README.md');
  const sheet = read('src/assets/ui/chrome/ruins_support/pack/ruins_support_pack_sheet.svg');

  assert.match(readme, /Included assets/);
  assert.match(sheet, /<svg/);
  assert.match(sheet, /fill=\"none\"/);
});
