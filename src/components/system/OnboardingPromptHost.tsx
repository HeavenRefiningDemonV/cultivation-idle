import { useEffect } from 'react';
import { useCityStore } from '../../stores/cityStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useHeartLawStore } from '../../stores/heartLawStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { openWorldModule } from '../../systems/world/openWorldModule.js';
import { createFirstPinewindArrivalPrompt } from '../../systems/ui/onboardingPromptRegistry.js';
import { OnboardingCalloutCard } from './OnboardingCalloutCard.js';
import './OnboardingPromptHost.scss';

export function OnboardingPromptHost() {
  const activePrompt = useUIStore((state) => state.activeOnboardingPrompt);
  const queuedPrompts = useUIStore((state) => state.queuedOnboardingPrompts);
  const queueOnboardingPrompt = useUIStore((state) => state.queueOnboardingPrompt);
  const completeOnboardingPrompt = useUIStore((state) => state.completeOnboardingPrompt);
  const activateNextOnboardingPrompt = useUIStore((state) => state.activateNextOnboardingPrompt);
  const currentCityId = useCityStore((state) => state.currentCityId);
  const unlockedCityIds = useCityStore((state) => state.unlockedCityIds);
  const selectedPath = useGameStore((state) => state.selectedPath);
  const selectedHeartLawId = useHeartLawStore((state) => state.selectedHeartLawId);
  const activeTab = useUIStore((state) => state.activeTab);
  const showWorldBuildingModal = useUIStore((state) => state.showWorldBuildingModal);
  const showPerkSelectionModal = useUIStore((state) => state.showPerkSelectionModal);
  const showOfflineProgressModal = useUIStore((state) => state.showOfflineProgressModal);
  const showManualSatchelModal = useUIStore((state) => state.showManualSatchelModal);
  const showTechniqueLearnedModal = useUIStore((state) => state.showTechniqueLearnedModal);
  const showCurrentChapterExhaustedModal = useUIStore((state) => state.showCurrentChapterExhaustedModal);
  const pendingCityArrivalId = useUIStore((state) => state.pendingCityArrivalId);
  const combatPresentation = useUIStore((state) => state.combatPresentation);
  const prestigeCount = usePrestigeStore((state) => state.prestigeCount);

  useEffect(() => {
    const wizardOpen = selectedPath === null || selectedHeartLawId === null;
    const inFreshPinewind = currentCityId === 'city_pinewind_hamlet' && unlockedCityIds.length === 1 && prestigeCount === 0;

    if (!wizardOpen && activeTab === 'adventure' && inFreshPinewind) {
      queueOnboardingPrompt(createFirstPinewindArrivalPrompt('city_pinewind_hamlet'));
    }
  }, [activeTab, currentCityId, prestigeCount, queueOnboardingPrompt, selectedHeartLawId, selectedPath, unlockedCityIds.length]);

  const blocked = (selectedPath === null || selectedHeartLawId === null)
    || showWorldBuildingModal
    || showPerkSelectionModal
    || showOfflineProgressModal
    || showManualSatchelModal
    || showTechniqueLearnedModal
    || showCurrentChapterExhaustedModal
    || combatPresentation.mode !== 'hidden'
    || pendingCityArrivalId !== null;

  useEffect(() => {
    if (!blocked && !activePrompt && queuedPrompts.length > 0) {
      activateNextOnboardingPrompt();
    }
  }, [activateNextOnboardingPrompt, activePrompt, blocked, queuedPrompts.length]);

  if (blocked || !activePrompt) return null;

  const handleAction = () => {
    const primary = activePrompt.primaryAction;
    if (!primary || primary.target.kind === 'none') {
      completeOnboardingPrompt(activePrompt.key);
      return;
    }

    if (primary.target.kind === 'tab' && primary.target.tab) {
      useUIStore.getState().setActiveTab(primary.target.tab);
      completeOnboardingPrompt(activePrompt.key);
      return;
    }

    if (primary.target.kind === 'world_module' && primary.target.cityId && primary.target.moduleKey) {
      openWorldModule({
        cityId: primary.target.cityId,
        moduleKey: primary.target.moduleKey,
        source: 'onboarding-prompt-host',
      });
      completeOnboardingPrompt(activePrompt.key);
      return;
    }

    completeOnboardingPrompt(activePrompt.key);
  };

  return (
    <div className="onboardingPromptHost">
      <OnboardingCalloutCard
        prompt={activePrompt}
        onPrimaryAction={handleAction}
        onSecondaryAction={() => completeOnboardingPrompt(activePrompt.key)}
      />
    </div>
  );
}
