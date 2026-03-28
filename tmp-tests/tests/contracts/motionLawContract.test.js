import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const read = (filePath) => fs.readFileSync(path.join(ROOT, filePath), 'utf8');
const exists = (filePath) => fs.existsSync(path.join(ROOT, filePath));

test('B.11 required files exist', () => {
  [
    'src/ui/chrome/useNoLayoutShiftState.ts',
    'src/ui/chrome/layoutStabilityGuards.scss',
    'docs/ui/section-b-motion-law.md',
  ].forEach((filePath) => assert.equal(exists(filePath), true, `${filePath} should exist`));
});

test('motion safety contract includes emphasis tiers, reduced clamp, pressShiftPx, allowHoverLift', () => {
  const text = read('src/ui/fx/motion/motionSafetyContract.ts');
  assert.match(text, /subtle/);
  assert.match(text, /standard/);
  assert.match(text, /hero/);
  assert.match(text, /reducedMotion/);
  assert.match(text, /pressShiftPx/);
  assert.match(text, /allowHoverLift/);
});

test('SelectionHalo ties into shared motion safety', () => {
  const text = read('src/ui/chrome/SelectionHalo.tsx');
  assert.ok(text.includes('useMotionSafety') || text.includes('MotionSafeSelectionSurface'));
});

test('FrameCard uses shared motion/no-shift utility', () => {
  const text = read('src/ui/chrome/FrameCard.tsx');
  assert.ok(text.includes('MotionSafeSelectionSurface') || text.includes('useNoLayoutShiftState'));
});

test('ChromeChip uses shared no-shift utility or tokenized motion', () => {
  const text = read('src/ui/chrome/ChromeChip.tsx');
  assert.ok(text.includes('useNoLayoutShiftState') || read('src/ui/chrome/ChromeChip.scss').includes('var(--ui-motion-'));
});

test('TechniqueLibraryScreen uses shared no-shift utility', () => {
  const text = read('src/components/screens/TechniqueLibraryScreen.tsx');
  assert.ok(text.includes('useNoLayoutShiftState') || text.includes('uiNoShift'));
});

test('ManualPavilionPanel uses shared no-shift utility', () => {
  const text = read('src/components/screens/ManualPavilionPanel.tsx');
  assert.ok(text.includes('useNoLayoutShiftState') || text.includes('uiNoShift'));
});

test('CityMapHub or WorldModuleCard uses shared no-shift utility', () => {
  const city = read('src/components/screens/CityMapHub.tsx');
  const moduleCard = read('src/ui/world/WorldModuleCard.tsx');
  assert.ok(city.includes('useNoLayoutShiftState') || moduleCard.includes('useNoLayoutShiftState'));
});

test('LifeStart or ChangeHeartLaw uses MotionSafeSelectionSurface meaningfully', () => {
  const life = read('src/components/modals/LifeStartWizardModal.tsx');
  const heart = read('src/ui/cultivation/heartLaw/ChangeHeartLawModal.tsx');
  assert.ok(life.includes('MotionSafeSelectionSurface') || heart.includes('MotionSafeSelectionSurface'));
});

test('layoutStabilityGuards contains practical guard classes', () => {
  const text = read('src/ui/chrome/layoutStabilityGuards.scss');
  assert.match(text, /\.uiNoShiftGuard/);
  assert.match(text, /\.uiNoShiftSelectionHost/);
  assert.match(text, /\.uiNoShiftBadgeSlot/);
});

test('touched shared scss references ui motion tokens', () => {
  [
    'src/ui/chrome/FrameCard.scss',
    'src/ui/chrome/ChromeChip.scss',
    'src/ui/chrome/NavDockButton.scss',
    'src/ui/chrome/SelectionHalo.scss',
    'src/ui/chrome/OverlaySwash.scss',
  ].forEach((filePath) => assert.match(read(filePath), /var\(--ui-motion-/));
});

test('no selected-state border-width growth strategy reintroduced in key files', () => {
  [
    'src/ui/chrome/FrameCard.scss',
    'src/ui/chrome/NavDockButton.scss',
    'src/ui/chrome/SelectionHalo.scss',
    'src/ui/world/WorldModuleCard.scss',
  ].forEach((filePath) => assert.doesNotMatch(read(filePath), /border-width\s*:/));
});
