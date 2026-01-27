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
  const { src, scale, translateY } = getIconMeta(icon);
  const resolvedSize = typeof size === 'number' ? `${size}px` : size;
  const style: CSSProperties = {
    width: resolvedSize,
    height: resolvedSize,
    '--icon-scale': scale,
    '--icon-ty': `${translateY ?? 0}%`,
  } as CSSProperties;
  const rootClassName = ['gameIcon', className].filter(Boolean).join(' ');
  const altText = decorative ? '' : title ?? icon;

  return (
    <span className={rootClassName} style={style}>
      <img
        className="gameIcon__image"
        src={src}
        alt={altText}
        aria-hidden={decorative || undefined}
        title={title}
      />
    </span>
  );
}
