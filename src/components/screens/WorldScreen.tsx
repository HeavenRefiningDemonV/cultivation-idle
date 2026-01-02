import { useEffect, useMemo, useCallback } from 'react';
import type { CityDef } from '../../content';
import { useContentStore } from '../../stores/contentStore';
import { useCityStore } from '../../stores/cityStore';
import { useUIStore } from '../../stores/uiStore';
import { useCombatStore } from '../../stores/combatStore';
import { useBountyStore } from '../../stores/bountyStore';
import './WorldScreen.scss';
import { RecentTechniqueActivations } from '../combat/RecentTechniqueActivations';
import { resolveBountyDestination } from '../../utils/bountyRouting';
import { CityMapHub } from './CityMapHub';
import { WorldBuildingModal } from '../modals/WorldBuildingModal';
import { resolveModuleRef } from './world/worldUtils';
import { OutskirtsBuildingPanel } from './world/buildings/OutskirtsBuildingPanel';
import { GateTrialBuildingPanel } from './world/buildings/GateTrialBuildingPanel';
import { RuinsBuildingPanel } from './world/buildings/RuinsBuildingPanel';
import { MeditationHallPanel } from '../MeditationHallPanel';
import { ManualPavilionPanel } from '../ManualPavilionPanel';
import { ApothecaryPanel } from '../ApothecaryPanel';
import { AlchemyPanel } from '../AlchemyPanel';
import { ForgePanel } from '../ForgePanel';
import { TalismanPanel } from '../TalismanPanel';
import { BountyBoardPanel } from '../BountyBoardPanel';
import { ExpeditionBoardPanel } from '../ExpeditionBoardPanel';

const MODULE_METADATA: Record<string, { label: string; prompt: string }> = {
  meditationHall: { label: 'Meditation Hall', prompt: 'Existing cultivation loop; Heart Laws in Prompt 18' },
  outskirts: { label: 'Outskirts', prompt: 'Coming in Prompt 5' },
  gateTrial: { label: 'Gate Trial', prompt: 'Coming in Prompt 6' },
  ruins: { label: 'Ruins', prompt: 'Repeatable ruins runs' },
  apothecary: { label: 'Apothecary', prompt: 'Coming in Prompt 9' },
  manualPavilion: { label: 'Manual Pavilion', prompt: 'Coming in Prompt 10' },
  alchemy: { label: 'Alchemy', prompt: 'Coming in Prompt 13' },
  forge: { label: 'Forge', prompt: 'Coming in Prompt 14' },
  talismanStudio: { label: 'Talisman Studio', prompt: 'Coming in Prompt 15' },
  bounties: { label: 'Bounties', prompt: 'Coming in Prompt 16' },
  expeditions: { label: 'Expeditions', prompt: 'Coming in Prompt 17' },
};

