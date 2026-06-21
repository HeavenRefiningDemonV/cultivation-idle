import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('RitualModalFrame exposes frozen variant/size registries and explicit labeling props', () => {
  const file = read('src/ui/shell/RitualModalFrame.tsx');
  assert.match(file, /RITUAL_MODAL_FRAME_VARIANT_OPTIONS = \['ritual', 'chapterEnd', 'summary'\] as const/);
  assert.match(file, /RITUAL_MODAL_FRAME_SIZE_OPTIONS = \['md', 'lg'\] as const/);
  assert.match(file, /ariaLabel\?: string/);
  assert.match(file, /ariaLabelledBy\?: string/);
});

test('RitualModalFrame header precedence is explicit and avoids double header truth', () => {
  const file = read('src/ui/shell/RitualModalFrame.tsx');
  assert.match(file, /`header` takes precedence; title\/subtitle\/meta auto-header inputs are ignored/);
  assert.match(file, /const resolvedHeader = header \?\?/);
});

test('RitualModalFrame barrel exports ritual API freeze registries', () => {
  const file = read('src/ui/shell/index.ts');
  assert.match(file, /RITUAL_MODAL_FRAME_VARIANT_OPTIONS/);
  assert.match(file, /RITUAL_MODAL_FRAME_SIZE_OPTIONS/);
});

test('F2-S1: RitualModalFrame exposes frozen rite + state registries, additively (default preserved)', () => {
  const file = read('src/ui/shell/RitualModalFrame.tsx');
  // The new frozen registries exist with the canonical values.
  assert.match(file, /RITUAL_MODAL_FRAME_RITE_OPTIONS = \['neutral', 'breakthrough', 'tribulation', 'echo', 'lifeSummary', 'rootUpgrade'\] as const/);
  assert.match(file, /RITUAL_MODAL_FRAME_RITE_STATE_OPTIONS = \['default', 'prestige', 'postFailure'\] as const/);
  // The new props are OPTIONAL with safe defaults (preserve-first — existing call sites unaffected).
  assert.match(file, /rite\?: RitualModalFrameRite/);
  assert.match(file, /riteState\?: RitualModalFrameRiteState/);
  assert.match(file, /rite = 'neutral'/);
  assert.match(file, /riteState = 'default'/);
  // The state is threaded to a backdrop class + data attribute.
  assert.match(file, /ritualModalFrame--state-\$\{riteState\}/);
  assert.match(file, /data-rite-state=\{riteState\}/);
  // The OLD registries are still present (nothing removed/renamed).
  assert.match(file, /RITUAL_MODAL_FRAME_VARIANT_OPTIONS = \['ritual', 'chapterEnd', 'summary'\] as const/);
});

test('F2-S1: the default backdrop is a no-op (only prestige/postFailure add treatment) and is token-driven', () => {
  const scss = read('src/ui/shell/RitualModalFrame.scss');
  // prestige + postFailure backdrops exist...
  assert.match(scss, /\.ritualModalFrame--state-prestige \.ritualModalFrame__inner/);
  assert.match(scss, /\.ritualModalFrame--state-postFailure \.ritualModalFrame__inner/);
  // ...but there is NO `--state-default` rule (default = the existing resting frame, unchanged).
  assert.doesNotMatch(scss, /\.ritualModalFrame--state-default/);
  // Token-driven: the new backdrop blocks introduce no raw hex.
  const s1Block = scss.slice(scss.indexOf('F2-S1'));
  assert.doesNotMatch(s1Block, /#[0-9a-fA-F]{3,8}\b/);
});

test('F2-S1: barrel re-exports the new rite registries + types', () => {
  const file = read('src/ui/shell/index.ts');
  assert.match(file, /RITUAL_MODAL_FRAME_RITE_OPTIONS/);
  assert.match(file, /RITUAL_MODAL_FRAME_RITE_STATE_OPTIONS/);
  assert.match(file, /RitualModalFrameRiteState/);
});
