import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { CHROME_UI_ASSET_MANIFEST } from '../../src/assets/ui/chrome/chromeManifest.js';
import { FX_UI_ASSET_MANIFEST } from '../../src/assets/ui/fx/fxManifest.js';
import { HERO_UI_ASSET_MANIFEST } from '../../src/assets/ui/heroes/heroManifest.js';
import { OVERLAY_UI_ASSET_MANIFEST } from '../../src/assets/ui/overlays/overlayManifest.js';
import { ALL_UI_ASSET_SPECS } from '../../src/assets/ui/registry.js';

const root = process.cwd();

const requiredManifestFiles = [
  'src/assets/ui/chrome/chromeManifest.ts',
  'src/assets/ui/fx/fxManifest.ts',
  'src/assets/ui/overlays/overlayManifest.ts',
  'src/assets/ui/heroes/heroManifest.ts',
];

const requiredPlannedIds = [
  'ui.chrome.frameCardThin9',
  'ui.chrome.frameCardMedium9',
  'ui.chrome.frameCardHeavy9',
  'ui.chrome.frameButton9',
  'ui.chrome.frameTooltip9',
  'ui.chrome.frameModalScroll9',
  'ui.chrome.plaqueHeaderSmall',
  'ui.chrome.plaqueHeaderLarge',
  'ui.chrome.plaqueInspector',
  'ui.chrome.plaqueWorldLabel',
  'ui.chrome.ribbonBreadcrumbLong',
  'ui.chrome.ribbonSectionShort',
  'ui.chrome.stampRecommendation',
  'ui.chrome.stampWarning',
  'ui.fx.mistWispSoft01',
  'ui.fx.mistWispSoft02',
  'ui.fx.dustMoteSoft01',
  'ui.fx.dustMoteSoft02',
  'ui.fx.haloSoft01',
  'ui.fx.haloRing01',
  'ui.fx.sparkGlint01',
  'ui.fx.sparkEmber01',
  'ui.fx.fireflySoft01',
  'ui.fx.lightStreakSoft01',
  'ui.fx.brushSwashRecommendation01',
  'ui.fx.brushSwashSelection01',
  'ui.overlay.paperGrainSoft',
  'ui.overlay.paperGrainHeavy',
  'ui.overlay.fogEdgeSoft',
  'ui.overlay.vignetteSoft',
  'ui.overlay.tornEdgeMaskSoft',
  'ui.overlay.parchmentWashRadial',
  'ui.hero.cultivation.altarBase',
  'ui.hero.cultivation.orbCore',
  'ui.hero.cultivation.orbRingOuter',
  'ui.hero.cultivation.orbRingInner',
  'ui.hero.cultivation.auraWisp01',
  'ui.hero.cultivation.auraWisp02',
  'ui.hero.cultivation.pedestalShadow',
  'ui.hero.heartlaw.sealPedestal',
  'ui.hero.heartlaw.sealRing',
  'ui.hero.heartlaw.glyphHaloSoft',
  'ui.hero.heartlaw.sealPulseMask',
];

void test('ui asset manifest contract: required manifest files and planned ids exist', () => {
  requiredManifestFiles.forEach((relativePath) => {
    assert.equal(fs.existsSync(path.join(root, relativePath)), true, `${relativePath} should exist`);
  });

  const allIds = new Set(ALL_UI_ASSET_SPECS.map((spec) => spec.id));
  requiredPlannedIds.forEach((id) => assert.equal(allIds.has(id), true, `${id} should exist`));
});

void test('ui asset manifest contract: ids are unique and family/status values remain valid', () => {
  const ids = ALL_UI_ASSET_SPECS.map((spec) => spec.id);
  assert.equal(new Set(ids).size, ids.length, 'all ids must be unique');

  const validFamilies = new Set(['chrome', 'fx', 'overlay', 'hero']);
  const validStatuses = new Set(['existing-reused', 'planned-missing', 'planned-optional']);

  ALL_UI_ASSET_SPECS.forEach((spec) => {
    assert.equal(validFamilies.has(spec.family), true, `${spec.id} has invalid family`);
    assert.equal(validStatuses.has(spec.status), true, `${spec.id} has invalid status`);
    assert.equal(spec.expectedPath.trim().length > 0, true, `${spec.id} should have expectedPath`);
  });
});

void test('ui asset manifest contract: planned entries are textless and source-path policy is correct', () => {
  ALL_UI_ASSET_SPECS.forEach((spec) => {
    if (spec.status === 'planned-missing' || spec.status === 'planned-optional') {
      assert.equal(spec.textless, true, `${spec.id} planned entries should be textless`);
      assert.equal(Boolean(spec.sourcePath), false, `${spec.id} planned entries should not have sourcePath`);
    }
    if (spec.status === 'existing-reused') {
      assert.equal(Boolean(spec.sourcePath), true, `${spec.id} reused entries must include sourcePath`);
    }
  });
});

void test('ui asset manifest contract: chrome frame entries are nine-slice and hero kits are layered', () => {
  CHROME_UI_ASSET_MANIFEST.assets
    .filter((asset) => asset.subfamily === 'frame')
    .forEach((asset) => assert.equal(asset.nineSliceCandidate, true, `${asset.id} should be nine-slice candidate`));

  HERO_UI_ASSET_MANIFEST.assets
    .filter((asset) => asset.status === 'planned-missing')
    .forEach((asset) => {
      assert.equal(asset.layeredKit, true, `${asset.id} should be layered for hero kits`);
    });

  const familyChecks = [
    CHROME_UI_ASSET_MANIFEST.family,
    FX_UI_ASSET_MANIFEST.family,
    OVERLAY_UI_ASSET_MANIFEST.family,
    HERO_UI_ASSET_MANIFEST.family,
  ];
  assert.deepEqual(familyChecks, ['chrome', 'fx', 'overlay', 'hero']);
});
