/**
 * M.III.3 EQ-PORT — the shared SVG `<defs>` block, ported VERBATIM from the artifact
 * `M_III_2_panoply_vault.html` (lines 289-325). Injected ONCE at the top of `PanoplyFigureScene` via
 * `dangerouslySetInnerHTML` (mirrors `CULTIVATION_SEAT_SCENE_DEFS`). Hidden host (width/height 0,
 * position:absolute, aria-hidden) so it never renders but its gradients/filters remain referenceable by
 * `url(#id)` from every ported SVG string. Scene-local hex only (the sanctioned art zone). DO NOT edit ids.
 */
export const PANOPLY_SVG_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
 <filter id="grainF"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="7" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.33  0 0 0 0 0.20  0 0 0 0.05 0"/></filter>
 <filter id="rough"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.4"/></filter>
 <filter id="brushRough" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="1" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="9"/></filter>
 <filter id="soft"><feGaussianBlur stdDeviation="1.6"/></filter>
 <filter id="soft3"><feGaussianBlur stdDeviation="3.2"/></filter>
 <filter id="soft6"><feGaussianBlur stdDeviation="7"/></filter>
 <filter id="glowR"><feGaussianBlur stdDeviation="2.4"/></filter>
 <filter id="glowJ" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
 <radialGradient id="inkDisc" cx="38%" cy="32%" r="80%"><stop offset="0" stop-color="#3b342c"/><stop offset=".55" stop-color="#241f1a"/><stop offset="1" stop-color="#120e0a"/></radialGradient>
 <radialGradient id="cinnDisc" cx="40%" cy="34%" r="78%"><stop offset="0" stop-color="#b25347"/><stop offset=".5" stop-color="#8b3028"/><stop offset="1" stop-color="#54190f"/></radialGradient>
 <radialGradient id="jadeRad" cx="40%" cy="34%" r="78%"><stop offset="0" stop-color="#cfdccb"/><stop offset=".5" stop-color="#7f9a86"/><stop offset="1" stop-color="#3c5849"/></radialGradient>
 <linearGradient id="goldG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0d896"/><stop offset=".5" stop-color="#a2712a"/><stop offset="1" stop-color="#6e4c16"/></linearGradient>
 <radialGradient id="goldRad" cx="40%" cy="34%" r="75%"><stop offset="0" stop-color="#f3e3b0"/><stop offset=".5" stop-color="#c08f3a"/><stop offset="1" stop-color="#6e4c16"/></radialGradient>
 <linearGradient id="brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7cd92"/><stop offset=".5" stop-color="#a2712a"/><stop offset="1" stop-color="#6e4c16"/></linearGradient>
 <linearGradient id="brassH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e4c16"/><stop offset=".5" stop-color="#e7cd92"/><stop offset="1" stop-color="#6e4c16"/></linearGradient>
 <linearGradient id="plank" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6a36"/><stop offset=".5" stop-color="#5e4218"/><stop offset="1" stop-color="#4a330e"/></linearGradient>
 <linearGradient id="steelG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7dde3"/><stop offset=".5" stop-color="#9aa3ad"/><stop offset="1" stop-color="#5f6770"/></linearGradient>
 <linearGradient id="goldBrushG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c9a85a" stop-opacity="0"/><stop offset=".35" stop-color="#b2832d" stop-opacity=".95"/><stop offset=".7" stop-color="#8a6422"/><stop offset="1" stop-color="#6e4c16" stop-opacity=".25"/></linearGradient>
 <radialGradient id="qiAura" cx="50%" cy="44%" r="56%"><stop offset="0" stop-color="#e7c878" stop-opacity=".40"/><stop offset=".4" stop-color="#d8b45e" stop-opacity=".18"/><stop offset=".72" stop-color="#caa84e" stop-opacity=".06"/><stop offset="1" stop-color="#caa84e" stop-opacity="0"/></radialGradient>
 <radialGradient id="auraEarth" cx="50%" cy="44%" r="56%"><stop offset="0" stop-color="#e7a860" stop-opacity=".40"/><stop offset=".5" stop-color="#c98a3a" stop-opacity=".14"/><stop offset="1" stop-color="#c98a3a" stop-opacity="0"/></radialGradient>
 <radialGradient id="auraHeaven" cx="50%" cy="42%" r="58%"><stop offset="0" stop-color="#bfe6d8" stop-opacity=".34"/><stop offset=".5" stop-color="#9fd0c0" stop-opacity=".13"/><stop offset="1" stop-color="#9fd0c0" stop-opacity="0"/></radialGradient>
 <radialGradient id="qiCore" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff4d6" stop-opacity=".9"/><stop offset="1" stop-color="#e7c878" stop-opacity="0"/></radialGradient>
 <linearGradient id="figG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a322a"/><stop offset=".6" stop-color="#2a241d"/><stop offset="1" stop-color="#1c1813"/></linearGradient>
 <linearGradient id="robeMartial" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a352b"/><stop offset=".5" stop-color="#3a2820"/><stop offset="1" stop-color="#2a1c16"/></linearGradient>
 <linearGradient id="robeEarth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3c26"/><stop offset=".5" stop-color="#3a2f1d"/><stop offset="1" stop-color="#2a2214"/></linearGradient>
 <linearGradient id="robeHeaven" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#39424a"/><stop offset=".5" stop-color="#2c343b"/><stop offset="1" stop-color="#222a30"/></linearGradient>
 <radialGradient id="moonG" cx="42%" cy="38%" r="62%"><stop offset="0" stop-color="#f4ecd6"/><stop offset=".7" stop-color="#d9c79e"/><stop offset="1" stop-color="#b69e6b"/></radialGradient>
 <radialGradient id="forgeGlow" cx="50%" cy="60%" r="60%"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".5"/><stop offset=".5" stop-color="#e0762a" stop-opacity=".22"/><stop offset="1" stop-color="#b23c1e" stop-opacity="0"/></radialGradient>
 <radialGradient id="nicheShade" cx="50%" cy="40%" r="62%"><stop offset="0" stop-color="#7a5424" stop-opacity="0"/><stop offset=".62" stop-color="#7a5424" stop-opacity=".05"/><stop offset=".9" stop-color="#5e3f1a" stop-opacity=".16"/><stop offset="1" stop-color="#4a3014" stop-opacity=".24"/></radialGradient>
 <linearGradient id="daisG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9c79e"/><stop offset=".5" stop-color="#bca675"/><stop offset="1" stop-color="#8d7548"/></linearGradient>
 <linearGradient id="steleG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8b485"/><stop offset=".5" stop-color="#a9946a"/><stop offset="1" stop-color="#7c6843"/></linearGradient>
 <radialGradient id="pillarG" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#caa24a" stop-opacity=".10"/><stop offset="1" stop-color="#caa24a" stop-opacity="0"/></radialGradient>
 <radialGradient id="nebulaG" cx="46%" cy="42%" r="58%"><stop offset="0" stop-color="#c3b07a" stop-opacity=".26"/><stop offset=".45" stop-color="#8fa0bf" stop-opacity=".14"/><stop offset=".8" stop-color="#7f8fb0" stop-opacity=".05"/><stop offset="1" stop-color="#7f8fb0" stop-opacity="0"/></radialGradient>
 <linearGradient id="bondFill" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#a4451f"/><stop offset=".4" stop-color="#c98a3a"/><stop offset=".78" stop-color="#e7b85a"/><stop offset="1" stop-color="#ffe6a8"/></linearGradient>
</defs></svg>`;
