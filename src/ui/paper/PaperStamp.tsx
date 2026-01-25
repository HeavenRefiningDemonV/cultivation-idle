import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import classNames from 'classnames';
import './paper.scss';

type PaperStampSize = 'sm' | 'md';
type PaperStampTone = 'ink' | 'seal';

type PaperStampTilt = number | 'auto';

export interface PaperStampProps {
  text: string;
  size?: PaperStampSize;
  tone?: PaperStampTone;
  tilt?: PaperStampTilt;
  className?: string;
}

const clampTilt = (value: number) => Math.max(-6, Math.min(6, value));

function computeAutoTilt(text: string): number {
  const codeSum = Array.from(text).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const normalized = (codeSum % 11) - 5;
  return clampTilt(normalized * 0.5);
}

export function PaperStamp({ text, size = 'md', tone = 'ink', tilt = 'auto', className }: PaperStampProps) {
  const rotation = useMemo(() => {
    if (typeof tilt === 'number') return clampTilt(tilt);
    if (tilt === 'auto') return computeAutoTilt(text);
    return 0;
  }, [text, tilt]);

  const style: CSSProperties = rotation ? { transform: `rotate(${rotation}deg)` } : undefined;

  return (
    <span
      className={classNames('paperStamp', `paperStamp--${size}`, `paperStamp--tone-${tone}`, className)}
      style={style}
    >
      {text}
    </span>
  );
}
