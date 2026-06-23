import type { CultivationSeatSurfaceV1 } from '../../../systems/ui/cultivation/cultivationSeatTypes.js';
import { resolveCultivationSeatPresentation } from '../../../systems/ui/cultivation/cultivationSeatPresentation.js';
import type { CultivationSeatActions } from '../../../features/cultivation/seat/useCultivationSeatActionController.js';
import { useObservatoryScale, OBS_STAGE_WIDTH, OBS_STAGE_HEIGHT } from '../../status/observatory/useObservatoryScale.js';
import { CultivationScene } from './scene/CultivationScene.js';
import {
  buildFocusDialSvg,
  buildPathInstrumentSvg,
  buildAscentSvg,
  buildWaxSealSvg,
} from './scene/cultivationSeatInstrumentsSvg.js';
import { CultivationSeatScrolls } from './scrolls/CultivationSeatScrolls.js';
import { CultivationBreakthroughHost } from './CultivationBreakthroughHost.js';
import './cultivationSeat.scss';

const SVG = (html: string) => ({ __html: html });

const TREASURE_GLYPHS = { jing: { g: '精', nm: 'Body' }, qi: { g: '氣', nm: 'Energy' }, shen: { g: '神', nm: 'Spirit' } } as const;

/** The gold affordance cue (C1) — faint on every tappable instrument, brightens on hover/focus. */
function Cue() {
  return (
    <span className="cue" aria-hidden="true">
      <svg viewBox="0 0 12 12" width="11" height="11"><path d="M1.5 4.5V1.5H4.5M7.5 1.5H10.5V4.5M10.5 7.5V10.5H7.5M4.5 10.5H1.5V7.5" fill="none" stroke="#3a2a0e" strokeWidth="1.4" strokeLinecap="round" /></svg>
    </span>
  );
}

/**
 * M.II.3 Wave 3 — the Seat screen on a fixed 2048×1152 scaled stage (the Observatory scale
 * pattern). The scene paints full-bleed; the floating instruments are SVG objects at the
 * artifact's exact coordinates; the chrome and the gate diagnosis are diegetic overlays; the
 * scrolls pop over everything. Render-only: zero store reads, zero gameplay math — it reads the
 * surface and emits intents. The app shell owns the bottom nav (§10.3), so the Seat is the
 * scene + lintel + breath + instruments only.
 */
