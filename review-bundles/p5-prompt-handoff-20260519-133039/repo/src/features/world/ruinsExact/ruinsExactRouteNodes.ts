import type { RuinsRouteNodeState, RuinsRoomRouteNodeSurface } from './types.js';

export const RUINS_ROUTE_NODE_LABELS = {
  ruin_hollow_log_den: [
    { id: 'root-mouth', label: 'Root Mouth', sublabel: 'Room 1', iconKey: 'check', medallionVariant: 'completed-check', isAnchor: false },
    { id: 'spirit-nest', label: 'Spirit Nest', sublabel: 'Room 2', iconKey: 'nest', medallionVariant: 'current-jade', isAnchor: false },
    { id: 'sealed-cache', label: 'Sealed Cache', sublabel: 'Room 3', iconKey: 'cache', medallionVariant: 'future-cache', isAnchor: false },
    { id: 'den-guardian', label: 'Den Guardian', sublabel: 'Lv. 11', iconKey: 'guardian', medallionVariant: 'future-guardian', isAnchor: false },
    { id: 'final-chest', label: 'Final Chest', sublabel: 'Anchor', iconKey: 'chest', medallionVariant: 'future-anchor', isAnchor: true },
  ],
} as const;

export function buildRuinsRouteNodes(ruinId: string | null, currentRoomIndex: number): RuinsRoomRouteNodeSurface[] {
  const base = ruinId && ruinId in RUINS_ROUTE_NODE_LABELS ? RUINS_ROUTE_NODE_LABELS[ruinId as keyof typeof RUINS_ROUTE_NODE_LABELS] : RUINS_ROUTE_NODE_LABELS.ruin_hollow_log_den;
  return base.map((node, index) => {
    const state = (index < currentRoomIndex ? 'completed' : index === currentRoomIndex ? 'current' : 'future') as RuinsRouteNodeState;
    const medallionVariant = state === 'completed' ? 'completed-check' : state === 'current' ? 'current-jade' : node.medallionVariant;
    return { ...node, state, medallionVariant, ariaLabel: `${node.label} ${node.sublabel} ${state}` };
  });
}
