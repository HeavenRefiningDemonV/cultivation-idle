import type { StatusLedgerActionSurface } from '../../../systems/ui/status/statusLedgerTypes.js';
import type { StatusObservatorySurfaceV1 } from '../../../systems/ui/status/statusObservatoryTypes.js';
import { StatusObservatoryOverlayShell, type StatusOverlayGoalContext } from './StatusObservatoryOverlayShell.js';
import { StatusStatMeridianConstellation } from './StatusStatMeridianConstellation.js';

export interface StatusConstellationOverlayProps {
  open: boolean;
  surface: StatusObservatorySurfaceV1['statConstellation'];
  goal?: StatusOverlayGoalContext | null;
  onClose: () => void;
  onAction?: (action: StatusLedgerActionSurface) => void;
}

/**
 * Full-screen "Path-Adaptive Stat Meridian Constellation" overlay (artifact
 * `ovConstellation`). Reuses the in-panel constellation in its `expanded`
 * variant — full atlas with every node named, the node-state legend, and the
 * summary plaque — inside the shared overlay-shell chrome.
 */
export function StatusConstellationOverlay({ open, surface, goal, onClose, onAction }: StatusConstellationOverlayProps) {
  return (
    <StatusObservatoryOverlayShell
      open={open}
      title="Path-Adaptive Stat Meridian Constellation"
      subtitle={surface.subtitle}
      tagChars="星脈"
      sealChars="星脈"
      sealVariant="cinnabar"
      watermark="星象圖"
      goal={goal}
      onClose={onClose}
      dataTestId="status-constellation-overlay"
      ariaLabel="Path-Adaptive Stat Meridian Constellation detail"
    >
      <StatusStatMeridianConstellation surface={surface} onAction={onAction} variant="expanded" />
    </StatusObservatoryOverlayShell>
  );
}
