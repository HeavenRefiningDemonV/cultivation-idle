import { useCallback, type MouseEvent } from 'react';
import type { PanoplyExactSurfaceV1 } from '../../../systems/ui/equipment/equipmentExactTypes.js';
import { PANOPLY_SVG_DEFS } from './panoplySvgDefs.js';
import { figureSceneSVG, motesFor } from './panoplyFigureSvg.js';

/**
 * M.III.3 EQ-PORT — the figure-scene injector (mirrors `CultivationScene`). Injects `PANOPLY_SVG_DEFS` ONCE
 * (hidden host), then the per-path `figureSceneSVG(...)` into `__fieldHost` via dangerouslySetInnerHTML, with
 * a deterministic motes sibling layer. Render-only: no store import; the click is delegated upward as an
 * intent (the worn slot's `data-instance-id`). Reduced-motion is frozen by CSS (the @media law).
 */
export interface PanoplyFigureSceneProps {
  panoply: PanoplyExactSurfaceV1;
  focusId: string | null;
  onSlotClick?: (instanceId: string) => void;
}

export function PanoplyFigureScene({ panoply, focusId, onSlotClick }: PanoplyFigureSceneProps) {
  const field = figureSceneSVG(panoply, focusId);
  const motes = motesFor(panoply.pathLean);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!onSlotClick) return;
      const hit = (e.target as Element).closest('[data-instance-id]');
      const id = hit?.getAttribute('data-instance-id');
      if (id) onSlotClick(id);
    },
    [onSlotClick],
  );

  return (
    <div className="panoplyFigureScene figscene" data-path={panoply.pathLean} onClick={handleClick}>
      <div
        className="panoplyFigureScene__defs"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: PANOPLY_SVG_DEFS }}
      />
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
