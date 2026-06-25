/**
 * M.IV.3 ARTS-PORT — the Fortune Draw scene/SVG builders, ported VERBATIM from the artifact (fortune-draw.html
 * §SVG helpers). Pure string builders (wax/gold seals, tassels, motes, the WHEEL OF FATE lectern scene, the
 * palace lantern, couplets, censers, kind/currency glyphs, the fate-thread spindle). Embedded into the HTML via
 * dangerouslySetInnerHTML; all `url(#)` refs resolve from FORTUNE_DRAW_SVG_DEFS. Mirrors panoplyFigureSvg.ts.
 */

import type { FateThreadSurface } from '../../../systems/ui/fortune/fortuneDrawTypes.js';

// inline star glyphs (the artifact used the U+2726 / U+2605 star code points; check:icons forbids those, so
// these SVG stars render identically via currentColor — they inherit the parent's color exactly).
export const STAR4 = `<svg width="9" height="9" viewBox="0 0 10 10" style="display:inline-block;vertical-align:middle"><path d="M5,0 L6,4 L10,5 L6,6 L5,10 L4,6 L0,5 L4,4 Z" fill="currentColor"/></svg>`;
export const STAR5 = `<svg width="9" height="9" viewBox="0 0 10 10" style="display:inline-block;vertical-align:middle"><path d="M5,.3 L6.18,3.6 L9.7,3.7 L6.9,5.9 L7.9,9.4 L5,7.3 L2.1,9.4 L3.1,5.9 L.3,3.7 L3.82,3.6 Z" fill="currentColor"/></svg>`;

// rarity tier → ramp hex (the F0 ramp, as literals so the SVG can fill without getComputedStyle)
export const RAMP: Record<string, string> = { mortal: '#8a8074', spirit: '#3f7d52', earth: '#2f74a3', heaven: '#7d52a0', immortal: '#c47b22' };
export const RAMP_DEEP: Record<string, string> = { mortal: '#6f665b', spirit: '#2e6240', earth: '#235a7f', heaven: '#5f3e80', immortal: '#9a5f1a' };

const tassel = (x: number, y: number, col: string, len = 14, delay = 0): string =>
  `<g transform="translate(${x},${y})"><g class="swayT" style="animation-delay:${delay}s"><circle r="3" fill="${col}"/><path d="M-2.5,1 q-2,${len * 0.6} -3.5,${len} M0,1 q0,${len * 0.7} 0,${len} M2.5,1 q2,${len * 0.6} 3.5,${len}" stroke="${col}" stroke-width="1.2" fill="none" opacity=".9"/><circle cy="${len}" r="1.4" fill="${col}"/></g></g>`;

/** wax seal (cinnabar by default, jade optional) — the project's signature chop. */
export function waxSeal(chars: string, size: number, rot?: number, jade?: boolean): string {
  const C = size / 2, r = size / 2 - 2, N = 22; let p = '';
  for (let i = 0; i <= N; i++) { const a = (i / N) * 2 * Math.PI; const rr = r * (0.9 + 0.06 * Math.sin(i * 2.7 + 1.3) + 0.04 * Math.cos(i * 1.6 + 0.5)); const x = C + rr * Math.cos(a), y = C + rr * Math.sin(a); p += (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1) + ' '; }
  p += 'Z';
  const cs = [...chars], fs = size * (cs.length > 2 ? 0.27 : 0.32), gap = fs * 1.02, y0 = C - ((cs.length - 1) * gap) / 2;
  const txt = cs.map((c, i) => `<tspan x="${C}" y="${(y0 + i * gap + fs * 0.34).toFixed(1)}">${c}</tspan>`).join('');
  const fill = jade ? 'url(#jadeRad)' : 'url(#cinnDisc)', str = jade ? '#1c3128' : '#54190f', inner = jade ? 'rgba(220,240,225,.4)' : 'rgba(255,214,196,.4)', tx = jade ? '#e9efe2' : '#f4dccb';
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(${rot || 0}deg);overflow:visible">
   <path d="${p}" fill="${fill}" stroke="${str}" stroke-width="1.3"/>
   <path d="${p}" fill="none" stroke="${inner}" stroke-width=".8" transform="translate(${C} ${C}) scale(.82) translate(${-C} ${-C})"/>
   <text text-anchor="middle" font-family="var(--kai)" font-weight="700" font-size="${fs.toFixed(1)}" fill="${tx}" letter-spacing="0">${txt}</text></svg>`;
}

/** gold seal disc (for an unfurled rarity reveal). */
export function goldSeal(chars: string, size: number, rot?: number): string {
  const C = size / 2, r = size / 2 - 2, N = 22; let p = '';
  for (let i = 0; i <= N; i++) { const a = (i / N) * 2 * Math.PI; const rr = r * (0.9 + 0.06 * Math.sin(i * 2.7 + 1.3) + 0.04 * Math.cos(i * 1.6 + 0.5)); const x = C + rr * Math.cos(a), y = C + rr * Math.sin(a); p += (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1) + ' '; }
  p += 'Z'; const cs = [...chars], fs = size * (cs.length > 2 ? 0.27 : 0.34), gap = fs * 1.02, y0 = C - ((cs.length - 1) * gap) / 2;
  const txt = cs.map((c, i) => `<tspan x="${C}" y="${(y0 + i * gap + fs * 0.34).toFixed(1)}">${c}</tspan>`).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(${rot || 0}deg);overflow:visible">
   <path d="${p}" fill="url(#goldRad)" stroke="#6e4c16" stroke-width="1.3"/>
   <path d="${p}" fill="none" stroke="rgba(255,244,210,.5)" stroke-width=".8" transform="translate(${C} ${C}) scale(.82) translate(${-C} ${-C})"/>
   <text text-anchor="middle" font-family="var(--kai)" font-weight="700" font-size="${fs.toFixed(1)}" fill="#2a1d08">${txt}</text></svg>`;
}

