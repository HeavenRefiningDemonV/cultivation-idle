/**
 * M.III.3 EQ-PORT — the HTML-instrument string builders, ported 1:1 from the artifact (class names +
 * structure verbatim). PURE over surface data. Inline `onclick="fn(id)"` is converted to `data-*` hooks
 * the React components delegate (selectSlip→data-slip-id, setVFilter→data-vfilter, the rail actions→
 * data-route). Field names bind to the LIVE contracts (e.g. ItemDetailAffix.rolledRange/rollPosition/quality,
 * not the artifact mock's range/pos/q). The components inject these via dangerouslySetInnerHTML + delegate.
 */
import type {
  GearTotalsSurface,
  PanoplyExactSurfaceV1,
  PanoplyPathLean,
  SetBonusBandSurface,
  VaultExactSurfaceV1,
  VaultSlipSurface,
} from '../../../systems/ui/equipment/equipmentExactTypes.js';
import type {
  ItemDetailAction,
  ItemDetailAffix,
  ItemDetailCompareRow,
  ItemDetailIdentity,
  ItemDetailRarity,
  ItemDetailSetBond,
  ItemDetailSurfaceV1,
} from '../../../systems/ui/modals/itemDetailTypes.js';
import {
  PATHMETA, RANK, RGLYPH, RGRADE, RLABEL, STATELABEL,
  compassSVG, elGlyph, gradeVar, KMARK, pathEmblemSVG, powerSealSVG, ringSealSVG, slipEmblemSVG, softVar,
} from './panoplyFigureSvg.js';

// ── GEAR TOTALS ───────────────────────────────────────────────────────────────────────────────────
export function gearTotalsHTML(t: GearTotalsSurface | null | undefined): string {
  if (!t || (!t.offense.length && !t.defense.length && !t.utility.length)) return '';
  const grp = (label: string, rows: GearTotalsSurface['offense']): string =>
    rows.length ? `<div class="tgrp"><div class="tl">${label}</div>${rows.map((r) => `<span class="trow ${r.tone === 'gain' ? 'gain' : r.tone === 'loss' ? 'loss' : 'neutral'}"><span>${r.label}</span><span class="tv">${r.addText}</span></span>`).join('')}</div>` : '';
  return `<div class="totals"><div class="sub" style="margin-bottom:6px;color:var(--gold-deep)">Gear Totals · what the treasures add</div>${grp('Offense', t.offense)}${grp('Defense', t.defense)}${grp('Utility', t.utility)}</div>`;
}

// ── SET-BOND link band ────────────────────────────────────────────────────────────────────────────
export function setLinkBandHTML(bonuses: SetBonusBandSurface[]): string {
  if (!bonuses || !bonuses.length) return '';
  const stoneSVG = (lit: boolean, active: boolean): string =>
    lit
      ? `<svg width="22" height="22" viewBox="0 0 22 22">${active ? '<circle cx="11" cy="11" r="7.5" fill="url(#jadeRad)" stroke="#1c3128" stroke-width="1.3" filter="url(#glowJ)"/><circle cx="9" cy="9" r="2" fill="rgba(233,239,226,.7)"/>' : '<circle cx="11" cy="11" r="7.5" fill="rgba(122,91,38,.18)" stroke="var(--bronze)" stroke-width="2"/>'}</svg>`
      : `<svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="7" fill="none" stroke="var(--ink-25)" stroke-width="1.5" stroke-dasharray="2 3"/></svg>`;
  return `<div class="setband">${bonuses.map((b) => {
    const active = !!b.activeTier; let stones = '';
    for (let i = 0; i < b.total; i++) {
      if (i > 0) stones += `<span class="lk ${i < b.held ? 'on' : ''}"></span>`;
      stones += `<span class="stone">${stoneSVG(i < b.held, active)}</span>`;
    }
    return `<div class="setrow ${active ? 'active' : ''}"><div class="setlead"><span class="sx">${b.name}</span><span class="sh ${active ? 'jade' : ''}">${b.held}/${b.total}</span></div><div class="stones">${stones}</div><div class="seteff">${b.activeTier ? ('<b>' + b.activeTier + '</b> · ' + b.effectText) : b.effectText}</div></div>`;
  }).join('')}</div>`;
}

