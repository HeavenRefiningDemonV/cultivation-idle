import { type ReactNode } from 'react';
import classNames from 'classnames';
import { useRitualMotion } from '../status/observatory/fx/useRitualMotion.js';
import type { RitualModalSurfaceV1, RitualRite } from '../../systems/ui/modals/ritualFrameTypes.js';
import { ModalShell } from '../modals/ModalShell.js';
import { MiniIcon } from '../modals/modalMarks.js';
import {
  RitualSceneDefs,
  SceneBreakthrough,
  SceneTribulation,
  SceneReincarnation,
  SceneRootUpgrade,
  SceneEcho,
} from '../ritual/index.js';
import '../ritual/ritualScene.scss';
import './RitualCeremonyShell.scss';

/**
 * F2.UI — the Ritual Ceremony shell (儀), a faithful port of the modal-stage.html `.rite` (renderRitual):
 * the gold-framed box, the lintel chop + skip/not-yet, the hand-built SVG rite stage, the held outcome
 * reveal, the never-regress stakes panel, and the exit rail — rendered inside the bespoke ModalShell so
 * it matches the mockup exactly. RENDER-ONLY: no gameplay store, no mutation; every action forwards the
 * OPAQUE intent the surface carries via `onIntent`. The scenes are render-only SVG art bound to `rite`.
 */

export interface RitualCeremonyShellProps {
  open: boolean;
  surface: RitualModalSurfaceV1;
  /** Forwarded intents: the shell calls onIntent(surface.skipIntent | exitIntent | confirmIntent). */
  onIntent: (intent: string) => void;
  /** The "not yet" / withdraw close. */
  onClose: () => void;
}

const RITE_SUB: Record<RitualRite, string> = {
  breakthrough: 'the stage-crossing within a realm',
  tribulation: "heaven's test at the major breakthrough",
  echo: 'a karmic mark, granted and acknowledged',
  lifeSummary: 'the life recounted, the soul carried forward',
  rootUpgrade: 'the rare-treasure rite — fully deterministic',
};

