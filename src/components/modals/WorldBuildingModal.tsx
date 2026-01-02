import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useContentStore } from '../../stores/contentStore';
import { useUIStore, type WorldBuildingKey } from '../../stores/uiStore';
import { resolveModuleRef } from '../screens/world/worldUtils';
import { MeditationHallPanel } from '../screens/MeditationHallPanel';
import { ManualPavilionPanel } from '../screens/ManualPavilionPanel';
import { ApothecaryPanel } from '../screens/ApothecaryPanel';
import { AlchemyPanel } from '../screens/AlchemyPanel';
import { ForgePanel } from '../screens/ForgePanel';
import { TalismanPanel } from '../screens/TalismanPanel';
import { BountyBoardPanel } from '../screens/BountyBoardPanel';
import { ExpeditionBoardPanel } from '../screens/ExpeditionBoardPanel';
import './WorldBuildingModal.scss';
import { isCombatModule, openWorldModule } from '../../systems/world/openWorldModule';

export interface WorldBuildingModalProps {
  open?: boolean;
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  children?: ReactNode;
  useStore?: boolean;
}

export function WorldBuildingModal({
  open: controlledOpen,
  title: controlledTitle,
  subtitle: controlledSubtitle,
  onClose: controlledOnClose,
  children,
  useStore = true,
}: WorldBuildingModalProps) {
  const storeOpen = useUIStore((state) => state.showWorldBuildingModal);
  const storeCityId = useUIStore((state) => state.worldBuildingModalCityId);
  const storeBuildingKey = useUIStore((state) => state.worldBuildingModalKey);
  const closeFromStore = useUIStore((state) => state.closeWorldBuildingModal);
  const city = useContentStore((state) => (storeCityId ? state.maps.citiesById[storeCityId] : undefined));
  const moduleRefId = useMemo(() => resolveModuleRef(city ?? null, storeBuildingKey ?? null), [city, storeBuildingKey]);

  const isStoreMode = useStore;
  const open = isStoreMode ? storeOpen : Boolean(controlledOpen);
  const buildingKey: WorldBuildingKey | null | undefined = isStoreMode ? storeBuildingKey : undefined;
  const close = isStoreMode ? closeFromStore : controlledOnClose || (() => {});
  const title = isStoreMode
    ? `${city?.name ?? 'City'} — ${buildingKey ?? ''}`
    : controlledTitle || 'World Building';
  const subtitle = isStoreMode ? (storeCityId && buildingKey ? `${storeCityId} • ${buildingKey}` : undefined) : controlledSubtitle;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close?.();
      }
    },
    [close],
  );

  useEffect(() => {
    if (!open) return undefined;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, open]);

  useEffect(() => {
    if (!isStoreMode || !open || !storeCityId || !buildingKey) return;
    if (isCombatModule(buildingKey)) {
      openWorldModule({ cityId: storeCityId, moduleKey: buildingKey, source: 'world-building-modal' });
    }
  }, [buildingKey, isStoreMode, open, openWorldModule, storeCityId]);

  if ((isStoreMode && (!storeOpen || !storeCityId || !buildingKey)) || (!isStoreMode && !open)) {
    return null;
  }

  let content: ReactNode = children;

  if (isStoreMode) {
    switch (buildingKey) {
      case 'meditationHall':
        content = <MeditationHallPanel />;
        break;
      case 'manualPavilion':
        content = <ManualPavilionPanel pavilionId={moduleRefId ?? null} />;
        break;
      case 'apothecary':
        content = <ApothecaryPanel shopId={moduleRefId ?? null} />;
        break;
      case 'alchemy':
        content = <AlchemyPanel cityId={storeCityId} />;
        break;
      case 'forge':
        content = <ForgePanel cityId={storeCityId} />;
        break;
      case 'talismanStudio':
        content = <TalismanPanel cityId={storeCityId} />;
        break;
      case 'bounties':
        content = <BountyBoardPanel />;
        break;
      case 'expeditions':
        content = <ExpeditionBoardPanel />;
        break;
      default:
        content = isCombatModule(buildingKey)
          ? (
              <div className="worldBuildingPlaceholder">
                <div>This building now opens the combat preview.</div>
                <button
                  type="button"
                  className="worldScreenModuleButton"
                  onClick={() => openWorldModule({ cityId: storeCityId, moduleKey: buildingKey, source: 'world-building-modal' })}
                >
                  Open Combat Preview
                </button>
              </div>
            )
          : (
              <div className="worldBuildingPlaceholder">Not implemented yet ({buildingKey})</div>
            );
        break;
    }
  }

  return (
    <div className="worldBuildingOverlay" role="dialog" aria-modal="true" onMouseDown={close}>
      <div className="worldBuildingModal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="worldBuildingHeader">
          <div className="worldBuildingTitleGroup">
            <div className="worldBuildingTitle">{title}</div>
            {subtitle && <div className="worldBuildingSubtitle">{subtitle}</div>}
          </div>
          <button type="button" className="worldBuildingClose" onClick={close} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="worldBuildingBody">
          {content}
        </div>
      </div>
    </div>
  );
}
