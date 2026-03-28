const listeners = {};
const anyListeners = new Set();
function on(type, handler) {
    if (!listeners[type]) {
        listeners[type] = new Set();
    }
    listeners[type].add(handler);
}
function off(type, handler) {
    listeners[type]?.delete(handler);
}
function onAny(handler) {
    anyListeners.add(handler);
}
function offAny(handler) {
    anyListeners.delete(handler);
}
function emit(event) {
    const handlers = listeners[event.type];
    handlers?.forEach((handler) => {
        try {
            handler(event);
        }
        catch (error) {
            console.warn('[GameEvents] Handler error for', event.type, error);
        }
    });
    anyListeners.forEach((handler) => {
        try {
            handler(event);
        }
        catch (error) {
            console.warn('[GameEvents] Any-handler error for', event.type, error);
        }
    });
}
export const GameEvents = {
    emit,
    on,
    off,
    onAny,
    offAny,
};
