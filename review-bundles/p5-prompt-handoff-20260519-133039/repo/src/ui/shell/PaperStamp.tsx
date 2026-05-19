import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import classNames from 'classnames';
import './PaperStamp.scss';

export type PaperStampSize = 'sm' | 'md';
export type PaperStampTone = 'ink' | 'seal';
export type PaperStampVariant =
  | 'default'
  | 'difficulty'
  | 'ready'
  | 'complete'
  | 'claimed'
  | 'tracked'
  | 'active'
  | 'recommended'
  | 'role';
export type PaperStampTilt = number | 'auto' | 'none';

export interface PaperStampProps {
  text: string;
  size?: PaperStampSize;
  tone?: PaperStampTone;
  variant?: PaperStampVariant;
  tilt?: PaperStampTilt;
  className?: string;
}

const clampTilt = (value: number) => Math.max(-6, Math.min(6, value));

function computeAutoTilt(text: string): number {
  const codeSum = Array.from(text).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const normalized = (codeSum % 11) - 5;
  return clampTilt(normalized * 0.5);
}

function variantCompatibilityClass(variant: PaperStampVariant): string | null {
  switch (variant) {
    case 'difficulty':
      return 'paperStamp--difficulty';
    case 'ready':
      return 'paperStamp--ready';
    case 'complete':
      return 'paperStamp--complete';
    case 'claimed':
      return 'paperStamp--claimed';
    case 'tracked':
      return 'paperStamp--tracked';
    case 'active':
      return 'paperStamp--active';
    case 'recommended':
      return 'paperStamp--recommended';
    case 'role':
      return 'paperStamp--role';
    default:
      return null;
  }
}

export function PaperStamp({
  text,
  size = 'md',
  tone = 'ink',
  variant = 'default',
  tilt = 'auto',
  className,
}: PaperStampProps) {
  const rotation = useMemo(() => {
    if (typeof tilt === 'number') return clampTilt(tilt);
    if (tilt === 'auto') return computeAutoTilt(text);
    return 0;
  }, [text, tilt]);

  const style: CSSProperties | undefined = rotation ? { transform: `rotate(${rotation}deg)` } : undefined;
  const compatClass = variantCompatibilityClass(variant);

  return (
    <span
      className={classNames(
        'paperStamp',
        `paperStamp--${size}`,
        `paperStamp--tone-${tone}`,
        `paperStamp--variant-${variant}`,
        compatClass,
        className,
      )}
      style={style}
    >
      {text}
    </span>
  );
}
