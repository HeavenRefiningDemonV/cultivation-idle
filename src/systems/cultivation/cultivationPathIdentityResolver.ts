import type { CultivationPath } from '../../types/index.js';
import { isMeridianUnlocked } from '../meridians/meridianModel.js';
import { getOrderedLiveRealms } from '../progression/runtime/liveRealmProjection.js';

/**
 * M.II.1 — CULT-MECH sub-objective C: resolve the three lives (Heaven / Earth / Martial)
 * as typed data, and (B) the path's seven-meridian drip column + the one-per-breakthrough
 * reveal. Pure: no stores, no React, no paint. Token/glyph IDs only (resolved at paint in
 * M.II.3) — never hex.
 *
 * Roster ownership (J.2): the *roster* (which meridians a path has, and the reveal order)
 * is owned by the content pack (path_meridians.json) and the engine (MERIDIAN_DERIVED_MAP).
 * The ordered roster below is a VENDORED MIRROR of that content — synchronous (the live pack
 * is async, Court-only) and contract-locked: cultivationPathIdentityContract.test.ts asserts
 * the ids/order/slot/label/effectLine here are byte-equivalent to path_meridians.json and that
 * the ids are a subset of MERIDIAN_DERIVED_MAP. CULT-MECH wires the reveal + tri-state, never
 * the roster.
 */

export type MeridianDripState = 'unlocked-bright' | 'idle-dim' | 'sealed-future';

export interface MeridianDripSlip {
  meridianId: string;
  /** slot 1..7; equals the meridian's authored unlockRealm. */
  slot: number;
  label: string;
  effectLine: string;
  state: MeridianDripState;
  /** exactly one true in the live slice; FALSE for the capstone at semester cap. */
  isNextToUnlock: boolean;
  /** the (0-based) realm index at which this slip reveals, or null if not yet revealed. */
  revealedAtRealmIndex: number | null;
}

export interface MeridianDripSurface {
  pathId: CultivationPath | null;
  /** the path's 7 ordered slips, each tri-state-tagged. Empty when no path is chosen. */
  slips: MeridianDripSlip[];
  unlockedCount: number;
  /** the next meridian id to reveal, or null at semester cap (capstone stays sealed). */
  nextRevealMeridianId: string | null;
}

export type StageNameScheme = 'heavens' | 'forgings' | 'edges';

export interface CultivationPathIdentitySurface {
  pathId: CultivationPath | null;
  pathLabel: string;
  signatureMeridianId: string | null;
  signatureMeridianLabel: string | null;
  /** TOKEN id, e.g. 'path.heaven.accent' — NEVER hex. */
  accentTokenId: string;
  glyphId: string;
  stageNameScheme: StageNameScheme;
  summaryLine: string;
}

export interface MeridianRevealResult {
  meridianId: string;
  label: string;
  effectLine: string;
  pathId: CultivationPath;
}

interface PathMeridianRosterEntry {
  meridianId: string;
  /** authored unlockRealm (1..7). slot N reveals when realmIndex+1 >= N. */
  slot: number;
  label: string;
  effectLine: string;
}

/**
 * Ordered roster per path, slots 1..7. label = path_meridians.json `name`; effectLine =
 * path_meridians.json `pathEffect`. Contract-locked to the content pack.
 */
