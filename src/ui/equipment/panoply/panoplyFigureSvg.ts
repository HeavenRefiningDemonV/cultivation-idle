/**
 * M.III.3 EQ-PORT — the pure SVG-string builders, ported 1:1 from the artifact `M_III_2_panoply_vault.html`
 * (path data / numbers / gradient refs / class names verbatim). PURE over surface data: no store handles,
 * no Math.random in render (the artifact's RNG ids/motes are made deterministic). Reduced-motion is handled
 * by CSS (the @media law in panoplyVault.scss), so the animation classes are KEPT here. SVG injection is
 * safe (no user input flows into the strings) — same precedent as `cultivationSeatSceneSvg`.
 *
 * Adaptations from the artifact (gameplay-truth / live-type binding, NOT redesign):
 *  - slot click: `onclick="openItem(id)"` → `data-instance-id="id"` (PanoplyFigureScene delegates clicks).
 *  - bond reward schedule: the live WeaponBondSurface has no `latentRaw.on` flags → `on = level >= grantLevel`.
 *  - emphasis: read from the live `resolvePathIdentity` (the canonical mirror), not the artifact's mock.
 *  - the modal hero (`bigEmblemSVG`/`modalHTML`) is NOT ported — the F2 `ItemDetailInspector` is reused.
 */
import type {
  GearElementLeanSurface,
  PanoplyExactSurfaceV1,
  PanoplyItemSummary,
  PanoplyPathLean,
  PanoplySlotKind,
  PanoplySlotSurface,
  RarityFrameGrade,
  VaultSlipSurface,
  WeaponBondSurface,
} from '../../../systems/ui/equipment/equipmentExactTypes.js';
import type { ItemDetailRarity } from '../../../systems/ui/modals/itemDetailTypes.js';
import { resolvePathIdentity, type SlotEmphasis } from '../../../systems/ui/equipment/gearPathIdentity.js';

// ── shared lookups (Codex I.6/I.9 — reproduced verbatim) ──────────────────────────────────────────
export const ELEMENTS: Record<string, [string, string, string]> = {
  wood: ['Wood', '木', 'var(--element-wood)'], fire: ['Fire', '火', 'var(--element-fire)'], earth: ['Earth', '土', 'var(--element-earth)'], metal: ['Metal', '金', 'var(--element-metal)'], water: ['Water', '水', 'var(--element-water)'],
  wind: ['Wind', '風', 'var(--el-wind)'], lightning: ['Lightning', '雷', 'var(--el-lightning)'], ice: ['Ice', '冰', 'var(--el-ice)'], light: ['Light', '光', 'var(--el-light)'], shadow: ['Shadow', '影', 'var(--el-shadow)'], soul: ['Soul', '魂', 'var(--el-soul)'], void: ['Void', '虛', 'var(--el-void)'], time: ['Time', '時', 'var(--el-time)'], astral: ['Astral', '星', 'var(--el-astral)'],
};
export const elGlyph = (id: string): string => (ELEMENTS[id] ? ELEMENTS[id][1] : '');
export const elName = (id: string): string => (ELEMENTS[id] ? ELEMENTS[id][0] : id);
export const elCol = (id: string): string => (ELEMENTS[id] ? ELEMENTS[id][2] : 'var(--ink-45)');

export const RGRADE: Record<ItemDetailRarity, RarityFrameGrade> = { common: 'mortal', uncommon: 'spirit', rare: 'earth', epic: 'heaven', legendary: 'immortal' };
export const RGLYPH: Record<ItemDetailRarity, string> = { common: '凡', uncommon: '良', rare: '珍', epic: '极', legendary: '仙' };
export const RLABEL: Record<ItemDetailRarity, string> = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };
const RVAR: Record<RarityFrameGrade, string> = { mortal: 'var(--rarity-mortal)', spirit: 'var(--rarity-spirit)', earth: 'var(--rarity-earth)', heaven: 'var(--rarity-heaven)', immortal: 'var(--rarity-immortal)' };
const RSOFT: Record<RarityFrameGrade, string> = { mortal: 'var(--rarity-mortal-soft)', spirit: 'var(--rarity-spirit-soft)', earth: 'var(--rarity-earth-soft)', heaven: 'var(--rarity-heaven-soft)', immortal: 'var(--rarity-immortal-soft)' };
export const gradeVar = (g: RarityFrameGrade): string => RVAR[g] ?? 'var(--rarity-mortal)';
export const softVar = (g: RarityFrameGrade): string => RSOFT[g] ?? 'var(--rarity-mortal-soft)';
export const KMARK: Record<string, string> = { weapon: '器', head: '冠', chest: '甲', legs: '胫', accessory: '宝' };
export const RANK: Record<string, number> = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
export const PATHMETA: Record<PanoplyPathLean, [string, string, string]> = { martial: ['武', 'Martial', '器 weapon-led'], earth: ['地', 'Earth', '甲 armor-led'], heaven: ['天', 'Heaven', '宝 accessory-led'] };
export const STATELABEL: Record<string, string> = { healthy: 'Equipped', empty: 'Bare', blocked: 'Slot locked', contentCap: 'At content cap', 'detail-affix': 'Inspecting', 'detail-legendary': 'Legendary', unknown: 'Unknown' };

/** fixed slot anchors in the 1000x760 scene — STABLE across all paths (geometry never moves; emphasis only). */
export const ANCHORS: { head: [number, number]; chest: [number, number]; legs: [number, number]; weapon: [number, number]; accessory: Array<[number, number]> } = {
  head: [500, 138], chest: [500, 300], legs: [500, 452], weapon: [742, 330], accessory: [[272, 232], [232, 350], [260, 470], [326, 560]],
};

/** emphasis = size/aura only; read from the live resolvePathIdentity (the canonical mirror of emphasisFor). */
function emphasisForSlot(path: PanoplyPathLean, slot: PanoplySlotKind): SlotEmphasis {
  const fam = slot === 'weapon' ? 'weapon' : slot === 'accessory' ? 'accessory' : 'armor';
  return resolvePathIdentity(path).emphasis[fam];
}

// ── scenic primitives ─────────────────────────────────────────────────────────────────────────────
export const tassel = (x: number, y: number, col: string, len = 14): string =>
  `<g transform="translate(${x},${y})"><g class="swayT" style="animation-delay:${(((x * 7 + y) | 0) % 26) / 10}s"><circle r="3" fill="${col}"/><path d="M-2.5,1 q-2,${len * 0.6} -3.5,${len} M0,1 q0,${len * 0.7} 0,${len} M2.5,1 q2,${len * 0.6} 3.5,${len}" stroke="${col}" stroke-width="1.2" fill="none" opacity=".9"/><circle cy="${len}" r="1.4" fill="${col}"/></g></g>`;

