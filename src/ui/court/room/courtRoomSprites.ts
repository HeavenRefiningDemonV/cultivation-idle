import type { CourtPath, TemperingCourtSurface } from '../../../systems/meridians/index.js';

/**
 * W7 — the Tempering Court Room SVG sprites (artifact buildScene / buildFigure /
 * buildMeridianChannel / buildSmoke). HEX-ALLOWED ZONE: these are static decorative
 * SVG sprite/scene art (not UI-state colour), so raw hex is sprite data here — exactly
 * as the artifact authors it. Returned as strings and rendered via
 * dangerouslySetInnerHTML (deterministic, render-only; no gameplay recompute, no RNG).
 * CSS-var references are routed to the Court tokens (--court-kai/--court-serif).
 */

const PT = (cx: number, cy: number, r: number, a: number): [number, number] => [
  cx + r * Math.cos(((a - 90) * Math.PI) / 180),
  cy + r * Math.sin(((a - 90) * Math.PI) / 180),
];

export interface CourtRoomTheme {
  watermark: string;
  meridP: string;
  core: string;
  auraOp: number;
  rim: string;
  rimW: number;
  moteCols: [string, string];
  moteDur: number;
  moteW: number;
  corner: string;
  atmos: string;
}

export const COURT_THEME: Record<CourtPath, CourtRoomTheme> = {
  martial: {
    watermark: '气',
    meridP: 'url(#meridP_martial)',
    core: 'url(#qiCore)',
    auraOp: 0.5,
    rim: '#e7c878',
    rimW: 2,
    moteCols: ['#fff2c8', '#d9b35e'],
    moteDur: 0.82,
    moteW: 5,
    corner: '#8b6a2a',
    atmos:
      'radial-gradient(120% 80% at 50% 0%, rgba(120,128,138,.16), transparent 55%), linear-gradient(180deg, rgba(40,42,48,.12), transparent 50%, rgba(96,40,30,.10))',
  },
  earth: {
    watermark: '精',
    meridP: 'url(#meridP_earth)',
    core: 'url(#emberCore)',
    auraOp: 0.55,
    rim: '#ffb15a',
    rimW: 2.4,
    moteCols: ['#ffe0a8', '#e0762a'],
    moteDur: 1.15,
    moteW: 6,
    corner: '#a44731',
    atmos:
      'radial-gradient(130% 95% at 50% 102%, rgba(226,120,40,.34), transparent 58%), linear-gradient(180deg, rgba(54,24,8,.20), rgba(40,18,8,.04) 45%, rgba(150,60,22,.16))',
  },
  heaven: {
    watermark: '神',
    meridP: 'url(#meridP_heaven)',
    core: 'url(#qiCore)',
    auraOp: 0.5,
    rim: '#cfe8ff',
    rimW: 1.8,
    moteCols: ['#fff6e2', '#cfe0ff'],
    moteDur: 1.3,
    moteW: 5,
    corner: '#4e6b5e',
    atmos:
      'linear-gradient(180deg, rgba(26,34,64,.40), rgba(30,44,70,.20) 48%, rgba(20,40,44,.10)), radial-gradient(70% 50% at 50% 30%, rgba(120,150,200,.16), transparent 70%)',
  },
};

