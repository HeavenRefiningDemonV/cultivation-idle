import { getWorldRoutingChipLabel, type WorldRoutingChipKind } from '../../systems/world/moduleCardRegistry.js';

export function WorldRouteChip(props: {
  kind: WorldRoutingChipKind;
  label?: string;
  tone?: 'strong' | 'support' | 'neutral';
}) {
  const { kind, label, tone = 'neutral' } = props;
  return (
    <span className={`worldRouteChip worldRouteChip--${tone}`} data-kind={kind}>
      {label ?? getWorldRoutingChipLabel(kind)}
    </span>
  );
}
