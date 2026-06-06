import {
  CircleDot,
  Clock3,
  Droplet,
  Flame,
  Hexagon,
  Leaf,
  Moon,
  Mountain,
  Snowflake,
  Sparkles,
  Sun,
  Tornado,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import type {
  StatusLedgerActionSurface,
  StatusSpiritRootElement,
  StatusSpiritRootSurface,
} from '../../../systems/ui/status/statusLedgerTypes.js';
import { StatusActionButton } from './StatusLedgerRows.js';

const ELEMENT_ICONS: Record<StatusSpiritRootElement, LucideIcon> = {
  wood: Leaf,
  fire: Flame,
  earth: Mountain,
  metal: Hexagon,
  water: Droplet,
  wind: Wind,
  lightning: Zap,
  ice: Snowflake,
  light: Sun,
  shadow: Moon,
  soul: Sparkles,
  void: CircleDot,
  time: Clock3,
  astral: Tornado,
  dormant: CircleDot,
};

export function StatusSpiritRootBadge({
  spiritRoot,
  compact = false,
  onAction,
}: {
  spiritRoot: StatusSpiritRootSurface;
  compact?: boolean;
  onAction?: (action: StatusLedgerActionSurface) => void;
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
      {spiritRoot.observationAction && onAction ? (
        <StatusActionButton action={spiritRoot.observationAction} onAction={onAction} compact />
      ) : null}
    </div>
  );
}
