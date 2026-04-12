import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('world inspector uses persisted per-city focus before default module fallback', () => {
  const worldScreen = read('src/components/screens/WorldScreen.tsx');

  assert.match(worldScreen, /const \[inspectorFocusByCity, setInspectorFocusByCity\] = useState<Record<string, string>>\(\{\}\);/);
  assert.match(worldScreen, /const persistedInspectorModuleKey = selectedCity \? inspectorFocusByCity\[selectedCity\.id\] \?\? null : null;/);
  assert.match(worldScreen, /const inspectorModuleKey = persistedInspectorModuleKey && visibleCityModules\.includes\(persistedInspectorModuleKey\)/);
  assert.match(worldScreen, /const handlePreviewModuleChange = useCallback\(/);
  assert.ok(worldScreen.includes('setInspectorFocusByCity((current) => (current[selectedCity.id] === moduleKey ? current : { ...current, [selectedCity.id]: moduleKey }))'));
});

test('city map hover leave clears only visual preview and does not clear inspector subject', () => {
  const cityMapHub = read('src/components/screens/CityMapHub.tsx');

  assert.match(cityMapHub, /const clearPreviewVisual = \(\) => \{\s*setLayoutBackgroundOverride\(null\);\s*\};/);
  assert.match(cityMapHub, /onMouseLeave=\{clearPreviewVisual\}/);
  assert.match(cityMapHub, /onBlur=\{clearPreviewVisual\}/);
  assert.doesNotMatch(cityMapHub, /onMouseLeave=\{\(\) => .*onPreviewModuleChange\?\.\(null\)/);
});

test('world actionable button chrome restores legacy menu-art treatment', () => {
  const worldScreenScss = read('src/components/screens/WorldScreen.scss');
  const bottomDockScss = read('src/ui/shell/BottomNavDock.scss');

  assert.match(bottomDockScss, /\.bottomNavDock__button[\s\S]*buttoncorners\.png/);
  assert.match(bottomDockScss, /\.bottomNavDock__button[\s\S]*bar_short\.png/);
  assert.match(worldScreenScss, /\.worldScreenRibbonLayer \.worldOverlayRibbon__citySelect[\s\S]*buttoncorners\.png/);
  assert.match(worldScreenScss, /\.worldScreenInspectorLayer \.worldOverlayInspector__openButton[\s\S]*bar_short\.png/);
});

test('world map presentation avoids heavy global wash defaults while preserving atmosphere', () => {
  const gameLayoutScss = read('src/components/GameLayout.scss');
  const cityMapHubScss = read('src/components/screens/CityMapHub.scss');

  assert.match(gameLayoutScss, /\.gameLayoutRoot--world \.gameLayoutTextureOverlay \{\s*opacity: 0\.08;/);
  assert.match(cityMapHubScss, /linear-gradient\(180deg, rgba\(255, 251, 242, 0\.04\), rgba\(20, 16, 12, 0\.09\)\)/);
});

test('world chrome hover/active states keep no-layout-shift safe properties', () => {
  const worldScreenScss = read('src/components/screens/WorldScreen.scss');
  const bottomDockScss = read('src/ui/shell/BottomNavDock.scss');

  const riskyStatePattern = /(:hover|:focus-visible|--active)\s*\{[^}]*\b(width|height|padding|margin|top|left|right|bottom|font-size|min-inline-size|min-block-size)\b/;
  assert.equal(riskyStatePattern.test(worldScreenScss), false);
  assert.equal(riskyStatePattern.test(bottomDockScss), false);
});
