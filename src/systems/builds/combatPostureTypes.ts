import type {
  AiProfile,
  CastingPolicy,
  CultivationPath,
  MedicinePouchSlotKey,
  MedicinePouchSlotState,
} from '../../types/index.js';
import type { TechniqueFamily, TechniqueSupportFlag } from './techniqueFamilies.js';

export type CombatEncounterType = 'outskirts' | 'ruins' | 'trial';
export type CombatPostureRating = 'good' | 'risky' | 'bad';

export interface CombatLoadoutSignals {
  equippedFamilies: TechniqueFamily[];
  equippedSupportFlags: TechniqueSupportFlag[];
  hasSurvivalTool: boolean;
  hasBossTool: boolean;
  hasFarmTool: boolean;
  hasSetupTool: boolean;
}

export interface AiProfileFit {
  rating: CombatPostureRating;
  warnings: string[];
}

export interface CastingPolicyFit {
  rating: CombatPostureRating;
  warnings: string[];
}

export interface MedicinePouchFit {
  rating: CombatPostureRating;
  warnings: string[];
}

export interface CombatPostureContext {
  path: CultivationPath | null;
  aiProfile: AiProfile;
  castingPolicy: CastingPolicy;
  encounterType: CombatEncounterType;
  loadoutSignals: CombatLoadoutSignals;
  pouchAutoUseEnabled: boolean;
  pouchSlots: Record<MedicinePouchSlotKey, MedicinePouchSlotState>;
}

export interface CombatPostureFit {
  aiFit: CombatPostureRating;
  castingFit: CombatPostureRating;
  pouchFit: CombatPostureRating;
  warnings: string[];
}

export const COMBAT_POSTURE_RATING_ORDER: readonly CombatPostureRating[] = Object.freeze([
  'good',
  'risky',
  'bad',
]);

export const SERIOUS_COMBAT_ENCOUNTERS: readonly CombatEncounterType[] = Object.freeze([
  'ruins',
  'trial',
]);