/** drifting qi-motes (presentation only; Math.random is fine in the view). */
export function motesHTML(n: number, cols: string[]): string {
  let h = '';
  for (let i = 0; i < n; i++) {
    const c = cols[i % cols.length];
    h += `<span class="mote" style="left:${(8 + Math.random() * 84).toFixed(1)}%;bottom:${(6 + Math.random() * 30).toFixed(1)}%;background:radial-gradient(circle at 35% 30%,#fff2c8,${c} 60%,transparent 75%);animation-delay:${(Math.random() * 6).toFixed(1)}s;animation-duration:${(5 + Math.random() * 3).toFixed(1)}s"></span>`;
  }
  return h;
}

/** the diviner's-chamber backdrop: WHEEL OF FATE mandala + ink-wash ranges + mist. */
export function lecternScene(): string {
  return `<svg class="lectern-scene" viewBox="0 0 1000 640" preserveAspectRatio="none" width="100%" height="100%">
   <g transform="translate(500,168)" opacity=".24">
     <circle r="128" fill="url(#wheelHub)"/>
     <g class="ring-spin">
       <circle r="152" fill="none" stroke="#d6ad57" stroke-width=".7" stroke-dasharray="2 6"/>
       <circle r="118" fill="none" stroke="#d6ad57" stroke-width=".7"/>
       ${Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * 2 * Math.PI, r0 = 140, r1 = i % 3 === 0 ? 152 : 147; return `<line x1="${(r0 * Math.cos(a)).toFixed(1)}" y1="${(r0 * Math.sin(a)).toFixed(1)}" x2="${(r1 * Math.cos(a)).toFixed(1)}" y2="${(r1 * Math.sin(a)).toFixed(1)}" stroke="#d6ad57" stroke-width="${i % 3 === 0 ? 1 : 0.55}"/>`; }).join('')}
       ${Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * 2 * Math.PI + Math.PI / 8; return `<circle cx="${(118 * Math.cos(a)).toFixed(1)}" cy="${(118 * Math.sin(a)).toFixed(1)}" r="1.8" fill="#d6ad57"/>`; }).join('')}
       <circle r="86" fill="none" stroke="#d6ad57" stroke-width=".55" stroke-dasharray="1 5"/>
     </g>
     <circle r="188" fill="none" stroke="#d6ad57" stroke-width="1.3"/>
     <circle r="180" fill="none" stroke="#d6ad57" stroke-width=".55"/>
     ${[[1, 1, 1], [1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [0, 1, 1], [1, 0, 1], [0, 0, 0]].map((bits, i) => {
       const a = (i / 8) * 2 * Math.PI - Math.PI / 2, R = 205, cx = R * Math.cos(a), cy = R * Math.sin(a), tk0 = 189, tk1 = 196;
       const tick = `<line x1="${(tk0 * Math.cos(a)).toFixed(1)}" y1="${(tk0 * Math.sin(a)).toFixed(1)}" x2="${(tk1 * Math.cos(a)).toFixed(1)}" y2="${(tk1 * Math.sin(a)).toFixed(1)}" stroke="#d6ad57" stroke-width="1"/>`;
       const w = 11, g = 3.4, lw = 1.8;
       const lines = bits.map((b, j) => { const y = (j - 1) * g; return b
         ? `<line x1="${-w / 2}" y1="${y}" x2="${w / 2}" y2="${y}" stroke="#d6ad57" stroke-width="${lw}" stroke-linecap="round"/>`
         : `<line x1="${-w / 2}" y1="${y}" x2="${-w * 0.16}" y2="${y}" stroke="#d6ad57" stroke-width="${lw}" stroke-linecap="round"/><line x1="${w * 0.16}" y1="${y}" x2="${w / 2}" y2="${y}" stroke="#d6ad57" stroke-width="${lw}" stroke-linecap="round"/>`;
       }).join('');
       return tick + `<g transform="translate(${cx.toFixed(1)},${cy.toFixed(1)})">${lines}</g>`;
     }).join('')}
   </g>
   <defs>
     <radialGradient id="wheelHub" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#d6ad57" stop-opacity=".14"/><stop offset=".6" stop-color="#a2712a" stop-opacity=".05"/><stop offset="1" stop-color="#a2712a" stop-opacity="0"/></radialGradient>
     <linearGradient id="ridgeFar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3550" stop-opacity=".5"/><stop offset="1" stop-color="#2a3550" stop-opacity="0"/></linearGradient>
     <linearGradient id="ridgeMid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e2738" stop-opacity=".62"/><stop offset="1" stop-color="#1e2738" stop-opacity="0"/></linearGradient>
     <linearGradient id="ridgeNear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#171a26" stop-opacity=".72"/><stop offset="1" stop-color="#171a26" stop-opacity="0"/></linearGradient>
   </defs>
   <g class="mist-drift"><path d="M0,420 L120,358 L240,392 L380,330 L520,372 L660,338 L800,382 L1000,348 L1000,640 L0,640 Z" fill="url(#ridgeFar)"/></g>
   <g class="mist-drift b"><path d="M0,472 L160,408 L300,442 L460,394 L620,432 L780,398 L920,442 L1000,418 L1000,640 L0,640 Z" fill="url(#ridgeMid)"/></g>
   <path d="M0,524 L200,470 L420,502 L600,458 L820,502 L1000,474 L1000,640 L0,640 Z" fill="url(#ridgeNear)"/>
   <g class="mist-drift" opacity=".5"><ellipse cx="380" cy="430" rx="320" ry="20" fill="#cdbfae" opacity=".10" filter="url(#soft)"/></g>
   <g class="mist-drift b" opacity=".5"><ellipse cx="680" cy="470" rx="300" ry="16" fill="#cdbfae" opacity=".09" filter="url(#soft)"/></g>
 </svg>`;
}

