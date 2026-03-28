import type { CSSProperties, ReactNode } from 'react';
import './SafeDomOverlaySlot.scss';

export interface SafeDomOverlaySlotProps {
  screenKey: string;
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function SafeDomOverlaySlot({
  screenKey,
  interactive = true,
  className,
  style,
  children,
}: SafeDomOverlaySlotProps) {
  const classNames = [
    'uiScreenCompositionContentOverlay',
    'safeDomOverlaySlot',
    interactive ? 'safeDomOverlaySlot--interactive' : 'safeDomOverlaySlot--inert',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      style={style}
      data-dom-overlay-slot="true"
      data-screen-key={screenKey}
      data-interactive={interactive ? 'true' : 'false'}
    >
      {children}
    </div>
  );
}
