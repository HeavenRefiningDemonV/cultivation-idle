import { v2_0_0_seed_version_and_meta } from './seedVersionAndMeta.js';
import { v2_0_0_normalize_path_truth } from './normalizePathTruth.js';
import { v2_0_0_plan_gate_item_alias_migration } from './planGateItemAliasMigration.js';
import { v2_0_0_plan_semester_slice_clamp } from './planSemesterSliceClamp.js';
import { v2_0_0_clamp_semester_slice } from './clampSemesterSlice.js';
import { v2_0_0_normalize_city_progression_state } from './normalizeCityProgressionState.js';
import { v2_0_0_plan_deferred_prestige_refund } from './planDeferredPrestigeRefund.js';
import { v2_0_0_plan_trial_resolution_normalization } from './planTrialResolutionNormalization.js';
import { v2_0_0_plan_partial_reset_residue_cleanup } from './planPartialResetResidueCleanup.js';
import { v2_0_0_plan_offline_unification } from './planOfflineUnification.js';
import { v2_0_0_refund_hidden_craft_outputs } from './refundHiddenCraftOutputs.js';
export const v2_0_0MigrationPack = [
    v2_0_0_seed_version_and_meta,
    v2_0_0_normalize_path_truth,
    v2_0_0_plan_gate_item_alias_migration,
    v2_0_0_plan_semester_slice_clamp,
    v2_0_0_clamp_semester_slice,
    v2_0_0_normalize_city_progression_state,
    v2_0_0_refund_hidden_craft_outputs,
    v2_0_0_plan_deferred_prestige_refund,
    v2_0_0_plan_trial_resolution_normalization,
    v2_0_0_plan_partial_reset_residue_cleanup,
    v2_0_0_plan_offline_unification,
];