export function lecternLantern(): string {
  return `<div class="lectern-lantern lantern-sway"><svg width="92" height="156" viewBox="0 0 92 156" style="overflow:visible">
   <ellipse class="lantern-glow" cx="46" cy="86" rx="52" ry="66" style="fill:url(#lanternGlowG)"/>
   <defs><radialGradient id="lanternGlowG" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f0c06a" stop-opacity=".55"/><stop offset=".5" stop-color="#d8943a" stop-opacity=".18"/><stop offset="1" stop-color="#d8943a" stop-opacity="0"/></radialGradient>
     <linearGradient id="lanternBody" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a241c"/><stop offset=".4" stop-color="#c25a3e"/><stop offset=".5" stop-color="#e6985a"/><stop offset=".6" stop-color="#c25a3e"/><stop offset="1" stop-color="#7a241c"/></linearGradient></defs>
   <line x1="46" y1="-2" x2="46" y2="40" stroke="#3a2a0e" stroke-width="2"/>
   <ellipse cx="46" cy="42" rx="20" ry="5" fill="url(#brass)" stroke="#3a2a0e" stroke-width="1"/>
   <ellipse cx="46" cy="40" rx="13" ry="3.5" fill="#6e4c16"/>
   <path d="M28,46 Q46,42 64,46 L60,52 L32,52 Z" fill="url(#brass)" stroke="#3a2a0e" stroke-width=".8"/>
   <rect x="30" y="52" width="32" height="56" rx="13" fill="url(#lanternBody)" stroke="#5a1a14" stroke-width="1"/>
   <ellipse cx="46" cy="80" rx="13" ry="22" fill="#f5cf86" opacity=".5"/>
   <line x1="30" y1="66" x2="62" y2="66" stroke="#5a1a14" stroke-width=".8" opacity=".7"/>
   <line x1="30" y1="94" x2="62" y2="94" stroke="#5a1a14" stroke-width=".8" opacity=".7"/>
   <line x1="46" y1="52" x2="46" y2="108" stroke="#5a1a14" stroke-width=".7" opacity=".5"/>
   <path d="M32,108 Q46,112 60,108 L56,114 L36,114 Z" fill="url(#brass)" stroke="#3a2a0e" stroke-width=".8"/>
   <ellipse cx="46" cy="114" rx="9" ry="3" fill="#6e4c16"/>
   ${tassel(46, 116, '#b5392b', 20, 0.4)}
 </svg></div>`;
}