const PATH_MERIDIAN_ROSTER: Record<CultivationPath, PathMeridianRosterEntry[]> = {
  heaven: [
    { meridianId: 'heaven_spirit_sense', slot: 1, label: 'Spirit Sense', effectLine: 'See hidden; range' },
    { meridianId: 'heaven_mind_eye', slot: 2, label: 'Mind Eye', effectLine: 'Reveal weaknesses; anti-ambush' },
    { meridianId: 'heaven_soul_clarity', slot: 3, label: 'Soul Clarity', effectLine: 'Cleanse debuffs; steady cast' },
    { meridianId: 'heaven_dao_heart', slot: 4, label: 'Dao Heart', effectLine: 'Unshakeable; cheaper techniques' },
    { meridianId: 'heaven_void_gaze', slot: 5, label: 'Void Gaze', effectLine: 'See through stealth / illusion' },
    { meridianId: 'heaven_heavenly_mandate', slot: 6, label: 'Heavenly Mandate', effectLine: 'Domain weakens enemies in range' },
    { meridianId: 'heaven_dao_firmament', slot: 7, label: 'Heaven Dao · Firmament', effectLine: 'Law-based devastation' },
  ],
  earth: [
    { meridianId: 'earth_body_temper', slot: 1, label: 'Body Temper', effectLine: 'Body-cultivation attack scaling' },
    { meridianId: 'earth_bone_forging', slot: 2, label: 'Bone Forging', effectLine: 'Weapon-block; structure' },
    { meridianId: 'earth_marrow_essence', slot: 3, label: 'Marrow Essence', effectLine: 'Body stores qi; longevity' },
    { meridianId: 'earth_root_depth', slot: 4, label: 'Root Depth', effectLine: 'Cannot be displaced while rooted' },
    { meridianId: 'earth_iron_skin', slot: 5, label: 'Iron Skin', effectLine: 'Hits below a threshold deal 0' },
    { meridianId: 'earth_mountain_stance', slot: 6, label: 'Mountain Stance', effectLine: 'Anchor allies; reflect a % of Def' },
    { meridianId: 'earth_dao_sovereign', slot: 7, label: 'Earth Dao · Sovereign', effectLine: 'Body becomes a treasure' },
  ],
  martial: [
    { meridianId: 'martial_weapon_intent', slot: 1, label: 'Weapon Intent', effectLine: 'Empowers weapon arts' },
    { meridianId: 'martial_flowing_step', slot: 2, label: 'Flowing Step', effectLine: 'Travel speed; escape chance' },
    { meridianId: 'martial_battle_rhythm', slot: 3, label: 'Battle Rhythm', effectLine: 'Combo windows widen' },
    { meridianId: 'martial_killing_intent', slot: 4, label: 'Killing Intent', effectLine: 'Intimidation; flee chance on weaker foes' },
    { meridianId: 'martial_sword_heart', slot: 5, label: 'Sword Heart', effectLine: 'Crits ignore a % of defense' },
    { meridianId: 'martial_unbroken_momentum', slot: 6, label: 'Unbroken Momentum', effectLine: 'Each attacking turn stacks damage' },
    { meridianId: 'martial_dao_asura', slot: 7, label: 'Martial Dao · Asura', effectLine: 'Path tribulation becomes a duel' },
  ],
};

interface PathIdentityDef {
  pathLabel: string;
  signatureMeridianId: string;
  accentTokenId: string;
  glyphId: string;
  stageNameScheme: StageNameScheme;
  summaryLine: string;
}

/** Path-identity facts (D5 Parts 5/7, Codex §0.15 / packet §G). signatureMeridianId must be a
 *  member of that path's roster (asserted by contract). Concrete xianxia register only — no
 *  Dao-Mandate / Omen / Proof / Source vocabulary. */
const PATH_IDENTITY: Record<CultivationPath, PathIdentityDef> = {
  heaven: {
    pathLabel: 'Heaven',
    signatureMeridianId: 'heaven_void_gaze',
    accentTokenId: 'path.heaven.accent',
    glyphId: 'glyph.heaven',
    stageNameScheme: 'heavens',
    summaryLine: 'Become the heavens — far sight, drifting qi, and law turned against the foe.',
  },
  earth: {
    pathLabel: 'Earth',
    signatureMeridianId: 'earth_iron_skin',
    accentTokenId: 'path.earth.accent',
    glyphId: 'glyph.earth',
    stageNameScheme: 'forgings',
    summaryLine: 'Outlast the heavens — tempered body, deep roots, a frame that turns blades.',
  },
  martial: {
    pathLabel: 'Martial',
    signatureMeridianId: 'martial_sword_heart',
    accentTokenId: 'path.martial.accent',
    glyphId: 'glyph.martial',
    stageNameScheme: 'edges',
    summaryLine: 'Defy the heavens by hand — surging qi, the will to cut, power made from nothing.',
  },
};

/** The highest meridian slot reachable in the live realm slice. 6 realms ⇒ realmIndex+1 ≤ 6,
 *  so slots 1..6 reveal across a run and slot 7 (the capstone) stays sealed (B.5 / Guard #6).
 *  Derived from the live projection so it can never drift to a hardcoded 7. */
const MAX_REVEALABLE_SLOT = getOrderedLiveRealms().length;

export function isCultivationPath(value: string | null | undefined): value is CultivationPath {
  return value === 'heaven' || value === 'earth' || value === 'martial';
}

/** The path's ordered roster (read-only). Empty for a null path. */
export function getPathMeridianRoster(path: CultivationPath | null): readonly PathMeridianRosterEntry[] {
  return path ? PATH_MERIDIAN_ROSTER[path] : [];
}

