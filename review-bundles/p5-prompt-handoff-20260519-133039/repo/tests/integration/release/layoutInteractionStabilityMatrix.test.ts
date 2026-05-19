import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDiagnosticsBundle } from '../../../src/services/diagnostics/buildDiagnosticsBundle.js';
import { buildBalanceTelemetryCsvFiles, buildBalanceTelemetryExportEnvelope, serializeBalanceTelemetryExport } from '../../../src/services/diagnostics/balanceTelemetryExport.js';
import { useCityStore } from '../../../src/stores/cityStore.js';
import { useTechniqueStore } from '../../../src/stores/techniqueStore.js';
import { useUIStore } from '../../../src/stores/uiStore.js';
import { useTelemetryStore } from '../../../src/stores/telemetryStore.js';
import { useGameStore } from '../../../src/stores/gameStore.js';
import { useHeartLawStore } from '../../../src/stores/heartLawStore.js';
import { seedScenario } from '../../helpers/release/saveReloadHarness.js';

void test('release interaction sanity: same-target city and loadout actions are idempotent/bounded', async () => {
  await seedScenario('after_city_unlock');

  const cityStore = useCityStore.getState();
  cityStore.setCurrentCity('city_stonecrag_town');
  const afterFirstCity = useCityStore.getState();
  cityStore.setCurrentCity('city_stonecrag_town');
  const afterSecondCity = useCityStore.getState();

  assert.equal(afterFirstCity, afterSecondCity);

  const techniqueStore = useTechniqueStore.getState();
  const beforeLoadout = useTechniqueStore.getState();
  techniqueStore.setSelectedLoadout('loadout_2');
  const afterFirstLoadout = useTechniqueStore.getState();
  techniqueStore.setSelectedLoadout('loadout_2');
  const afterSecondLoadout = useTechniqueStore.getState();

  assert.notEqual(beforeLoadout, afterFirstLoadout);
  assert.equal(afterFirstLoadout, afterSecondLoadout);
});

void test('release interaction sanity: tab + modal shell transitions do not leak obvious state', async () => {
  await seedScenario('after_city_unlock');

  const ui = useUIStore.getState();
  ui.setActiveTab('adventure');
  const tabAfterFirst = useUIStore.getState();
  ui.setActiveTab('adventure');
  assert.equal(useUIStore.getState(), tabAfterFirst);

  ui.openWorldBuildingModal({ cityId: 'city_stonecrag_town', buildingKey: 'outskirts' });
  const openState = useUIStore.getState();
  assert.equal(openState.showWorldBuildingModal, true);
  ui.openWorldBuildingModal({ cityId: 'city_stonecrag_town', buildingKey: 'outskirts' });
  assert.equal(useUIStore.getState(), openState);

  ui.closeWorldBuildingModal();
  const closedState = useUIStore.getState();
  assert.equal(closedState.showWorldBuildingModal, false);
  ui.closeWorldBuildingModal();
  assert.equal(useUIStore.getState(), closedState);

  ui.openLifeSummaryModal('current');
  const lifeSummaryOpen = useUIStore.getState();
  ui.openLifeSummaryModal('current');
  assert.equal(useUIStore.getState(), lifeSummaryOpen);
  ui.closeLifeSummaryModal();
  ui.closeLifeSummaryModal();
  assert.equal(useUIStore.getState().showLifeSummaryModal, false);
});

void test('release interaction sanity: diagnostics/telemetry read/export builders are side-effect free', async () => {
  await seedScenario('after_city_unlock');
  const telemetryBefore = useTelemetryStore.getState();
  const gameBefore = useGameStore.getState();
  const uiBefore = useUIStore.getState();
  const heartLawBefore = useHeartLawStore.getState();

  const bundleA = buildDiagnosticsBundle();
  const bundleB = buildDiagnosticsBundle();
  assert.equal(bundleA.schemaVersion, bundleB.schemaVersion);

  const telemetryEvents = [...telemetryBefore.balanceEvents.map((entry) => entry.payload)];
  const envelope = buildBalanceTelemetryExportEnvelope({
    events: telemetryEvents,
    balanceCaptureEnabled: telemetryBefore.balanceCaptureEnabled,
    maxBalanceEvents: telemetryBefore.maxBalanceEvents,
    exportedAt: 1,
    app: { name: 'cultivation-idle', mode: 'test' },
  });
  const serialized = serializeBalanceTelemetryExport(envelope);
  const csvFiles = buildBalanceTelemetryCsvFiles(telemetryEvents);

  assert.equal(typeof serialized, 'string');
  assert.equal(Object.keys(csvFiles).length >= 3, true);

  assert.equal(useTelemetryStore.getState(), telemetryBefore);
  assert.equal(useGameStore.getState(), gameBefore);
  assert.equal(useUIStore.getState(), uiBefore);
  assert.equal(useHeartLawStore.getState(), heartLawBefore);
});