export function couplet(side: 'l' | 'r', chars: string): string {
  return `<div class="couplet ${side}"><div class="cp-cord"></div><div class="cp-sway">
   <div class="cp-cap t"></div>
   <div class="cp-body">${[...chars].map((c) => `<span class="cp-ch">${c}</span>`).join('')}</div>
   <div class="cp-cap b"></div>
   ${tassel(21, 4, '#b5392b', 16, 0.6)}
 </div></div>`;
}

export function censer(): string {
  return `<svg width="60" height="100" viewBox="0 0 60 100" style="overflow:visible">
   <g class="censer-smoke"><path class="sm s1" d="M30,46 q-7,-11 0,-22 q7,-11 0,-22"/><path class="sm s2" d="M30,46 q8,-12 0,-24 q-8,-11 0,-20"/></g>
   <ellipse cx="30" cy="74" rx="24" ry="6" fill="#000" opacity=".34"/>
   <path d="M14,64 L18,74 M46,64 L42,74 M30,66 L30,76" stroke="#5a4216" stroke-width="3" stroke-linecap="round"/>
   <path d="M9,52 Q30,46 51,52 L45,66 Q30,72 15,66 Z" fill="url(#brass)" stroke="#3a2a0e" stroke-width="1"/>
   <path d="M6,50 q-7,-1 -5,8 M54,50 q7,-1 5,8" fill="none" stroke="url(#brass)" stroke-width="3.4"/>
   <ellipse cx="30" cy="51" rx="21" ry="6" fill="#6e4c16" stroke="#3a2a0e" stroke-width="1"/>
   <ellipse cx="30" cy="50" rx="15" ry="4" fill="#241204"/>
   <ellipse cx="30" cy="50" rx="9" ry="2.3" fill="#c9772a" opacity=".75"/>
   <ellipse cx="30" cy="50" rx="4" ry="1.2" fill="#f0b860" opacity=".8"/>
   <rect x="11" y="58" width="38" height="2.6" rx="1.3" fill="rgba(231,205,146,.4)"/>
 </svg>`;
}

export function kindGlyph(kind: string): string {
  const g: Record<string, string> = {
    active: `<svg width="16" height="16" viewBox="0 0 16 16"><path d="M2.5,12.5 C4,7.5 8.5,4.8 13.5,5.4 C9.8,6.6 7,9.2 6.4,13 C5.4,11.4 4.2,11.2 2.5,12.5 Z" fill="#235a7a"/><circle cx="13" cy="5.4" r="1.3" fill="#235a7a"/></svg>`,
    passive: `<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="#2c5a3a" stroke-width="1.3"/><circle cx="8" cy="8" r="3.3" fill="none" stroke="#2c5a3a" stroke-width="1.1"/><circle cx="8" cy="8" r="1.1" fill="#2c5a3a"/></svg>`,
    ultimate: `<svg width="16" height="16" viewBox="0 0 16 16"><path d="M8,0.6 L9.6,6.4 L15.4,8 L9.6,9.6 L8,15.4 L6.4,9.6 L0.6,8 L6.4,6.4 Z" fill="#7a261c"/><circle cx="8" cy="8" r="1.6" fill="#c08f3a"/></svg>`,
  };
  return `<span class="kglyph" title="${kind}">${g[kind] || ''}</span>`;
}