export function waxSeal(chars: string, size: number, rot: number, jade: boolean): string {
  const C = size / 2, r = size / 2 - 2, N = 22;
  let p = '';
  for (let i = 0; i <= N; i++) { const a = (i / N) * 2 * Math.PI; const rr = r * (0.9 + 0.06 * Math.sin(i * 2.7 + 1.3) + 0.04 * Math.cos(i * 1.6 + 0.5)); const x = C + rr * Math.cos(a), y = C + rr * Math.sin(a); p += (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1) + ' '; }
  p += 'Z';
  const cs = [...chars], fs = size * (cs.length > 2 ? 0.27 : 0.34), gap = fs * 1.02, y0 = C - ((cs.length - 1) * gap) / 2;
  const txt = cs.map((c, i) => `<tspan x="${C}" y="${(y0 + i * gap + fs * 0.34).toFixed(1)}">${c}</tspan>`).join('');
  const fill = jade ? 'url(#jadeRad)' : 'url(#cinnDisc)', str = jade ? '#1c3128' : '#54190f', inner = jade ? 'rgba(220,240,225,.4)' : 'rgba(255,214,196,.4)', tx = jade ? '#e9efe2' : '#f4dccb';
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(${rot || 0}deg);overflow:visible"><path d="${p}" fill="${fill}" stroke="${str}" stroke-width="1.3"/><path d="${p}" fill="none" stroke="${inner}" stroke-width=".8" transform="translate(${C} ${C}) scale(.82) translate(${-C} ${-C})"/><text text-anchor="middle" font-family="var(--kai)" font-weight="700" font-size="${fs.toFixed(1)}" fill="${tx}">${txt}</text></svg>`;
}

export function ridge(w: number, baseY: number, amp: number, seed: number): string {
  let r = seed; const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  const n = 7, step = w / n; const pts: Array<[number, number]> = [];
  for (let i = 0; i <= n; i++) pts.push([i * step, baseY - amp * (0.25 + 0.75 * rnd())]);
  let p = `M0,${(baseY + amp * 1.4).toFixed(0)} L0,${pts[0][1].toFixed(0)}`;
  for (let i = 1; i < pts.length; i++) { const [x, y] = pts[i], [px, py] = pts[i - 1]; const mx = (px + x) / 2; p += ` Q${px.toFixed(0)},${py.toFixed(0)} ${mx.toFixed(0)},${((py + y) / 2).toFixed(0)} Q${x.toFixed(0)},${y.toFixed(0)} ${x.toFixed(0)},${y.toFixed(0)}`; }
  p += ` L${w},${(baseY + amp * 1.4).toFixed(0)} Z`; return p;
}
const ridgeLayer = (baseY: number, amp: number, seed: number, fill: string, op: number): string => `<path d="${ridge(1000, baseY, amp, seed)}" fill="${fill}" opacity="${op}"/>`;

/** deterministic id (was Math.random in the artifact). */
export function inkMountains(w: number, h: number, idSuffix = '0'): string {
  const gid = 'mg' + idSuffix;
  let s = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="position:absolute;inset:0;z-index:1;pointer-events:none"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b7382" stop-opacity="0"/><stop offset=".55" stop-color="#56707f" stop-opacity=".5"/><stop offset="1" stop-color="#3f5566" stop-opacity=".9"/></linearGradient></defs>`;
  ([[h * 0.8, h * 0.16, 11, 'rgba(120,138,150,.10)'], [h * 0.88, h * 0.13, 37, 'rgba(86,108,122,.13)'], [h * 0.955, h * 0.1, 71, `url(#${gid})`]] as Array<[number, number, number, string]>).forEach(([by, amp, sd, col]) => { s += `<path d="${ridge(w, by, amp, sd)}" fill="${col}" opacity=".5"/>`; });
  s += `<path d="M0,${(h * 0.86).toFixed(0)} Q${(w * 0.3).toFixed(0)},${(h * 0.83).toFixed(0)} ${(w * 0.6).toFixed(0)},${(h * 0.86).toFixed(0)} T${w},${(h * 0.85).toFixed(0)}" fill="none" stroke="rgba(245,240,228,.5)" stroke-width="6" opacity=".35" filter="url(#soft)"/></svg>`;
  return s;
}

function pagodaSVG(x: number, y: number, sc: number): string {
  return `<g transform="translate(${x},${y}) scale(${sc})" fill="#463722" opacity=".5">`
    + `<rect x="-2.5" y="-88" width="5" height="12"/><circle cx="0" cy="-90" r="3"/>`
    + `<path d="M-22,-76 L22,-76 L13,-66 L-13,-66 Z"/><rect x="-11" y="-66" width="22" height="14"/>`
    + `<path d="M-31,-52 L31,-52 L20,-40 L-20,-40 Z"/><rect x="-15" y="-40" width="30" height="18"/>`
    + `<path d="M-39,-22 L39,-22 L26,-8 L-26,-8 Z"/><rect x="-20" y="-8" width="40" height="22"/></g>`;
}

