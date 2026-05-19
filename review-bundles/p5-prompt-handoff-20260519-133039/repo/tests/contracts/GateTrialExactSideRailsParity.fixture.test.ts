import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { createGateTrialExactMockupFixture } from '../../src/features/world/gateTrialExact/buildGateTrialExactSurface.js';
import { GateTrialExactScreen } from '../../src/features/world/gateTrialExact/GateTrialExactScreen.js';

void test('Gate Trial Exact G4 renders left checklist, right recommendation panel, and separate Trial Summary dock', () => {
  const html = renderToStaticMarkup(
    React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }),
  );

  for (const token of [
    'data-testid="gate-trial-exact-left-rail"',
    'data-testid="gate-trial-minimum-checklist"',
    'data-testid="gate-trial-minimum-title"',
    'data-testid="gate-trial-minimum-stamp"',
    'data-testid="gate-trial-minimum-rows"',
    'data-testid="gate-trial-exact-right-rail"',
    'data-testid="gate-trial-recommended-panel"',
    'data-testid="gate-trial-recommended-title"',
    'data-testid="gate-trial-recommended-prep-title"',
    'data-testid="gate-trial-recommended-prep-rows"',
    'data-testid="gate-trial-fail-safe-section"',
    'data-testid="gate-trial-failsafe-title"',
    'data-testid="gate-trial-failsafe-rows"',
    'data-testid="gate-trial-safety-net-button"',
    'data-testid="gate-trial-top-fixes"',
    'data-testid="gate-trial-top-fixes-title"',
    'data-testid="gate-trial-exact-summary-dock"',
    'data-testid="gate-trial-trial-summary"',
    'data-testid="gate-trial-summary-title"',
    'data-testid="gate-trial-summary-rows"',
    'data-testid="gate-trial-minimum-row-icon-finalSubstage"',
    'data-testid="gate-trial-minimum-row-icon-qiCap"',
    'data-testid="gate-trial-minimum-row-icon-loadoutComplete"',
    'data-testid="gate-trial-minimum-row-icon-healingFloor"',
    'data-testid="gate-trial-minimum-row-icon-weaponFloor"',
    'data-testid="gate-trial-prep-row-icon-refineGear"',
    'data-testid="gate-trial-prep-row-icon-boostStats"',
    'data-testid="gate-trial-prep-row-icon-upgradeTechniques"',
    'data-testid="gate-trial-prep-row-icon-ruinSupportRun"',
    'data-testid="gate-trial-icon-failsafe-eligibleFailures"',
    'data-testid="gate-trial-icon-failsafe-cost"',
    'data-testid="gate-trial-icon-failsafe-reserve"',
    'data-testid="gate-trial-icon-safetyNet"',
    'data-testid="gate-trial-icon-top-fix-forgeWeapon"',
    'data-testid="gate-trial-icon-top-fix-stockHealing"',
    'data-testid="gate-trial-icon-top-fix-upgradeTechnique"',
  ]) {
    assert.equal(html.includes(token), true, `missing ${token}`);
  }
});

void test('Gate Trial Exact G4 renders the five minimum checklist rows in exact mockup order', () => {
  const html = renderToStaticMarkup(
    React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }),
  );

  const order = ['finalSubstage', 'qiCap', 'loadoutComplete', 'healingFloor', 'weaponFloor'];
  const positions = order.map((id) => html.indexOf(`data-testid="gate-trial-minimum-row-${id}"`));

  assert.equal(positions.every((position) => position >= 0), true, 'all minimum rows must render');
  for (let i = 1; i < positions.length; i += 1) {
    assert.equal(positions[i] > positions[i - 1], true, `${order[i]} rendered out of order`);
  }

  for (const copy of [
    'Minimum Checklist',
    'Viable',
    'Final Substage Reached',
    'Qi Condensation · Late 10 / 10',
    'Qi Cap Reached',
    '590 / 550 Minimum Qi',
    'Loadout Complete',
    '3 Active / 1 Passive',
    'Healing Floor',
    '8 / 12 Recommended Minimum',
    'Weapon Floor',
    'Refine +5',
  ]) {
    assert.equal(html.includes(copy), true, `missing checklist copy ${copy}`);
  }

  assert.equal(html.includes('data-status="warning"'), true, 'healing warning status should render');
});

