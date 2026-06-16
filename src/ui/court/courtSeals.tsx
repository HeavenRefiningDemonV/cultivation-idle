import './courtSeals.scss';
import { InkWaxSeal } from '../ink/InkWaxSeal';

/**
 * Court shared helpers (artifact Part 1.4): wax seal, medallion, corner flourish,
 * intensity flame. The wax seal REUSES the existing <InkWaxSeal/> (a verbatim port
 * of the artifact waxSeal() with the same 22-point sine rim + vertical Kai glyphs);
 * the Court only maps jade -> variant. All reference the shared <CourtDefs/> sprite.
 * Decorative: aria-hidden.
 */

export interface CourtWaxSealProps {
  /** 1-4 CJK chars stamped vertically (e.g. '封', '煉', '歸'). */
  chars: string;
  size: number;
  rotation?: number;
  /** true -> jade disc (Heaven / safe), else cinnabar. */
  jade?: boolean;
  className?: string;
}

/** Wax-seal chop (artifact waxSeal). Thin wrapper over <InkWaxSeal/>. */
export function CourtWaxSeal({ chars, size, rotation = 0, jade = false, className }: CourtWaxSealProps) {
  return (
    <InkWaxSeal
      chars={chars}
      size={size}
      rotation={rotation}
      variant={jade ? 'jade' : 'cinnabar'}
      className={['courtWaxSeal', className].filter(Boolean).join(' ')}
    />
  );
}

export interface CourtMedallionProps {
  /** single kai glyph centered on the medallion (e.g. '靜'). */
  glyph: string;
  /** true tints the glyph ink (selected detent), else gold. */
  ink?: boolean;
  className?: string;
}

/** 26px round gold medallion with a centered kai glyph (artifact medallion). */
export function CourtMedallion({ glyph, ink = false, className }: CourtMedallionProps) {
  return (
    <span
      className={['courtMedallion', ink ? 'courtMedallion--ink' : '', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      {glyph}
    </span>
  );
}

export interface CourtFlameProps {
  /** intensity height step (1..4); sets svg height H = 20 + h*10 (artifact flameSVG). */
  height: number;
  /** ember fill + inner white when lit (selected & actively tempering & !reduced-motion). */
  lit?: boolean;
  className?: string;
}

/** Intensity-detent flame (artifact flameSVG). */
export function CourtFlame({ height, lit = false, className }: CourtFlameProps) {
  const H = 20 + height * 10;
  const outer = `M17,${H} C2,${H - 12} 8,${H * 0.4} 14,${H * 0.28} C13,${H * 0.5} 20,${H * 0.46} 19,${H * 0.62} C24,${H * 0.4} 30,${H - 14} 17,${H}Z`;
  const inner = `M17,${H} C9,${H - 8} 13,${H * 0.55} 17,${H * 0.46} C21,${H * 0.55} 25,${H - 8} 17,${H}Z`;
  return (
    <svg
      className={['courtFlame', className].filter(Boolean).join(' ')}
      width={34}
      height={H}
      viewBox={`0 0 34 ${H}`}
      aria-hidden="true"
      focusable={false}
    >
      <path className={lit ? 'flame' : ''} d={outer} fill={lit ? 'url(#emberCore)' : 'var(--court-flame-cold)'} />
      {lit ? <path className="flame" d={inner} fill="var(--court-flame-hot)" opacity={0.7} /> : null}
    </svg>
  );
}

/**
 * Per-path room-corner flourish as an SVG data-URI (artifact cornerURI), tinted by
 * `color`. Returned for use as an <img src>; the colour is sprite-internal stroke
 * data (the only place a raw value is passed), driven by a token at the call site.
 */
export function courtCornerUri(color: string): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'>` +
    `<g fill='none' stroke='${color}' stroke-width='2' stroke-linecap='round'>` +
    `<path d='M8,72 C8,36 24,16 60,12'/>` +
    `<path d='M14,72 C14,42 30,24 62,20' opacity='.6'/>` +
    `<circle cx='62' cy='13' r='3.4' fill='${color}' stroke='none'/>` +
    `<path d='M8,72 q-2,-10 4,-16'/>` +
    `</g></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}