export function RitualCeremonyShell({ open, surface, onIntent, onClose }: RitualCeremonyShellProps) {
  const { animate } = useRitualMotion();
  if (!open) return null;

  const outcome = surface.outcome;
  const isNotYet = outcome?.kind === 'not-yet';
  const success = outcome?.kind === 'success';
  const isSummary = surface.rite === 'lifeSummary';
  const isEcho = surface.rite === 'echo';

  // skin: cinnabar danger (postfail) only for tribulation; warm-bronze for the prestige register.
  const skin = surface.rite === 'tribulation' ? 'postfail' : surface.riteState === 'prestige' ? 'prestige' : 'default';
  const chopClass = surface.rite === 'tribulation' || isEcho ? 'cinn' : isSummary ? 'bronze' : '';
  const exitLabel = isSummary ? 'Begin the next life' : isEcho || surface.rite === 'rootUpgrade' ? 'Acknowledge' : isNotYet ? 'Return' : 'Continue';

  const renderScene = () => {
    switch (surface.rite) {
      case 'breakthrough':
        return <SceneBreakthrough success={success} stage={surface.scene?.breakthroughStage ?? (success ? 4 : 3)} />;
      case 'tribulation':
        return <SceneTribulation success={success} />;
      case 'lifeSummary':
        return <SceneReincarnation />;
      case 'rootUpgrade':
        return <SceneRootUpgrade fromGrade={surface.scene?.rootFromGrade ?? 2} toGrade={surface.scene?.rootToGrade ?? 4} />;
      case 'echo':
        return <SceneEcho />;
      default:
        return null;
    }
  };

  // ——— the held outcome reveal ———
  let revealMain: ReactNode;
  if (isSummary && surface.summary) {
    revealMain = (
      <div className="reveal-main decree" data-ceremony-zone="reveal" data-outcome="summary">
        <div className="rv-eyebrow"><MiniIcon name="wheel" /> {outcome?.eyebrow ?? 'The wheel turns'}</div>
        <div className="rv-title">{outcome?.title ?? 'A life remembered'}{outcome?.titleCjk ? <span className="rk">{outcome.titleCjk}</span> : null}</div>
        <div className="rv-body" style={{ marginBottom: 8 }}>This life's deeds, summed forward:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
          {surface.summary.deeds.map((d, i) => (
            <div key={i} className="micro" style={{ display: 'flex', gap: 7, alignItems: 'center' }}><span aria-hidden="true" style={{ color: 'var(--paper-gold-deep)' }}>◆</span> {d}</div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="chip gold" style={{ fontSize: 12, padding: '5px 12px' }}>{surface.summary.ap}</span>
          <span className="micro" style={{ fontStyle: 'italic' }}>{surface.summary.pathPrompt}</span>
        </div>
      </div>
    );
  } else {
    const cls = isEcho ? 'decree' : isNotYet ? 'notyet' : 'success';
    const ic = success && !isEcho ? 'shield' : isNotYet ? 'quiet' : 'star';
    revealMain = (
      <div className={`reveal-main ${cls}`} data-ceremony-zone="reveal" data-outcome={outcome?.kind ?? 'pending'}>
        <div className="rv-eyebrow"><MiniIcon name={ic} /> {outcome?.eyebrow ?? (isNotYet ? 'Not yet' : 'Success')}{surface.skipped ? <span className="skipped-tag">skipped</span> : null}</div>
        <div className="rv-title">{outcome?.title ?? surface.riteName}{outcome?.titleCjk ? <span className="rk">{outcome.titleCjk}</span> : null}</div>
        {outcome?.body ? <div className="rv-body">{outcome.body}</div> : null}
        {isNotYet && typeof outcome?.pityPercent === 'number' ? (
          <div className="rv-pity"><MiniIcon name="gain" /> {outcome.pityGained ?? 'Pity'}: <span className="pbar"><i style={{ width: `${Math.max(0, Math.min(100, outcome.pityPercent))}%` }} /></span> {outcome.pityPercent}%</div>
        ) : null}
      </div>
    );
  }

  // ——— the never-regress stakes panel (present in EVERY rite) ———
  const danger = surface.rite === 'tribulation';
  const stakesPanel = (
    <div className="stakes" data-ceremony-zone="stakes">
      <div className="sk-h"><MiniIcon name="scroll" /> The stakes · what this rite touches</div>
      <div className="sk-row">
        <div className="sk-ic"><MiniIcon name={danger ? 'warn' : 'quiet'} /></div>
        <div><div className="sk-k" style={danger ? { color: 'var(--paper-cinnabar-deep)' } : undefined}>Risked</div><div className="sk-v">{surface.stakes.risked.join(' ')}</div></div>
      </div>
      <div className="sk-row">
        <div className="sk-ic"><MiniIcon name="gain" /></div>
        <div><div className="sk-k">Gained</div><div className="sk-v">{surface.stakes.gained.join(' ')}</div></div>
      </div>
      <div className="sk-row">
        <div className="sk-ic"><MiniIcon name="shield" /></div>
        <div><div className="sk-k">Guaranteed</div><div className="sk-v">{surface.stakes.guaranteed.join(' ')}</div></div>
      </div>
      <div className="sk-guard" data-ceremony-zone="never-regress">
        <MiniIcon name="shield" /><span><b>{surface.neverRegress.headline}</b> {surface.neverRegress.pityNote}</span>
      </div>
    </div>
  );

  return (
    <ModalShell open={open} onClose={onClose} mode="ritual" skin={skin} still={!animate} ariaLabel={surface.riteName}>
      <div className="rite">
        <div className="rlintel" data-ceremony-zone="lintel">
          <div className={classNames('lchop', chopClass)} aria-hidden="true"><span>{surface.riteTag}</span></div>
          <div className="lname"><div className="rn">{surface.riteName}</div><div className="rs">{RITE_SUB[surface.rite]}</div></div>
          <div className="lctl">
            <button type="button" className="btn ghost" onClick={() => onIntent(surface.skipIntent)} data-ceremony-action="skip">Skip to result</button>
            <button type="button" className="btn ghost" onClick={onClose}>Not yet</button>
          </div>
        </div>

        <div className={classNames('rstage', skin !== 'default' && `rstage--${skin}`)} data-ceremony-zone="stage" data-rite={surface.rite} data-scene-skin={skin}>
          <RitualSceneDefs />
          {renderScene()}
          <div className="stage-vig" aria-hidden="true" />
          <div className="skip-fab">
            <button type="button" className="btn ghost" style={{ fontSize: 11, padding: '6px 12px' }} onClick={() => onIntent(surface.skipIntent)} data-ceremony-action="skip-fab">Skip</button>
          </div>
        </div>

        <div className="reveal">
          {revealMain}
          {stakesPanel}
        </div>

        <div className="rexit" data-ceremony-zone="exit">
          <span className="rx-note"><MiniIcon name="shield" /> The reveal is reachable and readable regardless of motion — nothing is motion-only.</span>
          <div className="spacer" />
          <button type="button" className="btn jade big" onClick={() => onIntent(surface.exitIntent)}>{exitLabel} ▸</button>
        </div>

        <div className="gframe" aria-hidden="true" /><div className="gframe2" aria-hidden="true" />
        <div className="gc tl" aria-hidden="true" /><div className="gc tr" aria-hidden="true" /><div className="gc bl" aria-hidden="true" /><div className="gc br" aria-hidden="true" />
      </div>
    </ModalShell>
  );
}
