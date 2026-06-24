import type { PanoplyExactSurfaceV1 } from '../../../systems/ui/equipment/equipmentExactTypes.js';
import { figureSceneSVG, motesFor } from './panoplyFigureSvg.js';

/**
 * M.III.3 EQ-PORT — the figure-scene injector (mirrors `CultivationScene`'s field host). PURE injector:
 * renders `figureSceneSVG(...)` into `__fieldHost` via dangerouslySetInnerHTML + a deterministic motes
 * sibling layer. The shared `PANOPLY_SVG_DEFS` and ALL click-delegation live at the screen's stage root
 * (so the vault's emblems also resolve their `url(#)` refs, and one handler routes every intent). The worn
 * slot's `data-instance-id` is delegated by the stage. Reduced-motion is frozen by CSS (the @media law).
 */
export interface PanoplyFigureSceneProps {
  panoply: PanoplyExactSurfaceV1;
  focusId: string | null;
}

export function PanoplyFigureScene({ panoply, focusId }: PanoplyFigureSceneProps) {
  const field = figureSceneSVG(panoply, focusId);
  const motes = motesFor(panoply.pathLean);
  return (
    <div className="figscene panoplyFigureScene" data-path={panoply.pathLean}>
      <div className="panoplyFigureScene__fieldHost" dangerouslySetInnerHTML={{ __html: field }} />
      {motes.map((m, i) => (
        <span
          key={i}
          className="mote"
          style={{
            left: m.left,
            bottom: m.bottom,
            animationDelay: m.delay,
            animationDuration: m.duration,
            ...(m.heaven ? { background: 'radial-gradient(circle at 35% 30%,#eaf2ff,#9fc4e6 60%,transparent 75%)' } : {}),
          }}
        />
      ))}
    </div>
  );
}