void test('Gate Trial Exact G4 renders recommended prep, fail-safe, and top fixes in exact fixture order', () => {
  const html = renderToStaticMarkup(
    React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }),
  );

  const prepOrder = ['refineGear', 'boostStats', 'upgradeTechniques', 'ruinSupportRun'];
  const prepPositions = prepOrder.map((id) => html.indexOf(`data-testid="gate-trial-prep-row-${id}"`));

  assert.equal(prepPositions.every((position) => position >= 0), true, 'all prep rows must render');
  for (let i = 1; i < prepPositions.length; i += 1) {
    assert.equal(prepPositions[i] > prepPositions[i - 1], true, `${prepOrder[i]} prep row rendered out of order`);
  }

  const failSafeOrder = ['eligibleFailures', 'cost', 'reserve'];
  const failSafePositions = failSafeOrder.map((id) => html.indexOf(`data-testid="gate-trial-failsafe-row-${id}"`));

  assert.equal(failSafePositions.every((position) => position >= 0), true, 'all fail-safe rows must render');
  for (let i = 1; i < failSafePositions.length; i += 1) {
    assert.equal(failSafePositions[i] > failSafePositions[i - 1], true, `${failSafeOrder[i]} fail-safe row rendered out of order`);
  }

  const fixOrder = ['forgeWeapon', 'stockHealing', 'upgradeTechnique'];
  const fixPositions = fixOrder.map((id) => html.indexOf(`data-testid="gate-trial-top-fix-${id}"`));

  assert.equal(fixPositions.every((position) => position >= 0), true, 'all top fixes must render');
  for (let i = 1; i < fixPositions.length; i += 1) {
    assert.equal(fixPositions[i] > fixPositions[i - 1], true, `${fixOrder[i]} top fix rendered out of order`);
  }

  for (const copy of [
    'Recommended',
    'Recommended Prep',
    'Refine or temper gear',
    'Boost stats with pills',
    'Upgrade major techniques',
    'Complete one Ruin support run',
    'Fail-Safe',
    'Eligible Failures',
    '3 / 5',
    'Cost',
    '15 Merit · 800 Gold',
    'Reserve',
    '12 Merit · 610 Gold',
    'Safety Net Locked',
    'Top Fixes',
    'Forge Weapon +5',
    'Stock Healing',
    'Upgrade Iron Palm',
  ]) {
    assert.equal(html.includes(copy), true, `missing recommended-panel copy ${copy}`);
  }
});

void test('Gate Trial Exact G4 renders Trial Summary as a separate lower-right dock with exact row order', () => {
  const html = renderToStaticMarkup(
    React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }),
  );

  const recommendedIndex = html.indexOf('data-testid="gate-trial-recommended-panel"');
  const summaryIndex = html.indexOf('data-testid="gate-trial-trial-summary"');

  assert.equal(recommendedIndex >= 0, true);
  assert.equal(summaryIndex >= 0, true);
  assert.equal(summaryIndex > recommendedIndex, true, 'Trial Summary should render after Recommended panel, not inside its prep section');

  const rowOrder = ['target', 'readiness', 'failures', 'reward', 'nextFix'];
  const positions = rowOrder.map((id) => html.indexOf(`data-testid="gate-trial-summary-row-${id}"`));

  assert.equal(positions.every((position) => position >= 0), true, 'all summary rows must render');
  for (let i = 1; i < positions.length; i += 1) {
    assert.equal(positions[i] > positions[i - 1], true, `${rowOrder[i]} summary row rendered out of order`);
  }

  for (const copy of [
    'Trial Summary',
    'Target',
    'Foundation',
    'Readiness',
    '74 / 100',
    'Failures',
    '3 / 5',
    'Reward',
    'Gate Foundation Pill',
    'Next Fix',
    'Stock healing',
  ]) {
    assert.equal(html.includes(copy), true, `missing Trial Summary copy ${copy}`);
  }

  assert.equal(html.includes('gateTrialTrialSummary__row--positive'), true);
  assert.equal(html.includes('gateTrialTrialSummary__row--critical'), true);
});

void test('Gate Trial Exact G4 source remains pure and does not import legacy side rail components or live systems', () => {
  const source = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.ts', 'utf8');

  for (const forbidden of [
    'useContentStore',
    'useGameStore',
    'useTrialStore',
    'useCombatStore',
    'useUIStore',
    'useInventoryStore',
    'useActivityStore',
    'RewardService',
    'getTrialLifecycleSnapshot',
    'getTrialGateRewardBundle',
    'GateTrialBuildingPanel',
    'GateTrialWorldLayout',
    'GateTrialReadinessCard',
    'GateTrialChecklist',
    'GateTrialSafetyNetCard',
    'GateTrialTopFixes',
    'GateTrialAttemptCluster',
    'CombatModuleTopLane',
    'InkCombatShell',
    'InkHealthBar',
    'OutskirtsExactMockupScreen',
    'RuinsExactMockupScreen',
    'GameIcon',
    'lucide-react',
  ]) {
    assert.equal(source.includes(forbidden), false, `G4 source must not reference ${forbidden}`);
  }
});

