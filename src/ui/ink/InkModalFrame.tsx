import type { ReactNode } from 'react';
import classNames from 'classnames';
import { ModalFrame, type ModalFrameKind } from '../chrome/ModalFrame.js';
import type { InkPanelVariant } from './InkPanel.js';
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
  showCloseButton?: boolean;
  modalKind?: ModalFrameKind;
  children: ReactNode;
}

const VARIANT_TO_SKIN: Record<InkPanelVariant, 'default' | 'apothecary' | 'forge' | 'manual' | 'techniques' | 'prestige' | 'pouch' | 'heartlaw'> = {
  default: 'default',
  apothecary: 'apothecary',
  forge: 'forge',
  manual: 'manual',
  techniques: 'techniques',
  prestige: 'prestige',
  pouch: 'pouch',
  heartlaw: 'heartlaw',
  modal: 'default',
};

export function InkModalFrame({
  isOpen = true,
  onClose,
  header,
  variant = 'modal',
  watermark = false,
  className,
  panelClassName,
  ariaLabel,
  showCloseButton = true,
  modalKind = 'feature',
  children,
}: InkModalFrameProps) {
  return (
    <ModalFrame
      open={isOpen}
      onClose={onClose ?? (() => undefined)}
      kind={modalKind}
      surface="frame"
      frameSkin={VARIANT_TO_SKIN[variant]}
      watermark={watermark}
      header={header}
      showCloseButton={Boolean(onClose) && showCloseButton}
      ariaLabel={ariaLabel}
      className={classNames('inkModalFrame', 'uiChromeDoNotFlatten', className)}
      dialogClassName="inkModalFrame__dialog uiChromeOverlaySurface uiChromeOverlaySurface--modal"
      panelClassName={classNames('inkModalFrame__panel', 'uiChromeOverlaySurface', 'uiChromeOverlaySurface--modal', 'uiChromeTextureLocal', panelClassName)}
    >
      {children}
    </ModalFrame>
  );
}
