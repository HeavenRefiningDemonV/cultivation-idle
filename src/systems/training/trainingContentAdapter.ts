import type {
  CultivatorStatsConfig,
  TrainingRegimensConfig,
} from '../../content/types.js';
import type { TrainingRuntimeContent } from './trainingTypes.js';

export interface TrainingRuntimeContentSource {
  cultivator_stats?: CultivatorStatsConfig;
  training_regimens?: TrainingRegimensConfig;
}

const byId = <T extends { id: string }>(entries: T[]): Record<string, T> =>
  Object.fromEntries(entries.map((entry) => [entry.id, entry]));

export function createTrainingRuntimeContent(source: TrainingRuntimeContentSource): TrainingRuntimeContent {
  const stats = Array.isArray(source.cultivator_stats?.stats) ? source.cultivator_stats.stats : [];
  const regimens = Array.isArray(source.training_regimens?.regimens) ? source.training_regimens.regimens : [];
  const intensities = Array.isArray(source.training_regimens?.intensities) ? source.training_regimens.intensities : [];

  return {
    stats,
    regimens,
    intensities,
    statsById: byId(stats),
    regimensById: byId(regimens),
    intensitiesById: byId(intensities),
    masteryMilestones: Array.isArray(source.training_regimens?.masteryMilestones)
      ? [...source.training_regimens.masteryMilestones]
      : [],
  };
}
