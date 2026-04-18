import type { CombatContext } from '../../../types/index.js';
import type { ActiveActivity } from '../../../stores/activityStore.js';

export type OutskirtsModuleViewState = 'unavailable' | 'planning' | 'activeContained';

export interface OutskirtsModuleViewStateInput {
  cityId: string;
  outskirtsDefId: string | null;
  activity: ActiveActivity | null;
  combatContext: CombatContext | null;
}

function activityMatchesOutskirts(input: OutskirtsModuleViewStateInput): boolean {
  const { activity, cityId, outskirtsDefId } = input;
  if (!activity || activity.type !== 'outskirts') return false;
  const payloadSourceId = (activity.payload as { sourceId?: string } | undefined)?.sourceId;
  const sourceId = activity.sourceId ?? payloadSourceId ?? null;
  return activity.cityId === cityId && sourceId === outskirtsDefId;
}

function combatMatchesOutskirts(input: OutskirtsModuleViewStateInput): boolean {
  const { combatContext, cityId, outskirtsDefId } = input;
  if (!combatContext || combatContext.type !== 'outskirts') return false;
  return combatContext.cityId === cityId && combatContext.sourceId === outskirtsDefId;
}

export function getOutskirtsModuleViewState(input: OutskirtsModuleViewStateInput): OutskirtsModuleViewState {
  if (!input.outskirtsDefId) return 'unavailable';
  if (combatMatchesOutskirts(input) || activityMatchesOutskirts(input)) return 'activeContained';
  return 'planning';
}