export function CultivationSeatScreen({ surface, actions }: { surface: CultivationSeatSurfaceV1; actions: CultivationSeatActions }) {
  const presentation = resolveCultivationSeatPresentation(surface);
  const { meta, identity, scene, idle, focus, realmProgress, breakthrough, instrument } = surface;
  const gate = breakthrough.gateReadiness;
  const scroll = actions.selectedScroll;
  const { viewportRef, scale } = useObservatoryScale();

  const emphasisIndex = Math.max(0, focus.axes.findIndex((a) => a.id === focus.emphasisId));
  const dialAxes = focus.axes.map((a) => ({ glyph: a.glyph }));

  return (
    <div
      className="cultivationSeatRoot"
      ref={viewportRef}
      data-testid={meta.rootTestId}
      data-path={meta.path}
      data-realm={identity.realmIndex}
      data-visual-state={meta.visualState}
      data-reduced-motion={meta.reducedMotion ? 'true' : 'false'}
    >
      <p className="cultivationSeatLive" role="status" aria-live="polite">{presentation.visualStateLabel}</p>

      <div className="cultivationSeatStage" data-path={meta.path} style={{ width: OBS_STAGE_WIDTH, height: OBS_STAGE_HEIGHT, transform: `scale(${scale})` }}>
        {/* ── the full-bleed painting ── */}
        <CultivationScene surface={surface} />

        {/* ── LINTEL (the identity bar — Group A) ── */}
        <header data-region="lintel">
          <div className="gildrule" aria-hidden="true" />
          <span className="cultivationSeatChop" data-pathchop={meta.path} aria-hidden="true">{identity.pathGlyph}</span>
          <span className="nameblock">
            <span className="roomsub">{identity.roomSub}</span>
            <span className="roomtitle">
              {identity.roomTitle}
              <span className="cultivationSeatWax" aria-hidden="true" dangerouslySetInnerHTML={SVG(buildWaxSealSvg('修', 30, -6, meta.path === 'heaven'))} />
            </span>
            <span className="realmline">
              <span className="realmname">{identity.realmName} · {identity.realmZh}</span>
              <span className="stagepips" aria-hidden="true">
                {identity.stagePips.map((p) => <span key={p.index} className={`sp${p.on ? ' on' : ''}${p.current ? ' cur' : ''}`} />)}
              </span>
              <span className="stagetxt">{identity.stageLabel}</span>
            </span>
          </span>
          <span className="spacer" />
          <span className="fgchip" data-foreground={scene.foreground}><span className="dot" aria-hidden="true" />{scene.foregroundLabel}</span>
        </header>

        {/* ── BREATH-LINE (the idle read; the whole band opens the ledger) ── */}
        <button type="button" data-region="breath-line" data-testid="cultivation-seat-breathline" onClick={() => actions.onOpenScroll('ledger')}>
          <span className="brrule" aria-hidden="true" />
          {!meta.reducedMotion && <span className="light" aria-hidden="true" />}
          <span className="brread"><span className="coin">率</span><span className="v big">{idle.qiPerSec}</span><span className="l">qi / s</span></span>
          <span className="brread"><span className="coin">藏</span><span className="v">{idle.offlineCapLabel}</span><span className="l">offline cap</span></span>
          <span className="brread"><span className="coin">風</span><span className="v">{idle.offlineEfficiency}</span><span className="l">offline efficiency</span></span>
          <span className={`brread${idle.combatHeld ? ' heldmark' : ' last'}`}><span className="coin">業</span><span className="v">{idle.stateWord}</span><span className="l">the Seat is —</span></span>
          {idle.combatHeld && (
            <span className="brread heldmark last"><span className="coin coin--cinn">戰</span><span className="v">combat</span><span className="l">resumes after</span></span>
          )}
          <span className="expandhint">touch for the ledger ↗</span>
        </button>

        {/* ── FLOATING INSTRUMENTS (positioned at the artifact coordinates) ── */}
        <div data-region="instruments">
          {/* Focus Dial — the jade compass (6 canonical axes + Balanced; emphasis set in the scroll) */}
          <button type="button" className="cultivationSeatInst" data-instrument="focus-dial" data-testid="cultivation-seat-focus" style={{ left: 150, top: 494 }} aria-label="Open the Focus dial" onClick={() => actions.onOpenScroll('focus')}>
            <span className="cultivationSeatInst__svg" dangerouslySetInnerHTML={SVG(buildFocusDialSvg(dialAxes, emphasisIndex, meta.reducedMotion))} />
            <Cue />
            <span className="cultivationSeatInst__cap"><i>Emphasis · tap a spoke</i>{focus.axes.find((a) => a.id === focus.emphasisId)?.label} · {focus.leanCaption}</span>
          </button>

          {/* Per-path unique instrument */}
          <button
            type="button"
            className="cultivationSeatInst"
            data-instrument="path-mechanic"
            data-kind={instrument.kind}
            style={{ left: 1716, top: 520 }}
            aria-label={`Open ${instrument.label}`}
            onClick={() => actions.onOpenScroll(instrument.kind === 'heaven' ? 'premonition' : instrument.kind === 'earth' ? 'beastlore' : 'weaponbond')}
          >
            <span className="cultivationSeatInst__svg" dangerouslySetInnerHTML={SVG(buildPathInstrumentSvg(meta.path, scene.figureBeat, meta.reducedMotion))} />
            <Cue />
            <span className="cultivationSeatInst__label">{instrument.label}</span>
            <span className="cultivationSeatInst__val">{instrument.valLabel}</span>
          </button>

          {/* Ascent thread */}
          <button type="button" className="cultivationSeatInst" data-instrument="ascent" style={{ left: 14, top: 236 }} aria-label="Open the Ascent ladder" onClick={() => actions.onOpenScroll('ascent')}>
            <span className="cultivationSeatInst__svg" dangerouslySetInnerHTML={SVG(buildAscentSvg(identity.realmIndex, identity.atPeak, meta.reducedMotion))} />
            <Cue />
            <span className="cultivationSeatInst__label" style={{ marginTop: 2 }}>Ascent</span>
          </button>

          {/* Three Treasures triad → Status (B1: native React medallions; B2: caption is a separate element) */}
          <button type="button" className="cultivationSeatTriad" data-instrument="treasures" style={{ left: 744, top: 430 }} aria-label="Open the full constellation in Status" onClick={() => actions.onDeepLink('status.constellation')}>
            {(['jing', 'qi', 'shen'] as const).map((k) => (
              <span key={k} className={`cultivationSeatTriad__tre${surface.treasures.lead === k ? ' is-lead' : ''}`}>
                <b>{TREASURE_GLYPHS[k].g}</b>
                <span className="cultivationSeatTriad__nm">{TREASURE_GLYPHS[k].nm}</span>
              </span>
            ))}
            <Cue />
          </button>
          <span className="cultivationSeatTriadCap" style={{ left: 744, top: 480 }}>Three Treasures · {surface.treasures.leadLabel}</span>

          {/* Base plate — the single dominant progress readout */}
          <div className="cultivationSeatBasePlate" data-region="base-plate" style={{ left: '50%', bottom: 180 }}>
            <span className="kai">修為</span>
            <span className="bk">Cultivation Base</span>
            <span className="bv" data-testid="cultivation-seat-progress">{idle.combatHeld ? '—' : `${Math.round(realmProgress.pct * 100)}%`}</span>
            {!idle.combatHeld && (
              <>
                <span className="bbar"><span className="bf" style={{ width: `${Math.round(realmProgress.pct * 100)}%` }} /></span>
                <span className="bsub">{realmProgress.qiText} · {realmProgress.towardLabel}</span>
              </>
            )}
          </div>

          {/* Ambient whisper line */}
          <span className="cultivationSeatWhisper" style={{ left: '50%', top: 148 }}>
            {meta.visualState === 'combatHeld'
              ? 'The seclusion holds; cultivation resumes when the fight is done.'
              : identity.atPeak
                ? gate?.verdict === 'ready'
                  ? 'The climb is complete — the gate of light has formed above you.'
                  : gate?.verdict === 'held'
                    ? 'The gate would open, but the heart is not yet still.'
                    : 'The gate nears — yet the base is not yet full.'
                : identity.fantasyLine}
          </span>

          {/* The diegetic Cultivate seal */}
          <CultivateSeal surface={surface} actions={actions} />
        </div>

        {/* ── GATE READINESS (at the Peak only) ── */}
        {gate && (
          <section data-region="gate-readiness" data-testid="cultivation-seat-gate" data-verdict={gate.verdict}>
            <h2>The crossing diagnosis</h2>
            <ul>
              {gate.checks.map((check) => (
                <li key={check.id} data-check={check.id} data-state={check.state}>{check.label}: {check.value} — {check.detail}</li>
              ))}
            </ul>
            <p data-safety-band={gate.safetyBand}>{gate.safetyOdds}</p>
            <p>Assembled from {gate.safetyTerms.join(', ')}.</p>
            {gate.pity && <p data-testid="cultivation-seat-pity">{gate.pity.banked} of {gate.pity.toGuarantee} toward a guaranteed crossing</p>}
            <p className="neverregress">A failed crossing costs no realm you have earned.</p>
            <button type="button" data-testid="cultivation-seat-commit" disabled={!gate.canCommit} onClick={() => actions.onCommitCrossing()}>
              {gate.canCommit ? 'Cross the Threshold →' : 'The crossing waits'}
            </button>
          </section>
        )}
      </div>

      {/* ── SCROLL HOST (full-viewport overlay, outside the scaled stage) ── */}
      {scroll && <CultivationSeatScrolls surface={surface} actions={actions} scroll={scroll} />}

      {/* ── BREAKTHROUGH CEREMONY (the F2 RitualCeremonyShell, Seat-scoped host) ── */}
      <CultivationBreakthroughHost surface={surface} actions={actions} />
    </div>
  );
}

function CultivateSeal({ surface, actions }: { surface: CultivationSeatSurfaceV1; actions: CultivationSeatActions }) {
  const { meta, identity, breakthrough } = surface;
  if (meta.visualState === 'combatHeld') {
    return <span className="cultivationSeatSeal" data-instrument="cultivate-seal" data-seal-state="held">Held — cultivation resumes after combat</span>;
  }
  if (identity.atPeak) {
    const ready = breakthrough.gateReadiness?.verdict === 'ready';
    return (
      <button type="button" className="cultivationSeatSeal" data-instrument="cultivate-seal" data-seal-state={ready ? 'ready' : 'blocked'} onClick={() => actions.onOpenScroll('gatereadiness')}>
        {ready ? 'Approach the Threshold →' : 'The Threshold waits'}
      </button>
    );
  }
  return (
    <button type="button" className="cultivationSeatSeal" data-instrument="cultivate-seal" data-seal-state="cultivate" onClick={() => actions.onSetForeground('cultivate')}>
      {meta.visualState === 'cultivating' ? 'Deepen the cultivation' : `Resume seclusion · ${identity.verb}`}
    </button>
  );
}
