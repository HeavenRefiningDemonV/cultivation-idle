import { GameEvents } from '../events/GameEvents';
import { formatGameEventSummary, useTelemetryStore } from '../../stores/telemetryStore';

let initialized = false;

export function initializeTelemetry(): void {
  if (initialized) return;
  initialized = true;

  GameEvents.onAny((event) => {
    const ts = (event as { payload?: { timestamp?: number } }).payload?.timestamp ?? Date.now();
    useTelemetryStore.getState().addEvent({
      ts,
      type: event.type,
      summary: formatGameEventSummary(event),
      payload: event.payload,
    });
  });
}
