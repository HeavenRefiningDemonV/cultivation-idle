import { PaperCard } from '../../ui/ink/index.js';
import { AlchemyPanel } from '../../components/screens/AlchemyPanel.js';
import type { ApothecaryBrewSummary } from './apothecaryPrepReadModel.js';

interface ApothecaryBrewPanelProps {
  cityId: string;
  summary: ApothecaryBrewSummary;
}

export function ApothecaryBrewPanel({ cityId, summary }: ApothecaryBrewPanelProps) {
  return (
    <div className="apothecaryBrewPanel">
      <PaperCard className="apothecarySectionCard apothecarySectionCard--intro" variant="tray">
        <div className="apothecarySectionEyebrow">Brew</div>
        <div className="apothecarySectionTitle">Convert reagents into cheaper readiness.</div>
        <div className="apothecarySectionBody">
          Buy is instant convenience. Brew is slower, but it stretches reagents and lets you build reserves from live recipes.
        </div>
        <div className="apothecarySectionMeta">
          <span>Visible recipes: {summary.recipeCount}</span>
          <span>Queued: {summary.queuedCount}</span>
          <span>Ready: {summary.readyCount}</span>
          <span>Brewing: {summary.brewingCount}</span>
        </div>
      </PaperCard>

      <AlchemyPanel cityId={cityId} embedded />
    </div>
  );
}
