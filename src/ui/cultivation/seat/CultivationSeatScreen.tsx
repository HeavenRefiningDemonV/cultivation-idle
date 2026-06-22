import type { CultivationSeatSurfaceV1 } from '../../../systems/ui/cultivation/cultivationSeatTypes.js';
import { resolveCultivationSeatPresentation } from '../../../systems/ui/cultivation/cultivationSeatPresentation.js';
import type { CultivationSeatActions } from '../../../features/cultivation/seat/useCultivationSeatActionController.js';

/**
 * M.II.3 Wave 1 — the render-only Seat screen. STRUCTURAL: it renders the typed surface and
 * emits intents, with zero store reads and zero gameplay math (the render-only law, §6/§14.4).
 * The full SVG scene + instruments + scroll fidelity + motion + SCSS are Wave 2; this scaffold
 * carries every datum and region so the contract floor and the flag mount are real today.
 */
export function CultivationSeatScreen({ surface, actions }: { surface: CultivationSeatSurfaceV1; actions: CultivationSeatActions }) {
  const presentation = resolveCultivationSeatPresentation(surface);
  const { identity, scene, idle, focus, realmProgress, ascent, breakthrough, instrument } = surface;
  const gate = breakthrough.gateReadiness;
  const scroll = actions.selectedScroll;

  return (
    <div
      className="cultivationSeatRoot"
      data-testid={surface.meta.rootTestId}
      data-path={surface.meta.path}
      data-realm={identity.realmIndex}
      data-visual-state={surface.meta.visualState}
      data-reduced-motion={surface.meta.reducedMotion ? 'true' : 'false'}
    >
      {/* a11y live region — announces meaningful state transitions */}
      <p className="cultivationSeatLive" role="status" aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        {presentation.visualStateLabel}
      </p>

      {/* ── LINTEL ── */}
      <header data-region="lintel">
        <span data-pathchop={surface.meta.path} aria-hidden="true">{identity.pathGlyph}</span>
        <span className="roomsub">{identity.roomSub}</span>
        <h1 className="roomtitle">{identity.roomTitle}</h1>
        <span className="realmline">{identity.realmName} · {identity.realmZh} — {identity.stageLabel}</span>
        <span className="fgchip" data-foreground={scene.foreground}>{scene.foregroundLabel}</span>
      </header>

      {/* ── SCENE (Wave 2 paints the 7 layers; the watermark + beats carry now) ── */}
      <div data-region="scene" data-sky-beat={scene.skyBeat} data-figure-beat={scene.figureBeat} data-qi-beat={scene.qiBeat} aria-hidden="true">
        <span className="watermark">{scene.watermarkZh}</span>
      </div>

      {/* ── BASE PLATE (single dominant progress) ── */}
      <div data-region="base-plate">
        <span className="bk">Cultivation Base</span>
        <span className="bv" data-testid="cultivation-seat-progress">{Math.round(realmProgress.pct * 100)}%</span>
        <span className="bsub">{realmProgress.qiText} · {realmProgress.towardLabel}</span>
      </div>

      {/* ── BREATH-LINE (the idle read; the whole band opens the ledger) ── */}
      <button type="button" data-region="breath-line" data-testid="cultivation-seat-breathline" onClick={() => actions.onOpenScroll('ledger')}>
        <span className="brread">率 {idle.qiPerSec} qi/s</span>
        <span className="brread">藏 {idle.offlineCapLabel} offline cap</span>
        <span className="brread">風 {idle.offlineEfficiency} offline efficiency</span>
        <span className="brread">業 the Seat is {idle.stateWord}</span>
        <span className="expandhint">touch for the ledger ↗</span>
      </button>

      {/* ── FLOATING INSTRUMENTS ── */}
      <section data-region="instruments">
        {/* Focus Dial — 6 canonical axes + Balanced (R-1: no Body spoke) */}
        <div data-instrument="focus-dial" data-testid="cultivation-seat-focus">
          <span className="instlabel">Emphasis · tap a spoke</span>
          {focus.axes.map((axis) => (
            <button
              key={axis.id}
              type="button"
              data-axis={axis.id}
              aria-pressed={axis.id === focus.emphasisId}
              aria-label={`Emphasize ${axis.label}`}
              onClick={() => actions.onSetFocusEmphasis(axis.id)}
            >
              {axis.label}
            </button>
          ))}
          <span className="dialcap">{focus.axes.find((a) => a.id === focus.emphasisId)?.label} · {focus.leanCaption}</span>
        </div>

        {/* Ascent thread */}
        <button type="button" data-instrument="ascent" aria-label="Open the Ascent ladder" onClick={() => actions.onOpenScroll('ascent')}>
          Ascent · {ascent.realmsCrossed} of {ascent.realmsTotalLive}
        </button>

        {/* Three Treasures triad → Status */}
        <button type="button" data-instrument="treasures" aria-label="Open the full constellation in Status" onClick={() => actions.onDeepLink('status.constellation')}>
          Three Treasures · {surface.treasures.leadLabel}
        </button>

        {/* Per-path unique instrument */}
        <button
          type="button"
          data-instrument="path-mechanic"
          data-kind={instrument.kind}
          aria-label={`Open ${instrument.label}`}
          onClick={() => actions.onOpenScroll(instrument.kind === 'heaven' ? 'premonition' : instrument.kind === 'earth' ? 'beastlore' : 'weaponbond')}
        >
          {instrument.label} · {instrument.valLabel}
        </button>

        {/* The diegetic Cultivate seal */}
        <CultivateSeal surface={surface} actions={actions} />
      </section>

      {/* ── GATE READINESS (at the Peak only) ── */}
      {gate && (
        <section data-region="gate-readiness" data-testid="cultivation-seat-gate" data-verdict={gate.verdict}>
          <h2>The crossing diagnosis</h2>
          <ul>
            {gate.checks.map((check) => (
              <li key={check.id} data-check={check.id} data-state={check.state}>
                {check.label}: {check.value} — {check.detail}
              </li>
            ))}
          </ul>
          <p data-safety-band={gate.safetyBand}>{gate.safetyOdds}</p>
          <p>Assembled from {gate.safetyTerms.map((t) => t).join(', ')}.</p>
          {gate.pity && (
            <p data-testid="cultivation-seat-pity">{gate.pity.banked} of {gate.pity.toGuarantee} toward a guaranteed crossing</p>
          )}
          <p className="neverregress">A failed crossing costs no realm you have earned.</p>
          <button type="button" data-testid="cultivation-seat-commit" disabled={!gate.canCommit} onClick={() => actions.onCommitCrossing()}>
            {gate.canCommit ? 'Cross the Threshold →' : 'The crossing waits'}
          </button>
        </section>
      )}

      {/* ── SCROLL HOST ── */}
      {scroll && <SeatScroll surface={surface} actions={actions} scroll={scroll} />}
    </div>
  );
}

