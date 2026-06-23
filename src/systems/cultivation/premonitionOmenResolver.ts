import {
  PREMONITION_FORTUNE_OMENS,
  PREMONITION_RISK_OMENS,
  type PremonitionOmenDef,
} from '../ui/cultivation/cultivationPathData.js';
import type { PremonitionOmen } from '../ui/cultivation/cultivationSeatTypes.js';

/**
 * C-PATH slice 1 — Heaven PREMONITION, the "Day's Omen" idle horizon (D5 §5.1, horizon B).
 *
 * The most self-contained per-path mechanic (Beast-Lore needs D11 drops, Weapon-Bond needs D8
 * equipment — both unbuilt). Day's Omen is INFORMATION, never power (D5 §5.1.6 anti-funnel): it
 * reads live truth and grades a forecast by realm + perception. PURE (no stores, no React) so the
 * builder/contract path stays clean.
 *
 * DISCIPLINE (mirrors B-MERID / the Seat truthful-now pass):
 *  - HOLD every [tune] constant. The full `precision = f(realm, perception)` curve and all combat-
 *    horizon meter constants are D15/F-BAL-owned and OUT of this idle slice. Precision here is gated
 *    by the AUTHORED Heaven realm cadence (ordinal realm tiers), not an invented number.
 *  - PRESERVE-FIRST: when the derived engine is off (player default / forceLegacy), this returns
 *    EXACTLY today's honest preview — the full authored omen tables, inert, active:false.
 *  - NO power write: the result is read-only information (graded omens), no stat delta.
 */
export type PremonitionPrecision = 'vague' | 'banded' | 'precise';

export interface PremonitionOmensResult {
  active: boolean;
  precision: PremonitionPrecision;
  horizon: number; // the live perception rating, surfaced as foresight depth (display)
  fortuneOmens: PremonitionOmen[];
  riskOmens: PremonitionOmen[];
  caption: string;
}

const asOmen = (d: PremonitionOmenDef): PremonitionOmen => ({ label: d.label, value: d.value, detail: d.detail, tone: d.tone });

export function resolvePremonitionOmens(input: {
  realmIndex1to7: number;
  perception: number;
  idleRunning: boolean;
  engineActive: boolean;
}): PremonitionOmensResult {
  // Engine off ⇒ the honest preview, byte-for-byte (full authored tables, inert).
  if (!input.engineActive) {
    return {
      active: false,
      precision: 'vague',
      horizon: 0,
      fortuneOmens: PREMONITION_FORTUNE_OMENS.map(asOmen),
      riskOmens: PREMONITION_RISK_OMENS.map(asOmen),
      caption: '',
    };
  }

  // Precision tier from the AUTHORED Heaven realm cadence (D5 §5.1.7 / cultivationPathData realms):
  // R1–2 "the world becomes legible / weaknesses visible" (vague) → R3–4 "the mind steadies" (banded)
  // → R5+ "sees the crack in anything" (precise). Ordinal realm gates, NOT a [tune] magnitude.
  const precision: PremonitionPrecision =
    input.realmIndex1to7 >= 5 ? 'precise' : input.realmIndex1to7 >= 3 ? 'banded' : 'vague';

  // The "Cultivation wind" fortune is a REAL read of whether the seclusion is accruing right now (§F).
  const wind: PremonitionOmen = input.idleRunning
    ? { label: 'Cultivation wind', value: 'favorable', detail: 'idle gains run warm — the seclusion accrues', tone: 'jade' }
    : { label: 'Cultivation wind', value: 'stilled', detail: 'combat holds the seclusion — accrual is paused', tone: 'neutral' };

  // More omens come into focus as foresight sharpens — information, never power.
  const fortuneOmens: PremonitionOmen[] = [wind];
  if (precision !== 'vague' && PREMONITION_FORTUNE_OMENS[1]) fortuneOmens.push(asOmen(PREMONITION_FORTUNE_OMENS[1]));
  const riskOmens: PremonitionOmen[] = precision === 'precise' ? PREMONITION_RISK_OMENS.map(asOmen) : [];

  return {
    active: true,
    precision,
    horizon: Math.max(0, Math.round(input.perception)), // the live perception rating IS the foresight depth
    fortuneOmens,
    riskOmens,
    caption: precision === 'precise' ? 'A precise reading of the day' : precision === 'banded' ? 'A banded reading of the day' : 'A vague reading of the day',
  };
}
