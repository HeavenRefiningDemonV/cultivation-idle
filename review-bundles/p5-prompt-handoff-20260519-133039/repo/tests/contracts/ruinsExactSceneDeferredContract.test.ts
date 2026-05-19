import assert from 'node:assert/strict';
import test from 'node:test';
import { createRuinsExactMockupFixture } from '../../src/features/world/ruinsExact/buildRuinsExactSurface.js';
import { RUINS_EXACT_SCENIC_ART_CONTRACT } from '../../src/features/world/ruinsExact/ruinsExactAssetRegistry.js';

test('ruins fixture scenic stage uses deferred final-art contract', () => {
  const surface = createRuinsExactMockupFixture();
  const scenic = surface.scenicStage;
  assert.equal(scenic.artStatus, 'deferred');
  assert.equal(scenic.assetKind, 'deferred-hollow-log-den');
  assert.equal(scenic.approvedScenePlateSrc, null);
  assert.equal(scenic.activeScenePlateSrc, null);
  assert.equal(scenic.useApprovedMockupPlate, false);
  assert.equal(scenic.requiresFinalArtBinding, true);
  assert.equal(scenic.reservedApprovedSourcePath, 'docs/release/qa/ui-cutover/ruins-exact/approved-mockup/ruins-hollow-log-den-approved-exact.png');
  assert.equal(scenic.reservedApprovedPlatePath, 'src/assets/world/ruins/hollow-log-den-scene-approved-plate.png');
  assert.deepEqual(scenic.crop, { sourceWidth: 2048, sourceHeight: 1152, x: 362, y: 270, width: 1315, height: 595 });
  assert.deepEqual(scenic.visualFlags, { hasLargeDuelOverlay: false, hasCombatHpBars: false, hasSceneTitleOverlay: false, usesOldCombatPathScene: false, usesCityRuinsSubstitute: false, usesInsideDungeonSubstitute: false, usesCssAsFinalArt: false });
});

test('ruins scenic contract registry remains metadata-only and points to reserved paths', () => {
  assert.equal(RUINS_EXACT_SCENIC_ART_CONTRACT.hollowLogDen.status, 'deferred');
  assert.equal(RUINS_EXACT_SCENIC_ART_CONTRACT.hollowLogDen.reservedApprovedSourcePath.includes('ruins-hollow-log-den-approved-exact.png'), true);
  assert.equal(RUINS_EXACT_SCENIC_ART_CONTRACT.hollowLogDen.reservedApprovedPlatePath.includes('hollow-log-den-scene-approved-plate.png'), true);
});