// ── rarity frame ornament + tier seal + kind glyph ────────────────────────────────────────────────
export function frameSVG(grade: RarityFrameGrade, x: number, y: number, w: number, h: number, sel: boolean): string {
  const c = gradeVar(grade), r = 5; let s = `<g>`;
  if (sel) s += `<rect x="${x - 5}" y="${y - 5}" width="${w + 10}" height="${h + 10}" rx="${r + 3}" fill="none" stroke="var(--gold-bright)" stroke-width="2.5" opacity=".9" filter="url(#glowJ)"/>`;
  if (grade === 'mortal') {
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${c}" stroke-width="1.4" opacity=".8"/>`;
  } else if (grade === 'spirit') {
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${c}" stroke-width="1.6"/>`;
    s += `<rect x="${x + 2.5}" y="${y + 2.5}" width="${w - 5}" height="${h - 5}" rx="${r - 1}" fill="none" stroke="${c}" stroke-width=".7" opacity=".5"/>`;
    s += `<path d="M${x + w / 2 - 5},${y} l5,-4 l5,4 Z" fill="${c}"/>`;
  } else if (grade === 'earth') {
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${c}" stroke-width="2"/>`;
    s += `<rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="${h - 6}" rx="${r - 1}" fill="none" stroke="${c}" stroke-width=".9" opacity=".6"/>`;
    ([[x, y, 1, 1], [x + w, y + h, -1, -1]] as Array<[number, number, number, number]>).forEach(([cx, cy, dx, dy]) => { s += `<path d="M${cx + dx * 2},${cy + dy * 9} L${cx + dx * 2},${cy + dy * 2} L${cx + dx * 9},${cy + dy * 2}" fill="none" stroke="${c}" stroke-width="2.2"/>`; });
  } else if (grade === 'heaven') {
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${c}" stroke-width="2.6"/>`;
    s += `<rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="${h - 6}" rx="${r - 1}" fill="none" stroke="${c}" stroke-width="1" opacity=".55"/>`;
    ([[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]] as Array<[number, number, number, number]>).forEach(([cx, cy, dx, dy]) => { s += `<path d="M${cx + dx * 2},${cy + dy * 11} L${cx + dx * 2},${cy + dy * 2} L${cx + dx * 11},${cy + dy * 2}" fill="none" stroke="url(#goldG)" stroke-width="2.4"/>`; });
    s += `<circle cx="${x + w / 2}" cy="${y}" r="3.2" fill="${c}" stroke="#4a2d56"/>`;
  } else {
    s += `<rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${h + 4}" rx="${r + 2}" fill="none" stroke="var(--cinnabar)" stroke-width="1.2" opacity=".55" class="legShim"/>`;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="url(#goldG)" stroke-width="2.8"/>`;
    s += `<rect x="${x + 3.5}" y="${y + 3.5}" width="${w - 7}" height="${h - 7}" rx="${r - 1}" fill="none" stroke="var(--cinnabar)" stroke-width="1.1" opacity=".8"/>`;
    ([[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]] as Array<[number, number, number, number]>).forEach(([cx, cy, dx, dy]) => { s += `<path d="M${cx + dx * 2},${cy + dy * 14} Q${cx + dx * 2},${cy + dy * 2} ${cx + dx * 14},${cy + dy * 2}" fill="none" stroke="url(#goldG)" stroke-width="2.6"/><circle cx="${cx + dx * 2}" cy="${cy + dy * 2}" r="2" fill="var(--cinnabar)"/>`; });
    s += `<g transform="translate(${x + w / 2},${y})"><path d="M-7,0 L0,-7 L7,0 L0,4 Z" fill="url(#goldRad)" stroke="#6e4c16" stroke-width=".8"/></g>`;
  }
  return s + `</g>`;
}

export function tierSealSVG(cx: number, cy: number, mark: string, capped: boolean): string {
  return `<g transform="translate(${cx},${cy})"><circle r="11" fill="url(#${capped ? 'cinnDisc' : 'goldRad'})" stroke="${capped ? '#54190f' : '#5e4214'}" stroke-width="1"/><circle r="8.4" fill="none" stroke="rgba(255,250,235,.4)" stroke-width=".7"/><text y="3.4" text-anchor="middle" font-family="var(--serif)" font-size="9.5" font-weight="800" fill="${capped ? '#f4dccb' : '#2a1d08'}">${mark}</text></g>`;
}

export function kindGlyphSVG(kind: string, col: string): string {
  const c = col || '#2a241d';
  if (kind === 'weapon') return `<g stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"><path d="M-1,12 L7,-12"/><path d="M-9,-4 L9,-4" stroke-width="2"/><path d="M-3,12 L3,12" stroke-width="3"/></g>`;
  if (kind === 'head') return `<g stroke="${c}" stroke-width="2.2" fill="none"><path d="M-11,4 Q0,-12 11,4"/><circle cx="0" cy="-6" r="2.2" fill="${c}"/><path d="M-11,4 L11,4" stroke-width="1.4"/></g>`;
  if (kind === 'chest') return `<g stroke="${c}" stroke-width="2.2" fill="none"><path d="M-10,-9 L10,-9 L8,9 Q0,14 -8,9 Z"/><path d="M0,-9 L0,12" stroke-width="1.4"/><path d="M-7,-2 L7,-2" stroke-width="1.2" opacity=".7"/></g>`;
  if (kind === 'legs') return `<g stroke="${c}" stroke-width="2.2" fill="none"><path d="M-8,-11 L-3,11 M8,-11 L3,11 M-8,-11 L8,-11"/><path d="M-5,0 L5,0" stroke-width="1.2" opacity=".7"/></g>`;
  return `<g stroke="${c}" stroke-width="2.2" fill="none"><circle cx="0" cy="2" r="8"/><path d="M-4,-6 L0,-12 L4,-6 Z" fill="${c}" stroke="none"/></g>`;
}

export function nameTag(x: number, yTop: number, label: string, col?: string): string {
  const cc = col || 'var(--ink)'; const lab = label || '';
  const w = Math.max(lab.length * 4.95 + 15, 28), h = 13.5;
  return `<g transform="translate(${x},${yTop})">`
    + `<rect x="${(-w / 2).toFixed(1)}" y="0" width="${w.toFixed(1)}" height="${h}" rx="3.2" fill="rgba(243,234,215,.93)" stroke="var(--ink-25)" stroke-width=".8"/>`
    + `<rect x="${(-w / 2 + 1.4).toFixed(1)}" y="1.4" width="${(w - 2.8).toFixed(1)}" height="${h - 2.8}" rx="2.2" fill="none" stroke="rgba(162,113,42,.28)" stroke-width=".7"/>`
    + `<text x="0" y="9.5" text-anchor="middle" font-family="var(--serif)" font-size="8.5" font-weight="800" letter-spacing=".02em" fill="${cc}">${lab}</text></g>`;
}

// ── one framed treasure ON the figure (filled / empty / locked) ───────────────────────────────────
export function slotObjectSVG(s: PanoplySlotSurface, x: number, y: number, emph: SlotEmphasis, focusId: string | null): string {
  const SZ = emph === 'lead' ? 72 : emph === 'muted' ? 56 : 62, h = SZ;
  let g = `<g transform="translate(${x - SZ / 2},${y - SZ / 2})">`;
  if (s.locked) {
    g += `<rect x="0" y="0" width="${SZ}" height="${h}" rx="6" fill="rgba(31,26,23,.05)" stroke="var(--ink-25)" stroke-width="1.4" stroke-dasharray="4 4"/>`;
    g += `<g transform="translate(${SZ / 2},${h / 2 - 3})"><rect x="-9" y="-2" width="18" height="14" rx="2.5" fill="rgba(110,36,30,.16)" stroke="var(--cinn-deep)" stroke-width="1.5"/><path d="M-5,-2 v-4 a5,5 0 0 1 10,0 v4" fill="none" stroke="var(--cinn-deep)" stroke-width="1.6"/></g>`;
    g += `</g>`;
    g += nameTag(x, y + h / 2 + 5, s.locked.requirement, 'var(--cinn-deep)');
    return g;
  }
  if (!s.filled || !s.item) {
    g += `<rect x="0" y="0" width="${SZ}" height="${h}" rx="6" fill="rgba(255,250,235,.18)" stroke="var(--ink-25)" stroke-width="1.3" stroke-dasharray="3 4"/>`;
    g += `<g transform="translate(${SZ / 2},${h / 2})" opacity=".4"><text y="6" text-anchor="middle" font-family="var(--kai)" font-size="18" fill="var(--ink-45)">${KMARK[s.slot] || '·'}</text></g>`;
    g += `</g>`;
    g += nameTag(x, y + h / 2 + 5, (s.mountLabel || '').replace(' mount', ''), 'var(--ink-70)');
    return g;
  }
  const it: PanoplyItemSummary = s.item, grade = it.rarityFrameGrade, ec = it.element ? it.element.sceneColorToken : '#6a5a40', focus = !!focusId && it.instanceId === focusId;
  g += `<circle cx="${SZ / 2}" cy="${h / 2}" r="${SZ * 0.62}" fill="${ec}" opacity="${emph === 'lead' ? 0.13 : 0.07}" filter="url(#soft6)" class="breatheA" style="transform-origin:${SZ / 2}px ${h / 2}px"/>`;
  if (grade === 'heaven' || grade === 'immortal') g += `<circle cx="${SZ / 2}" cy="${h / 2}" r="${SZ * 0.74}" fill="${gradeVar(grade)}" opacity="${grade === 'immortal' ? 0.2 : 0.16}" filter="url(#soft6)"/>`;
  g += `<rect x="3" y="3" width="${SZ - 6}" height="${h - 6}" rx="4" fill="${ec}" opacity=".10"/>`;
  g += `<rect x="3" y="3" width="${SZ - 6}" height="${h - 6}" rx="4" fill="rgba(255,250,236,.4)"/>`;
  g += `<g transform="translate(${SZ / 2},${h / 2 - 3}) scale(${(SZ / 62 * 1.18).toFixed(2)})">${kindGlyphSVG(s.slot, ec)}</g>`;
  g += frameSVG(grade, 0, 0, SZ, h, focus);
  g += tierSealSVG(SZ - 3, 3, it.tierMark.replace('T', ''), !!(it.capped && it.capped.capped));
  if (it.element) g += `<g transform="translate(4,${h - 5})"><circle r="6.5" fill="${ec}" opacity=".9"/><text y="2.6" text-anchor="middle" font-family="var(--kai)" font-size="7.5" font-weight="700" fill="#fff">${elGlyph(it.element.id)}</text></g>`;
  let pips = ''; for (let i = 0; i < Math.min(it.affixCount, 5); i++) pips += `<circle cx="${SZ / 2 - (Math.min(it.affixCount, 5) - 1) * 4 + i * 8}" cy="${h - 4}" r="2.1" fill="var(--gold-deep)"/>`;
  g += pips;
  if (it.capped && it.capped.capped) g += `<g transform="translate(${SZ / 2},${h / 2})" class="weakP"><circle r="3" fill="var(--cinnabar)"/></g>`;
  g += `</g>`;
  g += `<rect x="${x - SZ / 2}" y="${y - SZ / 2}" width="${SZ}" height="${h}" fill="transparent" class="clickable" data-instance-id="${it.instanceId}"/>`;
  g += nameTag(x, y + h / 2 + 5, it.name.length > 18 ? it.name.slice(0, 17) + '…' : it.name, 'var(--ink)');
  return g;
}

// ── figure body + scene weather + furniture ───────────────────────────────────────────────────────
function figBodySVG(path: PanoplyPathLean): string {
  const robe = ({ martial: 'url(#robeMartial)', earth: 'url(#robeEarth)', heaven: 'url(#robeHeaven)' } as const)[path];
  let s = '';
  if (path === 'martial') {
    s += `<ellipse cx="500" cy="640" rx="150" ry="20" fill="rgba(40,28,16,.3)" filter="url(#soft3)"/>`;
    s += `<path d="M452,180 Q500,150 548,180 L600,610 Q500,648 400,610 Z" fill="${robe}" stroke="#15100b" stroke-width="2"/>`;
    s += `<path d="M500,165 Q470,205 470,360 M500,165 Q530,205 530,360" stroke="rgba(0,0,0,.25)" stroke-width="2" fill="none"/>`;
    s += `<path d="M470,540 Q500,560 530,540 L548,610 Q500,628 452,610 Z" fill="rgba(0,0,0,.18)"/>`;
    s += `<circle cx="500" cy="120" r="30" fill="url(#figG)" stroke="#15100b" stroke-width="2"/>`;
    s += `<path d="M548,210 Q640,250 720,320" stroke="#2a241d" stroke-width="13" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M452,210 Q400,280 360,360" stroke="#2a241d" stroke-width="12" fill="none" stroke-linecap="round"/>`;
  } else if (path === 'earth') {
    s += `<ellipse cx="500" cy="648" rx="190" ry="24" fill="rgba(40,28,16,.32)" filter="url(#soft3)"/>`;
    s += `<path d="M438,190 Q500,158 562,190 L630,628 Q500,660 370,628 Z" fill="${robe}" stroke="#15100b" stroke-width="2"/>`;
    s += `<path d="M500,172 Q462,220 460,400 M500,172 Q538,220 540,400" stroke="rgba(0,0,0,.25)" stroke-width="2" fill="none"/>`;
    s += `<circle cx="500" cy="126" r="33" fill="url(#figG)" stroke="#15100b" stroke-width="2"/>`;
    s += `<path d="M438,222 Q392,300 360,372" stroke="#2a241d" stroke-width="14" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M562,222 Q660,270 720,320" stroke="#2a241d" stroke-width="14" fill="none" stroke-linecap="round"/>`;
  } else {
    s += `<ellipse cx="500" cy="650" rx="120" ry="16" fill="rgba(40,28,16,.22)" filter="url(#soft3)"/>`;
    s += `<path d="M462,176 Q500,150 538,176 L572,560 Q540,640 500,628 Q460,640 428,560 Z" fill="${robe}" stroke="#15100b" stroke-width="2"/>`;
    s += `<path d="M500,162 Q476,210 478,420 M500,162 Q524,210 522,420" stroke="rgba(0,0,0,.22)" stroke-width="2" fill="none"/>`;
    s += `<circle cx="500" cy="118" r="28" fill="url(#figG)" stroke="#15100b" stroke-width="2"/>`;
    s += `<path d="M462,206 Q410,260 360,360" stroke="#2a241d" stroke-width="11" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M538,206 Q600,250 742,318" stroke="#2a241d" stroke-width="11" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M472,96 Q500,86 528,96 L520,150 Q500,142 480,150 Z" fill="rgba(220,235,255,.18)" stroke="rgba(180,210,235,.5)" stroke-width="1"/>`;
  }
  return s;
}

function sceneBackdrop(path: PanoplyPathLean): string {
  if (path === 'martial') {
    let g = `<ellipse cx="500" cy="420" rx="320" ry="250" fill="url(#qiAura)" opacity=".7"/>`;
    g += `<circle cx="500" cy="452" r="158" fill="url(#forgeGlow)"/>`;
    g += ridgeLayer(548, 72, 11, '#b89a66', 0.18) + ridgeLayer(606, 84, 37, '#86714a', 0.26) + ridgeLayer(668, 72, 71, '#4f4029', 0.36);
    let sw = ''; for (let i = 0; i < 9; i++) { const x = 110 + i * 100, y = 78 + (i % 4) * 30, op = i % 2 ? 0.16 : 0.28; sw += `<g opacity="${op}"><line x1="${x}" y1="${y}" x2="${x - 24}" y2="${y + 136}" stroke="#caa24a" stroke-width="${i % 2 ? 1 : 1.5}"/><path d="M${(x - 24).toFixed(0)},${(y + 136).toFixed(0)} l9,-2 l-3,9 z" fill="#caa24a"/></g>`; }
    g += sw + `<ellipse cx="500" cy="712" rx="430" ry="92" fill="url(#forgeGlow)"/>`;
    return g;
  }
  if (path === 'earth') {
    let g = `<ellipse cx="500" cy="330" rx="250" ry="210" fill="url(#auraEarth)" opacity=".7"/>`;
    g += ridgeLayer(502, 92, 5, '#9c8a64', 0.16) + ridgeLayer(578, 102, 29, '#76633f', 0.26);
    g += pagodaSVG(206, 566, 1) + pagodaSVG(820, 548, 0.78);
    g += ridgeLayer(652, 82, 71, '#463722', 0.4);
    let mt = ''; for (let i = 0; i < 10; i++) { const x = 80 + ((i * 101) % 840), y = 150 + ((i * 157) % 430); mt += `<circle cx="${x}" cy="${y}" r="${1 + (i % 3) * 0.5}" fill="#8d7548" opacity="${(0.16 + (i % 3) * 0.08).toFixed(2)}" class="${i % 2 ? 'twk' : ''}"/>`; }
    return g + mt;
  }
  let g = `<ellipse cx="460" cy="300" rx="330" ry="290" fill="url(#nebulaG)"/>`;
  let neb = ''; for (let i = 0; i < 64; i++) { const t = (i / 64) * Math.PI * 4.2, rr = 10 + i * 4.3, x = 460 + Math.cos(t) * rr * 0.92, y = 300 + Math.sin(t) * rr * 0.6; if (x < 6 || x > 994 || y < 6 || y > 620) continue; neb += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${i % 6 === 0 ? 1.8 : 0.9}" fill="#cfe0f2" opacity="${(0.18 + (i % 5) * 0.1).toFixed(2)}" class="${i % 9 === 0 ? 'twk' : ''}"/>`; }
  g += neb;
  ([[180, 140], [824, 118], [300, 470], [764, 430], [560, 86]] as Array<[number, number]>).forEach(([x, y]) => { g += `<g class="twk"><circle cx="${x}" cy="${y}" r="2" fill="#eaf3ff"/><path d="M${x - 6},${y} h12 M${x},${y - 6} v12" stroke="rgba(220,235,255,.5)" stroke-width="1"/></g>`; });
  g += `<path d="M138,648 l44,-78 l38,78 Z" fill="rgba(86,104,122,.32)"/><path d="M778,636 l32,-58 l32,58 Z" fill="rgba(86,104,122,.26)"/>`;
  g += `<path d="M0,640 Q150,612 320,634 Q520,660 700,626 Q860,602 1000,632 L1000,760 L0,760 Z" fill="rgba(220,232,245,.2)"/>`;
  g += `<path d="M0,686 Q200,660 430,682 Q680,708 1000,674 L1000,760 L0,760 Z" fill="rgba(210,226,242,.3)"/>`;
  g += `<path d="M40,650 Q160,638 300,650 M620,634 Q760,622 900,636" stroke="rgba(245,250,255,.4)" stroke-width="3" fill="none" filter="url(#soft)"/>`;
  return g;
}

const COUPLET: Record<PanoplyPathLean, [string, string]> = {
  martial: ['千 锤 百 炼 锋 始 出', '万 战 归 来 气 自 雄'],
  earth: ['厚 土 载 山 根 不 动', '磐 石 承 命 体 长 存'],
  heaven: ['一 念 通 玄 观 未 来', '魂 照 三 界 证 道 心'],
};
function coupletColSVG(x: number, text: string): string {
  let g = `<g opacity=".85"><rect x="${x - 21}" y="92" width="42" height="572" rx="3" fill="rgba(243,234,215,.5)" stroke="rgba(162,113,42,.30)" stroke-width="1"/>`
    + `<rect x="${x - 21}" y="92" width="42" height="572" rx="3" fill="url(#pillarG)"/>`
    + `<line x1="${x - 15}" y1="104" x2="${x - 15}" y2="652" stroke="rgba(162,113,42,.16)" stroke-width="1"/>`
    + `<line x1="${x + 15}" y1="104" x2="${x + 15}" y2="652" stroke="rgba(162,113,42,.16)" stroke-width="1"/>`;
  const chars = text.split(' '); const top = 130, step = 72;
  chars.forEach((c, i) => { g += `<text x="${x}" y="${top + i * step}" text-anchor="middle" font-family="var(--kai)" font-size="27" font-weight="700" fill="rgba(31,26,23,.34)">${c}</text>`; });
  g += `<rect x="${x - 9}" y="624" width="18" height="18" rx="2" fill="rgba(139,48,40,.30)" stroke="rgba(110,36,30,.4)" stroke-width="1"/>`;
  return g + `</g>`;
}

function sceneFurniture(path: PanoplyPathLean): string {
  let g = '';
  g += `<path d="M300,690 L300,250 Q300,96 500,80 Q700,96 700,250 L700,690 Z" fill="url(#nicheShade)" stroke="rgba(162,113,42,.30)" stroke-width="1.4"/>`;
  g += `<path d="M316,688 L316,256 Q316,112 500,96 Q684,112 684,256 L684,688" fill="none" stroke="rgba(162,113,42,.18)" stroke-width="1"/>`;
  g += `<g transform="translate(500,104)"><circle r="17" fill="rgba(243,234,215,.85)" stroke="var(--gold-deep)" stroke-width="1.4"/><circle r="12.5" fill="none" stroke="rgba(162,113,42,.4)" stroke-width=".8"/><text y="5.5" text-anchor="middle" font-family="var(--kai)" font-size="15" font-weight="700" fill="var(--gold-deep)">${path === 'martial' ? '武' : path === 'earth' ? '地' : '天'}</text></g>`;
  const halo = ({ martial: '#caa24a', earth: '#b08a3a', heaven: '#7fb6a6' } as const)[path];
  g += `<g transform="translate(500,272)" opacity=".5"><circle r="208" fill="none" stroke="${halo}" stroke-width="1.2" stroke-opacity=".55"/><circle r="194" fill="none" stroke="${halo}" stroke-width="1" stroke-opacity=".3" stroke-dasharray="2 9"/></g>`;
  let rays = ''; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r0 = 210, r1 = 222; rays += `<line x1="${(500 + Math.cos(a) * r0).toFixed(1)}" y1="${(272 + Math.sin(a) * r0).toFixed(1)}" x2="${(500 + Math.cos(a) * r1).toFixed(1)}" y2="${(272 + Math.sin(a) * r1).toFixed(1)}" stroke="${halo}" stroke-width="1.4" stroke-opacity=".4"/>`; }
  g += `<g class="spinG" style="transform-origin:500px 272px">${rays}</g>`;
  g += `<ellipse cx="500" cy="676" rx="232" ry="40" fill="url(#daisG)" stroke="rgba(120,90,46,.4)" stroke-width="1.2"/>`;
  g += `<ellipse cx="500" cy="668" rx="196" ry="32" fill="rgba(243,234,215,.42)" stroke="rgba(162,113,42,.3)" stroke-width="1"/>`;
  g += `<ellipse cx="500" cy="660" rx="150" ry="24" fill="rgba(255,250,236,.2)"/>`;
  g += `<path d="M304,676 Q500,636 696,676" fill="none" stroke="rgba(255,250,236,.38)" stroke-width="1.4"/>`;
  g += coupletColSVG(58, COUPLET[path][0]);
  g += coupletColSVG(942, COUPLET[path][1]);
  if (path === 'martial') {
    g += `<g transform="translate(150,360)" opacity=".82"><rect x="-30" y="-150" width="60" height="300" rx="5" fill="none" stroke="rgba(90,66,30,.55)" stroke-width="3"/><line x1="-30" y1="-72" x2="30" y2="-72" stroke="rgba(90,66,30,.5)" stroke-width="3"/><line x1="-30" y1="62" x2="30" y2="62" stroke="rgba(90,66,30,.5)" stroke-width="3"/>`
      + `<line x1="-15" y1="-136" x2="-15" y2="146" stroke="#3a2d1c" stroke-width="3.5" stroke-linecap="round"/><path d="M-15,-152 L-19,-138 L-15,-124 L-11,-138 Z" fill="#6e4c16"/>`
      + `<line x1="5" y1="-118" x2="5" y2="150" stroke="#2a241d" stroke-width="5" stroke-linecap="round"/><line x1="-4" y1="-104" x2="14" y2="-104" stroke="#6e4c16" stroke-width="3" stroke-linecap="round"/><circle cx="5" cy="151" r="4" fill="#6e4c16"/>`
      + `<line x1="23" y1="-128" x2="23" y2="148" stroke="#3a2d1c" stroke-width="4" stroke-linecap="round"/><circle cx="23" cy="-137" r="7" fill="none" stroke="#6e4c16" stroke-width="2.5"/></g>`;
    let motes = ''; for (let i = 0; i < 10; i++) { const mx = 120 + ((i * 83) % 760), my = 120 + ((i * 149) % 520); motes += `<circle cx="${mx}" cy="${my}" r="${1.6 + (i % 3) * 0.6}" fill="#ffcf8a" opacity="${(0.3 + (i % 4) * 0.12).toFixed(2)}" class="${i % 2 ? 'twk' : ''}"/>`; }
    g += motes;
  } else if (path === 'earth') {
    ([[140, '山'], [860, '地']] as Array<[number, string]>).forEach(([sx, ch]) => { g += `<g transform="translate(${sx},400)" opacity=".7"><path d="M-30,150 L-30,-120 Q-30,-150 0,-156 Q30,-150 30,-120 L30,150 Z" fill="url(#steleG)" stroke="rgba(90,72,40,.55)" stroke-width="1.4"/><line x1="-30" y1="120" x2="30" y2="120" stroke="rgba(90,72,40,.4)" stroke-width="1"/><text x="0" y="-40" text-anchor="middle" font-family="var(--kai)" font-size="34" font-weight="700" fill="rgba(60,46,26,.5)">${ch}</text></g>`; });
    g += `<rect x="360" y="694" width="280" height="14" rx="2" fill="rgba(140,116,72,.4)"/><rect x="392" y="708" width="216" height="12" rx="2" fill="rgba(120,98,60,.36)"/>`;
  } else {
    g += `<g transform="translate(820,150)"><circle r="58" fill="url(#moonG)" opacity=".9"/><circle cx="22" cy="-14" r="58" fill="url(#auraHeaven)"/><circle cx="20" cy="-12" r="54" fill="#2c343b" opacity=".62"/></g>`;
    const star = (x: number, y: number, r: number) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#eaf3ff" opacity=".9"/>`;
    const cn: Array<[number, number]> = [[272, 232], [232, 350], [260, 470], [326, 560]]; let lines = '';
    for (let i = 0; i < cn.length - 1; i++) lines += `<line x1="${cn[i][0]}" y1="${cn[i][1]}" x2="${cn[i + 1][0]}" y2="${cn[i + 1][1]}" stroke="rgba(180,210,235,.45)" stroke-width="1"/>`;
    lines += `<line x1="${cn[0][0]}" y1="${cn[0][1]}" x2="762" y2="168" stroke="rgba(180,210,235,.30)" stroke-width="1" stroke-dasharray="3 6"/>`;
    g += lines + cn.map((p) => star(p[0], p[1], 2.2)).join('') + star(762, 168, 2.6);
  }
  return g;
}

// ── ELEMENT-LEAN COMPASS ──────────────────────────────────────────────────────────────────────────
export function compassSVG(lean: GearElementLeanSurface | null | undefined): string {
  const S = 86, C = S / 2;
  if (!lean || !lean.entries || !lean.entries.length) return `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}"><circle cx="${C}" cy="${C}" r="${C - 8}" fill="none" stroke="var(--ink-25)" stroke-width="1.2" stroke-dasharray="2 4"/><text x="${C}" y="${C + 4}" text-anchor="middle" font-family="var(--kai)" font-size="14" fill="var(--ink-45)">無</text></svg>`;
  const ents = lean.entries.slice().sort((a, b) => b.weight - a.weight), n = Math.max(ents.length, 1);
  let petals = '';
  ents.forEach((e, i) => {
    const a = ((-90 + (i * 360) / n) * Math.PI) / 180, wt = Math.max(0.22, e.weight), len = (C - 13) * wt + 9;
    const px = C + Math.cos(a) * len, py = C + Math.sin(a) * len;
    const a1 = a - 0.42, a2 = a + 0.42, bx1 = C + Math.cos(a1) * 9, by1 = C + Math.sin(a1) * 9, bx2 = C + Math.cos(a2) * 9, by2 = C + Math.sin(a2) * 9;
    const gx = C + Math.cos(a) * (len + 1), gy = C + Math.sin(a) * (len + 1);
    petals += `<path d="M${bx1.toFixed(1)},${by1.toFixed(1)} Q${px.toFixed(1)},${py.toFixed(1)} ${bx2.toFixed(1)},${by2.toFixed(1)} Q${C},${C} ${bx1.toFixed(1)},${by1.toFixed(1)} Z" fill="${e.sceneColorToken}" opacity="${(0.32 + 0.5 * wt).toFixed(2)}" stroke="${e.sceneColorToken}" stroke-width=".8"/>`;
    petals += `<text x="${gx.toFixed(1)}" y="${(gy + 4).toFixed(1)}" text-anchor="middle" font-family="var(--kai)" font-size="11" font-weight="700" fill="${e.sceneColorToken}">${elGlyph(e.element)}</text>`;
  });
  let ticks = ''; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, r0 = C - 7, r1 = i % 2 === 0 ? C - 12 : C - 10; ticks += `<line x1="${(C + Math.cos(a) * r0).toFixed(1)}" y1="${(C + Math.sin(a) * r0).toFixed(1)}" x2="${(C + Math.cos(a) * r1).toFixed(1)}" y2="${(C + Math.sin(a) * r1).toFixed(1)}" stroke="rgba(120,90,46,.4)" stroke-width="${i % 2 === 0 ? 1 : 0.7}"/>`; }
  ticks += `<path d="M${C},2.5 l3,5 l-6,0 z" fill="var(--cinn-deep)"/>`;
  return `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}"><circle cx="${C}" cy="${C}" r="${C - 6}" fill="rgba(255,250,235,.35)" stroke="rgba(120,90,46,.3)" stroke-width="1"/><circle cx="${C}" cy="${C}" r="${C - 12}" fill="none" stroke="rgba(120,90,46,.18)" stroke-width=".7"/>${ticks}${petals}<circle cx="${C}" cy="${C}" r="4.5" fill="url(#goldRad)" stroke="#6e4c16" stroke-width=".8"/></svg>`;
}

