import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolveWorldModalEntrySurface } from '../../src/systems/ui/world/worldBuildingModalEntrySurface.js';

void test('Gate Trial default world modal resolver uses live exact scenic host', () => {
  const surface = resolveWorldModalEntrySurface({
    buildingKey: 'gateTrial',
    cityName: 'Pinewind Hamlet',
    intent: null,
    isStoreMode: true,
  });

  assert.equal(surface.backgroundVariant, 'gate-trial-exact');
  assert.equal(surface.shellFamily, 'gate-trial-scenic');
  assert.equal(surface.shellMode, 'screen-owned');
  assert.equal(surface.showContextStrip, false);
  assert.equal(surface.showShellClose, false);
});

void test('Gate Trial exact fixture intent resolves to screen-owned scenic host', () => {
  const surface = resolveWorldModalEntrySurface({
    buildingKey: 'gateTrial',
    cityName: 'Pinewind Hamlet',
    intent: { gateTrialExactMode: 'fixture' },
    isStoreMode: true,
  });

  assert.equal(surface.backgroundVariant, 'gate-trial-exact');
  assert.equal(surface.shellFamily, 'gate-trial-scenic');
  assert.equal(surface.shellMode, 'screen-owned');
  assert.equal(surface.showContextStrip, false);
  assert.equal(surface.showShellClose, false);
});

void test('Gate Trial live exact intent resolves to screen-owned scenic host', () => {
  const surface = resolveWorldModalEntrySurface({
    buildingKey: 'gateTrial',
    cityName: 'Pinewind Hamlet',
    intent: { gateTrialExactMode: 'live' },
    isStoreMode: true,
  });

  assert.equal(surface.backgroundVariant, 'gate-trial-exact');
  assert.equal(surface.shellFamily, 'gate-trial-scenic');
  assert.equal(surface.shellMode, 'screen-owned');
});

void test('Gate Trial exact intent is part of the modal dedupe key', () => {
  const uiStoreSource = readFileSync('src/stores/uiStore.ts', 'utf8');

  assert.equal(uiStoreSource.includes("gateTrialExactMode?: 'live' | 'fixture'"), true);
  assert.equal(uiStoreSource.includes('gateTrialExactMode: intent?.gateTrialExactMode ?? null'), true);
  assert.equal(uiStoreSource.includes('ruinsExactMode: intent?.ruinsExactMode ?? null'), true);
  assert.equal(uiStoreSource.includes('apothecarySurface: intent?.apothecarySurface ?? null'), true);
});

void test('WorldBuildingModal mounts Gate Trial exact owner and keeps fixture mode explicit', () => {
  const modalSource = readFileSync('src/components/modals/WorldBuildingModal.tsx', 'utf8');

  assert.equal(modalSource.includes("import { GateTrialScreenOwner } from '../../features/world/gateTrialExact/index.js';"), true);
  assert.equal(modalSource.includes("storeModalIntent?.gateTrialExactMode === 'fixture'"), true);
  assert.match(modalSource, /case 'gateTrial':[\s\S]*<GateTrialScreenOwner[\s\S]*cityId=\{storeCityId\}[\s\S]*trialId=\{moduleRefId \?\? null\}[\s\S]*forceFixture=\{storeModalIntent\?\.gateTrialExactMode === 'fixture'\}/);

  for (const forbidden of [
    'startCombatFromPreview',
    "openCombatPreview({ type: 'trial'",
    'RewardService',
    'getTrialLifecycleSnapshot',
    'getTrialGateRewardBundle',
  ]) {
    assert.equal(modalSource.includes(forbidden), false, `WorldBuildingModal must not own ${forbidden}`);
  }
});

