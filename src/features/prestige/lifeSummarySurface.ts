import { REALMS } from '../../constants';
import { useDungeonStore } from '../../stores/dungeonStore';
import { useGameStore } from '../../stores/gameStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useTechniqueStore } from '../../stores/techniqueStore';
import { useZoneStore } from '../../stores/zoneStore';
import type { PrestigeUpgrade } from '../../stores/prestigeStore';

export type LifeSummaryMode = 'current' | 'last_completed';

export interface LifeSummaryBlock {
  title:
    | 'Life Arc'
    | 'Doctrine & Build'
    | 'World Progress'
    | 'Gate Trials'
    | 'Ruins & Supply'
    | 'Next Life Focus';
  lines: string[];
}

export interface LifeSummaryViewModel {
  mode: LifeSummaryMode;
  advisorLabel: 'Too Early' | 'Viable' | 'Recommended';
  apForecast: number;
  blocks: LifeSummaryBlock[];
}

export interface PrestigeLifeSummarySnapshot {
  createdAt: number;
  advisorLabel: 'Too Early' | 'Viable' | 'Recommended';
  apForecast: number;
  realmIndex: number;
  realmSubstage: number;
  runDurationSeconds: number;
  selectedPath: string | null;
  focusMode: string;
  pathPerks: string[];
  upgradeTiers: { idle: number; damage: number; hp: number };
  unlockedZones: string[];
  completedZones: string[];
  totalZoneKills: number;
  unlockedDungeons: string[];
  clearedDungeons: string[];
  inventorySlotsUsed: number;
  inventorySlotsMax: number;
  equippedWeaponName: string | null;
  equippedAccessoryName: string | null;
  gold: string;
  unlockedTechniques: number;
  totalTechniques: number;
  nextLifeFocus: string[];
}

interface CurrentLifeSummaryInputs {
  apForecast: number;
  canPrestige: boolean;
  runStartTime: number;
  upgrades: Record<string, PrestigeUpgrade>;
}

const LIFE_BLOCK_TITLES: LifeSummaryBlock['title'][] = [
  'Life Arc',
  'Doctrine & Build',
  'World Progress',
  'Gate Trials',
  'Ruins & Supply',
  'Next Life Focus',
];

const zoneLabel = (zoneId: string) => zoneId.split('_').map((s) => s[0].toUpperCase() + s.slice(1)).join(' ');
const realmLabel = (index: number) => REALMS[index]?.name ?? 'Unknown Realm';

function toAdvisorLabel(ap: number): 'Too Early' | 'Viable' | 'Recommended' {
  if (ap <= 0) return 'Too Early';
  if (ap <= 9) return 'Viable';
  return 'Recommended';
}

function buildNextLifeFocus(input: {
  canPrestige: boolean;
  apForecast: number;
  selectedPath: string | null;
  unlockedZoneCount: number;
  recommendedUpgrade: string | null;
}): string[] {
  const lines: string[] = [];
  if (!input.canPrestige) {
    lines.push('Push realm progression to Core Formation before reincarnating.');
  } else if (input.apForecast < 10) {
    lines.push('Farm one stronger breakthrough cycle before reincarnating for better AP value.');
  } else {
    lines.push('Reincarnation timing is strong; convert this run into permanent AP upgrades.');
  }

  if (input.recommendedUpgrade) {
    lines.push(`Target upgrade: ${input.recommendedUpgrade}.`);
  } else {
    lines.push('Bank AP and prioritize your next permanent upgrade tier.');
  }

  if (!input.selectedPath) {
    lines.push('Lock in a cultivation path early next life to stabilize build scaling.');
  } else if (input.unlockedZoneCount <= 1) {
    lines.push('Advance world progression earlier to unlock broader farming routes.');
  } else {
    lines.push('Keep path/focus consistency while pushing higher unlocked zones faster.');
  }

  return lines.slice(0, 3);
}

