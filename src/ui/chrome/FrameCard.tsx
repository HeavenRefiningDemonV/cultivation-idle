import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import classNames from 'classnames';
import { MotionSafeSelectionSurface } from '../fx/motion/MotionSafeSelectionSurface.js';
import { useNoLayoutShiftState } from './useNoLayoutShiftState.js';
import './FrameCard.scss';
import './layoutStabilityGuards.scss';

export type FrameCardVariant = 'shell' | 'tray' | 'label' | 'inspector' | 'modal' | 'dock';

export type FrameCardSkin =
  | 'default'
  | 'apothecary'
  | 'forge'
  | 'manual'
  | 'techniques'
  | 'prestige'
  | 'pouch'
  | 'heartlaw';

export interface FrameCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: FrameCardVariant;
  skin?: FrameCardSkin;
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  complete?: boolean;
  claimed?: boolean;
  recommended?: boolean;
  warning?: boolean;
  header?: ReactNode;
  watermark?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function FrameCard({
  variant = 'shell',
  skin = 'default',
  interactive = false,
  selected = false,
  disabled = false,
  complete = false,
  claimed = false,
  recommended = false,
  warning = false,
  header,
  watermark = false,
  className,
  style,
  children,
  ...rest
}: FrameCardProps) {
  const noShift = useNoLayoutShiftState({
    selected,
    active: selected,
    recommended,
    warning,
    disabled,
    reserveBadgeSlot: Boolean(header),
  });

  const classes = classNames(
    'frameCard',
    noShift.guardClassName,
    `frameCard--${variant}`,
    `frameCard--skin-${skin}`,
    {
      'frameCard--interactive': interactive,
      'frameCard--selected': selected,
      'frameCard--disabled': disabled,
      'frameCard--complete': complete,
      'frameCard--claimed': claimed,
      'frameCard--recommended': recommended,
      'frameCard--warning': warning,
      'frameCard--watermark': watermark,
    },
    className,
  );

  const content = (
    <>
      {header ? <div className="frameCard__header">{header}</div> : null}
      <div className="frameCard__body">{children}</div>
    </>
  );

  if (interactive) {
    return (
      <MotionSafeSelectionSurface
        className={classes}
        style={style}
        selected={selected || recommended || warning}
        disabled={disabled}
        emphasis="subtle"
        {...noShift.dataAttrs}
        {...rest}
      >
        {content}
      </MotionSafeSelectionSurface>
    );
  }

  return (
    <div className={classes} style={style} {...noShift.dataAttrs} {...rest}>
      {content}
    </div>
  );
}
