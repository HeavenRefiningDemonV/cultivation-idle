/**
 * M.IV.3 ARTS-PORT — the Fortune Draw HTML builders, ported from the artifact (fortune-draw.html §render),
 * RE-BOUND from `FortuneDrawSurfaceV1` (every value traces to a surface field). Interactive elements carry
 * `data-stock` (select an offer) / `data-action` (draw · reroll · buy · altar) for the single delegated click
 * handler. Element glyphs read the surface's `sceneColorToken`. Render-only; no store, no recompute.
 */

import {
  RAMP, RAMP_DEEP, STAR4, STAR5, censer, couplet, currencyGlyph, fateSpindle, goldSeal, kindGlyph,
  lecternLantern, lecternScene, motesHTML, priceTag, waxSeal,
} from './fortuneDrawSceneSvg.js';
import type {
  FortuneDrawSurfaceV1, FortuneElementEdge, FortuneOfferSurface,
} from '../../../systems/ui/fortune/fortuneDrawTypes.js';
import type { ItemDetailSurfaceV1 } from '../../../systems/ui/modals/itemDetailTypes.js';

const RARITY_FRAME: Record<string, string> = { common: 'mortal', uncommon: 'spirit', rare: 'earth', epic: 'heaven', legendary: 'immortal' };
const ELEM_CJK: Record<string, string> = { water: '水', fire: '火', wood: '木', earth: '土', metal: '金', wind: '風', lightning: '雷', ice: '冰', light: '光', shadow: '影', soul: '魂', void: '虛', time: '時', astral: '星' };
const KIND_LABEL: Record<string, string> = { active: 'Active', passive: 'Passive', ultimate: 'Ultimate' };
const GRADE_ROMAN: Record<string, string> = { mortal: 'Mortal', earth: 'Earth', heaven: 'Heaven', mystic: 'Mystic' };

function elemGlyph(edge: FortuneElementEdge | null | undefined): string {
  if (!edge) return '';
  return `<span class="elem-glyph" title="${edge.label}" style="background:var(${edge.sceneColorToken})">${ELEM_CJK[edge.id] ?? ''}</span>`;
}

export function panel(extra: string, inner: string): string {
  return `<div class="panel" style="${extra || ''}"><div class="grain"><svg width="100%" height="100%" preserveAspectRatio="none"><rect width="100%" height="100%" filter="url(#grainF)"/></svg></div><div class="gframe"></div><div class="gframe2"></div><i class="gc tl"></i><i class="gc tr"></i><i class="gc bl"></i><i class="gc br"></i>${inner}</div>`;
}

// ── HEADER (lintel) ──────────────────────────────────────────────────────
function renderPurse(S: FortuneDrawSurfaceV1): string {
  const meta: Record<string, string> = { fortune: 'Fortune', gold: 'Gold', stones: 'Spirit Stones', merit: 'Merit' };
  return `<div class="purse">${(S.purse || []).map((c) => `
    <div class="pc${c.id === 'fortune' ? ' lead' : ''}">
      <span class="cg">${currencyGlyph(c.id, c.id === 'fortune' ? 21 : 18)}</span>
      <span class="pcol"><span class="pv">${c.amount}</span><span class="plb">${meta[c.id] || c.id}</span></span>
    </div>`).join('')}</div>`;
}

export function renderHeader(S: FortuneDrawSurfaceV1): string {
  const [day, city] = S.dateLabel.split('·').map((x) => x.trim());
  return panel('', `
   <div class="lintel-roller l"></div><div class="lintel-roller r"></div>
   <div class="banner" style="top:-1px">法緣 · AN AUDIENCE WITH FATE</div>
   <div class="lintel" style="height:100%">
    <div>
      <div class="ltitle">Fortune Draw<span class="lkai">法緣</span></div>
      <div class="lsub">${S.pavilionName} · sealed scrolls of the day</div>
    </div>
    <div></div>
    <div class="datechop">
      <span class="dot">緣</span>
      <div><i>Today</i><b>${day || S.dateLabel}</b></div>
      <div style="width:1px;height:26px;background:rgba(120,90,46,.3)"></div>
      <div><i>City</i><b>${city || '—'}</b></div>
    </div>
    ${renderPurse(S)}
   </div>`);
}

