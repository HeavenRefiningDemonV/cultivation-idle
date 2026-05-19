import type { MigrationFieldTouch, MigrationStep, MigrationStepResult, MigrationWarning, PlannedMutation } from '../../migrationTypes.js';

export const cloneSave = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

export const createStepResult = (
  step: MigrationStep,
  save: Record<string, unknown>,
  summary: string,
  extras?: Partial<Omit<MigrationStepResult, 'stepId' | 'kind' | 'ownerPacket' | 'didRun' | 'didMutate' | 'summary' | 'save'>> & {
    didMutate?: boolean;
  },
): MigrationStepResult => ({
  stepId: step.id,
  kind: step.kind,
  ownerPacket: step.ownerPacket,
  didRun: true,
  didMutate: extras?.didMutate ?? false,
  summary,
  warnings: extras?.warnings ?? [],
  touchedFieldPaths: extras?.touchedFieldPaths ?? [],
  plannedMutations: extras?.plannedMutations ?? [],
  save,
});

export const warning = (
  code: string,
  message: string,
  ownerPacket: string,
  severity: MigrationWarning['severity'] = 'warning',
  path?: string,
): MigrationWarning => ({ code, message, ownerPacket, severity, path });

export const touch = (path: string, action: MigrationFieldTouch['action'], detail?: string): MigrationFieldTouch => ({
  path,
  action,
  detail,
});

export const plan = (
  path: string,
  ownerPacket: string,
  reason: string,
  action: PlannedMutation['action'] = 'set',
): PlannedMutation => ({ path, ownerPacket, reason, action });