void test('Gate Trial exact modal host has full-screen screen-owned class family', () => {
  const scss = readFileSync('src/components/modals/WorldBuildingModal.scss', 'utf8');

  for (const required of [
    '.worldBuildingOverlay--gate-trial-scenic',
    '.worldBuildingModal--gate-trial-exact',
    '.worldBuildingModal--gate-trial-scenic::after',
    '.worldBuildingModal--gate-trial-exact.worldBuildingModal--screen-owned',
    '.worldBuildingBody--gate-trial-exact',
    '.worldBuildingBody--gate-trial-scenic',
    '.worldBuildingBody--screen-owned',
  ]) {
    assert.equal(scss.includes(required), true, `missing ${required}`);
  }

  assert.match(scss, /\.worldBuildingOverlay--gate-trial-scenic\s*\{[\s\S]*backdrop-filter:\s*none;[\s\S]*align-items:\s*stretch;[\s\S]*justify-content:\s*stretch;[\s\S]*padding:\s*0;/);
  assert.match(scss, /\.worldBuildingModal--gate-trial-exact\s*\{[\s\S]*width:\s*100%;[\s\S]*height:\s*100%;[\s\S]*max-width:\s*none;[\s\S]*max-height:\s*none;[\s\S]*border-radius:\s*0;[\s\S]*box-shadow:\s*none;/);
  assert.match(scss, /\.worldBuildingModal--gate-trial-exact\.worldBuildingModal--screen-owned\s*\{[\s\S]*border-radius:\s*0;[\s\S]*box-shadow:\s*none;/);
  assert.match(scss, /\.worldBuildingBody--outskirts-exact,[\s\S]*\.worldBuildingBody--ruins-exact,[\s\S]*\.worldBuildingBody--gate-trial-exact,[\s\S]*\.worldBuildingBody--gate-trial-scenic,[\s\S]*\.worldBuildingBody--screen-owned\s*\{[\s\S]*height:\s*100%;[\s\S]*min-height:\s*0;[\s\S]*overflow:\s*hidden;/);

  assert.match(scss, /\.worldBuildingModal\s*\{[\s\S]*width:\s*80rem;[\s\S]*height:\s*45rem;/, 'base modal sizing must remain for non-screen-owned modules');
});

void test('Gate Trial exact host keeps distinct modal semantics', () => {
  const surfaceSource = readFileSync('src/systems/ui/world/worldBuildingModalEntrySurface.ts', 'utf8');
  const scss = readFileSync('src/components/modals/WorldBuildingModal.scss', 'utf8');

  assert.equal(surfaceSource.includes("'gate-trial-exact'"), true);
  assert.equal(surfaceSource.includes("'gate-trial-scenic'"), true);
  assert.match(surfaceSource, /case 'gateTrial':[\s\S]*backgroundVariant\s*=\s*'gate-trial-exact';[\s\S]*shellFamily\s*=\s*'gate-trial-scenic';[\s\S]*shellMode\s*=\s*'screen-owned';/);
  assert.match(surfaceSource, /case 'outskirts':[\s\S]*backgroundVariant\s*=\s*'outskirts-exact';[\s\S]*shellFamily\s*=\s*'outskirts-scenic';[\s\S]*shellMode\s*=\s*'screen-owned';/);
  assert.match(surfaceSource, /case 'ruins':[\s\S]*backgroundVariant\s*=\s*'ruins-exact';[\s\S]*shellFamily\s*=\s*'ruins-scenic';[\s\S]*shellMode\s*=\s*'screen-owned';/);

  const gateTrialOverlayBlock = scss.match(/\.worldBuildingOverlay--gate-trial-scenic\s*\{[\s\S]*?\}/)?.[0] ?? '';
  const gateTrialModalBlock = scss.match(/\.worldBuildingModal--gate-trial-exact\s*\{[\s\S]*?\}/)?.[0] ?? '';

  for (const block of [gateTrialOverlayBlock, gateTrialModalBlock]) {
    for (const forbidden of ['InsideDungeon.png', 'city_ruins.png', 'city_outskirts.png']) {
      assert.equal(block.includes(forbidden), false, `Gate Trial exact host must not borrow ${forbidden}`);
    }
  }
});
