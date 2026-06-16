/**
 * The Tempering Court shared SVG <defs> sprite (W1). One hidden, zero-size,
 * aria-hidden SVG mounted ONCE at the Court root so every region/figure can
 * reference these gradients/filters by id (e.g. fill="url(#goldRad)") without
 * re-declaring them. Ids + stops match the tempering-court artifact (Part 1.10)
 * verbatim, so the later ported region/figure markup works 1:1.
 *
 * This is the Court's HEX-ALLOWED ZONE: SVG gradient stops + filter primitives
 * cannot reliably reference CSS custom properties across render targets, so raw
 * hex is sprite data here only. The Court is a separate modal screen and never
 * co-mounts with the Observatory, so this self-contained sprite (with the
 * artifact's own grainF = desaturate, plus the meridian/scenery gradients the
 * Observatory sprite lacks) carries no id-collision risk.
 */
export function CourtDefs() {
  return (
    <svg
      className="courtDefs"
      width={0}
      height={0}
      aria-hidden="true"
      focusable={false}
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        {/* paper grain (desaturated fractal noise) */}
        <filter id="grainF">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="7" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        {/* seal / node radials */}
        <radialGradient id="cinnDisc" cx="40%" cy="34%" r="78%">
          <stop offset="0" stopColor="#b25347" />
          <stop offset=".5" stopColor="#8b3028" />
          <stop offset="1" stopColor="#54190f" />
        </radialGradient>
        <radialGradient id="jadeRad" cx="40%" cy="34%" r="78%">
          <stop offset="0" stopColor="#cfdccb" />
          <stop offset=".5" stopColor="#7f9a86" />
          <stop offset="1" stopColor="#3c5849" />
        </radialGradient>
        <linearGradient id="goldG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0d896" />
          <stop offset=".5" stopColor="#a2712a" />
          <stop offset="1" stopColor="#6e4c16" />
        </linearGradient>
        <radialGradient id="goldRad" cx="40%" cy="34%" r="75%">
          <stop offset="0" stopColor="#f3e3b0" />
          <stop offset=".5" stopColor="#c08f3a" />
          <stop offset="1" stopColor="#6e4c16" />
        </radialGradient>
        <linearGradient id="plank" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a6a36" />
          <stop offset=".5" stopColor="#5e4218" />
          <stop offset="1" stopColor="#4a330e" />
        </linearGradient>
        {/* glows / blurs */}
        <filter id="soft">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <filter id="soft3">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
        <filter id="soft6">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="glowJ" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="goldBrushG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c9a85a" stopOpacity="0" />
          <stop offset=".35" stopColor="#b2832d" stopOpacity=".95" />
          <stop offset=".7" stopColor="#8a6422" />
          <stop offset="1" stopColor="#6e4c16" stopOpacity=".25" />
        </linearGradient>
        <filter id="brushRough" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="1" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="9" />
        </filter>
        {/* figure aura / dantian cores */}
        <radialGradient id="qiAura" cx="50%" cy="42%" r="55%">
          <stop offset="0" stopColor="#e7c878" stopOpacity=".42" />
          <stop offset=".4" stopColor="#d8b45e" stopOpacity=".2" />
          <stop offset=".72" stopColor="#caa84e" stopOpacity=".07" />
          <stop offset="1" stopColor="#caa84e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="qiCore" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff4d6" stopOpacity=".95" />
          <stop offset="1" stopColor="#e7c878" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="emberCore" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffd9a0" stopOpacity=".97" />
          <stop offset=".5" stopColor="#d8702f" stopOpacity=".55" />
          <stop offset="1" stopColor="#a44731" stopOpacity="0" />
        </radialGradient>
        {/* atmosphere washes (per-path scenery) */}
        <radialGradient id="forgeGlow" cx="50%" cy="86%" r="62%">
          <stop offset="0" stopColor="#e0762a" stopOpacity=".62" />
          <stop offset=".4" stopColor="#b34a26" stopOpacity=".3" />
          <stop offset="1" stopColor="#7a2a16" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="furnaceFire" cx="50%" cy="60%" r="55%">
          <stop offset="0" stopColor="#ffe6a6" />
          <stop offset=".35" stopColor="#f0832c" />
          <stop offset=".75" stopColor="#b23c1e" />
          <stop offset="1" stopColor="#6e1e12" stopOpacity=".6" />
        </radialGradient>
        <radialGradient id="starHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#eaf2ff" stopOpacity=".9" />
          <stop offset=".4" stopColor="#bcd0e6" stopOpacity=".35" />
          <stop offset="1" stopColor="#9fb6d6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moonG" cx="42%" cy="40%" r="60%">
          <stop offset="0" stopColor="#f6f2e2" />
          <stop offset=".7" stopColor="#d9d2b6" />
          <stop offset="1" stopColor="#b9b08e" stopOpacity=".4" />
        </radialGradient>
        <linearGradient id="mistG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfe0e6" stopOpacity=".5" />
          <stop offset="1" stopColor="#9fb6c0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lanternG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6c25a" />
          <stop offset="1" stopColor="#b23c1e" />
        </linearGradient>
        <linearGradient id="steelG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#aeb6bd" />
          <stop offset=".5" stopColor="#7c858d" />
          <stop offset="1" stopColor="#565d64" />
        </linearGradient>
        <linearGradient id="bannerCloth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9a3b30" />
          <stop offset="1" stopColor="#5e1c16" />
        </linearGradient>
        {/* per-path meridian channel gradients (dantian -> crown) */}
        <linearGradient id="meridP_earth" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#fff1cf" />
          <stop offset=".5" stopColor="#ffb15a" />
          <stop offset="1" stopColor="#e0762a" />
        </linearGradient>
        <linearGradient id="meridP_martial" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#fff8e0" />
          <stop offset="1" stopColor="#e7c878" />
        </linearGradient>
        <linearGradient id="meridP_heaven" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#eafff6" />
          <stop offset="1" stopColor="#9fe0c4" />
        </linearGradient>
        <linearGradient id="meridS_c" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#cfe0d2" />
          <stop offset="1" stopColor="#7f9a86" />
        </linearGradient>
      </defs>
    </svg>
  );
}
