import { useEffect, useMemo, useRef, useState } from 'react';
import type { CityDef } from '../../content';
import { useContentStore } from '../../stores/contentStore';
import { useUIStore } from '../../stores/uiStore';
import './WorldScreen.scss';

const LOCALSTORAGE_SELECTED_CITY_KEY = 'ci_world_selected_city_id';
const LOCALSTORAGE_SELECTED_MODULES_KEY = 'ci_world_selected_module_by_city';

const MODULE_METADATA: Record<string, { label: string; prompt: string }> = {
  meditationHall: { label: 'Meditation Hall', prompt: 'Existing cultivation loop; Heart Laws in Prompt 18' },
  outskirts: { label: 'Outskirts', prompt: 'Coming in Prompt 5' },
  gateTrial: { label: 'Gate Trial', prompt: 'Coming in Prompt 6' },
  ruins: { label: 'Ruins', prompt: 'Coming in Prompt 7' },
  apothecary: { label: 'Apothecary', prompt: 'Coming in Prompt 9' },
  manualPavilion: { label: 'Manual Pavilion', prompt: 'Coming in Prompt 10' },
  alchemy: { label: 'Alchemy', prompt: 'Coming in Prompt 13' },
  forge: { label: 'Forge', prompt: 'Coming in Prompt 14' },
  talismanStudio: { label: 'Talisman Studio', prompt: 'Coming in Prompt 15' },
  bounties: { label: 'Bounties', prompt: 'Coming in Prompt 16' },
  expeditions: { label: 'Expeditions', prompt: 'Coming in Prompt 17' },
};

