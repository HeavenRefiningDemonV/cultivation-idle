import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRuinsExactMockupFixture, buildRuinsExactSurfaceFromStores } from '../../src/features/world/ruinsExact/buildRuinsExactSurface.js';
import { buildRuinsRouteNodes } from '../../src/features/world/ruinsExact/ruinsExactRouteNodes.js';
import { useRuinsStore } from '../../src/stores/ruinsStore.js';

void test('fixture locks approved ruins exact strings and hierarchy values', () => {
  const fx = createRuinsExactMockupFixture();
  assert.equal(fx.meta.surfaceId, 'ruins-exact-mockup');
  assert.equal(fx.meta.mode, 'fixture');
  assert.equal(fx.meta.targetMockupId, 'ruins-hollow-log-den-approved-apr-30-2026');
  assert.equal(fx.page.title, 'Ruins');
  assert.equal(fx.tacticalStrip.cells.map((c) => c.id).join('|'), 'hp|depth|loadout|aiProfile|healing|bounty|expedition');
  assert.deepEqual(fx.tacticalStrip.cells.map((c) => c.primaryText), ['131 / 131', 'Room 2 / 5 · Lv. 11', 'Loadout 1', 'Balanced', '0 / 20', 'No tracked bounty', '2 Idle']);
  assert.equal(fx.areaHeader.plaqueLabel, 'Hollow Log Den');
  assert.equal(fx.areaHeader.subtitle, 'Targeted local materials and guaranteed anchor rewards');
  assert.deepEqual(fx.areaHeader.chips.map((c) => c.label), ['Targeted Mats', 'Deterministic Support']);
  assert.equal(fx.kitCard.title, 'Ruin Kit');
  assert.equal(fx.kitCard.stamp?.label, 'In Ruin');
  assert.deepEqual(fx.kitCard.statSections.map((section) => section.title), ['Offense', 'Defense']);
  assert.deepEqual(fx.kitCard.statSections[0].rows.map((row) => row.label), ['ATK', 'ACC', 'CRT']);
  assert.deepEqual(fx.kitCard.statSections[0].rows.map((row) => row.value), ['23', '92%', '15%']);
  assert.deepEqual(fx.kitCard.statSections[1].rows.map((row) => row.label), ['HP', 'EVA', 'RES']);
  assert.deepEqual(fx.kitCard.statSections[1].rows.map((row) => row.value), ['131', '10%', '3%']);
  assert.equal(fx.kitCard.medicinePouch.value, '0 / 20');
  assert.equal(fx.kitCard.equipmentGrid.length, 6);
  assert.equal(fx.targetedMaterialsCard.title, 'Targeted Materials');
  assert.deepEqual(fx.targetedMaterialsCard.leadMaterials.map((m) => m.label), ['Spirit Leaf', 'Beast Materials']);
  assert.deepEqual(fx.targetedMaterialsCard.leadMaterials[1]?.itemIds, ['mat_beast_bone', 'mat_beast_blood']);
  assert.equal(fx.targetedMaterialsCard.guaranteedAnchor.label, 'Core Fragment x1');
  assert.equal(fx.targetedMaterialsCard.rarePity.valueText, '1 / 6');
  assert.equal(fx.targetedMaterialsCard.autoRepeat.valueText, 'Off');
  assert.equal(fx.targetedMaterialsCard.footer, 'Best used for targeted local materials, not gold.');
  assert.equal(fx.roomRoute.chip, 'Anchor Chest in 3');
  assert.equal(fx.primaryAction.label, 'Continue Exploration');
});

void test('live surface remains content-driven for anchor/pity/auto-repeat/route', () => {
  useRuinsStore.getState().hardResetRuins();
  const idle = buildRuinsExactSurfaceFromStores('city_pinewind_hamlet');
  assert.equal(['enter-ruins', 'disabled'].includes(idle.primaryAction.intent), true);
  if (idle.meta.activityMode === 'idle') {
    assert.equal(idle.primaryAction.label, 'Enter Ruins');
    assert.equal(idle.kitCard.stamp, null);
    assert.equal(idle.explorationSummary.rows.find((r) => r.id === 'rooms')?.value.startsWith('0 /'), true);
    assert.deepEqual(idle.kitCard.statSections.map((section) => section.title), ['Offense', 'Defense']);
  }

  useRuinsStore.setState((s) => ({ ...s, autoRepeatDefault: true, activeRun: { runId: 't', ruinId: 'ruin_hollow_log_den', cityId: 'city_pinewind_hamlet', roomIndex: 1, roomCount: 5, startedAt: Date.now(), lastTransitionAt: Date.now(), autoRepeat: true, goldEarned: 0, stopping: false }, progressByRuinId: { ...s.progressByRuinId, ruin_hollow_log_den: { totalRuns: 0, totalRoomsCleared: 0, bossKills: 0, bossChestRareFailures: 3 } } }));
  const live = buildRuinsExactSurfaceFromStores('city_pinewind_hamlet');
  assert.equal(['active', 'unavailable'].includes(live.meta.activityMode), true);
  if (live.meta.activityMode === 'active') {
    assert.equal(live.primaryAction.intent, 'continue-exploration');
    assert.equal(live.primaryAction.label, 'Continue Exploration');
    assert.equal(live.roomRoute.currentNodeId, 'spirit-nest');
    assert.equal(live.roomRoute.chip, 'Anchor Chest in 3');
    assert.equal(live.kitCard.stamp?.label, 'In Ruin');
  }
  assert.equal(live.targetedMaterialsCard.autoRepeat.valueText, 'On');
  assert.equal(live.targetedMaterialsCard.guaranteedAnchor.itemId, 'mat_core_fragment');
  assert.equal(live.targetedMaterialsCard.guaranteedAnchor.label, 'Core Fragment x1');
  assert.equal(live.targetedMaterialsCard.rarePity.valueText.includes('/'), true);
});

void test('route mapping and quarantine/deferred art contracts stay locked', () => {
  assert.deepEqual(buildRuinsRouteNodes('ruin_hollow_log_den', 0).map((n) => n.state), ['current', 'future', 'future', 'future', 'future']);
  assert.deepEqual(buildRuinsRouteNodes('ruin_hollow_log_den', 1).map((n) => n.state), ['completed', 'current', 'future', 'future', 'future']);
  assert.deepEqual(buildRuinsRouteNodes('ruin_hollow_log_den', 4).map((n) => n.state), ['completed', 'completed', 'completed', 'completed', 'current']);
  assert.equal(buildRuinsRouteNodes('ruin_hollow_log_den', 4).at(-1)?.isAnchor, true);

  const fx = createRuinsExactMockupFixture();
  assert.equal(fx.scenicStage.artStatus, 'deferred');
  assert.equal(fx.scenicStage.useApprovedMockupPlate, false);
  assert.equal(fx.scenicStage.requiresFinalArtBinding, true);
  assert.equal(fx.scenicStage.reservedApprovedSourcePath.includes('ruins-hollow-log-den-approved-exact.png'), true);

  const src = readFileSync(new URL('../../src/features/world/ruinsExact/RuinsExactMockupScreen.ts', import.meta.url), 'utf8');
  for (const forbidden of ['RuinsSummaryCard', 'RuinsProgress', 'RuinsCtaZone', 'CombatModuleTopLane', 'InkCombatShell', 'combatPathModule', 'ruinsPanel__']) assert.equal(src.includes(forbidden), false);
});
