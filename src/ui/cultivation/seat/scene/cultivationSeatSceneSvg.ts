/**
 * M.II.3 Wave 2 — the full-bleed painting, ported 1:1 from the artifact's generative SVG
 * functions (cultivation-seat.html buildField/skyWash/buildAtmos/buildMandala/buildDais/
 * buildQiLight/buildFigure/buildGateHalo). Pure string builders → rendered via the scene
 * component as a self-contained <svg> (no user input → no injection risk). The path-accent cast
 * (--acc / --acc-bright / --acc-deep / --acc-core / --acc-rim) is supplied by CSS vars on the
 * stage (set per [data-path] in cultivationSeat.scss, R-7: never blue); atmospheric scene colors
 * are inline hex/rgba, matching the live Observatory scene precedent.
 *
 * The three evolving layers (sky, figure, qi) step on the canonical realmIndex via rf=(realm-1)/5
 * (6 live realms, R7 sealed) — the codex Part 4 evolution binding, preserved exactly.
 */

export interface SceneParams {
  path: 'heaven' | 'earth' | 'martial';
  realmIndex1to7: number; // 1..6 live
  foreground: 'idle' | 'cultivating' | 'combat-held' | 'tempering';
  reducedMotion: boolean;
  atPeak: boolean;
  realmPct: number; // 0..1
}

