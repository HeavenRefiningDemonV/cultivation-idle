import type { ReactNode } from 'react';
import classNames from 'classnames';
import { PaperChip } from '../paper/PaperChip.js';

export type ChromeChipVariant = 'pill' | 'tag';
export type ChromeChipTone = 'neutral' | 'ink' | 'danger' | 'success' | 'rare' | 'merit';

export interface ChromeChipProps {
  variant?: ChromeChipVariant;
  icon?: ReactNode;
  text: string;
  tone?: ChromeChipTone;
  onClick?: () => void;
  className?: string;
}

export function ChromeChip({ variant = 'pill', icon, text, tone = 'neutral', onClick, className }: ChromeChipProps) {
  return <PaperChip variant={variant} icon={icon} text={text} tone={tone} onClick={onClick} className={classNames('chromeChip', className)} />;
}
