import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { resolveWorldModalEntrySurface } from '../../src/systems/ui/world/worldBuildingModalEntrySurface.js';

void test('Apothecary Exact modal resolver uses a screen-owned scenic shell for Apothecary and Alchemy', () => {
  for (const buildingKey of ['apothecary', 'alchemy'] as const) {
    const surface = resolveWorldModalEntrySurface({
      buildingKey,
      cityName: 'Pinewind Hamlet',
      intent: null,
      isStoreMode: true,
    });

    assert.equal(surface.backgroundVariant, 'apothecary-exact');
    assert.equal(surface.shellFamily, 'apothecary-scenic');
    assert.equal(surface.shellMode, 'screen-owned');
    assert.equal(surface.showContextStrip, false);
    assert.equal(surface.showShellClose, false);
  }
});

void test('Apothecary Exact intent participates in world modal dedupe keys', () => {
  const uiStoreSource = readFileSync('src/stores/uiStore.ts', 'utf8');

  assert.equal(uiStoreSource.includes("apothecaryExactMode?: 'live' | 'fixture'"), true);
  assert.equal(uiStoreSource.includes("apothecaryFocus?: 'prescription' | 'buy' | 'brew' | 'pouch' | 'source'"), true);
  assert.equal(uiStoreSource.includes('apothecaryExactMode: intent?.apothecaryExactMode ?? null'), true);
  assert.equal(uiStoreSource.includes('apothecaryFocus: intent?.apothecaryFocus ?? null'), true);
});

void test('WorldBuildingModal routes Apothecary and Alchemy to the exact owner without a separate Alchemy room', () => {
  const modalSource = readFileSync('src/components/modals/WorldBuildingModal.tsx', 'utf8');

  assert.equal(modalSource.includes("import { ApothecaryExactScreenOwner } from '../../features/apothecary/exact/index.js';"), true);
  assert.match(modalSource, /case 'apothecary':[\s\S]*<ApothecaryExactScreenOwner[\s\S]*forceFixture=\{storeModalIntent\?\.apothecaryExactMode === 'fixture'\}[\s\S]*focus=\{storeModalIntent\?\.apothecaryFocus \?\? storeModalIntent\?\.apothecarySurface \?\? 'prescription'\}/);
  assert.match(modalSource, /case 'alchemy':[\s\S]*<ApothecaryExactScreenOwner[\s\S]*focus="brew"/);
  assert.equal(modalSource.includes("initialSurface=\"brew\""), false);
});

void test('Apothecary Exact modal host has full-screen exact-only classes without changing base modal sizing', () => {
  const scss = readFileSync('src/components/modals/WorldBuildingModal.scss', 'utf8');

  for (const required of [
    '.worldBuildingOverlay--apothecary-scenic',
    '.worldBuildingModal--apothecary-exact',
    '.worldBuildingModal--apothecary-scenic::after',
    '.worldBuildingModal--apothecary-exact.worldBuildingModal--screen-owned',
    '.worldBuildingBody--apothecary-exact',
    '.worldBuildingBody--apothecary-scenic',
    '.worldBuildingBody--screen-owned',
  ]) {
    assert.equal(scss.includes(required), true, `missing ${required}`);
  }

  assert.match(scss, /\.worldBuildingOverlay--apothecary-scenic\s*\{[\s\S]*backdrop-filter:\s*none;[\s\S]*align-items:\s*stretch;[\s\S]*justify-content:\s*stretch;[\s\S]*padding:\s*0;/);
  assert.match(scss, /\.worldBuildingModal--apothecary-exact\s*\{[\s\S]*width:\s*100%;[\s\S]*height:\s*100%;[\s\S]*max-width:\s*none;[\s\S]*max-height:\s*none;[\s\S]*border-radius:\s*0;[\s\S]*box-shadow:\s*none;/);
  assert.match(scss, /\.worldBuildingModal\s*\{[\s\S]*width:\s*80rem;[\s\S]*height:\s*45rem;/, 'base modal sizing must remain for non-exact modules');
});
