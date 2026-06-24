import type { TrainingReadOnlySnapshot } from '../training/trainingReadOnlySnapshot.js';

export interface EquipmentHandlingTemperAffix {
  id: string;
  label: string;
  stat: 'atkPct' | 'defPct' | 'hpPct' | 'critPct' | 'dodgePct';
  valuePct: number;
}

export interface EquipmentHandlingInput {
  trainingSnapshot?: TrainingReadOnlySnapshot | null;
  // [handling: migrate equipmentHandling input to the 5-slot loadout when it becomes the equip path]
  // The active gates below read the LEGACY 2-slot equip state (equippedWeaponId/equippedAccessoryId, +
  // accessory refine/temper via hasDefensiveAccessorySignal). This is a TRAINING-magnitude multiply on
  // atk/def/maxHp (combatStore.ts:536-538) — orthogonal to composeGear's forge magnitude, NOT a double-count.
  // But it shares the EQUIPPED-STATE input: when the M.III.1 5-slot loadout becomes the equip path, this
  // resolver will read empty legacy ids and silently go inactive for new-model gear (armor harmony / artifact
  // attunement stop firing). Live seam for Movement V (combat) — migrate the input to the loadout then.
  equipment: {
    equippedWeaponId: string | null;
    equippedAccessoryId: string | null;
    refineLevelBySlot: { weapon: number; accessory: number };
    temperBonusesBySlot: Record<'weapon' | 'accessory', EquipmentHandlingTemperAffix[]>;
  };
}

export interface EquipmentHandlingRow {
  id: 'weapon' | 'armor' | 'artifact';
  label: string;
  statId: 'weapon_bond' | 'armor_harmony' | 'artifact_attunement';
  rating: number;
  active: boolean;
  effectBonusPct: number;
  capPct: number;
  detail: string;
}

export interface EquipmentHandlingSnapshot {
  weapon: EquipmentHandlingRow;
  armor: EquipmentHandlingRow;
  artifact: EquipmentHandlingRow;
  statMultipliers: {
    atk: number;
    def: number;
    maxHp: number;
    talisman: number;
  };
  rows: EquipmentHandlingRow[];
}

function rating(snapshot: TrainingReadOnlySnapshot | null | undefined, statId: string): number {
  return Math.max(0, snapshot?.pathStats.find((row) => row.statId === statId)?.rating ?? 0);
}

function capPct(value: number, cap: number): number {
  return Math.round(Math.min(cap, Math.max(0, value)) * 10) / 10;
}

function multiplier(effectBonusPct: number): number {
  return Math.round((1 + effectBonusPct / 100) * 1000) / 1000;
}

function hasDefensiveAccessorySignal(input: EquipmentHandlingInput['equipment']): boolean {
  if (!input.equippedAccessoryId) return false;
  if ((input.refineLevelBySlot.accessory ?? 0) > 0) return true;
  return (input.temperBonusesBySlot.accessory ?? []).some((affix) => affix.stat === 'defPct' || affix.stat === 'hpPct');
}

function row(args: {
  id: EquipmentHandlingRow['id'];
  label: string;
  statId: EquipmentHandlingRow['statId'];
  rating: number;
  active: boolean;
  perRatingPct: number;
  capPct: number;
}): EquipmentHandlingRow {
  const effectBonusPct = args.active ? capPct(args.rating * args.perRatingPct, args.capPct) : 0;
  return {
    id: args.id,
    label: args.label,
    statId: args.statId,
    rating: args.rating,
    active: args.active,
    effectBonusPct,
    capPct: args.capPct,
    detail: args.active
      ? `${args.statId} adds ${effectBonusPct.toFixed(1)}% handling, capped at ${args.capPct}%.`
      : `${args.label} handling inactive for the current gear slot state.`,
  };
}

export function resolveEquipmentHandlingSnapshot(input: EquipmentHandlingInput): EquipmentHandlingSnapshot {
  const weapon = row({
    id: 'weapon',
    label: 'Weapon Bond',
    statId: 'weapon_bond',
    rating: rating(input.trainingSnapshot, 'weapon_bond'),
    active: Boolean(input.equipment.equippedWeaponId),
    perRatingPct: 0.12,
    capPct: 14,
  });
  const armor = row({
    id: 'armor',
    label: 'Armor Harmony',
    statId: 'armor_harmony',
    rating: rating(input.trainingSnapshot, 'armor_harmony'),
    active: hasDefensiveAccessorySignal(input.equipment),
    perRatingPct: 0.14,
    capPct: 18,
  });
  const artifact = row({
    id: 'artifact',
    label: 'Artifact Attunement',
    statId: 'artifact_attunement',
    rating: rating(input.trainingSnapshot, 'artifact_attunement'),
    active: Boolean(input.equipment.equippedAccessoryId),
    perRatingPct: 0.12,
    capPct: 14,
  });

  return {
    weapon,
    armor,
    artifact,
    statMultipliers: {
      atk: multiplier(weapon.effectBonusPct),
      def: multiplier(armor.effectBonusPct),
      maxHp: multiplier(armor.effectBonusPct),
      talisman: multiplier(artifact.effectBonusPct),
    },
    rows: [weapon, armor, artifact],
  };
}
