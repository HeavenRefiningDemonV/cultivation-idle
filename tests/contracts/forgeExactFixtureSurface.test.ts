import assert from 'node:assert/strict';
import test from 'node:test';

import { createForgeExactMockupFixture } from '../../src/features/professions/forgeExact/buildForgeExactSurface.js';

test('forge exact fixture locks the mockup truth strip, rails, inspector, ctas, and shell flags', () => {
  const surface = createForgeExactMockupFixture();

  assert.equal(surface.meta.mode, 'fixture');
  assert.equal(surface.meta.rootTestId, 'forge-exact-page');
  assert.deepEqual(surface.topTruthStrip.map((cell) => [cell.label, cell.value]), [
    ['Next Test', 'Foundation Gate'],
    ['Readiness', '74 / 100'],
    ['Weapon Floor', '+2 / +3'],
    ['Accessory Floor', '+1 / +2'],
    ['Temper', '0 / 1'],
    ['Rune Target', 'None'],
    ['Queue', 'Idle'],
  ]);

  assert.equal(surface.centerHeader.title, 'Pinewind Forge');
  assert.deepEqual(surface.centerHeader.chips.map((chip) => chip.label), [
    'Refine Selected',
    'Assisted Recommended',
    'Gate Floor Check',
  ]);

  assert.deepEqual(surface.leftRail.tabs.map((tab) => [tab.label, tab.selected]), [
    ['Refine', true],
    ['Temper', false],
    ['Runes', false],
  ]);
  assert.deepEqual(surface.leftRail.modes.map((mode) => [mode.label, mode.selected, mode.enabled, mode.badge ?? mode.note ?? '']), [
    ['Idle', false, true, ''],
    ['Assisted', true, true, 'Recommended'],
    ['Hands-on', false, false, 'Temper only'],
  ]);
  assert.deepEqual(surface.leftRail.tools.map((tool) => [tool.label, tool.value]), [
    ['Hammer', 'Tier I'],
    ['Quench Basin', 'Tier I'],
    ['Rune Plate', 'Locked'],
  ]);

  assert.equal(surface.centerStage.workpieceLabel, 'Pinewind Iron Sword +2');
  assert.equal(surface.centerStage.readinessSeal.kicker, 'BELOW');
  assert.equal(surface.centerStage.readinessSeal.title, 'GATE FLOOR');
  assert.equal(surface.centerStage.readinessSeal.stat, 'Weapon +2 / +3');

  assert.deepEqual(surface.rightInspector.materialRows.map((row) => [row.label, row.valueLabel]), [
    ['Spirit Iron Ore', '8 / 8'],
    ['Charcoal Resin', '4 / 4'],
    ['Jade Sand', '2 / 2'],
    ['Gold', '650 / 500'],
  ]);
  assert.deepEqual(surface.rightInspector.outputPreview.rows.map((row) => [row.label, row.before, row.after]), [
    ['ATK', '49', '56'],
    ['Gate Weapon Floor', 'Missing', 'Met'],
    ['Stability', '', 'Safe'],
  ]);
  assert.deepEqual(surface.rightInspector.bestSources.buttons.map((button) => button.label), ['Outskirts', 'Ruins', 'Expeditions']);
  assert.equal(surface.rightInspector.recommendation.headline, 'Recommended now: Assisted Refine');
  assert.equal(surface.rightInspector.recommendation.reason, 'Reason: Foundation Gate weapon floor');

  assert.deepEqual(surface.floorRail.nodes.map((node) => [node.label, node.value]), [
    ['Weapon', '+2 -> +3'],
    ['Accessory', '+1 -> +2'],
    ['Temper', '0 -> 1'],
    ['Rune Target', 'None'],
    ['Foundation Gate', 'Target'],
  ]);
  assert.equal(surface.primaryAction.label, 'Start Assisted Refine');
  assert.equal(surface.secondaryActions[0]?.label, 'Start Idle Refine');
  assert.equal(surface.shell.bottomNavVisible, false);

  assert.deepEqual(surface.shell, {
    useScreenOwnedExactPage: true,
    showLegacyForgeWorkshop: false,
    singleDominantCta: true,
    bottomNavVisible: false,
    assetWarnings: surface.shell.assetWarnings,
  });
  assert.equal(surface.shell.assetWarnings.length, 4);
});
