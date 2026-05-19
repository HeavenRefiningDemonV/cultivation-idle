import type { PathId, ValidatedContent } from '../../content/index.js';
import type { UISettingsState } from '../../stores/uiStore.js';
import { p3ModuleRoute, type P3Route } from '../../systems/world/p3SurfaceTypes.js';

export interface TechniqueGateFitSurfaceV1 {
  version: 1;
  gateId?: string;
  pathId?: string;
  loadoutId?: string;
  archetype?: TechniqueStarterArchetype;
  rows: TechniqueGateFitRow[];
  aiPosture: TechniqueAiPostureSurface;
  primaryBuildGap?: TechniqueGateFitRow;
  recommendedActions: TechniqueBuildAction[];
  summaryLine: string;
  debugNotes: string[];
}

export interface TechniqueStarterArchetype {
  pathId: PathId;
  title: string;
  doctrineLine: string;
  guidanceLine: string;
}

export interface TechniqueGateFitRow {
  id: string;
  group: 'slot' | 'coverage' | 'mastery' | 'rank' | 'rune' | 'ai' | 'synergy';
  label: string;
  state: 'missing' | 'weak' | 'adequate' | 'strong' | 'not_applicable';
  explanation: string;
  route?: P3Route;
}

export interface TechniqueAiPostureSurface {
  currentProfile: UISettingsState['combatAIProfile'];
  recommendedProfile: UISettingsState['combatAIProfile'];
  explanation: string;
}

export interface TechniqueBuildAction {
  id: string;
  label: string;
  detail: string;
  route?: P3Route;
}

interface BuildTechniqueGateFitSurfaceArgs {
  content: ValidatedContent;
  pathId: PathId | null;
  equippedTechniqueIds: readonly string[];
  ownedTechniqueIds: readonly string[];
  aiProfile: UISettingsState['combatAIProfile'];
  recentDefeatCode?: string | null;
  masteryByTechniqueId: Record<string, number>;
  rankByTechniqueId: Record<string, number>;
  runeCountByTechniqueId: Record<string, number>;
}

const ARCHETYPES: Record<PathId, TechniqueStarterArchetype> = {
  heaven: {
    pathId: 'heaven',
    title: 'Heaven Doctrine',
    doctrineLine: 'Fast cultivation and high offense need enough survival support to avoid fragile overcommitment.',
    guidanceLine: 'Favor burst/control, then use Survivor posture after repeated burst-risk defeats.',
  },
  earth: {
    pathId: 'earth',
    title: 'Earth Doctrine',
    doctrineLine: 'Body, defense, and stability support steady gate attempts.',
    guidanceLine: 'Favor sustain and mitigation with Survivor or Balanced posture.',
  },
  martial: {
    pathId: 'martial',
    title: 'Martial Doctrine',
    doctrineLine: 'Aggressive combat expression needs tempo and enough recovery to avoid overmatched clears.',
    guidanceLine: 'Favor burst windows with Balanced posture until the gate is safe.',
  },
};

function recommendedProfile(current: UISettingsState['combatAIProfile'], recentDefeatCode?: string | null): TechniqueAiPostureSurface {
  if (recentDefeatCode === 'underprepared' || recentDefeatCode === 'underforged') {
    return {
      currentProfile: current,
      recommendedProfile: 'survivor',
      explanation: 'Survivor is recommended while recent defeat or pouch/gear risk is still active.',
    };
  }
  if (current === 'farmer') {
    return { currentProfile: current, recommendedProfile: 'balanced', explanation: 'Farmer is for safe Outskirts loops, not default gate attempts.' };
  }
  return { currentProfile: current, recommendedProfile: current, explanation: 'Current AI posture is acceptable for general gate prep.' };
}

