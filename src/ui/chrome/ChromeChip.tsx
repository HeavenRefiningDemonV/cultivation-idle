import type { ReactNode } from 'react';
import classNames from 'classnames';
import './ChromeChip.scss';

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
  const classes = classNames(
    'chromeChip',
    `chromeChip--${variant}`,
    `chromeChip--tone-${tone}`,
    {
      'chromeChip--clickable': Boolean(onClick),
    },
    className,
  );

  const content = (
    <>
      {icon ? <span className="chromeChip__icon">{icon}</span> : null}
      <span className="chromeChip__text">{text}</span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick} title={title}>
        {content}
      </button>
    );
  }

  return (
    <span className={classes} title={title}>
      {content}
    </span>
  );
}
