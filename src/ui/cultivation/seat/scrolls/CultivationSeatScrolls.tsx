import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type {
  CultivationGateReadiness,
  CultivationSeatSurfaceV1,
  CultivationScrollId,
} from '../../../../systems/ui/cultivation/cultivationSeatTypes.js';
import type { CultivationSeatActions } from '../../../../features/cultivation/seat/useCultivationSeatActionController.js';

/**
 * M.II.3 Wave 5 — the seven scrolls at artifact-level card fidelity. Render-only: every value
 * binds to the surface; no gameplay math here. Opened from the scene instruments / breath-line /
 * threshold; one is open at a time; the dim backdrop closes on outside-click.
 */

function ScrollFrame({ tag, kicker, title, dek, onClose, children }: { tag: string; kicker: string; title: string; dek?: string; onClose: () => void; children: ReactNode }) {
  return (
    <>
      <div className="seatScroll__rod seatScroll__rod--top"><span className="seatScroll__cap seatScroll__cap--l" /><span className="seatScroll__cap seatScroll__cap--r" /></div>
      <div className="seatScroll__rod seatScroll__rod--bot"><span className="seatScroll__cap seatScroll__cap--l" /><span className="seatScroll__cap seatScroll__cap--r" /></div>
      <div className="seatScroll__head">
        <div className="seatScroll__stag"><b>{tag}</b></div>
        <div className="seatScroll__ht">
          <div className="seatScroll__k">{kicker}</div>
          <div className="seatScroll__t">{title}</div>
          {dek && <div className="seatScroll__d">{dek}</div>}
        </div>
        <button type="button" className="seatScroll__close" aria-label="Close scroll" onClick={onClose}>×</button>
      </div>
      <div className="seatScroll__content">{children}</div>
    </>
  );
}

function CardTop({ glyph, title, right, tone }: { glyph: string; title: string; right?: string; tone?: 'jade' | 'cinn' }) {
  return (
    <div className="seatCard__top">
      <div className={`seatCard__cm${tone ? ` is-${tone}` : ''}`}>{glyph}</div>
      <div className="seatCard__ct">{title}</div>
      {right && <div className="seatCard__cx2">{right}</div>}
    </div>
  );
}

function AscentScroll({ s, onClose }: { s: CultivationSeatSurfaceV1; onClose: () => void }) {
  const a = s.ascent;
  const rungsTopDown = [...a.rungs].reverse();
  return (
    <ScrollFrame tag="登" kicker="THE ASCENT" title="The realm ladder" dek={`Counting in ${s.identity.counter}s · ${a.realmsCrossed} of ${a.realmsTotalLive} walked · the seventh sealed`} onClose={onClose}>
      <div className="seatCard" data-scroll-body="ascent">
        <CardTop glyph="道" title={`The road of the ${s.identity.pathName.toLowerCase()} path`} right={`toward ${s.identity.peakTitle}`} />
        <div className="seatLadder">
          {rungsTopDown.map((r) => (
            <div key={r.realmIndex} className={`seatRung is-${r.state}`} data-rung-state={r.state}>
              <span className="seatRung__rn">{r.name}</span>
              <span className="seatRung__rz">{r.zh}</span>
              <span className="seatRung__rs">{r.state === 'crossed' ? 'crossed' : r.state === 'current' ? (s.identity.atPeak ? 'at the Peak' : 'climbing') : 'sealed'}</span>
              <span className="seatRung__se">{r.detail}</span>
              {r.state === 'current' && <span className="seatRung__bar"><span style={{ width: `${Math.round(s.realmProgress.pct * 100)}%` }} /></span>}
            </div>
          ))}
        </div>
      </div>
      {a.nextMeridian && (
        <div className="seatCard">
          <CardTop glyph="階" title="This crossing grants" right="the next realm" tone="jade" />
          <div className="seatGrant">
            <div className="seatGrant__gm">脈</div>
            <div><div className="seatGrant__gt">{a.nextMeridian.name} · {a.nextMeridian.zh}</div><div className="seatGrant__gd">Opens the <b>{a.nextMeridian.name}</b> meridian — {a.nextMeridian.fantasy}.</div></div>
          </div>
        </div>
      )}
      <div className="seatCard">
        <CardTop glyph="修" title="Cultivation Base" right="within this stage" />
        <div className="seatStatrow"><span className="seatStatrow__sn">Toward the next stage</span><span className="seatStatrow__sv">{Math.round(s.realmProgress.pct * 100)}%</span></div>
        <div className="seatStatrow"><span className="seatStatrow__sn">Banked qi</span><span className="seatStatrow__sv">{s.realmProgress.qiText}</span></div>
        <div className="seatStatrow"><span className="seatStatrow__sn">Realms walked</span><span className="seatStatrow__sv">{a.realmsCrossed} of {a.realmsTotalLive} · R7 sealed</span></div>
      </div>
      <div className="seatVerseFoot">“{s.identity.verse}”</div>
    </ScrollFrame>
  );
}

