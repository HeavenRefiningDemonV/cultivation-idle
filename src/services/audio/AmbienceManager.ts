import type { SoundId } from './soundIds';
import { audio } from './index';
import { useUIStore, type WorldBuildingKey, type UIState } from '../../stores/uiStore';
import { useActivityStore } from '../../stores/activityStore';
import { useCombatStore } from '../../stores/combatStore';
import { useCityStore, type CityState } from '../../stores/cityStore';
import { isCombatModule } from '../../systems/world/openWorldModule';

const AMBIENCE_BY_BUILDING: Partial<Record<WorldBuildingKey, SoundId>> = {
  apothecary: 'amb_building_apothecary_loop',
  manualPavilion: 'amb_building_manual_pavilion_loop',
  alchemy: 'amb_building_alchemy_hall_loop',
  forge: 'amb_building_forge_loop',
  talismanStudio: 'amb_building_talisman_studio_loop',
  bounties: 'amb_building_bounty_board_loop',
  expeditions: 'amb_building_expedition_board_loop',
};

const COMBAT_MODULE_AMBIENCE: Record<string, SoundId> = {
  outskirts: 'amb_outskirts_loop',
  gateTrial: 'amb_trial_loop',
  ruins: 'amb_ruins_loop',
};

const DEFAULT_FADE_MS = 600;

const selectActiveTab = (state: UIState) => state.activeTab;
const selectWorldBuildingKey = (state: UIState) => state.worldBuildingModalKey;
const selectWorldBuildingVisible = (state: UIState) => state.showWorldBuildingModal;
const selectCombatPresentationMode = (state: UIState) => state.combatPresentation.mode;
const selectCombatPresentationType = (state: UIState) => state.combatPresentation.context?.type ?? null;

const selectActiveActivityType = (state: ReturnType<typeof useActivityStore.getState>) => state.active?.type ?? null;
const selectCombatType = (state: ReturnType<typeof useCombatStore.getState>) => state.combatContext.type ?? null;
const selectInCombat = (state: ReturnType<typeof useCombatStore.getState>) => state.inCombat;
const selectActiveModule = (state: CityState) => {
  const cityId = state.currentCityId;
  return cityId ? state.selectedModuleByCity[cityId] ?? null : null;
};

const resolveAmbience = (): SoundId | null => {
  const ui = useUIStore.getState();
  const activity = useActivityStore.getState();
  const combat = useCombatStore.getState();
  const city = useCityStore.getState();

  if (activity.active?.type === 'meditate') {
    return 'amb_building_meditation_hall_loop';
  }

  const combatType = combat.inCombat ? combat.combatContext.type : ui.combatPresentation.context?.type;
  if (combatType) {
    if (combatType === 'trial') return 'amb_trial_loop';
    if (combatType === 'outskirts') return 'amb_outskirts_loop';
    if (combatType === 'ruins') return 'amb_ruins_loop';
  }

  if (ui.activeTab === 'adventure') {
    if (ui.showWorldBuildingModal && ui.worldBuildingModalKey) {
      return AMBIENCE_BY_BUILDING[ui.worldBuildingModalKey] ?? null;
    }

    const activeModule = selectActiveModule(city);
    if (activeModule && isCombatModule(activeModule)) {
      return COMBAT_MODULE_AMBIENCE[activeModule] ?? null;
    }

    return 'amb_city_hub_day_loop';
  }

  return null;
};

export function initAmbienceManager(): () => void {
  let current: SoundId | null = null;

  const update = () => {
    const next = resolveAmbience();
    if (next === current) return;
    current = next ?? null;
    if (current) {
      audio.startAmbience(current, { fadeMs: DEFAULT_FADE_MS });
    } else {
      audio.stopAmbience({ fadeMs: DEFAULT_FADE_MS });
    }
  };

  update();

  const unsubActiveTab = useUIStore.subscribe(selectActiveTab, update);
  const unsubWorldBuildingKey = useUIStore.subscribe(selectWorldBuildingKey, update);
  const unsubWorldBuildingVisible = useUIStore.subscribe(selectWorldBuildingVisible, update);
  const unsubCombatMode = useUIStore.subscribe(selectCombatPresentationMode, update);
  const unsubCombatType = useUIStore.subscribe(selectCombatPresentationType, update);
  const unsubActivity = useActivityStore.subscribe(selectActiveActivityType, update);
  const unsubCombatContext = useCombatStore.subscribe(selectCombatType, update);
  const unsubInCombat = useCombatStore.subscribe(selectInCombat, update);
  const unsubModule = useCityStore.subscribe(selectActiveModule, update);

  return () => {
    unsubActiveTab();
    unsubWorldBuildingKey();
    unsubWorldBuildingVisible();
    unsubCombatMode();
    unsubCombatType();
    unsubActivity();
    unsubCombatContext();
    unsubInCombat();
    unsubModule();
  };
}
