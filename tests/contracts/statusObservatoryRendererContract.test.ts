import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();
const observatoryDir = path.join(repoRoot, 'src', 'ui', 'status', 'observatory');

function absPath(relPath: string): string {
  return path.join(repoRoot, relPath);
}

function read(relPath: string): string {
  return readFileSync(absPath(relPath), 'utf8');
}

function readObservatorySources(): string {
  if (!existsSync(observatoryDir)) return '';
  return readdirSync(observatoryDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(ts|tsx|scss)$/.test(entry.name))
    .map((entry) => read(path.join('src', 'ui', 'status', 'observatory', entry.name)))
    .join('\n');
}

test('S2 creates the required fixture-only Status Observatory renderer file family', () => {
  for (const relPath of [
    'src/ui/status/observatory/index.ts',
    'src/ui/status/observatory/StatusLivingStateObservatory.tsx',
    'src/ui/status/observatory/StatusLivingStateObservatory.scss',
    'src/ui/status/observatory/StatusLifeDecreeScroll.tsx',
    'src/ui/status/observatory/StatusVitalsSealRibbon.tsx',
    'src/ui/status/observatory/StatusFoldedLedgerRail.tsx',
  ]) {
    assert.equal(existsSync(absPath(relPath)), true, `${relPath} should exist for S2.`);
  }
});

test('S2 observatory shell exposes the macro regions and root telemetry attributes', () => {
  const source = readObservatorySources();

  for (const required of [
    'StatusObservatorySurfaceV1',
    'data-observatory-root="status-living-state-observatory"',
    'aria-label="Status Living State Observatory"',
    'data-schema-version={surface.meta.schemaVersion}',
    'data-source-schema-version={surface.meta.sourceSchemaVersion}',
    'data-observatory-mode={surface.meta.mode}',
    'data-observatory-visual-state={surface.meta.visualState}',
    "data-current-path={surface.meta.currentPath ?? 'none'}",
    'data-content-loaded={surface.meta.contentLoaded}',
    'statusObservatoryRoot',
    'statusObservatoryCanvas',
  ]) {
    assert.match(source, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  for (const testId of [
    'status-ledger-root',
    'status-ledger-hero',
    'status-ledger-metrics',
    'status-root-law-instrument',
    'status-current-state',
    'status-bottleneck-canopy',
    'status-stat-constellation',
    'status-ledger-build-preparation',
    'status-ledger-current-work',
    'status-ledger-details',
  ]) {
    assert.match(source, new RegExp(testId), `${testId} should be present in the S2 shell.`);
  }
});

test('S2 observatory renderer consumes typed surface data without stores or mutation owners', () => {
  const source = readObservatorySources();

  assert.match(source, /surface:\s*StatusObservatorySurfaceV1/);
  assert.match(source, /StatusObservatorySurfaceV1\['lifeDecree'\]/);
  assert.match(source, /StatusObservatorySurfaceV1\['vitalsRibbon'\]/);
  assert.match(source, /StatusObservatorySurfaceV1\['ledgerRail'\]/);
  assert.match(source, /surface\.lifeDecree/);
  assert.match(source, /surface\.vitalsRibbon/);
  assert.match(source, /surface\.rootLawInstrument/);
  assert.match(source, /surface\.meridianVessel/);
  assert.match(source, /surface\.statConstellation/);
  assert.match(source, /surface\.bottleneckCanopy/);
  assert.match(source, /surface\.buildPreparation/);
  assert.match(source, /surface\.workWheel/);
  assert.match(source, /surface\.ledgerRail/);
  assert.match(source, /surface\.noLoss/);

  assert.doesNotMatch(source, /from ['"].*stores\//, 'S2 renderer must not import stores.');
  assert.doesNotMatch(source, /\.getState\s*\(/, 'S2 renderer must not read stores.');
  assert.doesNotMatch(source, /RewardService|grantRewards|spendCurrency/, 'S2 renderer must not grant or spend rewards.');
  assert.doesNotMatch(source, /CombatStore|useCombatStore/, 'S2 renderer must not import combat owners.');
  assert.doesNotMatch(source, /PrestigeResetService|performPrestigeReset/, 'S2 renderer must not import prestige reset owners.');
  assert.doesNotMatch(source, /breakthrough\s*\(/, 'S2 renderer must not trigger breakthrough.');
});

test('S2 observatory renderer avoids old card-grid classes and generic ledger components', () => {
  const source = readObservatorySources();
  const page = read('src/ui/status/ledger/StatusLedgerPage.tsx');

  assert.doesNotMatch(source, /StatusLedgerCard|StatusLedgerRows|StatusMetricStrip|StatusLedgerHero|StatusCurrentStatePanel/);
  assert.doesNotMatch(source, /statusLedgerGrid|statusLedgerCard/);
  assert.doesNotMatch(source, /<table|<\/table>|<tr|<\/tr>|<td|<\/td>/);
  assert.match(page, /StatusLivingStateObservatory/, 'S8 public Status route should mount the Observatory by default.');
  assert.match(page, /buildStatusObservatorySurface/, 'S8 public Status route should build the Observatory surface from ledger truth.');
  assert.match(page, /StatusLegacyLedgerPage|StatusLedgerFallbackPage/, 'Old ledger rendering should remain explicit fallback only.');
});

test('S2 observatory stylesheet defines a screen-owned canvas grid without old ledger selectors', () => {
  const scss = read('src/ui/status/observatory/StatusLivingStateObservatory.scss');

  assert.match(scss, /\.statusObservatoryRoot/);
  assert.match(scss, /\.statusObservatoryCanvas/);
  assert.match(scss, /display:\s*grid/);
  assert.match(scss, /grid-template-areas/);
  assert.match(scss, /life/);
  assert.match(scss, /vitals/);
  assert.match(scss, /rootLaw/);
  assert.match(scss, /vessel/);
  assert.match(scss, /canopy/);
  assert.match(scss, /constellation/);
  assert.match(scss, /preparation/);
  assert.match(scss, /work/);
  assert.match(scss, /ledgers/);
  assert.doesNotMatch(scss, /statusLedgerGrid|statusLedgerCard/);
});
