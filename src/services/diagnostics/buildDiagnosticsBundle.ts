import { SaveService } from '../save/SaveService.js';
import { useActivityStore } from '../../stores/activityStore.js';
import { useCombatStore } from '../../stores/combatStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useTelemetryStore } from '../../stores/telemetryStore.js';
import { useErrorLogStore } from '../../stores/errorLogStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { runRuntimeValidation } from './runValidation.js';
import type { ValidationIssue } from './runValidation.js';
import type { SaveInfo } from '../../utils/saveload.js';

export type DiagnosticsBundleV1 = {
  schemaVersion: 1;
  createdAt: number;
  app: {
    name: string;
    version: string;
    mode: string;
  };
  environment: {
    userAgent: string | null;
    platform: string | null;
  };
  save: {
    exportString: string | null;
    saveInfo: SaveInfo | null;
    lastSaveAt: number | null;
    lastOfflineSummary: unknown;
  };
  status: {
    activity: unknown;
    combat: { inCombat: boolean; type: string | null } | null;
    contentCounts: Record<string, number>;
  };
  telemetry: {
    recentEvents: ReturnType<typeof useTelemetryStore.getState>['events'];
    recentErrors: ReturnType<typeof useErrorLogStore.getState>['errors'];
  };
  validation: {
    issues: ValidationIssue[];
    errorCount: number;
    warningCount: number;
  };
  errors?: string[];
};

function safeGetAppVersion(): string {
  try {
    const env: any = (import.meta as any)?.env;
    const version = env?.VITE_APP_VERSION ?? env?.VITE_VERSION;
    if (typeof version === 'string' && version.trim().length > 0) return version;
  } catch (error) {
    console.warn('[Diagnostics] Unable to read app version', error);
  }
  return 'unknown';
}

function buildContentCounts(): Record<string, number> {
  const content = useContentStore.getState();
  const maps = content.maps;
  return {
    cities: Object.keys(maps.citiesById ?? {}).length,
    items: Object.keys(maps.itemsById ?? {}).length,
    techniques: Object.keys(maps.techniquesById ?? {}).length,
    pavilions: Object.keys(maps.pavilionsById ?? {}).length,
    outskirts: Object.keys(maps.outskirtsById ?? {}).length,
    enemies: Object.keys(maps.enemiesById ?? {}).length,
    trials: Object.keys(maps.trialsById ?? {}).length,
    ruins: Object.keys(maps.ruinsById ?? {}).length,
    heartLaws: content.raw?.heart_laws?.length ?? 0,
    prestigeUpgrades: content.raw?.prestige_store?.upgrades?.length ?? 0,
  };
}

export function buildDiagnosticsBundle(): DiagnosticsBundleV1 {
  const createdAt = Date.now();
  const errors: string[] = [];

  const app = {
    name: 'cultivation-idle',
    version: safeGetAppVersion(),
    mode: typeof import.meta !== 'undefined' && (import.meta as any)?.env?.MODE ? (import.meta as any).env.MODE : 'unknown',
  };

  const environment = {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    platform: typeof navigator !== 'undefined' ? navigator.platform : null,
  };

  let exportString: string | null = null;
  let saveInfo: SaveInfo | null = null;
  try {
    exportString = SaveService.exportSave();
  } catch (error) {
    errors.push(`exportSave failed: ${String(error)}`);
  }
  try {
    saveInfo = SaveService.getSaveInfo();
  } catch (error) {
    errors.push(`getSaveInfo failed: ${String(error)}`);
  }

  const uiState = useUIStore.getState();

  const save = {
    exportString: exportString ?? null,
    saveInfo: saveInfo ?? null,
    lastSaveAt: uiState.lastSaveAt ?? null,
    lastOfflineSummary: uiState.lastOfflineSummary ?? null,
  };

  const activityState = useActivityStore.getState();
  const combatState = useCombatStore.getState();

  const status = {
    activity: activityState?.active ?? null,
    combat: combatState?.combatContext
      ? { inCombat: Boolean(combatState.combatContext.type), type: combatState.combatContext.type ?? null }
      : null,
    contentCounts: buildContentCounts(),
  };

  const telemetryStore = useTelemetryStore.getState();
  const errorStore = useErrorLogStore.getState();

  const telemetry = {
    recentEvents: telemetryStore.events.slice(0, telemetryStore.maxEvents),
    recentErrors: errorStore.errors.slice(0, errorStore.maxErrors),
  };

  let validationIssues: ValidationIssue[] = [];
  try {
    validationIssues = runRuntimeValidation();
  } catch (error) {
    errors.push(`validation failed: ${String(error)}`);
  }

  const validation = {
    issues: validationIssues,
    errorCount: validationIssues.filter((issue) => issue.severity === 'error').length,
    warningCount: validationIssues.filter((issue) => issue.severity === 'warning').length,
  };

  return {
    schemaVersion: 1,
    createdAt,
    app,
    environment,
    save,
    status,
    telemetry,
    validation,
    errors: errors.length > 0 ? errors : undefined,
  };
}
