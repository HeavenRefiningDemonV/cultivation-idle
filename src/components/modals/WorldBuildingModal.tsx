import { useEffect, useMemo, type ReactNode } from 'react';
import { useContentStore } from '../../stores/contentStore.js';
import { useUIStore, type WorldBuildingKey } from '../../stores/uiStore.js';
import { resolveModuleRef } from '../screens/world/worldUtils.js';
import { ManualPavilionPanel } from '../screens/ManualPavilionPanel.js';
import { ForgeWorkshop } from '../../features/professions/forge/ForgeWorkshop.js';
import { BountyBoardPanel } from '../screens/BountyBoardPanel.js';
import { ExpeditionBoardPanel } from '../screens/ExpeditionBoardPanel.js';
import { isCombatModule } from '../../systems/world/openWorldModule.js';
import { GameIcon } from '../../ui/icons/index.js';
import hammer from '../../assets/onscreen/hammer.png';
import './WorldBuildingModal.scss';
import { OutskirtsBuildingPanel } from '../screens/world/buildings/OutskirtsBuildingPanel.js';
import { RuinsBuildingPanel } from '../screens/world/buildings/RuinsBuildingPanel.js';
import { Modal } from '../../ui/primitives/Modal.js';
import { formatWorldModuleLabel } from '../../ui/text/playerFacingFormatters.js';
import { inspectWorldFacingModuleTarget } from '../../systems/world/liveWorldLeakAudit.js';
import { resolveWorldModalEntrySurface } from '../../systems/ui/world/worldBuildingModalEntrySurface.js';
import { GateTrialScreenOwner } from '../../features/world/gateTrialExact/index.js';
import { ApothecaryExactScreenOwner } from '../../features/apothecary/exact/index.js';
import { ForgeExactScreenOwner } from '../../features/professions/forgeExact/index.js';
import { BountiesExactScreenOwner } from '../../features/world/bountiesExact/index.js';
import { ExpeditionsExactScreenOwner } from '../../features/world/expeditionsExact/index.js';
import { ManualPavilionScreenOwner } from '../../features/world/manualPavilionExact/index.js';
import { PERF_LABELS } from '../../services/performance/index.js';
import { PerfProfiler, useRenderCounter } from '../../services/performance/perfReact.js';

export interface WorldBuildingModalProps {
  open?: boolean;
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  children?: ReactNode;
  useStore?: boolean;
}

const NOOP_CLOSE = () => {};

const WORLD_MODAL_LIVE_KEYS: ReadonlyArray<WorldBuildingKey> = [
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
  useRenderCounter(PERF_LABELS.renderWorldBuildingModal);
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
  const close = useMemo(
    () => (isStoreMode ? closeFromStore : controlledOnClose ?? NOOP_CLOSE),
    [closeFromStore, controlledOnClose, isStoreMode],
  );
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
        content = storeModalIntent?.manualPavilionExactMode === 'legacy'
          ? <ManualPavilionPanel pavilionId={moduleRefId ?? null} />
          : (
            <ManualPavilionScreenOwner
              cityId={storeCityId}
              pavilionId={moduleRefId ?? null}
              forceFixture={storeModalIntent?.manualPavilionExactMode === 'fixture'}
            />
          );
        break;
      case 'apothecary':
        content = (
          <ApothecaryExactScreenOwner
            cityId={storeCityId}
            shopId={moduleRefId ?? null}
            forceFixture={storeModalIntent?.apothecaryExactMode === 'fixture'}
            focus={storeModalIntent?.apothecaryFocus ?? storeModalIntent?.apothecarySurface ?? 'prescription'}
          />
        );
        break;
      case 'alchemy':
        content = (
          <ApothecaryExactScreenOwner
            cityId={storeCityId}
            shopId={moduleRefId ?? null}
            forceFixture={storeModalIntent?.apothecaryExactMode === 'fixture'}
            focus="brew"
          />
        );
        break;
      case 'forge':
        content = storeModalIntent?.forgeExactMode === 'legacy'
          ? <ForgeWorkshop cityId={storeCityId} />
          : (
            <ForgeExactScreenOwner
              cityId={storeCityId}
              forceFixture={storeModalIntent?.forgeExactMode === 'fixture'}
            />
          );
        break;
      case 'bounties':
        content = storeModalIntent?.bountiesExactMode === 'legacy'
          ? <BountyBoardPanel />
          : (
            <BountiesExactScreenOwner
              cityId={storeCityId}
              forceFixture={storeModalIntent?.bountiesExactMode === 'fixture'}
            />
          );
        break;
      case 'expeditions':
        content = storeModalIntent?.expeditionsExactMode === 'legacy'
          ? <ExpeditionBoardPanel />
          : (
            <ExpeditionsExactScreenOwner
              cityId={storeCityId}
              forceFixture={storeModalIntent?.expeditionsExactMode === 'fixture'}
            />
          );
        break;
      case 'outskirts':
        content = <OutskirtsBuildingPanel cityId={storeCityId} />;
        break;
      case 'gateTrial':
        content = (
          <GateTrialScreenOwner
            cityId={storeCityId}
            trialId={moduleRefId ?? null}
            forceFixture={storeModalIntent?.gateTrialExactMode === 'fixture'}
          />
        );
        break;
      case 'ruins':
        content = <RuinsBuildingPanel cityId={storeCityId} />;
        if (storeModalIntent?.ruinsExactMode === 'fixture') {
          content = <RuinsBuildingPanel cityId={storeCityId} forceFixture />;
        }
        break;
      default:
        content = isCombatModule(buildingKey)
          ? null
          : <div className="worldBuildingPlaceholder">{formatWorldModuleLabel(buildingKey)} is unavailable in this semester.</div>;
        break;
    }
  }

  return (
    <PerfProfiler id={PERF_LABELS.renderWorldBuildingModal}>
    <Modal
      open={open}
      onClose={close}
      overlayClassName={`worldBuildingOverlay worldBuildingOverlay--${entrySurface.shellFamily}`}
      panelClassName={`worldBuildingModal worldBuildingModal--${entrySurface.backgroundVariant} worldBuildingModal--${entrySurface.shellFamily} worldBuildingModal--${entrySurface.shellMode}`}
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
      <div className={`worldBuildingBody worldBuildingBody--${entrySurface.backgroundVariant} worldBuildingBody--${entrySurface.shellFamily} worldBuildingBody--${entrySurface.shellMode}`}>{content}</div>
    </Modal>
    </PerfProfiler>
  );
}
