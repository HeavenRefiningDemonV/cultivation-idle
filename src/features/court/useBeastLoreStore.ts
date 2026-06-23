import { create } from 'zustand';
import { BEAST_ESSENCES } from '../../systems/ui/cultivation/cultivationPathData.js';

/**
 * D11 / Earth Beast-Lore — the absorbed-essence store (the Seat's Earth instrument's live source).
 *
 * D11 owns the beast-essence DROP (J.3: "beast-essence drops → Earth's Beast Lore source"); Earth
 * absorbs them into body-tempering. This is the absorption tally that flips the Seat's Earth instrument
 * from the honest "not yet active" preview to a real read — the way C-PATH Premonition flipped Heaven.
 *
 * SCOPE (slice 1) / DISCIPLINE:
 *  - SESSION-TRANSIENT (not yet persisted) — a fast first vertical slice; the save-slice + migration is
 *    slice 2 (so a reload currently resets the tally — noted, not shipped to players: it only fills
 *    under the dev engine flag).
 *  - The drop is engine-gated (only the dev derived engine absorbs) + Earth-path-only — preserve-first:
 *    shipped players still see "not yet active".
 *  - PLACEHOLDER mechanism: each beast kill absorbs the NEXT essence in BEAST_ESSENCES order, capped at
 *    the roster. The real per-beast → essence mapping + drop RATES are D11/D15-held content.
 */
interface BeastLoreState {
  absorbedCount: number;
  /** Absorb one essence (bounded by the roster). Called on a beast kill under the engine flag. */
  absorbEssence: () => void;
  /** Reset the tally (e.g. a new life / prestige). */
  resetBeastLore: () => void;
}

export const useBeastLoreStore = create<BeastLoreState>((set) => ({
  absorbedCount: 0,
  absorbEssence: () => set((s) => ({ absorbedCount: Math.min(BEAST_ESSENCES.length, s.absorbedCount + 1) })),
  resetBeastLore: () => set({ absorbedCount: 0 }),
}));