export function currencyGlyph(id: string, size?: number): string {
  const s = size || 13; const v = `width="${s}" height="${s}" viewBox="0 0 13 13"`;
  if (id === 'fortune') return `<svg ${v}><path d="M6.5,.6 L9.6,2 L11,5.1 L11,7.9 L9.6,11 L6.5,12.4 L3.4,11 L2,7.9 L2,5.1 L3.4,2 Z" fill="url(#goldRad)" stroke="#6e4c16" stroke-width=".9"/><circle cx="6.5" cy="6.5" r="3.4" fill="#7a241c" stroke="#54190f" stroke-width=".5"/><text x="6.5" y="8.4" text-anchor="middle" font-family="var(--kai)" font-size="4.4" font-weight="700" fill="#f4dccb">緣</text></svg>`;
  if (id === 'stones') return `<svg ${v}><path d="M6.5,1 L11.5,5 L6.5,12 L1.5,5 Z" fill="#3f87b6" stroke="#235a7a" stroke-width=".8"/><path d="M1.5,5 L11.5,5 M6.5,1 L6.5,12 M4,5 L6.5,12 L9,5" stroke="#cfe3f0" stroke-width=".5" fill="none" opacity=".7"/></svg>`;
  if (id === 'merit') return `<svg ${v}><circle cx="6.5" cy="6.5" r="5.6" fill="#8b3028" stroke="#54190f" stroke-width=".9"/><path d="M6.5,3 L7.5,5.5 L10,5.7 L8,7.4 L8.7,10 L6.5,8.5 L4.3,10 L5,7.4 L3,5.7 L5.5,5.5 Z" fill="#f4dccb"/></svg>`;
  return `<svg ${v}><circle cx="6.5" cy="6.5" r="5.6" fill="url(#goldRad)" stroke="#6e4c16" stroke-width=".9"/><rect x="4.4" y="4.4" width="4.2" height="4.2" rx="1" fill="none" stroke="#6e4c16" stroke-width="1.1"/></svg>`;
}

const CUR_COL: Record<string, string> = { fortune: '#84591b', gold: '#84591b', stones: '#235a7a', merit: '#7a261c' };

export function priceTag(txt: string, sold?: boolean): string {
  if (sold) return `<span class="pl-price" style="color:var(--ink-45)">— drawn —</span>`;
  const id = /Spirit\s*Stone/i.test(txt) ? 'stones' : /Merit/i.test(txt) ? 'merit' : 'gold';
  return `<span class="pl-price" style="color:${CUR_COL[id]}"><span class="cur">${currencyGlyph(id, 13)}</span>${txt}</span>`;
}

/**
 * THE FATE-THREAD SPINDLE — two silk threads winding up toward sealed apex knots that ignite on guarantee.
 * Encodes both pity tracks, each fill ratio, taut/guaranteed, and the apex tier each leads to. Returns SVG.
 */
