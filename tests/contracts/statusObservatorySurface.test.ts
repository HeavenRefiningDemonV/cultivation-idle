import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

import { buildStatusDashboardSurface } from '../../src/systems/ui/status/statusDashboardSurface.js';
import { buildStatusObservatorySurface } from '../../src/systems/ui/status/statusObservatorySurface.js';
import { primeStatusObservatoryScenario } from './statusObservatoryTestUtils.js';

test('Status Observatory adapter exposes schema, source metadata, and major no-render regions', async () => {
  await primeStatusObservatoryScenario();
  const ledger = buildStatusDashboardSurface(2468).statusLedger;
  const surface = buildStatusObservatorySurface(ledger);

  assert.equal(surface.meta.schemaVersion, 'status-observatory-v1');
  assert.equal(surface.meta.sourceSchemaVersion, 'status-ledger-v1');
  assert.equal(surface.meta.rootTestId, 'status-ledger-root');
  assert.equal(surface.meta.generatedAt, 2468);
  assert.equal(surface.meta.contentLoaded, true);
  assert.equal(surface.meta.currentPath, 'heaven');
  assert.match(surface.meta.visualState, /^(blocked|healthy|postFailure|prestigePressure|contentCap|unknown)$/);
  assert.equal(surface.meta.selectedContext !== null, true);
  assert.equal(surface.rawLedger, ledger);

  assert.equal(surface.lifeDecree.title, 'Life Decree');
  assert.equal(surface.lifeDecree.rootTestId, 'status-ledger-hero');
  assert.equal(surface.vitalsRibbon.rootTestId, 'status-ledger-metrics');
  assert.equal(surface.rootLawInstrument.rootTestId, 'status-root-law-instrument');
  assert.equal(surface.meridianVessel.rootTestId, 'status-current-state');
  assert.equal(surface.statConstellation.rootTestId, 'status-stat-constellation');
  assert.equal(surface.bottleneckCanopy.rootTestId, 'status-bottleneck-canopy');
  assert.equal(surface.buildPreparation.rootTestId, 'status-ledger-build-preparation');
  assert.equal(surface.workWheel.rootTestId, 'status-ledger-current-work');
  assert.equal(surface.ledgerRail.rootTestId, 'status-ledger-details');

  assert.equal(surface.vitalsRibbon.metrics.length, ledger.metrics.length);
  assert.equal(surface.vitalsRibbon.seals.length, ledger.metrics.length);
  assert.deepEqual(
    surface.meridianVessel.organs.map((organ) => organ.id),
    ['cultivation', 'daoHeart', 'spiritRoot', 'training', 'buildPrep', 'activeWork'],
  );
  assert.equal(surface.meridianVessel.focusLens.selectedOrganId, surface.drawers.selectedOrganLens?.id);
  assert.equal(surface.rootLawInstrument.astrolabe.title, 'Spirit Root Astrolabe');
  assert.equal(surface.rootLawInstrument.heartLawSeal.title, 'Heart Law Seal');
  assert.equal(surface.bottleneckCanopy.centralEdict.sourceLabel, 'Status Analysis');
  assert.equal(surface.ledgerRail.noLossFamilies.length, surface.noLoss.families.length);
});

test('Status Observatory adapter stays pure and renderer-free', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'src', 'systems', 'ui', 'status', 'statusObservatorySurface.ts'),
    'utf8',
  );

  assert.doesNotMatch(source, /\.getState\s*\(/, 'Observatory adapter must not read Zustand stores.');
  assert.doesNotMatch(source, /from ['"][^'"]*stores\//, 'Observatory adapter must not import stores.');
  assert.doesNotMatch(source, /RewardService/, 'Observatory adapter must not import RewardService.');
  assert.doesNotMatch(source, /CombatStore|useCombatStore/, 'Observatory adapter must not import CombatStore.');
  assert.doesNotMatch(source, /PrestigeResetService/, 'Observatory adapter must not import PrestigeResetService.');
  assert.doesNotMatch(source, /from ['"]react['"]|from ['"]react\//, 'Observatory adapter must not import React.');
  assert.doesNotMatch(source, /\.(css|scss)['"]/, 'Observatory adapter must not import style files.');
});

test('S8 mounts the Observatory adapter in StatusLedgerPage while retaining explicit fallback', () => {
  const page = readFileSync(
    resolve(process.cwd(), 'src', 'ui', 'status', 'ledger', 'StatusLedgerPage.tsx'),
    'utf8',
  );

  assert.match(page, /StatusLivingStateObservatory/, 'S8 must mount the observatory renderer by default.');
  assert.match(page, /buildStatusObservatorySurface/, 'S8 must build the observatory surface inside StatusLedgerPage.');
  assert.match(page, /StatusLegacyLedgerPage|StatusLedgerFallbackPage/, 'Existing Status card renderer should remain behind explicit fallback.');
  assert.match(page, /forceLegacy\??:\s*boolean/, 'Fallback should require an explicit prop.');
  assert.match(page, /StatusLedgerHero/, 'Existing Status hero renderer should remain available to fallback.');
  assert.match(page, /StatusMetricStrip/, 'Existing metric strip should remain available to fallback.');
  assert.match(page, /StatusDetailsDrawer/, 'Existing details drawer should remain available to fallback.');
});
