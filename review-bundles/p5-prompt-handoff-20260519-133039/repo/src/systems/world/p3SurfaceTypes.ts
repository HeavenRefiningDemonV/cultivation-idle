import type { LiveWorldModuleKey } from '../../content/index.js';
import type { GameTab } from '../../stores/uiStore.js';
import type { RunCompassActionTarget } from '../ui/runCompass/types.js';

export type P3ModuleKey = LiveWorldModuleKey | 'cultivation' | 'techniques' | 'prestige';

export interface P3Route {
  label: string;
  actionLabel: string;
  reason: string;
  moduleKey?: P3ModuleKey;
  cityId?: string | null;
  tab?: GameTab;
  target?: RunCompassActionTarget | null;
  blocked?: boolean;
  blockedReason?: string | null;
}

export function labelForP3Module(moduleKey: P3ModuleKey): string {
  switch (moduleKey) {
    case 'cultivation':
      return 'Cultivation';
    case 'techniques':
      return 'Techniques';
    case 'prestige':
      return 'Prestige';
    case 'gateTrial':
      return 'Gate Trial';
    case 'manualPavilion':
      return 'Manual Pavilion';
    default:
      return `${moduleKey.slice(0, 1).toUpperCase()}${moduleKey.slice(1)}`;
  }
}

export function p3ModuleRoute(moduleKey: P3ModuleKey, reason: string, cityId?: string | null): P3Route {
  const label = labelForP3Module(moduleKey);
  if (moduleKey === 'cultivation' || moduleKey === 'techniques' || moduleKey === 'prestige') {
    const tab = moduleKey === 'cultivation' ? 'cultivation' : moduleKey === 'techniques' ? 'techniques' : 'prestige';
    return {
      label,
      actionLabel: `Open ${label}`,
      reason,
      moduleKey,
      tab,
      target: { kind: 'tab', tab },
      blocked: false,
      blockedReason: null,
    };
  }

  return {
    label,
    actionLabel: `Open ${label}`,
    reason,
    moduleKey,
    cityId: cityId ?? null,
    target: cityId ? { kind: 'world_module', cityId, moduleKey } : null,
    blocked: !cityId,
    blockedReason: cityId ? null : 'No current city is selected.',
  };
}
