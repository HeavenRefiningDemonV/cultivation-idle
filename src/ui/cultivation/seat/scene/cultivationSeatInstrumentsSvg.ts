/**
 * M.II.3 Wave 3 — the floating instruments as SVG, ported 1:1 from the artifact's buildFocusDial
 * / buildPathInstrument / buildAscent. Pure string builders, parameterized from the surface (no
 * store, no gameplay math). Rendered via dangerouslySetInnerHTML inside positioned, clickable
 * wrappers in the screen (the intents stay on the React wrappers). Accent via CSS vars (R-7).
 */

const PT = (cx: number, cy: number, r: number, a: number): [number, number] => [
  cx + r * Math.cos(((a - 90) * Math.PI) / 180),
  cy + r * Math.sin(((a - 90) * Math.PI) / 180),
];
const arc = (cx: number, cy: number, r: number, a0: number, a1: number): string => {
  const [x0, y0] = PT(cx, cy, r, a0);
  const [x1, y1] = PT(cx, cy, r, a1);
  return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 1 ${x1.toFixed(1)},${y1.toFixed(1)}`;
};

export interface FocusDialAxis {
  glyph: string;
}

/** The jade compass-rose Focus Dial — N axis nodes, the emphasized lit, a quivering needle. */
export function buildFocusDialSvg(axes: readonly FocusDialAxis[], emphasisIndex: number, reducedMotion: boolean): string {
  const sz = 200, C = 100, rm = reducedMotion, N = axes.length, RG = 78;
  let s = `<svg viewBox="0 0 ${sz} ${sz}" width="${sz}" height="${sz}" style="overflow:visible" aria-hidden="true">`;
  s += `<circle cx="${C}" cy="${C}" r="92" fill="url(#goldG)"/><circle cx="${C}" cy="${C}" r="92" fill="none" stroke="rgba(74,51,14,.8)" stroke-width="1.4"/><circle cx="${C}" cy="${C}" r="86" fill="url(#jadeRad)" opacity=".5"/><circle cx="${C}" cy="${C}" r="86" fill="rgba(31,26,23,.55)"/>`;
  s += `<circle cx="${C}" cy="${C}" r="86" fill="none" stroke="rgba(255,244,210,.4)" stroke-width="1"/>`;
  axes.forEach((ax, i) => {
    const a = (i / N) * 360, [x, y] = PT(C, C, RG, a), on = i === emphasisIndex;
    s += `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})"><circle r="13" fill="${on ? 'var(--acc)' : 'rgba(243,234,215,.16)'}" stroke="${on ? 'var(--acc-bright)' : 'rgba(217,189,128,.5)'}" stroke-width="${on ? 2.4 : 1.2}"/><text y="5" text-anchor="middle" font-family="var(--kai)" font-size="14" font-weight="700" fill="${on ? '#241a10' : 'rgba(243,234,215,.8)'}">${ax.glyph}</text></g>`;
  });
  const a = (emphasisIndex / N) * 360, [tx, ty] = PT(C, C, RG - 14, a), [lx, ly] = PT(C, C, 16, a - 90), [rx, ry] = PT(C, C, 16, a + 90), [bx, by] = PT(C, C, 22, a + 180);
  s += `<g ${rm ? '' : 'class="seatSpin"'} style="transform-origin:${C}px ${C}px;animation:seat-quiver 4.8s ease-in-out infinite">`;
  s += `<path d="M${tx.toFixed(1)},${ty.toFixed(1)} L${lx.toFixed(1)},${ly.toFixed(1)} L${C},${C} L${rx.toFixed(1)},${ry.toFixed(1)}Z" fill="var(--acc-bright)" filter="url(#glowJ)"/>`;
  s += `<path d="M${bx.toFixed(1)},${by.toFixed(1)} L${lx.toFixed(1)},${ly.toFixed(1)} L${C},${C} L${rx.toFixed(1)},${ry.toFixed(1)}Z" fill="var(--acc)" opacity=".4"/></g>`;
  s += `<g><circle cx="${C}" cy="${C}" r="22" fill="url(#inkHub)" stroke="url(#goldG)" stroke-width="2.4"/><text x="${C}" y="${C + 6}" text-anchor="middle" font-family="var(--kai)" font-size="20" fill="var(--acc-rim)">${axes[emphasisIndex]?.glyph ?? ''}</text></g>`;
  s += `</svg>`;
  return s;
}

