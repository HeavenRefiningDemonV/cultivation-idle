/**
 * M.IV.1 ARTS-MECH / Step 2 — the LIVE Fortune Draw owner read.
 *
 * Reads the live stores (manualPavilionStore stock + pity, manualSatchelStore, contentStore names) +
 * the HELD pity thresholds + the reroll cost, assembles a `FortuneDrawBuildInput`, and returns the
 * render-only `FortuneDrawSurfaceV1` via the pure builder. This is what surfaces the live pity (the
 * never-regress fate-thread) and what the M.IV.3 port's owner will call. NO mutation; a pure read.
 */

import { useContentStore } from '../../../stores/contentStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { useManualPavilionStore } from '../../../stores/manualPavilionStore.js';
import { useManualSatchelStore } from '../../../stores/manualSatchelStore.js';
import { resolvePavilionRerollCost } from '../../manuals/pavilionRerollCost.js';
import { findLegendaryTechnique } from '../../../content/techniqueLegendaries.js';
import type { RewardCurrencyBundle } from '../../../services/rewards/types.js';
import type { ManualGrade, ManualRarity, PavilionStockSlot } from '../../../features/manuals/pavilionStockTypes.js';
import { buildFortuneDrawSurface, buildFortuneOfferDetail, type FortuneOfferInput } from './fortuneDrawBuilders.js';
import type { FortuneDrawSurfaceV1, FortuneElementEdge, FortunePurseEntry } from './fortuneDrawTypes.js';

const ELEM_LABEL: Record<string, string> = { water: 'Water', fire: 'Fire', wood: 'Wood', earth: 'Earth', metal: 'Metal' };

function elementEdge(technique: { rootAffinityIds?: string[] } | undefined): FortuneElementEdge | null {
  const el = (technique?.rootAffinityIds ?? []).find((r) => r in ELEM_LABEL);
  return el ? { id: el, label: ELEM_LABEL[el], sceneColorToken: `--el-${el}` } : null;
}

const RARITY_ORDER: Record<string, number> = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };

/** Curate the live stock down to the Fortune Draw's lectern (the featured apex + the best few non-filler). */
function curateOffers(slots: readonly PavilionStockSlot[]): PavilionStockSlot[] {
  const live = slots.filter((s) => !s.notSold);
  const featured = live.filter((s) => s.shelf === 'featured');
  const rest = live
    .filter((s) => s.shelf !== 'featured' && s.shelf !== 'filler')
    .sort((a, b) => (RARITY_ORDER[a.rarity] ?? 9) - (RARITY_ORDER[b.rarity] ?? 9));
  const fillers = live.filter((s) => s.shelf === 'filler');
  return [...featured, ...rest, ...fillers].slice(0, 5).sort((a, b) => a.slotIndex - b.slotIndex);
}

const GRADE_REALM_TIER: Record<string, string> = {
  mortal: 'Qi Condensation tier',
  earth: 'Foundation Establishment tier',
  heaven: 'Core Formation tier',
  mystic: 'Nascent Soul tier',
};

function formatAmount(raw: string | number | undefined): string {
  const n = Number(raw ?? 0);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('en-US');
}

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
    element: elementEdge(technique as { rootAffinityIds?: string[] } | undefined),
    priceText: formatBundle(normalizePrice(slot.price)),
    effectText: (technique as { effect?: { note?: string } } | undefined)?.effect?.note ?? null,
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

export interface FortuneDrawLiveOptions {
  now?: number;
  /** the focused offer (its stockId), so the inspector reads its technique detail. */
  selectedStockId?: number | null;
}

function buildPurse(cooldownActive: boolean): FortunePurseEntry[] {
  const inv = useInventoryStore.getState();
  return [
    // "Fortune" = a ready free draw (real, honest binding; the token economy proper is D15).
    { id: 'fortune', label: 'Fortune', amount: cooldownActive ? '0' : '1' },
    { id: 'gold', label: 'Gold', amount: formatAmount(inv.currencies.gold) },
    { id: 'stones', label: 'Spirit Stones', amount: formatAmount(inv.currencies.spiritStones) },
    { id: 'merit', label: 'Merit', amount: formatAmount(inv.currencies.merit) },
  ];
}

function titleCaseId(id: string | undefined): string {
  if (!id) return '';
  return id.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildFortuneDrawSurfaceLive(pavilionId: string, opts: FortuneDrawLiveOptions = {}): FortuneDrawSurfaceV1 {
  const now = opts.now ?? Date.now();
  const content = useContentStore.getState();
  const pavilion = content.maps.pavilionsById[pavilionId];
  const stock = useManualPavilionStore.getState().getStock(pavilionId);
  const satchelState = useManualSatchelStore.getState();
  const activeStudyId = satchelState.activeStudy?.manual.id ?? null;

  const offers = curateOffers(stock?.slots ?? []).map(mapSlot);
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

  const surface = buildFortuneDrawSurface({
    pavilionId,
    pavilionName: 'The Manual Pavilion',
    dateLabel: pavilion?.cityId ? `${pavilion.cityId}` : 'The Manual Pavilion',
    purse: buildPurse(cooldownActive),
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

  // The F2 inspector for the focused offer — built from the REAL technique (no fake roll bars).
  const sel = opts.selectedStockId ?? null;
  if (sel !== null) {
    const offer = surface.offers.find((o) => o.stockId === sel);
    const slot = stock?.slots.find((s) => s.slotIndex === sel);
    if (offer) {
      const tech = content.maps.techniquesById[offer.techniqueId];
      const legendary = findLegendaryTechnique(offer.techniqueId);
      const scalesOff = [tech?.primaryScalingStatId, tech?.secondaryScalingStatId, ...(tech?.rootAffinityIds ?? [])]
        .filter(Boolean)
        .map((id) => titleCaseId(String(id)));
      surface.selectedDetail = buildFortuneOfferDetail(offer, {
        realmTier: slot ? GRADE_REALM_TIER[slot.grade] ?? null : null,
        scalesOff: scalesOff.length ? scalesOff : null,
        signature: legendary?.signature ?? tech?.signature ?? null,
        reroll: {
          cost: rerollCost ? formatBundle(rerollCost) : '[tune] → D15',
          odds: 'Odds set by the pavilion · [tune] → D15',
          note: 'Honest odds, shown before you spend. A reroll never lowers a seated value — never-regress holds.',
        },
        provenance: `Manual · ${pavilion?.cityId ?? 'pavilion'}`,
        actions: [
          { verb: 'Buy & Study', enabled: true, route: `fortune.buyAndStudy:${sel}` },
          { verb: 'Buy to Satchel', enabled: true, route: `fortune.buy:${sel}` },
        ],
      });
    }
  }
  return surface;
}