// ── BOND LADDER (Martial weapon Soul-Tether qi-gauge) ─────────────────────────────────────────────
export function bondLadderSVG(bond: WeaponBondSurface | null, x: number, y: number): string {
  if (!bond) return '';
  const max = bond.max || 7, lvl = bond.level || 0, H = 250, top = y + 6, xc = x + 24;
  const padTop = 24, padBot = 22, innerH = H - padTop - padBot, step = innerH / (max - 1);
  const nodeY = (i: number) => top + padTop + (max - 1 - i) * step;
  const curY = nodeY(Math.max(0, lvl - 1)), fillBot = top + H - 12;
  const lat = bond.latentAffixes || [], arts = bond.weaponArts || [], reward: Record<number, { type: 'latent' | 'art'; on: boolean }> = {};
  [2, 3, 4].slice(0, lat.length).forEach((L) => { reward[L] = { type: 'latent', on: L <= lvl }; });
  [max, max - 2].slice(0, arts.length).sort((a, b) => a - b).forEach((L) => { reward[L] = { type: 'art', on: L <= lvl }; });
  let g = `<g>`;
  g += `<line x1="${xc}" y1="${top - 2}" x2="${xc}" y2="${top + H + 2}" stroke="rgba(120,90,46,.22)" stroke-width="2"/>`;
  g += `<rect x="${xc - 9}" y="${top + 12}" width="18" height="${H - 24}" rx="9" fill="rgba(120,90,46,.10)" stroke="rgba(120,90,46,.32)" stroke-width="1"/>`;
  g += `<rect x="${xc - 7}" y="${curY}" width="14" height="${(fillBot - curY).toFixed(1)}" rx="7" fill="url(#bondFill)"/>`;
  g += `<ellipse cx="${xc}" cy="${curY}" rx="10" ry="5.5" fill="#ffe6a8" opacity=".85" class="weakP" style="transform-origin:${xc}px ${curY}px"/>`;
  for (let m = 1; m <= 3; m++) { const my = fillBot - m * ((fillBot - curY) / 4 || 1); if (my > curY + 2) g += `<circle cx="${xc + (m % 2 ? 2 : -2)}" cy="${my.toFixed(0)}" r="1.4" fill="#fff0c8" opacity=".7" class="twk"/>`; }
  g += `<g transform="translate(${xc},${top - 3})"><circle r="13" fill="url(#brass)" stroke="#3a280d" stroke-width="1"/><circle r="10" fill="none" stroke="rgba(255,250,235,.35)" stroke-width=".7"/><text y="4.6" text-anchor="middle" font-family="var(--kai)" font-size="13" font-weight="700" fill="#2a1d08">器</text></g>`;
  for (let i = 0; i < max; i++) {
    const lv = i + 1, ny = nodeY(i), reached = lv <= lvl, isCur = lv === lvl;
    const nf = isCur ? 'url(#goldRad)' : reached ? 'url(#brassH)' : 'rgba(243,234,215,.6)', ns = reached ? '#6e4c16' : 'var(--ink-25)';
    g += `<circle cx="${xc}" cy="${ny.toFixed(1)}" r="${isCur ? 9.5 : 6.5}" fill="${nf}" stroke="${ns}" stroke-width="${isCur ? 1.7 : 1}"${isCur ? ' class="weakP" style="transform-origin:' + xc + 'px ' + ny.toFixed(1) + 'px"' : ''}/>`;
    g += `<text x="${xc}" y="${(ny + (isCur ? 3.5 : 3)).toFixed(1)}" text-anchor="middle" font-family="var(--serif)" font-size="${isCur ? 10 : 8}" font-weight="800" fill="${reached ? '#2a1d08' : 'var(--ink-45)'}">${lv}</text>`;
    const rw = reward[lv];
    if (rw) {
      const rx = xc + 25;
      g += `<line x1="${xc + 9}" y1="${ny.toFixed(1)}" x2="${rx - 8}" y2="${ny.toFixed(1)}" stroke="${rw.on ? '#6e4c16' : 'var(--ink-25)'}" stroke-width="1"${rw.on ? '' : ' stroke-dasharray="2 2"'}/>`;
      if (rw.type === 'latent') g += `<path d="M${rx},${(ny - 7).toFixed(1)} L${rx + 6.5},${ny.toFixed(1)} L${rx},${(ny + 7).toFixed(1)} L${rx - 6.5},${ny.toFixed(1)} Z" fill="${rw.on ? 'url(#jadeRad)' : 'rgba(120,90,46,.14)'}" stroke="${rw.on ? '#1c3128' : 'var(--ink-25)'}" stroke-width="1"${rw.on ? ' filter="url(#glowJ)"' : ''}/>`;
      else g += `<circle cx="${rx}" cy="${ny.toFixed(1)}" r="8.5" fill="${rw.on ? 'url(#cinnDisc)' : 'rgba(120,90,46,.14)'}" stroke="${rw.on ? '#54190f' : 'var(--ink-25)'}" stroke-width="1"/><text x="${rx}" y="${(ny + 3.2).toFixed(1)}" text-anchor="middle" font-family="var(--kai)" font-size="9" font-weight="700" fill="${rw.on ? '#f4dccb' : 'var(--ink-45)'}">技</text>`;
    }
  }
  g += `<text x="${xc + 25}" y="${top + 2}" text-anchor="middle" font-family="var(--kai)" font-size="9" font-weight="700" fill="var(--ink-45)">赐</text>`;
  g += `<g transform="translate(${xc},${top + H + 3})"><circle r="13" fill="url(#cinnDisc)" stroke="#54190f" stroke-width="1"/><text y="4.6" text-anchor="middle" font-family="var(--kai)" font-size="13" font-weight="700" fill="#f4dccb">魂</text></g>`;
  g += `<text x="${xc}" y="${top + H + 30}" text-anchor="middle" font-family="var(--serif)" font-size="8.5" font-weight="800" letter-spacing="1.3" fill="var(--cinn-deep)">BOND ${lvl} / ${max}</text>`;
  return g + `</g>`;
}

