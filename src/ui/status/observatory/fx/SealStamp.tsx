import type { ReactNode } from 'react';
import './observatoryFx.scss';

export interface SealStampProps {
  /** e.g. "OPPOSED", "Priority 1". */
  label: string;
  tone: 'cinnabar' | 'gold' | 'jade' | 'ink';
  /** chip size; default 'md'. */
  size?: 'sm' | 'md';
  /** optional lucide icon / svg glyph. */
  glyph?: ReactNode;
  className?: string;
}

/**
 * The cinnabar wax-stamp chip for state labels. Built on the `.obsSealStamp`
 * material (irregular hand-stamped corners) plus tone modifiers — no animation,
 * because stamps are static truth markers.
 *
 * Note: `src/ui/paper/PaperStamp` is the round wax-chop seal; this rectangular
 * label chip is a distinct shape, so it composes the lightweight material class
 * rather than wrapping PaperStamp.
 */
export function SealStamp({ label, tone, size = 'md', glyph, className }: SealStampProps) {
  const classes = [
    'obsSealStamp',
    'obsFxSealStamp',
    `obsFxSealStamp--${tone}`,
    `obsFxSealStamp--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <span className={classes}>
      {glyph == null ? null : (
        <span className="obsFxSealStamp__glyph" aria-hidden="true">
          {glyph}
        </span>
      )}
      <span className="obsFxSealStamp__label">{label}</span>
    </span>
  );
}
