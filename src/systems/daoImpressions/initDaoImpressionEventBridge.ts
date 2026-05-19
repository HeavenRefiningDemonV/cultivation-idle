import { GameEvents, type GameEvent } from '../../services/events/GameEvents.js';
import { awardDaoImpression } from './awardDaoImpression.js';
import { buildDaoImpressionCandidateFromEvent } from './buildDaoImpressionFromEvent.js';
import { clearDaoImpressions } from './daoImpressionStore.js';

let initialized = false;
let handler: ((event: GameEvent) => void) | null = null;

function handleGameEvent(event: GameEvent): void {
  if (event.type === 'rewards/granted') return;
  if (event.type === 'dao/impression_awarded') return;
  if (event.type === 'prestige/performed' || event.type === 'progression/life_started') {
    clearDaoImpressions();
    return;
  }

  const candidate = buildDaoImpressionCandidateFromEvent(event);
  if (!candidate) return;
  awardDaoImpression(candidate);
}

export function initDaoImpressionEventBridge(): void {
  if (initialized) return;
  initialized = true;
  handler = handleGameEvent;
  GameEvents.onAny(handleGameEvent);
}

export function resetDaoImpressionEventBridgeForTests(): void {
  if (handler) {
    GameEvents.offAny(handler);
  }
  handler = null;
  initialized = false;
}

