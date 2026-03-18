import type { MigrationStep, MigrationStepResult } from '../migrationTypes.js';
import { compareSaveVersions, CURRENT_SAVE_VERSION } from '../saveVersion.js';

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const baseResult = (step: MigrationStep, save: Record<string, unknown>, summary: string): MigrationStepResult => ({
  stepId: step.id,
  kind: step.kind,
  ownerPacket: step.ownerPacket,
  didRun: true,
  didMutate: false,
  summary,
  warnings: [],
  touchedFieldPaths: [],
  plannedMutations: [],
  save,
});

const legacyDetectionStep: MigrationStep = {
  id: 'm0_report_source_version',
  title: 'Report source save version kind',
  description: 'Detect unversioned/malformed/legacy save origins for migration reporting.',
  kind: 'reportOnly',
  ownerPacket: '0.2',
  fromVersionRange: {},
  toVersion: CURRENT_SAVE_VERSION,
  priority: 10,
  appliesTo: () => true,
  run: (save, ctx) => {
    const result = baseResult(legacyDetectionStep, save, `Source save classified as ${ctx.sourceVersionKind}.`);
    if (ctx.sourceVersionKind === 'legacy-unversioned') {
      result.warnings.push({
        code: 'legacy-unversioned',
        severity: 'warning',
        message: 'Save has no version; treated as legacy-unversioned.',
        ownerPacket: '0.2',
        path: 'version',
      });
    }
    if (ctx.sourceVersionKind === 'malformed-version') {
      result.warnings.push({
        code: 'malformed-version',
        severity: 'warning',
        message: 'Save version string is malformed; falling back to 0.0.0 for compatibility migration.',
        ownerPacket: '0.2',
        path: 'version',
      });
    }
    result.touchedFieldPaths.push({ path: 'version', action: 'inspect', detail: ctx.sourceVersionKind });
    return result;
  },
};

const normalizeAndVersionStep: MigrationStep = {
  id: 'm1_transform_normalize_and_bump_version',
  title: 'Normalize save structure and bump to current version',
  description: 'Uses normalizeToCurrent adapter to safely shape legacy save data and preserve unknown fields.',
  kind: 'transform',
  ownerPacket: '0.2',
  fromVersionRange: { maxExclusive: CURRENT_SAVE_VERSION },
  toVersion: CURRENT_SAVE_VERSION,
  priority: 20,
  appliesTo: (_save, ctx) => compareSaveVersions(ctx.sourceVersion, CURRENT_SAVE_VERSION) < 0,
  run: (save, ctx) => {
    let next = deepClone(save);
    if (ctx.normalizeToCurrent) {
      next = ctx.normalizeToCurrent(next);
    }
    next.version = CURRENT_SAVE_VERSION;

    return {
      ...baseResult(normalizeAndVersionStep, next, 'Save normalized and version bumped to current.'),
      didMutate: true,
      touchedFieldPaths: [
        { path: 'version', action: 'set', detail: CURRENT_SAVE_VERSION },
        { path: 'meta', action: 'preserve', detail: 'Unknown fields retained via normalizer.' },
      ],
    };
  },
};

const plannedPathTruthStep: MigrationStep = {
  id: 'm9_planned_path_truth_alignment',
  title: 'Planned path-truth alignment migration',
  description: 'Reserves migration report output for packet 1.2 path-truth convergence work.',
  kind: 'plannedTransform',
  ownerPacket: '1.2',
  fromVersionRange: { min: CURRENT_SAVE_VERSION },
  toVersion: CURRENT_SAVE_VERSION,
  priority: 90,
  appliesTo: () => true,
  run: (save) => ({
    ...baseResult(plannedPathTruthStep, save, 'Planned path-truth migration recorded (not applied in 0.2A).'),
    plannedMutations: [
      {
        path: 'gameState.selectedPath',
        action: 'move',
        ownerPacket: '1.2',
        reason: 'Converge selectedPath alias behavior onto canonical lifePath source-of-truth.',
      },
    ],
  }),
};

export const migrationSteps: MigrationStep[] = [legacyDetectionStep, normalizeAndVersionStep, plannedPathTruthStep];