// ── LEFT: FATE-THREAD SPINDLE ────────────────────────────────────────────
export function renderFate(S: FortuneDrawSurfaceV1): string {
  const f = S.fateThread, anyGuar = f.epic.guaranteed || f.legendary.guaranteed;
  const trackHtml = (t: typeof f.epic, glyph: string) => {
    const grade = t.tier === 'epic' ? 'heaven' : 'immortal', col = RAMP[grade];
    return `<div class="fate-track ${t.guaranteed ? 'taut' : ''}">
     <div class="ft-top">
       <span class="ft-name"><span class="elem-glyph" style="background:${col};font-size:9px;width:16px;height:16px">${glyph}</span>${t.label}</span>
       ${t.guaranteed ? `<span class="ft-guar">GUARANTEED ${STAR4}</span>` : `<span class="ft-count">${t.current}<span style="color:var(--ink-45);font-weight:600">/${t.threshold}</span></span>`}
     </div>
     <div class="ft-bar"><div class="ft-fill" style="width:${(t.ratio * 100).toFixed(1)}%;background:linear-gradient(90deg,${RAMP_DEEP[grade]},${col})">${t.guaranteed ? '<span class="ft-fill shimmer"></span>' : ''}</div></div>
     <div class="ft-note">${t.guaranteed ? 'Next featured scroll is force-upgraded.' : `${t.threshold - t.current} featured draw${t.threshold - t.current === 1 ? '' : 's'} to a guaranteed ${t.tier === 'epic' ? 'Epic' : 'Legendary'}.`}</div>
   </div>`;
  };
  const inner = `
   <div class="banner" style="top:-1px">FATE-THREAD SPINDLE</div>
   <div class="gcol" style="left:7px">命綫</div>
   <div class="fatewrap">
     <div class="fatehead">
       <div class="fh-title">${anyGuar ? 'The thread draws taut' : 'The thread is winding'}</div>
       <div class="fh-sub">${f.headline}</div>
     </div>
     <div class="spindlebox">${fateSpindle(f)}</div>
     <div class="fate-legend">
       ${trackHtml(f.epic, '极')}
       ${trackHtml(f.legendary, '仙')}
     </div>
     <div class="sub" style="text-align:center;font-size:8px;margin-top:8px;letter-spacing:.1em">NEVER-REGRESS · THE THREAD ONLY CLIMBS</div>
   </div>`;
  return panel('position:relative;overflow:hidden', inner);
}

// ── CENTER: LECTERN ──────────────────────────────────────────────────────
function detailStockId(S: FortuneDrawSurfaceV1): number {
  if (!S.selectedDetail || !S.selectedDetail.identity) return -1;
  const nm = S.selectedDetail.identity.name;
  const o = S.offers.find((x) => x.name === nm);
  return o ? o.stockId : -1;
}

