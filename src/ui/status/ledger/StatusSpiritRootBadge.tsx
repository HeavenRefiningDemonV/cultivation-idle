import { CircleDot, Droplet, Flame, Hexagon, Leaf, Mountain, type LucideIcon } from 'lucide-react';

import type {
  StatusSpiritRootElement,
  StatusSpiritRootSurface,
} from '../../../systems/ui/status/statusLedgerTypes.js';

const ELEMENT_ICONS: Record<StatusSpiritRootElement, LucideIcon> = {
  fire: Flame,
  water: Droplet,
  earth: Mountain,
  metal: Hexagon,
  wood: Leaf,
  dormant: CircleDot,
};

export function StatusSpiritRootBadge({
  spiritRoot,
  compact = false,
}: {
  spiritRoot: StatusSpiritRootSurface;
  compact?: boolean;
}) {
  const ElementIcon = ELEMENT_ICONS[spiritRoot.element];
  const gradeLine = [
    spiritRoot.gradeLabel,
    spiritRoot.purityLabel ? `${spiritRoot.purityLabel} purity` : null,
  ].filter(Boolean).join(' · ');
  const detailLine = [
    spiritRoot.resonanceLabel,
    spiritRoot.totalMultiplierLabel,
  ].filter(Boolean).join(' · ');

  return (
    <div
      className="statusSpiritRootBadge"
      data-element={spiritRoot.element}
      data-compact={compact ? 'true' : undefined}
      aria-label={`${spiritRoot.elementLabel} Spirit Root, ${gradeLine}`}
    >
      <span className="statusSpiritRootBadge__medallion" aria-hidden="true">
        <ElementIcon size={compact ? 18 : 24} strokeWidth={2.2} />
      </span>
      <span className="statusSpiritRootBadge__copy">
        <strong>{spiritRoot.elementLabel}</strong>
        <small>{gradeLine}</small>
        {detailLine ? <em>{detailLine}</em> : null}
      </span>
    </div>
  );
}
