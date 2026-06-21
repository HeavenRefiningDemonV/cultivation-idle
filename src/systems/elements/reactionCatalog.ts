/**
 * F3-ELEM — the 33-reaction catalog (D3 §5.3 / Appendix B), authored in resolution-priority order
 * (cleanse → control → sever → shred → burst → spread → dot → drain → tempo → catalyst, D3 §5.6).
 * Priority is DATA on the record (familyPriority), never a magic number in a branch. Every magnitude /
 * ICD is a D15 deposit; F3 fixes only the trigger shape, the family, the priority, and the seal/a11y
 * metadata. The marquee reactions get prose treatment in D3 §5.4.
 */
import type { ReactionDef, ReactionFamily, SealShape } from './elementTypes.js';

/** D3 §5.6 priority order, 1 = resolves first. Data, so D15/D11 may retune within the fixed shape. */
export const FAMILY_PRIORITY: Readonly<Record<ReactionFamily, number>> = Object.freeze({
  cleanse: 1, control: 2, sever: 3, shred: 4, burst: 5,
  spread: 6, dot: 7, drain: 8, tempo: 9, catalyst: 10,
});

/** D3 Appendix F.2 — the 10 family seal silhouettes (shape carrier, never colour). */
export const SEAL_SHAPE_BY_FAMILY: Readonly<Record<ReactionFamily, SealShape>> = Object.freeze({
  cleanse: '净', control: '封', sever: '斩', shred: '裂', burst: '爆',
  spread: '蔓', dot: '蚀', drain: '吸', tempo: '速', catalyst: '引',
});

function deepFreeze<T>(table: readonly T[]): readonly T[] {
  for (const row of table) Object.freeze(row);
  return Object.freeze(table);
}

/** The 33 reactions, in priority order. Family tally: cleanse 2 · control 5 · sever 4 · shred 4 ·
 *  burst 4 · spread 4 · dot 5 · drain 2 · tempo 2 · catalyst 1 = 33. */