// ── ribbon medallions ─────────────────────────────────────────────────────────────────────────────
export function pathEmblemSVG(path: PanoplyPathLean): string {
  const glyph = ({ martial: '武', earth: '地', heaven: '天' } as const)[path] || '武';
  return `<svg width="46" height="46" viewBox="0 0 46 46"><circle cx="23" cy="23" r="21" fill="url(#inkDisc)" stroke="var(--gold-deep)" stroke-width="1.5"/><circle cx="23" cy="23" r="21" fill="var(--accent)" opacity=".24"/><circle cx="23" cy="23" r="16.5" fill="none" stroke="rgba(255,250,235,.38)" stroke-width=".8"/><text x="23" y="29.5" text-anchor="middle" font-family="var(--kai)" font-size="21" font-weight="700" fill="var(--ink)">${glyph}</text></svg>`;
}
export function powerSealSVG(power: number): string {
  const val = power > 0 ? power.toLocaleString() : '—';
  return `<svg width="58" height="58" viewBox="0 0 58 58" class="breatheA" style="transform-origin:29px 29px"><circle cx="29" cy="29" r="26" fill="url(#cinnDisc)" stroke="#54190f" stroke-width="1.6"/><circle cx="29" cy="29" r="21.5" fill="none" stroke="rgba(243,234,215,.42)" stroke-width=".9" stroke-dasharray="2 3"/><text x="29" y="24" text-anchor="middle" font-family="var(--kai)" font-size="11" font-weight="700" fill="#f4dccb">战力</text><text x="29" y="40" text-anchor="middle" font-family="var(--serif)" font-size="${val.length > 4 ? 13 : 15}" font-weight="800" fill="#fff">${val}</text></svg>`;
}
export function ringSealSVG(total: number): string {
  return `<svg width="58" height="58" viewBox="0 0 58 58"><circle cx="29" cy="29" r="24" fill="none" stroke="url(#goldG)" stroke-width="6"/><circle cx="29" cy="29" r="24" fill="none" stroke="var(--jade-deep)" stroke-width="1.6" opacity=".45"/><circle cx="29" cy="29" r="20.5" fill="rgba(243,234,215,.5)"/><circle cx="45" cy="17" r="5" fill="url(#jadeRad)" stroke="#1c3128" stroke-width="1"/><text x="29" y="27" text-anchor="middle" font-family="var(--serif)" font-size="16" font-weight="800" fill="var(--ink)">${total}</text><text x="29" y="39" text-anchor="middle" font-family="var(--serif)" font-size="7" font-weight="700" letter-spacing="1.5" fill="var(--ink-45)">HELD</text></svg>`;
}

