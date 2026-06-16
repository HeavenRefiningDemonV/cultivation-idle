import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { buildStatusDashboardSurface } from '../../src/systems/ui/status/statusDashboardSurface.js';
import { buildStatusObservatorySurface } from '../../src/systems/ui/status/statusObservatorySurface.js';
import { primeStatusObservatoryScenario } from './statusObservatoryTestUtils.js';

const repoRoot = process.cwd();

function absPath(relPath: string): string {
  return path.join(repoRoot, relPath);
}

function exists(relPath: string): boolean {
  return existsSync(absPath(relPath));
}

function read(relPath: string): string {
  return readFileSync(absPath(relPath), 'utf8');
}

function assertPureSupportSource(source: string, label: string): void {
  assert.doesNotMatch(source, /from ['"].*stores\//, `${label} must not import stores.`);
  assert.doesNotMatch(source, /\.getState\s*\(/, `${label} must not read stores.`);
  assert.doesNotMatch(source, /RewardService|grantRewards|spendCurrency/, `${label} must not mutate rewards.`);
  assert.doesNotMatch(source, /CombatStore|useCombatStore|resolveCombat/i, `${label} must not own combat.`);
  assert.doesNotMatch(source, /PrestigeResetService|performPrestigeReset|usePrestigeStore/, `${label} must not own prestige.`);
  assert.doesNotMatch(source, /breakthrough\s*\(|attemptBreakthrough|resolveBreakthrough/, `${label} must not trigger breakthrough.`);
  assert.doesNotMatch(source, /performStatusRouteTarget|openDaoHeartModal|openSpiritRootObservation/, `${label} must only forward action surfaces.`);
}

test('S7 file family exists and replaces inline lower-support placeholders', () => {
  for (const relPath of [
    'src/ui/status/observatory/StatusBuildPreparationScales.tsx',
    'src/ui/status/observatory/StatusReserveJars.tsx',
    'src/ui/status/observatory/StatusCurrentWorkTimeWheel.tsx',
    'src/ui/status/observatory/StatusFoldedLedgerRail.tsx',
    'src/ui/status/observatory/StatusObservatoryDrawers.tsx',
  ]) {
    assert.equal(exists(relPath), true, `${relPath} should exist for S7.`);
  }

  const shell = read('src/ui/status/observatory/StatusLivingStateObservatory.tsx');
  const lifeDecree = read('src/ui/status/observatory/StatusLifeDecreeScroll.tsx');
  const canopy = read('src/ui/status/observatory/StatusBottleneckTalismanCanopy.tsx');
  const index = read('src/ui/status/observatory/index.ts');
  const publicPage = read('src/ui/status/ledger/StatusLedgerPage.tsx');

  assert.match(shell, /import \{ StatusBuildPreparationScales \}/);
  assert.match(shell, /import \{ StatusCurrentWorkTimeWheel \}/);
  assert.match(shell, /<StatusBuildPreparationScales\s+surface=\{surface\.buildPreparation\}/);
  assert.match(shell, /<StatusCurrentWorkTimeWheel\s+surface=\{surface\.workWheel\}/);
  assert.match(shell, /<StatusFoldedLedgerRail\s+surface=\{surface\.ledgerRail\}[\s\S]*onOpenDrawer=/);
  assert.match(shell, /StatusObservatoryDrawerRequest/);
  assert.match(shell, /useState/);
  assert.match(shell, /data-testid="status-ledger-grid"/);
  assert.match(lifeDecree, /status-ledger-cultivation-base/);
  assert.match(canopy, /status-ledger-mission-requirements/);
  assert.match(index, /StatusBuildPreparationScales/);
  assert.match(index, /StatusReserveJars/);
  assert.match(index, /StatusCurrentWorkTimeWheel/);

  assert.doesNotMatch(shell, /function BuildPreparation\s*\(/);
  assert.doesNotMatch(shell, /function WorkWheel\s*\(/);
  assert.doesNotMatch(shell, /data-s2-placeholder="build-preparation"/);
  assert.doesNotMatch(shell, /data-s2-placeholder="work-wheel"/);
  assert.doesNotMatch(shell, /StatusBuildPreparationPanel|StatusCurrentWorkPanel|StatusLedgerRows|StatusLedgerCard/);
  assert.match(shell, /STATUS_OBSERVATORY_PUBLIC_DEFAULT_ENABLED = true/);
  assert.match(publicPage, /StatusLivingStateObservatory/);
  assert.match(publicPage, /buildStatusObservatorySurface/);
  assert.match(publicPage, /StatusLegacyLedgerPage|StatusLedgerFallbackPage/);
});

test('S7 lower support surface maps physical anchors to exact drawer families', async () => {
  await primeStatusObservatoryScenario();
  const ledger = buildStatusDashboardSurface(7070).statusLedger;
  const surface = buildStatusObservatorySurface(ledger);
  const drawers = surface.drawers as typeof surface.drawers & {
    buildPreparation?: {
      title: string;
      rows: typeof surface.buildPreparation.rows;
      reserveRows: typeof surface.buildPreparation.rows;
    };
    currentWork?: {
      title: string;
      rows: typeof surface.workWheel.rows;
      spokes: typeof surface.workWheel.spokes;
    };
  };

  assert.equal(surface.buildPreparation.scales.title, 'Build & Preparation Scales');
  assert.equal(surface.buildPreparation.reserveJars.length, ledger.buildPreparation.reserveRows.length);
  assert.equal(
    surface.buildPreparation.rows.length,
    ledger.buildPreparation.buildRows.length + ledger.buildPreparation.reserveRows.length,
  );
  assert.equal(surface.workWheel.title, 'Current Work Wheel');
  assert.equal(
    surface.workWheel.spokes.length,
    ledger.currentWork.activityTiles.length + ledger.currentWork.rows.length,
  );
  assert.equal(surface.ledgerRail.recentChanges.rows.length, ledger.recentChanges.rows.length);
  assert.equal(surface.ledgerRail.details.rows.length, ledger.details.rows.length);
  assert.equal(drawers.buildPreparation?.rows.length, surface.buildPreparation.rows.length);
  assert.equal(drawers.buildPreparation?.reserveRows.length, surface.buildPreparation.reserveJars.length);
  assert.equal(drawers.currentWork?.rows.length, surface.workWheel.rows.length);
  assert.equal(drawers.currentWork?.spokes.length, surface.workWheel.spokes.length);

  const byFamily = new Map(surface.noLoss.families.map((entry) => [entry.family, entry]));
  assert.equal(byFamily.get('buildPreparation')?.defaultHome, 'buildPreparation.scales + reserveJars');
  assert.equal(byFamily.get('buildPreparation')?.exactHome, 'buildPreparation.rows');
  assert.equal(byFamily.get('currentWork')?.defaultHome, 'workWheel');
  assert.equal(byFamily.get('currentWork')?.exactHome, 'workWheel.spokes');
  assert.equal(byFamily.get('recentChanges')?.exactHome, 'drawers.recentChanges');
  assert.equal(byFamily.get('details')?.exactHome, 'drawers.calculation');
});

test('S7 support instruments render physical anchors, drawer triggers, and no default row dumps', () => {
  const scales = read('src/ui/status/observatory/StatusBuildPreparationScales.tsx');
  const jars = read('src/ui/status/observatory/StatusReserveJars.tsx');
  const wheel = read('src/ui/status/observatory/StatusCurrentWorkTimeWheel.tsx');
  const rail = read('src/ui/status/observatory/StatusFoldedLedgerRail.tsx');
  const drawers = read('src/ui/status/observatory/StatusObservatoryDrawers.tsx');
  const combined = `${scales}\n${jars}\n${wheel}\n${rail}\n${drawers}`;

  const shell = read('src/ui/status/observatory/StatusLivingStateObservatory.tsx');
  assert.match(scales, /data-testid="status-ledger-build-preparation"/);
  assert.match(scales, /data-s7-instrument="build-preparation-scales"/);
  // Jars are decoupled from the scales (V7 sJars own cell): the shell now mounts
  // <StatusReserveJars> in its own obs-region-jars region.
  assert.match(shell, /StatusReserveJars/);
  assert.match(shell, /data-testid="obs-region-jars"/);
  assert.match(scales, /data-scale-state/);
  assert.match(scales, /--scale-tilt/);
  assert.match(scales, /lowStateRows/);
  assert.match(scales, /onOpenDrawer\?\.\(\{\s*kind:\s*'buildPreparation'/);
  assert.match(scales, /Open Build \/ Prep Ledger/);

  assert.match(jars, /data-testid="status-reserve-jars"/);
  assert.match(jars, /data-s7-instrument="reserve-jars"/);
  assert.match(jars, /--jar-fill/);
  assert.match(jars, /jarFillFromText/);
  assert.match(jars, /aria-label=\{/);
  assert.match(jars, /onOpenDrawer\?\.\(\{\s*kind:\s*'buildPreparation'/);

  assert.match(wheel, /data-testid="status-ledger-current-work"/);
  assert.match(wheel, /data-s7-instrument="current-work-time-wheel"/);
  assert.match(wheel, /--segment-index/);
  assert.match(wheel, /--segment-angle/);
  assert.match(wheel, /onAction\?\.\(spoke\.route\)|onAction\(spoke\.route\)/);
  assert.match(wheel, /onOpenDrawer\?\.\(\{\s*kind:\s*'currentWork'/);

  assert.match(rail, /data-testid="status-ledger-details"/);
  assert.match(rail, /data-s7-instrument="folded-ledger-rail"/);
  assert.match(rail, /aria-haspopup="dialog"/);
  assert.match(rail, /aria-expanded=/);
  assert.match(rail, /kind:\s*'recentChanges'/);
  assert.match(rail, /kind:\s*'calculation'/);

  assert.match(drawers, /kind:\s*'buildPreparation'/);
  assert.match(drawers, /kind:\s*'currentWork'/);
  assert.match(drawers, /kind:\s*'recentChanges'/);
  assert.match(drawers, /kind:\s*'calculation'/);
  assert.match(drawers, /data-testid="status-observatory-drawer"/);
  assert.match(drawers, /role="dialog"/);
  assert.match(drawers, /aria-label=/);
  assert.match(drawers, /Close/);
  assert.match(drawers, /onAction\?\.\(action\)|onAction\(action\)/);

  assertPureSupportSource(combined, 'S7 support instruments');
  assert.doesNotMatch(combined, /<table|<tr|<td|role=['"]table['"]|<ul|<ol/);
  assert.doesNotMatch(combined, /StatusLedgerCard|StatusLedgerRows|StatusBuildPreparationPanel|StatusCurrentWorkPanel/);
});

test('S7 stylesheet defines scales, jars, wheel, folded ledgers, drawers, and reduced-motion fallbacks', () => {
  const scss = read('src/ui/status/observatory/StatusLivingStateObservatory.scss');

  for (const selector of [
    'statusBuildPreparationScales',
    'statusBuildPreparationScales__beam',
    'statusBuildPreparationScales__pan',
    'statusReserveJars',
    'statusReserveJars__jar',
    'statusReserveJars__liquid',
    'statusCurrentWorkTimeWheel',
    'statusCurrentWorkTimeWheel__dial',
    'statusCurrentWorkTimeWheel__segment',
    'statusFoldedLedgerRail__foldButton',
    'statusObservatoryDrawer',
    'statusObservatoryDrawer__row',
    'prefers-reduced-motion',
  ]) {
    assert.match(scss, new RegExp(selector), `${selector} styles should exist for S7.`);
  }

  assert.match(scss, /var\(--scale-tilt\)/);
  assert.match(scss, /var\(--jar-fill\)/);
  assert.match(scss, /var\(--segment-angle\)/);
});
