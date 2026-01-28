import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from './Modal';
import { PaperCard } from '../paper';
import './DetailScrollModal.scss';

export interface DetailScrollModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) return [] as HTMLElement[];
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors.join(','))).filter(
    (element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'),
  );
};

const getScrollbarWidth = () => Math.max(0, window.innerWidth - document.documentElement.clientWidth);

export function DetailScrollModal({ open, title, subtitle, meta, onClose, children }: DetailScrollModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bodyPaddingRef = useRef<string>('');
  const [scrollState, setScrollState] = useState({ canScrollUp: false, canScrollDown: false });

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    bodyPaddingRef.current = document.body.style.paddingRight;
    const computedPadding = parseFloat(window.getComputedStyle(document.body).paddingRight || '0');
    const scrollbarWidth = getScrollbarWidth();
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${((computedPadding + scrollbarWidth) / 1920) * 100}vw`;
    }
    return () => {
      document.body.style.paddingRight = bodyPaddingRef.current;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTop = 0;
    }
    const dialog = panelRef.current;
    const focusables = getFocusableElements(dialog);
    const target = focusables[0] ?? dialog;
    if (target) {
      requestAnimationFrame(() => {
        target.focus();
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const updateScrollState = () => {
      const canScrollUp = container.scrollTop > 0;
      const canScrollDown = container.scrollTop + container.clientHeight < container.scrollHeight - 1;
      setScrollState({ canScrollUp, canScrollDown });
    };
    updateScrollState();
    container.addEventListener('scroll', updateScrollState, { passive: true });
    return () => container.removeEventListener('scroll', updateScrollState);
  }, [open]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const focusables = getFocusableElements(panelRef.current);
    if (focusables.length === 0) {
      event.preventDefault();
      panelRef.current?.focus();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const current = document.activeElement as HTMLElement | null;
    if (event.shiftKey) {
      if (!current || current === first || !focusables.includes(current)) {
        event.preventDefault();
        last.focus();
      }
    } else if (!current || current === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <Modal
      open={open}
      onClose={onClose}
      overlayClassName="detailScrollModalOverlay"
      panelClassName={`detailScrollModalPanelWrapper${prefersReducedMotion ? ' detailScrollModalPanelWrapper--static' : ''}`}
      ariaLabelledby={titleId}
    >
      <div className="detailScrollModalPanel" ref={panelRef} onKeyDown={handleKeyDown} tabIndex={-1}>
        <PaperCard variant="tray" className="detailScrollModalCard">
          <div className="detailScrollModalHeader">
            <div className="detailScrollModalHeading">
              <div className="detailScrollModalTitle" id={titleId}>
                {title}
              </div>
              {subtitle ? <div className="detailScrollModalSubtitle">{subtitle}</div> : null}
            </div>
            <div className="detailScrollModalMeta">
              {meta}
              <button type="button" className="detailScrollModalClose" onClick={onClose} aria-label="Close">
                ×
              </button>
            </div>
          </div>
          <div
            className={`detailScrollModalBody${
              scrollState.canScrollUp ? ' detailScrollModalBody--shadowTop' : ''
            }${scrollState.canScrollDown ? ' detailScrollModalBody--shadowBottom' : ''}`}
            ref={scrollContainerRef}
          >
            <div className="detailScrollModalShadow detailScrollModalShadow--top" aria-hidden="true" />
            <div className="detailScrollModalContent">{children}</div>
            <div className="detailScrollModalShadow detailScrollModalShadow--bottom" aria-hidden="true" />
          </div>
        </PaperCard>
      </div>
    </Modal>,
    document.body,
  );
}
