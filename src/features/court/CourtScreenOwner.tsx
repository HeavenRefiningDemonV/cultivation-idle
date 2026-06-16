import { useEffect, useMemo } from 'react';

import { useActivityStore } from '../../stores/activityStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useTrainingStore } from '../../stores/trainingStore.js';
import type { CourtIntensityId } from '../../systems/meridians/index.js';
import { TemperingCourt } from '../../ui/court/index.js';
import { useFxQuality } from '../../ui/fx/FxQualityProvider.js';
import { buildLiveCourtSurface } from './buildLiveCourtSurface.js';
import { resolveCourtSharedStats } from './courtSharedStats.js';
import { useCourtMeridianStore } from './useCourtMeridianStore.js';
import { useMeridianPack } from './useMeridianPack.js';

/**
 * W13a-3b — the LIVE Tempering Court owner (flag-gated via isTemperingCourtEnabled). The
 * counterpart of TrainingHallScreenOwner: resolves the player's real path/realm/activity/
 * shared-tier stats + the meridian store into the W6 surface and renders <TemperingCourt>,
 * wiring the controls to the meridian store + the activity gate.
 *
 * Mounted only behind the off flag (or the dev ?temperingCourt=1 override). NOTE: actual
 * per-tick XP advancement is W13a-4 (the gameStore tick hook); here Start/Cease flips the
 * foreground activity (so the status seal reads active/idle) and selections update the
 * store — enough to review the live binding before the tick lands.
 */
export interface CourtScreenOwnerProps {
  cityId?: string | null;
  onReturn?: () => void;
}

export function CourtScreenOwner({ onReturn }: CourtScreenOwnerProps) {
  const selectedPath = useGameStore((s) => s.selectedPath);
  const realmIndex = useGameStore((s) => s.realm.index);
  const realmName = useGameStore((s) => s.realm.name);
  const qi = useGameStore((s) => s.qi);
  const getBreakthroughRequirement = useGameStore((s) => s.getBreakthroughRequirement);
  const activeActivity = useActivityStore((s) => s.active);
  const statRatingsById = useTrainingStore((s) => s.statRatingsById);
  const { prefersReducedMotion } = useFxQuality();
  const meridianDefs = useMeridianPack();

  const activeMeridianId = useCourtMeridianStore((s) => s.activeMeridianId);
  const rootByMeridianId = useCourtMeridianStore((s) => s.rootByMeridianId);
  const progressByMeridianId = useCourtMeridianStore((s) => s.progressByMeridianId);
  const intensityId = useCourtMeridianStore((s) => s.intensityId);
  const fatigue = useCourtMeridianStore((s) => s.fatigue);
  const setActiveMeridian = useCourtMeridianStore((s) => s.setActiveMeridian);
  const setIntensity = useCourtMeridianStore((s) => s.setIntensity);
  const ensureRootsForPath = useCourtMeridianStore((s) => s.ensureRootsForPath);

  const pathMeridianIds = useMemo(
    () =>
      meridianDefs
        .filter((d) => d.path === selectedPath)
        .sort((a, b) => a.unlockRealm - b.unlockRealm)
        .map((d) => d.id),
    [meridianDefs, selectedPath],
  );

  // Roll roots for the chosen path + default the active meridian once the pack loads.
  useEffect(() => {
    if (!selectedPath || pathMeridianIds.length === 0) return;
    ensureRootsForPath(pathMeridianIds);
    if (!activeMeridianId || !pathMeridianIds.includes(activeMeridianId)) {
      const firstUnlocked =
        meridianDefs.find((d) => d.path === selectedPath && d.unlockRealm <= realmIndex + 1)?.id ?? pathMeridianIds[0];
      if (firstUnlocked) setActiveMeridian(firstUnlocked);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPath, pathMeridianIds, realmIndex]);

  const shared = useMemo(() => resolveCourtSharedStats(statRatingsById), [statRatingsById]);
  const cultPct = useMemo(() => {
    let required = 0;
    try {
      required = Number(getBreakthroughRequirement?.() ?? 0);
    } catch {
      required = 0;
    }
    return required > 0 ? Math.min(1, Math.max(0, Number(qi) / required)) : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qi, realmIndex, getBreakthroughRequirement]);

  const surface = useMemo(
    () =>
      buildLiveCourtSurface({
        selectedPath,
        realmIndex0Based: realmIndex,
        realmName,
        cultPct,
        activeActivity,
        isCourtTraining: activeActivity?.type === 'path_training',
        fatigue,
        intensityId,
        perception: shared.perception,
        axes: shared.axes,
        foundation: shared.foundation,
        trainingState: { activeMeridianId, rootByMeridianId, progressByMeridianId },
        meridianDefs,
      }),
    [
      selectedPath,
      realmIndex,
      realmName,
      cultPct,
      activeActivity,
      fatigue,
      intensityId,
      shared,
      activeMeridianId,
      rootByMeridianId,
      progressByMeridianId,
      meridianDefs,
    ],
  );

  return (
    <TemperingCourt
      surface={surface}
      reducedMotion={prefersReducedMotion}
      onSelectMeridian={(id) => setActiveMeridian(id)}
      onSelectIntensity={(id: CourtIntensityId) => setIntensity(id)}
      onStart={() => useActivityStore.getState().startActivity('path_training', undefined, 'court:start')}
      onCease={() => useActivityStore.getState().stopActivity('court:cease')}
      onReturn={onReturn}
    />
  );
}
