import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

void test('Apothecary Exact pure screen source renders every named region from the surface', () => {
  const source = readFileSync('src/features/apothecary/exact/ApothecaryExactScreen.tsx', 'utf8');

  for (const token of [
    'apothecary-exact-plane',
    'apothecary-exact-room-atmosphere',
    'apothecary-exact-header',
    'apothecary-exact-city-chip',
    'apothecary-exact-prep-strip',
    'apothecary-exact-prescription',
    'apothecary-exact-warnings',
    'apothecary-exact-buy-lane',
    'apothecary-exact-brew-lane',
    'apothecary-exact-pouch-card',
    'apothecary-exact-pouch-object',
    'apothecary-exact-bottom-actions',
    'apothecary-exact-primary-cta',
    'apothecary-exact-return-gate',
    'apothecary-exact-attempt-fit',
    'apothecary-exact-shell-flags',
  ]) {
    assert.equal(source.includes(token), true, `missing screen token ${token}`);
  }

  assert.equal(source.includes('data-testid={surface.meta.rootTestId}'), true);

  for (const surfaceRead of [
    'surface.pageHeader.title',
    'surface.pageHeader.purpose',
    'surface.pageHeader.cityStatus',
    'surface.prepStrip.map',
    'surface.prescription.rows.map',
    'surface.warningStrip.map',
    'surface.buyLane.rows.map',
    'surface.brewLane.rows.map',
    'surface.pouchCard.lines.map',
    'surface.bottomActions.map',
    'surface.primaryAction.label',
    'surface.returnAction',
    'surface.attemptFit.lines.map',
  ]) {
    assert.equal(source.includes(surfaceRead), true, `pure screen missing surface read ${surfaceRead}`);
  }
});

void test('Apothecary Exact pure screen source has no store reads, reward calls, or legacy tabs', () => {
  const source = readFileSync('src/features/apothecary/exact/ApothecaryExactScreen.tsx', 'utf8');

  for (const forbidden of [
    'useContentStore',
    'useInventoryStore',
    'useShopStore',
    'useProfessionStore',
    'useMedicinePouchStore',
    'useUIStore',
    'RewardService',
    'ApothecaryPanel',
    'ApothecaryBrewPanel',
    'MedicinePouchModal',
    'RunCompassCompact',
    'createApothecaryExactMockupFixture',
    './ApothecaryExactScreen.scss',
  ]) {
    assert.equal(source.includes(forbidden), false, `pure screen must not reference ${forbidden}`);
  }

  for (const forbiddenVisible of ['primaryTabs', 'setActiveSurface', "label: 'Buy'", "label: 'Brew'", "label: 'Medicine Pouch'"]) {
    assert.equal(source.includes(forbiddenVisible), false, `pure exact screen must not recreate legacy tab logic: ${forbiddenVisible}`);
  }
});

void test('Apothecary Exact pure screen renders only the approved low-opacity room atmosphere raster', () => {
  const source = readFileSync('src/features/apothecary/exact/ApothecaryExactScreen.tsx', 'utf8');

  for (const required of [
    'RoomAtmosphere',
    'apothecaryExactRoomAtmosphere',
    'apothecary-exact-room-atmosphere',
    "'room.scenicPlate'",
    '--apoth-room-plate',
  ]) {
    assert.equal(source.includes(required), true, `screen must include approved atmosphere hook ${required}`);
  }

  for (const forbidden of [
    'frames.prescription',
    'frames.primaryCta',
    'frames.laneDefault',
    'frames.laneReady',
    'frames.laneWarning',
    'frames.laneDisabled',
    'imageStyle',
    'laneFrameKey',
    'backgroundImage',
    'apothecaryExactRoomPlate',
    'apothecaryExactPrescription__frame',
    'apothecaryExactButton--primary img',
  ]) {
    assert.equal(source.includes(forbidden), false, `Apothecary exact screen must not render heavy raster backplate ${forbidden}`);
  }
});

void test('Apothecary Exact SCSS locks the canonical 2048 by 1152 plane and region selectors', () => {
  const scss = readFileSync('src/features/apothecary/exact/ApothecaryExactScreen.scss', 'utf8');

  for (const required of [
    '.apothecaryExactPage',
    '--plane-w: 2048px',
    '--plane-h: 1152px',
    '--apoth-herb-wash',
    '--apoth-herb-line',
    '--apoth-herb-accent',
    '.apothecaryExactPlane',
    '.apothecaryExactPlane::before',
    '.apothecaryExactRoomAtmosphere',
    '.apothecaryExactHeader',
    '.apothecaryExactCityChip',
    '.apothecaryExactPrepStrip',
    '.apothecaryExactPrescription',
    '.apothecaryExactPrescription::before',
    '.apothecaryExactWarnings',
    '.apothecaryExactBuyLane',
    '.apothecaryExactBrewLane',
    '.apothecaryExactPouchCard',
    '.apothecaryExactPouchObject',
    '.apothecaryExactBottomActions',
    '.apothecaryExactPrimaryCta',
    '.apothecaryExactReturnGate',
    '.apothecaryExactAttemptFit',
  ]) {
    assert.equal(scss.includes(required), true, `missing SCSS contract ${required}`);
  }

  assert.match(scss, /\.apothecaryExactRoomAtmosphere\s*\{[\s\S]*opacity:\s*0\.1[0-8];[\s\S]*pointer-events:\s*none;/);
  assert.match(scss, /\.apothecaryExactPrescription\s*\{[\s\S]*left:\s*506px;[\s\S]*top:\s*210px;[\s\S]*width:\s*988px;[\s\S]*height:\s*306px;/);
  assert.match(scss, /\.apothecaryExactPrimaryCta\s*\{[\s\S]*left:\s*720px;[\s\S]*top:\s*992px;[\s\S]*width:\s*520px;[\s\S]*height:\s*86px;/);
  assert.match(scss, /\.apothecaryExactPage\s*\{[\s\S]*overflow:\s*hidden;/);

  for (const forbidden of [
    '.apothecaryExactPrescription__frame',
    '.apothecaryExactButton--primary img',
    'lane_card_',
    'gold_cta_plaque',
    'prescription_parchment_frame',
  ]) {
    assert.equal(scss.includes(forbidden), false, `SCSS must not rely on raster backplate ${forbidden}`);
  }
});
