export type PrepCategory = 'consumables' | 'equipment' | 'build';

export interface PrepConsumableRequirement {
  itemId: string;
  quantity: number;
}

export interface PrepEquipmentRequirement {
  slot: 'weapon' | 'accessory' | 'either';
  anyOf: string[];
  label: string;
}

export interface PrepBuildRequirement {
  type: 'selectedPath' | 'unlockedTechniqueCount' | 'techniqueProgress';
  minValue: number;
  label: string;
}

export interface GatePrepBand {
  consumables: PrepConsumableRequirement[];
  equipment: PrepEquipmentRequirement[];
  build: PrepBuildRequirement[];
}

export interface CurrentBranchGatePrepProfile {
  gateId: 'novice_clearing' | 'stone_core_sanctum' | 'nascent_soul_chamber';
  label: string;
  phaseId: 'phase_1' | 'phase_2' | 'phase_3';
  minimum: GatePrepBand;
  recommended: GatePrepBand;
  bestSources: Record<PrepCategory, { zoneId?: string; routeToken: 'adventure' | 'inventory' | 'cultivation' | 'status'; label: string }>;
  maxMajorCorrectionCategories: number;
}

export const CURRENT_BRANCH_GATE_PREP_PROFILES: Record<string, CurrentBranchGatePrepProfile> = {
  novice_clearing: {
    gateId: 'novice_clearing',
    label: "Novice's Clearing",
    phaseId: 'phase_1',
    minimum: {
      consumables: [{ itemId: 'health_pill', quantity: 2 }],
      equipment: [{ slot: 'either', anyOf: ['basic_sword', 'jade_pendant'], label: 'Equip Basic Sword or Jade Pendant' }],
      build: [],
    },
    recommended: {
      consumables: [{ itemId: 'health_pill', quantity: 4 }],
      equipment: [
        { slot: 'weapon', anyOf: ['basic_sword'], label: 'Equip Basic Sword' },
        { slot: 'accessory', anyOf: ['jade_pendant'], label: 'Equip Jade Pendant' },
      ],
      build: [],
    },
    bestSources: {
      consumables: { zoneId: 'training_forest', routeToken: 'adventure', label: 'Farm Training Forest for early pills and sellables.' },
      equipment: { zoneId: 'training_forest', routeToken: 'adventure', label: 'Farm Training Forest and equip early anchors in Inventory.' },
      build: { routeToken: 'cultivation', label: 'Cultivate to keep progression smooth before your first gate.' },
    },
    maxMajorCorrectionCategories: 3,
  },
  stone_core_sanctum: {
    gateId: 'stone_core_sanctum',
    label: 'Stone Core Sanctum',
    phaseId: 'phase_2',
    minimum: {
      consumables: [{ itemId: 'health_pill', quantity: 4 }],
      equipment: [
        { slot: 'either', anyOf: ['steel_blade', 'spirit_ring'], label: 'Equip Steel Blade or Spirit Ring (mid anchor)' },
        { slot: 'either', anyOf: ['basic_sword', 'jade_pendant', 'steel_blade', 'spirit_ring'], label: 'Fill the other slot with at least an early anchor' },
      ],
      build: [
        { type: 'selectedPath', minValue: 1, label: 'Select a cultivation path' },
        { type: 'unlockedTechniqueCount', minValue: 1, label: 'Unlock at least 1 path technique' },
        { type: 'techniqueProgress', minValue: 1, label: 'Gain real proficiency on your primary technique' },
      ],
    },
    recommended: {
      consumables: [
        { itemId: 'health_pill', quantity: 6 },
        { itemId: 'greater_health_pill', quantity: 1 },
      ],
      equipment: [
        { slot: 'weapon', anyOf: ['steel_blade'], label: 'Equip Steel Blade' },
        { slot: 'accessory', anyOf: ['spirit_ring'], label: 'Equip Spirit Ring' },
      ],
      build: [
        { type: 'selectedPath', minValue: 1, label: 'Selected path confirmed' },
        { type: 'unlockedTechniqueCount', minValue: 1, label: 'Keep at least one path technique active' },
        { type: 'techniqueProgress', minValue: 100, label: 'Push meaningful proficiency on a core technique' },
      ],
    },
    bestSources: {
      consumables: { zoneId: 'spirit_cavern', routeToken: 'adventure', label: 'Run Spirit Cavern for healing stock and support drops.' },
      equipment: { zoneId: 'spirit_cavern', routeToken: 'adventure', label: 'Run Spirit Cavern and upgrade anchors via Inventory equips.' },
      build: { routeToken: 'status', label: 'Review Status and keep using your unlocked path technique in combat.' },
    },
    maxMajorCorrectionCategories: 3,
  },
  nascent_soul_chamber: {
    gateId: 'nascent_soul_chamber',
    label: 'Nascent Soul Chamber',
    phaseId: 'phase_3',
    minimum: {
      consumables: [
        { itemId: 'health_pill', quantity: 4 },
        { itemId: 'greater_health_pill', quantity: 2 },
      ],
      equipment: [
        { slot: 'either', anyOf: ['spirit_blade', 'phoenix_feather'], label: 'Equip Spirit Blade or Phoenix Feather (late anchor)' },
        { slot: 'either', anyOf: ['steel_blade', 'spirit_ring', 'spirit_blade', 'phoenix_feather'], label: 'Fill other slot with at least a mid anchor' },
      ],
      build: [
        { type: 'selectedPath', minValue: 1, label: 'Selected path required' },
        { type: 'unlockedTechniqueCount', minValue: 2, label: 'Unlock at least 2 path techniques by this gate' },
        { type: 'techniqueProgress', minValue: 150, label: 'Have real progress on at least one path technique' },
      ],
    },
    recommended: {
      consumables: [
        { itemId: 'greater_health_pill', quantity: 4 },
        { itemId: 'supreme_health_pill', quantity: 1 },
      ],
      equipment: [
        { slot: 'weapon', anyOf: ['spirit_blade'], label: 'Equip Spirit Blade' },
        { slot: 'accessory', anyOf: ['phoenix_feather'], label: 'Equip Phoenix Feather' },
      ],
      build: [
        { type: 'selectedPath', minValue: 1, label: 'Selected path locked in' },
        { type: 'unlockedTechniqueCount', minValue: 3, label: 'Unlock all realistically available path techniques here' },
        { type: 'techniqueProgress', minValue: 300, label: 'Show strong core-technique progress' },
      ],
    },
    bestSources: {
      consumables: { zoneId: 'mystic_mountains', routeToken: 'adventure', label: 'Farm Mystic Mountains for late healing stock and value.' },
      equipment: { zoneId: 'mystic_mountains', routeToken: 'adventure', label: 'Farm Mystic Mountains and equip late anchors from Inventory.' },
      build: { routeToken: 'status', label: 'Review Status and keep rotating unlocked path techniques in combat.' },
    },
    maxMajorCorrectionCategories: 3,
  },
};

