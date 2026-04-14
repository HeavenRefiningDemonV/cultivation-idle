import { useEffect, useMemo, type ReactNode } from 'react';
import { useContentStore } from '../../stores/contentStore.js';
import { useUIStore, type WorldBuildingKey, type WorldBuildingModalIntent } from '../../stores/uiStore.js';
import { resolveModuleRef } from '../screens/world/worldUtils.js';
import { ManualPavilionPanel } from '../screens/ManualPavilionPanel.js';
import { ApothecaryPanel } from '../screens/ApothecaryPanel.js';
import { ForgeWorkshop } from '../../features/professions/forge/ForgeWorkshop.js';
import { BountyBoardPanel } from '../screens/BountyBoardPanel.js';
import { ExpeditionBoardPanel } from '../screens/ExpeditionBoardPanel.js';
import { isCombatModule } from '../../systems/world/openWorldModule.js';
import { GameIcon } from '../../ui/icons/index.js';
import hammer from '../../assets/onscreen/hammer.png';
import './WorldBuildingModal.scss';
import { OutskirtsBuildingPanel } from '../screens/world/buildings/OutskirtsBuildingPanel.js';
import { GateTrialBuildingPanel } from '../screens/world/buildings/GateTrialBuildingPanel.js';
import { RuinsBuildingPanel } from '../screens/world/buildings/RuinsBuildingPanel.js';
import { Modal } from '../../ui/primitives/Modal.js';
import { formatWorldModuleLabel } from '../../ui/text/playerFacingFormatters.js';
import { inspectWorldFacingModuleTarget } from '../../systems/world/liveWorldLeakAudit.js';
import { resolveWorldModalEntrySurface } from '../../systems/ui/world/worldBuildingModalEntrySurface.js';

export interface WorldBuildingModalProps {
  open?: boolean;
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  children?: ReactNode;
  useStore?: boolean;
}

export const WORLD_MODAL_LIVE_KEYS: ReadonlyArray<WorldBuildingKey> = [
  'manualPavilion',
  'apothecary',
  'forge',
  'bounties',
  'expeditions',
  'outskirts',
  'gateTrial',
  'ruins',
];

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
  const storeModalIntent = useUIStore((state) => state.worldBuildingModalIntent);
  const city = useContentStore((state) => (storeCityId ? state.maps.citiesById[storeCityId] : undefined));
  const moduleRefId = useMemo(() => resolveModuleRef(city ?? null, storeBuildingKey ?? null), [city, storeBuildingKey]);

  const isStoreMode = useStore;
  const open = isStoreMode ? storeOpen : Boolean(controlledOpen);
  const buildingKey: WorldBuildingKey | null | undefined = isStoreMode ? storeBuildingKey : undefined;
  const close = isStoreMode ? closeFromStore : controlledOnClose || (() => { });
  const buildingAudit = useMemo(
    () => (isStoreMode ? inspectWorldFacingModuleTarget(buildingKey ?? null) : { ok: true, moduleKey: buildingKey ?? null, reason: 'ok' }),
    [buildingKey, isStoreMode],
  );
  const citySupportsBuilding = useMemo(
    () => (isStoreMode ? Boolean(city && buildingKey && city.modules.includes(buildingKey)) : true),
    [buildingKey, city, isStoreMode],
  );

  useEffect(() => {
    if (!isStoreMode || !storeOpen) return;
    if (!buildingAudit.ok || !citySupportsBuilding) {
      closeFromStore();
    }
  }, [buildingAudit.ok, citySupportsBuilding, closeFromStore, isStoreMode, storeOpen]);

  const entrySurface = useMemo(
    () => resolveWorldModalEntrySurface({
      buildingKey,
      cityName: city?.name,
      intent: storeModalIntent,
      controlledTitle,
      isStoreMode,
    }),
    [buildingKey, city?.name, controlledTitle, isStoreMode, storeModalIntent],
  );

  if (
    (isStoreMode && (!storeOpen || !storeCityId || !buildingKey || !buildingAudit.ok || !citySupportsBuilding))
    || (!isStoreMode && !open)
  ) {
    return null;
  }

  let content: ReactNode = children;

  if (isStoreMode) {
    switch (buildingKey) {
      case 'manualPavilion':
        content = <ManualPavilionPanel pavilionId={moduleRefId ?? null} />;
        break;
      case 'apothecary':
        content = (
          <ApothecaryPanel
            shopId={moduleRefId ?? null}
            initialSurface={storeModalIntent?.apothecarySurface ?? 'buy'}
          />
        );
        break;
      case 'alchemy':
        content = <ApothecaryPanel shopId={moduleRefId ?? null} initialSurface="brew" />;
        break;
      case 'forge':
        content = <ForgeWorkshop cityId={storeCityId} />;
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
          : <div className="worldBuildingPlaceholder">{formatWorldModuleLabel(buildingKey)} is unavailable in this semester.</div>;
        break;
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      overlayClassName={`worldBuildingOverlay worldBuildingOverlay--${entrySurface.shellFamily}`}
      panelClassName={`worldBuildingModal worldBuildingModal--${entrySurface.backgroundVariant} worldBuildingModal--${entrySurface.shellFamily}`}
      ariaLabel={entrySurface.title}
    >
      {entrySurface.backgroundVariant === 'forge' && <img className="hammer" src={hammer} alt="" aria-hidden="true" />}
      {entrySurface.showShellClose ? (
        <button type="button" className="worldBuildingClose" onClick={close} aria-label="Close">
          <GameIcon icon="inkX" size={14} decorative />
        </button>
      ) : null}
      {entrySurface.showContextStrip ? (
        <div className="worldBuildingContext" role="presentation">
          <p className="worldBuildingTitle">{entrySurface.cityLabel} — {entrySurface.moduleLabel}</p>
          {entrySurface.contextReason ? <p className="worldBuildingSubtitle">{entrySurface.contextReason}</p> : null}
        </div>
      ) : null}
      <div className="worldBuildingBody">{content}</div>
    </Modal>
  );
}
