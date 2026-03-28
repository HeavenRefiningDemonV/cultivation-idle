import { ChromeChip, type ChromeChipTone } from '../chrome/ChromeChip.js';
import { getWorldRoutingChipLabel, type WorldRoutingChipKind } from '../../systems/world/moduleCardRegistry.js';

export function WorldRouteChip(props: {
  kind: WorldRoutingChipKind;
  label?: string;
  tone?: 'strong' | 'support' | 'neutral';
}) {
  const { kind, label, tone = 'neutral' } = props;

  const toneByKind: Record<WorldRoutingChipKind, ChromeChipTone> = {
    recommended_now: 'recommendation',
    useful_soon: 'ink',
    claim_ready: 'success',
    idle_slot: 'warning',
    build_fix: 'warning',
    gate_critical: 'danger',
    stock_low: 'warning',
    new_city: 'success',
  };

  const compatibilityTone: Record<'strong' | 'support' | 'neutral', ChromeChipTone> = {
    strong: 'recommendation',
    support: 'ink',
    neutral: toneByKind[kind],
  };

  return (
    <ChromeChip
      variant="microLabel"
      tone={compatibilityTone[tone]}
      text={label ?? getWorldRoutingChipLabel(kind)}
      className={`worldRouteChip worldRouteChip--${tone} worldRouteChip--kind-${kind}`}
      title={label ?? getWorldRoutingChipLabel(kind)}
    />
  );
}