export function buildTechniqueGateFitSurface(args: BuildTechniqueGateFitSurfaceArgs): TechniqueGateFitSurfaceV1 {
  const rows: TechniqueGateFitRow[] = [];
  if (args.equippedTechniqueIds.length === 0) {
    rows.push({
      id: 'empty_active_slots',
      group: 'slot',
      label: 'Empty loadout slot',
      state: 'missing',
      explanation: 'Owned techniques do nothing until the loadout can express them.',
      route: p3ModuleRoute(args.ownedTechniqueIds.length > 0 ? 'techniques' : 'manualPavilion', 'Fill a technique slot before repeating the gate.'),
    });
  } else {
    rows.push({ id: 'slot_expression', group: 'slot', label: 'Loadout slots', state: 'adequate', explanation: `${args.equippedTechniqueIds.length} techniques equipped.` });
  }
  const ownedTechniques = args.ownedTechniqueIds
    .map((id) => args.content.techniques.find((tech) => tech.id === id) ?? null)
    .filter((tech): tech is NonNullable<typeof tech> => Boolean(tech));
  const hasSurvival = ownedTechniques.some((tech) => /heal|guard|shield|defen|ward|surviv/i.test(`${tech.role ?? ''} ${(tech.tags ?? []).join(' ')}`));
  rows.push({
    id: 'survival_coverage',
    group: 'coverage',
    label: 'Survival tool',
    state: hasSurvival ? 'adequate' : 'weak',
    explanation: hasSurvival ? 'A survival/mitigation tool exists in owned doctrine.' : 'No obvious survival tool is owned yet.',
    route: hasSurvival ? undefined : p3ModuleRoute('manualPavilion', 'Find a survival or mitigation manual.'),
  });
  const lowMastery = args.equippedTechniqueIds.find((id) => (args.masteryByTechniqueId[id] ?? 0) < 25) ?? null;
  rows.push({
    id: 'mastery_floor',
    group: 'mastery',
    label: 'Mastery floor',
    state: lowMastery ? 'weak' : args.equippedTechniqueIds.length > 0 ? 'adequate' : 'not_applicable',
    explanation: lowMastery ? 'At least one equipped technique has low mastery for gate expression.' : 'No low mastery blocker is visible.',
  });
  const lowRank = args.equippedTechniqueIds.find((id) => (args.rankByTechniqueId[id] ?? 1) <= 1) ?? null;
  rows.push({
    id: 'rank_floor',
    group: 'rank',
    label: 'Rank floor',
    state: lowRank ? 'weak' : args.equippedTechniqueIds.length > 0 ? 'adequate' : 'not_applicable',
    explanation: lowRank ? 'Duplicate/rank support may improve equipped doctrine.' : 'Rank floor is not the visible blocker.',
    route: lowRank ? p3ModuleRoute('manualPavilion', 'Find duplicate/rank support for equipped technique.') : undefined,
  });
  const ai = recommendedProfile(args.aiProfile, args.recentDefeatCode);
  rows.push({
    id: 'ai_posture',
    group: 'ai',
    label: 'AI posture',
    state: ai.recommendedProfile === args.aiProfile ? 'adequate' : 'weak',
    explanation: ai.explanation,
    route: p3ModuleRoute('techniques', 'Adjust combat AI posture.'),
  });
  const primaryBuildGap = rows.find((row) => row.state === 'missing' || row.state === 'weak');
  const recommendedActions: TechniqueBuildAction[] = [
    primaryBuildGap
      ? { id: `fix_${primaryBuildGap.id}`, label: primaryBuildGap.group === 'ai' ? 'Change AI profile' : `Fix ${primaryBuildGap.label}`, detail: primaryBuildGap.explanation, route: primaryBuildGap.route }
      : { id: 'hold_build', label: 'Keep current loadout', detail: 'No primary technique gap is visible.' },
  ];

  return {
    version: 1,
    pathId: args.pathId ?? undefined,
    archetype: args.pathId ? ARCHETYPES[args.pathId] : undefined,
    rows,
    aiPosture: ai,
    primaryBuildGap,
    recommendedActions,
    summaryLine: primaryBuildGap ? `${primaryBuildGap.label} is the first build-fit gap.` : 'Technique loadout is gate-fit at this diagnostic level.',
    debugNotes: [`owned=${args.ownedTechniqueIds.length}`, `equipped=${args.equippedTechniqueIds.length}`],
  };
}
