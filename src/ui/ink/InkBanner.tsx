import './InkBanner.scss';

export interface InkBannerProps {
  /** Section title shown on the jade plate, e.g. "Meridian Vessel Compass". */
  title: string;
  className?: string;
}

/**
 * Centered jade-ink section title plate with gold diamond end-caps (the
 * artifact `.banner`). Decorative chrome that still carries the title text for
 * screen readers. Tokenized jade/gold; consumes no shared SVG defs.
 */
export function InkBanner({ title, className }: InkBannerProps) {
  return <span className={['inkBanner', className].filter(Boolean).join(' ')}>{title}</span>;
}
