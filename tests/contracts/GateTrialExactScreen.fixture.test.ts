import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { createGateTrialExactMockupFixture } from '../../src/features/world/gateTrialExact/buildGateTrialExactSurface.js';
import { GateTrialExactScreen } from '../../src/features/world/gateTrialExact/GateTrialExactScreen.js';

void test('Gate Trial Exact fixture screen renders all skeleton regions and mockup copy', () => {
  const surface = createGateTrialExactMockupFixture();
  const html = renderToStaticMarkup(React.createElement(GateTrialExactScreen, { surface }));
  for (const token of ['gate-trial-exact-page','gate-trial-exact-top-region','gate-trial-exact-gate-header-slot','gate-trial-exact-left-rail','gate-trial-exact-scenic-slot','gate-trial-exact-right-rail','gate-trial-exact-readiness-rail','gate-trial-exact-cta-slot','gate-trial-exact-summary-dock','gate-trial-exact-shell-flags','gate-trial-exact-region-order']) assert.equal(html.includes(token), true);
  for (const copy of ['Gate Trial','2 Expeditions Idle','1 Tracked Bounty','Foundation Gate','Milestone readiness check — clears the path to Foundation','Milestone Gate','Readiness Check','Safety Net Tracked','Minimum Checklist','Final Substage Reached','Qi Condensation · Late 10 / 10','Qi Cap Reached','590 / 550 Minimum Qi','Loadout Complete','3 Active / 1 Passive','Healing Floor','8 / 12 Recommended Minimum','Weapon Floor','Refine +5','VIABLE','Readiness 74 / 100','Gate Guardian · Lv. 15','Foundation Establishment Trial','Clear Reward: Gate Foundation Pill ×1','Used for Foundation Breakthrough','Recommended','Recommended Prep','Refine or temper gear','Boost stats with pills','Upgrade major techniques','Complete one Ruin support run','Fail-Safe','Eligible Failures','3 / 5','15 Merit · 800 Gold','12 Merit · 610 Gold','Safety Net Locked','Top Fixes','Forge Weapon +5','Stock Healing','Upgrade Iron Palm','Trial Summary','Target','Foundation','Reward','Gate Foundation Pill','Next Fix','Stock healing','Foundation Gate Readiness','Qi Cap','Loadout','Weapon','Medicine','Techniques','Safety Net','Attempt Gate']) assert.equal(html.includes(copy), true);
});

void test('Gate Trial Exact fixture screen preserves tactical strip and readiness rail order', () => {
  const html = renderToStaticMarkup(React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }));
  const tacticalOrder = ['hp', 'gate', 'loadout', 'aiProfile', 'healing', 'bounty', 'expedition'];
  const t = tacticalOrder.map((id) => html.indexOf(`gate-trial-tactical-cell-${id}`));
  assert.equal(t.every((index) => index >= 0), true);
  for (let i = 1; i < t.length; i += 1) assert.equal(t[i] > t[i - 1], true);
  const nodeOrder = ['qiCap', 'loadout', 'weapon', 'medicine', 'techniques', 'safetyNet', 'gate'];
  const n = nodeOrder.map((id) => html.indexOf(`gate-trial-readiness-node-${id}`));
  assert.equal(n.every((index) => index >= 0), true);
  for (let i = 1; i < n.length; i += 1) assert.equal(n[i] > n[i - 1], true);
});

void test('Gate Trial Exact fixture screen renders deferred scenic stage without visible placeholder copy', () => {
  const surface = createGateTrialExactMockupFixture();
  const html = renderToStaticMarkup(React.createElement(GateTrialExactScreen, { surface }));
  assert.equal(html.includes('data-art-status="deferred"'), true);
  assert.equal(html.includes('data-final-art-required="true"'), true);
  assert.equal(html.includes('data-scene-asset-id="approvedFoundationGatePlate"'), true);
  assert.equal(html.includes('gate-trial-scenic-underpaint'), true);
  assert.equal(html.includes('gate-trial-scenic-portal'), true);
  assert.equal(html.includes('gate-trial-scenic-stairs'), true);
  assert.equal(html.includes('gate-trial-scenic-torch-left'), true);
  assert.equal(html.includes('gate-trial-scenic-torch-right'), true);
  assert.equal(html.includes('gate-trial-scenic-cultivator-shadow'), true);
  for (const forbiddenVisible of ['>Art pending<','>Image missing<','>Scene pending<','>Placeholder<',`>${surface.scenicStage.environmentDescriptor}<`]) assert.equal(html.includes(forbiddenVisible), false);
});

