import { buildDoctrineSnapshot, type DoctrineSnapshot } from '../doctrine/index.js';
import { useTechCollectionStore } from '../../stores/techCollectionStore.js';
import {
  type BuildAnalysis,
  type BuildAnalysisInput,
  type BuildGap,
  type BuildTechniqueAnalysisEntry,
  ACTIVE_PASSIVE_MASTERY_FLOOR,
  ACTIVE_PASSIVE_MIN_RANK_FLOOR,
  ACTIVE_PASSIVE_MIN_RUNE_FLOOR,
  ULTIMATE_MASTERY_FLOOR,
  ULTIMATE_MIN_RANK_FLOOR,
  ULTIMATE_MIN_RUNE_FLOOR,
} from './buildAnalysisTypes.js';
import { detectArchetypeFromCoverage } from './archetypeDetector.js';
import { buildLoadoutSnapshot } from './loadoutSnapshot.js';
import {
  TECHNIQUE_FAMILY_ORDER,
  TECHNIQUE_SUPPORT_FLAG_ORDER,
  type TechniqueFamily,
  type TechniqueSupportFlag,
} from './techniqueFamilies.js';
import {
  getPathAlignmentScoreForTechnique,
  getPathAlignmentStrengthForTechnique,
  getTechniqueTaxonomyProfile,
} from './techniqueTaxonomy.js';

function createEmptyFamilyCoverage(): Record<TechniqueFamily, number> {
  return Object.fromEntries(TECHNIQUE_FAMILY_ORDER.map((family) => [family, 0])) as Record<
    TechniqueFamily,
    number
  >;
}

function createEmptySupportCoverage(): Record<TechniqueSupportFlag, number> {
  return Object.fromEntries(TECHNIQUE_SUPPORT_FLAG_ORDER.map((flag) => [flag, 0])) as Record<
    TechniqueSupportFlag,
    number
  >;
}

function buildTechniqueEntry(snapshot: DoctrineSnapshot, techId: string, slotType: 'active' | 'passive' | 'ultimate'): BuildTechniqueAnalysisEntry {
  const taxonomy = getTechniqueTaxonomyProfile(techId);
  const progression = useTechCollectionStore.getState().getTechniqueProgressionSnapshot(techId);

  const masteryFloor = slotType === 'ultimate' ? ULTIMATE_MASTERY_FLOOR : ACTIVE_PASSIVE_MASTERY_FLOOR;
  const rankFloor = Math.min(
    progression.rankCap,
    slotType === 'ultimate' ? ULTIMATE_MIN_RANK_FLOOR : ACTIVE_PASSIVE_MIN_RANK_FLOOR,
  );

  let runeFloor = 0;
  let runeFloorMet = true;
  if (progression.runeSockets > 0) {
    runeFloor = Math.min(
      progression.runeSockets,
      slotType === 'ultimate' ? ULTIMATE_MIN_RUNE_FLOOR : ACTIVE_PASSIVE_MIN_RUNE_FLOOR,
    );
    runeFloorMet = progression.appliedRuneCount >= runeFloor;
  }

  return {
    techId,
    slotType,
    families: taxonomy ? [...taxonomy.families] : [],
    supportFlags: taxonomy ? [...taxonomy.supportFlags] : [],
    pathFit: taxonomy ? getPathAlignmentStrengthForTechnique(techId, snapshot.path) : 'off',
    pathFitScore: taxonomy ? getPathAlignmentScoreForTechnique(techId, snapshot.path) : 0,
    manualGrade: progression.grade,
    rarity: progression.rarity,
    masteryLevel: progression.masteryLevel,
    masteryFloor,
    masteryFloorMet: progression.masteryLevel >= masteryFloor,
    rank: progression.rank,
    rankFloor,
    rankCap: progression.rankCap,
    rankFloorMet: progression.rank >= rankFloor,
    runeSockets: progression.runeSockets,
    runeFloor,
    appliedRuneCount: progression.appliedRuneCount,
    runeFloorMet,
  };
}

