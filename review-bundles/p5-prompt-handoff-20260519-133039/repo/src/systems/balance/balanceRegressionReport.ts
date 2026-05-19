import type { BalanceRegressionMetricResult, BalanceRegressionSectionId, BalanceRegressionSuiteResult } from '../../../tests/helpers/balance/runBalanceRegressionSuite.js';

export interface BalanceRegressionReportMetric {
  metricId: string;
  label: string;
  packetOwner?: string;
  actual: number | boolean | string;
  target: number | boolean | string | { min: number; max: number } | { minSeconds: number; maxSeconds: number };
  comparator: BalanceRegressionMetricResult['comparator'];
  passed: boolean;
  notes?: string;
  context?: BalanceRegressionMetricResult['context'];
}

export interface BalanceRegressionReportSection {
  sectionId: BalanceRegressionSectionId;
  label: string;
  sourcePackets: string[];
  passed: boolean;
  metricCount: number;
  failingMetricCount: number;
  metrics: BalanceRegressionReportMetric[];
}

export interface BalanceRegressionReport {
  schemaVersion: 1;
  createdAt: number;
  suiteVersion: BalanceRegressionSuiteResult['suiteVersion'];
  overallPass: boolean;
  hardFailureCount: number;
  warningCount: number;
  sections: BalanceRegressionReportSection[];
}

const SECTION_ORDER: Array<{ id: BalanceRegressionSectionId; label: string; sourcePackets: string[] }> = [
  { id: 'timing', label: 'Timing', sourcePackets: ['6.2', '6.9a'] },
  { id: 'activities', label: 'Activities', sourcePackets: ['6.3', '6.9a'] },
  { id: 'prep', label: 'Prep / Anti-stall', sourcePackets: ['6.4', '6.9a'] },
  { id: 'combat', label: 'Combat', sourcePackets: ['6.5', '6.9a'] },
  { id: 'offline', label: 'Offline', sourcePackets: ['6.6', '6.9a'] },
  { id: 'prestige', label: 'Prestige', sourcePackets: ['6.7', '6.9a'] },
  { id: 'telemetry', label: 'Telemetry', sourcePackets: ['6.8', '6.9b', '6.9c'] },
];

export function buildBalanceRegressionReport(input: BalanceRegressionSuiteResult, options?: { createdAt?: number }): BalanceRegressionReport {
  const sections: BalanceRegressionReportSection[] = SECTION_ORDER.map((section) => {
    const metrics = input.metrics
      .filter((metric) => metric.sectionId === section.id)
      .sort((a, b) => a.metricId.localeCompare(b.metricId))
      .map((metric) => ({
        metricId: metric.metricId,
        label: metric.label,
        packetOwner: metric.packetOwner,
        actual: metric.actual,
        target: metric.target,
        comparator: metric.comparator,
        passed: metric.passed,
        notes: metric.notes,
        context: metric.context,
      }));

    return {
      sectionId: section.id,
      label: section.label,
      sourcePackets: section.sourcePackets,
      passed: metrics.every((metric) => metric.passed),
      metricCount: metrics.length,
      failingMetricCount: metrics.filter((metric) => !metric.passed).length,
      metrics,
    };
  });

  return {
    schemaVersion: 1,
    createdAt: options?.createdAt ?? Date.now(),
    suiteVersion: input.suiteVersion,
    overallPass: input.overallPass,
    hardFailureCount: input.hardFailureCount,
    warningCount: input.warningCount,
    sections,
  };
}

function formatTarget(target: BalanceRegressionReportMetric['target']) {
  if (typeof target === 'object' && target !== null) {
    if ('min' in target) return `[${target.min}, ${target.max}]`;
    return `[${target.minSeconds}, ${target.maxSeconds}]`;
  }
  return String(target);
}

export function renderBalanceRegressionReport(report: BalanceRegressionReport, options?: { sectionId?: BalanceRegressionSectionId }): string {
  const sections = options?.sectionId ? report.sections.filter((section) => section.sectionId === options.sectionId) : report.sections;
  const lines: string[] = [];
  lines.push('Balance Regression Report');
  lines.push(`schema=${report.schemaVersion} suite=${report.suiteVersion} overall=${report.overallPass ? 'PASS' : 'FAIL'}`);
  lines.push(`hardFailures=${report.hardFailureCount} warnings=${report.warningCount}`);
  lines.push('');

  for (const section of sections) {
    lines.push(`[${section.passed ? 'PASS' : 'FAIL'}] ${section.label} (${section.sectionId}) metrics=${section.metricCount} failing=${section.failingMetricCount}`);
    const failing = section.metrics.filter((metric) => !metric.passed);
    if (failing.length === 0) {
      lines.push('  - all metrics passing');
      continue;
    }

    for (const metric of failing) {
      lines.push(`  - ${metric.metricId}: actual=${String(metric.actual)} target=${formatTarget(metric.target)} comparator=${metric.comparator}`);
      if (metric.notes) lines.push(`    notes: ${metric.notes}`);
    }
  }

  return lines.join('\n');
}

export function serializeBalanceRegressionReport(report: BalanceRegressionReport, options?: { pretty?: boolean }): string {
  return JSON.stringify(report, null, options?.pretty === false ? 0 : 2);
}