export const CURRENT_BRANCH_PREP_RECOVERY_TARGETS = {
  fullPackageMinutes: {
    novice_clearing: { minMinutes: 15, maxMinutes: 25 },
    stone_core_sanctum: { minMinutes: 25, maxMinutes: 40 },
    nascent_soul_chamber: { minMinutes: 35, maxMinutes: 55 },
  },
  categoryMinutes: {
    consumables: {
      novice_clearing: { minMinutes: 5, maxMinutes: 10 },
      stone_core_sanctum: { minMinutes: 6, maxMinutes: 12 },
      nascent_soul_chamber: { minMinutes: 10, maxMinutes: 18 },
    },
    equipment: {
      novice_clearing: { minMinutes: 8, maxMinutes: 15 },
      stone_core_sanctum: { minMinutes: 12, maxMinutes: 22 },
      nascent_soul_chamber: { minMinutes: 18, maxMinutes: 30 },
    },
    build: {
      novice_clearing: { minMinutes: 0, maxMinutes: 8 },
      stone_core_sanctum: { minMinutes: 5, maxMinutes: 15 },
      nascent_soul_chamber: { minMinutes: 12, maxMinutes: 25 },
    },
  },
  antiStallCaps: {
    maxCommonSupportMinutes: 10,
    maxTargetedSupportMinutes: 25,
    maxMajorCorrectionCategories: 3,
  },
} as const;

export function getCurrentBranchGatePrepProfile(gateId: string): CurrentBranchGatePrepProfile | null {
  return CURRENT_BRANCH_GATE_PREP_PROFILES[gateId] ?? null;
}
