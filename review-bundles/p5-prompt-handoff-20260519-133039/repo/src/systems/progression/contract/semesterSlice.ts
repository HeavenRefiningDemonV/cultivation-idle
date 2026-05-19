import type { SemesterSliceContract } from './contractTypes.js';
import { CANONICAL_MAJOR_REALMS } from './realmMap.js';

export const SEMESTER_SLICE_CONTRACT: SemesterSliceContract = {
  id: 'semester_0',
  label: 'Five-city / five-trial authored slice ending at Spirit Severing',
  liveMajorRealms: CANONICAL_MAJOR_REALMS,
  liveTrialIds: [
    'trial_novices_clearing',
    'trial_stone_core_sanctum',
    'trial_patriarchs_seal',
    'trial_soul_lantern_vault',
    'trial_severing_court',
  ],
  liveCityIds: [
    'city_pinewind_hamlet',
    'city_stonecrag_town',
    'city_spirit_cavern_city',
    'city_lotusford',
    'city_ironpeak_bastion',
  ],
  contentCapRealm: 'spirit_severing',
};
