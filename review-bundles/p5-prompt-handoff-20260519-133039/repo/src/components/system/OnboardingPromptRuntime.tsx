import { useEffect, useMemo, useRef } from 'react';
import { useContentStore } from '../../stores/contentStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useTrialStore } from '../../stores/trialStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { getPrestigeAdvisorSurface } from '../../features/prestige/prestigeAdvisorSurface.js';
import { buildSection5PostFailureSurface } from '../../systems/readiness/section5Adapters.js';
import { getCurrentGateTrialId } from '../../systems/readiness/readinessRuntime.js';
import { getTrialLifecycleSnapshot } from '../../systems/progression/runtime/index.js';
import {
  createFirstGateAvailablePrompt,
  createFirstMajorFailurePrompt,
  createFirstPrestigeViablePrompt,
} from '../../systems/ui/onboardingPromptRegistry.js';
import { SEMESTER_SLICE_CONTRACT } from '../../systems/progression/contract/semesterSlice.js';
import { sanitizeLiveCityName } from '../../ui/text/playerFacingLabels.js';

export function OnboardingPromptRuntime() {
  const content = useContentStore((state) => state.raw);
  const trialsById = useContentStore((state) => state.maps.trialsById);
  const citiesById = useContentStore((state) => state.maps.citiesById);
  const trialProgressById = useTrialStore((state) => state.progressByTrialId);
  const realm = useGameStore((state) => state.realm);
  const qi = useGameStore((state) => state.qi);
  const getBreakthroughRequirement = useGameStore((state) => state.getBreakthroughRequirement);
  const getItemCount = useInventoryStore((state) => state.getItemCount);
  const prestigeCount = usePrestigeStore((state) => state.prestigeCount);
  const activeTab = useUIStore((state) => state.activeTab);
  const queueOnboardingPrompt = useUIStore((state) => state.queueOnboardingPrompt);

  const previousGateAvailableRef = useRef(false);
  const previousFailureAvailableRef = useRef(false);
  const previousPrestigeViableRef = useRef(false);

  const firstGateCandidate = useMemo(() => {
    if (!content) return null;
    const trialId = getCurrentGateTrialId();
    if (!trialId) return null;
    const trial = trialsById[trialId];
    if (!trial) return null;
    const progress = trialProgressById[trialId] ?? null;
    if (progress?.resolution === 'cleared' || progress?.resolution === 'bypassed') return null;

    const requiredItemSatisfied = !trial.requiredItemId || getItemCount(trial.requiredItemId) > 0;
    const lifecycle = getTrialLifecycleSnapshot({
      content,
      trial,
      progress,
      realm,
      qi,
      breakthroughRequirement: getBreakthroughRequirement(),
      requiredItemSatisfied,
    });

    const hasAnyGateAttempts = Object.values(trialProgressById).some((entry) => (entry?.attempts ?? 0) > 0);
    if (!lifecycle.canStart || hasAnyGateAttempts) return null;

    const city = citiesById[trial.cityId];
    return {
      cityId: trial.cityId,
      cityName: sanitizeLiveCityName(city?.name ?? 'Gate Trial'),
    };
  }, [citiesById, content, getBreakthroughRequirement, getItemCount, qi, realm, trialProgressById, trialsById]);

  useEffect(() => {
    const isAvailable = Boolean(firstGateCandidate);
    if (isAvailable && !previousGateAvailableRef.current && firstGateCandidate) {
      queueOnboardingPrompt(
        createFirstGateAvailablePrompt({
          cityId: firstGateCandidate.cityId,
          cityName: firstGateCandidate.cityName,
        }),
      );
    }
    previousGateAvailableRef.current = isAvailable;
  }, [firstGateCandidate, queueOnboardingPrompt]);

  const firstFailureCandidate = useMemo(() => {
    const trialId = SEMESTER_SLICE_CONTRACT.liveTrialIds.find((candidateId) => {
      const progress = trialProgressById[candidateId];
      return Boolean(progress?.lastAttemptSummary) && (progress?.attempts ?? 0) > 0;
    });
    if (!trialId) return null;

    const progress = trialProgressById[trialId];
    const surface = buildSection5PostFailureSurface(trialId);
    if (!surface || surface.state !== 'available' || !progress?.lastAttemptSummary) return null;

    const trial = trialsById[trialId];
    if (!trial) return null;
    return { cityId: trial.cityId };
  }, [trialProgressById, trialsById]);

  useEffect(() => {
    const isAvailable = Boolean(firstFailureCandidate);
    if (isAvailable && !previousFailureAvailableRef.current && firstFailureCandidate) {
      queueOnboardingPrompt(createFirstMajorFailurePrompt({ cityId: firstFailureCandidate.cityId }));
    }
    previousFailureAvailableRef.current = isAvailable;
  }, [firstFailureCandidate, queueOnboardingPrompt]);

  const prestigeViable = useMemo(() => {
    if (prestigeCount > 0) return false;
    if (activeTab === 'prestige') return false;
    const advisor = getPrestigeAdvisorSurface();
    return advisor.stateLabel === 'Viable' || advisor.stateLabel === 'Recommended';
  }, [activeTab, prestigeCount]);

  useEffect(() => {
    if (prestigeViable && !previousPrestigeViableRef.current) {
      queueOnboardingPrompt(createFirstPrestigeViablePrompt());
    }
    previousPrestigeViableRef.current = prestigeViable;
  }, [prestigeViable, queueOnboardingPrompt]);

  return null;
}
