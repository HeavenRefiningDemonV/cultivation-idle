import { PROGRESSION_MILESTONE_IDS } from '../../../src/systems/balance/phaseTimingTargets.js';
import type { FreshSaveCheckpointId } from './freshSaveRouteTypes.js';

export type FreshSaveCheckpointCatalogEntry = {
  id: FreshSaveCheckpointId;
  order: number;
  label: string;
  progressionMilestoneId: string | null;
};

export const FRESH_SAVE_CHECKPOINT_ORDER: readonly FreshSaveCheckpointId[] = Object.freeze([
  'life_started',
  'path_selected',
  'heart_law_selected',
  'pinewind_ready',
  'gate_1_available',
  'gate_1_resolved',
  'foundation_entry',
  'stonecrag_entered',
  'gate_2_available',
  'gate_2_resolved',
  'core_formation_entry',
  'spirit_cavern_entered',
  'gate_3_available',
  'gate_3_resolved',
  'nascent_soul_entry',
  'lotusford_entered',
  'gate_4_available',
  'gate_4_resolved',
  'soul_formation_entry',
  'ironpeak_entered',
  'gate_5_available',
  'gate_5_resolved',
  'spirit_severing_entry',
  'content_cap_reached',
  'prestige_advisor_surface_available',
  'current_chapter_exhausted_truth_available',
  'current_life_summary_available',
]);

const MILESTONE_BY_CHECKPOINT_ID: Record<FreshSaveCheckpointId, string | null> = {
  life_started: PROGRESSION_MILESTONE_IDS.LIFE_START,
  path_selected: null,
  heart_law_selected: null,
  pinewind_ready: null,
  gate_1_available: PROGRESSION_MILESTONE_IDS.GATE_1_AVAILABLE,
  gate_1_resolved: null,
  foundation_entry: PROGRESSION_MILESTONE_IDS.FOUNDATION_ENTRY,
  stonecrag_entered: PROGRESSION_MILESTONE_IDS.STONECRAG_ENTERED,
  gate_2_available: null,
  gate_2_resolved: null,
  core_formation_entry: PROGRESSION_MILESTONE_IDS.CORE_FORMATION_ENTRY,
  spirit_cavern_entered: null,
  gate_3_available: null,
  gate_3_resolved: null,
  nascent_soul_entry: PROGRESSION_MILESTONE_IDS.NASCENT_SOUL_ENTRY,
  lotusford_entered: null,
  gate_4_available: null,
  gate_4_resolved: null,
  soul_formation_entry: PROGRESSION_MILESTONE_IDS.SOUL_FORMATION_ENTRY,
  ironpeak_entered: null,
  gate_5_available: null,
  gate_5_resolved: null,
  spirit_severing_entry: PROGRESSION_MILESTONE_IDS.SPIRIT_SEVERING_ENTRY,
  content_cap_reached: PROGRESSION_MILESTONE_IDS.CONTENT_CAP_REACHED,
  prestige_advisor_surface_available: null,
  current_chapter_exhausted_truth_available: null,
  current_life_summary_available: null,
};

export const FRESH_SAVE_CHECKPOINT_CATALOG: readonly FreshSaveCheckpointCatalogEntry[] = Object.freeze(
  FRESH_SAVE_CHECKPOINT_ORDER.map((id, index) => ({
    id,
    order: index + 1,
    label: id.replace(/_/g, ' '),
    progressionMilestoneId: MILESTONE_BY_CHECKPOINT_ID[id],
  })),
);

export const FRESH_SAVE_CHECKPOINT_IDS = new Set<FreshSaveCheckpointId>(FRESH_SAVE_CHECKPOINT_ORDER);
