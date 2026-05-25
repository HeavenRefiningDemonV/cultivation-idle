import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  buildGateTrialExactSurfaceFromStores,
  createGateTrialExactMockupFixture,
} from '../../src/features/world/gateTrialExact/buildGateTrialExactSurface.js';
import { GateTrialExactScreen } from '../../src/features/world/gateTrialExact/GateTrialExactScreen.js';

void test('Gate Trial Exact G7 exports live builder while preserving fixture builder', () => {
  const fixture = createGateTrialExactMockupFixture();
  assert.equal(fixture.meta.mode, 'fixture');
  assert.equal(fixture.meta.source, 'fixture');

  const live = buildGateTrialExactSurfaceFromStores('city_pinewind_hamlet', {
    mode: 'live',
    trialId: 'trial_novices_clearing',
  });

  assert.equal(live.meta.mode, 'live');
  assert.equal(live.meta.source, 'stores');
  assert.equal(live.meta.surfaceId, 'gate-trial-exact');
  assert.equal(live.meta.rootTestId, 'gate-trial-exact-page');
});

void test('Gate Trial Exact G7 live surface is complete and renderable under missing-content fallback', () => {
  const surface = buildGateTrialExactSurfaceFromStores('city_pinewind_hamlet', {
    mode: 'live',
    trialId: 'trial_novices_clearing',
  });

  const html = renderToStaticMarkup(React.createElement(GateTrialExactScreen, { surface }));

  for (const token of [
    'data-testid="gate-trial-exact-page"',
    'data-testid="gate-trial-exact-top-region"',
    'data-testid="gate-trial-minimum-checklist"',
    'data-testid="gate-trial-recommended-panel"',
    'data-testid="gate-trial-trial-summary"',
    'data-testid="gate-trial-scenic-stage"',
    'data-testid="gate-trial-readiness-rail"',
    'data-testid="gate-trial-primary-cta"',
  ]) {
    assert.equal(html.includes(token), true, `missing render token ${token}`);
  }

  assert.equal(surface.meta.mode, 'live');
  assert.equal(surface.meta.source, 'stores');
  assert.equal(Array.isArray(surface.debug.missingDataFallbacks), true);
});

void test('Gate Trial Exact G7 live surface preserves exact page row counts', () => {
  const surface = buildGateTrialExactSurfaceFromStores('city_pinewind_hamlet', {
    mode: 'live',
    trialId: 'trial_novices_clearing',
  });

  assert.equal(surface.tacticalStrip.cells.length, 7);
  assert.equal(surface.minimumChecklist.rows.length, 5);
  assert.equal(surface.recommendedPanel.prepRows.length, 4);
  assert.equal(surface.recommendedPanel.failSafeRows.length, 3);
  assert.equal(surface.recommendedPanel.topFixes.length, 3);
  assert.equal(surface.trialSummary.rows.length, 5);
  assert.equal(surface.readinessRail.nodes.length, 7);
});

void test('Gate Trial Exact G7 live surface keeps exact semantic order for tactical cells, checklist, summary, and readiness rail', () => {
  const surface = buildGateTrialExactSurfaceFromStores('city_pinewind_hamlet', {
    mode: 'live',
    trialId: 'trial_novices_clearing',
  });

  assert.deepEqual(surface.tacticalStrip.cells.map((cell) => cell.id), [
    'hp',
    'gate',
    'loadout',
    'aiProfile',
    'healing',
    'bounty',
    'expedition',
  ]);

  assert.deepEqual(surface.minimumChecklist.rows.map((row) => row.id), [
    'finalSubstage',
    'qiCap',
    'loadoutComplete',
    'healingFloor',
    'weaponFloor',
  ]);

  assert.deepEqual(surface.recommendedPanel.prepRows.map((row) => row.id), [
    'refineGear',
    'boostStats',
    'upgradeTechniques',
    'ruinSupportRun',
  ]);

  assert.deepEqual(surface.recommendedPanel.failSafeRows.map((row) => row.id), [
    'eligibleFailures',
    'cost',
    'reserve',
  ]);

  assert.deepEqual(surface.trialSummary.rows.map((row) => row.id), [
    'target',
    'readiness',
    'failures',
    'reward',
    'nextFix',
  ]);

  assert.deepEqual(surface.readinessRail.nodes.map((node) => node.id), [
    'qiCap',
    'loadout',
    'weapon',
    'medicine',
    'techniques',
    'safetyNet',
    'gate',
  ]);
});

