/**
 * M.III.1 EQ-MECH / S3 — the LIVE surface builders. PURE over their explicit inputs (same input ⇒ same
 * surface), so they are contract-testable from fixtures with no store mounted; the owning hook reads the
 * S1 state + composeGear output via selectors and passes it in.
 *
 * DISCIPLINE: render-only output (no methods, no store handles); every magnitude is HELD → D15 (affix
 * values render as the honest "+?", set thresholds stay inactive, bond depth is 0); the totals panel is
 * composeGear's output formatted UPSTREAM — the view never recomputes. The slots read the new 5-slot
 * loadout; the totals read composeGear's current (legacy-equip) output — the transitional state the HELD
 * 5-slot-compose seam dictates (see toEquipmentGearInput).
 */

import type { DerivedStatKey } from '../../meridians/derivedStats.js';
import type { GearInstance, GearSlot, ItemDef } from '../../equipment/gearModel.js';
import type { Loadout } from '../../equipment/gearLoadout.js';
import { accessorySlotCount, resolveSetBonus } from '../../equipment/gearLoadout.js';
import {
  ITEM_DETAIL_SCHEMA_VERSION,
  type ItemDetailRarity,
  type ItemDetailSurfaceV1,
  type ItemDetailVisualState,
} from '../modals/itemDetailTypes.js';
import {
  PANOPLY_EXACT_SCHEMA_VERSION,
  VAULT_EXACT_SCHEMA_VERSION,
  type EquipmentExactVisualState,
  type GearElementEdge,
  type GearTotalsRow,
  type GearTotalsSurface,
  type PanoplyExactSurfaceV1,
  type PanoplyItemSummary,
  type PanoplyPathLean,
  type PanoplySlotKind,
  type PanoplySlotSurface,
  type SetBonusBandSurface,
  type VaultExactSurfaceV1,
  type VaultGradeFilter,
  type VaultSlipSurface,
  type VaultSlotFilter,
  type VaultSortBy,
  type VaultSortDir,
} from './equipmentExactTypes.js';
import {
  channelGroup,
  channelLabel,
  gearRarityToDetailRarity,
  multiplierAddText,
  multiplierTone,
  rarityFrameGrade,
  rarityLabel,
  setIdLabel,
  tierMark,
} from './equipmentItemLanguage.js';
import { arrangeVaultInstances, type GetDef } from './vaultSortFilter.js';

const capitalize = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function elementEdge(instance: GearInstance): GearElementEdge | null {
  const payload = instance.elementPayload;
  if (!payload) return null; // HELD — element payloads are null until D3 deposits them
  return { id: payload, label: capitalize(payload), sceneColorToken: `--element-${payload}` };
}

function slotOfInstance(instance: GearInstance, getDef: GetDef): GearSlot {
  return getDef(instance.defId)?.gearSlot ?? instance.equippedSlot ?? 'accessory';
}

// ── the per-instance F2 inspector mapper ──────────────────────────────────────────────────────────

export interface ItemDetailMapInput {
  instance: GearInstance;
  def: ItemDef | undefined;
  equipped: boolean;
  path?: PanoplyPathLean;
}

export function toItemDetailSurface(input: ItemDetailMapInput): ItemDetailSurfaceV1 {
  const { instance, def, equipped, path } = input;
  const rarity: ItemDetailRarity = gearRarityToDetailRarity(instance.rarity);
  const name = def?.name ?? instance.defId;
  const slot = def?.gearSlot ?? instance.equippedSlot ?? null;
  const edge = elementEdge(instance);
  const isLegendary = rarity === 'legendary';

  const visualState: ItemDetailVisualState = isLegendary
    ? 'item-legendary'
    : def?.setId
      ? 'item-in-set'
      : equipped
        ? 'item-equippable'
        : 'item-common';

  const bondable = def?.weaponBondable === true && path === 'martial';

  return {
    schemaVersion: ITEM_DETAIL_SCHEMA_VERSION,
    visualState,
    identity: {
      name,
      nameCjk: null,
      variant: 'item',
      tier: instance.itemTier ?? null,
      realmTier: null,
      rarity,
      rarityLabel: rarityLabel(rarity),
      rarityBand: null, // HELD — the affix-band/multiplier line is D15/F-BAL
      element: edge ? { id: edge.id, label: edge.label, sceneColorToken: edge.sceneColorToken } : null,
      kind: slot,
      slot,
      lean: path ? capitalize(path) : null,
    },
    affixes: instance.affixes.map((affix) => ({
      name: channelLabel(affix.channel),
      channel: channelLabel(affix.channel),
      value: '+?', // HELD — valuePct is D15/F-BAL; the inspector shows the FACT of the affix, not the number
      kind: affix.latent ? 'bond' : 'prefix',
    })),
    setBond:
      def?.setId || bondable
        ? {
            ...(def?.setId
              ? { set: { name: setIdLabel(def.setId), held: 1, total: 1, activeBonuses: [], latentBonuses: ['Set thresholds held (D15)'] } }
              : {}),
            ...(bondable ? { bond: { level: 0, perks: ['Weapon bond — depth held (D5/D11)'] } } : {}),
          }
        : null,
    compareVsEquipped: null, // HELD — no live compare baseline yet
    lore: def?.description ?? null,
    provenance: null,
    actions: [
      equipped
        ? { verb: 'Unequip', enabled: true, route: 'equipment.unequip' }
        : { verb: 'Equip', enabled: true, route: 'equipment.equip' },
      { verb: 'Dismantle', enabled: true, route: 'vault.dismantle', confirm: { prompt: `Dismantle ${name}? (yield held — D15)` } },
    ],
    signature: isLegendary ? { name: `${name} — signature held`, body: 'Legendary signature mechanic — D15.' } : null,
  };
}