function scrollCard(o: FortuneOfferSurface, S: FortuneDrawSurfaceV1): string {
  const frame = o.rarityFrameGrade;
  const isRevealTarget = !!S.reveal && S.reveal.stockId === o.stockId;
  const claimed = !o.sealed || isRevealTarget;
  const dimmed = o.sold && !isRevealTarget;
  const sel = !!S.selectedDetail && detailStockId(S) === o.stockId;
  const cls = ['scroll'];
  if (o.isFeatured) cls.push('featured');
  if (dimmed) cls.push('dimmed');
  if (sel) cls.push('sel');
  const rarityGlyph: Record<string, string> = { common: '凡', uncommon: '良', rare: '珍', epic: '极', legendary: '仙' };
  const rg = rarityGlyph[o.rarity];
  const bodyH = o.isFeatured ? 238 : 198;
  const sealW = o.isFeatured ? 42 : 35;
  const sealNode = claimed
    ? `<div class="rseal" style="${isRevealTarget ? 'animation:sealDropK .7s ease-out .55s both' : ''}">${(o.rarity === 'epic' || o.rarity === 'legendary') ? goldSeal(rg, sealW, -5) : waxSeal(rg, sealW, -5, o.rarity === 'uncommon')}</div>`
    : `<div class="waxon">${waxSeal('封', sealW, -6)}</div>`;
  const wisp = o.element ? `<div class="elem-wisp">${elemGlyph(o.element)}</div>` : '';
  // CJK names char-stack (the artifact idiom); English names read top-to-bottom (upright), never per-letter-stacked.
  const isCjk = !!o.nameCjk;
  const vnameInner = isCjk
    ? [...(o.nameCjk as string)].map((c) => `<span>${c}</span>`).join('')
    : `<span style="writing-mode:vertical-rl;text-orientation:upright;letter-spacing:1.5px;white-space:nowrap">${o.name}</span>`;
  const vnameSize = isCjk ? (o.isFeatured ? 25 : 22) : (o.isFeatured ? 19 : 16);
  const face = `<div class="scrollbody ${claimed ? 'f-' + frame : 'sealedbody'}" style="height:${bodyH}px${isRevealTarget ? ';animation:unfurlK .9s ease-out both' : ''}">
      <div class="paperface"></div>
      <div class="rollcap t"></div><div class="rollcap b"></div>
      <div style="position:absolute;inset:66px 0 34px;display:flex;align-items:center;justify-content:center">
        <span class="vname" style="font-size:${vnameSize}px;color:${claimed ? RAMP_DEEP[frame] : '#4a4138'}">${vnameInner}</span>
      </div>
      ${sealNode}
      <div class="rhint rib-${frame}">${o.rarityLabel}</div>
    </div>`;
  const placard = `<div class="placard">
     <div class="pl-name">${o.name}</div>
     <div class="pl-row">${kindGlyph(o.kind)}<span class="pl-kind">${KIND_LABEL[o.kind] ?? o.kindLabel}</span></div>
     ${priceTag(o.priceText, dimmed)}
   </div>`;
  const pennant = o.isFeatured ? `<div class="featpennant">${STAR5} FEATURED ${STAR5}</div>` : '';
  return `<div class="${cls.join(' ')}" data-stock="${o.stockId}">${pennant}${wisp}${face}${placard}</div>`;
}

function renderCmdBar(S: FortuneDrawSurfaceV1): string {
  const r = S.reroll;
  const liveOffers = S.offers.filter((o) => !o.sold).length;
  const drawDisabled = S.visualState === 'empty' || S.visualState === 'unknown' || liveOffers === 0;
  const drawLabel = S.visualState === 'revealing' ? 'Unfurling…' : S.visualState.startsWith('postDraw') ? 'Draw Again' : 'Draw a Scroll';
  const taut = S.fateThread.legendary.guaranteed || S.fateThread.epic.guaranteed;
  const drawWord = S.fateThread.legendary.guaranteed ? '仙' : S.fateThread.epic.guaranteed ? '极' : '抽';
  let rerollInner: string;
  if (r.spent) {
    rerollInner = `<div class="reroll-cell spent">
      <div style="display:flex;align-items:center;gap:8px"><span style="filter:drop-shadow(0 1px 2px rgba(20,60,40,.3))">${waxSeal('續', 30, 2, true)}</span>
      <div class="rr-note"><b style="color:var(--jade-deep)">Offers renewed.</b> ${r.note}${r.nextRefreshLabel ? ` · <span style="color:var(--ink-45)">${r.nextRefreshLabel}</span>` : ''}</div></div>
    </div>`;
  } else if (r.available) {
    rerollInner = `<div class="reroll-cell">
      <div class="rr-note">${r.note}${r.nextRefreshLabel ? `<br><span style="color:var(--ink-45);font-size:8.5px">${r.nextRefreshLabel}</span>` : ''}</div>
      <div style="text-align:right"><div class="rr-cost">${r.costText}</div><div class="btn cinn" data-action="fortune.reroll" style="margin-top:4px;padding:5px 14px;font-size:10.5px">↻ Reroll Offers</div></div>
    </div>`;
  } else {
    rerollInner = `<div class="reroll-cell">
      <div class="rr-note">A reroll renews the offers — your fate-thread never regresses.<br><span style="color:var(--ink-45);font-size:8.5px">Reroll cost set by the pavilion · ${r.costText}</span></div>
      <div class="btn ghost" disabled style="padding:5px 14px;font-size:10.5px">↻ Reroll</div>
    </div>`;
  }
  return `<div class="lectern-cmd">
    <div class="draw-pull">
      <button type="button" class="btn jade lg" data-action="fortune.draw" ${drawDisabled ? 'disabled' : ''} style="display:flex;align-items:center;gap:10px">
        <span style="width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-family:var(--kai);font-size:14px;background:${taut ? 'radial-gradient(circle at 38% 30%,#f3e3b0,#c08f3a 65%,#6e4c16)' : 'rgba(255,250,235,.2)'};color:${taut ? '#2a1d08' : '#e9efe2'};border:1px solid rgba(231,205,146,.5)">${drawWord}</span>
        <span>${drawLabel}</span>
      </button>
      ${taut ? `<div style="text-align:center;font:800 8px var(--serif);color:var(--gold-deep);margin-top:4px;letter-spacing:.04em">NEXT FEATURED ⟶ GUARANTEED ${S.fateThread.legendary.guaranteed ? '仙' : '极'}</div>` : ''}
    </div>
    ${rerollInner}
  </div>`;
}

