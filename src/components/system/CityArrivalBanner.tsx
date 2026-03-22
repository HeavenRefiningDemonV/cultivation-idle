import { useEffect } from 'react';
import { useContentStore } from '../../stores/contentStore.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import {
  getCityArrivalLesson,
  getCityArrivalQuickOpenModules,
} from '../../systems/world/cityArrivalContract.js';
import { openWorldModule } from '../../systems/world/openWorldModule.js';
import './CityArrivalBanner.scss';

const MODULE_LABELS: Record<string, string> = {
  outskirts: 'Open Outskirts',
  ruins: 'Open Ruins',
  gateTrial: 'Open Gate Trial',
};

export function CityArrivalBanner() {
  const pendingCityArrivalId = useUIStore((state) => state.pendingCityArrivalId);
  const showWorldBuildingModal = useUIStore((state) => state.showWorldBuildingModal);
  const combatPresentation = useUIStore((state) => state.combatPresentation);
  const showPerkSelectionModal = useUIStore((state) => state.showPerkSelectionModal);
  const showOfflineProgressModal = useUIStore((state) => state.showOfflineProgressModal);
  const showManualSatchelModal = useUIStore((state) => state.showManualSatchelModal);
  const showTechniqueLearnedModal = useUIStore((state) => state.showTechniqueLearnedModal);
  const citiesById = useContentStore((state) => state.maps.citiesById);
  const city = pendingCityArrivalId ? citiesById[pendingCityArrivalId] : null;
  const acknowledgeCityArrival = useCityStore((state) => state.acknowledgeCityArrival);
  const clearCityArrival = useUIStore((state) => state.clearCityArrival);

  useEffect(() => {
    if (!pendingCityArrivalId || city) return;
    clearCityArrival();
  }, [city, clearCityArrival, pendingCityArrivalId]);

  if (!pendingCityArrivalId || !city) return null;

  const blocked = showWorldBuildingModal
    || combatPresentation.mode !== 'hidden'
    || showPerkSelectionModal
    || showOfflineProgressModal
    || showManualSatchelModal
    || showTechniqueLearnedModal;

  if (blocked) return null;

  const lesson = getCityArrivalLesson(city.id);
  const quickOpenModules = getCityArrivalQuickOpenModules(city.modules);

  return (
    <div className="cityArrivalBannerShell" aria-live="polite">
      <div className="cityArrivalBannerCard">
        <div className="cityArrivalBannerEyebrow">Entered a new city</div>
        <div className="cityArrivalBannerTitle">{city.name}</div>
        {lesson ? <div className="cityArrivalBannerLesson">{lesson}</div> : null}
        <div className="cityArrivalBannerActions">
          {quickOpenModules.map((moduleKey) => (
            <button
              key={moduleKey}
              type="button"
              className="worldScreenModuleButton worldScreenModuleButton--subtle"
              onClick={() => {
                acknowledgeCityArrival(city.id);
                openWorldModule({ cityId: city.id, moduleKey, source: 'city-arrival-banner' });
              }}
            >
              {MODULE_LABELS[moduleKey] ?? moduleKey}
            </button>
          ))}
          <button
            type="button"
            className="worldScreenModuleButton"
            onClick={() => acknowledgeCityArrival(city.id)}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
