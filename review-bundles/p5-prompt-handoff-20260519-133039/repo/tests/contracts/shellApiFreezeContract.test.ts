import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('FrameCard exposes canonical frozen option registries', () => {
  const file = read('src/ui/shell/FrameCard.tsx');

  assert.match(file, /FRAME_CARD_FRAME_OPTIONS = \['panel', 'card', 'tray'\] as const/);
  assert.match(file, /FRAME_CARD_EMPHASIS_OPTIONS = \['light', 'medium', 'strong'\] as const/);
  assert.match(file, /FRAME_CARD_SURFACE_OPTIONS = \['surface', 'raised', 'inspector', 'dense', 'ritual'\] as const/);
  assert.match(file, /FRAME_CARD_DENSITY_OPTIONS = \['dense', 'default', 'roomy'\] as const/);
});

test('PlaqueHeader exposes canonical frozen option registries', () => {
  const file = read('src/ui/shell/PlaqueHeader.tsx');

  assert.match(file, /PLAQUE_HEADER_VARIANT_OPTIONS = \['section', 'inspector', 'location'\] as const/);
  assert.match(file, /PLAQUE_HEADER_EMPHASIS_OPTIONS = \['light', 'medium', 'strong'\] as const/);
  assert.match(file, /PLAQUE_HEADER_DENSITY_OPTIONS = \['compact', 'default'\] as const/);
  assert.match(file, /PLAQUE_HEADER_ALIGN_OPTIONS = \['start', 'center'\] as const/);
});

test('ui/shell barrel re-exports FrameCard and PlaqueHeader option registries', () => {
  const file = read('src/ui/shell/index.ts');

  assert.match(file, /FRAME_CARD_FRAME_OPTIONS/);
  assert.match(file, /FRAME_CARD_EMPHASIS_OPTIONS/);
  assert.match(file, /FRAME_CARD_SURFACE_OPTIONS/);
  assert.match(file, /FRAME_CARD_DENSITY_OPTIONS/);
  assert.match(file, /PLAQUE_HEADER_VARIANT_OPTIONS/);
  assert.match(file, /PLAQUE_HEADER_EMPHASIS_OPTIONS/);
  assert.match(file, /PLAQUE_HEADER_DENSITY_OPTIONS/);
  assert.match(file, /PLAQUE_HEADER_ALIGN_OPTIONS/);
});
