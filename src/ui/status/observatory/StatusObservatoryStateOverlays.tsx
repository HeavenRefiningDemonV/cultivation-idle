import type { ObservatoryPresentation } from '../../../systems/ui/status/statusObservatoryPresentation.js';
import './StatusObservatoryStateOverlays.scss';

export interface StatusObservatoryStateOverlaysProps {
  presentation: ObservatoryPresentation;
}

/**
 * Whole-stage state atmosphere. Renders the resolver's fx.scorchOverlay (postFailure cinnabar
 * scorch) and fx.ritualGold (prestige gold sheen) as full-stage layers — and nothing else.
 *
 * Display-only, aria-hidden chrome: no store reads/setters, no routing. The per-state DECREE STAMP
 * is owned by the Life Decree scroll (its statusLifeDecree__stateSeal — 敗 / 轉生 / …), and the
 * in-region failure-diagnosis / reincarnation-edict / cap-notice content is owned by the canopy
 * (canopyMode, W5.2). This overlay never duplicates either — it carries no chop, no edict, no route.
 * The failure/prestige truth is already exposed three non-color, non-overlay ways (decree text,
 * canopy edict, data-observatory-visual-state), so this atmosphere is redundant reinforcement only.
 *
 * Returns null when there is no FX (healthy / blocked / contentCap). Mounted inside .obsStage so it
 * shares the 1672×941 design-unit coordinate space and the --obs-scale transform → no layout shift.
 */
export function StatusObservatoryStateOverlays({ presentation }: StatusObservatoryStateOverlaysProps) {
  const { visualState, fx } = presentation;
  if (!fx.scorchOverlay && !fx.ritualGold) return null;

  return (
    <div
      className="statusObservatoryStateOverlays"
      data-testid="status-observatory-state-overlays"
      data-overlay-visual-state={visualState}
      aria-hidden="true"
    >
      {fx.scorchOverlay ? <div className="statusObservatoryStateOverlays__scorch" data-fx="scorch" /> : null}
      {fx.ritualGold ? <div className="statusObservatoryStateOverlays__ritual" data-fx="ritual" /> : null}
    </div>
  );
}