function toTitleCase(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getModuleMeta(key: string) {
  if (MODULE_METADATA[key]) return MODULE_METADATA[key];
  return { label: toTitleCase(key), prompt: 'Coming soon' };
}

export function WorldScreen() {
  const setHeaderTitles = useUIStore((state) => state.setHeaderTitles);
  const isLoaded = useContentStore((state) => state.isLoaded);
  const isLoading = useContentStore((state) => state.isLoading);
  const error = useContentStore((state) => state.error);
  const citiesSorted = useContentStore((state) => state.citiesSorted);

  const currentCityId = useCityStore((state) => state.currentCityId);
  const unlockedCityIds = useCityStore((state) => state.unlockedCityIds);
  const selectedModuleByCity = useCityStore((state) => state.selectedModuleByCity);
  const setCurrentCity = useCityStore((state) => state.setCurrentCity);
  const setSelectedModule = useCityStore((state) => state.setSelectedModule);
  const trackedBounty = useBountyStore((state) => (currentCityId ? state.getTrackedBounty(currentCityId) : null));
  const inCombat = useCombatStore((state) => state.inCombat);
  const worldBuildingModalModuleKey = useUIStore((state) => state.worldBuildingModalModuleKey);
  const openWorldBuildingModal = useUIStore((state) => state.openWorldBuildingModal);
  const closeWorldBuildingModal = useUIStore((state) => state.closeWorldBuildingModal);

  useEffect(() => {
    setHeaderTitles('World', 'Cities & activities');
  }, [setHeaderTitles]);

  const selectedCity = useMemo(() => {
    if (!currentCityId) return null;
    return citiesSorted.find((city) => city.id === currentCityId) ?? null;
  }, [citiesSorted, currentCityId]);

  const selectedModuleKey = useMemo(() => {
    if (!selectedCity) return null;
    const stored = selectedModuleByCity[selectedCity.id];
    if (stored && selectedCity.modules.includes(stored)) return stored;
    return selectedCity.modules?.[0] ?? null;
  }, [selectedCity, selectedModuleByCity]);

  const activeModuleKey = useMemo(() => {
    if (worldBuildingModalModuleKey) return worldBuildingModalModuleKey;
    return selectedModuleKey;
  }, [selectedModuleKey, worldBuildingModalModuleKey]);

  const moduleRefId = useMemo(
    () => resolveModuleRef(selectedCity ?? null, activeModuleKey ?? null),
    [activeModuleKey, selectedCity],
  );

  const trackedDestination = useMemo(() => {
    if (!selectedCity || !trackedBounty) return null;
    return resolveBountyDestination({
      cityId: selectedCity.id,
      bountyKind: trackedBounty.kind,
      cityModules: selectedCity.modules,
    });
  }, [selectedCity, trackedBounty]);

  const isTrackedModuleActive = useMemo(() => {
    if (!trackedDestination || !activeModuleKey) return false;
    if (trackedDestination.kind === 'module') return trackedDestination.moduleKey === activeModuleKey;
    if (trackedDestination.kind === 'moduleChoice') {
      return trackedDestination.options.some((option) => option.moduleKey === activeModuleKey);
    }
    return false;
  }, [activeModuleKey, trackedDestination]);

  useEffect(() => {
    if (!selectedCity || !selectedModuleKey) return;
    const stored = selectedModuleByCity[selectedCity.id];
    if (stored !== selectedModuleKey) {
      setSelectedModule(selectedCity.id, selectedModuleKey);
    }
  }, [selectedCity, selectedModuleKey, selectedModuleByCity, setSelectedModule]);

  useEffect(() => {
    closeWorldBuildingModal();
  }, [closeWorldBuildingModal, currentCityId]);

  useEffect(() => () => closeWorldBuildingModal(), [closeWorldBuildingModal]);

  const handleSelectCity = (city: CityDef) => {
    if (!city) return;
    if (!unlockedCityIds.includes(city.id)) return;
    closeWorldBuildingModal();
    setCurrentCity(city.id);
  };

  const handleOpenModule = useCallback(
    (moduleKey: string) => {
      if (!selectedCity) return;
      if (!selectedCity.modules.includes(moduleKey)) return;
      setSelectedModule(selectedCity.id, moduleKey);
      openWorldBuildingModal(moduleKey);
    },
    [openWorldBuildingModal, selectedCity, setSelectedModule],
  );

  const renderSelectedModuleContent = () => {
    if (!selectedCity || !activeModuleKey) return null;

    switch (activeModuleKey) {
      case 'outskirts':
        return <OutskirtsBuildingPanel cityId={selectedCity.id} />;
      case 'gateTrial':
        return <GateTrialBuildingPanel cityId={selectedCity.id} />;
      case 'ruins':
        return <RuinsBuildingPanel cityId={selectedCity.id} />;
      case 'meditationHall':
        return <MeditationHallPanel />;
      case 'manualPavilion':
        return <ManualPavilionPanel pavilionId={moduleRefId ?? null} />;
      case 'apothecary':
        return <ApothecaryPanel shopId={moduleRefId ?? null} />;
      case 'alchemy':
        return <AlchemyPanel cityId={selectedCity.id} />;
      case 'forge':
        return <ForgePanel cityId={selectedCity.id} />;
      case 'talismanStudio':
        return <TalismanPanel cityId={selectedCity.id} />;
      case 'bounties':
        return <BountyBoardPanel />;
      case 'expeditions':
        return <ExpeditionBoardPanel />;
      default:
        return <div className="worldBuildingPlaceholder">Not implemented yet ({activeModuleKey})</div>;
    }
  };


  if (isLoading) {
    return <div className={'worldScreen worldScreenMessage'}>Loading content...</div>;
  }

  if (error) {
    return (
      <div className={'worldScreen worldScreenMessage worldScreenMessageError'}>
        <div>Content failed to load.</div>
        <div className={'worldScreenErrorText'}>{error}</div>
      </div>
    );
  }

  if (!isLoaded || citiesSorted.length === 0) {
    return <div className={'worldScreen worldScreenMessage'}>No cities available.</div>;
  }

  return (
    <div className={'worldScreen'}>
      <div className={'worldHubTopBar'}>
        <div>
          <h2 className={'worldScreenPanelTitle'}>World Hub</h2>
          <p className={'worldScreenPanelSubtitle'}>Choose a city and enter its buildings</p>
        </div>
        <div className={'worldHubCitySelectWrapper'}>
          <label className={'worldHubCityLabel'} htmlFor="world-city-select">
            City
          </label>
          <select
            id="world-city-select"
            className={'worldHubCitySelect'}
            value={currentCityId ?? ''}
            onChange={(e) => {
              const next = citiesSorted.find((city) => city.id === e.target.value);
              if (next) handleSelectCity(next);
            }}
          >
            <option value="" disabled>
              Select a city
            </option>
            {citiesSorted.map((city) => {
              const isUnlocked = unlockedCityIds.includes(city.id);
              return (
                <option key={city.id} value={city.id} disabled={!isUnlocked}>
                  {city.name} {isUnlocked ? '' : '(Locked)'}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {!selectedCity ? (
        <div className={'worldScreenMessage'}>Select a city to view its modules.</div>
      ) : (
        <div className={'worldScreenDetailWrapper'}>
          <div className={'worldScreenPanel worldScreenCitySummary'}>
            <div className={'worldScreenPanelHeader'}>
              <div>
                <h2 className={'worldScreenPanelTitle'}>{selectedCity.name}</h2>
                <p className={'worldScreenPanelSubtitle'}>
                  Modules: {selectedCity.modules.length} • Realm Gate: {selectedCity.unlockMajorRealm}
                </p>
              </div>
              {trackedBounty && isTrackedModuleActive && (
                <div className={'worldScreenTrackedBanner'}>
                  <div className={'worldScreenTrackedBannerText'}>
                    Tracked bounty: <span className={'worldScreenTrackedName'}>{trackedBounty.title}</span> —{' '}
                    {trackedBounty.progress}/{trackedBounty.target}
                  </div>
                  <button
                    className={'worldScreenTrackedLink'}
                    onClick={() => handleOpenModule('bounties')}
                    type="button"
                  >
                    View bounty board
                  </button>
                </div>
              )}
            </div>
            <div className={'worldScreenRefs'}>
              <div className={'worldScreenRefsHeader'}>City References</div>
              {selectedCity.refs && Object.keys(selectedCity.refs).length > 0 ? (
                <dl className={'worldScreenRefsList'}>
                  {Object.entries(selectedCity.refs).map(([key, value]) => (
                    <div key={key} className={'worldScreenRefRow'}>
                      <dt>{key}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <div className={'worldScreenRefsEmpty'}>No refs provided</div>
              )}
            </div>
          </div>

          {inCombat && (
            <div className={'worldScreenPanel'}>
              <RecentTechniqueActivations />
            </div>
          )}

          <div className={'worldScreenPanel worldScreenHubPanel'}>
            <div className={'worldScreenPanelHeader'}>
              <div>
                <h3 className={'worldScreenPanelTitle'}>{selectedCity.name} Map</h3>
                <p className={'worldScreenPanelSubtitle'}>Tap a building to enter</p>
              </div>
            </div>
            <CityMapHub
              modules={selectedCity.modules}
              activeModuleKey={activeModuleKey}
              getModuleLabel={(moduleKey) => getModuleMeta(moduleKey).label}
              onOpenModule={handleOpenModule}
            />
          </div>
        </div>
      )}

      <WorldBuildingModal
        open={worldBuildingModalModuleKey !== null}
        onClose={closeWorldBuildingModal}
        title={activeModuleKey ? getModuleMeta(activeModuleKey).label : 'World Building'}
        subtitle={activeModuleKey ? getModuleMeta(activeModuleKey).prompt : undefined}
      >
        {renderSelectedModuleContent()}
      </WorldBuildingModal>
    </div>
  );
}
