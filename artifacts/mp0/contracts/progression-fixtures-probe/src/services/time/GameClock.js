export const GameClock = {
    nowWall() {
        return Date.now();
    },
    nowMono() {
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
            return performance.now();
        }
        return Date.now();
    },
};
