import { CURRENT_BRANCH_PHASES } from './currentBranchPhaseMap';

export interface ProgressionFacts {
  realmIndex: number;
  realmSubstage: number;
  completedZones: string[];
  clearedDungeons: string[];
}

interface SyncAvailabilityParams extends ProgressionFacts {
  unlockedZones: string[];
  unlockedDungeons: Record<string, boolean>;
  unlockZone: (zoneId: string) => void;
  unlockDungeon: (dungeonId: string) => void;
  onZoneUnlocked?: (zoneId: string) => void;
  onDungeonUnlocked?: (dungeonId: string) => void;
  onPhaseEntered?: (phaseId: (typeof CURRENT_BRANCH_PHASES)[number]['id']) => void;
}

const has = (arr: string[], id: string) => arr.includes(id);

export function getZoneLockReason(zoneId: string, facts: ProgressionFacts): string | null {
  if (zoneId === 'training_forest') return null;

  if (zoneId === 'spirit_cavern') {
    if (facts.realmIndex < 1) return 'Reach Foundation Establishment to enter Spirit Cavern.';
    if (!has(facts.completedZones, 'training_forest')) return 'Complete Training Forest to reveal Spirit Cavern.';
    if (!has(facts.clearedDungeons, 'novice_clearing')) return 'Clear Novice\'s Clearing to stabilize entry.';
    return null;
  }

  if (zoneId === 'mystic_mountains') {
    if (facts.realmIndex < 2) return 'Reach Golden Core to enter Mystic Mountains.';
    if (!has(facts.completedZones, 'spirit_cavern')) return 'Complete Spirit Cavern to open mountain routes.';
    if (!has(facts.clearedDungeons, 'stone_core_sanctum')) return 'Clear Stone Core Sanctum to unlock Mystic Mountains.';
    return null;
  }

  return 'Zone progression data unavailable.';
}

export function getDungeonLockReason(dungeonId: string, facts: ProgressionFacts): string | null {
  if (dungeonId === 'novice_clearing') {
    if (!has(facts.completedZones, 'training_forest')) return 'Complete Training Forest before challenging this gate.';
    if (facts.realmIndex === 0 && facts.realmSubstage < 6) return 'Reach Qi Condensation Substage 6 to challenge this gate.';
    return null;
  }

  if (dungeonId === 'stone_core_sanctum') {
    if (facts.realmIndex < 1) return 'Reach Foundation Establishment for this gate trial.';
    if (!has(facts.completedZones, 'spirit_cavern')) return 'Complete Spirit Cavern before entering this sanctum.';
    return null;
  }

  if (dungeonId === 'nascent_soul_chamber') {
    if (facts.realmIndex < 2) return 'Reach Golden Core before entering this chamber.';
    if (!has(facts.completedZones, 'mystic_mountains')) return 'Complete Mystic Mountains to access this final bridge gate.';
    if (!has(facts.clearedDungeons, 'stone_core_sanctum')) return 'Clear Stone Core Sanctum first.';
    return null;
  }

  return 'Dungeon progression data unavailable.';
}

export function syncCurrentBranchAvailability(params: SyncAvailabilityParams) {
  const facts: ProgressionFacts = {
    realmIndex: params.realmIndex,
    realmSubstage: params.realmSubstage,
    completedZones: params.completedZones,
    clearedDungeons: params.clearedDungeons,
  };

  const zones = ['training_forest', 'spirit_cavern', 'mystic_mountains'];
  for (const zoneId of zones) {
    const lockedReason = getZoneLockReason(zoneId, facts);
    if (!lockedReason && !params.unlockedZones.includes(zoneId)) {
      params.unlockZone(zoneId);
      params.onZoneUnlocked?.(zoneId);
    }
  }

  const dungeons = ['novice_clearing', 'stone_core_sanctum', 'nascent_soul_chamber'];
  for (const dungeonId of dungeons) {
    const lockedReason = getDungeonLockReason(dungeonId, facts);
    if (!lockedReason && !params.unlockedDungeons[dungeonId]) {
      params.unlockDungeon(dungeonId);
      params.onDungeonUnlocked?.(dungeonId);
    }
  }

  if (!getZoneLockReason('spirit_cavern', facts)) {
    params.onPhaseEntered?.('phase_2');
  } else {
    params.onPhaseEntered?.('phase_1');
  }

  if (!getZoneLockReason('mystic_mountains', facts)) {
    params.onPhaseEntered?.('phase_3');
  }
}
