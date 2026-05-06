import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { createGateTrialExactMockupFixture } from '../../src/features/world/gateTrialExact/buildGateTrialExactSurface.js';
import { GateTrialExactScreen } from '../../src/features/world/gateTrialExact/GateTrialExactScreen.js';
import { resolveWorldModalEntrySurface } from '../../src/systems/ui/world/worldBuildingModalEntrySurface.js';

void test('Gate Trial Exact G2 fixture host remains screen-owned before top parity work', () => {
  const fixtureSurface = resolveWorldModalEntrySurface({
    buildingKey: 'gateTrial',
    cityName: 'Pinewind Hamlet',
    intent: { gateTrialExactMode: 'fixture' },
    isStoreMode: true,
  });

  assert.equal(fixtureSurface.backgroundVariant, 'gate-trial-exact');
  assert.equal(fixtureSurface.shellFamily, 'gate-trial-scenic');
  assert.equal(fixtureSurface.shellMode, 'screen-owned');
  assert.equal(fixtureSurface.showShellClose, false);
  assert.equal(fixtureSurface.showContextStrip, false);

  const legacySurface = resolveWorldModalEntrySurface({
    buildingKey: 'gateTrial',
    cityName: 'Pinewind Hamlet',
    intent: null,
    isStoreMode: true,
  });

  assert.equal(legacySurface.backgroundVariant, 'inside-dungeon');
  assert.equal(legacySurface.shellFamily, 'combat-path');
  assert.equal(legacySurface.shellMode, 'close-only');

  const liveIntentSurface = resolveWorldModalEntrySurface({
    buildingKey: 'gateTrial',
    cityName: 'Pinewind Hamlet',
    intent: { gateTrialExactMode: 'live' },
    isStoreMode: true,
  });

  assert.equal(liveIntentSurface.backgroundVariant, 'inside-dungeon');
  assert.equal(liveIntentSurface.shellFamily, 'combat-path');
  assert.equal(liveIntentSurface.shellMode, 'close-only');
});

void test('Gate Trial Exact top region renders title, status, macro ribbon, and seven tactical cells', () => {
  const surface = createGateTrialExactMockupFixture();
  const html = renderToStaticMarkup(React.createElement(GateTrialExactScreen, { surface }));

  for (const token of [
    'data-testid="gate-trial-exact-top-region"',
    'data-testid="gate-trial-page-title"',
    'data-testid="gate-trial-title-seal"',
    'data-testid="gate-trial-top-status"',
    'data-testid="gate-trial-macro-ribbon"',
    'data-testid="gate-trial-tactical-strip"',
    'data-testid="gate-trial-tactical-cell-hp"',
    'data-testid="gate-trial-tactical-cell-gate"',
    'data-testid="gate-trial-tactical-cell-loadout"',
    'data-testid="gate-trial-tactical-cell-aiProfile"',
    'data-testid="gate-trial-tactical-cell-healing"',
    'data-testid="gate-trial-tactical-cell-bounty"',
    'data-testid="gate-trial-tactical-cell-expedition"',
    'data-testid="gate-trial-icon-hp"',
    'data-testid="gate-trial-icon-gate"',
    'data-testid="gate-trial-icon-loadout"',
    'data-testid="gate-trial-icon-aiProfile"',
    'data-testid="gate-trial-icon-healing"',
    'data-testid="gate-trial-icon-bounty"',
    'data-testid="gate-trial-icon-expedition"',
    'data-testid="gate-trial-icon-header-chip-milestone-gate"',
    'data-testid="gate-trial-icon-header-chip-readiness-check"',
    'data-testid="gate-trial-icon-header-chip-safety-net-tracked"',
  ]) {
    assert.equal(html.includes(token), true, `missing ${token}`);
  }

  for (const copy of [
    'Gate Trial',
    '2 Expeditions Idle',
    '1 Tracked Bounty',
    'HP',
    '131 / 131',
    'Gate',
    'Foundation · Lv. 15',
    'Loadout',
    'Loadout 1',
    'AI Profile',
    'Balanced',
    'Healing',
    '12 / 20',
    'Bounty',
    'No tracked bounty',
    'Expedition',
    '2 Idle',
  ]) {
    assert.equal(html.includes(copy), true, `missing top-region copy ${copy}`);
  }
});

void test('Gate Trial Exact tactical cells keep the exact mockup order and avoid long legacy copy', () => {
  const html = renderToStaticMarkup(
    React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }),
  );
  const order = ['hp', 'gate', 'loadout', 'aiProfile', 'healing', 'bounty', 'expedition'];
  const positions = order.map((id) => html.indexOf(`data-testid="gate-trial-tactical-cell-${id}"`));

  assert.equal(positions.every((position) => position >= 0), true, 'all tactical cells must render');
  for (let i = 1; i < positions.length; i += 1) {
    assert.equal(positions[i] > positions[i - 1], true, `${order[i]} rendered out of order`);
  }

  for (const forbidden of [
    'No medicine pouch configured',
    'No tracked bounty selected',
    'No expedition overlap',
    'Combat Preview',
    'Challenge Trial',
    'Start Hunt',
    'Expected Rewards',
    'Snarling Wolf',
    'Field Patrol',
    'Hollow Log Den',
    'Rare Pity',
    'Final Chest',
  ]) {
    assert.equal(html.includes(forbidden), false, `top region must not contain legacy/borrowed copy: ${forbidden}`);
  }
});

