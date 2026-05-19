import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('ruins overlay registry defines all 8 requested roles and file names', () => {
  const registry = read('src/assets/ui/chrome/ruins_support/overlays.ts');

  assert.match(registry, /ruin_lower_fog_bank_a/);
  assert.match(registry, /ruin_lower_fog_bank_b/);
  assert.match(registry, /ruin_chamber_haze_left/);
  assert.match(registry, /ruin_chamber_haze_right/);
  assert.match(registry, /ruin_midband_stale_air/);
  assert.match(registry, /ruin_upper_vignette/);
  assert.match(registry, /ruin_anchor_soft_glow_a/);
  assert.match(registry, /ruin_anchor_soft_glow_b/);
  assert.match(registry, /ruins_overlay_pack_sheet\.svg/);
});

test('overlay pack sheet exists and is transparent svg', () => {
  const sheet = read('src/assets/ui/chrome/ruins_support/pack/overlays/ruins_overlay_pack_sheet.svg');
  assert.match(sheet, /<svg/);
  assert.match(sheet, /fill=\"none\"/);
});
