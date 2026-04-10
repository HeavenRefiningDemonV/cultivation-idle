import { getWorldRoutingChipLabel, type WorldRoutingChipKind } from '../../systems/world/moduleCardRegistry.js';
import { WORLD_SUPPORT_ART_ASSET_URLS } from '../../assets/ui/chrome/world_labels/index.js';

export function WorldRouteChip(props: {
  kind: WorldRoutingChipKind;
  label?: string;
  tone?: 'strong' | 'support' | 'neutral';
}) {
  const { kind, label, tone = 'neutral' } = props;
  const supportArtStyle = tone === 'neutral'
    ? undefined
    : { backgroundImage: `url(${WORLD_SUPPORT_ART_ASSET_URLS.routeHintPlaque})` };
  return (
    <span className={`worldRouteChip worldRouteChip--${tone}`} data-kind={kind} style={supportArtStyle}>
      {label ?? getWorldRoutingChipLabel(kind)}
    </span>
  );
}
