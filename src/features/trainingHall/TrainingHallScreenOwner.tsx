import { useMemo, useState } from 'react';
import type { TrainingIntensityId } from '../../content/types.js';
import { useActivityStore } from '../../stores/activityStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { getLiveTrainingSupportInput, useTrainingStore } from '../../stores/trainingStore.js';
import { createTrainingRuntimeContent } from '../../systems/training/index.js';
import { useFxQuality } from '../../ui/fx/FxQualityProvider.js';
import { buildTrainingHallSurface } from './buildTrainingHallSurface.js';
import { TrainingHallScreen } from './TrainingHallScreen.js';
import { useTrainingHallActionController } from './useTrainingHallActionController.js';
import './TrainingHallScreen.scss';

export interface TrainingHallScreenOwnerProps {
  cityId?: string | null;
}

export function TrainingHallScreenOwner({ cityId = null }: TrainingHallScreenOwnerProps) {
  const [selectedRegimenId, setSelectedRegimenId] = useState<string | null>(null);
  const [selectedIntensityId, setSelectedIntensityId] = useState<TrainingIntensityId>('steady');
  const rawContent = useContentStore((state) => state.raw);
  const contentSignature = useContentStore((state) => `${state.isLoaded ? '1' : '0'}:${Object.keys(state.maps.citiesById).length}`);
  const selectedPath = useGameStore((state) => state.selectedPath);
  const realmIndex = useGameStore((state) => state.realm.index);
  const substageIndex = useGameStore((state) => Math.max(0, state.realm.substage - 1));
  const activeActivity = useActivityStore((state) => state.active);
  const trainingSchemaVersion = useTrainingStore((state) => state.schemaVersion);
  const statRatingsById = useTrainingStore((state) => state.statRatingsById);
  const statXpById = useTrainingStore((state) => state.statXpById);
  const regimenMasteryXpById = useTrainingStore((state) => state.regimenMasteryXpById);
  const fatigue = useTrainingStore((state) => state.fatigue);
  const activeRegimenId = useTrainingStore((state) => state.activeRegimenId);
  const activeIntensityId = useTrainingStore((state) => state.activeIntensityId);
  const lastTickAt = useTrainingStore((state) => state.lastTickAt);
  const lastOfflineSummary = useTrainingStore((state) => state.lastOfflineSummary);
  const prestigeMemoryAppliedForLife = useTrainingStore((state) => state.prestigeMemoryAppliedForLife);
  const cultivationSupportSignature = useCultivationStore((state) => [
    state.selectedHeartLawId,
    state.chapter,
    Object.entries(state.rootResonanceByPair).map(([id, value]) => `${id}:${Math.floor(value)}`).sort().join(','),
  ].join('|'));
  const prestigeSupportSignature = usePrestigeStore((state) => [
    state.spiritRoot ? `${state.spiritRoot.element}:${state.spiritRoot.grade}:${Math.floor(state.spiritRoot.purity)}` : 'no-root',
    Object.entries(state.purchasesById).map(([id, value]) => `${id}:${value}`).sort().join(','),
  ].join('|'));
  const trainingSignature = useTrainingStore((state) => [
    state.activeRegimenId,
    state.activeIntensityId,
    Math.floor(state.fatigue),
    Object.entries(state.statRatingsById).map(([id, rating]) => `${id}:${rating}`).sort().join(','),
    Object.entries(state.statXpById).map(([id, xp]) => `${id}:${Math.floor(xp)}`).sort().join(','),
    Object.entries(state.regimenMasteryXpById).map(([id, xp]) => `${id}:${Math.floor(xp)}`).sort().join(','),
    state.lastOfflineSummary?.completedAt ?? '',
  ].join('|'));
  const trainingState = useMemo(() => ({
    schemaVersion: trainingSchemaVersion,
    statRatingsById: { ...statRatingsById },
    statXpById: { ...statXpById },
    regimenMasteryXpById: { ...regimenMasteryXpById },
    fatigue,
    activeRegimenId,
    activeIntensityId,
    lastTickAt,
    lastOfflineSummary: lastOfflineSummary
      ? {
        ...lastOfflineSummary,
        statXpGainedById: { ...lastOfflineSummary.statXpGainedById },
        masteryXpGainedByRegimenId: { ...lastOfflineSummary.masteryXpGainedByRegimenId },
      }
      : null,
    prestigeMemoryAppliedForLife,
  }), [
    activeIntensityId,
    activeRegimenId,
    fatigue,
    lastOfflineSummary,
    lastTickAt,
    prestigeMemoryAppliedForLife,
    regimenMasteryXpById,
    statRatingsById,
    statXpById,
    trainingSchemaVersion,
  ]);
  const { prefersReducedMotion } = useFxQuality();
  const controller = useTrainingHallActionController();
  const supportMultipliers = useMemo(() => getLiveTrainingSupportInput(), [
    cultivationSupportSignature,
    prestigeSupportSignature,
  ]);

  const runtimeContent = useMemo(() => createTrainingRuntimeContent(rawContent ?? {}), [rawContent, contentSignature]);
  const surface = useMemo(() => buildTrainingHallSurface({
    content: runtimeContent,
    state: trainingState,
    selectedPath,
    realmIndex,
    substageIndex,
    activeActivity,
    cityId,
    selectedRegimenId,
    selectedIntensityId,
    prefersReducedMotion,
    supportMultipliers,
  }), [
    activeActivity,
    cityId,
    prefersReducedMotion,
    realmIndex,
    runtimeContent,
    selectedIntensityId,
    selectedPath,
    selectedRegimenId,
    substageIndex,
    supportMultipliers,
    trainingSignature,
    trainingState,
  ]);

  return (
    <TrainingHallScreen
      surface={surface}
      onSelectRegimen={setSelectedRegimenId}
      onSelectIntensity={setSelectedIntensityId}
      onStartTraining={(regimenId, intensityId) => controller.startTraining(regimenId, intensityId)}
      onStopTraining={() => controller.stopTraining()}
    />
  );
}
