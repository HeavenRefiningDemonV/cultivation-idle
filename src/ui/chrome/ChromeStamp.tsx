import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import classNames from 'classnames';
import './ChromeStamp.scss';

export type ChromeStampSize = 'sm' | 'md';
export type ChromeStampTone = 'ink' | 'seal';
export type ChromeStampTilt = number | 'auto';
export type ChromeStampState = 'default' | 'difficulty' | 'ready' | 'complete' | 'claimed' | 'sent' | 'rare';

export interface ChromeStampProps {
  text: string;
  size?: ChromeStampSize;
  tone?: ChromeStampTone;
  state?: ChromeStampState;
  tilt?: ChromeStampTilt;
  className?: string;
  title?: string;
}

const clampTilt = (value: number) => Math.max(-6, Math.min(6, value));

function computeAutoTilt(text: string): number {
  const codeSum = Array.from(text).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const normalized = (codeSum % 11) - 5;
  return clampTilt(normalized * 0.5);
}

export function ChromeStamp({
  text,
  size = 'md',
  tone = 'ink',
  state = 'default',
  tilt = 'auto',
  className,
  title,
}: ChromeStampProps) {
  const rotation = useMemo(() => {
    if (typeof tilt === 'number') return clampTilt(tilt);
    if (tilt === 'auto') return computeAutoTilt(text);
    return 0;
  }, [text, tilt]);

  const style: CSSProperties = rotation ? { transform: `rotate(${rotation}deg)` } : undefined;

  return (
    <span
      className={classNames(
        'chromeStamp',
        `chromeStamp--${size}`,
        `chromeStamp--tone-${tone}`,
        `chromeStamp--state-${state}`,
        className,
      )}
      style={style}
      title={title}
    >
      {text}
    </span>
  );
}