export function fateSpindle(fate: FateThreadSurface): string {
  const W = 224, H = 360, cx = W / 2;
  const topY = 30, botY = H - 30, span = botY - topY;
  const cols = [
    { t: fate.epic, x: cx - 34, col: RAMP.heaven, deep: RAMP_DEEP.heaven, apexGlyph: '极' },
    { t: fate.legendary, x: cx + 34, col: RAMP.immortal, deep: RAMP_DEEP.immortal, apexGlyph: '仙' },
  ];
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">`;
  s += `<rect x="${cx - 6}" y="${topY - 6}" width="12" height="${span + 18}" rx="5" fill="url(#spindleWood)" stroke="#3a2a0e" stroke-width="1"/>`;
  s += `<rect x="${cx - 6}" y="${topY - 6}" width="4" height="${span + 18}" fill="rgba(231,205,146,.4)"/>`;
  s += `<ellipse cx="${cx}" cy="${topY - 8}" rx="13" ry="7" fill="url(#brass)" stroke="#3a2a0e"/><ellipse cx="${cx}" cy="${topY - 11}" rx="8" ry="4" fill="#6e4c16"/>`;
  s += `<ellipse cx="${cx}" cy="${botY + 10}" rx="30" ry="8" fill="url(#brass)" stroke="#3a2a0e"/><ellipse cx="${cx}" cy="${botY + 8}" rx="20" ry="5" fill="#6e4c16"/>`;
  cols.forEach((c, ci) => {
    const t = c.t, ratio = t.ratio, guar = t.guaranteed;
    const rodX = c.x;
    s += `<line x1="${rodX}" y1="${topY}" x2="${rodX}" y2="${botY}" stroke="rgba(120,86,38,.3)" stroke-width="6" stroke-linecap="round"/>`;
    const tn = Math.min(t.threshold, 12);
    for (let i = 0; i <= tn; i++) { const y = botY - (i / tn) * span; const major = i === tn; s += `<line x1="${rodX + (ci ? 5 : -5)}" y1="${y.toFixed(1)}" x2="${rodX + (ci ? 11 : -11)}" y2="${y.toFixed(1)}" stroke="rgba(74,51,14,${major ? 0.85 : 0.45})" stroke-width="${major ? 1.4 : 0.7}"/>`; }
    const fillH = ratio * span, fillTopY = botY - fillH;
    const turns = Math.max(2, Math.round(ratio * tn));
    let wp = '';
    const steps = Math.max(40, turns * 5);
    for (let i = 0; i <= steps; i++) { const f = i / steps; const y = botY - f * fillH; const phase = f * turns * 2 * Math.PI; const xoff = Math.sin(phase) * 7; wp += (i ? 'L' : 'M') + (rodX + xoff).toFixed(1) + ',' + y.toFixed(1) + ' '; }
    s += `<path d="${wp}" fill="none" stroke="${c.deep}" stroke-width="4.2" stroke-linecap="round" opacity=".55"/>`;
    s += `<path d="${wp}" fill="none" stroke="${c.col}" stroke-width="3" stroke-linecap="round" ${guar ? 'class="threadCrawl" style="stroke-dasharray:none"' : ''}/>`;
    if (guar) s += `<path d="${wp}" fill="none" stroke="rgba(255,250,235,.6)" stroke-width="1.1" stroke-linecap="round" class="threadCrawl"/>`;
    const apexY = topY + 6, apexX = rodX;
    if (guar) {
      s += `<line x1="${rodX}" y1="${fillTopY.toFixed(1)}" x2="${apexX}" y2="${apexY}" stroke="${c.col}" stroke-width="2.4" filter="url(#glowR)"/>`;
      s += `<line x1="${rodX}" y1="${fillTopY.toFixed(1)}" x2="${apexX}" y2="${apexY}" stroke="rgba(255,250,235,.7)" stroke-width=".9" class="threadCrawl"/>`;
    } else {
      const midY = (fillTopY + apexY) / 2, sag = 10;
      s += `<path d="M${rodX},${fillTopY.toFixed(1)} Q${rodX + (ci ? sag : -sag)},${midY.toFixed(1)} ${apexX},${apexY}" fill="none" stroke="${c.col}" stroke-width="1.8" opacity=".5" stroke-dasharray="2 5"/>`;
    }
    const knotFill = guar ? 'url(#goldRad)' : 'var(--paper-deep)', knotStroke = guar ? '#6e4c16' : 'rgba(120,90,46,.5)';
    s += `<g transform="translate(${apexX},${apexY})">`;
    if (guar) s += `<circle r="15" fill="${c.col}" opacity=".3" style="animation:apexThrobK 2.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center"/>`;
    s += `<circle r="10" fill="${knotFill}" stroke="${knotStroke}" stroke-width="1.5" ${guar ? 'style="animation:apexThrobK 2.4s ease-in-out infinite;transform-box:fill-box;transform-origin:center"' : ''}/>`;
    s += `<text y="3.5" text-anchor="middle" font-family="var(--kai)" font-size="11" font-weight="700" fill="${guar ? '#2a1d08' : 'var(--ink-45)'}">${c.apexGlyph}</text></g>`;
    s += `<g transform="translate(${rodX},${fillTopY.toFixed(1)})"><circle r="11" fill="url(#inkDisc)" stroke="${c.col}" stroke-width="1.8"/><text y="3.5" text-anchor="middle" font-size="9.5" font-weight="800" fill="#efe3c9">${t.current}</text></g>`;
  });
  s += `<g style="transform-origin:${cx}px ${botY + 10}px;animation:spindleSpinK 24s linear infinite"><circle cx="${cx}" cy="${botY + 10}" r="6" fill="none" stroke="rgba(231,205,146,.4)" stroke-dasharray="1 4"/></g>`;
  s += `</svg>`;
  return s;
}