// ── vault slip emblem ─────────────────────────────────────────────────────────────────────────────
export function slipEmblemSVG(s: VaultSlipSurface): string {
  const SZ = 70, ec = s.element ? s.element.sceneColorToken : '#6a5a40', g = s.rarityFrameGrade;
  let o = `<svg width="84" height="84" viewBox="0 0 84 84"><g transform="translate(7,7)">`;
  if (g === 'heaven' || g === 'immortal') o += `<circle cx="${SZ / 2}" cy="${SZ / 2}" r="${SZ * 0.62}" fill="${gradeVar(g)}" opacity="${g === 'immortal' ? 0.2 : 0.15}" filter="url(#soft6)"/>`;
  o += `<rect x="4" y="4" width="${SZ - 8}" height="${SZ - 8}" rx="5" fill="${ec}" opacity=".1"/><rect x="4" y="4" width="${SZ - 8}" height="${SZ - 8}" rx="5" fill="rgba(255,250,236,.4)"/>`;
  o += `<g transform="translate(${SZ / 2},${SZ / 2 - 3}) scale(1.5)">${kindGlyphSVG(s.slot, ec)}</g>`;
  o += frameSVG(g, 0, 0, SZ, SZ, false);
  o += tierSealSVG(SZ - 4, 4, s.tierMark.replace('T', ''), false);
  if (s.element) o += `<g transform="translate(5,${SZ - 5})"><circle r="7" fill="${ec}"/><text y="2.8" text-anchor="middle" font-family="var(--kai)" font-size="8" font-weight="700" fill="#fff">${elGlyph(s.element.id)}</text></g>`;
  let pips = ''; for (let i = 0; i < Math.min(s.affixCount, 5); i++) pips += `<circle cx="${SZ / 2 - (Math.min(s.affixCount, 5) - 1) * 4 + i * 8}" cy="${SZ - 4}" r="2" fill="var(--gold-deep)"/>`;
  o += pips + `</g></svg>`; return o;
}

