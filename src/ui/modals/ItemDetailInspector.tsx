import { useState, type ReactNode } from 'react';
import classNames from 'classnames';
import type {
  ItemDetailAction,
  ItemDetailRarity,
  ItemDetailSurfaceV1,
} from '../../systems/ui/modals/itemDetailTypes.js';
import { ITEM_DETAIL_RARITY_OPTIONS, ITEM_DETAIL_VARIANT_OPTIONS } from '../../systems/ui/modals/itemDetailTypes.js';
import { ModalShell } from './ModalShell.js';
import { EdgeGlyph, LockSeal, MiniIcon, RaritySeal, TierMark, WaxSeal } from './modalMarks.js';
import './ItemDetailInspector.scss';

/**
 * F2.UI — the Item/Technique-Detail inspector (寶錄 / 法錄), the unrolled treasure record. This is a
 * faithful port of the modal-stage.html `.record` (renderInspector) — the box, the rarity FRAME GRADE,
 * the buttons, the chrome — rendered inside the bespoke ModalShell rather than a shared modal frame, so
 * it matches the mockup exactly. RENDER-ONLY: it reads its typed ItemDetailSurfaceV1 prop and forwards
 * OPAQUE action route ids via `onAction`; it imports no gameplay store and never mutates. The Sell
 * confirm is local VIEW state.
 */

export const ITEM_DETAIL_INSPECTOR_RARITY_OPTIONS = ITEM_DETAIL_RARITY_OPTIONS;
export const ITEM_DETAIL_INSPECTOR_VARIANT_OPTIONS = ITEM_DETAIL_VARIANT_OPTIONS;

export interface ItemDetailInspectorProps {
  open: boolean;
  surface: ItemDetailSurfaceV1;
  /** Forwarded intents: the inspector calls onAction(action.route). It NEVER mutates. */
  onAction: (route: string) => void;
  onClose: () => void;
}

const ELEMENT_GLYPH: Record<string, string> = {
  wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
  wind: '風', lightning: '雷', ice: '冰', light: '光', shadow: '影',
  soul: '魂', void: '虛', time: '時', astral: '星',
};
const RARITY_GRADE: Record<ItemDetailRarity, string> = { common: 'mortal', uncommon: 'spirit', rare: 'earth', epic: 'heaven', legendary: 'immortal' };
const RARITY_KAI: Record<ItemDetailRarity, string> = { common: '凡', uncommon: '良', rare: '珍', epic: '极', legendary: '仙' };
const RARITY_NAME: Record<ItemDetailRarity, string> = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };

/** Equip/Seat/Use → jade · Sell → ghost · Reroll → cinnabar · Upgrade → gold (default). */
function verbStyle(verb: string): string {
  if (verb === 'Equip' || verb === 'Seat' || verb === 'Use') return 'jade';
  if (verb === 'Sell' || verb === 'Dismantle') return 'ghost';
  if (verb === 'Reroll') return 'cinn';
  return '';
}

