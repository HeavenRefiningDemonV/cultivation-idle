import { useEffect, useRef } from 'react';
import type { AriaRole, CSSProperties, ReactNode } from 'react';
import classNames from 'classnames';
import { Modal } from '../primitives/Modal.js';
import './InspectorDrawer.scss';

export type InspectorDrawerHeaderMode = 'title' | 'close-only';
export const INSPECTOR_DRAWER_HEADER_MODE_OPTIONS = ['title', 'close-only'] as const satisfies readonly InspectorDrawerHeaderMode[];

export type InspectorDrawerHostAttrs = {
  id?: string;
  role?: AriaRole;
  style?: CSSProperties;
} & {
  [key in `aria-${string}`]?: string | number | boolean | undefined;
} & {
  [key in `data-${string}`]?: string | number | boolean | undefined;
};

export interface InspectorDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  headerMode?: InspectorDrawerHeaderMode;
  closeLabel?: string;
  hostAttrs?: InspectorDrawerHostAttrs;
  className?: string;
  panelClassName?: string;
  children: ReactNode;
}

export function InspectorDrawer({
  open,
  onClose,
  title = 'Inspector',
  headerMode = 'title',
  closeLabel = 'Close inspector',
  hostAttrs,
  className,
  panelClassName,
  children,
}: InspectorDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      overlayClassName={classNames('inspectorDrawerOverlay', className)}
      panelClassName={classNames('inspectorDrawerPanel', panelClassName)}
      ariaLabel={title}
      panelAttrs={hostAttrs}
    >
      <div className="inspectorDrawerSheet" role="document">
        <header className="inspectorDrawerHeader">
          {headerMode === 'title' ? <div className="inspectorDrawerTitle">{title}</div> : <span className="inspectorDrawerTitleSpacer" aria-hidden="true" />}
          <button ref={closeButtonRef} type="button" className="inspectorDrawerClose uiNoShift" onClick={onClose} aria-label={closeLabel}>
            ×
          </button>
        </header>
        <div className="inspectorDrawerBody">{children}</div>
      </div>
    </Modal>
  );
}
