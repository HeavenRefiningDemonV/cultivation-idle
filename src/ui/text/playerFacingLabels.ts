import type { LiveWorldModuleKey } from '../../content/types.js';
import type { GameTab } from '../../stores/uiStore.js';
import { isLiveWorldModule } from '../../systems/world/liveWorldSchema.js';
import { LEGACY_SEMESTER_CITY_NAME_REPLACEMENTS } from '../../systems/world/liveWorldLeakAudit.js';
import type { ReadinessBand } from '../../systems/readiness/readinessScoringTypes.js';
import type { FailureDiagnosisCode } from '../../systems/readiness/failureDiagnosisTypes.js';

export const SHELL_TAB_LABELS = {
  cultivation: 'Cultivation',
  status: 'Status',
  adventure: 'World',
  inventory: 'Inventory',
  techniques: 'Techniques',
  prestige: 'Prestige',
  settings: 'Settings',
} as const satisfies Record<GameTab, string>;

export const WORLD_MODULE_LABELS = {
  outskirts: 'Outskirts',
  gateTrial: 'Gate Trial',
  ruins: 'Ruins',
  apothecary: 'Apothecary',
  manualPavilion: 'Manual Pavilion',
  forge: 'Forge',
  bounties: 'Bounties',
  expeditions: 'Expeditions',
} as const satisfies Record<LiveWorldModuleKey, string>;

export const READINESS_LABELS = {
  below_minimum: 'Blocked',
  minimum_met_below_recommended: 'Preparing',
  recommended_met: 'Ready',
  risky: 'Risky',
  close: 'Close',
  cap_reached: 'Cap Reached',
} as const;

export const DIAGNOSIS_LABELS = {
  undercultivated: 'Undercultivated',
  underforged: 'Underforged',
  underprepared: 'Underprepared',
  underbuilt: 'Underbuilt',
  close: 'Close',
  bypassAvailable: 'Bypass Available',
} as const satisfies Record<FailureDiagnosisCode, string>;

export const PRESTIGE_RECOMMENDATION_LABELS = {
  tooEarly: 'Too Early',
  viable: 'Viable',
  recommended: 'Recommended',
} as const;

export const GATE_SUPPORT_LABELS = {
  support: 'Safety Net',
  eligibleDefeats: 'Eligible Defeats',
} as const;

function toTitleCase(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getShellTabLabel(tab: GameTab): string {
  return SHELL_TAB_LABELS[tab];
}

export function getWorldModuleLabel(moduleKey: string): string {
  if (moduleKey === 'alchemy') return WORLD_MODULE_LABELS.apothecary;
  if (moduleKey === 'talismanStudio') return 'Unavailable Module';
  return isLiveWorldModule(moduleKey) ? WORLD_MODULE_LABELS[moduleKey] : toTitleCase(moduleKey);
}

export function getOpenWorldModuleLabel(moduleKey: string): string {
  return `Open ${getWorldModuleLabel(moduleKey)}`;
}

export function getReadinessBandLabel(band: ReadinessBand): string {
  return READINESS_LABELS[band];
}

export function getReadinessMilestoneLabel(kind: 'risky' | 'close' | 'cap_reached'): string {
  return READINESS_LABELS[kind];
}

export function getDiagnosisLabel(code: FailureDiagnosisCode): string {
  return DIAGNOSIS_LABELS[code];
}

export function getPrestigeRecommendationLabel(recommendation: keyof typeof PRESTIGE_RECOMMENDATION_LABELS): string {
  return PRESTIGE_RECOMMENDATION_LABELS[recommendation];
}

export function getPrestigeRecommendationForAvailability(isAvailable: boolean): string {
  return isAvailable ? PRESTIGE_RECOMMENDATION_LABELS.viable : PRESTIGE_RECOMMENDATION_LABELS.tooEarly;
}

export function sanitizeLiveCityName(text: string): string {
  return Object.entries(LEGACY_SEMESTER_CITY_NAME_REPLACEMENTS).reduce(
    (current, [legacyName, replacement]) => current.replace(new RegExp(`\\b${legacyName}\\b`, 'g'), replacement),
    text,
  );
}
