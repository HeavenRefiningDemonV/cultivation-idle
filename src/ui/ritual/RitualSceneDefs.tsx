/**
 * F2.UI — the rite-scene SVG `<defs>` sprite. A single hidden `<svg>` mounted ONCE by the Ritual
 * Ceremony shell; every scene references these ids by `url(#rs…)`. Ported from modal-stage.html's
 * shared + rite-only defs (lines ~547–572), namespaced `rs*` to avoid collision, with EVERY
 * stop-color mapped to a paperInkTokens var / color-mix (no raw hex). Filters carry no colour and
 * are copied verbatim. Renders nothing visible.
 */
export function RitualSceneDefs() {
  return (
    <svg className="ritualSceneDefs" width={0} height={0} aria-hidden="true" focusable="false">
      <defs>
        {/* ── filters (no colour) ── */}
        <filter id="rsRough">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={2} seed={3} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={3} />
        </filter>
        <filter id="rsSoft7"><feGaussianBlur stdDeviation={7.5} /></filter>
        <filter id="rsGlowG" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation={4.2} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="rsGlowJ" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={3} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        {/* ── disc / metal gradients ── */}
        <radialGradient id="rsInkDisc" cx="38%" cy="32%" r="80%">
          <stop offset="0" stopColor="color-mix(in oklab, var(--obs-void-high) 64%, var(--paper-bronze-lo))" />
          <stop offset="0.55" stopColor="var(--obs-void-mid)" />
          <stop offset="1" stopColor="var(--obs-void-deep)" />
        </radialGradient>
        <radialGradient id="rsCinnDisc" cx="40%" cy="34%" r="78%">
          <stop offset="0" stopColor="var(--paper-cinnabar-bright)" />
          <stop offset="0.5" stopColor="var(--paper-stamp)" />
          <stop offset="1" stopColor="var(--paper-cinnabar-deep)" />
        </radialGradient>
        <radialGradient id="rsJadeRad" cx="40%" cy="34%" r="78%">
          <stop offset="0" stopColor="var(--paper-jade-muted)" />
          <stop offset="0.5" stopColor="var(--paper-jade)" />
          <stop offset="1" stopColor="var(--paper-jade-ink)" />
        </radialGradient>
        <linearGradient id="rsGoldG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--paper-gold-leaf-hi)" />
          <stop offset="0.5" stopColor="var(--paper-gold-strong)" />
          <stop offset="1" stopColor="var(--paper-gold-deep)" />
        </linearGradient>
        <radialGradient id="rsGoldRad" cx="40%" cy="34%" r="75%">
          <stop offset="0" stopColor="color-mix(in oklab, var(--paper-gold-leaf-hi) 78%, var(--paper-parchment-soft))" />
          <stop offset="0.5" stopColor="var(--paper-gold-strong)" />
          <stop offset="1" stopColor="var(--paper-gold-deep)" />
        </radialGradient>
        <linearGradient id="rsBrassH" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--paper-bronze-hi)" />
          <stop offset="0.5" stopColor="var(--paper-bronze-lo)" />
          <stop offset="1" stopColor="var(--paper-gold-deep)" />
        </linearGradient>

        {/* ── qi / light / ember auras (translucent) ── */}
        <radialGradient id="rsQiAura" cx="50%" cy="42%" r="55%">
          <stop offset="0" stopColor="var(--paper-gold-leaf-hi)" stopOpacity={0.42} />
          <stop offset="0.4" stopColor="var(--paper-gold-leaf)" stopOpacity={0.2} />
          <stop offset="0.72" stopColor="var(--paper-gold-strong)" stopOpacity={0.07} />
          <stop offset="1" stopColor="var(--paper-gold-strong)" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="rsQiCore" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="var(--paper-parchment-soft)" stopOpacity={0.95} />
          <stop offset="1" stopColor="var(--paper-gold-leaf-hi)" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="rsJadeDawn" cx="50%" cy="30%" r="70%">
          <stop offset="0" stopColor="color-mix(in oklab, var(--paper-parchment-soft) 68%, var(--paper-jade-bright))" stopOpacity={0.9} />
          <stop offset="0.4" stopColor="var(--paper-jade-bright)" stopOpacity={0.5} />
          <stop offset="1" stopColor="var(--paper-jade-ink)" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="rsThresholdLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--paper-parchment-soft)" stopOpacity={0.05} />
          <stop offset="0.5" stopColor="var(--paper-gold-leaf-hi)" stopOpacity={0.85} />
          <stop offset="1" stopColor="var(--paper-gold-strong)" stopOpacity={0.1} />
        </linearGradient>

        {/* ── stone / storm / mist / cloth ── */}
        <linearGradient id="rsStoneG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="color-mix(in oklab, var(--obs-void-high) 58%, var(--paper-bronze-lo))" />
          <stop offset="0.5" stopColor="var(--obs-void-mid)" />
          <stop offset="1" stopColor="var(--obs-void-deep)" />
        </linearGradient>
        <radialGradient id="rsStormCloud" cx="50%" cy="40%" r="60%">
          <stop offset="0" stopColor="var(--obs-void-high)" />
          <stop offset="0.6" stopColor="var(--obs-void-mid)" />
          <stop offset="1" stopColor="var(--obs-void-deep)" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="rsMistG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="color-mix(in oklab, var(--paper-parchment-soft) 66%, var(--paper-jade-muted))" stopOpacity={0.4} />
          <stop offset="1" stopColor="color-mix(in oklab, var(--paper-parchment-soft) 66%, var(--paper-jade-muted))" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="rsBannerCloth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--paper-cinnabar-bright)" />
          <stop offset="1" stopColor="var(--paper-cinnabar-deep)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