export function ItemDetailInspector({ open, surface, onAction, onClose }: ItemDetailInspectorProps) {
  // Sell-confirm is local VIEW state (which action awaits confirmation) — not a mutation.
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  if (!open) return null;

  const identity = surface.identity;
  const isTech = identity?.variant === 'technique';
  const rarity = identity?.rarity ?? 'common';
  const grade = RARITY_GRADE[rarity];
  const pendingAction = surface.actions.find((a) => a.route === pendingRoute) ?? null;

  const handleAction = (action: ItemDetailAction) => {
    if (!action.enabled) return;
    if (action.confirm) { setPendingRoute(action.route); return; }
    onAction(action.route);
  };

  const closeBtn = (
    <button type="button" className="rclose" title="Close (Esc)" aria-label="Close inspector" onClick={onClose}>×</button>
  );

  // ——— empty ———
  let body: ReactNode;
  if (surface.visualState === 'empty' || !identity) {
    body = (
      <div className="record empty">
        <div className="rbody">
          <div className="emptywrap" data-detail-zone="empty">
            <div className="es-mark"><WaxSeal chars="寶錄" size={70} variant="cinnabar" /></div>
            <div className="es-t">No treasure selected</div>
            <div className="es-b">{surface.emptyLegend ?? 'Tap an item or technique anywhere — the vault, the forge, a reward line — to bring it to this record.'}</div>
          </div>
        </div>
      </div>
    );
  } else {
    const tag = isTech ? '法錄' : '寶錄';
    const tagLabel = isTech ? 'TECHNIQUE RECORD' : 'TREASURE RECORD';
    const el = identity.element;
    const band = identity.rarityBand ?? '';

    const head = (
      <div className="rhead">
        <div className="rtag"><span className={classNames('chop', { jade: isTech })}>{tag}</span> {tagLabel}</div>
        {closeBtn}
      </div>
    );

    // ——— locked (the slip) ———
    if (surface.visualState === 'locked') {
      body = (
        <div className="record locked r-mortal">
          <div className="rbody">
            {head}
            <div className="lockwrap" data-detail-zone="gate">
              <div className="lock-seal"><LockSeal size={40} /></div>
              <div className="lk-t">{identity.name} · {identity.nameCjk ?? ''}</div>
              <div className="lk-req"><MiniIcon name="lock" /> {surface.gate?.unmet ?? 'Sealed.'}</div>
              {surface.lore ? <div className="lk-hint">{surface.lore}</div> : null}
            </div>
          </div>
        </div>
      );
    } else {
      const kindLine = isTech ? (
        <>{identity.kind ?? 'Active · Method'} <span className="chip ink">{identity.realmTier}</span>{el ? <span className="chip ink">{ELEMENT_GLYPH[el.id] ?? '元'} {el.label}</span> : null}</>
      ) : (
        <>{identity.kind} · <b>{identity.slot}</b> slot{identity.lean ? <span className="chip bronze">{identity.lean} lean</span> : null}{el ? <span className="chip ink">{ELEMENT_GLYPH[el.id] ?? '元'} {el.label}</span> : null}</>
      );

      const left = surface.reroll ? (
        <div className="subpanel"><div className="sp-bar">REROLL · 命运</div><div className="sp-in">
          <div className="setrow"><b>Reroll a sub-stat</b> <span className="chip bronze">{surface.reroll.cost}</span></div>
          <div className="bonus active"><span className="bdot" /><span><span className="blab">honest odds</span> {surface.reroll.odds} — the new range is shown before you spend.</span></div>
          <div className="cmp-note" style={{ marginTop: 7 }}>{surface.reroll.note}</div>
        </div></div>
      ) : surface.setBond?.set ? (
        <div className="subpanel"><div className="sp-bar">SET</div><div className="sp-in">
          <div className="setrow"><b>{surface.setBond.set.name}</b>
            <span className="setpips">{Array.from({ length: surface.setBond.set.total }, (_, i) => <span key={i} className={classNames('setpip', i < surface.setBond!.set!.held ? 'on' : 'off')} />)}</span>
            <span className="micro">{surface.setBond.set.held}/{surface.setBond.set.total} held</span></div>
          {surface.setBond.set.activeBonuses.map((b, i) => <div key={`a${i}`} className="bonus active"><span className="bdot" /><span><span className="blab">active</span> {b}</span></div>)}
          {surface.setBond.set.latentBonuses.map((b, i) => <div key={`l${i}`} className="bonus latent"><span className="bdot" /><span><span className="blab">latent</span> {b}</span></div>)}
        </div></div>
      ) : surface.setBond?.bond ? (
        <div className="subpanel"><div className="sp-bar">WEAPON-BOND · 兵魂</div><div className="sp-in">
          <div className="setrow"><b>Bond Level {surface.setBond.bond.level}</b> <span className="micro">/ {surface.setBond.bond.max ?? '—'} · Martial-only</span></div>
          {surface.setBond.bond.max ? <div className="bondrow">{Array.from({ length: surface.setBond.bond.max }, (_, i) => <span key={i} className={classNames('bondnotch', { on: i < surface.setBond!.bond!.level, cur: i === surface.setBond!.bond!.level - 1 })} />)}</div> : null}
          {surface.setBond.bond.perks.map((p, i) => <div key={`p${i}`} className="bonus active"><span className="bdot" /><span>{p}</span></div>)}
        </div></div>
      ) : null;

      const right = surface.compareVsEquipped?.length ? (
        <div className="subpanel"><div className="sp-bar">COMPARE · vs equipped</div><div className="sp-in"><div className="cmp">
          {surface.compareVsEquipped.map((c, i) => (
            <div key={i} className="cmprow"><span className="cn">{c.stat}</span>
              <span className={classNames('cd', c.direction === 'up' ? 'up' : c.direction === 'down' ? 'down' : 'same')}>
                <span className="ar" aria-hidden="true">{c.direction === 'up' ? '▲' : c.direction === 'down' ? '▼' : '—'}</span>{c.delta}</span></div>
          ))}
        </div><div className="cmp-note">Shape + sign + value — never a blind equip, and legible with no colour.</div></div></div>
      ) : (
        <div className="subpanel"><div className="sp-bar">COMPARE · vs equipped</div><div className="sp-in"><div className="cmp-note">{isTech ? 'No equipped comparison for techniques.' : 'No item equipped — first in slot.'}</div></div></div>
      );

      body = (
        <div className={`record r-${grade}`}>
          <div className="rec-frame outer gframe" /><div className="rec-frame gframe2" />
          <div className="rec-frame gc tl" /><div className="rec-frame gc tr" /><div className="rec-frame gc bl" /><div className="rec-frame gc br" />
          {el ? <EdgeGlyph glyph={ELEMENT_GLYPH[el.id] ?? '元'} label={el.label} token={el.sceneColorToken} /> : null}
          <div className="rbody">
            {head}
            <div className="ident" data-detail-zone="identity">
              <div>
                <div className="iname">{identity.name}</div>
                {identity.nameCjk ? <div className="ikai">{identity.nameCjk}</div> : null}
                <div className="ikind">{kindLine}</div>
              </div>
              <div className="ident-right">
                <TierMark tier={isTech ? '法' : (identity.tier ?? '—')} isRealm={isTech} />
                <RaritySeal grade={grade} kai={RARITY_KAI[rarity]} name={RARITY_NAME[rarity]} band={band} />
              </div>
            </div>

            {surface.gate ? (
              <div className="req-banner" data-detail-zone="gate"><div className="rq-i"><MiniIcon name="lock" /></div>
                <div><div className="rq-t">Requirement</div><div className="rq-s">{surface.gate.unmet}</div></div></div>
            ) : null}

            {surface.signature ? (
              <div className="signature" data-detail-zone="signature">
                <div className="sg-h"><MiniIcon name="star" /> Signature mechanic · Legendary</div>
                <div className="sg-n">{surface.signature.name}</div>
                <div className="sg-b">{surface.signature.body}</div>
              </div>
            ) : null}

            <div className="rsec" data-detail-zone="affixes">
              <div className="rsec-h"><span className="t">Affixes · real text</span><span className="micro">{surface.affixes.length} rolled · {band}</span></div>
              <div className="affixes">
                {surface.affixes.map((a, i) => (
                  <div key={i} className={`affix ${a.kind}`}>
                    <span className="tk" />
                    <span className="an"><span className="akind">{a.kind}</span>{a.name}{a.channel && a.channel !== a.name ? ` — ${a.channel}` : ''}</span>
                    <span style={{ textAlign: 'right' }}>
                      <span className="av">{a.value}</span>
                      {a.rolledRange ? <><span className="ar">rolled {a.rolledRange}</span><span className="roll"><i style={{ left: `${Math.round(Math.max(0, Math.min(1, a.rollPosition ?? 0.5)) * 100)}%` }} /></span></> : null}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {isTech && (surface.casting || surface.scalesOff?.length) ? (
              <div className="rsec" data-detail-zone="casting">
                <div className="rsec-h"><span className="t">Casting · how it fires</span></div>
                <div className="micro" style={{ lineHeight: 1.5 }}>{surface.casting}
                  {surface.scalesOff?.length ? <><br /><span className="sub" style={{ display: 'inline-block', marginTop: 5 }}>Scales off</span> {surface.scalesOff.map((s, i) => <span key={i} className="chip jade">{s}</span>)}</> : null}
                </div>
              </div>
            ) : null}

            {(left || right) ? <div className="rsec"><div className="twocol" data-detail-zone="band">{left ?? <div />}{right}</div></div> : null}

            {(surface.lore || surface.provenance) ? (
              <div className="lore" data-detail-zone="lore">
                {surface.lore ? <div className="lq">{surface.lore}</div> : null}
                {surface.provenance ? <div className="lp"><MiniIcon name="scroll" /> <b>{isTech ? 'Offered' : 'Found'}:</b> {surface.provenance}</div> : null}
              </div>
            ) : null}

            {surface.actions.length ? (
              <div className="actions" data-detail-zone="actions">
                {pendingAction?.confirm ? (
                  <div className="confirm-bar" data-detail-zone="sell-confirm" role="group" aria-label="Confirm action">
                    <span className="action-note"><MiniIcon name="warn" /> {pendingAction.confirm.prompt}</span>
                    <span className="spacer" />
                    <button type="button" className="btn cinn" onClick={() => { onAction(pendingAction.route); setPendingRoute(null); }}>Confirm</button>
                    <button type="button" className="btn ghost" onClick={() => setPendingRoute(null)}>Cancel</button>
                  </div>
                ) : (
                  <>
                    {surface.actions.map((a, i) => (
                      <button key={i} type="button" className={classNames('btn', verbStyle(a.verb), { 'is-disabled': !a.enabled })} aria-disabled={!a.enabled} disabled={!a.enabled} title={a.disabledReason} onClick={() => handleAction(a)}>
                        {a.verb}{!a.enabled && a.disabledReason ? <span style={{ opacity: 0.7, fontWeight: 600, fontSize: 10 }}> · {a.disabledReason}</span> : null}
                      </button>
                    ))}
                    <span className="spacer" />
                    {surface.actions.some((a) => a.confirm) ? <span className="action-note"><MiniIcon name="warn" /> Sell asks to confirm — it names what is given up.</span> : null}
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      );
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} mode="inspector" ariaLabel={identity ? `${identity.name} — detail` : 'Item detail inspector'}>
      <div data-testid="item-detail-inspector" data-variant={identity?.variant ?? 'none'} data-visual-state={surface.visualState}>
        {body}
      </div>
    </ModalShell>
  );
}