function buildBlocks(snapshot: PrestigeLifeSummarySnapshot): LifeSummaryBlock[] {
  const lifeArc: string[] = [
    `Realm reached: ${realmLabel(snapshot.realmIndex)} • Stage ${snapshot.realmSubstage}.`,
    `Run time: ${Math.max(1, Math.floor(snapshot.runDurationSeconds / 60))}m.`,
    `AP forecast: +${snapshot.apForecast} (${snapshot.advisorLabel}).`,
  ];

  const doctrine: string[] = [
    `Path: ${snapshot.selectedPath ?? 'Unselected'} • Focus: ${snapshot.focusMode}.`,
    `Perks selected: ${snapshot.pathPerks.length}.`,
    `Upgrades — Idle ${snapshot.upgradeTiers.idle}, Damage ${snapshot.upgradeTiers.damage}, HP ${snapshot.upgradeTiers.hp}.`,
    `Unlocked techniques: ${snapshot.unlockedTechniques}/${snapshot.totalTechniques}.`,
  ];

  const worldProgress: string[] = [
    `Unlocked zones: ${snapshot.unlockedZones.length}.`,
    `Completed zones: ${snapshot.completedZones.length}.`,
    `Total zone kills: ${snapshot.totalZoneKills}.`,
    snapshot.completedZones.length > 0
      ? `Deepest clear: ${zoneLabel(snapshot.completedZones[snapshot.completedZones.length - 1])}.`
      : 'No completed zone yet this life.',
  ];

  const gateTrials: string[] = [
    `Dungeons unlocked: ${snapshot.unlockedDungeons.length}.`,
    `Dungeons cleared: ${snapshot.clearedDungeons.length}.`,
    snapshot.clearedDungeons.length > 0
      ? `Latest clear: ${zoneLabel(snapshot.clearedDungeons[snapshot.clearedDungeons.length - 1])}.`
      : 'No dungeon clear recorded this life.',
  ];

  const ruinsSupply: string[] = [
    `Inventory usage: ${snapshot.inventorySlotsUsed}/${snapshot.inventorySlotsMax}.`,
    `Gold on hand: ${snapshot.gold}.`,
    `Equipped weapon: ${snapshot.equippedWeaponName ?? 'None'}.`,
    `Equipped accessory: ${snapshot.equippedAccessoryName ?? 'None'}.`,
  ];

  const nextLifeFocus: string[] =
    snapshot.nextLifeFocus.length > 0
      ? snapshot.nextLifeFocus.slice(0, 3)
      : ['No clear bottleneck detected; repeat current plan with faster zone unlock timing.'];

  return [
    { title: 'Life Arc', lines: lifeArc.slice(0, 5) },
    { title: 'Doctrine & Build', lines: doctrine.slice(0, 5) },
    { title: 'World Progress', lines: worldProgress.slice(0, 5) },
    { title: 'Gate Trials', lines: gateTrials.slice(0, 5) },
    { title: 'Ruins & Supply', lines: ruinsSupply.slice(0, 5) },
    { title: 'Next Life Focus', lines: nextLifeFocus.slice(0, 5) },
  ];
}

export function captureLifeSummarySnapshot(
  inputs: CurrentLifeSummaryInputs
): PrestigeLifeSummarySnapshot {
  const game = useGameStore.getState();
  const zones = useZoneStore.getState();
  const dungeon = useDungeonStore.getState();
  const inventory = useInventoryStore.getState();
  const techniques = useTechniqueStore.getState();

  const apForecast = Math.max(0, inputs.apForecast);
  const unlockedTechniqueCount = Object.values(techniques.techniques).filter((t) => t.unlocked).length;
  const completedZones = Object.entries(zones.zoneProgress)
    .filter(([, progress]) => progress.completed)
    .map(([zoneId]) => zoneId);
  const totalZoneKills = Object.values(zones.zoneProgress).reduce(
    (sum, progress) => sum + progress.enemiesDefeated,
    0
  );
  const clearedDungeons = Object.entries(dungeon.dungeonProgress)
    .filter(([, progress]) => progress.totalClears > 0)
    .map(([dungeonId]) => dungeonId);
  const recommendedUpgrade = Object.values(inputs.upgrades)
    .filter((upgrade) => upgrade.currentLevel < upgrade.maxLevel)
    .sort((a, b) => a.cost - b.cost)[0]?.name;

  return {
    createdAt: Date.now(),
    advisorLabel: toAdvisorLabel(apForecast),
    apForecast,
    realmIndex: game.realm.index,
    realmSubstage: game.realm.substage,
    runDurationSeconds: Math.max(0, Math.floor((Date.now() - inputs.runStartTime) / 1000)),
    selectedPath: game.selectedPath,
    focusMode: game.focusMode,
    pathPerks: [...game.pathPerks],
    upgradeTiers: { ...game.upgradeTiers },
    unlockedZones: [...zones.unlockedZones],
    completedZones,
    totalZoneKills,
    unlockedDungeons: Object.entries(dungeon.unlockedDungeons)
      .filter(([, unlocked]) => unlocked)
      .map(([id]) => id),
    clearedDungeons,
    inventorySlotsUsed: inventory.items.length,
    inventorySlotsMax: inventory.maxSlots,
    equippedWeaponName: inventory.equippedWeapon?.name ?? null,
    equippedAccessoryName: inventory.equippedAccessory?.name ?? null,
    gold: inventory.gold,
    unlockedTechniques: unlockedTechniqueCount,
    totalTechniques: Object.keys(techniques.techniques).length,
    nextLifeFocus: buildNextLifeFocus({
      canPrestige: inputs.canPrestige,
      apForecast,
      selectedPath: game.selectedPath,
      unlockedZoneCount: zones.unlockedZones.length,
      recommendedUpgrade: recommendedUpgrade ?? null,
    }),
  };
}

export function buildLifeSummaryFromSnapshot(
  snapshot: PrestigeLifeSummarySnapshot,
  mode: LifeSummaryMode
): LifeSummaryViewModel {
  return {
    mode,
    advisorLabel: snapshot.advisorLabel,
    apForecast: snapshot.apForecast,
    blocks: buildBlocks(snapshot),
  };
}

export function buildCurrentLifeSummary(inputs: CurrentLifeSummaryInputs): LifeSummaryViewModel {
  const snapshot = captureLifeSummarySnapshot(inputs);
  return buildLifeSummaryFromSnapshot(snapshot, 'current');
}

export function ensureSixBlocks(blocks: LifeSummaryBlock[]): LifeSummaryBlock[] {
  const map = new Map(blocks.map((block) => [block.title, block]));
  return LIFE_BLOCK_TITLES.map((title) =>
    map.get(title) ?? { title, lines: ['No significant data recorded for this section yet.'] }
  );
}
