import { useContentStore } from '../../stores/contentStore.js';
import { getTrialEncounterByTrialId } from './trialEncounterCatalog.js';

export interface TrialEncounterReadModel {
  trialId: string;
  bossId: string;
  bossName: string;
  gateIndex: number;
  hp: string;
  atk: string;
  def: string;
}

export function buildTrialEncounterReadModel(trialId: string): TrialEncounterReadModel | null {
  const encounter = getTrialEncounterByTrialId(trialId);
  if (!encounter) return null;

  const bossName = useContentStore.getState().maps.enemiesById[encounter.bossId]?.name ?? encounter.bossId;

  return {
    trialId,
    bossId: encounter.bossId,
    bossName,
    gateIndex: encounter.gateIndex,
    hp: encounter.hp,
    atk: encounter.atk,
    def: encounter.def,
  };
}
