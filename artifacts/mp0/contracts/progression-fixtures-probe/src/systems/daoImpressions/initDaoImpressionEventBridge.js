import { GameEvents } from '../../services/events/GameEvents.js';
import { awardDaoImpression } from './awardDaoImpression.js';
import { buildDaoImpressionCandidateFromEvent } from './buildDaoImpressionFromEvent.js';
import { clearDaoImpressions } from './daoImpressionStore.js';
let initialized = false;
let handler = null;
function handleGameEvent(event) {
    if (event.type === 'rewards/granted')
        return;
    if (event.type === 'dao/impression_awarded')
        return;
    if (event.type === 'prestige/performed' || event.type === 'progression/life_started') {
        clearDaoImpressions();
        return;
    }
    const candidate = buildDaoImpressionCandidateFromEvent(event);
    if (!candidate)
        return;
    awardDaoImpression(candidate);
}
export function initDaoImpressionEventBridge() {
    if (initialized)
        return;
    initialized = true;
    handler = handleGameEvent;
    GameEvents.onAny(handleGameEvent);
}
export function resetDaoImpressionEventBridgeForTests() {
    if (handler) {
        GameEvents.offAny(handler);
    }
    handler = null;
    initialized = false;
}
