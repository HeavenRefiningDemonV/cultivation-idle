import type { ReactNode } from 'react';
import './courtChips.scss';

/**
 * Court chips (artifact Part 1.4). `.chip` state pills (jade/gold/cinn/ink) and
 * `.rootchip` aptitude-grade pills. State is encoded by shape + colour + text, never
 * colour alone (the rootchip always carries its grade label). Tokens-only.
 */

export type CourtChipTone = 'jade' | 'gold' | 'cinn' | 'ink';

export interface CourtChipProps {
  tone: CourtChipTone;
  children: ReactNode;
  className?: string;
}

export function CourtChip({ tone, children, className }: CourtChipProps) {
  return (
    <span className={['courtChip', `courtChip--${tone}`, className].filter(Boolean).join(' ')}>{children}</span>
  );
}

export type CourtRootGrade = 'heavenly' | 'true' | 'earthly' | 'mortal' | 'chaos';

export interface CourtRootChipProps {
  grade: CourtRootGrade;
  /** grade label, e.g. 'Heavenly' or 'True Root'. */
  children: ReactNode;
  className?: string;
}

export function CourtRootChip({ grade, children, className }: CourtRootChipProps) {
  return (
    <span className={['courtRootChip', `courtRootChip--${grade}`, className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}