void test('Gate Trial Exact HP cell renders the fixture underline bar contract', () => {
  const html = renderToStaticMarkup(
    React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }),
  );
  const hpIndex = html.indexOf('data-testid="gate-trial-tactical-cell-hp"');
  assert.equal(hpIndex >= 0, true);

  const hpSlice = html.slice(hpIndex, hpIndex + 1600);
  assert.equal(hpSlice.includes('gateTrialTacticalCell__underlineTrack'), true);
  assert.equal(hpSlice.includes('gateTrialTacticalCell__underlineFill'), true);
  assert.equal(hpSlice.includes('data-has-underline-bar="true"'), true);
});

void test('Gate Trial Exact macro ribbon is decorative and not an interactive tab row', () => {
  const html = renderToStaticMarkup(
    React.createElement(GateTrialExactScreen, { surface: createGateTrialExactMockupFixture() }),
  );
  const ribbonIndex = html.indexOf('data-testid="gate-trial-macro-ribbon"');
  assert.equal(ribbonIndex >= 0, true);

  const ribbonSlice = html.slice(ribbonIndex, ribbonIndex + 2200);
  assert.equal(ribbonSlice.includes('gateTrialTopRegion__macroTrack'), true);
  assert.equal(ribbonSlice.includes('gateTrialTopRegion__macroNodes'), true);
  assert.equal(ribbonSlice.includes('gateTrialTopRegion__macroNode'), true);
  assert.equal(ribbonSlice.includes('gateTrialTopRegion__macroNode--gateMarker'), true);
  assert.equal(ribbonSlice.includes('role="tab"'), false);
  assert.equal(ribbonSlice.includes('aria-selected'), false);
  assert.equal(ribbonSlice.includes('<button'), false);
});

void test('Gate Trial Exact G3 source does not import legacy top lanes or live systems', () => {
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
    'CombatModuleTopLane',
    'GateTrialReadinessCard',
    'GateTrialAttemptCluster',
    'GateTrialChecklist',
    'GateTrialTopFixes',
    'RuinsTopRegion',
    'OutskirtsTopRegion',
    'GameIcon',
    'lucide-react',
    'InkCombatShell',
    'InkHealthBar',
  ]) {
    assert.equal(source.includes(forbidden), false, `G3 screen source must not reference ${forbidden}`);
  }
});

void test('Gate Trial Exact SCSS contains the G3 top-region parity contract', () => {
  const scss = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.scss', 'utf8');

  for (const required of [
    '--gate-top-height',
    '.gateTrialTopRegion',
    '.gateTrialTopRegion__topBand',
    '.gateTrialTopRegion__titleAnchor',
    '.gateTrialTopRegion__titleSeal',
    '.gateTrialTopRegion__macroRibbon',
    '.gateTrialTopRegion__macroTrack',
    '.gateTrialTopRegion__macroNodes',
    '.gateTrialTopRegion__macroNode',
    '.gateTrialTopRegion__macroNode--gateMarker',
    '.gateTrialTopRegion__statusCluster',
    '.gateTrialTopRegion__statusText',
    '.gateTrialTopRegion__statusMedallion',
    '.gateTrialTopRegion__settingsOrnament',
    '.gateTrialTopRegion__tacticalStrip',
    'grid-template-columns: 1.16fr repeat(6, 1fr)',
    '.gateTrialExactIcon',
    '.gateTrialExactIcon--tactical',
    '.gateTrialExactIcon--chip',
    '.gateTrialTacticalCell',
    '.gateTrialTacticalCell__iconDock',
    '.gateTrialTacticalCell__icon',
    '.gateTrialGateHeader__chipIcon',
    '.gateTrialTacticalCell__underlineTrack',
    '.gateTrialTacticalCell__underlineFill',
  ]) {
    assert.equal(scss.includes(required), true, `missing G3 SCSS selector/token ${required}`);
  }

  for (const forbidden of [
    '.combatModuleTopLane',
    '.gateTrialWorldLayout',
    '.gateTrialPanel',
    '.ruinsTopRegion',
    '.outskirtsTopRegion',
    '.gateTrialTacticalCell__icon--hp::before',
    '.gateTrialTacticalCell__icon--gate::before',
    '.gateTrialTacticalCell__icon--loadout::before',
    '.gateTrialTacticalCell__icon--aiProfile::before',
    '.gateTrialTacticalCell__icon--healing::before',
    '.gateTrialTacticalCell__icon--bounty::before',
    '.gateTrialTacticalCell__icon--expedition::before',
    'content: "✓"',
    "content: '✓'",
    'content: "⚠"',
    "content: '⚠'",
    'content: "🔒"',
    "content: '🔒'",
  ]) {
    assert.equal(scss.includes(forbidden), false, `G3 SCSS must not contain ${forbidden}`);
  }
});
