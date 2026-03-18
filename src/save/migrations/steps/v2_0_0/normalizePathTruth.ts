import type { MigrationStep } from '../../migrationTypes.js';
import { CURRENT_SAVE_VERSION, compareSaveVersions } from '../../saveVersion.js';
import { cloneSave, createStepResult, isRecord, touch, warning } from './shared.js';

const VALID_PATHS = new Set(['heaven', 'earth', 'martial']);

export const v2_0_0_normalize_path_truth: MigrationStep = {
  id: 'v2_0_0_normalize_path_truth',
  title: 'Normalize selectedPath/lifePath save truth',
  description: 'Safely reconcile selectedPath and lifePath for legacy saves without removing compatibility fields.',
  kind: 'transform',
  ownerPacket: '0.2',
  fromVersionRange: { maxExclusive: CURRENT_SAVE_VERSION },
  toVersion: CURRENT_SAVE_VERSION,
  priority: 30,
  appliesTo: (save, ctx) => {
    if (compareSaveVersions(ctx.sourceVersion, CURRENT_SAVE_VERSION) >= 0) return false;
    return isRecord(save.gameState);
  },
  run: (save) => {
    const next = cloneSave(save);
    const warnings = [];
    const touched = [];
    let mutated = false;

    const gameState = isRecord(next.gameState) ? next.gameState : ((next.gameState = {}), next.gameState as Record<string, unknown>);
    const selectedPath = typeof gameState.selectedPath === 'string' && VALID_PATHS.has(gameState.selectedPath)
      ? gameState.selectedPath
      : null;
    const lifePath = typeof gameState.lifePath === 'string' && VALID_PATHS.has(gameState.lifePath)
      ? gameState.lifePath
      : null;

    let resolved = selectedPath;

    if (resolved == null && lifePath != null) {
      resolved = lifePath;
      gameState.selectedPath = resolved;
      mutated = true;
      touched.push(touch('gameState.selectedPath', 'set', `Backfilled from lifePath (${resolved}).`));
      warnings.push(warning('PATH_BACKFILLED_FROM_LIFEPATH', 'selectedPath was backfilled from legacy lifePath.', '0.2', 'warning', 'gameState.selectedPath'));
    }

    if (selectedPath != null && lifePath != null && selectedPath !== lifePath) {
      resolved = selectedPath;
      warnings.push(
        warning(
          'PATH_CONFLICT_RESOLVED_TO_SELECTED_PATH',
          `selectedPath (${selectedPath}) and lifePath (${lifePath}) disagreed; selectedPath was kept.`,
          '0.2',
          'warning',
          'gameState.lifePath',
        ),
      );
    }

    if (resolved != null && gameState.lifePath !== resolved) {
      gameState.lifePath = resolved;
      mutated = true;
      touched.push(touch('gameState.lifePath', 'set', `Compatibility mirrored to ${resolved}.`));
      warnings.push(warning('LIFEPATH_COMPAT_MIRRORED', 'lifePath compatibility mirror was updated to the resolved selectedPath.', '0.2', 'info', 'gameState.lifePath'));
    }

    return createStepResult(
      v2_0_0_normalize_path_truth,
      next,
      mutated ? 'Path truth normalized for legacy save compatibility.' : 'Path truth already normalized.',
      { didMutate: mutated, warnings, touchedFieldPaths: touched },
    );
  },
};
