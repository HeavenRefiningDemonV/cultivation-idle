import { buildDoctrineSnapshot } from '../doctrine/index.js';
import { useMedicinePouchStore } from '../../stores/medicinePouchStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import {
  type AiProfile,
  type CastingPolicy,
  type MedicinePouchSlotKey,
  type MedicinePouchSlotState,
} from '../../types/index.js';
import { buildLoadoutSnapshot } from './loadoutSnapshot.js';
import {
  TECHNIQUE_FAMILY_ORDER,
  TECHNIQUE_SUPPORT_FLAG_ORDER,
} from './techniqueFamilies.js';
import { getTechniqueTaxonomyProfile } from './techniqueTaxonomy.js';
import { evaluateAiProfileFit } from './aiProfileFit.js';
import {
  evaluateCastingPolicyFit,
  getDefaultCastingPolicyForAiProfile,
} from './castingPolicyFit.js';
import { evaluateMedicinePouchFit } from './medicinePouchFit.js';
import type {
  CombatEncounterType,
  CombatLoadoutSignals,
  CombatPostureContext,
  CombatPostureFit,
} from './combatPostureTypes.js';

const VALID_AI_PROFILES: readonly AiProfile[] = Object.freeze([
  'balanced',
  'survivor',
  'burst',
  'farmer',
]);

function dedupeInOrder<T>(values: readonly T[]): T[] {
  const seen = new Set<T>();
  const deduped: T[] = [];
  values.forEach((value) => {
    if (seen.has(value)) return;
    seen.add(value);
    deduped.push(value);
  });
  return deduped;
}

function createFallbackPouchSlots(): Record<MedicinePouchSlotKey, MedicinePouchSlotState> {
  return {
    healing: {
      slotKey: 'healing',
      equippedItemId: null,
      enabled: false,
      trigger: 'manual',
      thresholdPct: 0,
      cooldownSec: 0,
      bossOnly: false,
      lastUsedAt: null,
    },
    utility: {
      slotKey: 'utility',
      equippedItemId: null,
      enabled: false,
      trigger: 'manual',
      thresholdPct: 0,
      cooldownSec: 0,
      bossOnly: false,
      lastUsedAt: null,
    },
    specialty: {
      slotKey: 'specialty',
      equippedItemId: null,
      enabled: false,
      trigger: 'manual',
      thresholdPct: 0,
      cooldownSec: 0,
      bossOnly: false,
      lastUsedAt: null,
    },
  };
}

function clonePouchSlots(
  slots?: Partial<Record<MedicinePouchSlotKey, MedicinePouchSlotState>>,
): Record<MedicinePouchSlotKey, MedicinePouchSlotState> {
  const fallback = createFallbackPouchSlots();
  return {
    healing: { ...fallback.healing, ...(slots?.healing ?? {}) },
    utility: { ...fallback.utility, ...(slots?.utility ?? {}) },
    specialty: { ...fallback.specialty, ...(slots?.specialty ?? {}) },
  };
}

function normalizeAiProfile(value: unknown): AiProfile | null {
  return typeof value === 'string' && VALID_AI_PROFILES.includes(value as AiProfile)
    ? value as AiProfile
    : null;
}

export function buildCombatLoadoutSignals(techniqueIds: readonly string[]): CombatLoadoutSignals {
  const familiesSeen = new Set<(typeof TECHNIQUE_FAMILY_ORDER)[number]>();
  const supportFlagsSeen = new Set<(typeof TECHNIQUE_SUPPORT_FLAG_ORDER)[number]>();

  techniqueIds.forEach((techniqueId) => {
    const profile = getTechniqueTaxonomyProfile(techniqueId);
    if (!profile) return;
    profile.families.forEach((family) => familiesSeen.add(family));
    profile.supportFlags.forEach((flag) => supportFlagsSeen.add(flag));
  });

  const equippedFamilies = TECHNIQUE_FAMILY_ORDER.filter((family) => familiesSeen.has(family));
  const equippedSupportFlags = TECHNIQUE_SUPPORT_FLAG_ORDER.filter((flag) => supportFlagsSeen.has(flag));

  return {
    equippedFamilies: [...equippedFamilies],
    equippedSupportFlags: [...equippedSupportFlags],
    hasSurvivalTool:
      equippedSupportFlags.includes('survival') ||
      equippedFamilies.some((family) => family === 'guard' || family === 'heal' || family === 'cleanse'),
    hasBossTool:
      equippedSupportFlags.includes('boss') ||
      equippedFamilies.includes('execute'),
    hasFarmTool:
      equippedSupportFlags.includes('farm') ||
      equippedFamilies.some((family) => family === 'aoe' || family === 'farm'),
    hasSetupTool:
      equippedFamilies.some((family) => family === 'setup' || family === 'control'),
  };
}

export function evaluateCombatPostureFitFromContext(
  input: CombatPostureContext,
): CombatPostureFit {
  const aiResult = evaluateAiProfileFit({
    path: input.path,
    aiProfile: input.aiProfile,
    encounterType: input.encounterType,
    loadoutSignals: input.loadoutSignals,
  });
  const castingResult = evaluateCastingPolicyFit({
    aiProfile: input.aiProfile,
    castingPolicy: input.castingPolicy,
    encounterType: input.encounterType,
    loadoutSignals: input.loadoutSignals,
  });
  const pouchResult = evaluateMedicinePouchFit({
    encounterType: input.encounterType,
    pouchAutoUseEnabled: input.pouchAutoUseEnabled,
    slots: clonePouchSlots(input.pouchSlots),
  });

  return {
    aiFit: aiResult.rating,
    castingFit: castingResult.rating,
    pouchFit: pouchResult.rating,
    warnings: dedupeInOrder([
      ...aiResult.warnings,
      ...castingResult.warnings,
      ...pouchResult.warnings,
    ]),
  };
}

export function buildCurrentCombatPostureContext(
  encounterType: CombatEncounterType,
): CombatPostureContext {
  const doctrine = buildDoctrineSnapshot();
  const loadoutSnapshot = buildLoadoutSnapshot(doctrine.selectedLoadoutId ?? undefined);
  const uiSettings = useUIStore.getState().settings;

  const effectiveAiProfile =
    normalizeAiProfile(uiSettings?.combatAIProfile) ??
    normalizeAiProfile(loadoutSnapshot.aiProfile) ??
    normalizeAiProfile(doctrine.aiProfile) ??
    'balanced';

  const effectiveCastingPolicy =
    loadoutSnapshot.castingPolicy ??
    doctrine.castingPolicy ??
    getDefaultCastingPolicyForAiProfile(effectiveAiProfile);

  const pouchSlots = clonePouchSlots(useMedicinePouchStore.getState().slots);
  const pouchAutoUseEnabled = Boolean(useUIStore.getState().settings.useConsumablesInCombat);

  const equippedTechniqueIds = [
    ...loadoutSnapshot.equipped.active,
    ...loadoutSnapshot.equipped.passive,
    ...(loadoutSnapshot.equipped.ultimate ? [loadoutSnapshot.equipped.ultimate] : []),
  ];
  const loadoutSignals = buildCombatLoadoutSignals(equippedTechniqueIds);

  return {
    path: doctrine.path,
    aiProfile: effectiveAiProfile,
    castingPolicy: effectiveCastingPolicy,
    encounterType,
    loadoutSignals,
    pouchAutoUseEnabled,
    pouchSlots,
  };
}

export function evaluateCurrentCombatPostureFit(
  encounterType: CombatEncounterType,
): CombatPostureFit {
  return evaluateCombatPostureFitFromContext(
    buildCurrentCombatPostureContext(encounterType),
  );
}
