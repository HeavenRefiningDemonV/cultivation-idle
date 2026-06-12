import { useEffect, useRef } from 'react';

/**
 * Display-only dialog focus management for the Observatory drawers (W8.2). On open it moves focus
 * into the dialog, traps Tab/Shift-Tab within it, closes on Escape, and on close restores focus to
 * the exact element that was focused when the dialog opened (the trigger). No store imports, no
 * mutation — purely a11y wiring.
 *
 * `onClose` is read through a ref so a fresh inline handler identity (e.g. `() => setActiveDrawer(null)`)
 * does not thrash the trap effect; the effect re-runs only when `open` changes.
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useDialogFocusTrap<T extends HTMLElement = HTMLElement>(open: boolean, onClose: () => void) {
  const dialogRef = useRef<T | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const node = dialogRef.current;
    if (!node) return;

    restoreRef.current = (document.activeElement as HTMLElement) ?? null;
    const focusables = (): HTMLElement[] => Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    (focusables()[0] ?? node).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    node.addEventListener('keydown', onKeyDown);
    return () => {
      node.removeEventListener('keydown', onKeyDown);
      restoreRef.current?.focus?.();
    };
  }, [open]);

  return dialogRef;
}
