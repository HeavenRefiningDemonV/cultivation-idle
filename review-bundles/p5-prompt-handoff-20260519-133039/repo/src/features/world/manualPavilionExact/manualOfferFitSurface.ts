import type { PathId, ValidatedContent } from '../../../content/index.js';
import type { EconomicProblemKind } from '../../../systems/economy/economicProblemKinds.js';
import { p3ModuleRoute, type P3Route } from '../../../systems/world/p3SurfaceTypes.js';

export interface ManualOfferFitSurfaceV1 {
  version: 1;
  manualId: string;
  techniqueId?: string;
  offerId?: string;
  displayName: string;
  tags: ManualOfferFitTag[];
  currentBlockerFit: 'primary' | 'secondary' | 'future' | 'not_now';
  explanation: string;
  duplicateLine?: string;
  studyLine?: string;
  routeLine?: string;
  warnings: string[];
  debugNotes: string[];
}

export type ManualOfferFitTag =
  | 'path_aligned'
  | 'fills_empty_slot'
  | 'survival_tool'
  | 'burst_tool'
  | 'setup_tool'
  | 'rank_duplicate'
  | 'mastery_support'
  | 'current_gate_fit'
  | 'off_path_useful'
  | 'future_use'
  | 'not_useful_now';

interface BuildManualOfferFitSurfaceArgs {
  content: ValidatedContent;
  manualId: string;
  techniqueId?: string;
  offerId?: string;
  selectedPath: PathId | null;
  ownedTechniqueIds: readonly string[];
  equippedTechniqueIds: readonly string[];
  currentBlockerKind?: EconomicProblemKind | 'manual_pavilion_gap' | 'build_correction_gap' | null;
}

function techniqueRoleTags(role: string | undefined, tags: string[] | undefined): ManualOfferFitTag[] {
  const haystack = `${role ?? ''} ${(tags ?? []).join(' ')}`.toLowerCase();
  const out: ManualOfferFitTag[] = [];
  if (/heal|guard|shield|defen|surviv|mitigat|ward/i.test(haystack)) out.push('survival_tool');
  if (/burst|crit|strike|damage|attack/i.test(haystack)) out.push('burst_tool');
  if (/setup|control|debuff|buff|mark/i.test(haystack)) out.push('setup_tool');
  return out;
}

export function buildManualOfferFitSurface(args: BuildManualOfferFitSurfaceArgs): ManualOfferFitSurfaceV1 {
  const technique = args.techniqueId ? args.content.techniques.find((entry) => entry.id === args.techniqueId) ?? null : null;
  const tags: ManualOfferFitTag[] = [];
  const owned = Boolean(args.techniqueId && args.ownedTechniqueIds.includes(args.techniqueId));
  const equipped = Boolean(args.techniqueId && args.equippedTechniqueIds.includes(args.techniqueId));
  if (technique?.path && args.selectedPath && technique.path === args.selectedPath) tags.push('path_aligned');
  if (technique?.path && args.selectedPath && technique.path !== args.selectedPath) tags.push('off_path_useful');
  if (!owned && args.equippedTechniqueIds.length < 3) tags.push('fills_empty_slot');
  if (owned) tags.push('rank_duplicate');
  if (equipped) tags.push('mastery_support');
  tags.push(...techniqueRoleTags(technique?.role, technique?.tags));
  const primaryBlocker = args.currentBlockerKind === 'manual_pavilion_gap' || args.currentBlockerKind === 'build_correction_gap';
  if (primaryBlocker && (tags.includes('path_aligned') || tags.includes('fills_empty_slot') || tags.includes('rank_duplicate'))) {
    tags.push('current_gate_fit');
  }
  if (tags.length === 0) tags.push('future_use');
  const currentBlockerFit: ManualOfferFitSurfaceV1['currentBlockerFit'] =
    tags.includes('current_gate_fit') ? 'primary'
      : tags.includes('path_aligned') || tags.includes('rank_duplicate') ? 'secondary'
        : tags.includes('future_use') || tags.includes('off_path_useful') ? 'future'
          : 'not_now';

  const route: P3Route = p3ModuleRoute(owned ? 'techniques' : 'manualPavilion', 'Use this doctrine tool through its owner.');
  return {
    version: 1,
    manualId: args.manualId,
    techniqueId: args.techniqueId,
    offerId: args.offerId,
    displayName: technique ? `${technique.name} Manual` : args.manualId,
    tags: [...new Set(tags)],
    currentBlockerFit,
    explanation: currentBlockerFit === 'primary'
      ? 'This offer directly fits the current doctrine/build blocker.'
      : currentBlockerFit === 'secondary'
        ? 'This offer supports the current build, but it is not the only blocker.'
        : 'This offer is useful later; it should not override the current route.',
    duplicateLine: owned ? `Duplicate converts into fragment/rank support${equipped ? ' for an equipped technique' : ''}.` : undefined,
    studyLine: owned ? undefined : 'Study unlocks the technique before Techniques can express it.',
    routeLine: `${route.actionLabel}: ${route.reason}`,
    warnings: currentBlockerFit === 'not_now' ? ['Not useful for the current blocker.'] : [],
    debugNotes: technique ? [`techniquePath=${technique.path}`] : ['technique unavailable'],
  };
}