export function renderLectern(S: FortuneDrawSurfaceV1): string {
  const scene = `${lecternScene()}<div class="lectern-pool"></div>${couplet('l', '紫氣東來')}${couplet('r', '福緣善慶')}${lecternLantern()}`;
  const liveOffers = S.offers.filter((o) => !o.sold).length;
  const anyApex = S.fateThread.epic.guaranteed || S.fateThread.legendary.guaranteed;
  const moteHost = `<div class="moteHost">${motesHTML(anyApex ? 14 : 8, anyApex ? ['#d9b35e', '#c47b22'] : ['#caa84e'])}</div>`;
  if (S.visualState === 'empty' || S.visualState === 'unknown' || (liveOffers === 0 && !S.reveal)) {
    const legend = S.emptyLegend || (S.visualState === 'unknown' ? 'No offers are configured for this cycle.' : 'The lectern is bare — fate renews with the next cycle.');
    const inner = `<div class="banner" style="top:-1px">THE LECTERN · 講案</div>
     <div class="lecternwrap"><div class="lectern-stage">
       ${scene}${moteHost}
       <div class="cradle"><div class="desk-top"><div class="slot-inlay"></div></div><div class="desk-front"><div class="desk-label"><div class="dl-rule"></div><div class="dl-txt">${waxSeal('法', 19, -3)}<span>今 日 所 陳</span>${waxSeal('緣', 19, 3)}</div><div class="dl-sub">Offerings of the Day</div><div class="dl-rule"></div></div></div></div>
       <div class="censer l">${censer()}</div><div class="censer r">${censer()}</div>
       <div class="empty-lectern">
         <div style="opacity:.55;margin-bottom:8px">${goldSeal('待續', 60, -4)}</div>
         <div class="el-title">${S.visualState === 'unknown' ? 'No Fated Scrolls' : 'The Lectern Rests'}</div>
         <div class="el-sub">${legend}</div>
       </div>
     </div>
     ${renderCmdBar(S)}
     </div>`;
    return panel('position:relative', inner);
  }
  const scrolls = S.offers.map((o) => scrollCard(o, S)).join('');
  const inner = `<div class="banner" style="top:-1px">THE LECTERN · 講案</div>
   <div class="lecternwrap">
     <div class="lectern-stage">
       ${scene}${moteHost}
       <div class="cradle">
         <div class="desk-top"><div class="slot-inlay"></div></div>
         <div class="desk-front">
           <div class="desk-label">
             <div class="dl-rule"></div>
             <div class="dl-txt">${waxSeal('法', 19, -3)}<span>今 日 所 陳</span>${waxSeal('緣', 19, 3)}</div>
             <div class="dl-sub">Offerings of the Day</div>
             <div class="dl-rule"></div>
           </div>
         </div>
       </div>
       <div class="censer l">${censer()}</div><div class="censer r">${censer()}</div>
       <div class="scrolls">${scrolls}</div>
     </div>
     ${renderCmdBar(S)}
   </div>`;
  return panel('position:relative', inner);
}

