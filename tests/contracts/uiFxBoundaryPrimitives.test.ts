import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

void test('boundary primitives: ScreenCompositionRoot stamps screen-key/archetype attributes', () => {
  const source = read('src/ui/fx/primitives/ScreenCompositionRoot.tsx');

  assert.match(source, /data-screen-key/);
  assert.match(source, /data-screen-archetype/);
  assert.match(source, /archetype\s*=\s*'module'/);
});

void test('boundary primitives: scenic backdrop is DOM-only and stamps scenic attr', () => {
  const source = read('src/ui/fx/primitives/ScenicBackdropMount.tsx');

  assert.match(source, /data-scenic-backdrop/);
  assert.doesNotMatch(source, /framer-motion/);
  assert.doesNotMatch(source, /PixiUiStage/);
});

void test('boundary primitives: safe overlay stamps slot and defaults interactive', () => {
  const source = read('src/ui/fx/primitives/SafeDomOverlaySlot.tsx');

  assert.match(source, /data-dom-overlay-slot/);
  assert.match(source, /interactive\s*=\s*true/);
});

void test('boundary primitives: ambient underlay and hero slot compose ScreenFxStage roles', () => {
  const ambientSource = read('src/ui/fx/primitives/AmbientUnderlayMount.tsx');
  const heroSource = read('src/ui/fx/primitives/HeroFxSlot.tsx');

  assert.match(ambientSource, /ScreenFxStage/);
  assert.match(ambientSource, /role="underlay"/);
  assert.match(ambientSource, /PixiUiStage/);

  assert.match(heroSource, /ScreenFxStage/);
  assert.match(heroSource, /role="hero"/);
  assert.match(heroSource, /PixiUiStage/);
});

void test('boundary primitives: ScreenFxStage accepts canonical declarative props', () => {
  const source = read('src/ui/fx/ScreenFxStage.tsx');

  assert.match(source, /scene:\s*ReactNode \| null/);
  assert.match(source, /qualityFloor\?:\s*FxQualityFloor/);
  assert.match(source, /disableOnReducedMotion\?:\s*boolean/);
  assert.match(source, /portalTarget\?:\s*FxPortalTarget/);
  assert.match(source, /containToParent\?:\s*boolean/);
});

void test('boundary primitives: primitives remain free of direct screen imports', () => {
  const files = [
    'src/ui/fx/primitives/ScreenCompositionRoot.tsx',
    'src/ui/fx/primitives/ScenicBackdropMount.tsx',
    'src/ui/fx/primitives/AmbientUnderlayMount.tsx',
    'src/ui/fx/primitives/HeroFxSlot.tsx',
    'src/ui/fx/primitives/SafeDomOverlaySlot.tsx',
  ];

  files.forEach((filePath) => {
    assert.doesNotMatch(read(filePath), /components\/screens/);
  });
});
