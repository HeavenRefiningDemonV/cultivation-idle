import { initializeTelemetry } from '../../../src/services/diagnostics/initializeTelemetry.js';
import { useTelemetryStore } from '../../../src/stores/telemetryStore.js';
import type { BalanceTelemetryEvent } from '../../../src/services/diagnostics/balanceTelemetrySchema.js';

export function createBalanceTelemetryHarness() {
  initializeTelemetry();
  const store = useTelemetryStore.getState();
  store.clear();
  store.clearBalanceEvents();

  return {
    get rawEvents() {
      return useTelemetryStore.getState().events;
    },
    get balanceEvents() {
      return useTelemetryStore.getState().balanceEvents.map((entry) => entry.payload);
    },
    byKind<TKind extends BalanceTelemetryEvent['kind']>(kind: TKind) {
      return this.balanceEvents.filter((event): event is Extract<BalanceTelemetryEvent, { kind: TKind }> => event.kind === kind);
    },
    byFamily(family: BalanceTelemetryEvent['family']) {
      return this.balanceEvents.filter((event) => event.family === family);
    },
  };
}