// ── RIGHT: INSPECTOR SCROLL ──────────────────────────────────────────────
export function renderInspector(S: FortuneDrawSurfaceV1): string {
  const d: ItemDetailSurfaceV1 | null = S.selectedDetail;
  if (!d || !d.identity) {
    return panel('', `<div class="banner" style="top:-1px">SCROLL INSPECTOR · 觀</div>
     <div class="inspect"><div class="inspect-paper"><div class="insp-empty">
       <div class="ie-kai">擇</div>
       <div class="ie-t">Choose a Scroll</div>
       <div class="ie-s">Tap any scroll on the lectern to read its art — sub-stats, casting, and what it scales off.</div>
     </div></div></div>`);
  }
  const id = d.identity, frame = RARITY_FRAME[id.rarity] ?? 'mortal', fc = RAMP[frame], fcd = RAMP_DEEP[frame];
  const affixHtml = (d.affixes || []).map((a) => {
    const hasRoll = typeof a.rollPosition === 'number';
    const q = a.quality || 'mid';
    const pos = hasRoll ? (a.rollPosition! * 100).toFixed(0) : '0';
    return `<div class="affix q-${q}">
     <div class="af-top">
       <div><span class="af-nm">${a.name}</span>${a.channel ? ` <span class="af-ch">· ${a.channel}</span>` : ''}</div>
       <span class="af-v">${a.value}</span>
     </div>
     ${hasRoll ? `<div class="af-bar"><div class="af-fill" style="width:${pos}%"></div><div style="position:absolute;top:50%;left:${pos}%;width:9px;height:9px;border-radius:50%;transform:translate(-50%,-50%);background:#fff;border:1.5px solid ${q === 'high' ? '#0f6f5a' : q === 'mid' ? '#a2712a' : '#8b3028'}"></div></div>
     <div class="af-range">rolled ${a.rolledRange} · landed ${pos}% of range</div>` : `<div class="af-range" style="color:var(--cinn-deep);font-weight:700">${a.kind === 'set' ? 'signature mechanic' : 'fixed effect'}</div>`}
   </div>`;
  }).join('');
  const elem = id.element ? `<span class="mchip" style="gap:4px">${elemGlyph(id.element as FortuneElementEdge)} ${id.element.label}</span>` : '';
  const seal = frame === 'immortal' || frame === 'heaven' ? goldSeal(id.rarityLabel.split(' ')[0], 46, -5) : waxSeal(id.rarityLabel.split(' ')[0], 44, -5, frame === 'spirit');
  const inner = `<div class="banner" style="top:-1px">SCROLL INSPECTOR · 觀</div>
   <div class="inspect"><div class="inspect-paper">
     <div class="insp-id">
       <span style="filter:drop-shadow(0 2px 4px rgba(60,40,16,.3));flex:0 0 auto">${seal}</span>
       <div style="flex:1;min-width:0">
         <div class="nm">${id.name}</div>
         <div class="kai">${id.nameCjk || ''}</div>
         <div class="meta">
           <span class="raritytab" style="background:linear-gradient(180deg,${fc},${fcd})"><i>Rarity</i><b>${id.rarityLabel}</b></span>
           ${id.realmTier ? `<span class="mchip">${id.realmTier}</span>` : ''}
           ${id.slot ? `<span class="mchip">${id.slot}</span>` : ''}
           ${id.lean ? `<span class="mchip">${id.lean} lean</span>` : ''}
           ${elem}
         </div>
         ${id.rarityBand ? `<div style="font:600 9px var(--serif);color:var(--ink-45);margin-top:5px">${id.rarityBand}</div>` : ''}
       </div>
     </div>
     ${affixHtml ? `<div class="sct">Sub-stats & effects</div>${affixHtml}` : ''}
     ${d.signature ? `<div class="insp-block" style="border-color:rgba(196,123,34,.5);background:rgba(196,123,34,.08)"><div class="ib-t" style="color:var(--rarity-immortal)">${STAR4} ${d.signature.name}</div><div class="ib-b">${d.signature.body}</div></div>` : ''}
     ${d.casting ? `<div class="sct">Casting</div><div style="font:600 10.5px var(--serif);color:var(--ink-70);line-height:1.5">${d.casting}</div>` : ''}
     ${d.scalesOff && d.scalesOff.length ? `<div class="sct">Scales off</div><div class="scales-row">${d.scalesOff.map((s) => `<span class="sc">${s}</span>`).join('')}</div>` : ''}
     ${d.reroll ? `<div class="rrpanel"><div class="rr-h"><span class="rr-title">↻ REROLL SUB-STATS</span><span class="rr-odds">${d.reroll.odds}</span></div><div style="font:700 10px var(--serif);color:var(--gold-deep);margin-top:3px">Cost: ${d.reroll.cost}</div><div class="rr-n">${d.reroll.note}</div></div>` : ''}
     ${d.lore ? `<div class="sct">Lore</div><div style="font:italic 600 10px var(--serif);color:var(--ink-45);line-height:1.5">“${d.lore}”</div>` : ''}
     ${d.provenance ? `<div style="font:600 9px var(--serif);color:var(--ink-45);margin-top:8px;letter-spacing:.04em">⌖ ${d.provenance}</div>` : ''}
     <div class="insp-actions">
       ${(d.actions || []).map((a) => `<button type="button" class="btn ${/satchel/i.test(a.verb) ? 'ghost' : 'jade'}" data-action="${a.route}" ${a.enabled === false ? 'disabled' : ''}>${a.verb}</button>`).join('')}
       <button type="button" class="btn" data-action="fortune.altar" style="background:linear-gradient(180deg,rgba(248,243,224,.8),rgba(220,200,160,.5))">Preview in Inner Altar</button>
     </div>
   </div></div>`;
  return panel('', inner);
}

