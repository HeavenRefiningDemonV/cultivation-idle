import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

void test('ui fx settings screen surface: settings screen contains visual fx panel and required controls', () => {
  const source = read('src/components/screens/SettingsScreen.tsx');

  assert.match(source, /Visual FX/);
  assert.match(source, /Enable UI FX/);
  assert.match(source, /FX Quality/);
  assert.match(source, /Allow atmosphere/);
  assert.match(source, /Allow hero FX/);
  assert.match(source, /System reduced motion/);
  assert.match(source, /Resolved quality/);
  assert.match(source, /Resolved render mode/);
  assert.match(source, /Continuous atmosphere/);
  assert.match(source, /Animated hero FX/);
  assert.match(source, /DPR cap/);
});

void test('ui fx settings screen surface: settings screen is only touched screen for fx bridge imports', () => {
  const settingsSource = read('src/components/screens/SettingsScreen.tsx');
  const cultivateSource = read('src/components/screens/CultivateScreen.tsx');
  const statusSource = read('src/components/screens/StatusScreen.tsx');
  const worldSource = read('src/components/screens/WorldScreen.tsx');

  assert.match(settingsSource, /app\/fx/);
  assert.doesNotMatch(cultivateSource, /app\/fx/);
  assert.doesNotMatch(statusSource, /app\/fx/);
  assert.doesNotMatch(worldSource, /app\/fx/);
});

void test('ui fx settings screen surface: app entry/layout remain bridge-free', () => {
  const appSource = read('src/App.tsx');
  const gameLayoutSource = read('src/components/GameLayout.tsx');

  assert.doesNotMatch(appSource, /app\/fx/);
  assert.doesNotMatch(gameLayoutSource, /app\/fx/);
});