// ── RIBBON ────────────────────────────────────────────────────────────────────────────────────────
export function censusStripHTML(byR: Partial<Record<ItemDetailRarity, number>>): string {
  return (Object.entries(byR) as Array<[ItemDetailRarity, number]>)
    .sort((a, b) => RANK[b[0]] - RANK[a[0]])
    .map(([r, n]) => `<span class="cpip"><span class="sw" style="background:${gradeVar(RGRADE[r])}"></span>${RGLYPH[r]} ${n}</span>`)
    .join('');
}
const identHTML = (pathLean: PanoplyPathLean, isVault: boolean): string => {
  const pm = PATHMETA[pathLean] || PATHMETA.martial;
  return `<div class="ident"><div class="pemblem">${pathEmblemSVG(pathLean)}</div>`
    + `<div class="idtext"><div class="ttl">${isVault ? 'Inventory' : 'Equipment'} <span class="cjk">${isVault ? '须弥戒' : '法宝阁'}</span></div>`
    + `<div class="psub">${pm[0]} ${pm[1]} · ${isVault ? 'all treasures held' : pm[2]}</div></div></div>`;
};
export function ribbonPanoplyHTML(P: PanoplyExactSurfaceV1): string {
  const stLabel = STATELABEL[P.visualState] || P.visualState;
  const ident = identHTML(P.pathLean, false);
  const tier = P.selectedDetail && P.selectedDetail.identity ? ('T' + (P.selectedDetail.identity.tier ?? '—')) : 'T—';
  const cTier = `<div class="mc"><div class="tiernum"><b>${tier}</b><i>focus tier</i></div></div>`;
  const cState = `<div class="mc stkc"><b>${stLabel}</b><i>state</i></div>`;
  const cCompass = `<div class="mc compassmc">${compassSVG(P.elementLean)}<div class="stkc"><b>${P.elementLean ? P.elementLean.entries.map((e) => e.label).join(' · ') : '—'}</b><i>element lean</i></div></div>`;
  const rmedal = `<div class="rmedal"><div class="rml"><b>Gear Power</b><i>aggregate of the worn</i></div>${powerSealSVG(P.gearPower || 0)}</div>`;
  return ident + cTier + cState + cCompass + rmedal;
}
export function ribbonVaultHTML(V: VaultExactSurfaceV1, pathLean: PanoplyPathLean): string {
  const ident = identHTML(pathLean, true);
  const mid = `<div class="census big">${censusStripHTML(V.counts.byRarity)}</div>`;
  const rmedal = `<div class="rmedal"><div class="rml"><b>Spatial Ring</b><i>space-folding store</i></div>${ringSealSVG(V.counts.total)}</div>`;
  return ident + mid + rmedal;
}

// ── LOWER STRIP (routes — decorative; the bench/forge live in their own halls) ────────────────────
export function lowerStripHTML(): string {
  const arts: Array<[string, string, string]> = [['锻', 'Upgrade Bench', 'to the tempering forge'], ['魂', 'Weapon-Bond Forge', 'deepen the bond'], ['较', 'Compare', 'side-by-side vs equipped']];
  return arts.map((a) => `<div class="rt clickable"><span class="gl">${a[0]}</span><div style="line-height:1.05"><div>${a[1]}</div><div class="sub" style="letter-spacing:.06em;font-size:7px">${a[2]}</div></div></div>`).join('')
    + `<div style="margin-left:auto" class="sub">routes · the bench &amp; forge live in their own halls</div>`;
}