/** The per-path unique-mechanic disc (Heaven's Eye / Beast-Lore cairn / Weapon-Bond gauge). */
export function buildPathInstrumentSvg(path: 'heaven' | 'earth' | 'martial', rf: number, reducedMotion: boolean): string {
  const rm = reducedMotion, sz = 176, C = 88;
  let s = `<svg viewBox="0 0 ${sz} ${sz}" width="${sz}" height="${sz}" style="overflow:visible" aria-hidden="true">`;
  if (path === 'heaven') {
    s += `<circle cx="${C}" cy="${C}" r="78" fill="url(#goldG)"/><circle cx="${C}" cy="${C}" r="73" fill="rgba(28,34,38,.78)" stroke="rgba(223,234,228,.4)"/>`;
    s += `<g ${rm ? '' : 'class="seatSpin"'} style="transform-origin:${C}px ${C}px;animation-duration:80s">`;
    for (let i = 0; i < 24; i++) { const a = i * 15, [x0, y0] = PT(C, C, 64, a), [x1, y1] = PT(C, C, i % 3 ? 68 : 72, a); s += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="rgba(215,226,220,.5)" stroke-width="${i % 3 ? 0.7 : 1.3}"/>`; }
    s += `</g>`;
    s += `<ellipse cx="${C}" cy="${C}" rx="44" ry="26" fill="none" stroke="rgba(223,234,228,.7)" stroke-width="2"/>`;
    s += `<circle cx="${C}" cy="${C}" r="16" fill="url(#auraHeaven)"/><circle cx="${C}" cy="${C}" r="10" fill="var(--acc-core)" ${rm ? '' : 'class="seatBreathe"'}/><circle cx="${C}" cy="${C}" r="4" fill="#1c2226"/>`;
    const fh = Math.round(2 + rf * 4);
    for (let i = 0; i < fh; i++) { const a = -60 + i * (120 / (fh - 1 || 1)), [x, y] = PT(C, C, 58, a); s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4" fill="var(--acc-rim)" ${rm ? '' : 'class="seatTwk"'} style="animation-delay:${i * 0.3}s"/>`; }
    return s + `</svg>`;
  }
  if (path === 'earth') {
    s += `<circle cx="${C}" cy="${C}" r="78" fill="url(#goldG)"/><circle cx="${C}" cy="${C}" r="73" fill="rgba(44,30,18,.82)" stroke="rgba(120,84,40,.5)"/>`;
    const depth = Math.min(1, 0.2 + rf * 0.8);
    s += `<circle cx="${C}" cy="${C}" r="58" fill="none" stroke="rgba(120,90,46,.25)" stroke-width="8"/><path d="${arc(C, C, 58, -130, -130 + 260 * depth)}" fill="none" stroke="#caa05a" stroke-width="8" stroke-linecap="round"/>`;
    const beasts = Math.min(7, 1 + Math.round(rf * 6));
    for (let i = 0; i < beasts; i++) { const a = (i / 7) * 360, [x, y] = PT(C, C, 40, a); s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="url(#earthEssence)" stroke="#6e4c16" ${rm ? '' : 'class="seatTwk"'} style="animation-delay:${i * 0.35}s"/>`; }
    s += `<text x="${C}" y="${C + 7}" text-anchor="middle" font-family="var(--kai)" font-size="30" fill="var(--acc-rim)">獸</text>`;
    return s + `</svg>`;
  }
  s += `<circle cx="${C}" cy="${C}" r="78" fill="url(#goldG)"/><circle cx="${C}" cy="${C}" r="73" fill="rgba(40,18,14,.82)" stroke="rgba(178,131,45,.4)"/>`;
  const bond = Math.min(1, 0.18 + rf * 0.82);
  s += `<circle cx="${C}" cy="${C}" r="58" fill="none" stroke="rgba(120,90,46,.25)" stroke-width="8"/><path d="${arc(C, C, 58, -130, -130 + 260 * bond)}" fill="none" stroke="#ffb15a" stroke-width="8" stroke-linecap="round"/>`;
  s += `<rect x="${C - 3}" y="${C - 34}" width="6" height="50" rx="3" fill="url(#bladeSteel)"/><path d="M${C - 3},${C - 34} L${C + 3},${C - 34} L${C},${C - 44}Z" fill="url(#bladeSteel)"/><rect x="${C - 13}" y="${C + 14}" width="26" height="7" rx="3" fill="#6e4c22"/>`;
  const arts = Math.min(5, 1 + Math.round(rf * 4));
  for (let i = 0; i < arts; i++) s += `<circle cx="${C - 26 + i * 13}" cy="${C + 34}" r="3.4" fill="var(--acc-core)" ${rm ? '' : 'class="seatTwk"'} style="animation-delay:${i * 0.3}s"/>`;
  return s + `</svg>`;
}

/** The vertical ascent thread — 7 rung dots, lit = crossed, the current breathing, R7 the sealed cap. */
export function buildAscentSvg(realmIndex1to7: number, atPeak: boolean, reducedMotion: boolean): string {
  const rm = reducedMotion, lx = 20, top = 16, bot = 640, N = 7;
  const ys: number[] = [];
  for (let i = 0; i < N; i++) ys.push(bot - (bot - top) * (i / (N - 1)));
  let s = `<svg viewBox="0 0 92 700" width="92" height="700" style="overflow:visible" aria-hidden="true">`;
  s += `<line x1="${lx}" y1="${top}" x2="${lx}" y2="${bot}" stroke="rgba(120,96,52,.22)" stroke-width="4" stroke-linecap="round"/>`;
  const curY = ys[realmIndex1to7 - 1] ?? ys[0];
  s += `<line x1="${lx}" y1="${bot}" x2="${lx}" y2="${curY}" stroke="var(--acc)" stroke-width="4" stroke-linecap="round" filter="url(#glowJ)" opacity=".8"/>`;
  ys.forEach((y, i) => {
    const realmN = i + 1, crossed = realmN < realmIndex1to7, cur = realmN === realmIndex1to7, ascend = i === N - 1;
    if (cur) s += `<circle cx="${lx}" cy="${y}" r="13" fill="var(--acc-core)" opacity=".3" ${rm ? '' : 'class="seatBreathe"'}/><circle cx="${lx}" cy="${y}" r="7.5" fill="var(--acc-core)" stroke="var(--acc-deep)" stroke-width="1.6"/>`;
    else if (crossed) s += `<circle cx="${lx}" cy="${y}" r="5" fill="url(#jadeRad)" stroke="#1c3128" stroke-width="1.2"/>`;
    else { s += `<circle cx="${lx}" cy="${y}" r="4" fill="rgba(243,234,215,.1)" stroke="rgba(217,189,128,.4)" stroke-width="1"/>`; if (ascend) s += `<text x="${lx}" y="${y + 3.6}" text-anchor="middle" font-size="10" fill="rgba(217,189,128,.6)">◇</text>`; }
  });
  if (atPeak && realmIndex1to7 < 7) { const ny = ys[realmIndex1to7]; s += `<circle cx="${lx}" cy="${ny}" r="9" fill="none" stroke="var(--acc-bright)" stroke-width="1.6" ${rm ? '' : 'class="seatBreathe"'}/><circle cx="${lx}" cy="${ny}" r="3.5" fill="var(--acc-bright)" ${rm ? '' : 'class="seatTwk"'} style="animation-duration:2s"/>`; }
  return s + `</svg>`;
}

/** The Three-Treasures triad (Body 精 / Energy 气 / Spirit 神), the lead highlighted. */
export function buildTreasureTriadSvg(lead: 'jing' | 'qi' | 'shen'): string {
  const items: Array<{ id: 'jing' | 'qi' | 'shen'; glyph: string; name: string }> = [
    { id: 'jing', glyph: '精', name: 'Body' },
    { id: 'qi', glyph: '气', name: 'Energy' },
    { id: 'shen', glyph: '神', name: 'Spirit' },
  ];
  return items
    .map((it) => `<span class="cultivationSeatTriad__tre${it.id === lead ? ' is-lead' : ''}"><b>${it.glyph}</b><span class="cultivationSeatTriad__nm">${it.name}</span></span>`)
    .join('');
}