/** Irregular-rim wax seal as an SVG string (artifact waxSeal). */
export function waxSealString(chars: string, size: number, rot: number, jade: boolean): string {
  const C = size / 2;
  const r = size / 2 - 2;
  const N = 22;
  let p = '';
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * 2 * Math.PI;
    const rr = r * (0.9 + 0.06 * Math.sin(i * 2.7 + 1.3) + 0.04 * Math.cos(i * 1.6 + 0.5));
    const x = C + rr * Math.cos(a);
    const y = C + rr * Math.sin(a);
    p += (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
  }
  p += 'Z';
  const cs = [...chars];
  const fs = size * (cs.length > 2 ? 0.27 : 0.32);
  const gap = fs * 1.02;
  const y0 = C - ((cs.length - 1) * gap) / 2;
  const txt = cs
    .map((c, i) => `<tspan x="${C}" y="${(y0 + i * gap + fs * 0.34).toFixed(1)}">${c}</tspan>`)
    .join('');
  const fill = jade ? 'url(#jadeRad)' : 'url(#cinnDisc)';
  const str = jade ? '#1c3128' : '#54190f';
  const inner = jade ? 'rgba(220,240,225,.4)' : 'rgba(255,214,196,.4)';
  const tx = jade ? '#e9efe2' : '#f4dccb';
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(${rot || 0}deg);overflow:visible"><path d="${p}" fill="${fill}" stroke="${str}" stroke-width="1.3"/><path d="${p}" fill="none" stroke="${inner}" stroke-width=".8" transform="translate(${C} ${C}) scale(.82) translate(${-C} ${-C})"/><text text-anchor="middle" font-family="var(--court-kai)" font-weight="700" font-size="${fs.toFixed(1)}" fill="${tx}">${txt}</text></svg>`;
}

/** Corner-flourish data-URI (artifact cornerURI), tinted per path. */
export function courtCornerUriString(color: string): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><g fill='none' stroke='${color}' stroke-width='2' stroke-linecap='round'>` +
    `<path d='M8,72 C8,36 24,16 60,12'/><path d='M14,72 C14,42 30,24 62,20' opacity='.6'/>` +
    `<circle cx='62' cy='13' r='3.4' fill='${color}' stroke='none'/><path d='M8,72 q-2,-10 4,-16'/></g></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

const ys = [452, 400, 348, 296, 244, 192, 138];
const X = 606;

/** The 7-node meridian channel (artifact buildMeridianChannel) — PROTECTED geometry. */
export function buildCourtMeridianChannel(surface: TemperingCourtSurface, reducedMotion: boolean): string {
  if (!surface.path) return '';
  const theme = COURT_THEME[surface.path];
  const meridians = surface.meridians;
  const ai = meridians.findIndex((m) => m.isActive);
  const realm = surface.realm.index1to7;
  const highY = ys[Math.min(Math.max(realm, 1), 7) - 1];
  const active = surface.status === 'active' && !reducedMotion;
  let s = `<line x1="${X}" y1="470" x2="${X}" y2="138" stroke="rgba(120,96,52,.18)" stroke-width="6" stroke-linecap="round"/>`;
  s += `<line x1="${X}" y1="470" x2="${X}" y2="${highY}" stroke="${theme.meridP}" stroke-width="6" stroke-linecap="round" filter="url(#glowJ)" opacity=".85"/>`;
  if (active && ai >= 0) {
    s += `<line x1="${X}" y1="470" x2="${X}" y2="${ys[ai]}" stroke="#fff6da" stroke-width="2.4" class="qiflow"/>`;
  }
  meridians.forEach((m, i) => {
    const y = ys[i];
    if (!m.unlocked) {
      s += `<g transform="translate(${X - 11},${y - 11})" opacity=".92">${waxSealString('封', 22, -5, false)}</g>`;
      return;
    }
    const isA = i === ai;
    const capped = m.capState === 'capped';
    const bottle = m.isBottleneck;
    const col = capped ? 'url(#goldRad)' : bottle ? 'url(#cinnDisc)' : isA ? theme.core : 'url(#jadeRad)';
    const r = isA ? 13 : 9;
    if (isA) s += `<circle cx="${X}" cy="${y}" r="22" fill="${theme.core}" opacity=".45" class="breatheA"/>`;
    const stroke = capped ? '#6e4c16' : bottle ? '#54190f' : isA ? theme.rim : '#1c3128';
    const extra = isA ? 'filter="url(#glowJ)" class="mp"' : bottle && !reducedMotion ? 'class="weakp"' : '';
    s += `<circle cx="${X}" cy="${y}" r="${r}" fill="${col}" stroke="${stroke}" stroke-width="1.6" ${extra}/>`;
    if (capped) s += `<text x="${X}" y="${y + 4}" text-anchor="middle" font-family="var(--court-kai)" font-size="${isA ? 11 : 9}" fill="#3a2a0e">滿</text>`;
  });
  if (ai >= 0) {
    const m = meridians[ai];
    const y = ys[ai];
    const capped = m.capState === 'capped';
    s += `<line x1="${X + 16}" y1="${y}" x2="${X + 46}" y2="${y}" stroke="${theme.rim}" stroke-width="1.2" opacity=".7"/>`;
    s += `<text x="${X + 52}" y="${y - 3}" font-family="var(--court-serif)" font-weight="800" font-size="13" fill="#2f2a22" paint-order="stroke" stroke="rgba(243,234,215,.92)" stroke-width="3.4">${m.name}</text>`;
    s += `<text x="${X + 52}" y="${y + 13}" font-family="var(--court-serif)" font-weight="800" font-size="12" fill="${m.capState === 'open' ? '#0f6f5a' : '#84591b'}" paint-order="stroke" stroke="rgba(243,234,215,.92)" stroke-width="3.2">${m.rating}/${m.cap} · ${m.root.label}</text>`;
    if (capped) s += `<text x="${X + 52}" y="${y + 28}" font-family="var(--court-serif)" font-weight="700" font-size="9" fill="#84591b">overflow → mastery</text>`;
  }
  return s;
}

