/**
 * M.IV.1 ARTS-MECH / Step 2 — the LIVE Fortune Draw owner read.
 *
 * Reads the live stores (manualPavilionStore stock + pity, manualSatchelStore, contentStore names) +
 * the HELD pity thresholds + the reroll cost, assembles a `FortuneDrawBuildInput`, and returns the
 * render-only `FortuneDrawSurfaceV1` via the pure builder. This is what surfaces the live pity (the
 * never-regress fate-thread) and what the M.IV.3 port's owner will call. NO mutation; a pure read.
 */

import { useContentStore } from '../../../stores/contentStore.js';
import { useManualPavilionStore } from '../../../stores/manualPavilionStore.js';
import { useManualSatchelStore } from '../../../stores/manualSatchelStore.js';
import { resolvePavilionRerollCost } from '../../manuals/pavilionRerollCost.js';
import type { RewardCurrencyBundle } from '../../../services/rewards/types.js';
import type { ManualGrade, ManualRarity, PavilionStockSlot } from '../../../features/manuals/pavilionStockTypes.js';
import { buildFortuneDrawSurface, type FortuneOfferInput } from './fortuneDrawBuilders.js';
import type { FortuneDrawSurfaceV1 } from './fortuneDrawTypes.js';

const PATH_LABEL: Record<string, string> = {
  martial: 'Martial',
  earth: 'Earth',
  heaven: 'Heaven',
  body: 'Martial',
};

const CURRENCY_LABEL: Record<string, string> = {
  gold: 'Gold',
  spiritStones: 'Spirit Stones',
  merit: 'Merit',
};

function formatBundle(bundle: RewardCurrencyBundle): string {
  const parts: string[] = [];
  (['gold', 'spiritStones', 'merit'] as const).forEach((key) => {
    const raw = bundle[key];
    if (raw !== undefined && raw !== null) parts.push(`${raw} ${CURRENCY_LABEL[key]}`);
  });
  return parts.length > 0 ? parts.join(' · ') : 'Free';
}

function pityThresholds(): { epic: number; legendary: number } {
  const economy = useContentStore.getState().raw?.economy?.manualSystem as
    | { pavilions?: { refresh?: { pity?: { featuredEpicPityToGuarantee?: number; featuredLegendaryPityToGuarantee?: number } } } }
    | undefined;
  const pity = economy?.pavilions?.refresh?.pity;
  return {
    epic: Number(pity?.featuredEpicPityToGuarantee ?? 10),
    legendary: Number(pity?.featuredLegendaryPityToGuarantee ?? 30),
  };
}

function kindOf(type: unknown): 'active' | 'passive' | 'ultimate' {
  return type === 'passive' || type === 'ultimate' ? type : 'active';
}

function mapSlot(slot: PavilionStockSlot): FortuneOfferInput {
  const technique = useContentStore.getState().maps.techniquesById[slot.techniqueId];
  const name = technique?.name ?? slot.techniqueId;
  const path = String(technique?.path ?? '');
  return {
    stockId: slot.slotIndex,
    shelf: slot.shelf,
    techniqueId: slot.techniqueId,
    name,
    nameCjk: (technique as { nameCjk?: string } | undefined)?.nameCjk ?? null,
    kind: kindOf(technique?.type),
    grade: slot.grade,
    rarity: slot.rarity,
    pathLean: PATH_LABEL[path] ?? (path ? path : null),
    element: null, // elemental edge wired in Step 3 (F3 query)
    priceText: formatBundle(normalizePrice(slot.price)),
    effectText: (technique as { effect?: string } | undefined)?.effect ?? null,
    sealed: false, // the live shop shows offers; the seal/reveal ceremony is presentation (M.IV.3)
    sold: Boolean(slot.sold),
    notSold: Boolean(slot.notSold),
    isFeatured: slot.shelf === 'featured',
  };
}

function normalizePrice(price: PavilionStockSlot['price']): RewardCurrencyBundle {
  const bundle: RewardCurrencyBundle = {};
  (['gold', 'spiritStones', 'merit'] as const).forEach((key) => {
    const raw = price?.[key];
    if (raw !== undefined && raw !== null) bundle[key] = String(raw);
  });
  return bundle;
}

export function buildFortuneDrawSurfaceLive(pavilionId: string, now = Date.now()): FortuneDrawSurfaceV1 {
  const content = useContentStore.getState();
  const pavilion = content.maps.pavilionsById[pavilionId];
  const stock = useManualPavilionStore.getState().getStock(pavilionId);
  const satchelState = useManualSatchelStore.getState();
  const activeStudyId = satchelState.activeStudy?.manual.id ?? null;

  const offers = (stock?.slots ?? []).map(mapSlot);
  const cityIndex = stock?.cityIndex ?? pavilion?.cityIndex ?? 0;
  const rerollCost = resolvePavilionRerollCost(cityIndex);
  const cooldownActive = stock ? now < stock.nextRefreshAt : false;

  const satchel = satchelState.manuals.map((manual) => ({
    instanceId: manual.id,
    techId: manual.techId,
    name: content.maps.techniquesById[manual.techId]?.name ?? manual.techId,
    grade: manual.grade as ManualGrade,
    rarity: manual.rarity as ManualRarity,
    studying: manual.id === activeStudyId,
  }));

  return buildFortuneDrawSurface({
    pavilionId,
    pavilionName: 'The Manual Pavilion',
    dateLabel: pavilion?.cityId ? `${pavilion.cityId}` : 'The Manual Pavilion',
    offers,
    pity: stock?.pity ?? { featuredEpic: 0, featuredLegendary: 0 },
    pityThresholds: pityThresholds(),
    reroll: {
      available: rerollCost !== null,
      costText: rerollCost ? formatBundle(rerollCost) : '[tune] → D15',
      spent: false,
      nextRefreshLabel: cooldownActive ? 'Free draw renewing…' : null,
    },
    satchel,
    selectedDetail: null,
  });
}