export const REACTION_CATALOG: readonly ReactionDef[] = deepFreeze<ReactionDef>([
  // ── Cleanse (priority 1) ──
  { id: 'purge', hanzi: '净化', label: 'Purge', family: 'cleanse', familyPriority: 1, trigger: { element: 'light', keyedCategory: 'dot' }, consumesState: true, requiresFullIntensity: false, effectKind: 'cleanse', sealShape: '净', domText: 'Purge — Light removes damage-over-time and debuffs by category.', hasIcd: true },
  { id: 'disperse', hanzi: '驱散', label: 'Disperse', family: 'cleanse', familyPriority: 1, trigger: { element: 'wind', keyedCategory: 'mark' }, consumesState: true, requiresFullIntensity: false, effectKind: 'cleanse', sealShape: '净', domText: 'Disperse — Wind blows away a lighter, spreadable affliction.', hasIcd: true },

  // ── Control (priority 2) ──
  { id: 'freeze', hanzi: '冰封', label: 'Freeze', family: 'control', familyPriority: 2, trigger: { element: 'ice', keyedState: 'soaked' }, consumesState: true, requiresFullIntensity: false, effectKind: 'control', sealShape: '封', domText: 'Freeze — Ice on a Soaked target escalates straight to Frozen, a hard lock.', hasIcd: true },
  { id: 'entomb', hanzi: '土葬', label: 'Entomb', family: 'control', familyPriority: 2, trigger: { element: 'earth', keyedState: 'weighted' }, consumesState: true, requiresFullIntensity: true, effectKind: 'control', sealShape: '封', domText: 'Entomb — Earth on a fully Weighted target petrifies it, a stone lock.', hasIcd: true },
  { id: 'brambleSnare', hanzi: '木缚', label: 'Bramble Snare', family: 'control', familyPriority: 2, trigger: { element: 'wood', keyedState: 'slowed' }, consumesState: false, requiresFullIntensity: false, effectKind: 'control', sealShape: '封', domText: 'Bramble Snare — Wood roots a slowed target in place.', hasIcd: true },
  { id: 'gravityWell', hanzi: '引力陷', label: 'Gravity Well', family: 'control', familyPriority: 2, trigger: { element: 'astral', keyedState: 'gravityBound' }, consumesState: false, requiresFullIntensity: false, effectKind: 'control', sealShape: '封', domText: 'Gravity Well — Astral clumps a group together and strips evasion.', hasIcd: true },
  { id: 'stasis', hanzi: '时止', label: 'Stasis', family: 'control', familyPriority: 2, trigger: { element: 'time', keyedCategory: 'control' }, consumesState: false, requiresFullIntensity: false, effectKind: 'control', sealShape: '封', domText: 'Stasis — Time on a controlled target imposes a brief total lock.', hasIcd: true },

  // ── Sever / True (priority 3) ──
  { id: 'severance', hanzi: '魂断', label: 'Severance', family: 'sever', familyPriority: 3, trigger: { element: 'soul', keyedState: 'voided' }, consumesState: true, requiresFullIntensity: false, effectKind: 'sever', sealShape: '斩', domText: 'Severance — Soul on a Voided target severs spirit from body, bypassing physical defence.', hasIcd: true },
  { id: 'unmake', hanzi: '湮灭', label: 'Unmake', family: 'sever', familyPriority: 3, trigger: { element: 'void', keyedState: 'voided' }, consumesState: true, requiresFullIntensity: true, effectKind: 'sever', sealShape: '斩', domText: 'Unmake — Void at apex on a Voided target deals capped true damage that ignores resistance.', hasIcd: true },
  { id: 'eclipse', hanzi: '蚀', label: 'Eclipse', family: 'sever', familyPriority: 3, trigger: { element: 'light', keyedState: 'cursed' }, consumesState: true, requiresFullIntensity: false, effectKind: 'cleanse', sealShape: '斩', domText: 'Eclipse — Light meeting Shadow strips all buffs and debuffs from the target.', hasIcd: true },
  { id: 'paradox', hanzi: '悖', label: 'Paradox', family: 'sever', familyPriority: 3, trigger: { element: 'time', keyedState: 'gravityBound' }, consumesState: false, requiresFullIntensity: false, effectKind: 'control', sealShape: '斩', domText: 'Paradox — Time meeting Astral on one target erupts in a fate-versus-entropy disruption.', hasIcd: true },

  // ── Shred (priority 4) ──
  { id: 'corrode', hanzi: '锈蚀', label: 'Corrode', family: 'shred', familyPriority: 4, trigger: { element: 'metal', keyedState: 'rent' }, consumesState: false, requiresFullIntensity: false, effectKind: 'shred', sealShape: '裂', domText: 'Corrode — Metal on a Rent target strips its armour further.', hasIcd: true },
  { id: 'superconduct', hanzi: '超导', label: 'Superconduct', family: 'shred', familyPriority: 4, trigger: { element: 'lightning', keyedState: 'frozen' }, consumesState: true, requiresFullIntensity: false, effectKind: 'shred', sealShape: '裂', domText: 'Superconduct — Thunder on a Frozen target shatters its physical resistance.', hasIcd: true },
  { id: 'erosion', hanzi: '风蚀', label: 'Erosion', family: 'shred', familyPriority: 4, trigger: { element: 'wind', keyedState: 'sundered' }, consumesState: false, requiresFullIntensity: false, effectKind: 'shred', sealShape: '裂', domText: 'Erosion — Wind on a Sundered target strips and spreads defence reduction.', hasIcd: true },
  { id: 'unmakingTouch', hanzi: '虚蚀', label: 'Unmaking Touch', family: 'shred', familyPriority: 4, trigger: { element: 'void', keyedState: 'voided' }, consumesState: false, requiresFullIntensity: false, effectKind: 'shred', sealShape: '裂', domText: 'Unmaking Touch — Void on a Voided target continuously lowers all resistances (no internal cooldown).', hasIcd: false },

  // ── Burst (priority 5) ──
  { id: 'thermalShock', hanzi: '炎裂', label: 'Thermal Shock', family: 'burst', familyPriority: 5, trigger: { element: 'fire', keyedState: 'frozen' }, consumesState: true, requiresFullIntensity: false, effectKind: 'burst', sealShape: '爆', domText: 'Thermal Shock — Fire on a Frozen target erupts in a capped temperature-clash burst.', hasIcd: true },
  { id: 'overload', hanzi: '雷爆', label: 'Overload', family: 'burst', familyPriority: 5, trigger: { element: 'fire', keyedState: 'shocked' }, consumesState: true, requiresFullIntensity: false, effectKind: 'burst', sealShape: '爆', domText: 'Overload — Fire on a Shocked target erupts in a capped energy burst.', hasIcd: true },
  { id: 'steamBurst', hanzi: '蒸爆', label: 'Steam Burst', family: 'burst', familyPriority: 5, trigger: { element: 'fire', keyedState: 'soaked' }, consumesState: true, requiresFullIntensity: false, effectKind: 'burst', sealShape: '爆', domText: 'Steam Burst — Fire on a Soaked target flashes to scalding steam, bursting and clouding accuracy.', hasIcd: true },
  { id: 'detonation', hanzi: '引爆', label: 'Detonation', family: 'burst', familyPriority: 5, trigger: { element: 'fire', keyedCategory: 'dot' }, consumesState: true, requiresFullIntensity: false, effectKind: 'burst', sealShape: '爆', domText: 'Detonation — a detonator element consumes a damage-over-time for an immediate capped burst.', hasIcd: true },

  // ── Spread (priority 6) ──
  { id: 'wildfire', hanzi: '燎原', label: 'Wildfire', family: 'spread', familyPriority: 6, trigger: { element: 'fire', keyedState: 'burning' }, consumesState: false, requiresFullIntensity: false, effectKind: 'spread', sealShape: '蔓', domText: 'Wildfire — Fire on a Burning target in a group leaps the flame to nearby enemies.', hasIcd: true },
  { id: 'conduction', hanzi: '导电', label: 'Conduction', family: 'spread', familyPriority: 6, trigger: { element: 'lightning', keyedState: 'soaked' }, consumesState: false, requiresFullIntensity: false, effectKind: 'spread', sealShape: '蔓', domText: 'Conduction — Thunder on a Soaked target chains the shock to nearby enemies and hits harder.', hasIcd: true },
  { id: 'miasmaBloom', hanzi: '瘴生', label: 'Miasma Bloom', family: 'spread', familyPriority: 6, trigger: { element: 'water', keyedState: 'rotting' }, consumesState: false, requiresFullIntensity: false, effectKind: 'spread', sealShape: '蔓', domText: 'Miasma Bloom — Water on a Rotting target spreads the rot and a healing cut to a group.', hasIcd: true },
  { id: 'galeScatter', hanzi: '风散', label: 'Gale Scatter', family: 'spread', familyPriority: 6, trigger: { element: 'wind', keyedState: 'sundered' }, consumesState: false, requiresFullIntensity: false, effectKind: 'spread', sealShape: '蔓', domText: 'Gale Scatter — Wind scatters a spreadable state across a group, the universal spreader.', hasIcd: true },

  // ── DoT (priority 7) ──
  { id: 'combustion', hanzi: '燃烧', label: 'Combustion', family: 'dot', familyPriority: 7, trigger: { element: 'fire', keyedState: 'burning' }, consumesState: false, requiresFullIntensity: false, effectKind: 'dot', sealShape: '蚀', domText: 'Combustion — Fire applies or refreshes the base Burning damage-over-time.', hasIcd: true },
  { id: 'rot', hanzi: '腐蚀', label: 'Rot', family: 'dot', familyPriority: 7, trigger: { element: 'wood', keyedState: 'rotting' }, consumesState: false, requiresFullIntensity: false, effectKind: 'dot', sealShape: '蚀', domText: 'Rot — Wood applies or refreshes a corrosion damage-over-time that also cuts incoming healing.', hasIcd: true },
  { id: 'hemorrhage', hanzi: '裂创', label: 'Hemorrhage', family: 'dot', familyPriority: 7, trigger: { element: 'metal', keyedState: 'rent' }, consumesState: false, requiresFullIntensity: false, effectKind: 'dot', sealShape: '蚀', domText: 'Hemorrhage — Metal on a Rent target inflicts a heavy bleed that scales with health.', hasIcd: true },
  { id: 'witheringReaction', hanzi: '凋零', label: 'Withering', family: 'dot', familyPriority: 7, trigger: { element: 'time', keyedState: 'withering' }, consumesState: false, requiresFullIntensity: false, effectKind: 'dot', sealShape: '蚀', domText: 'Withering — Time applies or refreshes a ramping damage-over-time that suppresses regeneration.', hasIcd: true },
  { id: 'hex', hanzi: '诅咒', label: 'Hex', family: 'dot', familyPriority: 7, trigger: { element: 'shadow', keyedState: 'cursed' }, consumesState: false, requiresFullIntensity: false, effectKind: 'dot', sealShape: '蚀', domText: 'Hex — Shadow on a Cursed target inflicts a curse damage-over-time and persists the amplification.', hasIcd: true },

  // ── Drain (priority 8) ──
  { id: 'siphon', hanzi: '噬生', label: 'Siphon', family: 'drain', familyPriority: 8, trigger: { element: 'shadow', keyedState: 'cursed' }, consumesState: false, requiresFullIntensity: false, effectKind: 'drain', sealShape: '吸', domText: 'Siphon — Shadow on a Cursed target converts a portion of damage dealt into self-healing.', hasIcd: true },
  { id: 'devour', hanzi: '吞噬', label: 'Devour', family: 'drain', familyPriority: 8, trigger: { element: 'void', keyedState: 'voided' }, consumesState: false, requiresFullIntensity: false, effectKind: 'drain', sealShape: '吸', domText: 'Devour — Void on a Voided caster drains qi and can interrupt a cast.', hasIcd: true },

  // ── Tempo (priority 9) ──
  { id: 'accelerate', hanzi: '疾', label: 'Accelerate', family: 'tempo', familyPriority: 9, trigger: { element: 'time', keyedState: 'hasted' }, consumesState: false, requiresFullIntensity: false, effectKind: 'tempo', sealShape: '速', domText: 'Accelerate — Time grants self or ally extra actions and faster tempo.', hasIcd: true },
  { id: 'slow', hanzi: '缓', label: 'Slow', family: 'tempo', familyPriority: 9, trigger: { element: 'time', keyedState: 'slowed' }, consumesState: false, requiresFullIntensity: false, effectKind: 'tempo', sealShape: '速', domText: 'Slow — Time reduces an enemy’s action frequency.', hasIcd: true },

  // ── Catalyst (priority 10) ──
  { id: 'catalyze', hanzi: '催化', label: 'Catalyze', family: 'catalyst', familyPriority: 10, trigger: { element: 'astral', keyedState: 'catalyzed' }, consumesState: false, requiresFullIntensity: false, effectKind: 'catalyst', sealShape: '引', domText: 'Catalyze — Astral or Light primes the build so the next reaction is amplified.', hasIcd: true },
]);

/** Reaction lookup + catalog index (the final deterministic tie-break, §8). */
export const REACTION_BY_ID = Object.freeze(
  Object.fromEntries(REACTION_CATALOG.map((r) => [r.id, r])),
);
export const REACTION_INDEX: Readonly<Record<string, number>> = Object.freeze(
  Object.fromEntries(REACTION_CATALOG.map((r, i) => [r.id, i])),
);
