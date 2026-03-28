import type { ReactNode } from 'react';
import classNames from 'classnames';
import { ChromeChip, type ChromeChipTone, type ChromeChipVariant } from '../chrome/ChromeChip.js';
import './PaperChip.scss';

type PaperChipVariant = Exclude<ChromeChipVariant, 'microLabel'>;
type PaperChipTone = Exclude<ChromeChipTone, 'warning' | 'recommendation'>;

export interface PaperChipProps {
  variant?: PaperChipVariant;
  icon?: ReactNode;
  text: string;
  tone?: PaperChipTone;
  onClick?: () => void;
  className?: string;
}

export function PaperChip({ variant = 'pill', icon, text, tone = 'neutral', onClick, className }: PaperChipProps) {
  return (
    <ChromeChip
      variant={variant}
      icon={icon}
      text={text}
      tone={tone}
      onClick={onClick}
      className={classNames(
        'inkPaperChip',
        { 'inkPaperChip--tag': variant === 'tag', 'inkPaperChip--clickable': Boolean(onClick) },
        `inkPaperChip--tone-${tone}`,
        className,
      )}
    />
  );
}
