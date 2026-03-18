import type { LegacySaveVersionKind, SaveVersionString } from './saveVersion.js';

export type MigrationStepKind = 'transform' | 'reportOnly' | 'plannedTransform';
export type MigrationSeverity = 'info' | 'warning' | 'error';

export interface MigrationFieldTouch {
  path: string;
  action: 'set' | 'delete' | 'preserve' | 'inspect';
  detail?: string;
}

export interface MigrationWarning {
  code: string;
  severity: MigrationSeverity;
  message: string;
  ownerPacket: string;
  path?: string;
}

export interface PlannedMutation {
  path: string;
  action: 'set' | 'delete' | 'move';
  ownerPacket: string;
  reason: string;
}

export interface MigrationStepResult {
  stepId: string;
  kind: MigrationStepKind;
  ownerPacket: string;
  didRun: boolean;
  didMutate: boolean;
  summary: string;
  warnings: MigrationWarning[];
  touchedFieldPaths: MigrationFieldTouch[];
  plannedMutations: PlannedMutation[];
  save: Record<string, unknown>;
}

export interface MigrationSummaryCounts {
  totalSteps: number;
  ranSteps: number;
  mutatedSteps: number;
  warningCount: number;
  errorCount: number;
  touchedFieldCount: number;
  plannedMutationCount: number;
}

export interface MigrationRunReport {
  sourceVersion: string;
  sourceVersionKind: LegacySaveVersionKind;
  targetVersion: SaveVersionString;
  finalVersion: string;
  mode: 'dry-run' | 'apply';
  appliedTransformSteps: string[];
  reportOnlySteps: string[];
  plannedTransformSteps: string[];
  warnings: MigrationWarning[];
  errors: MigrationWarning[];
  touchedFieldPaths: MigrationFieldTouch[];
  counts: MigrationSummaryCounts;
  summaryLines: string[];
  stepResults: MigrationStepResult[];
}

export interface MigrationContext {
  mode: 'dry-run' | 'apply';
  sourceVersion: string;
  sourceVersionKind: LegacySaveVersionKind;
  targetVersion: SaveVersionString;
  nowMs: number;
  normalizeToCurrent?: (save: Record<string, unknown>) => Record<string, unknown>;
}

export interface VersionRange {
  min?: SaveVersionString;
  maxExclusive?: SaveVersionString;
}

export interface MigrationStep {
  id: string;
  title: string;
  description: string;
  kind: MigrationStepKind;
  ownerPacket: string;
  fromVersionRange: VersionRange;
  toVersion: SaveVersionString;
  priority: number;
  appliesTo: (save: Record<string, unknown>, ctx: MigrationContext) => boolean;
  run: (save: Record<string, unknown>, ctx: MigrationContext) => MigrationStepResult;
}

export type RegisteredMigrationStep = MigrationStep;
