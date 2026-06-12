export type ObservatoryDiscVariant = 'gold' | 'jade' | 'cinnabar';

export interface ObservatoryDiscMedallionProps {
  /** Optional Kai-ti glyph centered on the disc; omit (null) renders the disc only. */
  glyph?: string | null;
  /** Radial disc fill: gold (default), jade, or cinnabar (at-risk). */
  variant?: ObservatoryDiscVariant;
  /** Consumer class for sizing/placement (the disc itself has no intrinsic px size). */
  className?: string;
}

/**
 * Decorative gold/jade/cinnabar radial disc + optional Kai-ti glyph (artifact
 * medallion()/vitals() disc). Shared by the vitals seals, the Life Decree element
 * tiles, and the Current Work Wheel spokes. The radial fill comes from the shared
 * <InkObservatoryDefs/> sprite (url(#goldRad|#jadeRad|#cinnDisc)), which must be
 * mounted in the subtree. Stroke + glyph colors are tokenized in
 * StatusLivingStateObservatory.scss (.observatoryDiscMedallion). aria-hidden chrome:
 * the adjacent label/value is always the truth.
 */
const DISC_FILL: Record<ObservatoryDiscVariant, string> = {
  gold: 'url(#goldRad)',
  jade: 'url(#jadeRad)',
  cinnabar: 'url(#cinnDisc)',
};

export function ObservatoryDiscMedallion({ glyph = null, variant = 'gold', className }: ObservatoryDiscMedallionProps) {
  return (
    <svg
      className={['observatoryDiscMedallion', `observatoryDiscMedallion--${variant}`, className].filter(Boolean).join(' ')}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable={false}
    >
      <circle className="observatoryDiscMedallion__disc" cx="12" cy="12" r="11" fill={DISC_FILL[variant]} />
      {glyph ? (
        <text className="observatoryDiscMedallion__glyph" x="12" y="12" textAnchor="middle" dominantBaseline="central">
          {glyph}
        </text>
      ) : null}
    </svg>
  );
}
