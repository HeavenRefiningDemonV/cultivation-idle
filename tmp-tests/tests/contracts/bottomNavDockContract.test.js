import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));

void test('bottom nav dock contract: required artifacts exist', () => {
  [
    'src/ui/chrome/BottomNavDock.tsx',
    'src/ui/chrome/BottomNavDock.scss',
    'src/ui/chrome/NavDockButton.tsx',
    'src/ui/chrome/NavDockButton.scss',
    'docs/ui/section-b-bottom-nav-dock.md',
  ].forEach((rel) => assert.equal(exists(rel), true, `${rel} should exist`));
});

void test('bottom nav dock contract: chrome index exports canonical dock/button owners', () => {
  const source = read('src/ui/chrome/index.ts');
  assert.match(source, /export\s*\{\s*BottomNavDock\s*\}/);
  assert.match(source, /export\s*\{\s*NavDockButton\s*\}/);
});

void test('bottom nav dock contract: BottomTabBar delegates to BottomNavDock', () => {
  const source = read('src/components/BottomTabBar.tsx');
  assert.match(source, /BottomNavDock/);
  assert.match(source, /<BottomNavDock/);
});

void test('bottom nav dock contract: BottomTabBar keeps locked internal tab ids and label source', () => {
  const source = read('src/components/BottomTabBar.tsx');
  ['status', 'cultivation', 'adventure', 'inventory', 'techniques', 'prestige', 'settings'].forEach((id) => {
    assert.match(source, new RegExp(`id:\\s*'${id}'`));
  });
  assert.match(source, /getShellTabLabel\(/);
});

void test('bottom nav dock contract: canonical styles define dock/button roots', () => {
  assert.match(read('src/ui/chrome/BottomNavDock.scss'), /\.bottomNavDock/);
  assert.match(read('src/ui/chrome/NavDockButton.scss'), /\.navDockButton/);
});

void test('bottom nav dock contract: live compatibility classes remain in meaningful canonical DOM/styling', () => {
  const dockTsx = read('src/ui/chrome/BottomNavDock.tsx');
  const buttonTsx = read('src/ui/chrome/NavDockButton.tsx');
  assert.match(dockTsx, /bottomTabBar/);
  assert.match(dockTsx, /bottomTabBarInner/);
  assert.match(dockTsx, /bottomTabBarList/);
  assert.match(buttonTsx, /bottomTabBarButton/);
  assert.match(buttonTsx, /bottomTabBarButton--active/);
});

void test('bottom nav dock contract: nav buttons keep uiNoShift', () => {
  assert.match(read('src/ui/chrome/NavDockButton.tsx'), /uiNoShift/);
});

void test('bottom nav dock contract: canonical layer strategy uses nav token and no raw z-index 200 in canonical/wrapper styles', () => {
  const canonical = read('src/ui/chrome/BottomNavDock.scss');
  const wrapper = read('src/components/BottomTabBar.scss');
  assert.match(canonical, /var\(--ui-layer-bottom-nav|var\(--ui-layer-chrome-dock/);
  assert.doesNotMatch(canonical, /z-index:\s*200/);
  assert.doesNotMatch(wrapper, /z-index:\s*200/);
});

void test('bottom nav dock contract: GameLayout keeps bottom reserve contract', () => {
  const layout = read('src/components/GameLayout.scss');
  assert.match(layout, /var\(--ui-bottom-nav-total\)/);
});

void test('bottom nav dock contract: life-start hide compatibility remains protected by bottomTabBar root class', () => {
  const lifeStart = read('src/components/modals/LifeStartWizardModal.scss');
  const dockTsx = read('src/ui/chrome/BottomNavDock.tsx');
  assert.match(lifeStart, /body\.lifePathMode\s+\.bottomTabBar/);
  assert.match(dockTsx, /bottomTabBar/);
});
