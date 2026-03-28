import type { CSSProperties } from 'react';
import classNames from 'classnames';
import { chromeAccentAssets } from './chromeAccentAssets.js';
import './OverlaySwash.scss';

export type OverlaySwashVariant = 'shortBar' | 'blockFancy' | 'cornerFrame';
export type OverlaySwashTone = 'default' | 'recommendation' | 'warning';
export type OverlaySwashPlacement = 'fill' | 'center' | 'bottom';

export interface OverlaySwashProps {
  active?: boolean;
  variant?: OverlaySwashVariant;
  tone?: OverlaySwashTone;
  placement?: OverlaySwashPlacement;
  className?: string;
}

export function OverlaySwash({
  active = false,
  variant = 'shortBar',
  tone = 'default',
  placement = 'center',
  className,
}: OverlaySwashProps) {
  return (
    <span
      aria-hidden="true"
      className={classNames(
        'overlaySwash',
        `overlaySwash--variant-${variant}`,
        `overlaySwash--placement-${placement}`,
        `overlaySwash--tone-${tone}`,
        { 'overlaySwash--active': active },
        className,
      )}
      style={{
        '--chrome-accent-bar-short': `url(${chromeAccentAssets.barShort})`,
        '--chrome-accent-block-fancy': `url(${chromeAccentAssets.blockFancy})`,
        '--chrome-accent-corner-frame': `url(${chromeAccentAssets.buttonCorners})`,
      } as CSSProperties}
    />
  );
}
