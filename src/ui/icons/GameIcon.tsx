import type { CSSProperties } from 'react';

import './GameIcon.css';

import { getIconMeta, type IconId } from './iconRegistry';

type GameIconProps = {
  icon: IconId;
  size?: number | string;
  className?: string;
  title?: string;
  decorative?: boolean;
};

export function GameIcon({
  icon,
  size = 16,
  className,
  title,
  decorative = true,
}: GameIconProps) {
  const meta = getIconMeta(icon);
  const scale = meta.scale ?? 1;
  const translateY = meta.translateY ?? 0;
  const resolvedSize = typeof size === 'number' ? `${size}px` : size;
  const style: CSSProperties = {
    width: resolvedSize,
    height: resolvedSize,
    '--icon-scale': scale,
    '--icon-ty': `${translateY}%`,
  } as CSSProperties;
  const rootClassName = ['gameIcon', className].filter(Boolean).join(' ');
  const altText = decorative ? '' : title ?? icon;
  const ariaLabel = decorative ? undefined : title ?? icon;

  return (
    <span className={rootClassName} style={style}>
      {meta.kind === 'svg' ? (
        <meta.Svg
          className="gameIcon__svg"
          aria-hidden={decorative || undefined}
          aria-label={ariaLabel}
          focusable="false"
          role={decorative ? undefined : 'img'}
          title={title}
        />
      ) : (
        <img
          className="gameIcon__image"
          src={meta.src}
          alt={altText}
          aria-hidden={decorative || undefined}
          title={title}
        />
      )}
    </span>
  );
}