// ── FOOTER: SATCHEL ──────────────────────────────────────────────────────
export function renderSatchel(S: FortuneDrawSurfaceV1): string {
  const sat = S.satchel;
  let tabs: string;
  if (!sat || sat.count === 0) {
    tabs = `<div class="satchel-empty">No manuals held — drawn scrolls rest here until you study them in the Inner Altar.</div>`;
  } else {
    tabs = sat.entries.map((e) => {
      const frame = e.rarityFrameGrade, fc = RAMP[frame];
      const sealGlyph: Record<string, string> = { common: '凡', uncommon: '良', rare: '珍', epic: '极', legendary: '仙' };
      return `<div class="mtab ${e.studying ? 'studying' : ''}">
       <span class="mt-seal" style="background:linear-gradient(180deg,${fc},${RAMP_DEEP[frame]})">${sealGlyph[e.rarity]}</span>
       <div><div class="mt-nm">${e.name}</div><div class="mt-g">${GRADE_ROMAN[e.gradeLabel.toLowerCase()] ?? e.gradeLabel} · ${e.rarityLabel}</div></div>
       ${e.studying ? '<span class="studybadge">STUDYING</span>' : ''}
     </div>`;
    }).join('');
  }
  return panel('', `
    <div class="satchelbar">
      <div class="satchel-id">
        <span class="sk">囊</span>
        <div><div class="st">Manual Satchel</div><div class="ss">${sat.count} held · study in the Inner Altar</div></div>
      </div>
      <div class="satchel-tabs">${tabs}</div>
      <button type="button" class="btn jade" data-action="fortune.altar" style="padding:7px 16px">Open Inner Altar ⤢</button>
    </div>`);
}
