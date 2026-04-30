import type { RuinsRouteNodeState, RuinsRoomRouteNodeSurface } from './types.js';

export const RUINS_ROUTE_NODE_LABELS = {
  ruin_hollow_log_den: [
    { id: 'root-mouth', label: 'Root Mouth', sublabel: 'Room 1', iconKey: 'check' },
    { id: 'spirit-nest', label: 'Spirit Nest', sublabel: 'Room 2', iconKey: 'nest' },
    { id: 'sealed-cache', label: 'Sealed Cache', sublabel: 'Room 3', iconKey: 'cache' },
    { id: 'den-guardian', label: 'Den Guardian', sublabel: 'Lv. 11', iconKey: 'guardian' },
    { id: 'final-chest', label: 'Final Chest', sublabel: 'Anchor', iconKey: 'chest' },
  ],
} as const;

export function buildRuinsRouteNodes(ruinId: string | null, currentRoomIndex: number): RuinsRoomRouteNodeSurface[] {
  const base = ruinId && ruinId in RUINS_ROUTE_NODE_LABELS ? RUINS_ROUTE_NODE_LABELS[ruinId as keyof typeof RUINS_ROUTE_NODE_LABELS] : RUINS_ROUTE_NODE_LABELS.ruin_hollow_log_den;
  return base.map((node, index) => ({ ...node, state: (index < currentRoomIndex ? 'completed' : index === currentRoomIndex ? 'current' : 'future') as RuinsRouteNodeState }));
}
