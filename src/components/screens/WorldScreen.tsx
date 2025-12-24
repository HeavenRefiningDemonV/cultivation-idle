import { useEffect, useMemo } from 'react';
import type { CityDef } from '../../content';
import { useContentStore } from '../../stores/contentStore';
import { useCityStore } from '../../stores/cityStore';
import { useUIStore } from '../../stores/uiStore';
import { useActivityStore } from '../../stores/activityStore';
import { useCombatStore } from '../../stores/combatStore';
import { useOutskirtsStore } from '../../stores/outskirtsStore';
import { useTrialStore } from '../../stores/trialStore';
import { useRuinsStore } from '../../stores/ruinsStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { RewardService } from '../../services/rewards';
import { ApothecaryPanel } from './ApothecaryPanel';
import { AlchemyPanel } from './AlchemyPanel';
import { ForgePanel } from './ForgePanel';
import { TalismanPanel } from './TalismanPanel';
import { ManualPavilionPanel } from './ManualPavilionPanel';
import { MeditationHallPanel } from './MeditationHallPanel';
import { BountyBoardPanel } from './BountyBoardPanel';
import { ExpeditionBoardPanel } from './ExpeditionBoardPanel';
import './WorldScreen.scss';

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

function pickEnemyFromPool(pool: { enemyId: string; weight: number }[]): string | null {
  if (!Array.isArray(pool) || pool.length === 0) return null;
  const totalWeight = pool.reduce((sum, entry) => sum + (entry.weight ?? 0), 0);
  if (totalWeight <= 0) return pool[0]?.enemyId ?? null;

  let roll = Math.random() * totalWeight;
  for (const entry of pool) {
    roll -= entry.weight ?? 0;
    if (roll <= 0) return entry.enemyId;
  }

  return pool[pool.length - 1]?.enemyId ?? null;
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
  const enemiesById = useContentStore((state) => state.maps.enemiesById);
  const outskirtsById = useContentStore((state) => state.maps.outskirtsById);
  const trialsById = useContentStore((state) => state.maps.trialsById);
  const ruinsById = useContentStore((state) => state.maps.ruinsById);
  const itemsById = useContentStore((state) => state.maps.itemsById);
  const economy = useContentStore((state) => state.raw?.economy);
  const gateTrialEconomy = (economy as any)?.manualSystem?.gateTrials;

  const currentCityId = useCityStore((state) => state.currentCityId);
  const unlockedCityIds = useCityStore((state) => state.unlockedCityIds);
  const selectedModuleByCity = useCityStore((state) => state.selectedModuleByCity);
  const setCurrentCity = useCityStore((state) => state.setCurrentCity);
  const setSelectedModule = useCityStore((state) => state.setSelectedModule);
  const cityFlagsById = useCityStore((state) => state.cityFlagsById);

  const activeActivity = useActivityStore((state) => state.active);
  const startActivity = useActivityStore((state) => state.startActivity);
  const stopActivity = useActivityStore((state) => state.stopActivity);

  const startCombat = useCombatStore((state) => state.startCombat);
  const setAutoAttack = useCombatStore((state) => state.setAutoAttack);
  const setAutoCombatAI = useCombatStore((state) => state.setAutoCombatAI);
  const exitCombat = useCombatStore((state) => state.exitCombat);
  const combatContext = useCombatStore((state) => state.combatContext);

  const shouldSpawnBoss = useOutskirtsStore((state) => state.shouldSpawnBoss);
  const progressByOutskirtsId = useOutskirtsStore((state) => state.progressByOutskirtsId);

  const trialProgressById = useTrialStore((state) => state.progressByTrialId);
  const ruinsProgressById = useRuinsStore((state) => state.progressByRuinId);
  const activeRuinRun = useRuinsStore((state) => state.activeRun);
  const startRuinRun = useRuinsStore((state) => state.startRun);
  const stopRuinRun = useRuinsStore((state) => state.stopRun);
  const setRuinsAutoRepeat = useRuinsStore((state) => state.setAutoRepeat);
  const ruinsAutoRepeatDefault = useRuinsStore((state) => state.autoRepeatDefault);
  const getItemCount = useInventoryStore((state) => state.getItemCount);

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

  useEffect(() => {
    if (!selectedCity || !selectedModuleKey) return;
    const stored = selectedModuleByCity[selectedCity.id];
    if (stored !== selectedModuleKey) {
      setSelectedModule(selectedCity.id, selectedModuleKey);
    }
  }, [selectedCity, selectedModuleKey, selectedModuleByCity, setSelectedModule]);

  const handleSelectCity = (city: CityDef) => {
    if (!city) return;
    if (!unlockedCityIds.includes(city.id)) return;
    setCurrentCity(city.id);
  };

  const handleSelectModule = (moduleKey: string) => {
    if (!selectedCity) return;
    setSelectedModule(selectedCity.id, moduleKey);
  };

  const moduleMeta = selectedModuleKey ? getModuleMeta(selectedModuleKey) : null;
  const moduleRefId = resolveModuleRef(selectedCity, selectedModuleKey);
  const outskirtsDef = moduleRefId ? outskirtsById[moduleRefId] : undefined;
  const outskirtsProgress = moduleRefId
    ? progressByOutskirtsId[moduleRefId] ?? { killsSinceBoss: 0, totalKills: 0, bossDefeated: false }
    : null;
  const isOutskirtsActive =
    activeActivity?.type === 'outskirts' && activeActivity.sourceId === moduleRefId;
  const bossName = outskirtsDef ? enemiesById[outskirtsDef.bossId]?.name ?? outskirtsDef.bossId : null;
  const isBossReady = outskirtsDef ? shouldSpawnBoss(outskirtsDef.id, outskirtsDef) : false;
  const cityFlags = selectedCity ? cityFlagsById[selectedCity.id] : null;
  const trialDef = moduleRefId ? trialsById[moduleRefId] : undefined;
  const trialProgress = moduleRefId
    ? trialProgressById[moduleRefId] ?? { attempts: 0, cleared: false, lastAttemptAt: null, lastClearAt: null }
    : null;
  const isTrialActive = activeActivity?.type === 'trial' && activeActivity.sourceId === moduleRefId;
  const trialCityIndex = trialDef?.cityIndex ?? selectedCity?.index ?? 0;
  const trialBossName = trialDef ? enemiesById[trialDef.bossId]?.name ?? trialDef.bossId : null;
  const gateItemName = trialDef ? itemsById[trialDef.gateItemId]?.name ?? trialDef.gateItemId : null;
  const gateItemOwned = trialDef ? getItemCount(trialDef.gateItemId) > 0 : false;
  const trialFailSafeThreshold = useMemo(() => {
    return (
      trialDef?.failSafe?.thresholdAttempts ??
      gateTrialEconomy?.failSafe?.failThresholdEligibleAttempts ??
      3
    );
  }, [gateTrialEconomy, trialDef]);
  const trialFailSafeCost = useMemo(() => {
    const normalize = (value: unknown) => {
      if (typeof value === 'number') return value.toString();
      if (typeof value === 'string') return value;
      return undefined;
    };

    const fallback = gateTrialEconomy?.failSafe?.purchaseCostByCityIndex?.[trialCityIndex];
    const merged = trialDef?.failSafe?.cost ?? fallback;
    if (!merged) return null;
    const cost = {
      gold: normalize((merged as any).gold),
      spiritStones: normalize((merged as any).spiritStones),
      merit: normalize((merged as any).merit),
    };
    if (!cost.gold && !cost.spiritStones && !cost.merit) return null;
    return cost;
  }, [gateTrialEconomy, trialCityIndex, trialDef?.failSafe?.cost]);
  const isTrialEligible = Boolean(trialDef && !(trialProgress?.cleared || cityFlags?.gateTrialCleared));
  const failSafeUnlocked = Boolean(
    trialDef &&
      isTrialEligible &&
      !isTrialActive &&
      !gateItemOwned &&
      trialFailSafeCost &&
      (trialProgress?.attempts ?? 0) >= trialFailSafeThreshold,
  );
  const trialEligibilityRule = trialDef?.eligibilityRule
    ? typeof trialDef.eligibilityRule === 'string'
      ? trialDef.eligibilityRule
      : String(trialDef.eligibilityRule)
    : 'No eligibility rule provided';

  const ruinDef = moduleRefId ? ruinsById[moduleRefId] : undefined;
  const ruinProgress = moduleRefId
    ? ruinsProgressById[moduleRefId] ?? { totalRuns: 0, totalRoomsCleared: 0, bossKills: 0 }
    : null;
  const isRuinsActive = activeActivity?.type === 'ruins' && activeActivity.sourceId === moduleRefId;
  const activeRuin = activeRuinRun && activeRuinRun.ruinId === moduleRefId ? activeRuinRun : null;

  const handleStartOutskirts = () => {
    if (!selectedCity || !outskirtsDef) return;

    const nextEnemyId = isBossReady ? outskirtsDef.bossId : pickEnemyFromPool(outskirtsDef.mobPool);
    if (!nextEnemyId) return;

    startActivity('outskirts', { cityId: selectedCity.id, sourceId: outskirtsDef.id });
    setAutoAttack(true);

    startCombat(nextEnemyId, {
      type: 'outskirts',
      cityId: selectedCity.id,
      sourceId: outskirtsDef.id,
      cityIndex: outskirtsDef.cityIndex,
      isBoss: isBossReady,
    });
  };

  const handleChallengeTrial = () => {
    if (!selectedCity || !trialDef || !isTrialEligible) return;

    if (combatContext.type) {
      exitCombat();
    }

    stopActivity();
    startActivity('trial', { cityId: selectedCity.id, sourceId: trialDef.id });
    setAutoAttack(true);
    setAutoCombatAI(true);

    startCombat(trialDef.bossId, {
      type: 'trial',
      cityId: selectedCity.id,
      trialId: trialDef.id,
      gateItemId: trialDef.gateItemId,
      eligible: isTrialEligible,
    });
  };

  const handleStopTrial = () => {
    stopActivity();
    if (combatContext.type === 'trial') {
      exitCombat();
    }
  };

  const handleFailSafePurchase = () => {
    if (!trialDef || !trialFailSafeCost || !isTrialEligible || isTrialActive) return;

    const inventory = useInventoryStore.getState();
    const goldCost = trialFailSafeCost.gold;
    const spiritStoneCost = trialFailSafeCost.spiritStones;
    const meritCost = trialFailSafeCost.merit;

    const canAfford = inventory.canAffordCurrency({
      gold: goldCost,
      spiritStones: spiritStoneCost,
      merit: meritCost,
    });

    if (!canAfford) {
      console.warn('[WorldScreen] Cannot afford fail-safe purchase');
      return;
    }

    const spent = inventory.spendCurrencies({
      gold: goldCost,
      spiritStones: spiritStoneCost,
      merit: meritCost,
    });

    if (!spent) {
      console.warn('[WorldScreen] Failed to deduct currencies for fail-safe purchase');
      return;
    }

    RewardService.grantRewards(
      { items: [{ itemId: trialDef.gateItemId, qty: 1 }] },
      'Gate Trial fail-safe purchase',
    );
  };

  const handleStopOutskirts = () => {
    stopActivity();
    if (combatContext.type === 'outskirts') {
      exitCombat();
    }
  };

  const handleStartRuins = () => {
    if (!selectedCity || !ruinDef) return;
    startRuinRun(ruinDef.id);
  };

  const handleStopRuins = () => {
    stopRuinRun();
    if (combatContext.type === 'ruins') {
      exitCombat();
    }
  };

  const handleToggleRuinsAutoRepeat = () => {
    setRuinsAutoRepeat(!ruinsAutoRepeatDefault);
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
      <div className={'worldScreenLayout'}>
        <div className={'worldScreenColumn worldScreenColumnList'}>
          <div className={'worldScreenSectionHeader'}>
            <h2>Cities</h2>
            <p className={'worldScreenSectionSub'}>Select a city to view its activities</p>
          </div>
          <div className={'worldScreenCityList'}>
            {citiesSorted.map((city) => {
              const isActive = city.id === currentCityId;
              const isUnlocked = unlockedCityIds.includes(city.id);
              return (
                <button
                  key={city.id}
                  className={`worldScreenCityButton ${isActive ? 'worldScreenCityButton--active' : ''} ${
                    isUnlocked ? '' : 'worldScreenCityButton--locked'
                  }`}
                  onClick={() => handleSelectCity(city)}
                  disabled={!isUnlocked}
                >
                  <div className={'worldScreenCityTitle'}>
                    <span className={'worldScreenCityName'}>{city.name}</span>
                    <span className={'worldScreenCityIndex'}>City {city.index}</span>
                  </div>
                  <div className={'worldScreenCityMeta'}>
                    Unlocks at realm: {city.unlockMajorRealm}
                  </div>
                  {!isUnlocked && <div className={'worldScreenCityLockedBadge'}>Locked</div>}
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
                  selectedModuleKey === 'outskirts' && outskirtsDef ? (
                    <div className={'worldScreenPlaceholder'}>
                      <div className={'worldScreenPlaceholderHeader'}>
                        <div className={'worldScreenPlaceholderTitle'}>
                          {outskirtsDef.name ?? moduleMeta.label}
                        </div>
                        <div className={'worldScreenPlaceholderKey'}>{selectedModuleKey}</div>
                      </div>
                      <div className={'worldScreenPlaceholderBody'}>
                        <div
                          className={'worldScreenPlaceholderLine'}
                          data-testid="outskirts-progress"
                        >
                          Kills to Boss: {outskirtsProgress?.killsSinceBoss ?? 0} /{' '}
                          {outskirtsDef.killsToBoss}
                        </div>
                        <div className={'worldScreenPlaceholderLine'}>
                          Boss: {bossName ?? 'Unknown'} • Defeated:{' '}
                          {outskirtsProgress?.bossDefeated ? 'Yes' : 'No'}
                        </div>
                        <div className={'worldScreenPlaceholderLine'}>
                          Activity: {isOutskirtsActive ? 'Active' : 'Inactive'}
                        </div>
                        <div className={'worldScreenPlaceholderLine'}>
                          Loop: {isBossReady ? 'Boss encounter ready' : 'Farming mobs'}
                        </div>
                        {cityFlags && (
                          <div className={'worldScreenPlaceholderLine'}>
                            City Flag — Boss Cleared:{' '}
                            {cityFlags.outskirtsBossDefeated ? 'Yes' : 'No'}
                          </div>
                        )}
                      </div>
                      <div className={'worldScreenPlaceholderActions'}>
                        <button
                          className={'worldScreenModuleButton worldScreenModuleButton--active'}
                          onClick={handleStartOutskirts}
                          data-testid="outskirts-start"
                          disabled={!outskirtsDef}
                        >
                          Start Outskirts
                        </button>
                        <button
                          className={'worldScreenModuleButton'}
                          onClick={handleStopOutskirts}
                          data-testid="outskirts-stop"
                        >
                          Stop
                        </button>
                      </div>
                    </div>
                  ) : selectedModuleKey === 'gateTrial' && trialDef ? (
                    <div className={'worldScreenPlaceholder'}>
                      <div className={'worldScreenPlaceholderHeader'}>
                        <div className={'worldScreenPlaceholderTitle'}>
                          {trialDef.name ?? moduleMeta.label}
                        </div>
                        <div className={'worldScreenPlaceholderKey'}>{selectedModuleKey}</div>
                      </div>
                      <div className={'worldScreenPlaceholderBody'}>
                        <div className={'worldScreenPlaceholderLine'}>
                          Boss: {trialBossName ?? 'Unknown'}
                        </div>
                        <div className={'worldScreenPlaceholderLine'}>
                          Gate Item: {gateItemName ?? 'Unknown'} (Owned: {gateItemOwned ? 'Yes' : 'No'})
                        </div>
                        <div className={'worldScreenPlaceholderLine'}>
                          Eligibility: {isTrialEligible ? 'Eligible' : 'Not eligible'}
                        </div>
                        <div className={'worldScreenPlaceholderLine'}>
                          Rule: {trialEligibilityRule}
                        </div>
                        <div className={'worldScreenPlaceholderLine'}>
                          Attempts: {trialProgress?.attempts ?? 0} / {trialFailSafeThreshold}
                        </div>
                        <div className={'worldScreenPlaceholderLine'}>
                          Cleared: {trialProgress?.cleared || cityFlags?.gateTrialCleared ? 'Yes' : 'No'}
                        </div>
                        <div className={'worldScreenPlaceholderLine'}>
                          Activity: {isTrialActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      <div className={'worldScreenPlaceholderActions'}>
                        <button
                          className={'worldScreenModuleButton worldScreenModuleButton--active'}
                          onClick={handleChallengeTrial}
                          disabled={!isTrialEligible || !trialDef}
                        >
                          Challenge Trial
                        </button>
                        <button className={'worldScreenModuleButton'} onClick={handleStopTrial}>
                          Stop
                        </button>
                        {failSafeUnlocked && trialFailSafeCost && (
                          <button className={'worldScreenModuleButton'} onClick={handleFailSafePurchase}>
                            Emergency Gate Item Purchase ({
                              [
                                trialFailSafeCost.gold ? `${trialFailSafeCost.gold} Gold` : null,
                                trialFailSafeCost.spiritStones
                                  ? `${trialFailSafeCost.spiritStones} Spirit Stones`
                                  : null,
                                trialFailSafeCost.merit ? `${trialFailSafeCost.merit} Merit` : null,
                              ]
                                .filter(Boolean)
                                .join(' / ')
                            })
                          </button>
                        )}
                      </div>
                    </div>
                  ) : selectedModuleKey === 'meditationHall' ? (
                    <MeditationHallPanel />
                  ) : selectedModuleKey === 'manualPavilion' ? (
                    <ManualPavilionPanel pavilionId={moduleRefId ?? null} />
                  ) : selectedModuleKey === 'apothecary' ? (
                    <ApothecaryPanel shopId={moduleRefId ?? null} />
                  ) : selectedModuleKey === 'alchemy' ? (
                    <AlchemyPanel cityId={selectedCity.id} />
                  ) : selectedModuleKey === 'forge' ? (
                    <ForgePanel cityId={selectedCity.id} />
                  ) : selectedModuleKey === 'talismanStudio' ? (
                    <TalismanPanel cityId={selectedCity.id} />
                  ) : selectedModuleKey === 'bounties' ? (
                    <BountyBoardPanel />
                  ) : selectedModuleKey === 'expeditions' ? (
                    <ExpeditionBoardPanel />
                  ) : selectedModuleKey === 'ruins' && ruinDef ? (
                    <div className={'worldScreenPlaceholder'}>
                      <div className={'worldScreenPlaceholderHeader'}>
                        <div className={'worldScreenPlaceholderTitle'}>
                          {ruinDef.name ?? moduleMeta.label}
                        </div>
                        <div className={'worldScreenPlaceholderKey'}>{selectedModuleKey}</div>
                      </div>
                      <div className={'worldScreenPlaceholderBody'}>
                        <div className={'worldScreenPlaceholderLine'}>
                          Rooms: {ruinDef.roomCount}
                        </div>
                        <div className={'worldScreenPlaceholderLine'}>
                          Activity: {isRuinsActive ? 'Active' : 'Inactive'}
                          {activeRuin && (
                            <span>
                              {' '}
                              (Room {activeRuin.roomIndex + 1}/{activeRuin.roomCount})
                            </span>
                          )}
                        </div>
                        <div className={'worldScreenPlaceholderLine'}>
                          Runs: {ruinProgress?.totalRuns ?? 0} • Boss kills: {ruinProgress?.bossKills ?? 0}
                        </div>
                        <div className={'worldScreenPlaceholderLine'}>
                          Best time:{' '}
                          {ruinProgress?.bestRunSeconds ? `${ruinProgress.bestRunSeconds.toFixed(1)}s` : 'N/A'}
                        </div>
                        {ruinProgress?.lastRun && (
                          <div className={'worldScreenPlaceholderLine'}>
                            Last run: {ruinProgress.lastRun.victory ? 'Victory' : 'Defeat'} in{' '}
                            {ruinProgress.lastRun.seconds.toFixed(1)}s (rooms {ruinProgress.lastRun.roomsCleared})
                          </div>
                        )}
                      </div>
                      <div className={'worldScreenPlaceholderActions'}>
                        <button
                          className={'worldScreenModuleButton worldScreenModuleButton--active'}
                          onClick={handleStartRuins}
                          disabled={!ruinDef}
                        >
                          Start Run
                        </button>
                        <button className={'worldScreenModuleButton'} onClick={handleStopRuins}>
                          Stop
                        </button>
                        <button className={'worldScreenModuleButton'} onClick={handleToggleRuinsAutoRepeat}>
                          Auto-repeat: {ruinsAutoRepeatDefault ? 'On' : 'Off'}
                        </button>
                      </div>
                    </div>
                  ) : (
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
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
