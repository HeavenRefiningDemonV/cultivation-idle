export const GameClock = {
  nowWall(): number {
    return Date.now();
  },
  nowMono(): number {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now();
    }
    return Date.now();
  },
};

export type GameClockType = typeof GameClock;
