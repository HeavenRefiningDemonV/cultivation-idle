import { useEffect, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import classNames from 'classnames';

export type ForgeOverlaySide = 'left' | 'right';

export interface ForgeOverlayPanelProps {
  open: boolean;
  title: string;
  side?: ForgeOverlaySide;
  onClose: () => void;
  children: ReactNode;
  triggerRef?: RefObject<HTMLElement>;
}

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) return [] as HTMLElement[];
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  return Array.from(container.querySelectorAll<HTMLElement>(selectors.join(','))).filter(
    (element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'),
  );
};

export function ForgeOverlayPanel({
  open,
  title,
  side = 'right',
  onClose,
  children,
  triggerRef,
}: ForgeOverlayPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    lastFocusedRef.current = (triggerRef?.current ?? document.activeElement) as HTMLElement | null;
    const focusables = getFocusableElements(panelRef.current);
    const target = focusables[0] ?? panelRef.current;
    requestAnimationFrame(() => target?.focus());
    return () => {
      lastFocusedRef.current?.focus();
    };
  }, [open, triggerRef]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = getFocusableElements(panelRef.current);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey) {
        if (active === first || active === panelRef.current) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="forgeOverlay" onClick={onClose}>
      <div
        className={classNames('forgeOverlayPanel', `forgeOverlayPanel--${side}`)}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={panelRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
