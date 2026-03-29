import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { Modal } from '../primitives/Modal.js';
import { FrameCard, type FrameCardSkin } from './FrameCard.js';
import './ModalFrame.scss';

export type ModalFrameKind = 'detail' | 'feature' | 'blocking';
export type ModalFrameSurface = 'frame' | 'none';

export interface ModalFrameProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  kind?: ModalFrameKind;
  surface?: ModalFrameSurface;
  header?: ReactNode;
  frameSkin?: FrameCardSkin;
  watermark?: boolean;
  showCloseButton?: boolean;
  closeButtonLabel?: string;
  className?: string;
  overlayClassName?: string;
  dialogClassName?: string;
  panelClassName?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
}

export function ModalFrame({
  open,
  onClose,
  children,
  kind = 'feature',
  surface = 'frame',
  header,
  frameSkin = 'default',
  watermark = false,
  showCloseButton = true,
  closeButtonLabel = 'Close modal',
  className,
  overlayClassName,
  dialogClassName,
  panelClassName,
  ariaLabel,
  ariaLabelledby,
}: ModalFrameProps) {
  if (typeof document === 'undefined') return null;

  const modalNode = (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={ariaLabel}
      ariaLabelledby={ariaLabelledby}
      overlayClassName={classNames('modalFrame', `modalFrame--${kind}`, `modalFrame--surface-${surface}`, className, overlayClassName)}
      panelClassName={classNames('modalFrame__dialog', dialogClassName)}
    >
      {surface === 'frame' ? (
        <FrameCard variant="modal" skin={frameSkin} watermark={watermark} className={classNames('modalFrame__panel', panelClassName)}>
          {header ? <div className="modalFrame__header">{header}</div> : null}
          {showCloseButton ? (
            <button type="button" className="modalFrame__close" onClick={onClose} aria-label={closeButtonLabel}>×</button>
          ) : null}
          <div className="modalFrame__content">{children}</div>
        </FrameCard>
      ) : (
        <div className={classNames('modalFrame__panel', 'modalFrame__panel--surface-none', panelClassName)}>
          {header ? <div className="modalFrame__header">{header}</div> : null}
          {showCloseButton ? (
            <button type="button" className="modalFrame__close" onClick={onClose} aria-label={closeButtonLabel}>×</button>
          ) : null}
          <div className="modalFrame__content">{children}</div>
        </div>
      )}
    </Modal>
  );

  return createPortal(modalNode, document.body);
}
