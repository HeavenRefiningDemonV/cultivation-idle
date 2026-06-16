import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();

function absPath(relPath: string): string {
  return path.join(repoRoot, relPath);
}

function read(relPath: string): string {
  return readFileSync(absPath(relPath), 'utf8');
}

test('S8 mounts the Status Observatory renderer on the default ledger path', () => {
  const page = read('src/ui/status/ledger/StatusLedgerPage.tsx');

  assert.equal(
    existsSync(absPath('src/ui/status/observatory/StatusLivingStateObservatory.tsx')),
    true,
    'Status Observatory renderer should exist.',
  );
  assert.match(
    read('src/ui/status/observatory/index.ts'),
    /StatusLivingStateObservatory/,
    'Observatory folder should export the renderer.',
  );
  assert.match(page, /StatusLivingStateObservatory/, 'S8 default public Status should mount the Observatory renderer.');
  assert.match(page, /buildStatusObservatorySurface/);
  assert.match(page, /forceLegacy\??:\s*boolean/);
  assert.match(page, /StatusLegacyLedgerPage|StatusLedgerFallbackPage/);
});

test('S8 keeps existing public Status anchors in the live Observatory renderer', () => {
  const src = [
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
    'status-ledger-cultivation-base',
    'status-ledger-mission-requirements',
    'status-ledger-current-work',
    'status-ledger-build-preparation',
    'status-ledger-details',
    'status-root-law-instrument',
    'status-bottleneck-canopy',
    'status-stat-constellation',
  ]) {
    assert.match(src, new RegExp(id));
  }
});
