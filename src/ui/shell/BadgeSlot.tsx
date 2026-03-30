import type { CSSProperties, ReactNode } from 'react';
import classNames from 'classnames';
import { getBadgeSlotStyle, type BadgeSlotPreset } from './badgeSpace.js';

export interface BadgeSlotProps {
  preset: BadgeSlotPreset;
  reserveWhenEmpty?: boolean;
  children?: ReactNode;
  className?: string;
}

const baseStyle: CSSProperties = {
  minInlineSize: 'var(--badge-slot-inline-size, 3rem)',
  minBlockSize: 'var(--badge-slot-block-size, 1.2rem)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  flex: '0 0 auto',
};

const placeholderStyle: CSSProperties = {
  inlineSize: '100%',
  blockSize: '100%',
};

export function BadgeSlot({ preset, reserveWhenEmpty = true, children, className }: BadgeSlotProps) {
  const hasContent = Boolean(children);
  const style = { ...baseStyle, ...getBadgeSlotStyle(preset) } as CSSProperties;

  if (!hasContent && !reserveWhenEmpty) {
    return null;
  }

  return (
    <span
      className={classNames('shellBadgeSlot', `shellBadgeSlot--${preset}`, { 'shellBadgeSlot--empty': !hasContent }, className)}
      style={style}
      aria-hidden={!hasContent ? 'true' : undefined}
    >
      {children ?? <span className="shellBadgeSlot__placeholder" style={placeholderStyle} aria-hidden="true" />}
    </span>
  );
}
