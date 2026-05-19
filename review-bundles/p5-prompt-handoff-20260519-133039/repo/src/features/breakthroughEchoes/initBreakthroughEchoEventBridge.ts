import { GameEvents, type GameEventHandler } from '../../services/events/GameEvents.js';
import { buildBreakthroughEcho } from './buildBreakthroughEcho.js';
import { useBreakthroughEchoStore } from './breakthroughEchoStore.js';

let initialized = false;
let handler: GameEventHandler<'progression/breakthrough_completed'> | null = null;

export function initBreakthroughEchoEventBridge(): void {
  if (initialized) return;
  initialized = true;
  handler = (event) => {
    const echo = buildBreakthroughEcho(event);
    if (!echo) return;
    useBreakthroughEchoStore.getState().recordEcho(echo);
  };
  GameEvents.on('progression/breakthrough_completed', handler);
}

export function resetBreakthroughEchoEventBridgeForTests(): void {
  if (handler) {
    GameEvents.off('progression/breakthrough_completed', handler);
  }
  handler = null;
  initialized = false;
}