const BAND_ORDER: Array<CultivationGateReadiness['safetyBand']> = ['serene', 'steady', 'perilous', 'dire'];
const BAND_LABEL: Record<string, string> = { serene: 'Serene', steady: 'Steady', perilous: 'Perilous', dire: 'Dire' };

function GateReadinessScroll({ s, actions, onClose }: { s: CultivationSeatSurfaceV1; actions: CultivationSeatActions; onClose: () => void }) {
  const g = s.breakthrough.gateReadiness;
  if (!g) return <ScrollFrame tag="關" kicker="GATE READINESS" title="The crossing is not yet woken" onClose={onClose}><div className="seatCard"><div className="seatTerms">Reach the Peak of this realm to wake the Threshold.</div></div></ScrollFrame>;
  const verdictText = g.verdict === 'ready' ? 'Ready to attempt' : g.verdict === 'held' ? 'Held back' : 'Not yet ready';
  const activeBand = g.safetyBand === 'guaranteed' ? 0 : BAND_ORDER.indexOf(g.safetyBand);
  return (
    <ScrollFrame tag={g.verdictZh} kicker="GATE READINESS" title="The crossing diagnosis" dek="A read-only reading — nothing here is decided in the menu" onClose={onClose}>
      {/* F2: the canonical crossing diagnosis (the on-scene stub is gone) — carries the gate test-ids */}
      <div data-region="gate-readiness" data-testid="cultivation-seat-gate" data-verdict={g.verdict}>
      <div className="seatCard seatCard--verdict" data-scroll-body="gatereadiness" data-verdict={g.verdict}>
        <div className={`seatWaxSeal is-${g.verdict}`}>{g.verdictZh}</div>
        <div><div className="seatCard__ct">The verdict</div><div className={`seatVerdict is-${g.verdict}`}>{verdictText}</div></div>
      </div>
      <div className="seatCard">
        <CardTop glyph="審" title="The four checks" right="what the gate weighs" />
        <div className="seatGrid">
          {g.checks.map((c) => (
            <div key={c.id} className="seatCheckrow" data-check={c.id} data-state={c.state}>
              <div className={`seatCheckrow__med is-${c.state}`}>{c.state === 'ok' ? '√' : c.state === 'caution' ? '!' : '×'}</div>
              <div className="seatCheckrow__body"><div className="seatCheckrow__cn">{c.label}</div><div className="seatCheckrow__sub">{c.detail}</div></div>
              <div className={`seatCheckrow__cs is-${c.state}`}>{c.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="seatCard">
        <CardTop glyph="策" title="Crossing safety" right={g.riskPercent != null ? `≈ ${g.riskPercent}% risk` : 'how calculated'} />
        <div className="seatBand" data-safety-band={g.safetyBand}>
          {BAND_ORDER.map((b, i) => (<div key={b} className={`seatBand__seg is-${b}${i === activeBand ? '' : ' is-dim'}`}>{BAND_LABEL[b]}</div>))}
        </div>
        <div className="seatTerms">{g.safetyOdds}{g.riskPercent != null ? ` This is the same ${g.riskPercent}% the crossing rolls against — about ${100 - g.riskPercent} in 100 succeed.` : ''} Assembled from {g.safetyTerms.map((t, i) => (<b key={t}>{t}{i < g.safetyTerms.length - 1 ? ', ' : ''}</b>))}.</div>
        {g.raiseHint && <div className="seatRaiseHint">{g.raiseHint}</div>}
      </div>
      {g.blockers.length > 0 && (
        <div className="seatCard">
          <CardTop glyph="心" title="What holds the crossing" tone="cinn" />
          {g.blockers.map((b, i) => (
            <div key={i} className="seatBlocker">
              <div><div className="seatBlocker__bx">{b.reason}</div>{b.routeTo ? <button type="button" className="seatBlocker__route" onClick={() => actions.onDeepLink(b.routeTo!)}>{b.routeLabel}</button> : <div className="seatBlocker__note">{b.routeLabel}</div>}</div>
            </div>
          ))}
        </div>
      )}
      <div className="seatCard">
        <CardTop glyph="憂" title="Safety net" right="never-regress" tone="jade" />
        <div className="seatTerms">A failed crossing costs <b>no realm you have earned</b>. Each attempt banks pity toward a sure crossing.</div>
        {g.pity && (
          <div className="seatPity" data-testid="cultivation-seat-pity">
            <span className="seatPity__k">Pity</span>
            {Array.from({ length: g.pity.toGuarantee }).map((_, i) => (<span key={i} className={`seatPity__pip${i < g.pity!.banked ? ' is-on' : ''}`} />))}
            <span className="seatPity__lbl">{g.pity.banked} of {g.pity.toGuarantee} toward a guaranteed crossing</span>
          </div>
        )}
        {g.canCommit
          ? <button type="button" className="seatCommit" data-testid="cultivation-seat-commit" onClick={() => actions.onCommitCrossing()}>Cross the Threshold →</button>
          : <><button type="button" className="seatCommit is-disabled" data-testid="cultivation-seat-commit" disabled>Cross the Threshold →</button><div className="seatTerms seatTerms--muted">The crossing cannot begin until the above is cleared.</div></>}
      </div>
      </div>
    </ScrollFrame>
  );
}

function LedgerScroll({ s, actions, onClose }: { s: CultivationSeatSurfaceV1; actions: CultivationSeatActions; onClose: () => void }) {
  const l = s.scrolls.ledger;
  return (
    <ScrollFrame tag="藏" kicker="THE IDLE LEDGER" title="How seclusion accrues" dek="The full idle accounting — a whisper on the scene, a study here" onClose={onClose}>
      <div data-scroll-body="ledger" data-testid="cultivation-seat-ledger">
      <div className="seatCard">
        <CardTop glyph="率" title="Cultivation rate" right="how calculated" />
        <div className="seatEqn">
          <div className="seatEqn__term"><b>{l.rate.base}</b><i>Realm base</i></div><div className="seatEqn__op">×</div>
          <div className="seatEqn__term"><b>{l.rate.stageMult}</b><i>Stage</i></div><div className="seatEqn__op">×</div>
          <div className="seatEqn__term"><b>{l.rate.focusMult}</b><i>Focus</i></div><div className="seatEqn__op">×</div>
          <div className="seatEqn__term"><b>{l.rate.pathMult}</b><i>Path</i></div><div className="seatEqn__op">× …</div>
          <div className="seatEqn__res"><b>{l.rate.result}</b><i>qi / s</i></div>
        </div>
        <div className="seatTerms">{l.rate.terms}</div>
      </div>
      <div className="seatCard">
        <CardTop glyph="漏" title="The two clocks" right="idle vs active" />
        <div className="seatStatrow"><span className="seatStatrow__sn">Seclusion</span><span className="seatStatrow__se">idle cultivation · accrues offline, even while away</span><span className={`seatStatrow__sv${l.clocks.seclusion === 'running' ? ' is-ok' : ''}`}>{l.clocks.seclusion}</span></div>
        <div className="seatStatrow"><span className="seatStatrow__sn">Sojourn</span><span className="seatStatrow__se">active expeditions &amp; combat · only while the app is open</span><span className="seatStatrow__sv">{l.clocks.sojourn}</span></div>
      </div>
      <div className="seatCard">
        <CardTop glyph="風" title="Offline accrual" right="the Tempering Wind" />
        <div className="seatStatrow"><span className="seatStatrow__sn">Accrual cap</span><span className="seatStatrow__sv">{l.offline.capHours} hours</span></div>
        <div className="seatStatrow"><span className="seatStatrow__sn">Efficiency</span><span className="seatStatrow__sv">{l.offline.efficiency}</span></div>
        <div className="seatTerms">Idle is <b>never taxed</b> — accrual simply pauses at the cap, and never decays. Return any time and the seclusion is waiting.</div>
      </div>
      <div className="seatCard">
        <CardTop glyph="業" title="The foreground gate" right="one at a time" />
        <div className="seatTerms">{l.foregroundTerms}</div>
        <div className="seatLinks">
          <button type="button" className="seatDeeplink" onClick={() => actions.onDeepLink('world.map')}>Expeditions ↗</button>
          <button type="button" className="seatDeeplink" onClick={() => actions.onDeepLink('alchemy')}>Alchemy ↗</button>
          <button type="button" className="seatDeeplink" onClick={() => actions.onDeepLink('daoHeart')}>Dao Heart ↗</button>
        </div>
      </div>
      <div className="seatCard">
        <CardTop glyph="功" title="Life Merit" right="this life" />
        <div className="seatStatrow"><span className="seatStatrow__sn">Tallied this incarnation</span><span className="seatStatrow__sv">{l.lifeMerit}</span></div>
        <button type="button" className="seatDeeplink" onClick={() => actions.onDeepLink('prestige.records')}>To Prestige &amp; records ↗</button>
      </div>
      </div>
    </ScrollFrame>
  );
}

function FocusScroll({ s, actions, onClose }: { s: CultivationSeatSurfaceV1; actions: CultivationSeatActions; onClose: () => void }) {
  const f = s.focus;
  const emph = f.axes.find((a) => a.id === f.emphasisId);
  return (
    <ScrollFrame tag="業" kicker="THE FOCUS" title="The one build lever" dek="The seven cultivation axes — the lever you act on at the Seat" onClose={onClose}>
      <div className="seatCard" data-scroll-body="focus">
        <CardTop glyph="心" title={`The seven axes · ${s.identity.pathName}`} right="tap to set emphasis" />
        {f.axes.map((axis) => (
          <button key={axis.id} type="button" className={`seatAxisRow${axis.id === f.emphasisId ? ' is-emph' : ''}`} data-axis={axis.id} aria-pressed={axis.id === f.emphasisId} onClick={() => actions.onSetFocusEmphasis(axis.id)}>
            <span className="seatAxisRow__sn">{axis.label}</span>
            <span className="seatAxisRow__sz">{axis.glyph}</span>
            <span className="seatAxisRow__sv">{Math.round(axis.weight * 100)}%</span>
            <span className="seatAxisRow__se">{axis.effect}{axis.id === f.emphasisId ? ' · current emphasis' : ''}</span>
            <span className="seatAxisRow__bar"><span style={{ width: `${Math.round(axis.weight * 100)}%` }} /></span>
          </button>
        ))}
      </div>
      <div className="seatCard">
        <CardTop glyph="序" title="Your emphasis" right="the real trade" />
        <div className="seatTerms">Emphasising <b>{emph?.label}</b> sets {emph?.lean}; it {emph?.effect}. The Seat has three live cultivation modes — <b>Spirit</b>, <b>Body</b>, and <b>Balanced</b> — and each axis tilts you into one of them. A finer 7-axis emphasis engine is a forthcoming refinement; your pick persists either way.</div>
      </div>
      <div className="seatCard">
        <CardTop glyph="星" title="The whole picture lives in Status" right="preview only" tone="jade" />
        <div className="seatTerms">The Seat shows two slivers of stat-truth — this dial and the Three Treasures triad. The full 28-stat constellation is owned by the Status screen.</div>
        <button type="button" className="seatDeeplink" onClick={() => actions.onDeepLink('status.constellation')}>Open the full constellation in Status ↗</button>
      </div>
    </ScrollFrame>
  );
}

/** The honest "not yet active" banner — the path mechanic is designed (D5) but unshipped (D16 Wave C). */
function PreviewBanner({ note }: { note: string }) {
  return (
    <div className="seatCard seatCard--preview" data-scroll-body="mechanic" data-instrument-active="false">
      <CardTop glyph="未" title="Not yet active" right="preview" tone="cinn" />
      <div className="seatTerms">{note}</div>
    </div>
  );
}

function MechanicScroll({ s, actions, onClose }: { s: CultivationSeatSurfaceV1; actions: CultivationSeatActions; onClose: () => void }) {
  const inst = s.instrument;
  if (inst.kind === 'heaven') {
    return (
      <ScrollFrame tag="目" kicker="PREMONITION" title="Heaven’s Eye" dek={inst.active ? 'The aloof seer reads the day — fortune, danger, and the shape ahead, sharpening each realm' : 'The aloof seer will read fortune, danger, and the shape of the crossing — a forthcoming Heaven-path art'} onClose={onClose}>
        {inst.active
          ? (
            <div className="seatCard" data-scroll-body="mechanic" data-instrument-active="true">
              <CardTop glyph="目" title="Day’s Omen" right="active" tone="jade" />
              <div className="seatTerms">{inst.previewNote}</div>
            </div>
          )
          : <PreviewBanner note={inst.previewNote} />}
        <div className="seatCard">
          <CardTop glyph="吉" title="Fortune omens" right={inst.active ? 'today' : 'preview'} tone="jade" />
          <div className="seatGrid">{inst.fortuneOmens.map((o) => (<div key={o.label} className="seatCheckrow"><div className="seatCheckrow__med is-ok">√</div><div className="seatCheckrow__body"><div className="seatCheckrow__cn">{o.label}</div><div className="seatCheckrow__sub">{o.detail}</div></div><div className="seatCheckrow__cs is-ok">{o.value}</div></div>))}</div>
        </div>
        {(!inst.active || inst.riskOmens.length > 0) && (
          <div className="seatCard">
            <CardTop glyph="隙" title="Risk omens" right={inst.active ? 'foreseen' : 'preview'} />
            <div className="seatGrid">{inst.riskOmens.map((o) => (<div key={o.label} className="seatCheckrow"><div className="seatCheckrow__med is-caution">!</div><div className="seatCheckrow__body"><div className="seatCheckrow__cn">{o.label}</div><div className="seatCheckrow__sub">{o.detail}</div></div><div className="seatCheckrow__cs is-caution">{o.value}</div></div>))}</div>
          </div>
        )}
        <div className="seatCard">
          <div className="seatTerms">Built to its grain, Heaven breaks through most <b>serenely</b> — perception becoming the key that opens the gate. {inst.active ? 'Combat & tribulation foresight deepen this read in later packets.' : 'The mechanic is designed; this scroll previews it.'}</div>
        </div>
      </ScrollFrame>
    );
  }
  if (inst.kind === 'earth') {
    return (
      <ScrollFrame tag="獸" kicker="BEAST LORE" title="Body Tempering" dek="The body-refiner will draw the strengths of the wild into its own marrow — a forthcoming Earth-path system" onClose={onClose}>
        <PreviewBanner note={inst.previewNote} />
        <div className="seatCard">
          <CardTop glyph="獸" title="Bestial essences" right={`preview · ${inst.essences.length}`} tone="jade" />
          <div className="seatGrid">{inst.essences.map((e) => (<div key={e.name} className="seatGrant"><div className="seatGrant__gm">{e.glyph}</div><div><div className="seatGrant__gt">{e.name}</div><div className="seatGrant__gd">{e.trait}</div></div></div>))}</div>
        </div>
        <div className="seatCard">
          <CardTop glyph="狩" title="Where you’ll hunt" right="more essence" />
          <div className="seatTerms">Once this ships, demonic beasts will drop essence in the World — the signal that drives the body’s growth here.</div>
          <button type="button" className="seatDeeplink" onClick={() => actions.onDeepLink('world.map')}>Hunt in the World ↗</button>
        </div>
      </ScrollFrame>
    );
  }
  return (
    <ScrollFrame tag="劍" kicker="WEAPON-BOND" title="Arms-Mastery" dek="The weapon as a cultivable companion — a second body, tempered beside you; a forthcoming Martial-path system" onClose={onClose}>
      <PreviewBanner note={inst.previewNote} />
      <div className="seatCard">
        <CardTop glyph="劍" title="The bonded weapon" right="preview" tone="cinn" />
        <div className="seatStatrow"><span className="seatStatrow__sn">{inst.weaponName}</span><span className="seatStatrow__sv">{inst.weaponGrade}</span></div>
      </div>
      <div className="seatCard">
        <CardTop glyph="劃" title="Weapon-arts" right={`preview · ${inst.arts.length}`} tone="jade" />
        <div className="seatGrid">{inst.arts.map((a) => (<div key={a.name} className="seatGrant"><div className="seatGrant__gm">劃</div><div><div className="seatGrant__gt">{a.name}</div><div className="seatGrant__gd">{a.detail}</div></div></div>))}</div>
      </div>
      <div className="seatCard">
        <CardTop glyph="鍛" title="The Forge" right="equipment" />
        <div className="seatTerms">Forging, refining and gems — the gear side — is owned by the Forge.</div>
        <button type="button" className="seatDeeplink" onClick={() => actions.onDeepLink('forge.equipment')}>To the Forge &amp; Equipment ↗</button>
      </div>
    </ScrollFrame>
  );
}

export function CultivationSeatScrolls({ surface, actions, scroll }: { surface: CultivationSeatSurfaceV1; actions: CultivationSeatActions; scroll: CultivationScrollId }) {
  const onClose = actions.onCloseScroll;
  // F1: portal to document.body so the fixed overlay escapes the scaled stage / app-shell transform
  // (a transformed ancestor becomes the containing block for position:fixed and clips it otherwise).
  // data-path re-casts the accent + kai vars on the overlay since it now lives outside the Seat root.
  const overlay = (
    <div className="cultivationSeatScrollOverlay" data-region="scroll-host" data-scroll={scroll} data-path={surface.meta.path} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={`${scroll} scroll`} className="cultivationSeatScroll">
        {scroll === 'ascent' && <AscentScroll s={surface} onClose={onClose} />}
        {scroll === 'gatereadiness' && <GateReadinessScroll s={surface} actions={actions} onClose={onClose} />}
        {scroll === 'ledger' && <LedgerScroll s={surface} actions={actions} onClose={onClose} />}
        {scroll === 'focus' && <FocusScroll s={surface} actions={actions} onClose={onClose} />}
        {(scroll === 'premonition' || scroll === 'beastlore' || scroll === 'weaponbond') && <MechanicScroll s={surface} actions={actions} onClose={onClose} />}
      </div>
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(overlay, document.body) : overlay;
}
