import { useEffect, useRef, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';

type ModalPanelAttrs = {
  id?: string;
  role?: string;
  style?: CSSProperties;
} & {
  [key in `aria-${string}`]?: string | number | boolean | undefined;
} & {
  [key in `data-${string}`]?: string | number | boolean | undefined;
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  overlayClassName?: string;
  panelClassName?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  panelAttrs?: ModalPanelAttrs;
}

export function Modal({
  open,
  onClose,
  children,
  overlayClassName,
  panelClassName,
  ariaLabel,
  ariaLabelledby,
  panelAttrs,
}: ModalProps) {
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const previousBodyOverflowRef = useRef<string>('');

  useEffect(() => {
    if (!open) return undefined;

    previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    previousBodyOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflowRef.current;
      const previousActiveElement = previousActiveElementRef.current;
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }
    };
  }, [open]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    }
  };

  const handleOverlayMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const stopPropagation = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  if (!open) return null;

  return (
    <div
      className={overlayClassName}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      onKeyDown={handleKeyDown}
      onMouseDown={handleOverlayMouseDown}
    >
      <div className={panelClassName} onMouseDown={stopPropagation} onClick={stopPropagation} {...panelAttrs}>
        {children}
      </div>
    </div>
  );
}
