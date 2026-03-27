import { buildCurrentLifeSummarySurface } from '../../../features/prestige/lifeSummarySurface.js';
import { getPrestigeAdvisorSurface } from '../../../features/prestige/prestigeAdvisorSurface.js';
import { getWorldModuleCardDefinitions } from '../../../systems/world/moduleCardRegistry.js';
import { LIVE_SURFACE_MANIFEST } from './liveSurfaceManifest.js';

export interface SurfaceTruthAuditEntry {
  surfaceId: string;
  scenarioId: string;
  lines: string[];
}

export interface SurfaceTruthFinding {
  surfaceId: string;
  scenarioId: string;
  reason: string;
  line: string;
}

export interface SurfaceTruthAuditReport {
  schemaVersion: '7.5b-surface-truth-audit';
  generatedAt: number;
  overallPass: boolean;
  trackedSurfaces: string[];
  scenarios: string[];
  findings: SurfaceTruthFinding[];
  notes: string[];
}

const RAW_ID_PATTERN = /\bcity_[a-z0-9_]+\b|\btrial_[a-z0-9_]+\b|\b(overallBand|selectedPath|currentCityId|currentGateTrialId)\b/i;
const STALE_COPY_PATTERN = /coming soon|under development|not implemented yet|\(debug\)|for debugging|debug tools/i;
const FUTURE_CITY_PATTERN = /city six|city_6|fake city/i;

export function auditSurfaceTruthEntries(entries: SurfaceTruthAuditEntry[]): SurfaceTruthAuditReport {
  const findings: SurfaceTruthFinding[] = [];

  entries.forEach((entry) => {
    entry.lines.forEach((line) => {
      if (RAW_ID_PATTERN.test(line)) {
        findings.push({ surfaceId: entry.surfaceId, scenarioId: entry.scenarioId, reason: 'raw_internal_id_leak', line });
      }
      if (STALE_COPY_PATTERN.test(line)) {
        findings.push({ surfaceId: entry.surfaceId, scenarioId: entry.scenarioId, reason: 'stale_or_debug_copy', line });
      }
      if (FUTURE_CITY_PATTERN.test(line)) {
        findings.push({ surfaceId: entry.surfaceId, scenarioId: entry.scenarioId, reason: 'future_or_fake_city_leak', line });
      }
    });
  });

  const scenarios = [...new Set(entries.map((entry) => entry.scenarioId))];

  return {
    schemaVersion: '7.5b-surface-truth-audit',
    generatedAt: Date.now(),
    overallPass: findings.length === 0,
    trackedSurfaces: [...LIVE_SURFACE_MANIFEST.trackedSurfaceIds],
    scenarios,
    findings,
    notes: [
      'Audit checks player-facing surface strings, not internal state identifiers in code paths.',
      ...LIVE_SURFACE_MANIFEST.notes,
    ],
  };
}

export function buildRuntimeSurfaceTruthEntries(scenarioId: string): SurfaceTruthAuditEntry[] {
  const lifeSummary = buildCurrentLifeSummarySurface();
  const prestigeAdvisor = getPrestigeAdvisorSurface();
  const worldModules = getWorldModuleCardDefinitions();

  return [
    {
      surfaceId: 'life_summary',
      scenarioId,
      lines: lifeSummary.blocks.flatMap((block) => [block.title, ...block.lines]),
    },
    {
      surfaceId: 'prestige',
      scenarioId,
      lines: [
        prestigeAdvisor.stateLabel,
        prestigeAdvisor.stateDetail,
        prestigeAdvisor.topRecommendedPurchase?.name ?? '',
        prestigeAdvisor.topRecommendedPurchase?.reasonLine ?? '',
        prestigeAdvisor.topRecommendedPurchase?.affordabilityLabel ?? '',
      ],
    },
    {
      surfaceId: 'world',
      scenarioId,
      lines: worldModules.flatMap((entry) => [entry.label, entry.bestUsedWhen, entry.ctaLabel]),
    },
  ];
}
