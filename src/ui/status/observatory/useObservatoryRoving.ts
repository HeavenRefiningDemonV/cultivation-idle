import { useRef, useState, type KeyboardEvent } from 'react';

/**
 * Display-only arrow-key roving for a flat group of same-role buttons (W8.2): weights / jars /
 * spokes. Mirrors the W5 canopy/constellation/vessel pattern — one tab stop for the group
 * (`tabIndex` 0 on the active item, -1 on the rest), Arrow keys move focus, Home/End jump to the
 * ends. No store imports, no selection state, no mutation: it only moves DOM focus.
 *
 * Usage: spread `getItemProps(i)` onto each button and put `onKeyDown` on the group container.
 */
export function useObservatoryRoving(count: number) {
  const [index, setIndex] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = Math.min(Math.max(index, 0), Math.max(0, count - 1));

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    let target: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        target = Math.min(active + 1, count - 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        target = Math.max(active - 1, 0);
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    if (target === active) return;
    setIndex(target);
    refs.current[target]?.focus();
  };

  const getItemProps = (i: number) => ({
    ref: (el: HTMLButtonElement | null) => {
      refs.current[i] = el;
    },
    tabIndex: i === active ? 0 : -1,
    onFocus: () => setIndex(i),
  });

  return { onKeyDown, getItemProps };
}