function makeGap(code: BuildGap['code'], severity: BuildGap['severity'], reason: string): BuildGap {
  return { code, severity, reason };
}

export function buildBuildAnalysisInput(snapshot: DoctrineSnapshot): BuildAnalysisInput {
  try {
    const loadoutSnapshot = buildLoadoutSnapshot(snapshot.selectedLoadoutId ?? undefined);
    const equippedTechniques: BuildTechniqueAnalysisEntry[] = [
      ...loadoutSnapshot.equipped.active.map((techId) => buildTechniqueEntry(snapshot, techId, 'active')),
      ...loadoutSnapshot.equipped.passive.map((techId) => buildTechniqueEntry(snapshot, techId, 'passive')),
      ...(loadoutSnapshot.equipped.ultimate
        ? [buildTechniqueEntry(snapshot, loadoutSnapshot.equipped.ultimate, 'ultimate')]
        : []),
    ];

    return {
      snapshot,
      loadoutSnapshot,
      equippedTechniques,
    };
  } catch {
    return {
      snapshot,
      loadoutSnapshot: {
        loadoutId: snapshot.selectedLoadoutId ?? 'default',
        aiProfile: 'balanced',
        castingPolicy: 'balanced',
        displayed: { active: 0, passive: 0 },
        unlocked: { active: 0, passive: 0, ultimate: false },
        equipped: { active: [], passive: [], ultimate: null },
        filled: { active: 0, passive: 0, ultimate: 0 },
        emptyUnlockedCount: 0,
        emptyUnlockedSlots: [],
        parkedLockedAssignments: [],
      },
      equippedTechniques: [],
    };
  }
}

