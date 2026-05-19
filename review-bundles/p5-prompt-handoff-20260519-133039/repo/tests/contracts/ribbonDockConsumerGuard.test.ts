import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('BottomTabBar stays the live BottomNavDock compatibility wrapper with canonical labels', () => {
  const file = read('src/components/BottomTabBar.tsx');
  assert.match(file, /BOTTOM_TAB_BAR_ORDER/);
  assert.match(file, /buildDockItemLabel\(tab: GameTab\): string/);
  assert.match(file, /return getShellTabLabel\(tab\)/);
  assert.match(file, /BOTTOM_TAB_BAR_COMPAT_POLICY/);
  assert.match(file, /preserveLegacyHooks: true/);
  assert.match(file, /uiNoShift bottomTabBarButton/);
});

test('GameLayout mounts BottomTabBar as the live global nav path', () => {
  const file = read('src/components/GameLayout.tsx');
  assert.match(file, /import \{ BottomTabBar \} from '\.\/BottomTabBar\.js'/);
  assert.match(file, /<BottomTabBar \/>/);
});

test('World and Prestige TopRibbon titles normalize through canonical shell tab labels', () => {
  const worldFile = read('src/components/screens/WorldScreen.tsx');
  const prestigeFile = read('src/components/screens/PrestigeScreen.tsx');

  assert.match(worldFile, /title=\{getShellTabLabel\('adventure'\)\}/);
  assert.match(prestigeFile, /title=\{getShellTabLabel\('prestige'\)\}/);
});

test('legacy Sidebar and TabNav surfaces exist but are not mounted by GameLayout', () => {
  const layoutFile = read('src/components/GameLayout.tsx');
  assert.doesNotMatch(layoutFile, /from '\.\/Sidebar\.js'/);
  assert.doesNotMatch(layoutFile, /from '\.\/TabNav\.js'/);
  assert.doesNotMatch(layoutFile, /<Sidebar/);
  assert.doesNotMatch(layoutFile, /<TabNav/);
});

test('ad hoc ribbon wrappers are explicitly documented as deferred and not mass-migrated', () => {
  const docFile = read('docs/ui/phase-2-p2-07-ribbon-dock-convergence.md');
  assert.match(docFile, /ManualPavilionPanel/);
  assert.match(docFile, /TechniqueLibraryScreen/);
  assert.match(docFile, /ApothecaryPanel/);
  assert.match(docFile, /future adoption target/i);
});
