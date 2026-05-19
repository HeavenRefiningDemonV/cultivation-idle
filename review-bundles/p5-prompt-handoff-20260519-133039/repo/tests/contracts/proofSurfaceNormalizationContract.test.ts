import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

void test('primary proof surfaces remain explicit and frozen to the P2-13 set', () => {
  const matrix = read('docs/ui/phase-2-proof-surface-matrix.md');
  const requiredPrimary = [
    'world',
    'cultivation',
    'status',
    'prestige',
    'prestige-ritual',
    'current-chapter-exhausted',
    'life-summary',
    'change-heart-law',
    'bottom-tab-bar',
  ];

  requiredPrimary.forEach((surfaceId) => {
    assert.match(matrix, new RegExp(`\\| ${surfaceId} \\|`));
  });

  const primaryTagCount = (matrix.match(/\| Primary proof surface \|/g) ?? []).length;
  assert.equal(primaryTagCount, requiredPrimary.length);
});

void test('world, cultivate, status, prestige remain legally wired to frozen shell/fx truth', () => {
  const world = read('src/components/screens/WorldScreen.tsx');
  const cultivate = read('src/features/cultivation/exact/CultivationExactScreenOwner.tsx');
  const cultivateScreen = read('src/features/cultivation/exact/CultivationExactScreen.tsx');
  const status = read('src/components/screens/StatusScreen.tsx');
  const prestige = read('src/components/screens/PrestigeScreen.tsx');
  const prestigeOwner = read('src/features/prestige/prestigeLedgerExact/PrestigeLedgerScreenOwner.tsx');

  assert.match(world, /<WorldOverlayRibbon/);
  assert.match(world, /<WorldOverlayInspector/);
  assert.match(world, /<InspectorDrawer/);
  assert.match(world, /buildWorldModuleRoutingSurface/);
  assert.match(world, /CityMapHub/);

  assert.match(cultivate, /<ScreenFxStage/);
  assert.match(cultivate, /<FxStagePortal/);
  assert.match(cultivateScreen, /data-region="left-milestone-seals"/);
  assert.match(cultivateScreen, /data-region="right-doctrine-rail"/);

  assert.match(status, /<ScreenFxStage/);
  assert.match(status, /<FxStagePortal/);
  assert.match(status, /<RunCompass/);
  assert.match(status, /<StatusSummaryHeader/);

  assert.match(prestige, /<PrestigeLedgerScreenOwner/);
  assert.match(prestigeOwner, /PrestigeLedgerExactScreen/);
  assert.match(prestigeOwner, /<PrestigeRitualModal/);
});

void test('ritual proof surfaces and dock wrapper remain on frozen contracts', () => {
  const prestigeRitual = read('src/components/modals/PrestigeRitualModal.tsx');
  const chapterExhausted = read('src/components/modals/CurrentChapterExhaustedModal.tsx');
  const lifeSummary = read('src/components/modals/LifeSummaryModal.tsx');
  const changeHeartLaw = read('src/ui/cultivation/heartLaw/ChangeHeartLawModal.tsx');
  const bottomTabBar = read('src/components/BottomTabBar.tsx');

  assert.match(prestigeRitual, /<RitualModalFrame/);
  assert.match(chapterExhausted, /<RitualModalFrame/);
  assert.match(lifeSummary, /<RitualModalFrame/);
  assert.match(changeHeartLaw, /<RitualModalFrame/);

  assert.match(bottomTabBar, /<BottomNavDock/);
  assert.match(bottomTabBar, /BOTTOM_TAB_BAR_ORDER/);
  assert.match(bottomTabBar, /getShellTabLabel/);
});