// ── ITEM DETAIL — rail (reads ItemDetailSurfaceV1; the modal reuses the F2 inspector) ─────────────
function rarityChipsHTML(idn: ItemDetailIdentity): string {
  const g = RGRADE[idn.rarity], rv = gradeVar(g), hi = (g === 'heaven' || g === 'immortal');
  let h = `<span class="rchip" style="border-color:${rv};background:linear-gradient(180deg,${softVar(g)},rgba(255,250,235,.28))${hi ? `;box-shadow:0 0 10px ${softVar(g)}` : ''}"><i style="color:${rv}">${RLABEL[idn.rarity]}</i><b style="color:${rv}">${RGLYPH[idn.rarity]}</b></span>`;
  h += `<span class="chip ink">${KMARK[idn.kind ?? ''] || ''} ${idn.slot ?? ''}</span>`;
  if (idn.element) h += `<span class="chip" style="background:${idn.element.sceneColorToken}1f;border:1px solid ${idn.element.sceneColorToken};color:${idn.element.sceneColorToken}">${elGlyph(idn.element.id)} ${idn.element.label}</span>`;
  if (idn.lean) h += `<span class="chip gold">${idn.lean}</span>`;
  if (idn.rarityBand) h += `<span class="chip ink">${idn.rarityBand}</span>`;
  return h;
}
function affixRowHTML(a: ItemDetailAffix): string {
  const kind = a.kind || 'prefix';
  const roll = (a.rolledRange && typeof a.rollPosition === 'number')
    ? `<div class="rollbar"><i style="left:${Math.round(a.rollPosition * 100)}%"></i></div><div class="ac" style="grid-column:2/4;margin-top:1px">${a.rolledRange}${a.quality ? (' · ' + a.quality + ' roll') : ''}</div>`
    : '';
  return `<div class="affix ${kind}"><span class="pin"></span><div><div class="an">${a.name}</div>${a.channel && a.channel !== a.name ? `<div class="ac">${a.channel}</div>` : ''}</div><div class="av">${a.value}</div>${roll}</div>`;
}
function setBondSecHTML(sb: ItemDetailSetBond | null | undefined): string {
  if (!sb) return ''; let h = '';
  if (sb.set) {
    h += `<div class="dsec">Set · ${sb.set.name} <span style="float:right;color:var(--ink-45)">${sb.set.held}/${sb.set.total}</span></div>`;
    (sb.set.activeBonuses || []).forEach((b) => { h += `<div class="affix set"><span class="pin"></span><div class="an" style="font-weight:700">${b}</div></div>`; });
    (sb.set.latentBonuses || []).forEach((b) => { h += `<div class="affix set" style="opacity:.6"><span class="pin" style="background:var(--ink-25);border-color:var(--ink-45)"></span><div class="an" style="font-weight:600;font-style:italic">${b} <span class="ac">held</span></div></div>`; });
  }
  if (sb.bond) {
    h += `<div class="dsec">Weapon Bond · ${sb.bond.level}/${sb.bond.max ?? '—'}</div>`;
    (sb.bond.perks || []).forEach((p) => { h += `<div class="affix bond"><span class="pin"></span><div class="an">${p}</div></div>`; });
  }
  return h;
}
function compareSecHTML(cmp: ItemDetailCompareRow[] | null | undefined): string {
  if (!cmp) return '';
  return `<div class="dsec">Compare vs equipped</div>${cmp.map((c) => `<div class="cmp"><span>${c.stat}</span><span class="${c.direction === 'up' ? 'up' : c.direction === 'down' ? 'dn' : 'fl'}">${c.direction === 'up' ? '▲' : c.direction === 'down' ? '▼' : '—'} ${c.delta}</span></div>`).join('')}`;
}
function actionsHTML(acts: ItemDetailAction[] | undefined): string {
  return (acts || []).map((a) => `<button class="btn ${a.verb === 'Equip' ? 'jade' : ''} ${a.enabled ? '' : 'dis'}" data-route="${a.route}"${a.enabled ? '' : ' disabled'}${a.confirm ? ` data-confirm="${a.confirm.prompt}" title="${a.confirm.prompt}"` : ''}${a.disabledReason ? ` title="${a.disabledReason}"` : ''}>${a.verb}</button>`).join('');
}
export function detailRailHTML(d: ItemDetailSurfaceV1 | null): string {
  if (!d || !d.identity) return `<div class="detail"><div class="empty-rail"><div><div style="font-family:var(--kai);font-size:34px;color:var(--ink-25)">擇</div><div class="sub" style="margin-top:8px">Choose a treasure</div><div style="font:600 10px var(--serif);color:var(--ink-45);margin-top:4px;max-width:200px">Tap any worn piece to read its affixes, set, and bond.</div></div></div></div>`;
  const idn = d.identity;
  return `<div class="detail"><div class="dh"><div class="dname">${idn.name}</div>${idn.nameCjk ? `<div class="dcjk">${idn.nameCjk}</div>` : ''}<div class="kv" style="margin-top:6px">${rarityChipsHTML(idn)}</div></div>`
    + `<div class="dbody">`
    + `<div class="dsec">Affixes</div>${(d.affixes || []).map(affixRowHTML).join('')}`
    + setBondSecHTML(d.setBond)
    + compareSecHTML(d.compareVsEquipped)
    + (d.signature ? `<div class="dsec">Signature</div><div class="sig"><div class="sn">${d.signature.name}</div><div class="sb">${d.signature.body}</div></div>` : '')
    + (d.lore ? `<div class="lore">“${d.lore}”</div>` : '')
    + (d.provenance ? `<div class="prov">PROVENANCE · ${d.provenance}</div>` : '')
    + `</div>`
    + `<div class="dacts">${actionsHTML(d.actions)}</div>`
    + `</div>`;
}

