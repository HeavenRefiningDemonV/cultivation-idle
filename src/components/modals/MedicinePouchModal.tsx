import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { MedicinePouchPanel } from '../consumables/MedicinePouchPanel';
import { InkModalFrame } from '../../ui/ink';
import { GameIcon } from '../../ui/icons';
import './MedicinePouchModal.scss';

type MedicinePouchModalProps = {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement>;
};

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const getFocusableElements = (container: HTMLElement | null): HTMLElement[] => {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'),
  );
};

export function MedicinePouchModal({ open, onClose, anchorRef }: MedicinePouchModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [shadowState, setShadowState] = useState({ top: false, bottom: false });

  const updateScrollShadows = () => {
    const node = scrollRef.current;
    if (!node) return;
    const { scrollTop, scrollHeight, clientHeight } = node;
    const maxScrollTop = scrollHeight - clientHeight;
    setShadowState({
      top: scrollTop > 6,
      bottom: scrollTop < maxScrollTop - 6,
    });
  };

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const { style } = document.body;
    const previousOverflow = style.overflow;
    const previousPaddingRight = style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;
      const focusables = getFocusableElements(modalRef.current);
      if (!focusables.length) return;
      const currentIndex = focusables.indexOf(document.activeElement as HTMLElement);
      const lastIndex = focusables.length - 1;
      if (event.shiftKey) {
        if (currentIndex <= 0) {
          event.preventDefault();
          focusables[lastIndex]?.focus();
        }
        return;
      }
      if (currentIndex === -1 || currentIndex >= lastIndex) {
        event.preventDefault();
        focusables[0]?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    const scrollNode = scrollRef.current;
    scrollNode?.addEventListener('scroll', updateScrollShadows);
    updateScrollShadows();
    closeButtonRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      scrollNode?.removeEventListener('scroll', updateScrollShadows);
      style.overflow = previousOverflow;
      style.paddingRight = previousPaddingRight;
      if (anchorRef.current) {
        anchorRef.current.focus();
      } else {
        previousFocusRef.current?.focus();
      }
    };
  }, [anchorRef, onClose, open]);

  const scrollShadowTopClass = shadowState.top ? ' medicinePouchScrollShadow--visible' : '';
  const scrollShadowBottomClass = shadowState.bottom ? ' medicinePouchScrollShadow--visible' : '';

  const modalContent = useMemo(
    () => (
      <InkModalFrame
        isOpen={open}
        onClose={onClose}
        variant="pouch"
        ariaLabel="Medicine Pouch"
        className="medicinePouchFrame"
        panelClassName="medicinePouchModal"
      >
        <div className="medicinePouchBody" ref={modalRef}>
          <div className="medicinePouchHeader">
            <div>
              <div className="medicinePouchTitle">Medicine Pouch</div>
              <div className="medicinePouchHint">Configure what you carry into combat.</div>
            </div>
            <button
              type="button"
              className="medicinePouchClose"
              onClick={onClose}
              aria-label="Close Medicine Pouch"
              ref={closeButtonRef}
            >
              <GameIcon icon="inkX" size={14} decorative />
            </button>
          </div>
          <div className="medicinePouchScroll" ref={scrollRef}>
            <div className={`medicinePouchScrollShadow medicinePouchScrollShadow--top${scrollShadowTopClass}`} />
            <div className={`medicinePouchScrollShadow medicinePouchScrollShadow--bottom${scrollShadowBottomClass}`} />
            <MedicinePouchPanel variant="modal" />
          </div>
        </div>
      </InkModalFrame>
    ),
    [onClose, open, scrollShadowBottomClass, scrollShadowTopClass],
  );

  if (!open) return null;

  return createPortal(modalContent, document.body);
}
