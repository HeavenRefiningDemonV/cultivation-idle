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