// ── VAULT slip + grid ─────────────────────────────────────────────────────────────────────────────
export function slipHTML(s: VaultSlipSurface, sel: boolean): string {
  return `<div class="slip ${sel ? 'sel' : ''}" data-slip-id="${s.instanceId}">`
    + `<div class="svgwrap">${slipEmblemSVG(s)}${s.isEquipped ? '<span class="eqb">装 EQ</span>' : ''}${s.isNew ? '<span class="newdot"></span><span class="glint"></span>' : ''}</div>`
    + `<div class="nm">${s.name}</div>` + (s.nameCjk ? `<div class="cjk">${s.nameCjk}</div>` : '')
    + `<div class="rl" style="color:${gradeVar(RGRADE[s.rarity])}">${s.rarityLabel}</div>`
    + `</div>`;
}
export function vaultBodyHTML(V: VaultExactSurfaceV1): string {
  const fkinds: Array<[string, string]> = [['all', 'All'], ['weapon', '器 Weapon'], ['armor', '甲 Armor'], ['accessory', '宝 Accessory']];
  const sortLabel: Record<string, string> = { rarity: 'Rarity', slot: 'Slot', recent: 'Recent' };
  const filters = `<div class="vfilters">`
    + fkinds.map((f) => `<button class="fbtn ${V.filter.slot === f[0] ? 'on' : ''}" data-vfilter="${f[0]}">${f[1]}</button>`).join('')
    + `<span style="width:1px;height:18px;background:rgba(120,90,46,.3);margin:0 4px"></span>`
    + `<button class="fbtn on" title="sort">↧ ${sortLabel[V.sort.by] ?? V.sort.by}</button>`
    + `<span class="sub" style="margin-left:auto">${V.counts.total} treasures · sorted high → low</span>`
    + `</div>`;
  const grid = V.slips.length
    ? `<div class="vgrid">${V.slips.map((s) => slipHTML(s, s.instanceId === V.selection.instanceId)).join('')}</div>`
    : `<div class="empty-vault"><div><div style="font-family:var(--kai);font-size:40px;color:var(--ink-25)">空</div><div class="sub" style="margin-top:8px">The ring is empty</div><div style="font:600 10px var(--serif);color:var(--ink-45);margin-top:3px">Treasures you gather will gather here.</div></div></div>`;
  return filters + grid;
}

/** the chrome (grain + double gold frame + corners + banner) — ported from chrome(). */
export function chromeHTML(banner: string): string {
  return `<div class="grain"><svg width="100%" height="100%" preserveAspectRatio="none"><rect width="100%" height="100%" filter="url(#grainF)"/></svg></div>`
    + `<div class="gframe"></div><div class="gframe2"></div><i class="gc tl"></i><i class="gc tr"></i><i class="gc bl"></i><i class="gc br"></i>`
    + (banner ? `<div class="banner">${banner}</div>` : '');
}
