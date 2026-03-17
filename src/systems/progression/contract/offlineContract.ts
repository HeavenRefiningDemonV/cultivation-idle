import type { OfflineProgressionContract } from './contractTypes.js';

export const OFFLINE_PROGRESSION_CONTRACT: OfflineProgressionContract = {
  pipelineId: 'offline_progression_v1',
  appliesTo: ['cultivation', 'queued_actions', 'expeditions'],
  excludes: ['combat'],
  maxCatchupSeconds: 43200,
  efficiencyModel: 'full_for_supported_systems',
};
