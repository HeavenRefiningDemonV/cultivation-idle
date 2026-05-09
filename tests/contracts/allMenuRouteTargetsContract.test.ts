import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolveWorldModalEntrySurface } from '../../src/systems/ui/world/worldBuildingModalEntrySurface.js';
import { formatPrice } from '../../src/stores/contentStore.js';

void test('Gate Trial live world route uses exact screen-owned shell by default and by live intent', () => {
  for (const intent of [null, { gateTrialExactMode: 'live' } as const]) {
    const surface = resolveWorldModalEntrySurface({
      buildingKey: 'gateTrial',
      cityName: 'Pinewind Hamlet',
      intent,
      isStoreMode: true,
    });

    assert.equal(surface.backgroundVariant, 'gate-trial-exact');
    assert.equal(surface.shellFamily, 'gate-trial-scenic');
    assert.equal(surface.shellMode, 'screen-owned');
    assert.equal(surface.showContextStrip, false);
    assert.equal(surface.showShellClose, false);
  }
});

void test('Gate Trial fixture route stays explicit and preview-only', () => {
  const modalSource = readFileSync('src/components/modals/WorldBuildingModal.tsx', 'utf8');
  const ownerSource = readFileSync('src/features/world/gateTrialExact/GateTrialScreenOwner.tsx', 'utf8');

  assert.match(modalSource, /gateTrialExactMode === 'fixture'[\s\S]*forceFixture/);
  assert.match(modalSource, /forceFixture=\{storeModalIntent\?\.gateTrialExactMode === 'fixture'\}/);
  assert.match(ownerSource, /const screenActions = surface\.meta\.mode === 'live' \? actions : \{\}/);
});

void test('openWorldModule does not silently open Gate Trial fixture mode for the live world path', () => {
  const source = readFileSync('src/systems/world/openWorldModule.ts', 'utf8');

  assert.equal(source.includes("gateTrialExactMode: 'fixture'"), false);
  assert.match(source, /normalizedModuleKey === 'gateTrial' && intent === undefined[\s\S]*gateTrialExactMode: 'live'/);
});

void test('Ruins tactical Bounty and Expedition cells route through live world modules, not invalid app tabs', () => {
  const source = readFileSync('src/features/world/ruinsExact/useRuinsExactActionController.ts', 'utf8');

  assert.equal(source.includes("setActiveTab('bounties')"), false);
  assert.equal(source.includes("setActiveTab('expeditions')"), false);
  assert.match(source, /cellId === 'bounty'[\s\S]*openModal\(\{ cityId, buildingKey: 'bounties'/);
  assert.match(source, /cellId === 'expedition'[\s\S]*openModal\(\{ cityId, buildingKey: 'expeditions'/);
});

void test('fresh bootstrap cannot autosave the starter pack before save-load detection', () => {
  const source = readFileSync('src/systems/gameLoop.ts', 'utf8');
  const saveExistsIndex = source.indexOf('const saveExists = SaveService.hasSave();');
  const subscriptionIndex = source.indexOf('SaveService.initializeSubscriptions();');
  const starterPackIndex = source.indexOf("'Game start: starter pack'");

  assert.ok(saveExistsIndex > 0, 'save existence check should remain explicit');
  assert.ok(starterPackIndex > saveExistsIndex, 'starter pack grant should happen only after no-save branch is known');
  assert.ok(subscriptionIndex > starterPackIndex, 'save subscriptions should be wired after fresh bootstrap grants');
});

void test('shared price formatter is safe for optional content prices', () => {
  assert.equal(formatPrice(undefined), '');
  assert.equal(formatPrice(null), '');
  assert.equal(formatPrice({ gold: '10', merit: '2' }), '10 Gold / 2 Merit');
});

void test('shared modal primitive closes on Escape even after focus leaves the dialog subtree', () => {
  const source = readFileSync('src/ui/primitives/Modal.tsx', 'utf8');

  assert.match(source, /document\.addEventListener\('keydown', handleDocumentKeyDown\)/);
  assert.match(source, /document\.removeEventListener\('keydown', handleDocumentKeyDown\)/);
  assert.match(source, /event\.key === 'Escape'[\s\S]*onClose\(\)/);
});
