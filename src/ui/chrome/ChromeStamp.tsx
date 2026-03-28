import classNames from 'classnames';
import { PaperStamp } from '../paper/PaperStamp.js';

export type ChromeStampSize = 'sm' | 'md';
export type ChromeStampTone = 'ink' | 'seal';
export type ChromeStampTilt = number | 'auto';

export interface ChromeStampProps {
  text: string;
  size?: ChromeStampSize;
  tone?: ChromeStampTone;
  tilt?: ChromeStampTilt;
  className?: string;
}

export function ChromeStamp({ text, size = 'md', tone = 'ink', tilt = 'auto', className }: ChromeStampProps) {
  return <PaperStamp text={text} size={size} tone={tone} tilt={tilt} className={classNames('chromeStamp', className)} />;
}
