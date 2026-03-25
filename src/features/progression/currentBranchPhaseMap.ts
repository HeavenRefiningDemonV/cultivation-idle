export interface BridgeTimingRange {
  min: number;
  max: number;
}

export interface CurrentBranchPhase {
  id: 'phase_1' | 'phase_2' | 'phase_3';
  order: number;
  label: string;
  zoneId: string;
  dungeonId: string;
  resolvesToward: string;
  bridgeNote: string;
}

// Current-branch bridge contract for this repo's live shell (not the later city-shell map).
export const BRIDGE_TIMING_TARGETS: Record<
  'firstDungeonAvailableMinutes' | 'firstMajorBreakthroughMinutes' | 'firstPrestigeViableMinutes' | 'deepRunCapMinutes',
  BridgeTimingRange
> = {
  firstDungeonAvailableMinutes: { min: 20, max: 30 },
  firstMajorBreakthroughMinutes: { min: 35, max: 50 },
  firstPrestigeViableMinutes: { min: 135, max: 165 },
  deepRunCapMinutes: { min: 210, max: 330 },
};

export const CURRENT_BRANCH_PHASES: CurrentBranchPhase[] = [
  {
    id: 'phase_1',
    order: 1,
    label: 'Forest Initiation',
    zoneId: 'training_forest',
    dungeonId: 'novice_clearing',
    resolvesToward: 'Foundation Establishment',
    bridgeNote: 'Clear first gate and stabilize first major breakthrough.',
  },
  {
    id: 'phase_2',
    order: 2,
    label: 'Cavern Consolidation',
    zoneId: 'spirit_cavern',
    dungeonId: 'stone_core_sanctum',
    resolvesToward: 'Golden Core',
    bridgeNote: 'Advance through second gate into Golden Core pacing.',
  },
  {
    id: 'phase_3',
    order: 3,
    label: 'Mountain Bridge',
    zoneId: 'mystic_mountains',
    dungeonId: 'nascent_soul_chamber',
    resolvesToward: 'Prestige Viability Wall',
    bridgeNote: 'Late-run bridge toward current branch cap and prestige timing.',
  },
];