function CultivateSeal({ surface, actions }: { surface: CultivationSeatSurfaceV1; actions: CultivationSeatActions }) {
  const { meta, identity, breakthrough } = surface;
  if (meta.visualState === 'combatHeld') {
    return <span data-instrument="cultivate-seal" data-seal-state="held">Held — cultivation resumes after combat</span>;
  }
  if (identity.atPeak) {
    const ready = breakthrough.gateReadiness?.verdict === 'ready';
    return (
      <button type="button" data-instrument="cultivate-seal" data-seal-state={ready ? 'ready' : 'blocked'} onClick={() => actions.onOpenScroll('gatereadiness')}>
        {ready ? 'Approach the Threshold →' : 'The Threshold waits'}
      </button>
    );
  }
  return (
    <button type="button" data-instrument="cultivate-seal" data-seal-state="cultivate" onClick={() => actions.onSetForeground('cultivate')}>
      {meta.visualState === 'cultivating' ? 'Deepen the cultivation' : `Resume seclusion · ${identity.verb}`}
    </button>
  );
}

function SeatScroll({ surface, actions, scroll }: { surface: CultivationSeatSurfaceV1; actions: CultivationSeatActions; scroll: string }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={`${scroll} scroll`} data-region="scroll-host" data-scroll={scroll}>
      <button type="button" aria-label="Close scroll" onClick={() => actions.onCloseScroll()}>×</button>
      {scroll === 'ledger' && (
        <div data-scroll-body="ledger" data-testid="cultivation-seat-ledger">
          <p>{surface.scrolls.ledger.rate.base} × {surface.scrolls.ledger.rate.realmMult} × {surface.scrolls.ledger.rate.focusMult} = {surface.scrolls.ledger.rate.result} qi/s</p>
          <p>Seclusion: {surface.scrolls.ledger.clocks.seclusion} · Sojourn: {surface.scrolls.ledger.clocks.sojourn}</p>
          <p>Offline cap {surface.scrolls.ledger.offline.capHours}h · efficiency {surface.scrolls.ledger.offline.efficiency}</p>
          <p>Idle is never taxed — accrual simply pauses at the cap, and never decays.</p>
          <p>{surface.scrolls.ledger.foregroundTerms}</p>
        </div>
      )}
      {scroll === 'focus' && (
        <ul data-scroll-body="focus">
          {surface.focus.axes.map((axis) => (
            <li key={axis.id} data-axis={axis.id}>{axis.label} ({axis.glyph}) — {axis.effect}</li>
          ))}
        </ul>
      )}
      {scroll === 'ascent' && (
        <ol data-scroll-body="ascent">
          {surface.ascent.rungs.map((rung) => (
            <li key={rung.realmIndex} data-rung-state={rung.state}>{rung.name} · {rung.zh} — {rung.detail}</li>
          ))}
        </ol>
      )}
      {scroll === 'gatereadiness' && surface.breakthrough.gateReadiness && (
        <div data-scroll-body="gatereadiness">
          {surface.breakthrough.gateReadiness.checks.map((c) => (
            <p key={c.id} data-check={c.id} data-state={c.state}>{c.label}: {c.value}</p>
          ))}
        </div>
      )}
    </div>
  );
}
