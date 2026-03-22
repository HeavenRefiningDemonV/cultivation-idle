import { useMemo, type ReactNode } from 'react';
import { useContentStore } from '../../stores/contentStore';
import { useUIStore, type WorldBuildingKey } from '../../stores/uiStore';
import { resolveModuleRef } from '../screens/world/worldUtils';
import { ManualPavilionPanel } from '../screens/ManualPavilionPanel';
import { ApothecaryPanel } from '../screens/ApothecaryPanel';
import { ForgeWorkshop } from '../../features/professions/forge/ForgeWorkshop';
import { TalismanPanel } from '../screens/TalismanPanel';
import { BountyBoardPanel } from '../screens/BountyBoardPanel';
import { ExpeditionBoardPanel } from '../screens/ExpeditionBoardPanel';
import { isCombatModule } from '../../systems/world/openWorldModule';
import { GameIcon } from '../../ui/icons';
import hammer from "../../assets/onscreen/hammer.png";
import './WorldBuildingModal.scss';
import { OutskirtsBuildingPanel } from '../screens/world/buildings/OutskirtsBuildingPanel';
import { GateTrialBuildingPanel } from '../screens/world/buildings/GateTrialBuildingPanel';
import { RuinsBuildingPanel } from '../screens/world/buildings/RuinsBuildingPanel';
import { Modal } from '../../ui/primitives/Modal';

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
      case 'alchemy':
        content = <ApothecaryPanel shopId={moduleRefId ?? null} initialSurface={buildingKey === 'alchemy' ? 'brew' : 'buy'} />;
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
        content = <OutskirtsBuildingPanel cityId={storeCityId} />;
        break;
      case 'gateTrial':
        content = <GateTrialBuildingPanel cityId={storeCityId} />;
        break;
      case 'ruins':
        content = <RuinsBuildingPanel cityId={storeCityId} />;
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

  const showShellClose = buildingKey === 'outskirts' || buildingKey === 'gateTrial';

  return (
    <Modal
      open={open}
      onClose={close}
      overlayClassName="worldBuildingOverlay"
      panelClassName={`worldBuildingModal worldBuildingModal--${backgroundVariant}`}
      ariaLabel={title}
    >
      {backgroundVariant === "forge" && <img className="hammer" src={hammer} alt="" aria-hidden="true" />}
      {!showShellClose ? (
        <button type="button" className="worldBuildingClose" onClick={close} aria-label="Close">
          <GameIcon icon="inkX" size={14} decorative />
        </button>
      ) : null}
      <div className="worldBuildingBody">{content}</div>
    </Modal>
  );
}