// ── the Panoply (worn figure) builder ─────────────────────────────────────────────────────────────

export interface PanoplyBuildInput {
  loadout: Loadout;
  getDef: GetDef;
  /** composeGear's output dict, read directly — the totals panel never recomputes. */
  gearTotals: Partial<Record<DerivedStatKey, number>>;
  path: PanoplyPathLean;
  realm: number;
  selectedInstanceId?: string | null;
}

const SINGULAR_SLOTS: readonly Exclude<PanoplySlotKind, 'accessory'>[] = ['weapon', 'head', 'chest', 'legs'];
const MOUNT_LABEL: Record<PanoplySlotKind, string> = {
  weapon: 'Weapon',
  head: 'Head',
  chest: 'Chest',
  legs: 'Legs',
  accessory: 'Accessory',
};

function toItemSummary(instance: GearInstance, def: ItemDef | undefined): PanoplyItemSummary {
  const rarity = gearRarityToDetailRarity(instance.rarity);
  return {
    instanceId: instance.instanceId,
    name: def?.name ?? instance.defId,
    nameCjk: null,
    tierMark: tierMark(instance.itemTier),
    rarity,
    rarityLabel: rarityLabel(rarity),
    rarityFrameGrade: rarityFrameGrade(rarity),
    element: elementEdge(instance),
    affixCount: instance.affixes.length,
    capped: null, // HELD — the tier-gap cap FACT/penalty is D6/D15
  };
}

function buildTotals(gearTotals: Partial<Record<DerivedStatKey, number>>): GearTotalsSurface {
  const totals: GearTotalsSurface = { offense: [], defense: [], utility: [] };
  for (const key of Object.keys(gearTotals) as DerivedStatKey[]) {
    const value = gearTotals[key];
    if (value === undefined) continue;
    const row: GearTotalsRow = {
      channel: key,
      label: channelLabel(key),
      addText: multiplierAddText(value),
      tone: multiplierTone(value),
    };
    totals[channelGroup(key)].push(row);
  }
  return totals;
}

export function buildPanoplyExactSurface(input: PanoplyBuildInput): PanoplyExactSurfaceV1 {
  const { loadout, getDef, gearTotals, path, realm, selectedInstanceId } = input;

  const worn: GearInstance[] = [
    loadout.weapon, loadout.head, loadout.chest, loadout.legs, ...loadout.accessories,
  ].filter((entry): entry is GearInstance => entry !== null);

  const singular: PanoplySlotSurface[] = SINGULAR_SLOTS.map((slot) => {
    const instance = loadout[slot];
    return {
      slot,
      filled: instance !== null,
      item: instance ? toItemSummary(instance, getDef(instance.defId)) : null,
      mountLabel: MOUNT_LABEL[slot],
      locked: null,
    };
  });
  const accessoryCount = Math.max(accessorySlotCount(realm), loadout.accessories.length);
  const accessorySlots: PanoplySlotSurface[] = [];
  for (let i = 0; i < accessoryCount; i += 1) {
    const instance = loadout.accessories[i] ?? null;
    accessorySlots.push({
      slot: 'accessory',
      filled: instance !== null,
      item: instance ? toItemSummary(instance, getDef(instance.defId)) : null,
      mountLabel: MOUNT_LABEL.accessory,
      locked: null,
    });
  }
  const slots = [...singular, ...accessorySlots];

  const wornDefs = worn
    .map((instance) => getDef(instance.defId))
    .filter((def): def is ItemDef => def !== undefined);
  const setBonuses: SetBonusBandSurface[] = resolveSetBonus(wornDefs).map((bonus) => ({
    setId: bonus.setId,
    name: setIdLabel(bonus.setId),
    held: bonus.count,
    total: bonus.count, // HELD — the full-bond piece count is D15
    activeTier: bonus.activeTier, // null while thresholds HELD — honestly inactive
    effectText: `${setIdLabel(bonus.setId)} — set thresholds held (D15)`,
  }));

  const weapon = loadout.weapon;
  const weaponDef = weapon ? getDef(weapon.defId) : undefined;
  const bond =
    weapon && weaponDef?.weaponBondable === true && path === 'martial'
      ? {
          level: 0,
          max: null,
          xpSources: ['Combat victories (held — D5/D11)'],
          latentAffixes: ['Latent affixes unlock with bond depth (held)'],
          weaponArts: ['Weapon arts (held)'],
        }
      : null;

  const selected = selectedInstanceId ? worn.find((entry) => entry.instanceId === selectedInstanceId) ?? null : null;
  const selectedDetail = selected
    ? toItemDetailSurface({ instance: selected, def: getDef(selected.defId), equipped: true, path })
    : null;

  const edges = worn.map(elementEdge).filter((edge): edge is GearElementEdge => edge !== null);
  const elementLean = edges.length
    ? {
        entries: edges.map((edge) => ({
          element: edge.id,
          label: edge.label,
          weight: 0, // HELD — the affinity weight is D4/D15
          sceneColorToken: edge.sceneColorToken,
        })),
      }
    : null;

  let visualState: EquipmentExactVisualState;
  if (selectedDetail) {
    visualState = selectedDetail.identity?.rarity === 'legendary' ? 'detail-legendary' : 'detail-affix';
  } else if (worn.length === 0) {
    visualState = 'empty';
  } else {
    visualState = 'healthy';
  }

  return {
    schemaVersion: PANOPLY_EXACT_SCHEMA_VERSION,
    visualState,
    pathLean: path,
    slots,
    setBonuses,
    bond,
    totals: buildTotals(gearTotals),
    elementLean,
    selectedDetail,
  };
}