export function analyzeBuildFromInput(input: BuildAnalysisInput): BuildAnalysis {
  const equippedTechniques = Array.isArray(input.equippedTechniques)
    ? input.equippedTechniques.map((entry) => ({
        ...entry,
        families: Array.isArray(entry.families) ? [...entry.families] : [],
        supportFlags: Array.isArray(entry.supportFlags) ? [...entry.supportFlags] : [],
      }))
    : [];

  const familyCoverage = createEmptyFamilyCoverage();
  const supportCoverage = createEmptySupportCoverage();
  const archetypeFamilyCoverage = createEmptyFamilyCoverage();
  const archetypeSupportCoverage = createEmptySupportCoverage();

  equippedTechniques.forEach((tech) => {
    tech.families.forEach((family) => {
      familyCoverage[family] = (familyCoverage[family] ?? 0) + 1;
      if (tech.pathFit !== 'off') {
        archetypeFamilyCoverage[family] = (archetypeFamilyCoverage[family] ?? 0) + 1;
      }
    });
    tech.supportFlags.forEach((flag) => {
      supportCoverage[flag] = (supportCoverage[flag] ?? 0) + 1;
      if (tech.pathFit !== 'off') {
        archetypeSupportCoverage[flag] = (archetypeSupportCoverage[flag] ?? 0) + 1;
      }
    });
  });

  const pathAlignmentScore = input.snapshot.path === null || equippedTechniques.length === 0
    ? 0
    : Math.round(
        (equippedTechniques.reduce((acc, tech) => acc + tech.pathFitScore, 0) / (equippedTechniques.length * 2)) * 100,
      );

  const masteryFloorMet = equippedTechniques.every((tech) => tech.masteryFloorMet);
  const rankFloorMet = equippedTechniques.every((tech) => tech.rankFloorMet);
  const runeFloorMet = equippedTechniques.every((tech) => tech.runeFloorMet);

  const hasSurvivalTool =
    (supportCoverage.survival ?? 0) > 0 ||
    (familyCoverage.guard ?? 0) > 0 ||
    (familyCoverage.heal ?? 0) > 0 ||
    (familyCoverage.cleanse ?? 0) > 0;
  const hasSetupTool =
    (familyCoverage.setup ?? 0) > 0 ||
    (familyCoverage.control ?? 0) > 0;

  const masteryFailures = equippedTechniques.filter((tech) => !tech.masteryFloorMet);
  const rankFailures = equippedTechniques.filter((tech) => !tech.rankFloorMet);
  const runeFailures = equippedTechniques.filter((tech) => !tech.runeFloorMet);

  const gaps: BuildGap[] = [];
  if (input.loadoutSnapshot.emptyUnlockedCount >= 2) {
    gaps.push(makeGap('empty_slot', 'high', 'Two or more unlocked technique slots are empty.'));
  } else if (input.loadoutSnapshot.emptyUnlockedCount === 1) {
    gaps.push(makeGap('empty_slot', 'medium', 'An unlocked technique slot is still empty.'));
  }

  if (input.snapshot.path !== null && equippedTechniques.length > 0) {
    if (pathAlignmentScore < 40) {
      gaps.push(makeGap('low_alignment', 'high', 'Most equipped techniques are off-path or only loosely aligned to the selected path.'));
    } else if (pathAlignmentScore < 70) {
      gaps.push(makeGap('low_alignment', 'medium', 'The current build is only partially aligned to the selected path.'));
    }
  }

  if (!hasSurvivalTool && input.loadoutSnapshot.emptyUnlockedCount === 0) {
    gaps.push(
      makeGap(
        'missing_survival_tool',
        input.snapshot.path === 'earth' ? 'high' : 'medium',
        'The current build lacks a real survival tool.',
      ),
    );
  }

  if (!hasSetupTool && input.loadoutSnapshot.emptyUnlockedCount === 0) {
    gaps.push(
      makeGap(
        'missing_setup_tool',
        input.snapshot.path === 'earth' ? 'low' : 'medium',
        'The current build lacks setup/control support.',
      ),
    );
  }

  if (masteryFailures.length > 0) {
    gaps.push(
      makeGap(
        'low_mastery',
        masteryFailures.some((tech) => tech.slotType === 'ultimate') || masteryFailures.length >= 2 ? 'high' : 'medium',
        'One or more equipped techniques are below the semester mastery floor.',
      ),
    );
  }

  if (rankFailures.length > 0) {
    gaps.push(
      makeGap(
        'low_rank',
        rankFailures.some((tech) => tech.slotType === 'ultimate') || rankFailures.length >= 2 ? 'high' : 'medium',
        'One or more equipped techniques are below the semester rank floor.',
      ),
    );
  }

  if (runeFailures.length > 0) {
    gaps.push(
      makeGap(
        'rune_gap',
        runeFailures.some((tech) => tech.slotType === 'ultimate') || runeFailures.length >= 2 ? 'medium' : 'low',
        'One or more equipped techniques have rune sockets below the semester floor.',
      ),
    );
  }

  const archetypeId = equippedTechniques.length === 0
    ? null
    : detectArchetypeFromCoverage({
        path: input.snapshot.path,
        familyCoverage: archetypeFamilyCoverage,
        supportCoverage: archetypeSupportCoverage,
      });

  return {
    loadoutId: input.loadoutSnapshot.loadoutId,
    archetypeId,
    pathAlignmentScore,
    familyCoverage,
    supportCoverage,
    emptyUnlockedSlots: input.loadoutSnapshot.emptyUnlockedCount,
    masteryFloorMet,
    rankFloorMet,
    runeFloorMet,
    equippedTechniques,
    gaps,
  };
}

export function analyzeSelectedBuild(snapshot?: DoctrineSnapshot): BuildAnalysis {
  const resolvedSnapshot = snapshot ?? buildDoctrineSnapshot();
  const input = buildBuildAnalysisInput(resolvedSnapshot);
  return analyzeBuildFromInput(input);
}
