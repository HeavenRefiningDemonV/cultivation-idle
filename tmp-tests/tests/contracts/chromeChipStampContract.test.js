import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));

void test('chrome chip/stamp contract: required artifacts exist', () => {
  [
    'src/ui/chrome/ChromeChip.tsx',
    'src/ui/chrome/ChromeChip.scss',
    'src/ui/chrome/ChromeStamp.tsx',
    'src/ui/chrome/ChromeStamp.scss',
    'docs/ui/section-b-chip-stamp.md',
  ].forEach((rel) => assert.equal(exists(rel), true, `${rel} should exist`));
});

void test('chrome chip/stamp contract: chrome index exports canonical owners', () => {
  const source = read('src/ui/chrome/index.ts');
  assert.match(source, /export\s*\{\s*ChromeChip\s*\}/);
  assert.match(source, /export\s*\{\s*ChromeStamp\s*\}/);
});

void test('chrome chip/stamp contract: legacy wrappers delegate to canonical implementations', () => {
  assert.match(read('src/ui/ink/PaperChip.tsx'), /ChromeChip/);
  assert.match(read('src/ui/paper/PaperChip.tsx'), /ChromeChip/);
  assert.match(read('src/ui/paper/PaperStamp.tsx'), /ChromeStamp/);
});

void test('chrome chip/stamp contract: direct adoption targets use canonical components', () => {
  assert.match(read('src/ui/status/RunCompass.tsx'), /ChromeChip/);
  assert.match(read('src/ui/status/RunCompassCompact.tsx'), /ChromeChip/);
  assert.match(read('src/ui/ink/PurposeSourceCallout.tsx'), /ChromeChip/);
  assert.match(read('src/ui/world/WorldRouteChip.tsx'), /ChromeChip/);
  assert.match(read('src/components/screens/BountyBoardPanel.tsx'), /ChromeChip/);
  assert.match(read('src/components/screens/BountyBoardPanel.tsx'), /ChromeStamp/);
  assert.match(read('src/components/screens/ExpeditionBoardPanel.tsx'), /ChromeChip/);
  assert.match(read('src/components/screens/ExpeditionBoardPanel.tsx'), /ChromeStamp/);
});

void test('chrome chip/stamp contract: WorldRouteChip no longer renders custom span badge', () => {
  const source = read('src/ui/world/WorldRouteChip.tsx');
  assert.doesNotMatch(source, /<span\s+className=\{`worldRouteChip/);
  assert.match(source, /<ChromeChip/);
});

void test('chrome chip/stamp contract: canonical scss roots exist', () => {
  assert.match(read('src/ui/chrome/ChromeChip.scss'), /\.chromeChip/);
  assert.match(read('src/ui/chrome/ChromeStamp.scss'), /\.chromeStamp/);
});

void test('chrome chip/stamp contract: legacy class families remain present', () => {
  const chip = read('src/ui/chrome/ChromeChip.scss');
  const stamp = read('src/ui/chrome/ChromeStamp.scss');
  assert.match(chip, /inkPaperChip/);
  assert.match(chip, /paperChip/);
  assert.match(stamp, /paperStamp/);
});

void test('chrome chip/stamp contract: legacy style owners reduced to compatibility', () => {
  const paperScss = read('src/ui/paper/paper.scss');
  const inkChipScss = read('src/ui/ink/PaperChip.scss');

  assert.doesNotMatch(paperScss, /\.paperChip\s*\{/);
  assert.doesNotMatch(paperScss, /\.paperStamp\s*\{/);
  assert.match(inkChipScss, /ChromeChip\.scss/);
  assert.doesNotMatch(inkChipScss, /\.inkPaperChip\s*\{/);
});

void test('chrome chip/stamp contract: packet adds no new art files', () => {
  const output = execSync('git status --short', { cwd: root, encoding: 'utf8' });
  const added = output
    .split('\n')
    .filter((line) => line.startsWith('A ') || line.startsWith('?? '))
    .map((line) => line.replace(/^(A |\?\? )/, '').trim());
  const newArt = added.filter((rel) => /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(rel));
  assert.equal(newArt.length, 0, `new art files detected: ${newArt.join(', ')}`);
});