const PT = (cx: number, cy: number, r: number, a: number): [number, number] => [
  cx + r * Math.cos(((a - 90) * Math.PI) / 180),
  cy + r * Math.sin(((a - 90) * Math.PI) / 180),
];
const arc = (cx: number, cy: number, r: number, a0: number, a1: number): string => {
  const [x0, y0] = PT(cx, cy, r, a0);
  const [x1, y1] = PT(cx, cy, r, a1);
  return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 1 ${x1.toFixed(1)},${y1.toFixed(1)}`;
};
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
function mix(h1: string, h2: string, t: number): string {
  const p = (h: string): number[] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const a = p(h1);
  const b = p(h2);
  return '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join('');
}

export function skyWash(p: string, realm: number): string {
  const rf = (realm - 1) / 5;
  if (p === 'heaven') {
    const top = mix('#16202b', '#9fb6bd', rf), up = mix('#1d2f33', '#7d9c9b', rf), mid = mix('#324f48', '#b7cdc5', rf), bot = mix('#13201d', '#56756c', rf);
    const indigo = rf > 0.55 ? `,radial-gradient(60% 50% at 6% 18%,rgba(40,38,86,${(rf - 0.55) * 0.7}),transparent 60%),radial-gradient(60% 50% at 94% 16%,rgba(40,38,86,${(rf - 0.55) * 0.7}),transparent 60%)` : '';
    return `radial-gradient(120% 78% at 50% -16%,rgba(247,240,215,${0.1 + rf * 0.22}),transparent 56%)${indigo},linear-gradient(180deg,${top},${up} 30%,${mid} 64%,${bot} 100%)`;
  }
  if (p === 'earth') {
    const mid = mix('#3a2c18', '#5a4524', rf), low = mix('#4a3415', '#7a5a28', rf);
    const amber = rf > 0.6 ? `,radial-gradient(50% 36% at 72% 22%,rgba(210,150,60,${(rf - 0.6) * 0.6}),transparent 58%)` : '';
    return `radial-gradient(110% 60% at 50% 104%,rgba(150,104,45,${0.18 + rf * 0.16}),transparent 62%)${amber},linear-gradient(180deg,${mix('#241a10', '#2e2214', rf)},${mid} 52%,${low} 100%)`;
  }
  const top = mix('#1c1410', '#2a1713', rf), mid = mix('#3a1d18', '#5e221a', rf), low = mix('#52201a', '#7e2c1e', rf);
  return `radial-gradient(100% 66% at 50% 98%,rgba(170,72,53,${0.22 + rf * 0.2}),transparent 64%),linear-gradient(180deg,${top},${mid} 58%,${low} 100%)`;
}

function buildAtmos(p: string, realm: number, rm: boolean): string {
  const rf = (realm - 1) / 5;
  let s = '';
  if (p === 'heaven') {
    const N = 30 + Math.round(rf * 30);
    s += `<g fill="#f3ead7">`;
    for (let i = 0; i < N; i++) {
      const x = (i * 149 + 60) % 2008 + 20, y = (i * 97 + 30) % 560 + 12, r = (i % 5) * 0.5 + 0.9, o = (0.5 + rf * 0.4).toFixed(2);
      s += `<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" opacity="${o}" ${rm ? '' : `class="twk" style="animation-delay:${(i % 9 * 0.4).toFixed(1)}s"`}/>`;
    }
    s += `</g>`;
    const dy = lerp(210, 150, rf);
    s += `<circle cx="1560" cy="${dy}" r="${lerp(56, 72, rf)}" fill="url(#heavenDisc)"/><circle cx="1560" cy="${dy}" r="${lerp(56, 72, rf)}" fill="none" stroke="rgba(223,234,228,.35)"/>`;
    const ocx = 1024, ocy = lerp(360, 300, rf), rings = 2 + Math.round(rf * 3);
    s += `<g opacity="${0.5 + rf * 0.4}">`;
    s += `<g ${rm ? '' : 'class="spinG"'} style="transform-origin:${ocx}px ${ocy}px">`;
    for (let k = 0; k < rings; k++) {
      const rr = 120 + k * 70;
      s += `<circle cx="${ocx}" cy="${ocy}" r="${rr}" fill="none" stroke="rgba(215,226,220,${0.16 + 0.04 * k})" stroke-width="1" stroke-dasharray="${k % 2 ? '2 14' : '1 0'}"/>`;
      const npts = 6 + k * 3;
      for (let j = 0; j < npts; j++) { const a = j / npts * 360 + k * 11, [x, y] = PT(ocx, ocy, rr, a); s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${k === rings - 1 ? 2.2 : 1.4}" fill="rgba(233,242,236,.7)"/>`; }
    }
    s += `</g>`;
    s += `<g ${rm ? '' : 'class="spinG"'} style="transform-origin:${ocx}px ${ocy}px;animation-direction:reverse;animation-duration:130s"><circle cx="${ocx}" cy="${ocy}" r="90" fill="none" stroke="rgba(251,230,180,.3)" stroke-dasharray="2 10"/></g>`;
    s += `<text x="${ocx}" y="${ocy + 18}" text-anchor="middle" font-family="var(--kai)" font-size="46" fill="rgba(247,240,215,.10)">道</text></g>`;
    s += `<g ${rm ? '' : 'class="driftG"'}><path d="M-60,640 Q400,608 1024,642 Q1560,672 2110,632 L2110,720 L-60,720Z" fill="url(#heavenMist)" opacity=".45"/></g>`;
    s += `<g ${rm ? '' : 'class="driftG"'} style="animation-duration:42s;animation-direction:reverse"><path d="M-60,712 Q520,684 1100,716 Q1620,742 2110,706 L2110,800 L-60,800Z" fill="url(#heavenMist)" opacity=".35"/></g>`;
    s += `<path d="M0,1152 L0,930 L300,968 L640,900 L1024,966 L1420,902 L1760,966 L2048,924 L2048,1152Z" fill="rgba(120,150,150,${0.16 + rf * 0.06})"/>`;
    s += `<path d="M0,1152 L0,996 L380,1028 L820,972 L1240,1030 L1660,976 L2048,1024 L2048,1152Z" fill="rgba(90,120,120,${0.2 + rf * 0.06})"/>`;
    return s;
  }
  if (p === 'earth') {
    const climb = lerp(0, 120, rf);
    s += `<path d="M0,1152 L0,${360 - climb} Q120,${300 - climb} 230,${420 - climb} Q320,${300 - climb} 430,${470 - climb} L470,1152Z" fill="rgba(34,24,15,.62)"/>`;
    s += `<path d="M2048,1152 L2048,${360 - climb} Q1928,${300 - climb} 1818,${420 - climb} Q1728,${300 - climb} 1618,${470 - climb} L1578,1152Z" fill="rgba(34,24,15,.62)"/>`;
    s += `<path d="M360,1152 L360,${560 - climb * 0.6} L640,${430 - climb * 0.6} L900,${540 - climb * 0.6} L1024,${470 - climb * 0.6} L1148,${545 - climb * 0.6} L1408,${435 - climb * 0.6} L1688,${560 - climb * 0.6} L1688,1152Z" fill="rgba(48,34,20,.5)"/>`;
    s += `<g opacity="${0.05 + rf * 0.08}" fill="rgba(243,234,215,1)" font-family="var(--kai)" font-size="64" text-anchor="middle"><text x="210" y="${560 - climb}">獸</text><text x="1840" y="${560 - climb}">山</text></g>`;
    if (rf > 0.6 && !rm) s += `<path d="M1500,150 L1470,260 L1510,250 L1460,400" fill="none" stroke="rgba(232,182,90,${(rf - 0.6) * 1.4})" stroke-width="2.4" class="twk" style="animation-duration:5s"/>`;
    s += `<g ${rm ? '' : 'class="driftG"'} style="animation-duration:48s"><path d="M-60,840 Q500,812 1100,846 Q1620,872 2110,832 L2110,1000 L-60,1000Z" fill="url(#earthMist)" opacity=".5"/></g>`;
    return s;
  }
  // martial
  s += `<circle cx="1024" cy="${lerp(720, 760, rf)}" r="${lerp(150, 180, rf)}" fill="url(#martialDisc)" opacity=".5"/>`;
  s += `<path d="M0,1152 L0,820 L260,870 L520,800 L820,872 L1024,812 L1240,876 L1520,802 L1800,872 L2048,824 L2048,1152Z" fill="rgba(40,18,14,.55)"/>`;
  const arcs = 1 + Math.round(rf * 2);
  for (let i = 0; i < arcs; i++) {
    const yo = 180 + i * 150, op = (0.28 + rf * 0.4 - i * 0.08).toFixed(2), w = 11 - i * 3;
    s += `<path d="M${120 + i * 40},${yo + 90} Q1024,${yo - 100} ${1928 - i * 40},${yo + 110}" fill="none" stroke="url(#bladeBrush)" stroke-width="${w}" filter="url(#brushRough)" opacity="${op}"/>`;
  }
  if (rf > 0.6) s += `<path d="M120,520 Q1024,180 1928,540" fill="none" stroke="rgba(255,240,196,${(rf - 0.6) * 1.5})" stroke-width="3" filter="url(#soft)"/>`;
  s += ([[150, '武'], [1898, '勇']] as const).map(([x, g]) => `<g ${rm ? '' : 'class="swayT"'} style="transform-origin:${x}px 120px"><path d="M${x - 30},120 L${x + 30},120 L${x + 24},520 L${x},540 L${x - 24},520Z" fill="url(#bannerCloth)" opacity=".82"/><path d="M${x - 30},120 L${x + 30},120 L${x + 27},150 L${x - 27},150Z" fill="#3a1410"/><text x="${x}" y="240" text-anchor="middle" font-family="var(--kai)" font-size="40" fill="#f4dccb" opacity=".88">${g}</text><text x="${x}" y="320" text-anchor="middle" font-family="var(--kai)" font-size="40" fill="#f4dccb" opacity=".7">道</text></g>`).join('');
  return s;
}

