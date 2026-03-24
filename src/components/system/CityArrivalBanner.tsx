import { useEffect } from 'react';
import { useContentStore } from '../../stores/contentStore.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import {
  getCityArrivalLesson,
  getCityArrivalQuickOpenLabel,
  getCityArrivalQuickOpenModules,
} from '../../systems/world/cityArrivalContract.js';
import { CITY_PACKAGE_REGISTRY_BY_ID, getSupportIdentityLabel } from '../../systems/world/cityPackageRegistry.js';
import { openWorldModule } from '../../systems/world/openWorldModule.js';
import './CityArrivalBanner.scss';
import { getOpenWorldModuleLabel, sanitizeLiveCityName } from '../../ui/text/playerFacingLabels.js';
import { createCityArrivalPrompt } from '../../systems/ui/onboardingPromptRegistry.js';

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
  const supportIdentity = CITY_PACKAGE_REGISTRY_BY_ID[city.id]?.leadSupportIdentity ?? null;
  const supportIdentityLabel = supportIdentity ? getSupportIdentityLabel(supportIdentity) : null;
  const arrivalPrompt = createCityArrivalPrompt({
    cityId: city.id,
    cityName: sanitizeLiveCityName(city.name),
    supportIdentityLabel: supportIdentityLabel ?? 'City Phase',
    lesson,
  });

  return (
    <div className="cityArrivalBannerShell" aria-live="polite">
      <div className="cityArrivalBannerCard">
        <div className="cityArrivalBannerEyebrow">{arrivalPrompt.eyebrow}</div>
        <div className="cityArrivalBannerTitle">{arrivalPrompt.title}</div>
        {supportIdentityLabel ? <div className="cityArrivalBannerSupport">{supportIdentityLabel}</div> : null}
        {lesson ? <div className="cityArrivalBannerLesson">{sanitizeLiveCityName(lesson)}</div> : null}
        <div className="cityArrivalBannerActions">
          <div className="cityArrivalBannerQuickOpen">
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
              {getCityArrivalQuickOpenLabel(moduleKey) ?? getOpenWorldModuleLabel(moduleKey)}
            </button>
          ))}
          </div>
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
