import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import {
  buildGateTrialExactSurfaceFromStores,
  createGateTrialExactMockupFixture,
} from '../../src/features/world/gateTrialExact/buildGateTrialExactSurface.js';

test('fixture meta and shell ownership are locked', () => {
  const surface = createGateTrialExactMockupFixture();
  assert.equal(surface.meta.surfaceId, 'gate-trial-exact');
  assert.equal(surface.meta.mode, 'fixture');
  assert.equal(surface.meta.source, 'fixture');
  assert.equal(surface.meta.cityId, 'city_pinewind_hamlet');
  assert.equal(surface.meta.trialId, 'trial_novices_clearing');
  assert.equal(surface.meta.activityMode, 'available');
  assert.equal(surface.meta.lifecycleState, 'available');
  assert.equal(surface.meta.resolution, 'none');
  assert.equal(surface.meta.readinessScore, 74);
  assert.equal(surface.meta.rootTestId, 'gate-trial-exact-page');
  assert.equal(surface.shell.useScreenOwnedExactPage, true);
  assert.equal(surface.shell.showLegacyCombatShell, false);
  assert.equal(surface.shell.showGateTrialWorldLayout, false);
  assert.equal(surface.shell.showCombatModuleTopLane, false);
  assert.equal(surface.shell.showGateTrialReadinessCard, false);
  assert.equal(surface.shell.showGateTrialAttemptCluster, false);
  assert.equal(surface.shell.showExternalCombatPreview, false);
  assert.equal(surface.shell.suppressExternalCombatPreview, true);
  assert.equal(surface.shell.singleDominantCta, true);
});

test('top region and tactical strip match the mockup fixture', () => {
  const surface = createGateTrialExactMockupFixture();
  assert.equal(surface.page.title, 'Gate Trial');
  assert.equal(surface.page.titleSeal.visible, true);
  assert.deepEqual(surface.page.topRightStatus, ['2 Expeditions Idle', '1 Tracked Bounty']);
  assert.equal(surface.topRibbon.decorative, true);
  assert.equal(surface.topRibbon.activeNodeId, 'foundation-gate');
  assert.equal(surface.topRibbon.nodes.length, 9);
  assert.equal(surface.tacticalStrip.cells.map((cell) => cell.id).join('|'), 'hp|gate|loadout|aiProfile|healing|bounty|expedition');
  assert.equal(surface.tacticalStrip.cells.map((cell) => cell.primaryText).join('|'), '131 / 131|Foundation · Lv. 15|Loadout 1|Balanced|12 / 20|No tracked bounty|2 Idle');
  assert.equal(surface.tacticalStrip.cells[0].underlineBarPct, 100);
  assert.equal(surface.tacticalStrip.cells[2].showCaret, true);
  assert.equal(surface.tacticalStrip.cells[3].showCaret, true);
  assert.equal(surface.gateHeader.title, 'Foundation Gate');
  assert.equal(surface.gateHeader.subtitle, 'Milestone readiness check — clears the path to Foundation');
  assert.equal(surface.gateHeader.chips.map((chip) => chip.label).join('|'), 'Milestone Gate|Readiness Check|Safety Net Tracked');
});

test('checklist, recommended panel, fail-safe, and top fixes match the mockup fixture', () => {
  const surface = createGateTrialExactMockupFixture();
  assert.equal(surface.minimumChecklist.title, 'Minimum Checklist');
  assert.equal(surface.minimumChecklist.stamp.label, 'Viable');
  assert.equal(surface.minimumChecklist.rows.length, 5);
  assert.equal(surface.minimumChecklist.rows.map((row) => `${row.title}:${row.detail}:${row.status}`).join('|'), 'Final Substage Reached:Qi Condensation · Late 10 / 10:success|Qi Cap Reached:590 / 550 Minimum Qi:success|Loadout Complete:3 Active / 1 Passive:success|Healing Floor:8 / 12 Recommended Minimum:warning|Weapon Floor:Refine +5:success');
  assert.equal(surface.recommendedPanel.title, 'Recommended');
  assert.equal(surface.recommendedPanel.recommendedPrepTitle, 'Recommended Prep');
  assert.equal(surface.recommendedPanel.prepRows.length, 4);
  assert.equal(surface.recommendedPanel.prepRows.map((row) => `${row.title}:${row.status}:${row.routeTarget ?? 'none'}`).join('|'), 'Refine or temper gear:success:forge|Boost stats with pills:success:apothecary|Upgrade major techniques:success:techniques|Complete one Ruin support run:warning:ruins');
  assert.equal(surface.recommendedPanel.failSafeTitle, 'Fail-Safe');
  assert.equal(surface.recommendedPanel.failSafeRows.map((row) => `${row.label}:${row.value}`).join('|'), 'Eligible Failures:3 / 5|Cost:15 Merit · 800 Gold|Reserve:12 Merit · 610 Gold');
  assert.equal(surface.recommendedPanel.safetyNetButton.visible, true);
  assert.equal(surface.recommendedPanel.safetyNetButton.enabled, false);
  assert.equal(surface.recommendedPanel.safetyNetButton.label, 'Safety Net Locked');
  assert.equal(surface.recommendedPanel.safetyNetButton.intent, 'buy-safety-net');
  assert.match(surface.recommendedPanel.safetyNetButton.disabledReason ?? '', /3 \/ 5/);
  assert.match(surface.recommendedPanel.safetyNetButton.disabledReason ?? '', /15 Merit · 800 Gold/);
  assert.match(surface.recommendedPanel.safetyNetButton.disabledReason ?? '', /12 Merit · 610 Gold/);
  assert.equal(surface.recommendedPanel.topFixesTitle, 'Top Fixes');
  assert.equal(surface.recommendedPanel.topFixes.map((fix) => `${fix.label}:${fix.routeTarget}:${fix.button.intent}`).join('|'), 'Forge Weapon +5:forge:route-to-forge|Stock Healing:apothecary:route-to-apothecary|Upgrade Iron Palm:techniques:route-to-techniques');
});

