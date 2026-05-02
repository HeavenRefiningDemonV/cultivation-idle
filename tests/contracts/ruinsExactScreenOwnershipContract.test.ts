import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

void test('Ruins Exact screen ownership chain keeps full-height containment', async () => {
  const ruinsScss = await fs.readFile('src/features/world/ruinsExact/RuinsExactMockupScreen.scss', 'utf8');
  const modalScss = await fs.readFile('src/components/modals/WorldBuildingModal.scss', 'utf8');
  const entrySurfaceSource = await fs.readFile('src/systems/ui/world/worldBuildingModalEntrySurface.ts', 'utf8');

  assert.match(ruinsScss, /\.ruinsScreenOwner\s*\{[\s\S]*width:\s*100%;[\s\S]*height:\s*100%;[\s\S]*min-height:\s*0;[\s\S]*overflow:\s*hidden;[\s\S]*isolation:\s*isolate;/);
  assert.match(ruinsScss, /\.ruinsExactPage\s*\{[\s\S]*width:\s*100%;[\s\S]*height:\s*100%;[\s\S]*min-height:\s*0;[\s\S]*overflow:\s*hidden;/);

  for (const token of [
    '.worldBuildingOverlay--ruins-scenic',
    '.worldBuildingModal--ruins-exact',
    '.worldBuildingBody--ruins-exact',
    '.worldBuildingBody--ruins-scenic',
    '.worldBuildingBody--screen-owned',
  ]) {
    assert.match(modalScss, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(entrySurfaceSource, /case 'ruins':[\s\S]*backgroundVariant\s*=\s*'ruins-exact';[\s\S]*shellFamily\s*=\s*'ruins-scenic';[\s\S]*shellMode\s*=\s*'screen-owned';[\s\S]*showShellClose\s*=\s*false;/);
});