/**
 * Sub-objective C — resolve the path identity. Soul-side (D13): reads the persisted path
 * selection, survives reincarnation. Null path ⇒ the idle 'No Path selected' identity.
 */
export function resolveCultivationPathIdentity(path: CultivationPath | null): CultivationPathIdentitySurface {
  if (!isCultivationPath(path)) {
    return {
      pathId: null,
      pathLabel: 'No Path selected',
      signatureMeridianId: null,
      signatureMeridianLabel: null,
      accentTokenId: 'path.none.accent',
      glyphId: 'glyph.none',
      stageNameScheme: 'heavens',
      summaryLine: 'Choose a path to begin a life of cultivation.',
    };
  }
  const def = PATH_IDENTITY[path];
  const signature = PATH_MERIDIAN_ROSTER[path].find((entry) => entry.meridianId === def.signatureMeridianId) ?? null;
  return {
    pathId: path,
    pathLabel: def.pathLabel,
    signatureMeridianId: def.signatureMeridianId,
    signatureMeridianLabel: signature?.label ?? null,
    accentTokenId: def.accentTokenId,
    glyphId: def.glyphId,
    stageNameScheme: def.stageNameScheme,
    summaryLine: def.summaryLine,
  };
}

/**
 * Sub-objective B — the drip column. Tri-state derived purely from realm.index (no persisted
 * set — §I): the highest revealed slip is 'unlocked-bright', lower revealed slips relax to
 * 'idle-dim', unrevealed slips are 'sealed-future'. The capstone (slot 7) is unreachable in
 * the live slice, so it never becomes next-to-unlock.
 */
export function resolvePathMeridianDrip(path: CultivationPath | null, realmIndex: number): MeridianDripSurface {
  const roster = getPathMeridianRoster(path);
  if (!isCultivationPath(path) || roster.length === 0) {
    return { pathId: null, slips: [], unlockedCount: 0, nextRevealMeridianId: null };
  }
  const realmIndex1to7 = Math.max(0, Math.floor(realmIndex)) + 1;
  const revealedSlots = roster.filter((entry) => isMeridianUnlocked(entry.slot, realmIndex1to7)).map((entry) => entry.slot);
  const highestRevealedSlot = revealedSlots.length > 0 ? Math.max(...revealedSlots) : 0;

  // The single next-to-unlock slip: lowest unrevealed slot that is still reachable (≤ cap).
  const nextEntry = roster.find(
    (entry) => !isMeridianUnlocked(entry.slot, realmIndex1to7) && entry.slot <= MAX_REVEALABLE_SLOT,
  );

  const slips: MeridianDripSlip[] = roster.map((entry) => {
    const revealed = isMeridianUnlocked(entry.slot, realmIndex1to7);
    const state: MeridianDripState = revealed
      ? entry.slot === highestRevealedSlot
        ? 'unlocked-bright'
        : 'idle-dim'
      : 'sealed-future';
    return {
      meridianId: entry.meridianId,
      slot: entry.slot,
      label: entry.label,
      effectLine: entry.effectLine,
      state,
      isNextToUnlock: nextEntry?.meridianId === entry.meridianId,
      revealedAtRealmIndex: revealed ? entry.slot - 1 : null,
    };
  });

  return {
    pathId: path,
    slips,
    unlockedCount: revealedSlots.length,
    nextRevealMeridianId: nextEntry?.meridianId ?? null,
  };
}

/**
 * Sub-objective B — the reveal event. Given a successful MAJOR breakthrough to newRealmIndex
 * (0-based), return the single meridian newly revealed at that realm (the slip whose
 * unlockRealm == newRealmIndex + 1), or null when no roster entry / capstone-beyond-cap / no
 * path. Additive and never throws (§K.2): a missing entry degrades to 'reveal nothing'.
 */
export function revealNextPathMeridian(path: CultivationPath | null, newRealmIndex: number): MeridianRevealResult | null {
  if (!isCultivationPath(path)) return null;
  const slot = Math.floor(newRealmIndex) + 1;
  if (slot < 1 || slot > MAX_REVEALABLE_SLOT) return null; // capstone (slot 7) never reveals in the live slice
  const entry = PATH_MERIDIAN_ROSTER[path].find((candidate) => candidate.slot === slot);
  if (!entry) return null;
  return { meridianId: entry.meridianId, label: entry.label, effectLine: entry.effectLine, pathId: path };
}
