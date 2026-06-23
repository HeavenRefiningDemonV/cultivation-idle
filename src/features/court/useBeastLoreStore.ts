import { create } from 'zustand';
import { BEAST_ESSENCES } from '../../systems/ui/cultivation/cultivationPathData.js';
import { createDefaultBeastLoreSaveState, type SaveBeastLoreState } from './courtSaveTypes.js';

/**
 * D11 / Earth Beast-Lore — the absorbed-essence store (the Seat's Earth instrument's live source).
 *
 * D11 owns the beast-essence DROP (J.3: "beast-essence drops → Earth's Beast Lore source"); Earth
 * absorbs them into body-tempering. This is the absorption tally that flips the Seat's Earth instrument
 * from the honest "not yet active" preview to a real read — the way C-PATH Premonition flipped Heaven.
 *
 * SCOPE / DISCIPLINE:
 *  - PERSISTED (slice 2): the tally serialises into the save (toSaveState / hydrateFromSave), so the
 *    bestiary survives a reload. Optional save slice ⇒ legacy saves default to 0 (no migration needed).
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
  /** Serialise for the save. */
  toSaveState: () => SaveBeastLoreState;
  /** Restore from the save (missing ⇒ default 0, legacy-safe). */
  hydrateFromSave: (saved: SaveBeastLoreState | null | undefined) => void;
}

export const useBeastLoreStore = create<BeastLoreState>((set, get) => ({
  absorbedCount: 0,
  absorbEssence: () => set((s) => ({ absorbedCount: Math.min(BEAST_ESSENCES.length, s.absorbedCount + 1) })),
  resetBeastLore: () => set(createDefaultBeastLoreSaveState()),
  toSaveState: () => ({ absorbedCount: get().absorbedCount }),
  hydrateFromSave: (saved) => {
    const n = saved && typeof saved.absorbedCount === 'number' && Number.isFinite(saved.absorbedCount) ? saved.absorbedCount : 0;
    set({ absorbedCount: Math.min(BEAST_ESSENCES.length, Math.max(0, Math.floor(n))) });
  },
}));