void test('Gate Trial Exact screen source is pure and does not import legacy/live owners', () => {
  const source = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.ts', 'utf8');
  for (const forbidden of ['useContentStore','useGameStore','useTrialStore','useCombatStore','useUIStore','useInventoryStore','useActivityStore','RewardService','getTrialLifecycleSnapshot','getTrialGateRewardBundle','buildGateTrialReadinessSurface','GateTrialBuildingPanel','GateTrialWorldLayout','CombatModuleTopLane','GateTrialReadinessCard','GateTrialChecklist','GateTrialSafetyNetCard','GateTrialTopFixes','GateTrialAttemptCluster','InkCombatShell','InkHealthBar','ScreenFxStage','GateTrialFxScene','OutskirtsExactMockupScreen','RuinsExactMockupScreen','OutskirtsTopRegion','RuinsTopRegion']) assert.equal(source.includes(forbidden), false);
  assert.equal(source.includes('createGateTrialExactMockupFixture'), false);
  assert.equal(source.includes('./GateTrialExactScreen.scss'), false);
});

void test('Gate Trial Exact owner preserves fixture default and exposes live surface selection', () => {
  const owner = readFileSync('src/features/world/gateTrialExact/GateTrialScreenOwner.tsx', 'utf8');
  assert.equal(owner.includes('buildGateTrialExactSurfaceFromStores'), true);
  assert.equal(owner.includes("props.forceFixture === false ? 'live' : 'fixture'"), true);
  assert.equal(owner.includes('GateTrialExactScreen'), true);
  assert.equal(owner.includes('./GateTrialExactScreen.scss'), true);
  assert.equal(owner.includes('data-source={surface.meta.source}'), true);
  assert.equal(owner.includes('data-lifecycle-state={surface.meta.lifecycleState}'), true);
  assert.equal(owner.includes('useCombatStore'), true);
  assert.equal(owner.includes('useActivityStore'), true);
  assert.equal(owner.includes('data-active-theater='), true);
  for (const forbidden of ['onPrimaryAction','onSafetyNetAction','onTopFixAction','startCombat','startCombatFromPreview','openCombatPreview','RewardService','useUIStore']) assert.equal(owner.includes(forbidden), false);
});

void test('Gate Trial Exact fixture screen avoids Outskirts, Ruins-route, and old combat copy', () => {
  const html = renderToStaticMarkup(React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }));
  for (const forbidden of ['Start Hunt','Expected Rewards','Snarling Wolf','Wolf Pelt','Field Patrol','Hollow Log Den','Continue Exploration','Targeted Materials','Rare Pity','Final Chest','Combat Preview','Challenge Trial']) assert.equal(html.includes(forbidden), false);
});

void test('Gate Trial Exact SCSS contains critical skeleton selectors and full-page layout contract', () => {
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');
  for (const selector of ['.gateTrialScreenOwner','.gateTrialExactPage','.gateTrialExactPage__underlay','.gateTrialTopRegion','.gateTrialTopRegion__macroRibbon','.gateTrialTopRegion__tacticalStrip','.gateTrialTacticalCell','.gateTrialExactPage__gateHeaderSlot','.gateTrialGateHeader','.gateTrialMinimumChecklist','.gateTrialMinimumChecklist__row','.gateTrialStatusMedallion','.gateTrialScenicStage','.gateTrialScenicStage__underpaint','.gateTrialReadinessSeal','.gateTrialGuardianPlaque','.gateTrialRecommendedPanel','.gateTrialRecommendedPanel__safetyNetButton','.gateTrialTrialSummary','.gateTrialReadinessRail','.gateTrialReadinessRail__node','.gateTrialPrimaryCta','.gateTrialPrimaryCta__ornament--left','.gateTrialPrimaryCta__ornament--right']) assert.equal(scss.includes(selector), true);
});
