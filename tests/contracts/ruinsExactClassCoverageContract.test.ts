import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

void test('ruins exact class coverage contract includes critical child selectors (not test ids)', () => {
  const scss = readFileSync('src/features/world/ruinsExact/RuinsExactMockupScreen.scss', 'utf8');
  const requiredSelectors = [
    '.ruinsTopRegion__tacticalUnderlineTrack', '.ruinsTopRegion__tacticalUnderlineFill', '.ruinsTopRegion__roleChips', '.ruinsTopRegion__roleChipDot',
    '.ruinsKitCard__pouchValue', '.ruinsKitCard__section', '.ruinsKitCard__section--survival', '.ruinsKitCard__section--pouch', '.ruinsKitCard__section--equipment',
    '.ruinsScenicStage__frame', '.ruinsScenicStage__plate', '.ruinsScenicStage__deferredUnderpaint', '.ruinsScenicStage__mist', '.ruinsScenicStage__mist--lower', '.ruinsScenicStage__mist--upper', '.ruinsScenicStage__edgeFade',
    '.ruinsTargetedMaterialsCard__anchorCopy', '.ruinsTargetedMaterialsCard__anchorIconWrap', '.ruinsTargetedMaterialsCard__helper', '.ruinsTargetedMaterialsCard__footer', '.ruinsTargetedMaterialsCard__seal', '.ruinsTargetedMaterialsCard__tileLabel',
    '.ruinsRoomRouteStrip__text', '.ruinsRoomRouteStrip__currentPointer', '.ruinsRoomRouteStrip__completeMark', '.ruinsRoomRouteStrip__icon', '.ruinsRoomRouteStrip__laneDiamond',
    '.ruinsExplorationSummaryCard__rows', '.ruinsExplorationSummaryCard__row', '.ruinsExplorationSummaryCard__label', '.ruinsExplorationSummaryCard__value',
    '.ruinsPrimaryCta__ornament--left', '.ruinsPrimaryCta__ornament--right',
  ];

  for (const selector of requiredSelectors) {
    assert.equal(scss.includes(selector), true, `missing selector ${selector}`);
  }

  assert.equal(scss.includes('.ruinsExplorationSummaryCard__row { display:grid; grid-template-columns:clamp(20px,1.2vw,24px) minmax(0,1fr) minmax(62px,auto);'), true);
  assert.equal(scss.includes('.ruinsRoomRouteStrip__text { display:grid;'), true);
  assert.equal(scss.includes('.ruinsTargetedMaterialsCard__tileLabel { margin-top:6px;'), true);
  assert.equal(scss.includes('.ruinsTargetedMaterialsCard__anchorCopy { min-width:0; display:grid;'), true);

  for (const forbiddenTestIdAsClass of ['.ruins-exact-page', '.ruins-exact-body-grid', '.ruins-exact-left-rail', '.ruins-exact-center-scenic-slot']) {
    assert.equal(scss.includes(forbiddenTestIdAsClass), false);
  }
});
