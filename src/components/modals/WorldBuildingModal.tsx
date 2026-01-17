import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useContentStore } from '../../stores/contentStore';
import { useUIStore, type WorldBuildingKey } from '../../stores/uiStore';
import { resolveModuleRef } from '../screens/world/worldUtils';
import { ManualPavilionPanel } from '../screens/ManualPavilionPanel';
import { ApothecaryPanel } from '../screens/ApothecaryPanel';
import { AlchemyPanel } from '../screens/AlchemyPanel';
import { ForgeWorkshop } from '../../features/professions/forge/ForgeWorkshop';
import { TalismanPanel } from '../screens/TalismanPanel';
import { BountyBoardPanel } from '../screens/BountyBoardPanel';
import { ExpeditionBoardPanel } from '../screens/ExpeditionBoardPanel';
import { GateTrialModal } from './GateTrialModal';
import { OutskirtsModal } from './OutskirtsModal';
import { isCombatModule } from '../../systems/world/openWorldModule';
import hammer from "../../assets/onscreen/hammer.png";
import './WorldBuildingModal.scss';

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
  const close = isStoreMode ? closeFromStore : controlledOnClose || (() => { });
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

  const backgroundVariant = useMemo(() => {
    switch (buildingKey) {
      case 'alchemy':
        return 'alchemy';
      case 'apothecary':
        return 'apothecary';
      case 'bounties':
      case 'expeditions':
        return 'bounty-board';
      case 'gateTrial':
      case 'ruins':
      case 'outskirts':
        return 'inside-dungeon';
      case 'forge':
        return 'forge';
      default:
        return 'default';
    }
  }, [buildingKey]);

  if ((isStoreMode && (!storeOpen || !storeCityId || !buildingKey)) || (!isStoreMode && !open)) {
    return null;
  }

  let content: ReactNode = children;

  if (isStoreMode) {
    switch (buildingKey) {
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
        content = <ForgeWorkshop cityId={storeCityId} />;
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
      case 'outskirts':
        content = <OutskirtsModal cityId={storeCityId} />;
        break;
      case 'gateTrial':
        content = <GateTrialModal cityId={storeCityId} />;
        break;

      default:
        content = isCombatModule(buildingKey)
          ? null
          : (
            <div className="worldBuildingPlaceholder">Not implemented yet ({buildingKey})</div>
          );
        break;
    }
  }

  return (
    <div className="worldBuildingOverlay" role="dialog" aria-modal="true" onMouseDown={close}>
      <div
        className={`worldBuildingModal worldBuildingModal--${backgroundVariant}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {backgroundVariant === "forge" && <img className="hammer" src={hammer}></img>}
        <button type="button" className="worldBuildingClose" onClick={close} aria-label="Close">
          ✕
        </button>
        <div className="worldBuildingBody">{content}</div>
      </div>
    </div>
  );
}