const MODULE_REF_KEYS: Record<string, string> = {
  meditationHall: 'meditationHallId',
  outskirts: 'outskirtsId',
  gateTrial: 'gateTrialId',
  ruins: 'ruinId',
  apothecary: 'apothecaryId',
  manualPavilion: 'pavilionId',
  alchemy: 'alchemyId',
  forge: 'forgeId',
  talismanStudio: 'talismanId',
  bounties: 'bountyBoardId',
  expeditions: 'expeditionsId',
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

function resolveModuleRef(city: CityDef | null, moduleKey: string | null) {
  if (!city || !moduleKey || !city.refs) return null;
  const explicitKey = MODULE_REF_KEYS[moduleKey];
  if (explicitKey && city.refs[explicitKey]) return city.refs[explicitKey];
  if (city.refs[`${moduleKey}Id`]) return city.refs[`${moduleKey}Id`];
  if (city.refs[moduleKey]) return city.refs[moduleKey];
  return null;
}

export function WorldScreen() {
  const setHeaderTitles = useUIStore((state) => state.setHeaderTitles);
  const isLoaded = useContentStore((state) => state.isLoaded);
  const isLoading = useContentStore((state) => state.isLoading);
  const error = useContentStore((state) => state.error);
  const citiesSorted = useContentStore((state) => state.citiesSorted);

  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedModuleByCity, setSelectedModuleByCity] = useState<Record<string, string>>({});
  const restoredRef = useRef(false);

  useEffect(() => {
    setHeaderTitles('World', 'Cities & activities');
  }, [setHeaderTitles]);

  const persistModuleMap = (map: Record<string, string>) => {
    try {
      localStorage.setItem(LOCALSTORAGE_SELECTED_MODULES_KEY, JSON.stringify(map));
    } catch (err) {
      console.warn('[WorldScreen] Failed to persist module map', err);
    }
  };

  const persistCitySelection = (cityId: string | null) => {
    try {
      if (cityId) {
        localStorage.setItem(LOCALSTORAGE_SELECTED_CITY_KEY, cityId);
      } else {
        localStorage.removeItem(LOCALSTORAGE_SELECTED_CITY_KEY);
      }
    } catch (err) {
      console.warn('[WorldScreen] Failed to persist city selection', err);
    }
  };

  useEffect(() => {
    if (!isLoaded || citiesSorted.length === 0 || restoredRef.current) return;
    restoredRef.current = true;

    let storedCity: string | null = null;
    let storedModuleMap: Record<string, string> = {};

    try {
      storedCity = localStorage.getItem(LOCALSTORAGE_SELECTED_CITY_KEY);
      const mappingRaw = localStorage.getItem(LOCALSTORAGE_SELECTED_MODULES_KEY);
      if (mappingRaw) {
        const parsed = JSON.parse(mappingRaw);
        if (parsed && typeof parsed === 'object') {
          storedModuleMap = parsed as Record<string, string>;
        }
      }
    } catch (err) {
      console.warn('[WorldScreen] Failed to load persisted selection', err);
    }

    const validCityIds = new Set(citiesSorted.map((c) => c.id));
    const initialCityId = storedCity && validCityIds.has(storedCity) ? storedCity : citiesSorted[0]?.id ?? null;

    let nextModuleMap = storedModuleMap;
    const initialCity = citiesSorted.find((c) => c.id === initialCityId) ?? null;
    if (initialCity) {
      const storedModule = storedModuleMap[initialCity.id];
      const fallbackModule = initialCity.modules?.[0];
      if ((!storedModule || !initialCity.modules.includes(storedModule)) && fallbackModule) {
        nextModuleMap = { ...storedModuleMap, [initialCity.id]: fallbackModule };
      }
    }

    setSelectedCityId(initialCityId);
    setSelectedModuleByCity(nextModuleMap);
    persistCitySelection(initialCityId);
    persistModuleMap(nextModuleMap);
  }, [isLoaded, citiesSorted]);

  const selectedCity = useMemo(() => {
    if (!selectedCityId) return null;
    return citiesSorted.find((city) => city.id === selectedCityId) ?? null;
  }, [citiesSorted, selectedCityId]);

  const selectedModuleKey = useMemo(() => {
    if (!selectedCity) return null;
    const stored = selectedModuleByCity[selectedCity.id];
    if (stored && selectedCity.modules.includes(stored)) return stored;
    return selectedCity.modules?.[0] ?? null;
  }, [selectedCity, selectedModuleByCity]);

  useEffect(() => {
    if (!selectedCity || !selectedModuleKey) return;
    const current = selectedModuleByCity[selectedCity.id];
    if (current === selectedModuleKey) return;
    const nextMap = { ...selectedModuleByCity, [selectedCity.id]: selectedModuleKey };
    setSelectedModuleByCity(nextMap);
    persistModuleMap(nextMap);
  }, [selectedCity, selectedModuleKey, selectedModuleByCity]);

  const handleSelectCity = (city: CityDef) => {
    if (!city) return;
    setSelectedCityId(city.id);
    persistCitySelection(city.id);

    setSelectedModuleByCity((prev) => {
      const existing = prev[city.id];
      const validExisting = existing && city.modules.includes(existing) ? existing : null;
      const nextModule = validExisting ?? city.modules[0] ?? null;
      const nextMap = nextModule ? { ...prev, [city.id]: nextModule } : prev;
      persistModuleMap(nextMap);
      return nextMap;
    });
  };

  const handleSelectModule = (moduleKey: string) => {
    if (!selectedCity || !moduleKey) return;
    setSelectedModuleByCity((prev) => {
      const nextMap = { ...prev, [selectedCity.id]: moduleKey };
      persistModuleMap(nextMap);
      return nextMap;
    });
  };

  const moduleMeta = selectedModuleKey ? getModuleMeta(selectedModuleKey) : null;
  const moduleRefId = resolveModuleRef(selectedCity, selectedModuleKey);

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
      <div className={'worldScreenLayout'}>
        <div className={'worldScreenColumn worldScreenColumnList'}>
          <div className={'worldScreenSectionHeader'}>
            <h2>Cities</h2>
            <p className={'worldScreenSectionSub'}>Select a city to view its activities</p>
          </div>
          <div className={'worldScreenCityList'}>
            {citiesSorted.map((city) => {
              const isActive = city.id === selectedCityId;
              return (
                <button
                  key={city.id}
                  className={`worldScreenCityButton ${isActive ? 'worldScreenCityButton--active' : ''}`}
                  onClick={() => handleSelectCity(city)}
                >
                  <div className={'worldScreenCityTitle'}>
                    <span className={'worldScreenCityName'}>{city.name}</span>
                    <span className={'worldScreenCityIndex'}>City {city.index}</span>
                  </div>
                  <div className={'worldScreenCityMeta'}>
                    Unlocks at realm: {city.unlockMajorRealm}
                  </div>
                  {city.themeTags && city.themeTags.length > 0 && (
                    <div className={'worldScreenCityTags'}>
                      {city.themeTags.map((tag) => (
                        <span key={tag} className={'worldScreenCityTag'}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className={'worldScreenColumn worldScreenColumnDetail'}>
          {!selectedCity ? (
            <div className={'worldScreenMessage'}>Select a city to view its modules.</div>
          ) : (
            <div className={'worldScreenDetailWrapper'}>
              <div className={'worldScreenPanel'}>
                <div className={'worldScreenPanelHeader'}>
                  <div>
                    <h2 className={'worldScreenPanelTitle'}>{selectedCity.name}</h2>
                    <p className={'worldScreenPanelSubtitle'}>
                      Modules: {selectedCity.modules.length} • Realm Gate: {selectedCity.unlockMajorRealm}
                    </p>
                  </div>
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

              <div className={'worldScreenPanel'}>
                <div className={'worldScreenPanelHeader'}>
                  <h3 className={'worldScreenPanelTitle'}>Modules</h3>
                  <p className={'worldScreenPanelSubtitle'}>Pick a module to preview upcoming content</p>
                </div>
                <div className={'worldScreenModules'}>
                  {selectedCity.modules.map((moduleKey) => {
                    const meta = getModuleMeta(moduleKey);
                    const isActive = moduleKey === selectedModuleKey;
                    return (
                      <button
                        key={moduleKey}
                        className={`worldScreenModuleButton ${isActive ? 'worldScreenModuleButton--active' : ''}`}
                        onClick={() => handleSelectModule(moduleKey)}
                      >
                        <div className={'worldScreenModuleLabel'}>{meta.label}</div>
                        <div className={'worldScreenModuleKey'}>{moduleKey}</div>
                      </button>
                    );
                  })}
                  {selectedCity.modules.length === 0 && (
                    <div className={'worldScreenRefsEmpty'}>No modules listed for this city.</div>
                  )}
                </div>

                {selectedModuleKey && moduleMeta && (
                  <div className={'worldScreenPlaceholder'}>
                    <div className={'worldScreenPlaceholderHeader'}>
                      <div className={'worldScreenPlaceholderTitle'}>{moduleMeta.label}</div>
                      <div className={'worldScreenPlaceholderKey'}>{selectedModuleKey}</div>
                    </div>
                    <div className={'worldScreenPlaceholderBody'}>
                      <div className={'worldScreenPlaceholderLine'}>Coming in {moduleMeta.prompt}</div>
                      <div className={'worldScreenPlaceholderLine'}>
                        Reference ID: {moduleRefId ? moduleRefId : 'No ref id'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
