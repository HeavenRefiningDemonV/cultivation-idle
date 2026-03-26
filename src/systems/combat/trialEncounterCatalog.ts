export interface TrialEncounterDefinition {
  trialId: string;
  bossId: string;
  gateIndex: 1 | 2 | 3 | 4 | 5;
  hp: string;
  atk: string;
  def: string;
  crit: number;
  dodge: number;
}

const TRIAL_ENCOUNTER_CATALOG: Record<string, TrialEncounterDefinition> = {
  trial_novices_clearing: {
    trialId: 'trial_novices_clearing',
    bossId: 'trialboss_forest_sentinel',
    gateIndex: 1,
    hp: '9000',
    atk: '220',
    def: '80',
    crit: 10,
    dodge: 5,
  },
  trial_stone_core_sanctum: {
    trialId: 'trial_stone_core_sanctum',
    bossId: 'trialboss_sanctum_juggernaut',
    gateIndex: 2,
    hp: '18000',
    atk: '420',
    def: '160',
    crit: 11,
    dodge: 6,
  },
  trial_patriarchs_seal: {
    trialId: 'trial_patriarchs_seal',
    bossId: 'trialboss_sealkeeper',
    gateIndex: 3,
    hp: '32000',
    atk: '760',
    def: '260',
    crit: 12,
    dodge: 7,
  },
  trial_soul_lantern_vault: {
    trialId: 'trial_soul_lantern_vault',
    bossId: 'trialboss_lantern_warden',
    gateIndex: 4,
    hp: '54000',
    atk: '1180',
    def: '420',
    crit: 13,
    dodge: 8,
  },
  trial_severing_court: {
    trialId: 'trial_severing_court',
    bossId: 'trialboss_severing_judge',
    gateIndex: 5,
    hp: '88000',
    atk: '1840',
    def: '620',
    crit: 15,
    dodge: 10,
  },
};

export function getTrialEncounterByTrialId(trialId: string): TrialEncounterDefinition | null {
  return TRIAL_ENCOUNTER_CATALOG[trialId] ?? null;
}
