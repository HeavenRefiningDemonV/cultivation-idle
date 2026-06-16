import type { ReactNode } from 'react';
import './courtTokens.scss';
import './courtPanel.scss';

/**
 * The Tempering Court panel material (artifact Part 1.3) — the 10 stacked layers
 * every framed region reuses: parchment fill + ::before vignette/foxing, paper
 * grain (url(#grainF) from <CourtDefs/>), gold double-frame (border-image +
 * mask-composite:exclude so the gold reads as a FRAME not a fill), inner hairline,
 * four corner brackets, the jade-cloth banner with diamond caps (.cinn variant),
 * the cinnabar vertical tag (Lintel), and the faint kai watermark. Tokens-only
 * (frame/banner/tag hues are --court-* material tokens); the only raw hex lives in
 * <CourtDefs/>. Build one CourtPanel and reuse it everywhere — never re-author.
 */
export interface CourtPanelProps {
  /** accessible region label (the panel is role="region"). */
  ariaLabel: string;
  children: ReactNode;
  /** jade-cloth banner content (string, or rich node e.g. THE ROOM · {room}). */
  banner?: ReactNode;
  /** 'cinn' swaps the banner to the cinnabar gradient. */
  bannerVariant?: 'jade' | 'cinn';
  /** cinnabar vertical chop glyphs (Lintel only, e.g. '锤炼堂'). */
  tag?: string;
  /** faint giant kai watermark glyph (e.g. '法', '脉', '气'). */
  watermark?: string;
  /** watermark right offset in px (artifact: room 18, shelf 14, lintel '堂' 64, meridians 12). */
  watermarkRight?: number;
  /** Lintel scroll-rod caps flanking the panel. */
  rollers?: boolean;
  /** Room: skip the padded .content wrapper so children are full-bleed absolute layers. */
  flush?: boolean;
  /** override content padding (Lintel uses '0 18px'). */
  contentPadding?: string;
  className?: string;
  id?: string;
}

export function CourtPanel({
  ariaLabel,
  children,
  banner,
  bannerVariant = 'jade',
  tag,
  watermark,
  watermarkRight,
  rollers = false,
  flush = false,
  contentPadding,
  className,
  id,
}: CourtPanelProps) {
  return (
    <section
      className={['courtPanel', className].filter(Boolean).join(' ')}
      role="region"
      aria-label={ariaLabel}
      id={id}
    >
      <div className="courtPanel__grain" aria-hidden="true">
        <svg>
          <rect width="100%" height="100%" filter="url(#grainF)" />
        </svg>
      </div>
      {watermark ? (
        <div
          className="courtPanel__watermark"
          aria-hidden="true"
          style={watermarkRight !== undefined ? { right: `${watermarkRight}px` } : undefined}
        >
          {watermark}
        </div>
      ) : null}
      {rollers ? (
        <>
          <i className="courtPanel__roller courtPanel__roller--l" aria-hidden="true" />
          <i className="courtPanel__roller courtPanel__roller--r" aria-hidden="true" />
        </>
      ) : null}
      {flush ? (
        children
      ) : (
        <div className="courtPanel__content" style={contentPadding ? { padding: contentPadding } : undefined}>
          {children}
        </div>
      )}
      <div className="courtPanel__gframe" aria-hidden="true" />
      <div className="courtPanel__gframe2" aria-hidden="true" />
      <i className="courtPanel__gc courtPanel__gc--tl" aria-hidden="true" />
      <i className="courtPanel__gc courtPanel__gc--tr" aria-hidden="true" />
      <i className="courtPanel__gc courtPanel__gc--bl" aria-hidden="true" />
      <i className="courtPanel__gc courtPanel__gc--br" aria-hidden="true" />
      {tag ? (
        <div className="courtPanel__tag" aria-hidden="true">
          <div className="courtPanel__tag-glyphs">{tag}</div>
        </div>
      ) : null}
      {banner ? (
        <div
          className={['courtPanel__banner', bannerVariant === 'cinn' ? 'courtPanel__banner--cinn' : '']
            .filter(Boolean)
            .join(' ')}
        >
          {banner}
        </div>
      ) : null}
    </section>
  );
}
