import type { ReactNode } from 'react';
import classNames from 'classnames';
import { InkPanel, type InkPanelVariant } from './InkPanel';
import './InkModalFrame.scss';

export interface InkModalFrameProps {
  isOpen?: boolean;
  onClose?: () => void;
  header?: ReactNode;
  variant?: InkPanelVariant;
  watermark?: boolean;
  className?: string;
  panelClassName?: string;
  ariaLabel?: string;
  children: ReactNode;
}

export function InkModalFrame({
  isOpen = true,
  onClose,
  header,
  variant = 'modal',
  watermark = false,
  className,
  panelClassName,
  ariaLabel,
  children,
}: InkModalFrameProps) {
  if (!isOpen) return null;

  return (
    <div className={classNames('inkModalFrame', className)}>
      <div className="inkModalFrame__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="inkModalFrame__dialog" role="dialog" aria-modal="true" aria-label={ariaLabel}>
        <InkPanel
          variant={variant}
          watermark={watermark}
          header={header}
          className={classNames('inkModalFrame__panel', panelClassName)}
        >
          {children}
        </InkPanel>
      </div>
    </div>
  );
}
