import { useShallow } from 'zustand/shallow';

import { useContentStore } from '../../stores/contentStore';
import { useUIStore, type WorldBuildingKey } from '../../stores/uiStore';
import './WorldBuildingDockOverlay.css';

const minimizableKeys: Record<WorldBuildingKey, string | undefined> = {
  outskirts: 'Outskirts',
  gateTrial: 'Gate Trial',
  ruins: 'Ruins',
  meditationHall: undefined,
  apothecary: undefined,
  manualPavilion: undefined,
  alchemy: undefined,
  forge: undefined,
  talismanStudio: undefined,
  bounties: undefined,
  expeditions: undefined,
};

export function WorldBuildingDockOverlay() {
  const {
    showWorldBuildingModal,
    worldBuildingModalMinimized,
    worldBuildingModalCityId,
    worldBuildingModalKey,
    restoreWorldBuildingModal,
    closeWorldBuildingModal,
  } = useUIStore(
    useShallow((state) => ({
      showWorldBuildingModal: state.showWorldBuildingModal,
      worldBuildingModalMinimized: state.worldBuildingModalMinimized,
      worldBuildingModalCityId: state.worldBuildingModalCityId,
      worldBuildingModalKey: state.worldBuildingModalKey,
      restoreWorldBuildingModal: state.restoreWorldBuildingModal,
      closeWorldBuildingModal: state.closeWorldBuildingModal,
    })),
  );

  const cityName = useContentStore((state) =>
    worldBuildingModalCityId
      ? state.maps.citiesById[worldBuildingModalCityId]?.name ?? worldBuildingModalCityId
      : null,
  );

  const moduleLabel = worldBuildingModalKey ? minimizableKeys[worldBuildingModalKey] : undefined;

  const shouldShowDock =
    worldBuildingModalMinimized &&
    !showWorldBuildingModal &&
    worldBuildingModalCityId !== null &&
    Boolean(moduleLabel);

  if (!shouldShowDock) {
    return null;
  }

  return (
    <div className="worldBuildingDockOverlay">
      <div className="worldBuildingDockOverlayCard">
        <button className="worldBuildingDockOverlayButton" type="button" onClick={restoreWorldBuildingModal}>
          <div className="worldBuildingDockOverlayLabel">{moduleLabel}</div>
          <div className="worldBuildingDockOverlaySubLabel">{cityName}</div>
        </button>
        <button
          className="worldBuildingDockOverlayDismiss"
          type="button"
          onClick={closeWorldBuildingModal}
          aria-label="Dismiss combat locale preview"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
