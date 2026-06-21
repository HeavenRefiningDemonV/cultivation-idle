import { type CSSProperties } from 'react';
import classNames from 'classnames';

/**
 * F2.UI — the small decorative marks ported from modal-stage.html (miniIcon / edgeGlyph / raritySeal /
 * tierMark), as token-clean React components (no raw hex, no emoji — inline SVG paths only). They use
 * the artifact's class names (styled, scoped, in the record/rite SCSS). aria-hidden: meaning lives in
 * the adjacent text. Re-exports the wax/lock seals from recordMarks for one import site.
 */

export { WaxSeal, LockSeal } from './recordMarks.js';

export type MiniIconName =
  | 'star' | 'scroll' | 'warn' | 'quiet' | 'shield' | 'gain' | 'lock' | 'ember' | 'wheel';

/** A 14×14 inline glyph icon — each carries meaning by shape, never colour alone. */
export function MiniIcon({ name }: { name: MiniIconName }) {
  return (
    <svg className="ico" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      {MINI_ICON_PATHS[name]}
    </svg>
  );
}

const MINI_ICON_PATHS: Record<MiniIconName, JSX.Element> = {
  star: (
    <path d="M7 1.2 8.5 5h4l-3.2 2.6 1.2 4L7 9.3 3.5 11.6l1.2-4L1.5 5h4z" fill="var(--paper-cinnabar-bright)" stroke="var(--paper-cinnabar-deep)" strokeWidth={0.6} strokeLinejoin="round" />
  ),
  scroll: (
    <>
      <path d="M3 2.5h6.5a1.5 1.5 0 0 1 1.5 1.5v7.5H4.5A1.5 1.5 0 0 1 3 10z" fill="none" stroke="var(--paper-gold-deep)" strokeWidth={1} />
      <path d="M3 4.5h6M3 6.5h6M3 8.5h4" stroke="var(--paper-gold-deep)" strokeWidth={0.8} />
    </>
  ),
  warn: (
    <>
      <path d="M7 1.8 13 12H1z" fill="none" stroke="var(--paper-cinnabar-deep)" strokeWidth={1.1} strokeLinejoin="round" />
      <path d="M7 5.6v3.1" stroke="var(--paper-cinnabar-deep)" strokeWidth={1.2} />
      <circle cx="7" cy="10.4" r="0.8" fill="var(--paper-cinnabar-deep)" />
    </>
  ),
  quiet: (
    <>
      <circle cx="7" cy="7" r="5.2" fill="none" stroke="var(--paper-bronze-lo)" strokeWidth={1} />
      <path d="M4.4 8.2c1-1.4 4.2-1.4 5.2 0" stroke="var(--paper-bronze-lo)" strokeWidth={1} fill="none" />
      <circle cx="5.2" cy="5.6" r="0.7" fill="var(--paper-bronze-lo)" />
      <circle cx="8.8" cy="5.6" r="0.7" fill="var(--paper-bronze-lo)" />
    </>
  ),
  shield: (
    <>
      <path d="M7 1.5 12 3.2V7c0 3.2-2.4 4.8-5 5.8C4.4 11.8 2 10.2 2 7V3.2z" fill="none" stroke="var(--paper-jade-ink)" strokeWidth={1} />
      <path d="M4.8 7 6.4 8.6 9.4 5" stroke="var(--paper-jade-bright)" strokeWidth={1.2} fill="none" />
    </>
  ),
  gain: (
    <>
      <path d="M2 9 5.5 5.5 8 8l4-4.5" stroke="var(--paper-jade-bright)" strokeWidth={1.3} fill="none" strokeLinecap="round" />
      <path d="M9.5 3.5H12V6" stroke="var(--paper-jade-bright)" strokeWidth={1.3} fill="none" strokeLinecap="round" />
    </>
  ),
  lock: (
    <>
      <rect x="3" y="6" width="8" height="6" rx="1.2" fill="none" stroke="var(--paper-cinnabar-deep)" strokeWidth={1} />
      <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" fill="none" stroke="var(--paper-cinnabar-deep)" strokeWidth={1} />
    </>
  ),
  ember: (
    <path d="M7 1.5c2 2.5.5 3.8 1.5 5.2.7 1 .3 2.6-1.5 2.6S5 7.7 5.7 6.5C6.4 5.3 5 4 7 1.5z" fill="var(--obs-ember-mid)" stroke="var(--obs-ember-core)" strokeWidth={0.5} />
  ),
  wheel: (
    <>
      <circle cx="7" cy="7" r="5.4" fill="none" stroke="var(--paper-gold-deep)" strokeWidth={1} />
      <circle cx="7" cy="7" r="1.6" fill="var(--paper-gold-deep)" />
      <path d="M7 1.6v3M7 9.4v3M1.6 7h3M9.4 7h3" stroke="var(--paper-gold-deep)" strokeWidth={0.9} />
    </>
  ),
};

/** The element edge-glyph — a corner medallion tinted by element (shape + glyph + label, never hue alone). */
export function EdgeGlyph({ glyph, label, token }: { glyph: string; label: string; token: string }) {
  return (
    <div className="edge-glyph" style={{ '--el-tint': `var(${token})` } as CSSProperties} aria-hidden="true">
      <div className="eg-mark">
        <span className="eg-char">{glyph}</span>
        <span className="eg-lab">{label}</span>
      </div>
    </div>
  );
}

/** The rarity chop + name + affix-band (glyph + label, never hue alone). */
export function RaritySeal({ grade, kai, name, band }: { grade: string; kai: string; name: string; band: string }) {
  return (
    <div className="rseal">
      <div className={`rchop q-${grade}`} aria-hidden="true">{kai}</div>
      <div className={`rname q-${grade}-c`}>
        {name}
        <small>{band}</small>
      </div>
    </div>
  );
}

/** The tier-mark plate — an item-tier numeral or a realm plate (technique). */
export function TierMark({ tier, isRealm = false }: { tier: string | number; isRealm?: boolean }) {
  return (
    <div className={classNames('tier-mark', { realm: isRealm })} aria-hidden="true">
      <span className="tn">{tier}</span>
      <span className="tl">{isRealm ? 'REALM' : 'TIER'}</span>
    </div>
  );
}
