import type { CSSProperties, ReactNode } from 'react';
import './ScenicBackdropMount.scss';

export interface ScenicBackdropMountProps {
  screenKey: string;
  active?: boolean;
  className?: string;
  style?: CSSProperties;
  backdropImage?: string;
  overlayImage?: string;
  children?: ReactNode;
}

export function ScenicBackdropMount({
  screenKey,
  active = true,
  className,
  style,
  backdropImage,
  overlayImage,
  children,
}: ScenicBackdropMountProps) {
  if (!active) {
    return null;
  }

  const classNames = ['uiScreenCompositionBackdrop', 'uiScenicBasePlane', 'uiPreserveBaseArt', 'scenicBackdropMount', className].filter(Boolean).join(' ');

  return (
    <div
      aria-hidden="true"
      className={classNames}
      data-scenic-backdrop="true"
      data-scenic-base="true"
      data-preserve-base-art="true"
      data-screen-key={screenKey}
      style={{ ...(backdropImage ? { backgroundImage: `url(${backdropImage})` } : null), ...style }}
    >
      {overlayImage ? (
        <div
          className="uiScreenCompositionTexture scenicBackdropMount__overlay"
          style={{ backgroundImage: `url(${overlayImage})` }}
        />
      ) : null}
      {children}
    </div>
  );
}
