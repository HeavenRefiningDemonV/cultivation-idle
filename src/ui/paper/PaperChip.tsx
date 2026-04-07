import type { ReactNode } from 'react';
import classNames from 'classnames';
import { PaperChip as InkPaperChip } from '../ink/PaperChip.js';
import { buildStableInteractiveClassName } from '../motion/layoutStability.js';
import './paper.scss';

type PaperChipVariant = 'pill' | 'tag';
type PaperChipTone = 'neutral' | 'ink' | 'danger' | 'success' | 'rare' | 'merit';

export interface PaperChipProps {
  variant?: PaperChipVariant;
  icon?: ReactNode;
  text: string;
  tone?: PaperChipTone;
  onClick?: () => void;
  className?: string;
}

/**
 * Compatibility wrapper only.
 * Canonical primitive behavior lives in `ui/ink/PaperChip`.
 */
export function PaperChip({
  variant = 'pill',
  icon,
  text,
  tone = 'neutral',
  onClick,
  className,
}: PaperChipProps) {
  const classes = buildStableInteractiveClassName(
    classNames(
      'paperChip',
      {
        'paperChip--tag': variant === 'tag',
        'paperChip--clickable': Boolean(onClick),
      },
      `paperChip--tone-${tone}`,
      className,
    ),
    Boolean(onClick),
  );

  return (
    <InkPaperChip
      variant={variant}
      tone={tone}
      reserveEndSpace={false}
      icon={icon ? <span className="paperChip__icon">{icon}</span> : undefined}
      text={<span className="paperChip__text">{text}</span>}
      onClick={onClick}
      className={classes}
    />
  );
}
