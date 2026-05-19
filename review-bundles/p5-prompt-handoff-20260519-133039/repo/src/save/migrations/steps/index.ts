import type { MigrationStep } from '../migrationTypes.js';
import { CURRENT_SAVE_VERSION } from '../saveVersion.js';
import { createStepResult, touch, warning } from './v2_0_0/shared.js';
import { v2_0_0MigrationPack } from './v2_0_0/index.js';

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
    const warnings = [];
    if (ctx.sourceVersionKind === 'legacy-unversioned') {
      warnings.push(warning('legacy-unversioned', 'Save has no version; treated as legacy-unversioned.', '0.2', 'warning', 'version'));
    }
    if (ctx.sourceVersionKind === 'malformed-version') {
      warnings.push(
        warning('malformed-version', 'Save version string is malformed; falling back to 0.0.0 for compatibility migration.', '0.2', 'warning', 'version'),
      );
    }

    return createStepResult(legacyDetectionStep, save, `Source save classified as ${ctx.sourceVersionKind}.`, {
      warnings,
      touchedFieldPaths: [touch('version', 'inspect', ctx.sourceVersionKind)],
    });
  },
};

export const migrationSteps: MigrationStep[] = [legacyDetectionStep, ...v2_0_0MigrationPack];
