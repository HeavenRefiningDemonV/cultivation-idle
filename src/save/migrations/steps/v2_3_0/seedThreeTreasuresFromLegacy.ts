import type { MigrationStep } from '../../migrationTypes.js';
import { CURRENT_SAVE_VERSION, compareSaveVersions } from '../../saveVersion.js';
import { createDefaultMeridianCourtSaveState } from '../../../../features/court/courtSaveTypes.js';
import { cloneSave, createStepResult, isRecord, touch, warning } from '../v2_0_0/shared.js';

/**
 * F1 SA-A4 — seed the Three Treasures meridian slice from a legacy save.
 *
 * SHAPE-ONLY and ADDITIVE (§3.6, App. E): the derived stat engine reads sources that ALREADY
 * persist — the foundation/axes from the training store (statRatingsById), the realm index, and
 * the Tier-2 meridian ratings from the Court store. This step only ensures the Court meridian
 * save slice (`meridianCourtState`, the BODY-side / D13 partition) is present so a flag-on read
 * has a well-formed shape. It NEVER lowers earned state (never-regress), and it NEVER touches the
 * SOUL-side state (Form-Memory / prestige live on other save fields, untouched by construction).
 *
 * Idempotent: the runner gates by fromVersionRange (a save already at 2.3.0 runs no step), and
 * appliesTo additionally re-seeds an absent/malformed slice. A malformed slice is replaced with a
 * safe empty Court slice (the legacy engine remains reachable via forceLegacy — never a crash/wipe).
 */
const hasPreservableMeridianCourtState = (value: unknown): boolean =>
  isRecord(value)
  && isRecord(value.progressByMeridianId)
  && isRecord(value.rootByMeridianId)
  && isRecord(value.lifetimeTotals)
  && typeof value.fatigue === 'number'
  && typeof value.intensityId === 'string';

export const v2_3_0_seed_three_treasures_from_legacy: MigrationStep = {
  id: 'v2_3_0_seed_three_treasures_from_legacy',
  title: 'Seed the Three Treasures meridian slice from legacy',
  description:
    'F1 SA-A4: shape-only — ensures the Court meridian-training save slice (body-side) exists so the '
    + 'derived stat engine reads a well-formed shape. Additive; never lowers earned state; soul-side untouched.',
  kind: 'transform',
  ownerPacket: 'f1-sa-a4',
  fromVersionRange: { maxExclusive: CURRENT_SAVE_VERSION },
  toVersion: CURRENT_SAVE_VERSION,
  priority: 94,
  appliesTo: (save, ctx) =>
    compareSaveVersions(ctx.sourceVersion, CURRENT_SAVE_VERSION) < 0
    || !hasPreservableMeridianCourtState(save.meridianCourtState),
  run: (save) => {
    const next = cloneSave(save);
    const existing = next.meridianCourtState;

    if (hasPreservableMeridianCourtState(existing)) {
      // Preserve earned body-side state exactly (never-regress). Soul-side is untouched.
      return createStepResult(
        v2_3_0_seed_three_treasures_from_legacy,
        next,
        'Preserved existing Three Treasures meridian slice (no rating lowered).',
        {
          didMutate: false,
          touchedFieldPaths: [
            touch('meridianCourtState', 'preserve', 'Preserved existing Court meridian slice (body-side).'),
          ],
        },
      );
    }

    const warnings =
      existing !== undefined
        ? [
            warning(
              'malformed-meridian-court-state',
              'Existing meridianCourtState was malformed; replaced with a safe empty Court slice (legacy engine remains reachable via forceLegacy).',
              'f1-sa-a4',
              'warning',
              'meridianCourtState',
            ),
          ]
        : [];

    next.meridianCourtState = createDefaultMeridianCourtSaveState();

    return createStepResult(
      v2_3_0_seed_three_treasures_from_legacy,
      next,
      'Seeded an empty Three Treasures meridian slice (body-side).',
      {
        didMutate: true,
        warnings,
        touchedFieldPaths: [touch('meridianCourtState', 'set', 'Backfilled empty Court meridian slice (body-side).')],
      },
    );
  },
};