function buildMandala(p: string, realm: number, rm: boolean): string {
  const rf = (realm - 1) / 5, cx = 1024, cy = 902;
  const col = p === 'heaven' ? 'rgba(215,226,220,' : p === 'earth' ? 'rgba(217,189,128,' : 'rgba(232,168,122,';
  const spd = p === 'martial' ? 70 : p === 'heaven' ? 96 : 110;
  let s = `<g opacity="${0.5 + rf * 0.3}"><g ${rm ? '' : 'class="spinG"'} style="transform-origin:${cx}px ${cy}px;animation-duration:${spd}s">`;
  const R = 300 + rf * 40;
  for (let i = 0; i < 48; i++) { const a = i * 7.5, [x0, y0] = PT(cx, cy, R, a), [x1, y1] = PT(cx, cy, i % 4 ? R + 10 : R + 18, a); s += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${col}${i % 4 ? 0.2 : 0.4})" stroke-width="${i % 4 ? 0.8 : 1.5}" transform="scale(1,0.34)" transform-origin="${cx} ${cy}"/>`; }
  s += `<ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="${R * 0.34}" fill="none" stroke="${col}0.28)" stroke-width="1.2"/>`;
  s += `<ellipse cx="${cx}" cy="${cy}" rx="${R * 0.66}" ry="${R * 0.66 * 0.34}" fill="none" stroke="${col}0.22)" stroke-dasharray="3 10"/>`;
  if (p === 'heaven') { for (let i = 0; i < 8; i++) { const a = i * 45, [x, y] = PT(cx, cy, R * 0.62, a); s += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${(cy + (y - cy)).toFixed(1)}" stroke="${col}0.14)" stroke-width="1" transform="scale(1,0.34)" transform-origin="${cx} ${cy}"/>`; } }
  if (p === 'earth') { let hp = ''; for (let i = 0; i <= 6; i++) { const a = i * 60, [x, y] = PT(cx, cy, R * 0.6, a); hp += (i ? 'L' : 'M') + x.toFixed(1) + ',' + (cy + (y - cy) * 0.34).toFixed(1) + ' '; } s += `<path d="${hp}Z" fill="none" stroke="${col}0.2)" stroke-width="1.4"/>`; }
  if (p === 'martial') { for (let i = 0; i < 6; i++) { const a = i * 60, [x, y] = PT(cx, cy, R * 0.66, a), [x2, y2] = PT(cx, cy, R * 0.2, a); s += `<path d="M${x2.toFixed(1)},${(cy + (y2 - cy) * 0.34).toFixed(1)} L${x.toFixed(1)},${(cy + (y - cy) * 0.34).toFixed(1)}" stroke="${col}0.18)" stroke-width="1.6"/>`; } }
  s += `</g>`;
  const gly = p === 'heaven' ? '道法天' : p === 'earth' ? '體獸山' : '兵戰武';
  s += `<text x="${cx}" y="${cy + 14}" text-anchor="middle" font-family="var(--kai)" font-size="30" letter-spacing="8" fill="${col}0.10)">${gly}</text></g>`;
  return s;
}

function buildDais(p: string, realm: number, rm: boolean): string {
  const rf = (realm - 1) / 5, cx = 1024, cy = 900;
  let s = '';
  if (p === 'heaven') {
    s += `<ellipse cx="${cx}" cy="${cy + 8}" rx="${lerp(210, 250, rf)}" ry="${lerp(40, 52, rf)}" fill="url(#cloudDais)" opacity="${0.45 + rf * 0.25}" ${rm ? '' : 'class="breatheA"'}/>`;
    for (let i = 0; i < 12; i++) { const a = i / 12 * 360, [x, y] = PT(cx, cy, lerp(170, 200, rf), a); s += `<path d="M${cx},${cy} Q${((cx + x) / 2).toFixed(0)},${((cy + (cy + (y - cy) * 0.3)) / 2 - 6).toFixed(0)} ${x.toFixed(0)},${(cy + (y - cy) * 0.3).toFixed(0)}" fill="none" stroke="rgba(191,224,212,.4)" stroke-width="1.6"/>`; }
  } else if (p === 'earth') {
    const w = lerp(220, 300, rf);
    s += `<path d="M${cx - w},${cy - 12} L${cx + w},${cy - 12} L${cx + w * 1.18},${cy + 78} L${cx - w * 1.18},${cy + 78}Z" fill="rgba(40,26,16,.66)" stroke="rgba(120,80,46,.4)"/>`;
    s += `<path d="M${cx - w},${cy - 12} L${cx + w},${cy - 12} L${cx + w * 1.02},${cy + 8} L${cx - w * 1.02},${cy + 8}Z" fill="rgba(74,52,28,.6)"/>`;
    s += `<g stroke="rgba(224,118,42,.34)" stroke-width="1.6" ${rm ? '' : 'class="twk"'} style="animation-duration:6s"><line x1="${cx - 120}" y1="${cy + 44}" x2="${cx - 40}" y2="${cy + 44}"/><line x1="${cx + 40}" y1="${cy + 54}" x2="${cx + 150}" y2="${cy + 54}"/></g>`;
    const beasts = Math.min(6, 1 + Math.round(rf * 5));
    s += `<g transform="translate(${cx + 330},${cy - 6})">`;
    for (let i = 0; i < beasts; i++) { const bw = 58 - i * 7, bh = 26 - i * 1.5, by = -i * 22; s += `<rect x="${-bw / 2}" y="${by - bh}" width="${bw}" height="${bh}" rx="5" fill="rgba(58,42,26,.8)" stroke="rgba(120,84,40,.5)"/><circle cx="0" cy="${by - bh / 2}" r="3.5" fill="url(#earthEssence)" ${rm ? '' : 'class="twk"'} style="animation-delay:${i * 0.5}s"/>`; }
    s += `</g>`;
  } else {
    s += `<ellipse cx="${cx}" cy="${cy + 6}" rx="${lerp(190, 220, rf)}" ry="36" fill="rgba(60,42,20,.5)" stroke="rgba(120,90,46,.4)"/>`;
    s += `<ellipse cx="${cx}" cy="${cy + 6}" rx="${lerp(130, 150, rf)}" ry="24" fill="none" stroke="rgba(178,131,45,.35)"/>`;
    s += `<ellipse cx="${cx}" cy="${cy + 2}" rx="90" ry="18" fill="url(#forgeGlow2)" opacity="${0.4 + rf * 0.3}" ${rm ? '' : 'class="breatheA"'}/>`;
    const bladeLen = lerp(300, 400, rf), gl = (0.4 + rf * 0.5).toFixed(2);
    s += `<g transform="translate(${cx},${cy + 4})">`;
    s += `<rect x="-5" y="${-bladeLen}" width="10" height="${bladeLen - 40}" rx="4" fill="url(#bladeSteel)" opacity="${gl}"/>`;
    s += `<path d="M-5,${-bladeLen} L5,${-bladeLen} L0,${-bladeLen - 26}Z" fill="url(#bladeSteel)" opacity="${gl}"/>`;
    s += `<rect x="-26" y="-44" width="52" height="12" rx="4" fill="#6e4c22"/>`;
    s += `<rect x="-7" y="-40" width="14" height="44" rx="4" fill="#4a330e"/>`;
    if (!rm) s += `<rect x="-5" y="${-bladeLen}" width="10" height="${bladeLen - 40}" rx="4" fill="rgba(255,177,90,${(rf * 0.4).toFixed(2)})" filter="url(#soft)"/>`;
    s += `</g>`;
  }
  return s;
}

function buildQiLight(p: string, realm: number, fg: string, rm: boolean, atPeak: boolean, realmPct: number): string {
  const rf = (realm - 1) / 5, active = fg === 'cultivating' && !rm, held = fg === 'combat-held';
  const FX = 1024, qiCol = 'var(--acc-core)', flowCls = rm || held ? '' : active ? 'qiflow fast' : 'qiflow';
  const baseY = 886, topY = baseY - lerp(60, 330, realmPct);
  let s = '';
  s += `<line x1="${FX}" y1="${baseY}" x2="${FX}" y2="540" stroke="rgba(120,96,52,.14)" stroke-width="7" stroke-linecap="round"/>`;
  s += `<line x1="${FX}" y1="${baseY}" x2="${FX}" y2="${topY}" stroke="url(#rlGrad)" stroke-width="${active ? 8 : 6.5}" stroke-linecap="round" filter="url(#glowJ)" opacity="${held ? 0.4 : 0.9}"/>`;
  if (!held) s += `<line x1="${FX}" y1="${baseY}" x2="${FX}" y2="${topY}" stroke="rgba(255,250,225,.85)" stroke-width="2.2" class="${flowCls}"/>`;
  if (atPeak) {
    const gy = topY - 6;
    s += `<circle cx="${FX}" cy="${gy}" r="46" fill="none" stroke="var(--acc-bright)" stroke-width="2" opacity=".5" ${rm ? '' : 'class="breatheA"'}/>`;
    s += `<circle cx="${FX}" cy="${gy}" r="30" fill="none" stroke="var(--acc-rim)" stroke-width="1.4" opacity=".7" ${rm ? '' : 'class="breatheA"'} style="animation-delay:.6s"/>`;
    s += `<path d="M${FX - 46},${gy + 8} Q${FX},${gy - 58} ${FX + 46},${gy + 8}" fill="none" stroke="var(--acc-core)" stroke-width="2.4" opacity=".7" filter="url(#soft)"/>`;
    if (!rm) { s += `<circle cx="${FX}" cy="${gy}" r="11" fill="rgba(255,250,225,.6)" class="mp"/>`; for (let i = 0; i < 3; i++) { const a = -40 + i * 40, [gx, gyy] = PT(FX, gy, 40, a); s += `<circle cx="${gx.toFixed(1)}" cy="${gyy.toFixed(1)}" r="2.4" fill="var(--acc-core)" class="twk" style="animation-delay:${i * 0.4}s"/>`; } }
  }
  if (p === 'heaven') {
    for (let i = -1; i <= 1; i++) { const x = FX + i * 60; s += `<path d="M${x},${lerp(330, 300, rf)} Q${(x + FX) / 2},460 ${FX},540" fill="none" stroke="${qiCol}" stroke-width="${active ? 2.6 : 1.8}" opacity="${held ? 0.25 : 0.7}" class="${flowCls}"/>`; }
  } else if (p === 'earth') {
    for (let i = -1; i <= 1; i++) { const x = FX + i * 70; s += `<path d="M${x},900 Q${(x + FX) / 2},740 ${FX},560" fill="none" stroke="${qiCol}" stroke-width="${active ? 2.8 : 1.9}" opacity="${held ? 0.25 : 0.7}" class="${flowCls}"/>`; }
  } else {
    for (let i = -1; i <= 1; i += 2) { s += `<path d="M${FX + i * 120},600 Q${FX + i * 40},540 ${FX},500" fill="none" stroke="${qiCol}" stroke-width="${active ? 2.6 : 1.8}" opacity="${held ? 0.25 : 0.75}" class="${flowCls}"/>`; }
    s += `<path d="M${FX},560 L${FX},${886 - lerp(60, 330, realmPct) - 10}" fill="none" stroke="${qiCol}" stroke-width="${active ? 2.4 : 1.6}" opacity="${held ? 0.2 : 0.7}" class="${flowCls}"/>`;
  }
  return s;
}

function buildFigure(p: string, realm: number, fg: string, rm: boolean): string {
  const rf = (realm - 1) / 5, active = fg === 'cultivating' && !rm, held = fg === 'combat-held';
  const SC = 0.92 * (p === 'earth' ? lerp(1, 1.16, rf) : p === 'heaven' ? lerp(1, 0.97, rf) : 1);
  const lift = p === 'heaven' ? lerp(0, 46, rf) : 0;
  const TX = 1024 - 606 * SC, TY = 384 * SC - lift + 12;
  const spectral = p === 'heaven' ? lerp(0, 0.34, rf) : 0;
  const robe = p === 'heaven' ? `rgba(231,242,238,${0.5 - spectral * 0.5})` : p === 'earth' ? 'rgba(243,228,204,.56)' : 'rgba(243,234,215,.54)';
  const stroke = p === 'heaven' ? `rgba(150,178,170,${0.62 - spectral})` : 'rgba(120,96,52,.66)';
  const rim = 'var(--acc-rim)', core = 'var(--acc-core)';
  const auraId = p === 'heaven' ? 'auraHeaven' : p === 'earth' ? 'auraEarth' : 'auraMartial';
  const auraOp = (held ? 0.3 : active ? lerp(0.7, 0.95, rf) : lerp(0.42, 0.66, rf)).toFixed(2);
  const auraScale = active ? 1.06 : 1;
  let s = `<g transform="translate(${TX.toFixed(1)},${TY.toFixed(1)}) scale(${SC.toFixed(3)})" style="${held ? 'filter:grayscale(.35);opacity:.74' : ''}">`;
  s += `<ellipse cx="606" cy="402" rx="${236 * auraScale}" ry="${320 * auraScale}" fill="url(#${auraId})" ${rm ? '' : 'class="breatheA"'} style="opacity:${auraOp}"/>`;
  if (p === 'heaven') { s += `<circle cx="606" cy="150" r="${lerp(70, 104, rf)}" fill="url(#auraHeaven)" ${rm ? '' : 'class="breatheA"'} style="opacity:${0.4 + rf * 0.4}"/>`; if (rf > 0.45) s += `<circle cx="606" cy="396" r="${lerp(180, 230, rf)}" fill="none" stroke="rgba(215,226,220,${(rf - 0.4) * 0.5})" stroke-dasharray="2 16" ${rm ? '' : 'class="spinG"'} style="transform-origin:606px 396px;animation-duration:120s"/>`; }
  if (p === 'martial') s += `<circle cx="606" cy="396" r="200" fill="none" stroke="rgba(178,131,45,${0.22 + rf * 0.2})" stroke-dasharray="3 13" ${rm ? '' : 'class="spinG"'} style="transform-origin:606px 396px;animation-duration:${lerp(80, 46, rf)}s"/>`;
  s += `<path d="M452,560 Q540,612 606,612 Q672,612 760,560 Q792,600 700,624 Q606,640 512,624 Q420,600 452,560Z" fill="${robe}" stroke="${stroke}" stroke-width="1.6"/>`;
  s += `<path d="M556,206 Q494,272 478,402 Q466,500 452,560 Q540,592 606,592 Q672,592 760,560 Q746,500 734,402 Q718,272 656,206 Q632,242 606,242 Q580,242 556,206Z" fill="${robe}" stroke="${stroke}" stroke-width="1.8"/>`;
  s += `<g fill="none" stroke="${stroke}" stroke-opacity=".6" stroke-width="1.4"><path d="M556,300 Q540,420 528,540"/><path d="M656,300 Q672,420 684,540"/><path d="M606,260 L606,560"/></g>`;
  s += `<path d="M566,212 L606,300 L646,212" fill="none" stroke="${stroke}" stroke-width="2"/>`;
  s += `<path d="M656,206 Q718,272 734,402 Q746,500 760,560" fill="none" stroke="${rim}" stroke-width="${lerp(2.4, 4, rf)}" opacity="${0.5 + rf * 0.4}" filter="url(#soft)"/>`;
  s += `<ellipse cx="606" cy="556" rx="46" ry="20" fill="${robe}" stroke="${stroke}" stroke-width="1.5"/>`;
  s += `<circle cx="606" cy="552" r="11" fill="${core}" opacity="${active ? 0.7 : 0.45}" filter="url(#soft)"/>`;
  s += `<path d="M520,270 Q548,210 596,202 Q606,210 616,202 Q664,210 692,270 Q606,248 520,270Z" fill="${robe}" stroke="${stroke}" stroke-width="1.5"/>`;
  s += `<path d="M586,212 Q606,198 626,212" fill="none" stroke="${stroke}" stroke-opacity=".5" stroke-width="1.3"/>`;
  s += `<rect x="592" y="168" width="28" height="40" rx="11" fill="${robe}" stroke="${stroke}" stroke-width="1.4"/>`;
  s += `<circle cx="606" cy="150" r="46" fill="${robe}" stroke="${stroke}" stroke-width="1.6"/>`;
  s += `<path d="M576,138 Q606,108 636,138" fill="none" stroke="${stroke}" stroke-opacity=".6" stroke-width="1.4"/>`;
  s += `<ellipse cx="606" cy="104" rx="16" ry="13" fill="${robe}" stroke="${stroke}" stroke-width="1.5"/><rect x="600" y="96" width="12" height="10" rx="3" fill="${stroke}"/>`;
  s += `<circle cx="606" cy="470" r="${lerp(40, 50, rf)}" fill="${core}" ${rm ? '' : 'class="breatheA"'} style="opacity:${active ? 0.95 : 0.8}"/>`;
  s += `<circle cx="606" cy="470" r="22" fill="none" stroke="rgba(150,120,60,.65)" stroke-width="1.4"/>`;
  s += `<circle cx="606" cy="470" r="30" fill="none" stroke="${rim}" stroke-width="1.4" opacity=".5" ${rm ? '' : 'class="breatheA"'}/>`;
  if (p === 'earth') { const marks = Math.round(rf * 5); for (let i = 0; i < marks; i++) { const sx = i % 2 ? 700 : 512, sy = 300 + i * 44; s += `<g stroke="rgba(180,120,60,${0.4 + rf * 0.3})" stroke-width="2" fill="none"><path d="M${sx - 14},${sy} q8,-7 16,0 q-8,5 -16,0"/><path d="M${sx - 12},${sy + 10} q7,-6 14,0"/></g>`; } if (rf > 0.55) s += `<path d="M540,206 Q606,176 672,206" fill="none" stroke="rgba(180,120,60,.5)" stroke-width="3"/>`; }
  if (p === 'martial') { const li = Math.round(1 + rf * 3); for (let i = 0; i < li; i++) s += `<path d="M${500 - i * 6},${340 + i * 30} L${712 + i * 6},${330 + i * 28}" stroke="rgba(255,177,90,${0.18 + rf * 0.25})" stroke-width="1.3" opacity=".8"/>`; if (active && !rm) s += `<circle cx="606" cy="470" r="6" fill="#fff" class="twk" style="animation-duration:1.6s"/>`; }
  if (p === 'heaven') { const g = Math.round(2 + rf * 5); for (let i = 0; i < g; i++) { const a = i / g * 360, [x, y] = PT(606, 150, lerp(64, 96, rf), a); s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6" fill="rgba(251,243,220,.9)" ${rm ? '' : 'class="twk"'} style="animation-delay:${i * 0.4}s"/>`; } }
  s += `</g>`;
  return s;
}

function buildGateHalo(p: string, realm: number, rm: boolean): string {
  const rf = (realm - 1) / 5;
  const SC = 0.92 * (p === 'earth' ? lerp(1, 1.16, rf) : p === 'heaven' ? lerp(1, 0.97, rf) : 1);
  const lift = p === 'heaven' ? lerp(0, 46, rf) : 0;
  const cx = 1024, crownY = 534 * SC - lift + 12, gy = crownY - 106;
  let s = `<g style="pointer-events:none">`;
  s += `<line x1="${cx}" y1="${crownY - 40}" x2="${cx}" y2="${gy + 20}" stroke="var(--acc-core)" stroke-width="3" opacity=".5" filter="url(#soft)" ${rm ? '' : 'class="qiflow"'}/>`;
  ([[36, 0.5], [58, 0.34], [82, 0.2]] as const).forEach((r, i) => { s += `<circle cx="${cx}" cy="${gy}" r="${r[0]}" fill="none" stroke="var(--acc-rim)" stroke-width="${(2 - i * 0.4).toFixed(1)}" opacity="${r[1]}" ${rm ? '' : `class="breatheA" style="animation-delay:${(i * 0.5).toFixed(1)}s"`}/>`; });
  s += `<path d="${arc(cx, gy, 48, -88, 88)}" fill="none" stroke="var(--acc-bright)" stroke-width="3" opacity=".72" filter="url(#glowJ)"/>`;
  s += `<path d="M${cx - 48},${gy} L${cx - 48},${gy + 56} M${cx + 48},${gy} L${cx + 48},${gy + 56}" stroke="var(--acc-bright)" stroke-width="2.4" opacity=".5"/>`;
  s += `<circle cx="${cx}" cy="${gy}" r="15" fill="var(--acc-core)" opacity=".82" ${rm ? '' : 'class="mp"'} filter="url(#soft)"/>`;
  s += `<circle cx="${cx}" cy="${gy}" r="6.5" fill="#fff7e6"/>`;
  if (!rm) for (let i = 0; i < 5; i++) { const x = cx - 30 + i * 15; s += `<circle cx="${x}" cy="${gy + 34}" r="1.8" fill="var(--acc-core)" class="twk" style="animation-delay:${(i * 0.4).toFixed(1)}s"/>`; }
  s += `</g>`;
  return s;
}

/** The composed field SVG (back→front), matching the artifact's buildField layer order. */
export function buildSceneFieldSvg(params: SceneParams): string {
  const { path, realmIndex1to7: realm, foreground: fg, reducedMotion: rm, atPeak, realmPct } = params;
  return `<svg class="cultivationSeatScene__field" viewBox="0 0 2048 1152" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${buildAtmos(path, realm, rm)}${buildMandala(path, realm, rm)}${buildDais(path, realm, rm)}${buildQiLight(path, realm, fg, rm, atPeak, realmPct)}${buildFigure(path, realm, fg, rm)}${atPeak && fg !== 'combat-held' ? buildGateHalo(path, realm, rm) : ''}</svg>`;
}

/** The injected-once SVG defs (gradients/filters), ported from the artifact's DEFS. */
export const CULTIVATION_SEAT_SCENE_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<filter id="soft"><feGaussianBlur stdDeviation="2.2"/></filter>
<filter id="glowJ" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="brushRough" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="1" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="9"/></filter>
<radialGradient id="heavenDisc" cx="42%" cy="38%" r="70%"><stop offset="0" stop-color="#fbf3dc"/><stop offset=".6" stop-color="#d7e2dc"/><stop offset="1" stop-color="#9fb6bd" stop-opacity=".3"/></radialGradient>
<linearGradient id="heavenMist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe0d9" stop-opacity=".5"/><stop offset="1" stop-color="#cfe0d9" stop-opacity="0"/></linearGradient>
<radialGradient id="martialDisc" cx="50%" cy="46%" r="60%"><stop offset="0" stop-color="#e8714a"/><stop offset=".5" stop-color="#a93420" stop-opacity=".7"/><stop offset="1" stop-color="#5e1c16" stop-opacity="0"/></radialGradient>
<linearGradient id="earthMist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a08458" stop-opacity=".5"/><stop offset="1" stop-color="#a08458" stop-opacity="0"/></linearGradient>
<radialGradient id="cloudDais" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#dcefe7" stop-opacity=".8"/><stop offset="1" stop-color="#9fd0c4" stop-opacity="0"/></radialGradient>
<radialGradient id="forgeGlow2" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#ffb15a"/><stop offset=".5" stop-color="#d2691e" stop-opacity=".6"/><stop offset="1" stop-color="#a93420" stop-opacity="0"/></radialGradient>
<radialGradient id="earthEssence" cx="40%" cy="34%" r="70%"><stop offset="0" stop-color="#ffcf7a"/><stop offset="1" stop-color="#a2712a" stop-opacity=".2"/></radialGradient>
<linearGradient id="bladeSteel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a9098"/><stop offset=".5" stop-color="#e6ecf2"/><stop offset="1" stop-color="#6a7078"/></linearGradient>
<linearGradient id="bannerCloth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b2f27"/><stop offset="1" stop-color="#5e1c16"/></linearGradient>
<linearGradient id="bladeBrush" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c9a85a" stop-opacity="0"/><stop offset=".4" stop-color="#f0d896" stop-opacity=".95"/><stop offset="1" stop-color="#6e4c16" stop-opacity=".2"/></linearGradient>
<radialGradient id="auraHeaven" cx="50%" cy="46%" r="55%"><stop offset="0" stop-color="#dcefe7" stop-opacity=".55"/><stop offset=".6" stop-color="#bfe0d4" stop-opacity=".2"/><stop offset="1" stop-color="#bfe0d4" stop-opacity="0"/></radialGradient>
<radialGradient id="auraEarth" cx="50%" cy="46%" r="55%"><stop offset="0" stop-color="#e7cd92" stop-opacity=".5"/><stop offset=".6" stop-color="#caa05a" stop-opacity=".2"/><stop offset="1" stop-color="#caa05a" stop-opacity="0"/></radialGradient>
<radialGradient id="auraMartial" cx="50%" cy="46%" r="55%"><stop offset="0" stop-color="#ffb15a" stop-opacity=".5"/><stop offset=".55" stop-color="#c2563f" stop-opacity=".24"/><stop offset="1" stop-color="#c2563f" stop-opacity="0"/></radialGradient>
<linearGradient id="rlGrad" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="var(--acc-core)"/><stop offset="1" stop-color="var(--acc-bright)" stop-opacity=".2"/></linearGradient>
</defs></svg>`;
