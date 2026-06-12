import { useRitualMotion } from './fx/useRitualMotion.js';
import { observatoryThreadKey } from './observatorySelectionModel.js';
import { useObservatorySelection } from './useObservatorySelection.js';
import type { StatusCausalThreadSurface } from '../../../systems/ui/status/statusObservatoryTypes.js';

/** Synthetic in-canopy thread geometry — lifted verbatim from the canopy. */
function threadPath(thread: StatusCausalThreadSurface, index: number): string {
  const startY = 18 + ((index * 13) % 58);
  const startX = thread.fromFamily === 'statConstellation' ? 4 : 0;
  const targetY = 45 + ((index % 3) - 1) * 8;
  const controlX = 28 + (index % 2) * 10;
  return `M${startX} ${startY} C${controlX} ${startY} ${controlX + 18} ${targetY} 50 ${targetY}`;
}

export interface StatusCausalThreadLayerProps {
  threads: readonly StatusCausalThreadSurface[];
  className?: string;
  /** how many threads to draw; preserves the canopy's slice(0, 8) default. */
  limit?: number;
}

/**
 * Faint always-on causal-thread overlay, extracted from the Bottleneck Canopy.
 * Each thread keeps its verbatim testid + data-* anchors and the existing
 * `statusBottleneckTalismanCanopy__thread` class (so the established tone SCSS
 * still applies); the only new attribute is `data-related`, which brightens the
 * subset whose thread sits on the shared selection. Endpoints carry shape +
 * <title>, so brightening is enhancement, never the only signal. The glint
 * travel is gated by `data-flourish` (reduced motion => static). aria-hidden.
 */
export function StatusCausalThreadLayer({ threads, className, limit = 8 }: StatusCausalThreadLayerProps) {
  const { relatedKeys } = useObservatorySelection();
  const { flourish } = useRitualMotion();
  const shown = threads.slice(0, limit);
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      data-flourish={flourish ? 'true' : 'false'}
    >
      {shown.map((thread, index) => (
        <path
          key={thread.id}
          className="statusBottleneckTalismanCanopy__thread"
          data-testid="status-bottleneck-thread"
          data-thread-id={thread.id}
          data-from-family={thread.fromFamily}
          data-to-family={thread.toFamily}
          data-tone={thread.tone}
          data-related={relatedKeys.has(observatoryThreadKey(thread.id)) ? 'true' : 'false'}
          d={threadPath(thread, index)}
          pathLength={1}
        >
          <title>{`${thread.label}: ${thread.detail}`}</title>
        </path>
      ))}
    </svg>
  );
}
