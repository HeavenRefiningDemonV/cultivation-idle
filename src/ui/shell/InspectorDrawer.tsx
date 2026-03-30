import type { ReactNode } from 'react';
import classNames from 'classnames';
import { Modal } from '../primitives/Modal.js';
import './InspectorDrawer.scss';

export interface InspectorDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  className?: string;
  panelClassName?: string;
  children: ReactNode;
}

export function InspectorDrawer({
  open,
  onClose,
  title = 'Inspector',
  className,
  panelClassName,
  children,
}: InspectorDrawerProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      overlayClassName={classNames('inspectorDrawerOverlay', className)}
      panelClassName={classNames('inspectorDrawerPanel', panelClassName)}
      ariaLabel={typeof title === 'string' ? title : 'Inspector'}
    >
      <div className="inspectorDrawerSheet" role="document">
        <header className="inspectorDrawerHeader">
          <div className="inspectorDrawerTitle">{title}</div>
          <button type="button" className="inspectorDrawerClose uiNoShift" onClick={onClose} aria-label="Close inspector">
            ×
          </button>
        </header>
        <div className="inspectorDrawerBody">{children}</div>
      </div>
    </Modal>
  );
}
