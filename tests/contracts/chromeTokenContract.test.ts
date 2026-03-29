import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

void test('chrome token contract: required files exist', () => {
  [
    'src/styles/uiChromeTokens.scss',
    'src/styles/uiMotionTokens.scss',
    'docs/ui/section-b-token-contract.md',
  ].forEach((relPath) => {
    assert.equal(fs.existsSync(path.join(root, relPath)), true, `${relPath} should exist`);
  });
});

void test('chrome token contract: canonical chrome and motion token keys are present', () => {
  const chrome = read('src/styles/uiChromeTokens.scss');
  const motion = read('src/styles/uiMotionTokens.scss');

  [
    '--ui-chrome-color-parchment-base',
    '--ui-chrome-surface-shell-base',
    '--ui-chrome-radius-card',
    '--ui-chrome-space-shell-pad-x',
    '--ui-chrome-font-body',
  ].forEach((token) => assert.match(chrome, new RegExp(token)));

  [
    '--ui-motion-duration-hover',
    '--ui-motion-ease-standard',
    '--ui-motion-hover-lift-y',
  ].forEach((token) => assert.match(motion, new RegExp(token)));
});

void test('chrome token contract: legacy paper + ink aliases remain available', () => {
  const paperBridge = read('src/styles/paperInkTokens.scss');
  const inkBridge = read('src/ui/ink/inkTheme.scss');

  assert.match(paperBridge, /--paper-parchment/);
  assert.match(paperBridge, /--paper-shell-base/);
  assert.match(inkBridge, /--ink-panel-base/);
  assert.match(inkBridge, /--ink-text-color/);
});

void test('chrome token contract: targeted raw z-index values are removed', () => {
  assert.doesNotMatch(read('src/components/BottomTabBar.scss'), /z-index:\s*200/);
  assert.doesNotMatch(read('src/ui/cultivation/CultivationHeaderRibbon.scss'), /z-index:\s*40/);
  assert.doesNotMatch(read('src/ui/ink/InkModalFrame.scss'), /z-index:\s*80/);
});

void test('chrome token contract: normalized shared shells reference motion/layer tokens', () => {
  const files = [
    'src/ui/paper/paper.scss',
    'src/ui/ink/PaperCard.scss',
    'src/ui/ink/PaperChip.scss',
    'src/ui/ink/InkModalFrame.scss',
    'src/components/BottomTabBar.scss',
    'src/ui/cultivation/CultivationHeaderRibbon.scss',
    'src/styles/global.css',
  ];

  files.forEach((relPath) => {
    const source = read(relPath);
    assert.match(source, /var\(--ui-motion-|var\(--ui-layer-/, `${relPath} should reference normalized motion/layer tokens`);
  });
});
