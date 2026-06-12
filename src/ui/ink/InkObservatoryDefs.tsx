/**
 * Shared SVG <defs> sprite for the Observatory (Wave 0). One hidden, zero-size,
 * aria-hidden SVG mounted ONCE at the Observatory root so every instrument can
 * reference these gradients/filters by id (e.g. fill="url(#goldRad)") without
 * re-declaring them. Ids match the living-state-observatory artifact verbatim so
 * later ported instrument markup works 1:1.
 *
 * Gradient stop hexes are sanctioned gradient-internal constants (the sprite is
 * the one place raw stop colors live); they trace to the paper-ink palette
 * (cinnabar #8b3028 = --paper-stamp, gold #a2712a = --paper-amber, jade greens to
 * --paper-jade(-bright), etc.). The grainF feColorMatrix constants (.42 .33 .20,
 * alpha .05) are texture parameters (noise tint/strength), not themed colors.
 */
export function InkObservatoryDefs() {
  return (
    <svg
      className="inkObservatoryDefs"
      width={0}
      height={0}
      aria-hidden="true"
      focusable={false}
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        <filter id="grainF">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="7" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.33  0 0 0 0 0.20  0 0 0 0.05 0" />
        </filter>
        <filter id="rough">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" />
        </filter>
        <radialGradient id="inkDisc" cx="38%" cy="32%" r="80%">
          <stop offset="0" stopColor="#3b342c" />
          <stop offset=".55" stopColor="#241f1a" />
          <stop offset="1" stopColor="#120e0a" />
        </radialGradient>
        <radialGradient id="cinnDisc" cx="40%" cy="34%" r="78%">
          <stop offset="0" stopColor="#b25347" />
          <stop offset=".5" stopColor="#8b3028" />
          <stop offset="1" stopColor="#54190f" />
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
        <filter id="glowR">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(255,255,255,.55)" />
          <stop offset=".18" stopColor="rgba(255,255,255,.12)" />
          <stop offset=".5" stopColor="rgba(210,225,220,.08)" />
          <stop offset=".82" stopColor="rgba(120,130,120,.12)" />
          <stop offset="1" stopColor="rgba(80,90,80,.22)" />
        </linearGradient>
        <linearGradient id="cork" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9a7340" />
          <stop offset="1" stopColor="#6e4c22" />
        </linearGradient>
        <linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e7cd92" />
          <stop offset=".5" stopColor="#a2712a" />
          <stop offset="1" stopColor="#6e4c16" />
        </linearGradient>
        <linearGradient id="brassH" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6e4c16" />
          <stop offset=".5" stopColor="#e7cd92" />
          <stop offset="1" stopColor="#6e4c16" />
        </linearGradient>
        <linearGradient id="plank" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a6a36" />
          <stop offset=".5" stopColor="#5e4218" />
          <stop offset="1" stopColor="#4a330e" />
        </linearGradient>
        <radialGradient id="jadeRad" cx="40%" cy="34%" r="78%">
          <stop offset="0" stopColor="#cfdccb" />
          <stop offset=".5" stopColor="#7f9a86" />
          <stop offset="1" stopColor="#3c5849" />
        </radialGradient>
        <filter id="soft">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <filter id="glowJ" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
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
      </defs>
    </svg>
  );
}