test('scenic stage, readiness seal, reward, summary, rail, and CTA are locked', () => {
  const surface = createGateTrialExactMockupFixture();
  assert.equal(surface.scenicStage.sceneAssetId, 'approvedFoundationGatePlate');
  assert.equal(surface.scenicStage.artStatus, 'deferred');
  assert.equal(surface.scenicStage.requiresFinalArtBinding, true);
  assert.equal(surface.scenicStage.visualFlags.usesOldCombatPathScene, false);
  assert.equal(surface.scenicStage.visualFlags.usesOutskirtsScene, false);
  assert.equal(surface.scenicStage.visualFlags.usesRuinsScene, false);
  assert.equal(surface.scenicStage.visualFlags.usesCityGateAsFinalScene, false);
  assert.equal(surface.scenicStage.visualFlags.usesInsideDungeonAsFinalScene, false);
  assert.equal(surface.scenicStage.visualFlags.usesCssAsFinalArt, false);
  assert.equal(surface.scenicStage.readinessSeal.verdict, 'VIABLE');
  assert.equal(surface.scenicStage.readinessSeal.scoreLabel, 'Readiness 74 / 100');
  assert.equal(surface.scenicStage.readinessSeal.state, 'viable');
  assert.equal(surface.scenicStage.guardianPlaque.title, 'Gate Guardian · Lv. 15');
  assert.equal(surface.scenicStage.guardianPlaque.subtitle, 'Foundation Establishment Trial');
  assert.equal(surface.scenicStage.guardianPlaque.rewardLines.join('|'), 'Clear Reward: Gate Foundation Pill ×1|Used for Foundation Breakthrough');
  assert.equal(surface.scenicStage.guardianPlaque.gateItemId, 'gate_foundation_pill');
  assert.equal(surface.trialSummary.title, 'Trial Summary');
  assert.equal(surface.trialSummary.rows.map((row) => `${row.label}:${row.value}`).join('|'), 'Target:Foundation|Readiness:74 / 100|Failures:3 / 5|Reward:Gate Foundation Pill|Next Fix:Stock healing');
  assert.equal(surface.readinessRail.title, 'Foundation Gate Readiness');
  assert.equal(surface.readinessRail.nodes.map((node) => `${node.label}:${node.status}:${node.medallionVariant}`).join('|'), 'Qi Cap:success:check|Loadout:success:check|Weapon:success:check|Medicine:warning:warning|Techniques:success:check|Safety Net:locked:locked|Gate:active:gate-glow');
  assert.equal(surface.primaryAction.visible, true);
  assert.equal(surface.primaryAction.enabled, true);
  assert.equal(surface.primaryAction.label, 'Attempt Gate');
  assert.equal(surface.primaryAction.intent, 'attempt-gate');
  assert.equal(surface.primaryAction.singleDominantCta, true);
  assert.equal(surface.primaryAction.ornamentVariant, 'jade-gold');
});

test('builder preserves fixture mode and does not import forbidden gameplay or legacy UI', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/features/world/gateTrialExact/buildGateTrialExactSurface.ts'), 'utf8');
  for (const forbidden of [
    'useCombatStore',
    'useActivityStore',
    'useUIStore',
    'RewardService',
    'GateTrialBuildingPanel',
    'GateTrialWorldLayout',
    'CombatModuleTopLane',
    'GateTrialReadinessCard',
    'GateTrialAttemptCluster',
    'OutskirtsExactMockupScreen',
    'RuinsExactMockupScreen',
    'React',
  ]) {
    assert.equal(source.includes(forbidden), false, `fixture builder must not reference ${forbidden}`);
  }
  assert.match(source, /createGateTrialExactMockupFixture/);
  assert.match(source, /buildGateTrialExactSurfaceFromStores/);

  const viaBuilder = buildGateTrialExactSurfaceFromStores('city_pinewind_hamlet', {
    mode: 'fixture',
    trialId: 'trial_novices_clearing',
  });
  assert.equal(viaBuilder.meta.mode, 'fixture');
  assert.equal(viaBuilder.meta.source, 'fixture');
});

test('fixture is deterministic, JSON-serializable, and shallow-overridable', () => {
  const first = createGateTrialExactMockupFixture();
  const second = createGateTrialExactMockupFixture();
  assert.deepEqual(first, second);
  assert.deepEqual(JSON.parse(JSON.stringify(first)), first);

  const overridden = createGateTrialExactMockupFixture({
    meta: { ...first.meta, readinessScore: 85 },
  });
  assert.equal(overridden.meta.readinessScore, 85);
  assert.equal(createGateTrialExactMockupFixture().meta.readinessScore, 74);
});

test('fixture visible copy does not leak Outskirts, Ruins-route, or legacy combat language', () => {
  const text = JSON.stringify(createGateTrialExactMockupFixture());
  for (const forbidden of [
    'Start Hunt',
    'Expected Rewards',
    'Snarling Wolf',
    'Wolf Pelt',
    'Field Patrol',
    'Hollow Log Den',
    'Continue Exploration',
    'Targeted Materials',
    'Rare Pity',
    'Final Chest',
  ]) {
    assert.equal(text.includes(forbidden), false, `Gate Trial fixture must not contain copied module language: ${forbidden}`);
  }
});