void test('Gate Trial Exact G7 live surface keeps compact tactical cells free of long legacy absence copy', () => {
  const surface = buildGateTrialExactSurfaceFromStores('city_pinewind_hamlet', {
    mode: 'live',
    trialId: 'trial_novices_clearing',
  });
  const html = renderToStaticMarkup(React.createElement(GateTrialExactScreen, { surface }));

  for (const forbidden of [
    'No medicine pouch configured',
    'No tracked bounty selected',
    'No expedition overlap',
    'Mandate route unavailable',
    'Best used when you are ready',
    'Minimum Floor',
    'Recommended Floor',
    'Gate Progress',
  ]) {
    assert.equal(html.includes(forbidden), false, `G7 live exact screen must not contain legacy compact copy: ${forbidden}`);
  }
});

void test('Gate Trial Exact G7 live builder uses authoritative lifecycle, reward, and readiness systems', () => {
  const source = readFileSync('src/features/world/gateTrialExact/buildGateTrialExactSurface.ts', 'utf8');

  for (const required of [
    'buildGateTrialExactSurfaceFromStores',
    'useContentStore',
    'useGameStore',
    'useInventoryStore',
    'useTrialStore',
    'useTechniqueStore',
    'useMedicinePouchStore',
    'useEquipmentStore',
    'useBountyStore',
    'useExpeditionStore',
    'useCombatStore',
    'useActivityStore',
    'resolveModuleRef',
    'getTrialLifecycleSnapshot',
    'getTrialGateItemId',
    'getTrialGateRewardBundle',
    'buildGateTrialReadinessSurface',
    'buildSection5PostFailureSurface',
  ]) {
    assert.equal(source.includes(required), true, `G7 live builder must reference ${required}`);
  }

  for (const forbidden of [
    'buildLiveDaoMandateSurfaceV1',
    'applyDaoMandateVisibility',
    'buildLocalMandateLensSurface',
    'mandateLens',
    'RewardService',
    'GateTrialBuildingPanel',
    'GateTrialWorldLayout',
    'GateTrialReadinessCard',
    'GateTrialAttemptCluster',
    'CombatModuleTopLane',
  ]) {
    assert.equal(source.includes(forbidden), false, `G7 live builder must not reference ${forbidden}`);
  }
});

void test('Gate Trial Exact G7 owner selects fixture or live mode and does not wire actions', () => {
  const source = readFileSync('src/features/world/gateTrialExact/GateTrialScreenOwner.tsx', 'utf8');

  assert.equal(source.includes('buildGateTrialExactSurfaceFromStores'), true);
  assert.equal(source.includes("props.forceFixture === false ? 'live' : 'fixture'"), true);
  assert.equal(source.includes('data-source={surface.meta.source}'), true);
  assert.equal(source.includes('data-lifecycle-state={surface.meta.lifecycleState}'), true);
  assert.equal(source.includes('data-readiness-score={surface.meta.readinessScore}'), true);
  assert.equal(source.includes('useCombatStore'), true);
  assert.equal(source.includes('useActivityStore'), true);
  assert.equal(source.includes('data-active-theater='), true);

  for (const forbidden of [
    'onPrimaryAction',
    'onSafetyNetAction',
    'onTopFixAction',
    'startCombat',
    'startCombatFromPreview',
    'openCombatPreview',
    'RewardService',
    'useUIStore',
  ]) {
    assert.equal(source.includes(forbidden), false, `G7 owner must not wire ${forbidden}`);
  }
});

void test('Gate Trial Exact G7 keeps normal World route in live exact mode', () => {
  const openWorldModule = readFileSync('src/systems/world/openWorldModule.ts', 'utf8');
  const modal = readFileSync('src/components/modals/WorldBuildingModal.tsx', 'utf8');
  const entrySurface = readFileSync('src/systems/ui/world/worldBuildingModalEntrySurface.ts', 'utf8');

  assert.equal(openWorldModule.includes("gateTrialExactMode: 'fixture'"), false);
  assert.equal(openWorldModule.includes("gateTrialExactMode: 'live'"), true);

  assert.equal(modal.includes("storeModalIntent?.gateTrialExactMode === 'fixture'"), true);
  assert.equal(modal.includes("storeModalIntent?.gateTrialExactMode === 'live'"), false);

  assert.match(entrySurface, /case 'gateTrial':[\s\S]*backgroundVariant\s*=\s*'gate-trial-exact';[\s\S]*shellFamily\s*=\s*'gate-trial-scenic';[\s\S]*shellMode\s*=\s*'screen-owned';/);
});