/** The seated cultivator + per-path dais/aura/back + channel + dantian (artifact buildFigure). */
export function buildCourtFigure(surface: TemperingCourtSurface, reducedMotion: boolean): string {
  const path = surface.path;
  if (!path) return '';
  const theme = COURT_THEME[path];
  const status = surface.status;
  const dim =
    status === 'blocked_by_combat' ? 0.48 : status === 'blocked_by_activity' ? 0.7 : status === 'no_path' ? 0.45 : 1;
  const robe = path === 'heaven' ? 'rgba(232,240,238,.5)' : path === 'earth' ? 'rgba(245,228,206,.5)' : 'rgba(243,234,215,.5)';
  const robeStroke = 'rgba(120,96,52,.65)';
  let dais = '';
  if (path === 'earth')
    dais = `<path d="M430,628 L782,628 L834,690 L378,690Z" fill="rgba(40,26,16,.6)" stroke="rgba(120,80,46,.4)"/><path d="M430,628 L782,628 L788,640 L424,640Z" fill="rgba(70,46,26,.6)"/><g stroke="#e0762a" stroke-width="1.4" opacity=".5" class="glowP"><line x1="470" y1="664" x2="540" y2="664"/><line x1="640" y1="672" x2="730" y2="672"/></g>`;
  if (path === 'martial')
    dais = `<ellipse cx="606" cy="660" rx="172" ry="34" fill="rgba(60,42,20,.4)" stroke="rgba(120,90,46,.4)"/><ellipse cx="606" cy="660" rx="120" ry="22" fill="none" stroke="rgba(178,131,45,.3)"/>`;
  if (path === 'heaven')
    dais = `<ellipse cx="606" cy="664" rx="150" ry="30" fill="url(#starHalo)" opacity=".5"/>${[...Array(10)].map((_, i) => { const a = (i / 10) * 2 * Math.PI; const x = 606 + Math.cos(a) * 120; const y = 664 + Math.sin(a) * 24; return `<path d="M606,664 Q${((606 + x) / 2).toFixed(0)},${((664 + y) / 2 - 8).toFixed(0)} ${x.toFixed(0)},${y.toFixed(0)}" fill="none" stroke="rgba(159,224,196,.5)" stroke-width="2"/>`; }).join('')}<ellipse cx="606" cy="700" rx="130" ry="20" fill="rgba(159,208,255,.10)"/>`;
  let back = '';
  if (path === 'heaven') back = `<circle cx="606" cy="150" r="92" fill="url(#starHalo)" class="breatheA"/>`;
  if (path === 'martial')
    back = `<circle cx="606" cy="396" r="196" fill="none" stroke="rgba(178,131,45,.32)" stroke-dasharray="3 13" class="spinG" style="transform-origin:606px 396px"/><circle cx="606" cy="396" r="168" fill="none" stroke="rgba(139,48,40,.22)" stroke-dasharray="2 16" class="spinG" style="transform-origin:606px 396px;animation-direction:reverse;animation-duration:60s"/>`;
  const mudraGlow = theme.core === 'url(#emberCore)' ? '#ffca6a' : '#ffe9b0';
  return `<svg viewBox="0 0 1212 768" style="filter:${dim < 1 ? 'grayscale(.4)' : 'none'};opacity:${dim}">
    ${dais}
    <ellipse cx="606" cy="404" rx="200" ry="286" fill="url(#qiAura)" class="breatheA" style="opacity:${theme.auraOp}"/>
    ${back}
    <path d="M452,560 Q540,612 606,612 Q672,612 760,560 Q792,600 700,624 Q606,640 512,624 Q420,600 452,560Z" fill="${robe}" stroke="${robeStroke}" stroke-width="1.6"/>
    <path d="M556,206 Q494,272 478,402 Q466,500 452,560 Q540,592 606,592 Q672,592 760,560 Q746,500 734,402 Q718,272 656,206 Q632,242 606,242 Q580,242 556,206Z" fill="${robe}" stroke="${robeStroke}" stroke-width="1.8"/>
    <g fill="none" stroke="rgba(120,96,52,.4)" stroke-width="1.4"><path d="M556,300 Q540,420 528,540"/><path d="M656,300 Q672,420 684,540"/><path d="M606,260 L606,560"/></g>
    <path d="M566,212 L606,300 L646,212" fill="none" stroke="${robeStroke}" stroke-width="2"/>
    <path d="M656,206 Q718,272 734,402 Q746,500 760,560" fill="none" stroke="${theme.rim}" stroke-width="${theme.rimW}" opacity=".55" filter="url(#soft)"/>
    <ellipse cx="606" cy="556" rx="46" ry="20" fill="${robe}" stroke="${robeStroke}" stroke-width="1.5"/>
    <circle cx="606" cy="552" r="9" fill="${mudraGlow}" opacity=".5" filter="url(#soft)"/>
    <rect x="592" y="168" width="28" height="34" rx="10" fill="${robe}" stroke="${robeStroke}" stroke-width="1.4"/>
    <circle cx="606" cy="150" r="46" fill="${robe}" stroke="${robeStroke}" stroke-width="1.6"/>
    <path d="M576,138 Q606,108 636,138" fill="none" stroke="rgba(120,96,52,.5)" stroke-width="1.4"/>
    <ellipse cx="606" cy="104" rx="16" ry="13" fill="${robe}" stroke="${robeStroke}" stroke-width="1.5"/><rect x="600" y="96" width="12" height="10" rx="3" fill="rgba(120,96,52,.5)"/>
    ${buildCourtMeridianChannel(surface, reducedMotion)}
    <circle cx="606" cy="470" r="44" fill="${theme.core}" class="breatheA"/>
    <circle cx="606" cy="470" r="20" fill="none" stroke="rgba(150,120,60,.7)" stroke-width="1.4"/>
    <circle cx="606" cy="470" r="28" fill="none" stroke="${theme.rim}" stroke-width="1.4" opacity=".5" class="glowP"/>
  </svg>`;
}

