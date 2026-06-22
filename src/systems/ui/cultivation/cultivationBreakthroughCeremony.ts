import type { RitualModalSurfaceV1 } from '../modals/ritualFrameTypes.js';
import { RITUAL_FRAME_SCHEMA_VERSION } from '../modals/ritualFrameTypes.js';
import { CULTIVATION_PATH_DATA } from './cultivationPathData.js';
import { isCultivationPath } from '../../cultivation/cultivationPathIdentityResolver.js';
import type { CultivationSeatSurfaceV1 } from './cultivationSeatTypes.js';

/**
 * M.II.3 Wave 6 — assemble a RitualModalSurfaceV1 (the F2 ceremony surface) for the Seat's
 * Threshold crossing, so the existing RitualCeremonyShell can present it. R-4: do NOT build a new
 * ceremony — this only DATA-drives the shared shell. The engine has already resolved the crossing
 * (game.breakthrough()); this surface presents the held outcome. Pure: no stores, no RNG.
 *
 * The Threshold crossing is the MAJOR realm transition, so the rite is 'tribulation' (heaven's
 * test, with the path's heart-devil). Never-regress + pity are present (gameplay truth, M.II.1).
 */

export interface BreakthroughCeremonyResult {
  /** the engine's verdict from game.breakthrough() — true = crossed, false = the tribulation held. */
  ok: boolean;
  /** true when the realm index advanced (a major crossing succeeded). */
  advanced: boolean;
  fromRealmName: string;
}

const CEREMONY_INTENTS = {
  skip: 'cultivation.seat.ceremony.skip',
  exit: 'cultivation.seat.ceremony.exit',
  confirm: 'cultivation.seat.ceremony.confirm',
} as const;

export const CULTIVATION_CEREMONY_EXIT_INTENT = CEREMONY_INTENTS.exit;

export function buildBreakthroughCeremonySurface(
  seat: CultivationSeatSurfaceV1,
  result: BreakthroughCeremonyResult,
): RitualModalSurfaceV1 {
  const path = seat.meta.path;
  const def = CULTIVATION_PATH_DATA[isCultivationPath(seat.meta.currentPath) ? seat.meta.currentPath : path];
  const success = result.ok && result.advanced;
  const pity = seat.breakthrough.gateReadiness?.pity ?? null;

  const stakes = {
    risked: success ? ['A portion of banked qi, spent in the crossing.'] : ['Banked qi spent, and a wound left to settle in the Dao Heart.'],
    gained: success ? [`${seat.identity.realmName} — a new realm, and the meridian it opens.`] : ['Nothing earned is lost; the climb only waits.'],
    guaranteed: ['No realm you have earned is lost.', 'Each attempt banks pity toward a sure crossing.'],
  };

  const neverRegress = {
    headline: 'No realm you have earned is lost.',
    pityNote: 'Pity accumulates toward a guaranteed crossing.',
  };

  const outcome = success
    ? {
        kind: 'success' as const,
        eyebrow: 'Threshold crossed',
        title: seat.identity.realmName,
        titleCjk: seat.identity.realmZh,
        body: `The ${def.name.toLowerCase()} climb rises — ${seat.identity.realmName} is yours, and a new channel of the path runs clear. ${def.verse}`,
      }
    : {
        kind: 'not-yet' as const,
        eyebrow: 'Not yet',
        title: 'The gate holds — for now',
        body: `${def.tribName}. The heart-devil — ${def.heartDevil} — rose too high this time. No realm is lost; the climb only waits.`,
        pityGained: pity ? `Pity banked — ${pity.banked} of ${pity.toGuarantee}` : 'Pity banked',
        pityPercent: pity && pity.toGuarantee > 0 ? Math.round((pity.banked / pity.toGuarantee) * 100) : 0,
      };

  return {
    schemaVersion: RITUAL_FRAME_SCHEMA_VERSION,
    visualState: success ? 'tribulation-success' : 'tribulation-not-yet',
    rite: 'tribulation',
    riteState: success ? 'default' : 'postFailure',
    riteTag: '渡劫',
    riteName: success ? `The Crossing into ${seat.identity.realmName}` : `The ${result.fromRealmName} Tribulation`,
    stakes,
    neverRegress,
    outcome,
    honestOdds: seat.breakthrough.gateReadiness
      ? { label: 'Crossing safety', value: seat.breakthrough.gateReadiness.safetyBand }
      : undefined,
    skipIntent: CEREMONY_INTENTS.skip,
    exitIntent: CEREMONY_INTENTS.exit,
    confirmIntent: CEREMONY_INTENTS.confirm,
  };
}
