import type { ReactNode } from 'react';
import classNames from 'classnames';
import { useNoLayoutShiftState } from './useNoLayoutShiftState.js';
import './ChromeChip.scss';
import './layoutStabilityGuards.scss';

export type ChromeChipVariant = 'pill' | 'tag' | 'microLabel';
export type ChromeChipTone = 'neutral' | 'ink' | 'success' | 'danger' | 'rare' | 'merit' | 'warning' | 'recommendation';

export interface ChromeChipProps {
  variant?: ChromeChipVariant;
  icon?: ReactNode;
  text: string;
  tone?: ChromeChipTone;
  onClick?: () => void;
  className?: string;
  title?: string;
}

export function ChromeChip({
  variant = 'pill',
  icon,
  text,
  tone = 'neutral',
  onClick,
  className,
  title,
}: ChromeChipProps) {
  const noShift = useNoLayoutShiftState({
    recommended: tone === 'recommendation',
    warning: tone === 'warning' || tone === 'danger',
    reserveIconSlot: true,
  });

  const classes = classNames(
    'chromeChip',
    noShift.guardClassName,
    'uiNoShiftTextClamp',
    `chromeChip--${variant}`,
    `chromeChip--tone-${tone}`,
    {
      'chromeChip--clickable': Boolean(onClick),
    },
    className,
  );

  const content = (
    <>
      <span className="chromeChip__icon uiNoShiftIconSlot">{icon ?? null}</span>
      <span className="chromeChip__text uiNoShiftTextClamp">{text}</span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick} title={title} {...noShift.dataAttrs}>
        {content}
      </button>
    );
  }

  return (
    <span className={classes} title={title} {...noShift.dataAttrs}>
      {content}
    </span>
  );
}