/** Per-path scenery backdrop (artifact buildScene). */
export function buildCourtScene(path: CourtPath, fatigue: number): string {
  const hot = (0.4 + fatigue / 220).toFixed(2);
  if (path === 'earth') {
    return `<svg viewBox="0 0 1212 768" preserveAspectRatio="xMidYMid slice">
    <path d="M0,0 H1212 V120 Q1000,150 900,90 Q820,150 720,100 Q620,160 520,100 Q400,150 300,95 Q180,150 0,110 Z" fill="rgba(36,24,16,.5)"/>
    <path d="M0,768 V470 Q60,440 90,500 Q120,440 150,520 L150,768Z" fill="rgba(30,20,13,.5)"/>
    <path d="M1212,768 V470 Q1150,440 1120,500 Q1090,440 1062,520 L1062,768Z" fill="rgba(30,20,13,.5)"/>
    <rect x="120" y="150" width="56" height="520" rx="6" fill="rgba(44,30,20,.42)"/><rect x="120" y="150" width="56" height="520" rx="6" fill="none" stroke="rgba(120,80,46,.3)"/>
    <rect x="1036" y="150" width="56" height="520" rx="6" fill="rgba(44,30,20,.42)"/><rect x="1036" y="150" width="56" height="520" rx="6" fill="none" stroke="rgba(120,80,46,.3)"/>
    <ellipse cx="606" cy="560" rx="360" ry="240" fill="url(#forgeGlow)" class="glowP" style="opacity:${hot}"/>
    <path d="M396,690 L396,420 Q396,250 606,236 Q816,250 816,420 L816,690Z" fill="rgba(28,16,10,.5)"/>
    <path d="M430,690 L430,440 Q430,290 606,278 Q782,290 782,440 L782,690Z" fill="url(#furnaceFire)" opacity=".5" class="glowP"/>
    <ellipse cx="606" cy="678" rx="220" ry="40" fill="url(#furnaceFire)" opacity=".55" class="glowP"/>
    ${[...Array(9)].map((_, i) => `<circle cx="${500 + i * 28}" cy="${672 + (i % 2) * 8}" r="${4 + (i % 3)}" fill="#ffb15a" opacity=".7" class="flame" style="animation-delay:${(i * 0.2).toFixed(2)}s"/>`).join('')}
    ${[540, 606, 672].map((x, i) => `<path d="M${x},680 C${x - 16},640 ${x - 6},610 ${x},588 C${x + 8},612 ${x + 16},644 ${x},680Z" fill="url(#furnaceFire)" class="flame" style="animation-delay:${(i * 0.3).toFixed(2)}s;transform-origin:${x}px 680px"/>`).join('')}
    <g transform="translate(214,604)"><path d="M-44,30 L44,30 L34,46 L-34,46Z" fill="rgba(40,44,50,.7)"/><rect x="-30" y="6" width="60" height="20" rx="3" fill="url(#steelG)" opacity=".8"/><path d="M-46,6 L34,-2 L34,8 L-30,12Z" fill="url(#steelG)" opacity=".85"/><rect x="-10" y="-2" width="20" height="10" fill="rgba(40,44,50,.7)"/></g>
    <g transform="translate(150,560) rotate(-28)"><rect x="-4" y="0" width="8" height="70" rx="3" fill="#6e4c22"/><rect x="-22" y="-12" width="44" height="20" rx="4" fill="url(#steelG)"/></g>
    <g stroke="rgba(80,70,60,.6)" stroke-width="3" fill="none">${[...Array(7)].map((_, i) => `<ellipse cx="980" cy="${120 + i * 22}" rx="5" ry="9"/>`).join('')}</g>
    <path d="M980,272 q0,22 14,22 q12,0 12,-14" stroke="rgba(80,70,60,.7)" stroke-width="3" fill="none"/>
    <g stroke="#e0762a" stroke-width="1.6" opacity=".4" class="glowP">${['M380,710 L470,690 L520,712', 'M740,712 L800,688 L900,706'].map((p) => `<path d="${p}" fill="none"/>`).join('')}</g>
  </svg>`;
  }
  if (path === 'martial') {
    return `<svg viewBox="0 0 1212 768" preserveAspectRatio="xMidYMid slice">
    <rect x="0" y="0" width="1212" height="520" fill="rgba(64,58,50,.10)"/>
    <circle cx="606" cy="300" r="210" fill="rgba(120,128,138,.08)" stroke="rgba(31,26,23,.18)" stroke-width="3"/>
    <circle cx="606" cy="300" r="210" fill="none" stroke="rgba(178,131,45,.18)" stroke-width="1"/>
    ${[[150, '武'], [1050, '勇']].map(([x, g]) => `<g class="swayG" style="transform-origin:${x}px 130px"><path d="M${(x as number) - 26},130 L${(x as number) + 26},130 L${(x as number) + 22},420 L${x},432 L${(x as number) - 22},420Z" fill="url(#bannerCloth)" opacity=".85"/><path d="M${(x as number) - 26},130 L${(x as number) + 26},130 L${(x as number) + 24},150 L${(x as number) - 24},150Z" fill="#3a1410"/><text x="${x}" y="210" text-anchor="middle" font-family="var(--court-kai)" font-size="34" fill="#f4dccb" opacity=".9">${g}</text><text x="${x}" y="270" text-anchor="middle" font-family="var(--court-kai)" font-size="34" fill="#f4dccb" opacity=".75">道</text></g>`).join('')}
    <path d="M120,250 Q520,120 1090,300" fill="none" stroke="url(#goldBrushG)" stroke-width="11" filter="url(#brushRough)" opacity=".5" class="glowP"/>
    <path d="M150,460 Q560,560 1080,410" fill="none" stroke="url(#goldBrushG)" stroke-width="7" filter="url(#brushRough)" opacity=".4"/>
    <g transform="translate(1000,360)"><rect x="-8" y="0" width="86" height="14" rx="3" fill="#6e4c22"/><rect x="-8" y="260" width="86" height="14" rx="3" fill="#6e4c22"/>${[0, 1, 2, 3].map((i) => `<g transform="translate(${i * 22},-150) rotate(${(i - 1.5) * 6})"><rect x="-2" y="0" width="4" height="410" fill="#7a5b26"/><path d="M-7,0 L7,0 L0,-22Z" fill="url(#steelG)"/></g>`).join('')}</g>
    <g transform="translate(180,600)"><ellipse cx="0" cy="0" rx="64" ry="78" fill="rgba(120,40,30,.55)" stroke="#3a1410" stroke-width="3"/><ellipse cx="0" cy="0" rx="64" ry="78" fill="none" stroke="rgba(178,131,45,.4)"/><circle cx="0" cy="0" r="10" fill="#3a1410"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => { const [x, y] = PT(0, 0, 64, a); return `<circle cx="${x.toFixed(0)}" cy="${((y * 78) / 64).toFixed(0)}" r="3" fill="#e7cd92"/>`; }).join('')}<rect x="-78" y="78" width="156" height="14" rx="4" fill="#6e4c22"/></g>
    <g transform="translate(1030,560)"><rect x="-9" y="0" width="18" height="150" rx="4" fill="#7a5b26"/><rect x="-26" y="20" width="52" height="14" rx="6" fill="#6e4c22"/><rect x="-22" y="50" width="44" height="12" rx="6" fill="#6e4c22"/></g>
    <ellipse cx="606" cy="650" rx="320" ry="70" fill="none" stroke="rgba(31,26,23,.26)" stroke-width="2"/>
    <ellipse cx="606" cy="650" rx="210" ry="46" fill="none" stroke="rgba(31,26,23,.22)" stroke-width="2"/>
    <ellipse cx="606" cy="650" rx="110" ry="24" fill="none" stroke="rgba(139,48,40,.4)" stroke-width="2" stroke-dasharray="7 9"/>
    <g stroke="rgba(31,26,23,.10)" stroke-width="1">${[560, 620, 690, 740].map((y) => `<line x1="160" y1="${y}" x2="1052" y2="${y}"/>`).join('')}</g>
  </svg>`;
  }
  return `<svg viewBox="0 0 1212 768" preserveAspectRatio="xMidYMid slice">
    <g fill="#f3ead7">${[...Array(46)].map((_, i) => { const x = ((i * 139 + 40) % 1180) + 12; const y = ((i * 83 + 30) % 430) + 14; const r = (i % 5) * 0.5 + 1; return `<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" opacity=".8" class="twk" style="animation-delay:${((i % 9) * 0.4).toFixed(1)}s"/>`; }).join('')}</g>
    <circle cx="950" cy="170" r="64" fill="url(#moonG)"/><circle cx="950" cy="170" r="64" fill="none" stroke="rgba(217,189,128,.4)"/>
    <circle cx="930" cy="156" r="10" fill="rgba(120,110,80,.12)"/><circle cx="966" cy="188" r="7" fill="rgba(120,110,80,.10)"/>
    <g stroke="rgba(207,224,255,.6)" stroke-width="1" fill="#eaf2ff"><circle cx="300" cy="150" r="2.6" class="twk"/><circle cx="386" cy="120" r="2.2" class="twk"/><circle cx="470" cy="150" r="2.8" class="twk"/><circle cx="556" cy="120" r="2.2" class="twk"/><circle cx="624" cy="170" r="3" class="twk"/><circle cx="690" cy="210" r="2.4" class="twk"/>
      <path d="M300,150 L386,120 L470,150 L556,120 L624,170 L690,210" fill="none"/><path d="M556,120 L606,150" fill="none" stroke-dasharray="3 5"/></g>
    <g class="driftG"><path d="M-40,470 Q300,440 620,470 Q900,496 1260,464 L1260,540 L-40,540Z" fill="url(#mistG)" opacity=".5"/></g>
    <g class="driftG" style="animation-duration:34s;animation-direction:reverse"><path d="M-40,540 Q360,514 700,544 Q980,566 1260,536 L1260,610 L-40,610Z" fill="url(#mistG)" opacity=".4"/></g>
    <path d="M0,768 L0,600 L150,650 L320,560 L520,660 L720,560 L920,650 L1212,590 L1212,768Z" fill="rgba(40,54,80,.38)"/>
    <path d="M0,768 L0,660 L200,700 L420,630 L640,700 L860,640 L1080,700 L1212,660 L1212,768Z" fill="rgba(31,40,55,.5)"/>
    ${[[70, 1], [1142, -1]].map(([x, s]) => `<g transform="translate(${x},78) scale(${s},1)"><path d="M0,0 Q70,-26 150,10 L140,22 Q70,-8 6,16Z" fill="rgba(58,30,18,.6)"/><path d="M150,10 l10,-2 l-6,16 l-14,-2Z" fill="rgba(178,131,45,.5)"/></g>`).join('')}
    ${[[230, 150], [980, 300]].map(([x, y]) => `<g transform="translate(${x},${y})"><line x1="0" y1="-${(y as number) - 86}" x2="0" y2="-10" stroke="rgba(80,70,60,.5)" stroke-width="1.5"/><ellipse cx="0" cy="14" rx="20" ry="26" fill="url(#lanternG)" opacity=".88" class="glowP"/><ellipse cx="0" cy="14" rx="20" ry="26" fill="none" stroke="#5e1c16"/><rect x="-10" y="-14" width="20" height="6" rx="2" fill="#3a1410"/><rect x="-10" y="36" width="20" height="6" rx="2" fill="#3a1410"/><line x1="0" y1="42" x2="0" y2="58" stroke="#b23c1e" stroke-width="2"/></g>`).join('')}
  </svg>`;
}

/** Incense / forge smoke (artifact buildSmoke). */
export function buildCourtSmoke(path: CourtPath, reducedMotion: boolean): string {
  if (reducedMotion) return '';
  if (path === 'earth') {
    return `<svg viewBox="0 0 1212 768">${[480, 606, 720].map((x, i) => `<g style="transform-origin:${x}px 600px"><ellipse cx="${x}" cy="600" rx="26" ry="34" fill="rgba(60,46,38,.28)" style="animation:smokeRiseK ${(6 + i).toFixed(0)}s ease-in infinite;animation-delay:${(i * 1.6).toFixed(1)}s;transform-origin:${x}px 600px"/></g>`).join('')}</svg>`;
  }
  if (path === 'martial') {
    return `<svg viewBox="0 0 1212 768">${[300, 820].map((x, i) => `<ellipse cx="${x}" cy="650" rx="20" ry="14" fill="rgba(120,100,70,.16)" style="animation:smokeRiseK ${(7 + i).toFixed(0)}s ease-in infinite;animation-delay:${i.toFixed(1)}s;transform-origin:${x}px 650px"/>`).join('')}</svg>`;
  }
  return `<svg viewBox="0 0 1212 768"><g class="swayG" style="transform-origin:792px 560px"><path d="M792,600 q-10,-40 4,-78 q-12,-36 2,-70" fill="none" stroke="rgba(207,224,255,.35)" stroke-width="3" style="animation:smokeRiseK 9s ease-in infinite"/></g><rect x="784" y="598" width="16" height="6" rx="2" fill="rgba(80,70,60,.5)"/></svg>`;
}
