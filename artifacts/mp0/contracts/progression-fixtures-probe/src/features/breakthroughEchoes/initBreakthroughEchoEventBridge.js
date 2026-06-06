import { GameEvents } from '../../services/events/GameEvents.js';
import { buildBreakthroughEcho } from './buildBreakthroughEcho.js';
import { useBreakthroughEchoStore } from './breakthroughEchoStore.js';
let initialized = false;
let handler = null;
export function initBreakthroughEchoEventBridge() {
    if (initialized)
        return;
    initialized = true;
    handler = (event) => {
        const echo = buildBreakthroughEcho(event);
        if (!echo)
            return;
        useBreakthroughEchoStore.getState().recordEcho(echo);
    };
    GameEvents.on('progression/breakthrough_completed', handler);
}
export function resetBreakthroughEchoEventBridgeForTests() {
    if (handler) {
        GameEvents.off('progression/breakthrough_completed', handler);
    }
    handler = null;
    initialized = false;
}
