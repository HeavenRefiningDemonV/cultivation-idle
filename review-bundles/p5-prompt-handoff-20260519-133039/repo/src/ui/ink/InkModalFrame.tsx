import type { KeyboardEvent, ReactNode } from 'react';
import classNames from 'classnames';
import { InkPanel, type InkPanelDensity, type InkPanelSurface, type InkPanelVariant } from './InkPanel.js';
import './InkModalFrame.scss';

export type InkModalFrameSize = 'md' | 'lg';
export type InkModalFrameTone = 'ritual' | 'summary' | 'chapterEnd';

export interface InkModalFrameProps {
  isOpen?: boolean;
  onClose?: () => void;
  header?: ReactNode;
  variant?: InkPanelVariant;
  surface?: InkPanelSurface;
  density?: InkPanelDensity;
  size?: InkModalFrameSize;
  tone?: InkModalFrameTone;
  watermark?: boolean;
  className?: string;
  panelClassName?: string;
  ariaLabel?: string;
  showCloseButton?: boolean;
  closeButtonLabel?: string;
  ariaLabelledby?: string;
  panelRef?: (element: HTMLDivElement | null) => void;
  contentScrollOwner?: boolean;
  panelOnKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  children: ReactNode;
}

export function InkModalFrame({
  isOpen = true,
  onClose,
  header,
  variant = 'modal',
  surface = 'ritual',
  density = 'roomy',
  size = 'md',
  tone = 'ritual',
  watermark = false,
  className,
  panelClassName,
  ariaLabel,
  showCloseButton = true,
  closeButtonLabel = 'Close',
  ariaLabelledby,
  panelRef,
  contentScrollOwner = false,
  panelOnKeyDown,
  children,
}: InkModalFrameProps) {
  if (!isOpen) return null;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape' || !onClose) return;
    event.preventDefault();
    event.stopPropagation();
    onClose();
  };

  return (
    <div className={classNames('inkModalFrame', `inkModalFrame--${size}`, `inkModalFrame--${tone}`, className)} onKeyDown={handleKeyDown}>
      <div className="inkModalFrame__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="inkModalFrame__dialog" role="dialog" aria-modal="true" aria-label={ariaLabel} aria-labelledby={ariaLabelledby}>
        <InkPanel
          variant={variant}
          surface={surface}
          density={density}
          watermark={watermark}
          header={header}
          className={classNames('inkModalFrame__panel', { 'inkModalFrame__panel--contentScrollOwner': contentScrollOwner }, panelClassName)}
          hostRef={panelRef}
          onKeyDown={panelOnKeyDown}
        >
          {onClose && showCloseButton ? (
            <button type="button" className="inkModalFrame__close uiNoShift" onClick={onClose} aria-label={closeButtonLabel}>
              ×
            </button>
          ) : null}
          {children}
        </InkPanel>
      </div>
    </div>
  );
}
