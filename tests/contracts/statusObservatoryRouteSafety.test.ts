import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();

function absPath(relPath: string): string {
  return path.join(repoRoot, relPath);
}

function read(relPath: string): string {
  return readFileSync(absPath(relPath), 'utf8');
}

function readIfExists(relPath: string): string {
  return existsSync(absPath(relPath)) ? read(relPath) : '';
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function observatoryTsxSources(): Array<{ relPath: string; source: string }> {
  const dir = absPath('src/ui/status/observatory');
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx'))
    .map((entry) => {
      const relPath = path.join('src/ui/status/observatory', entry.name);
      return { relPath, source: read(relPath) };
    });
}

test('S8 public Status route renders the live Observatory by default and keeps legacy explicit', () => {
  const page = read('src/ui/status/ledger/StatusLedgerPage.tsx');
  const shell = read('src/ui/status/observatory/StatusLivingStateObservatory.tsx');

  assert.match(page, /import\s+\{\s*buildStatusObservatorySurface\s*\}/, 'StatusLedgerPage must import the pure Observatory surface builder.');
  assert.match(page, /StatusLivingStateObservatory/, 'StatusLedgerPage must mount the Observatory renderer in the public path.');
  assert.match(page, /forceLegacy\??:\s*boolean/, 'legacy rendering must be gated by an explicit prop.');
  assert.match(page, /StatusLegacyLedgerPage|StatusLedgerFallbackPage/, 'old card-ledger JSX must live behind a named fallback boundary.');
  assert.match(page, /buildStatusObservatorySurface\(surface\)/, 'StatusLedgerPage must derive Observatory data from the received ledger surface.');
  assert.match(page, /<StatusLivingStateObservatory[\s\S]*surface=\{observatorySurface\}[\s\S]*onAction=\{onAction\}/);
  assert.match(page, /data-ledger-mode="legacy-fallback"|data-status-ledger-fallback="legacy"/);
  assert.match(shell, /STATUS_OBSERVATORY_PUBLIC_DEFAULT_ENABLED = true/, 'S8 flips the public default to the live Observatory.');

  const firstLiveMount = page.indexOf('<StatusLivingStateObservatory');
  const fallbackBoundary = Math.min(
    ...['function StatusLegacyLedgerPage', 'function StatusLedgerFallbackPage', 'const StatusLegacyLedgerPage', 'const StatusLedgerFallbackPage']
      .map((needle) => page.indexOf(needle))
      .filter((index) => index >= 0),
  );
  assert.ok(firstLiveMount >= 0, 'live Observatory mount should exist.');
  assert.ok(fallbackBoundary >= 0, 'explicit fallback boundary should exist.');
});

test('S8 public Status route preserves S0-S7 anchors through the Observatory surface', () => {
  const sources = [
    read('src/ui/status/ledger/StatusLedgerPage.tsx'),
    read('src/ui/status/observatory/StatusLivingStateObservatory.tsx'),
    read('src/ui/status/observatory/StatusLifeDecreeScroll.tsx'),
    read('src/ui/status/observatory/StatusVitalsSealRibbon.tsx'),
    read('src/ui/status/observatory/StatusRootLawCoupledInstrument.tsx'),
    read('src/ui/status/observatory/StatusMeridianVesselCompass.tsx'),
    read('src/ui/status/observatory/StatusBottleneckTalismanCanopy.tsx'),
    read('src/ui/status/observatory/StatusStatMeridianConstellation.tsx'),
    read('src/ui/status/observatory/StatusBuildPreparationScales.tsx'),
    read('src/ui/status/observatory/StatusCurrentWorkTimeWheel.tsx'),
    read('src/ui/status/observatory/StatusFoldedLedgerRail.tsx'),
  ].join('\n');

  for (const id of [
    'status-ledger-root',
    'status-ledger-hero',
    'status-ledger-metrics',
    'status-current-state',
    'status-ledger-grid',
    'status-ledger-details',
    'status-ledger-current-work',
    'status-ledger-build-preparation',
    'status-ledger-mission-requirements',
    'status-ledger-cultivation-base',
    'status-root-law-instrument',
    'status-stat-constellation',
    'status-bottleneck-canopy',
  ]) {
    assert.match(sources, new RegExp(escapeRegex(id)), `${id} must stay available after public cutover.`);
  }
});

test('S8 visual Observatory components stay pure and route through action surfaces only', () => {
  for (const { relPath, source } of observatoryTsxSources()) {
    assert.doesNotMatch(source, /from ['"].*stores\//, `${relPath} must not import Zustand stores.`);
    assert.doesNotMatch(source, /useUIStore/, `${relPath} must not import UI store helpers.`);
    assert.doesNotMatch(source, /\.getState\s*\(/, `${relPath} must not read stores.`);
    assert.doesNotMatch(source, /RewardService|grantRewards|spendCurrency|addItem|addManual|addFragment/, `${relPath} must not mutate rewards or inventory.`);
    assert.doesNotMatch(source, /CombatStore|useCombatStore|resolveCombat|startCombat/, `${relPath} must not import or drive combat.`);
    assert.doesNotMatch(source, /TrialStore|useTrialStore|startTrial|resolveTrial/, `${relPath} must not import or drive trial lifecycle.`);
    assert.doesNotMatch(source, /PrestigeResetService|performPrestigeReset|resetPrestige/, `${relPath} must not import or drive prestige reset.`);
    assert.doesNotMatch(source, /breakthrough\s*\(/, `${relPath} must not trigger breakthrough.`);
    assert.doesNotMatch(source, /performStatusLedgerAction|performStatusRouteTarget/, `${relPath} must not call the route adapter directly.`);
  }

  const page = read('src/ui/status/ledger/StatusLedgerPage.tsx');
  assert.doesNotMatch(page, /from ['"].*stores\//, 'StatusLedgerPage must not import stores.');
  assert.doesNotMatch(page, /\.getState\s*\(/, 'StatusLedgerPage must not read stores.');
  assert.doesNotMatch(page, /RewardService|CombatStore|TrialStore|PrestigeResetService|breakthrough\s*\(/, 'StatusLedgerPage must not mutate gameplay owners.');
});

test('S8 StatusScreen keeps drawer ownership and route adapter containment', () => {
  const screen = read('src/components/screens/StatusScreen.tsx');
  const routeAdapter = read('src/systems/ui/status/statusRouteActions.ts');

  assert.match(screen, /useStatusDashboardSurface\(\)/, 'StatusScreen should remain the live Status surface owner.');
  assert.match(screen, /surface\.statusLedger/, 'StatusScreen should pass the ledger surface to the renderer boundary.');
  assert.match(screen, /performStatusLedgerAction\(action\)/, 'StatusScreen should route all Status actions through the adapter.');
  assert.match(screen, /<SpiritRootObservationDrawer/, 'StatusScreen should remain Spirit Root drawer owner.');
  assert.match(screen, /surface\.statusLedger\.spiritRootObservation/, 'Spirit Root drawer should keep using Status-owned live surface data.');

  assert.match(routeAdapter, /status_observation[\s\S]*openSpiritRootObservation/, 'route adapter should own Spirit Root observation opening.');
  assert.match(routeAdapter, /dao_heart_sanctuary[\s\S]*openDaoHeartModal/, 'route adapter should own Dao Heart modal opening.');
  assert.doesNotMatch(routeAdapter, /RewardService|grantRewards|CombatStore|useCombatStore|TrialStore|PrestigeResetService|breakthrough\s*\(/);

  for (const relPath of [
    'src/ui/status/ledger/StatusLedgerPage.tsx',
    ...observatoryTsxSources().map((entry) => entry.relPath),
  ]) {
    const source = readIfExists(relPath);
    assert.doesNotMatch(source, /openSpiritRootObservation|openDaoHeartModal|setActiveTab|openWorldBuildingModal/, `${relPath} should forward actions rather than mutate route state.`);
  }
});
