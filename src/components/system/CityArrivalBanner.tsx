import { useEffect } from 'react';
import { useContentStore } from '../../stores/contentStore.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import {
  buildCityPhaseTeachingSurface,
  getCityArrivalQuickOpenLabel,
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
  const ruinsById = useContentStore((state) => state.maps.ruinsById);
  const trialsById = useContentStore((state) => state.maps.trialsById);
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

  const supportIdentity = CITY_PACKAGE_REGISTRY_BY_ID[city.id]?.leadSupportIdentity ?? null;
  const supportIdentityLabel = supportIdentity ? getSupportIdentityLabel(supportIdentity) : null;
  const ruinNameRaw = city.refs?.ruinId ? ruinsById[city.refs.ruinId]?.name ?? null : null;
  const gateTrialNameRaw = city.refs?.gateTrialId ? trialsById[city.refs.gateTrialId]?.name ?? null : null;
  const ruinName = ruinNameRaw ? sanitizeLiveCityName(ruinNameRaw) : null;
  const gateTrialName = gateTrialNameRaw ? sanitizeLiveCityName(gateTrialNameRaw) : null;
  const phaseTeaching = buildCityPhaseTeachingSurface({
    cityId: city.id,
    cityName: sanitizeLiveCityName(city.name),
    modules: city.modules,
    ruinName,
    gateTrialName,
    supportIdentityLabel,
  });
  const arrivalPrompt = createCityArrivalPrompt({
    cityId: city.id,
    cityName: phaseTeaching.cityName,
    supportIdentityLabel: supportIdentityLabel ?? 'City Phase',
    lesson: phaseTeaching.lessonShort,
  });

  return (
    <div className="cityArrivalBannerShell" aria-live="polite">
      <div className="cityArrivalBannerCard">
        <div className="cityArrivalBannerEyebrow">{arrivalPrompt.eyebrow}</div>
        <div className="cityArrivalBannerTitle">{arrivalPrompt.title}</div>
        {phaseTeaching.roleStatement ? <div className="cityArrivalBannerRole">{phaseTeaching.roleStatement}</div> : null}
        {phaseTeaching.supportIdentityLabel ? <div className="cityArrivalBannerSupport">{phaseTeaching.supportIdentityLabel}</div> : null}
        {phaseTeaching.lessonShort ? <div className="cityArrivalBannerLesson">{sanitizeLiveCityName(phaseTeaching.lessonShort)}</div> : null}
        <div className="cityArrivalBannerPhaseDetails">
          <div className="cityArrivalBannerPhaseDetail">
            <strong>Ruin:</strong> {phaseTeaching.ruinName ?? 'Available now'}
          </div>
          <div className="cityArrivalBannerPhaseDetail">
            <strong>Gate Trial:</strong> {phaseTeaching.gateTrialName ?? 'Current city trial'}
          </div>
          {phaseTeaching.expeditionEmphasis ? (
            <div className="cityArrivalBannerPhaseDetail">
              <strong>Expeditions:</strong> {phaseTeaching.expeditionEmphasis}
            </div>
          ) : null}
        </div>
        <div className="cityArrivalBannerActions">
          <div className="cityArrivalBannerQuickOpen">
          {phaseTeaching.quickOpenModules.map((moduleKey) => (
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
