import type { ReactNode } from 'react';
import classNames from 'classnames';
import { InkModalFrame, type InkModalFrameProps } from '../ink/InkModalFrame.js';
import type { InkPanelVariant } from '../ink/InkPanel.js';

export interface ModalFrameProps {
  isOpen?: boolean;
  onClose?: () => void;
  header?: ReactNode;
  variant?: InkPanelVariant;
  watermark?: boolean;
  className?: string;
  panelClassName?: string;
  ariaLabel?: string;
  showCloseButton?: boolean;
  children: ReactNode;
}

export function ModalFrame({
  isOpen = true,
  onClose,
  header,
  variant = 'modal',
  watermark = false,
  className,
  panelClassName,
  ariaLabel,
  showCloseButton = true,
  children,
}: ModalFrameProps) {
  const props: InkModalFrameProps = {
    isOpen,
    onClose,
    header,
    variant,
    watermark,
    panelClassName,
    ariaLabel,
    showCloseButton,
    children,
    className: classNames('modalFrame', className),
  };

  return <InkModalFrame {...props} />;
}
