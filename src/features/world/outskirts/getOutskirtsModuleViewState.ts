import type { ActiveActivity } from '../../../types/activity.js';
import type { CombatContext } from '../../../types/index.js';

export type OutskirtsModuleViewState = 'unavailable' | 'planning' | 'activeContained';

export interface ResolveOutskirtsModuleViewStateInput {
  cityId: string;
  outskirtsId: string | null;
  activity: ActiveActivity | null;
  combatContext: CombatContext;
}

function getActivitySourceId(activity: ActiveActivity | null): string | null {
  if (!activity || activity.type !== 'outskirts') return null;
  const payloadSourceId = (activity.payload as { sourceId?: string } | undefined)?.sourceId;
  return activity.sourceId ?? payloadSourceId ?? null;
}

function isSameOutskirtsCombatSource(cityId: string, outskirtsId: string, combatContext: CombatContext): boolean {
  if (combatContext.type !== 'outskirts') return false;
  if (combatContext.sourceId && combatContext.sourceId === outskirtsId) return true;
  return !combatContext.sourceId && combatContext.cityId === cityId;
}

export function getOutskirtsModuleViewState(input: ResolveOutskirtsModuleViewStateInput): OutskirtsModuleViewState {
  const { cityId, outskirtsId, activity, combatContext } = input;
  if (!outskirtsId) return 'unavailable';

  const activitySourceId = getActivitySourceId(activity);
  const activityMatches = activity?.type === 'outskirts' && activitySourceId === outskirtsId && (!activity.cityId || activity.cityId === cityId);
  const combatMatches = isSameOutskirtsCombatSource(cityId, outskirtsId, combatContext);

  return activityMatches || combatMatches ? 'activeContained' : 'planning';
}
