import { useEffect, useState } from 'react';

export function useOutskirtsActiveClock(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) {
      setNow(Date.now());
      return;
    }

    const tick = () => setNow(Date.now());
    tick();

    const intervalId = globalThis.setInterval(tick, 1000);
    return () => globalThis.clearInterval(intervalId);
  }, [active]);

  return now;
}
