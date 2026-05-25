import type {
  StatusLedgerActionSurface,
  StatusLedgerSurfaceV1,
} from '../../../systems/ui/status/statusLedgerTypes.js';
import { StatusDoctrineTile, StatusDoctrineTileGrid } from './StatusDoctrineTiles.js';
import { SafeStatusIcon, StatusActionButton } from './StatusLedgerRows.js';
import { StatusSpiritRootBadge } from './StatusSpiritRootBadge.js';

interface StatusLedgerHeroProps {
  hero: StatusLedgerSurfaceV1['hero'];
  onAction: (action: StatusLedgerActionSurface) => void;
}

export function StatusLedgerHero({ hero, onAction }: StatusLedgerHeroProps) {
  return (
    <section className="statusLedgerHero" data-testid="status-ledger-hero" aria-label="Cultivator status">
      <div className="statusLedgerHero__identity" data-testid="status-ledger-hero-identity">
        <span className="statusLedgerHero__crest" aria-hidden="true">
          <SafeStatusIcon icon="placeholderRingLarge" size={38} />
        </span>
        <span className="statusLedgerHero__identityCopy">
          <span className="statusLedgerEyebrow">Realm</span>
          <h1>{hero.realmName}</h1>
          <strong>{hero.stageText}</strong>
          <small>{hero.cityLabel}</small>
        </span>
      </div>

      <div className="statusLedgerHero__doctrine" data-testid="status-ledger-hero-doctrine" aria-label="Identity & Doctrine">
        <StatusDoctrineTileGrid tiles={[hero.pathTile, hero.heartLawTile]} compact>
          <div className="statusDoctrineTile statusDoctrineTile--spirit-root">
            <StatusSpiritRootBadge spiritRoot={hero.spiritRoot} compact />
          </div>
          <StatusDoctrineTile tile={hero.focusTile} compact />
          <StatusDoctrineTile tile={hero.breathTile} compact />
        </StatusDoctrineTileGrid>
      </div>

      <div className="statusLedgerHero__goal" data-testid="status-ledger-hero-goal">
        <span className="statusLedgerEyebrow">Next Major Goal</span>
        <h2>{hero.nextMajorGoalLabel}</h2>
        <p>{hero.nextMajorGoalDetail}</p>
        <span className="statusLedgerHero__bottleneck">
          <strong>Main Bottleneck</strong>
          <span>{hero.mainBottleneckLabel}</span>
          <small>{hero.mainBottleneckDetail}</small>
        </span>
        {hero.primaryAction ? (
          <span className="statusLedgerHero__action" data-testid="status-ledger-primary-action">
            <StatusActionButton action={hero.primaryAction} onAction={onAction} />
          </span>
        ) : null}
      </div>
    </section>
  );
}