void test('Gate Trial Exact G4 SCSS contains side rail parity selectors and avoids Unicode icon glyphs', () => {
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');

  for (const required of [
    '.gateTrialExactCard',
    '.gateTrialExactPage__leftRail',
    '.gateTrialExactPage__rightRail',
    '.gateTrialExactPage__summaryDock',
    '.gateTrialMinimumChecklist',
    '.gateTrialMinimumChecklist__header',
    '.gateTrialMinimumChecklist__title',
    '.gateTrialMinimumChecklist__stamp',
    '.gateTrialMinimumChecklist__stampText',
    '.gateTrialMinimumChecklist__rows',
    '.gateTrialMinimumChecklist__row',
    '.gateTrialMinimumChecklist__rowTitle',
    '.gateTrialMinimumChecklist__rowDetail',
    '.gateTrialMinimumChecklist__bottomWash',
    '.gateTrialStatusMedallion',
    '.gateTrialStatusMedallion__icon',
    '.gateTrialStatusMedallion--success',
    '.gateTrialStatusMedallion--warning',
    '.gateTrialStatusMedallion--locked',
    '.gateTrialExactIcon',
    '.gateTrialExactIcon--status',
    '.gateTrialExactIcon--panel',
    '.gateTrialExactIcon--reward',
    '.gateTrialRecommendedPanel',
    '.gateTrialRecommendedPanel__header',
    '.gateTrialRecommendedPanel__title',
    '.gateTrialRecommendedPanel__section',
    '.gateTrialRecommendedPanel__prepRows',
    '.gateTrialRecommendedPanel__prepRow',
    '.gateTrialRecommendedPanel__factRow',
    '.gateTrialRecommendedPanel__factIcon',
    '.gateTrialRecommendedPanel__safetyNetIcon',
    '.gateTrialRecommendedPanel__safetyNetLabel',
    '.gateTrialRecommendedPanel__topFixIcon',
    '.gateTrialRecommendedPanel__topFixLabel',
    '.gateTrialGuardianPlaque__rewardIcon',
    '.gateTrialFailSafeFactRows',
    '.gateTrialFailSafeFactRow',
    '.gateTrialRecommendedPanel__safetyNetButton',
    '.gateTrialRecommendedPanel__safetyNetButton--locked',
    '.gateTrialRecommendedPanel__topFixes',
    '.gateTrialTopFixButton',
    '.gateTrialTopFixButton__chevron',
    '.gateTrialTrialSummary',
    '.gateTrialTrialSummary__title',
    '.gateTrialTrialSummary__rows',
    '.gateTrialTrialSummary__row',
    '.gateTrialTrialSummary__row--positive',
    '.gateTrialTrialSummary__row--critical',
  ]) {
    assert.equal(scss.includes(required), true, `missing G4 SCSS selector ${required}`);
  }

  for (const forbidden of [
    '.gateTrialStatusMedallion__mark',
    '.gateTrialIconSlot',
    '.gateTrialIconSlot__glyph',
    '.gateTrialRecommendedPanel__safetyNetIconMark',
    '.gateTrialGuardianPlaque__rewardIcon--foundationPill',
    'content: "✓"',
    "content: '✓'",
    'content: "✔"',
    "content: '✔'",
    'content: "⚠"',
    "content: '⚠'",
    'content: "🔒"',
    "content: '🔒'",
    'content: "→"',
    "content: '→'",
    'content: "›"',
    "content: '›'",
    'content: "»"',
    "content: '»'",
  ]) {
    assert.equal(scss.includes(forbidden), false, `G4 SCSS must not contain ${forbidden}`);
  }
});

void test('Gate Trial Exact G4 preserves route activation and modal fixture contracts', () => {
  const openWorldModule = readFileSync('src/systems/world/openWorldModule.ts', 'utf8');
  const entrySurface = readFileSync('src/systems/ui/world/worldBuildingModalEntrySurface.ts', 'utf8');
  const modal = readFileSync('src/components/modals/WorldBuildingModal.tsx', 'utf8');

  assert.equal(openWorldModule.includes("normalizedModuleKey === 'gateTrial'"), true);
  assert.equal(openWorldModule.includes("gateTrialExactMode: 'live'"), true);
  assert.equal(openWorldModule.includes("gateTrialExactMode: 'fixture'"), false);
  assert.equal(openWorldModule.includes('intent === undefined'), true);

  assert.equal(entrySurface.includes("'gate-trial-exact'"), true);
  assert.equal(entrySurface.includes("'gate-trial-scenic'"), true);
  assert.match(entrySurface, /case 'gateTrial':[\s\S]*shellMode = 'screen-owned'/);
  assert.equal(entrySurface.includes("shellMode = 'screen-owned'"), true);

  assert.equal(modal.includes('GateTrialScreenOwner'), true);
  assert.equal(modal.includes("storeModalIntent?.gateTrialExactMode === 'fixture'"), true);
  assert.equal(modal.includes('GateTrialBuildingPanel'), false);
});