// ── the whole figure scene (root SVG; injected by PanoplyFigureScene) ──────────────────────────────
export function figureSceneSVG(P: PanoplyExactSurfaceV1, focusId: string | null): string {
  const path = P.pathLean;
  let inner = sceneBackdrop(path);
  inner += sceneFurniture(path);
  const aura = ({ martial: 'url(#qiAura)', earth: 'url(#auraEarth)', heaven: 'url(#auraHeaven)' } as const)[path];
  inner += `<ellipse cx="500" cy="360" rx="240" ry="300" fill="${aura}"/>`;
  inner += figBodySVG(path);
  const bySlot: { accessory?: PanoplySlotSurface[]; [k: string]: PanoplySlotSurface | PanoplySlotSurface[] | undefined } = {};
  (P.slots || []).forEach((s) => { if (s.slot === 'accessory') { (bySlot.accessory = bySlot.accessory || []).push(s); } else bySlot[s.slot] = s; });
  (['head', 'chest', 'legs', 'weapon'] as const).forEach((k) => {
    const s = (bySlot[k] as PanoplySlotSurface | undefined) || { slot: k, filled: false, mountLabel: k + ' mount' };
    const [x, y] = ANCHORS[k];
    inner += slotObjectSVG(s, x, y, emphasisForSlot(path, k), focusId);
  });
  const accs = bySlot.accessory || [{ slot: 'accessory', filled: false, mountLabel: 'Accessory mount' }];
  const arc = ANCHORS.accessory; const accN = Math.max(accs.length, 1);
  for (let i = 0; i < Math.min(accN, arc.length); i++) {
    const s = accs[i] || { slot: 'accessory' as const, filled: false, mountLabel: 'Accessory mount' };
    inner += slotObjectSVG(s, arc[i][0], arc[i][1], emphasisForSlot(path, 'accessory'), focusId);
  }
  if (path === 'heaven') { inner = `<circle cx="430" cy="400" r="220" fill="none" stroke="rgba(180,210,235,.25)" stroke-width="1" stroke-dasharray="2 7" class="spinG" style="transform-box:fill-box;transform-origin:430px 400px"/>` + inner; }
  if (P.bond) inner += bondLadderSVG(P.bond, 828, 150);
  return `<svg class="scene" viewBox="0 0 1000 760" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;
}

/** deterministic weather motes (the artifact's paintMotes RNG → index-derived; frozen under reduced-motion). */
export function motesFor(path: PanoplyPathLean): Array<{ left: string; bottom: string; delay: string; duration: string; heaven: boolean }> {
  const n = path === 'martial' ? 14 : path === 'heaven' ? 10 : 0;
  const out: Array<{ left: string; bottom: string; delay: string; duration: string; heaven: boolean }> = [];
  for (let i = 0; i < n; i++) {
    out.push({
      left: (18 + ((i * 37) % 64)) + '%',
      bottom: (8 + ((i * 23) % 30)) + '%',
      delay: ((i * 0.61) % 6).toFixed(2) + 's',
      duration: (5 + (i % 3)).toFixed(2) + 's',
      heaven: path === 'heaven',
    });
  }
  return out;
}
