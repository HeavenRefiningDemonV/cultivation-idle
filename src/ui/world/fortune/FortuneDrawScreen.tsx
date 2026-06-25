import { useCallback, type MouseEvent } from 'react';
import { useObservatoryScale } from '../../status/observatory/useObservatoryScale.js';
import './fortuneDraw.scss';
import type { FortuneDrawSurfaceV1 } from '../../../systems/ui/fortune/fortuneDrawTypes.js';
import { FORTUNE_DRAW_SVG_DEFS } from './fortuneDrawSvgDefs.js';
import { renderFate, renderHeader, renderInspector, renderLectern, renderSatchel } from './fortuneDrawInstrumentsHtml.js';

/**
 * M.IV.3 ARTS-PORT — the render-only Fortune Draw stage, 1:1 with the artifact's `render()` (the 2048×1152
 * stage · room chop · lintel header · fate/lectern/inspector main row · satchel footer). Props ONLY; every
 * value traces to a `FortuneDrawSurfaceV1` field. FORTUNE_DRAW_SVG_DEFS is injected ONCE so the lectern scene,
 * the spindle, and every seal resolve their `url(#)` refs. ONE delegated click routes every intent
 * (scroll → select, draw/reroll/buy/altar → action). The `display:contents` wrappers keep each section's
 * `.panel` as a DIRECT grid child of `.fortuneRoot` (so the 116/1fr/58 rows land exactly as the artifact).
 */
export interface FortuneDrawActions {
  onSelect: (stockId: number) => void;
  onAction: (route: string) => void;
}

export interface FortuneDrawScreenProps {
  surface: FortuneDrawSurfaceV1;
  actions: FortuneDrawActions;
}

const inject = (html: string) => ({ __html: html });
const CONTENTS = { display: 'contents' } as const;

export function FortuneDrawScreen({ surface, actions }: FortuneDrawScreenProps) {
  const { viewportRef, scale } = useObservatoryScale();

  const onStageClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const el = (e.target as Element).closest('[data-stock],[data-action]');
      if (!el) return;
      const stock = el.getAttribute('data-stock');
      if (stock !== null) { actions.onSelect(Number(stock)); return; }
      const action = el.getAttribute('data-action');
      if (action) {
        if ((el as HTMLButtonElement).disabled) return;
        actions.onAction(action);
      }
    },
    [actions],
  );

  return (
    <div className="fortuneFit" ref={viewportRef}>
      <div
        className="fortuneRoot"
        style={{ transform: `scale(${scale})` }}
        data-state={surface.visualState}
        onClick={onStageClick}
      >
        <div className="fortuneDefs" aria-hidden="true" dangerouslySetInnerHTML={inject(FORTUNE_DRAW_SVG_DEFS)} />
        <div className="tag"><span>法<br />緣<br />堂</span></div>
        <div style={CONTENTS} dangerouslySetInnerHTML={inject(renderHeader(surface))} />
        <div className="mainrow" data-testid="fortune-mainrow" dangerouslySetInnerHTML={inject(renderFate(surface) + renderLectern(surface) + renderInspector(surface))} />
        <div style={CONTENTS} dangerouslySetInnerHTML={inject(renderSatchel(surface))} />
      </div>
    </div>
  );
}
