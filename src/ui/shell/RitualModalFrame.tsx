import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { InkModalFrame } from '../ink/InkModalFrame.js';
import { PlaqueHeader } from './PlaqueHeader.js';
import './RitualModalFrame.scss';

export type RitualModalFrameVariant = 'ritual' | 'chapterEnd' | 'summary';
export type RitualModalFrameSize = 'md' | 'lg';
export const RITUAL_MODAL_FRAME_VARIANT_OPTIONS = ['ritual', 'chapterEnd', 'summary'] as const satisfies readonly RitualModalFrameVariant[];
export const RITUAL_MODAL_FRAME_SIZE_OPTIONS = ['md', 'lg'] as const satisfies readonly RitualModalFrameSize[];

export interface RitualModalFrameProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  header?: ReactNode;
  meta?: ReactNode;
  ornament?: ReactNode;
  footer?: ReactNode;
  variant?: RitualModalFrameVariant;
  size?: RitualModalFrameSize;
  scrollBody?: boolean;
  showCloseButton?: boolean;
  className?: string;
  panelClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  children: ReactNode;
}

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

export function RitualModalFrame({
  open,
  onClose,
  title,
  subtitle,
  header,
  meta,
  ornament,
  footer,
  variant = 'ritual',
  size = 'md',
  scrollBody = true,
  showCloseButton = true,
  className,
  panelClassName,
  bodyClassName,
  footerClassName,
  ariaLabel,
  ariaLabelledBy,
  children,
}: RitualModalFrameProps) {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const bodyPaddingRef = useRef<string>('');
  const focusScopeRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollState, setScrollState] = useState({ top: false, bottom: false });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const headerLabelId = useId();
  if (import.meta.env.DEV && header && (title !== undefined || subtitle !== undefined || meta !== undefined)) {
    console.warn('[RitualModalFrame] `header` takes precedence; title/subtitle/meta auto-header inputs are ignored.');
  }

  const resolvedHeader = header ?? ((title || subtitle || meta)
    ? (
      <PlaqueHeader
        title={title ?? ''}
        subtitle={subtitle}
        variant="section"
        emphasis={variant === 'ritual' ? 'strong' : 'medium'}
        density="default"
        endSlot={meta}
        className="ritualModalFrame__autoHeader"
      />
    )
    : null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    bodyPaddingRef.current = document.body.style.paddingRight;

    const computedPadding = parseFloat(window.getComputedStyle(document.body).paddingRight || '0');
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${computedPadding + scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = bodyPaddingRef.current;
      const previous = previousFocusRef.current;
      if (previous && previous.isConnected && typeof previous.focus === 'function') {
        previous.focus();
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const target = getFocusableElements(focusScopeRef.current)[0] ?? focusScopeRef.current;
    requestAnimationFrame(() => {
      target?.focus();
    });
  }, [open]);

  useEffect(() => {
    if (!open || !scrollBody) return;
    const container = scrollRef.current;
    if (!container) return;

    const updateShadows = () => {
      const max = container.scrollHeight - container.clientHeight;
      setScrollState({
        top: container.scrollTop > 1,
        bottom: container.scrollTop < max - 1,
      });
    };

    updateShadows();
    container.addEventListener('scroll', updateShadows, { passive: true });
    return () => container.removeEventListener('scroll', updateShadows);
  }, [open, scrollBody]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;

    const focusables = getFocusableElements(focusScopeRef.current);
    if (focusables.length === 0) {
      event.preventDefault();
      focusScopeRef.current?.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const current = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (!current || current === first || current === focusScopeRef.current) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (!current || current === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!open || typeof document === 'undefined') return null;

  const internalHeaderId = resolvedHeader && !ariaLabelledBy ? headerLabelId : undefined;
  const resolvedAriaLabelledBy = ariaLabelledBy ?? internalHeaderId;

  return createPortal(
    <InkModalFrame
      isOpen={open}
      onClose={onClose}
      size={size}
      tone={variant === 'chapterEnd' ? 'chapterEnd' : variant === 'summary' ? 'summary' : 'ritual'}
      surface="ritual"
      density="roomy"
      showCloseButton={showCloseButton}
      closeButtonLabel="Close ritual modal"
      ariaLabel={ariaLabel ?? (typeof title === 'string' ? title : 'Ritual modal')}
      ariaLabelledby={resolvedAriaLabelledBy}
      className={classNames(
        'ritualModalFrame',
        `ritualModalFrame--${variant}`,
        { 'ritualModalFrame--static': prefersReducedMotion },
        className,
      )}
      panelClassName={classNames('ritualModalFrame__panel', panelClassName)}
      panelRef={(node) => { focusScopeRef.current = node; }}
      contentScrollOwner={scrollBody}
      panelOnKeyDown={handleKeyDown}
    >
      <div className="ritualModalFrame__inner" tabIndex={-1}>
        {resolvedHeader ? <header className="ritualModalFrame__header" id={internalHeaderId}>{resolvedHeader}</header> : null}
        {ornament ? <div className="ritualModalFrame__ornament">{ornament}</div> : null}

        <div
          className={classNames(
            'ritualModalFrame__body',
            { 'ritualModalFrame__body--scroll': scrollBody },
            {
              'ritualModalFrame__body--shadowTop': scrollBody && scrollState.top,
              'ritualModalFrame__body--shadowBottom': scrollBody && scrollState.bottom,
            },
            bodyClassName,
          )}
          ref={scrollBody ? scrollRef : undefined}
        >
          {scrollBody ? <div className="ritualModalFrame__scrollShadow ritualModalFrame__scrollShadow--top" aria-hidden="true" /> : null}
          <div className="ritualModalFrame__content">{children}</div>
          {scrollBody ? <div className="ritualModalFrame__scrollShadow ritualModalFrame__scrollShadow--bottom" aria-hidden="true" /> : null}
        </div>

        {footer ? <footer className={classNames('ritualModalFrame__footer', footerClassName)}>{footer}</footer> : null}
      </div>
    </InkModalFrame>,
    document.body,
  );
}
