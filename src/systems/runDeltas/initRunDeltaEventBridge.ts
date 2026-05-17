import { GameEvents, type GameEvent } from '../../services/events/GameEvents.js';
import { buildRunDeltaFromEvent } from './buildRunDeltaFromEvent.js';
import { clearRunDeltas, pushRunDelta } from './runDeltaStore.js';

let initialized = false;

function handleGameEvent(event: GameEvent): void {
  const result = buildRunDeltaFromEvent(event);
  if (result.kind === 'ignore') return;
  if (result.kind === 'clear_then_push') {
    clearRunDeltas();
    pushRunDelta(result.delta);
    return;
  }
  pushRunDelta(result.delta);
}

export function initRunDeltaEventBridge(): void {
  if (initialized) return;
  initialized = true;
  GameEvents.onAny(handleGameEvent);
}

export function resetRunDeltaEventBridgeForTests(): void {
  if (!initialized) return;
  GameEvents.offAny(handleGameEvent);
  initialized = false;
}
