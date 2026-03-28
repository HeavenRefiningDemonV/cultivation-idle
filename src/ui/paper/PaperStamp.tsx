import classNames from 'classnames';
import {
  ChromeStamp,
  type ChromeStampSize,
  type ChromeStampState,
  type ChromeStampTilt,
  type ChromeStampTone,
} from '../chrome/ChromeStamp.js';
import './paper.scss';

export interface PaperStampProps {
  text: string;
  size?: ChromeStampSize;
  tone?: ChromeStampTone;
  state?: ChromeStampState;
  tilt?: ChromeStampTilt;
  className?: string;
}

function resolveLegacyStateClass(className: string | undefined): ChromeStampState {
  if (!className) return 'default';
  if (className.includes('paperStamp--difficulty')) return 'difficulty';
  if (className.includes('paperStamp--ready')) return 'ready';
  if (className.includes('paperStamp--complete')) return 'complete';
  if (className.includes('paperStamp--claimed')) return 'claimed';
  if (className.includes('paperStamp--sent')) return 'sent';
  return 'default';
}

export function PaperStamp({ text, size = 'md', tone = 'ink', state, tilt = 'auto', className }: PaperStampProps) {
  const resolvedState = state ?? resolveLegacyStateClass(className);
  return (
    <ChromeStamp
      text={text}
      size={size}
      tone={tone}
      state={resolvedState}
      tilt={tilt}
      className={classNames('paperStamp', `paperStamp--${size}`, `paperStamp--tone-${tone}`, `paperStamp--${resolvedState}`, className)}
    />
  );
}