// ── the Vault (held instances) builder ────────────────────────────────────────────────────────────

export interface VaultBuildInput {
  gearInstances: Record<string, GearInstance>;
  getDef: GetDef;
  loadout: Loadout;
  filter: { slot: VaultSlotFilter; grade: VaultGradeFilter };
  sort: { by: VaultSortBy; dir: VaultSortDir };
  selectedInstanceId?: string | null;
  newInstanceIds?: ReadonlySet<string>;
}

const EMPTY_RARITY_COUNTS = (): Record<ItemDetailRarity, number> => ({
  common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0,
});

export function buildVaultExactSurface(input: VaultBuildInput): VaultExactSurfaceV1 {
  const { gearInstances, getDef, loadout, filter, sort, selectedInstanceId, newInstanceIds } = input;
  const all = Object.values(gearInstances);

  const equippedIds = new Set<string>(
    [loadout.weapon, loadout.head, loadout.chest, loadout.legs, ...loadout.accessories]
      .filter((entry): entry is GearInstance => entry !== null)
      .map((entry) => entry.instanceId),
  );

  const arranged = arrangeVaultInstances(all, getDef, filter, sort);
  const slips: VaultSlipSurface[] = arranged.map((instance) => {
    const def = getDef(instance.defId);
    const rarity = gearRarityToDetailRarity(instance.rarity);
    return {
      instanceId: instance.instanceId,
      name: def?.name ?? instance.defId,
      glyphId: def?.id ?? instance.defId,
      slot: slotOfInstance(instance, getDef),
      tierMark: tierMark(instance.itemTier),
      rarity,
      rarityLabel: rarityLabel(rarity),
      rarityFrameGrade: rarityFrameGrade(rarity),
      element: elementEdge(instance),
      affixCount: instance.affixes.length,
      isEquipped: equippedIds.has(instance.instanceId),
      isNew: newInstanceIds?.has(instance.instanceId) ?? false,
    };
  });

  const byRarity = EMPTY_RARITY_COUNTS();
  for (const instance of all) byRarity[gearRarityToDetailRarity(instance.rarity)] += 1;

  const selected = selectedInstanceId ? gearInstances[selectedInstanceId] ?? null : null;
  const selectedDetail = selected
    ? toItemDetailSurface({ instance: selected, def: getDef(selected.defId), equipped: equippedIds.has(selected.instanceId) })
    : null;

  let visualState: EquipmentExactVisualState;
  if (selectedDetail) {
    visualState = selectedDetail.identity?.rarity === 'legendary' ? 'detail-legendary' : 'detail-affix';
  } else if (all.length === 0) {
    visualState = 'empty';
  } else {
    visualState = 'healthy';
  }

  return {
    schemaVersion: VAULT_EXACT_SCHEMA_VERSION,
    visualState,
    slips,
    filter,
    sort,
    counts: { total: all.length, byRarity },
    selection: { instanceId: selectedInstanceId ?? null },
    selectedDetail,
    dismantle: selected
      ? { enabled: true, confirmPrompt: `Dismantle ${getDef(selected.defId)?.name ?? selected.defId}? (yield held — D15)` }
      : null,
  };
}
