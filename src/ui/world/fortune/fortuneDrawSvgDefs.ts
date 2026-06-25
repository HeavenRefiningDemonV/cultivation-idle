/**
 * M.IV.3 ARTS-PORT — the Fortune Draw SVG <defs> block, ported VERBATIM from the artifact (fortune-draw.html
 * render()). Injected ONCE at the stage root (into the absolute `.fortuneDefs` div) so the lectern scene, the
 * fate-thread spindle, the wax/gold seals, the lantern, and the censers all resolve their `url(#)` refs from a
 * single defs block. Mirrors PANOPLY_SVG_DEFS.
 */
export const FORTUNE_DRAW_SVG_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <filter id="grainF"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="7" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.33  0 0 0 0 0.20  0 0 0 0.05 0"/></filter>
  <radialGradient id="inkDisc" cx="38%" cy="32%" r="80%"><stop offset="0" stop-color="#3b342c"/><stop offset=".55" stop-color="#241f1a"/><stop offset="1" stop-color="#120e0a"/></radialGradient>
  <radialGradient id="cinnDisc" cx="40%" cy="34%" r="78%"><stop offset="0" stop-color="#b25347"/><stop offset=".5" stop-color="#8b3028"/><stop offset="1" stop-color="#54190f"/></radialGradient>
  <radialGradient id="jadeRad" cx="40%" cy="34%" r="78%"><stop offset="0" stop-color="#cfdccb"/><stop offset=".5" stop-color="#7f9a86"/><stop offset="1" stop-color="#3c5849"/></radialGradient>
  <radialGradient id="goldRad" cx="40%" cy="34%" r="75%"><stop offset="0" stop-color="#f3e3b0"/><stop offset=".5" stop-color="#c08f3a"/><stop offset="1" stop-color="#6e4c16"/></radialGradient>
  <linearGradient id="goldG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0d896"/><stop offset=".5" stop-color="#a2712a"/><stop offset="1" stop-color="#6e4c16"/></linearGradient>
  <linearGradient id="brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7cd92"/><stop offset=".5" stop-color="#a2712a"/><stop offset="1" stop-color="#6e4c16"/></linearGradient>
  <linearGradient id="brassH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e4c16"/><stop offset=".5" stop-color="#e7cd92"/><stop offset="1" stop-color="#6e4c16"/></linearGradient>
  <linearGradient id="spindleWood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a330e"/><stop offset=".5" stop-color="#8a6a36"/><stop offset="1" stop-color="#4a330e"/></linearGradient>
  <filter id="soft"><feGaussianBlur stdDeviation="1.6"/></filter>
  <filter id="glowJ" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="glowR" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.6"/></filter>
</defs></svg>`;
