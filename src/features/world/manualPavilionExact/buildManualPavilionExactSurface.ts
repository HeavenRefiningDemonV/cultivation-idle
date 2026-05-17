import type { CityDef, TechniqueDef } from '../../../content/index.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useInventoryStore, type CurrencyKey } from '../../../stores/inventoryStore.js';
import { useManualPavilionStore } from '../../../stores/manualPavilionStore.js';
import { useManualSatchelStore } from '../../../stores/manualSatchelStore.js';
import { useTechCollectionStore } from '../../../stores/techCollectionStore.js';
import { analyzeSelectedBuild } from '../../../systems/builds/buildAnalysisService.js';
import type { BuildAnalysis, BuildGapCode } from '../../../systems/builds/buildAnalysisTypes.js';
import { buildDoctrineSnapshot } from '../../../systems/doctrine/doctrineSnapshot.js';
import {
  analyzeManualOffer,
  buildManualOfferTags,
  getDuplicateFragmentValue,
  type ManualOfferAnalysis,
  type ManualOfferTag,
} from '../../../systems/manuals/index.js';
import { getManualPathIcon, getManualRoleIcon, getManualTypeIcon } from '../../manuals/manualIconMap.js';
import type { ManualGrade, ManualRarity, PavilionStockSlot, PavilionStockState } from '../../manuals/pavilionStockTypes.js';
import { MANUAL_PAVILION_EXACT_ASSETS, spineAssetForColor } from './manualPavilionExactAssetRegistry.js';
import {
  MANUAL_PAVILION_DEFAULT_CITY_ID,
  MANUAL_PAVILION_DEFAULT_PAVILION_ID,
  MANUAL_PAVILION_EXACT_ROOT_TEST_ID,
  MANUAL_PAVILION_EXACT_SURFACE_VERSION,
  MANUAL_PAVILION_FIXTURE_COPY,
  MANUAL_ACTION_LABELS,
  MANUAL_LIFECYCLE_LABELS,
  MANUAL_PAVILION_GAP_LINES,
  MANUAL_PAVILION_GAP_NEEDS,
  MANUAL_PAVILION_PRIMARY_SLOT_COUNT,
  MANUAL_PAVILION_RARITY_WEIGHTS,
  MANUAL_PRIMARY_REASON_LABELS,
  MANUAL_PAVILION_TARGET_MOCKUP_ID,
  MANUAL_PAVILION_VISIBLE_SLOT_ORDER_NOTE,
  buildManualSpineDisplayTitle,
  classifyManualSpineTitleLength,
  chip,
  createManualPavilionButton,
  formatCostLine,
  formatDurationCompact,
  formatThousands,
  normalizeGradeLabel,
  normalizeRarityLabel,
  pathFamilyLabel,
  pathFitLabel,
  spineColorForIndex,
  titleCase,
} from './manualPavilionExactPresentation.js';
import type {
  ManualLifecycleState,
  ManualPavilionChipSurface,
  ManualPavilionExactMode,
  ManualPavilionExactSurfaceV1,
  ManualPavilionExactTone,
  ManualPavilionFactRowSurface,
  ManualPrimaryReason,
  ManualRecommendationState,
  ManualStockState,
  ManualPavilionSpineColorKey,
  ManualPavilionSpineSurface,
  RefreshActionState,
} from './manualPavilionExactTypes.js';

export interface BuildManualPavilionExactSurfaceOptions {
  mode?: ManualPavilionExactMode;
  pavilionId?: string | null;
  selectedSlotIndex?: number | null;
  nowMs?: number;
}

interface ScoredSlot {
  slot: PavilionStockSlot;
  technique: TechniqueDef | null;
  analysis: ManualOfferAnalysis;
  tags: ManualOfferTag[];
  score: number;
}

function shellFlags(): ManualPavilionExactSurfaceV1['shell'] {
  return {
    useScreenOwnedExactPage: true,
    showLegacyPanel: false,
    showGenericWorldClose: false,
    showContextStrip: false,
    showBottomNav: false,
    singleDominantShelf: true,
  };
}

function fact(
  id: string,
  label: string,
  value: string,
  tone: ManualPavilionExactTone = 'neutral',
  source: ManualPavilionFactRowSurface['source'] = 'derived',
  iconKey?: string,
): ManualPavilionFactRowSurface {
  return { id, label, value, tone, source, iconKey };
}

function normalizeCurrencyCosts(
  price: Partial<Record<CurrencyKey, string | number>> | null | undefined,
): Partial<Record<CurrencyKey, string>> {
  const normalized: Partial<Record<CurrencyKey, string>> = {};
  (['gold', 'spiritStones', 'merit'] as const).forEach((key) => {
    const raw = price?.[key];
    if (raw !== undefined) normalized[key] = String(raw);
  });
  return normalized;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
}

function spineTitleFields(techniqueId: string | null | undefined, fullTitle: string) {
  const displayTitle = buildManualSpineDisplayTitle({ techniqueId, fullTitle });
  return {
    shortTitle: displayTitle,
    displayTitle,
    titleLength: classifyManualSpineTitleLength(displayTitle),
  };
}

function primaryReasonTone(reason: ManualPrimaryReason): ManualPavilionExactTone {
  switch (reason) {
    case 'path_aligned':
      return 'jade';
    case 'duplicate_fragments':
      return 'warning';
    case 'fills_empty_slot':
    case 'role_fix':
    case 'survival_fix':
    case 'damage_fix':
    case 'gate_prep':
      return 'recommended';
    case 'support_manual':
      return 'bronze';
    case 'new_technique':
      return 'positive';
    default:
      return 'neutral';
  }
}

function stockStateForSlot(slot: PavilionStockSlot, duplicate: boolean): ManualStockState {
  if (slot.sold) return 'sold';
  if (slot.sealed) return 'sealed';
  if (slot.notSold) return 'not_sold_here';
  if (duplicate) return 'duplicate';
  return 'new';
}

function recommendationFromPrimary(reason: ManualPrimaryReason | null): ManualRecommendationState {
  return reason ?? 'none';
}

function primaryReasonForOffer(input: {
  slot: PavilionStockSlot;
  technique: TechniqueDef | null;
  analysis: ManualOfferAnalysis;
  tags: readonly ManualOfferTag[];
  duplicateFragments: number;
  build: BuildAnalysis | null;
  isNewTechnique: boolean;
}): ManualPrimaryReason {
  const roleText = `${input.technique?.role ?? ''} ${input.technique?.type ?? ''}`.toLowerCase();
  const familiesText = (input.technique?.tags ?? []).join(' ').toLowerCase();
  const topGap = input.build?.gaps[0]?.code ?? null;

  if (input.analysis.isDuplicate && input.duplicateFragments > 0) return 'duplicate_fragments';
  if (input.analysis.fillsCurrentGap && topGap === 'empty_slot') return 'fills_empty_slot';
  if (input.analysis.fillsCurrentGap && topGap === 'missing_survival_tool') return 'survival_fix';
  if (input.analysis.fillsCurrentGap && topGap === 'missing_setup_tool') return 'support_manual';
  if (input.analysis.fillsCurrentGap && /guard|defen|shield|heal|surviv/.test(`${roleText} ${familiesText}`)) {
    return 'survival_fix';
  }
  if (input.analysis.fillsCurrentGap && /damage|strike|attack|offen|active/.test(`${roleText} ${familiesText}`)) {
    return 'damage_fix';
  }
  if (input.analysis.pathAligned) return 'path_aligned';
  if (input.analysis.supportOffer) return 'support_manual';
  if (input.isNewTechnique || input.tags.includes('New')) return 'new_technique';
  if (input.analysis.improvesCurrentMilestone) return 'gate_prep';
  return 'collection';
}

function secondaryReasonsForOffer(input: {
  analysis: ManualOfferAnalysis;
  primaryReason: ManualPrimaryReason;
  duplicateFragments: number;
  isNewTechnique: boolean;
}): string[] {
  const reasons: string[] = [];
  if (input.analysis.fillsCurrentGap && input.primaryReason !== 'fills_empty_slot') reasons.push('Slot or role gap');
  if (input.analysis.pathAligned && input.primaryReason !== 'path_aligned') reasons.push('Path fit');
  if (input.analysis.supportOffer && input.primaryReason !== 'support_manual') reasons.push('Support doctrine');
  if (input.isNewTechnique && input.primaryReason !== 'new_technique') reasons.push('New technique');
  if (input.analysis.isDuplicate && input.duplicateFragments > 0) reasons.push(`+${input.duplicateFragments} fragments`);
  if (input.analysis.improvesCurrentMilestone && input.primaryReason !== 'gate_prep') reasons.push('Gate prep');
  return reasons.slice(0, 3);
}

function priceShortageLabel(slot: PavilionStockSlot): string {
  const inventory = useInventoryStore.getState();
  const price = normalizeCurrencyCosts(slot.price);
  const shortages = (Object.entries(price) as Array<[CurrencyKey, string]>)
    .map(([key, raw]) => {
      const needed = Number(raw);
      const current = Number(inventory.currencies[key] ?? 0);
      const missing = needed - current;
      return missing > 0 ? `${formatThousands(missing)} ${titleCase(key === 'spiritStones' ? 'Spirit Stones' : key)}` : null;
    })
    .filter((entry): entry is string => Boolean(entry));
  return shortages.length > 0 ? `Need ${shortages.join(' / ')}` : 'Need currency';
}

function stateToneForSlot(slot: ManualPavilionSpineSurface): ManualPavilionExactTone {
  if (slot.sold || slot.sealed || slot.notSold) return 'locked';
  if (slot.duplicate) return 'warning';
  if (slot.recommended || slot.state === 'selected') return 'recommended';
  return 'neutral';
}

function makeFixtureSpine(input: {
  slotIndex: number;
  title: string;
  colorKey: ManualPavilionSpineColorKey;
  primaryReason: ManualPrimaryReason;
  state: ManualPavilionSpineSurface['state'];
  selected?: boolean;
  recommended?: boolean;
  duplicate?: boolean;
  stateLabel?: string;
  techniqueId: string;
}): ManualPavilionSpineSurface {
  const selected = input.selected ?? false;
  const duplicate = input.duplicate ?? false;
  const primaryReasonLabel = input.primaryReason === 'duplicate_fragments'
    ? 'Fragments +2'
    : MANUAL_PRIMARY_REASON_LABELS[input.primaryReason];
  const lifecycleState: ManualLifecycleState = duplicate ? 'duplicate_fragment' : 'unowned_affordable';
  const titleFields = spineTitleFields(input.techniqueId, input.title);
  return {
    id: `fixture-spine-${input.slotIndex}`,
    slotIndex: input.slotIndex,
    stockId: input.slotIndex,
    techniqueId: input.techniqueId,
    manualInstanceId: null,
    title: input.title,
    ...titleFields,
    gradeLabel: 'Mortal Grade',
    rarityLabel: 'Common',
    pathLabel: input.slotIndex === 3 ? 'Earth' : input.slotIndex === 5 ? 'Martial' : 'Heaven',
    familyLabel: input.slotIndex === 1 ? 'Martial Family' : 'Doctrine Family',
    roleLabel: input.slotIndex === 2 || input.slotIndex === 6 ? 'Support' : 'Active',
    state: selected ? 'selected' : input.state,
    stateLabel: input.stateLabel ?? MANUAL_LIFECYCLE_LABELS[lifecycleState],
    lifecycleState,
    lifecycleLabel: MANUAL_LIFECYCLE_LABELS[lifecycleState],
    stockState: duplicate ? 'duplicate' : 'new',
    recommendationState: recommendationFromPrimary(input.primaryReason),
    primaryReason: input.primaryReason,
    primaryReasonLabel,
    secondaryReasons: input.primaryReason === 'path_aligned' ? ['Gate prep', 'New technique'] : ['Path fit'],
    selectionState: selected ? 'selected' : 'idle',
    canAfford: true,
    selected,
    recommended: input.recommended ?? selected,
    duplicate,
    locked: false,
    sold: false,
    sealed: false,
    notSold: false,
    priceLabel: '3,000 Gold \u00b7 160 Merit',
    ariaLabel: `${input.title}. ${primaryReasonLabel}. ${MANUAL_LIFECYCLE_LABELS[lifecycleState]}. 3,000 Gold and 160 Merit.`,
    testId: `manual-spine-${input.slotIndex}`,
    tags: [chip(`fixture-tag-${input.slotIndex}`, primaryReasonLabel, primaryReasonTone(input.primaryReason), 'fixture')],
    spineVisual: {
      colorKey: input.colorKey,
      assetKey: spineAssetForColor(input.colorKey),
      iconKey: input.slotIndex === 2 ? 'inkShield' : input.slotIndex === 3 ? 'inkSwirl' : 'bookMartial',
      pathIconKey: input.slotIndex === 3 ? 'bookEarth' : input.slotIndex === 5 ? 'bookMartial' : 'bookHeaven',
      roleIconKey: input.slotIndex === 2 ? 'inkShield' : 'jadeSword',
      sealKey: duplicate ? 'sealBronze' : 'sealRed',
    },
    source: 'fixture',
  };
}

function baseSurface(input: {
  mode: ManualPavilionExactMode;
  source: 'fixture' | 'stores';
  cityId: string;
  pavilionId: string | null;
  selectedSlotIndex: number | null;
  selectedTechniqueId: string | null;
  breadcrumb: string;
  stockRefreshLabel: string;
  stockRefreshTone?: ManualPavilionExactTone;
  buildGapLine: string;
  buildGapChips: ManualPavilionChipSurface[];
  ledgerRows: ManualPavilionFactRowSurface[];
  primarySlots: ManualPavilionSpineSurface[];
  selectedSlot: ManualPavilionSpineSurface | null;
  totalStockLabel: string;
  inspectorRows: ManualPavilionFactRowSurface[];
  whyRows: ManualPavilionFactRowSurface[];
  costLine: string;
  buyButton: ManualPavilionExactSurfaceV1['inspector']['buyButton'];
  studyLaterButton: ManualPavilionExactSurfaceV1['inspector']['studyLaterButton'];
  viewTechniquesButton: ManualPavilionExactSurfaceV1['inspector']['viewTechniquesButton'];
  refreshButton: ManualPavilionExactSurfaceV1['bottomStrip']['refreshButton'];
  refreshState: RefreshActionState;
  refreshCostLine: string;
  pityLabel: string;
  pityProgressLabel: string;
  pityProgressPct: number;
  pityRows: ManualPavilionFactRowSurface[];
  satchelLabel: string;
  currencyRows: ManualPavilionFactRowSurface[];
  feedback?: ManualPavilionExactSurfaceV1['feedback'];
  debug?: ManualPavilionExactSurfaceV1['debug'];
}): ManualPavilionExactSurfaceV1 {
  const selected = input.selectedSlot;
  return {
    meta: {
      surfaceId: 'manual-pavilion-exact',
      version: MANUAL_PAVILION_EXACT_SURFACE_VERSION,
      mode: input.mode,
      source: input.source,
      cityId: input.cityId,
      pavilionId: input.pavilionId,
      selectedSlotIndex: input.selectedSlotIndex,
      selectedTechniqueId: input.selectedTechniqueId,
      targetMockupId: MANUAL_PAVILION_TARGET_MOCKUP_ID,
      rootTestId: MANUAL_PAVILION_EXACT_ROOT_TEST_ID,
    },
    shell: shellFlags(),
    assets: MANUAL_PAVILION_EXACT_ASSETS,
    page: {
      title: 'Manual Pavilion',
      subtitle: MANUAL_PAVILION_FIXTURE_COPY.subtitle,
      breadcrumb: input.breadcrumb,
      stockRefreshLabel: input.stockRefreshLabel,
      stockRefreshTone: input.stockRefreshTone ?? 'neutral',
      returnButton: createManualPavilionButton('manual-pavilion-return-world', 'Return to World', 'return-to-world', {
        tone: 'bronze',
        source: input.source === 'fixture' ? 'fixture' : 'live',
        testId: 'manual-pavilion-return-world',
      }),
    },
    buildGapBanner: {
      title: 'Current Build Gap',
      line: input.buildGapLine,
      sealTone: 'critical',
      sealIconKey: 'sealRed',
      chips: input.buildGapChips,
    },
    leftLedger: {
      title: 'Support Ledger',
      rows: input.ledgerRows,
    },
    shelf: {
      title: 'Recommended Shelf',
      subtitle: 'Highest-relevance six shown from current stock.',
      primarySlots: input.primarySlots,
      selectedSlot: selected,
      totalStockLabel: input.totalStockLabel,
      shelfVisualKey: 'manual-pavilion-bookshelf',
    },
    inspector: {
      visible: Boolean(selected),
      title: selected?.title ?? 'Select a manual',
      stateStamp: selected?.stateLabel ?? 'Empty',
      stateTone: selected ? stateToneForSlot(selected) : 'neutral',
      lifecycleState: selected?.lifecycleState ?? null,
      selectedTechniqueId: selected?.techniqueId ?? null,
      rows: input.inspectorRows,
      whyTitle: 'Why this matters now',
      whyRows: input.whyRows,
      costTitle: 'Cost',
      costLine: input.costLine,
      buyButton: input.buyButton,
      studyLaterButton: input.studyLaterButton,
      viewTechniquesButton: input.viewTechniquesButton,
      footerNote: null,
    },
    bottomStrip: {
      refreshButton: input.refreshButton,
      refreshState: input.refreshState,
      refreshCostLine: input.refreshCostLine,
      pityLabel: input.pityLabel,
      pityProgressLabel: input.pityProgressLabel,
      pityProgressPct: input.pityProgressPct,
      pityRows: input.pityRows,
      satchelButton: createManualPavilionButton('manual-pavilion-open-satchel', 'Open', 'open-satchel', {
        actionKind: 'open_satchel',
        ariaLabel: input.satchelLabel,
        tone: 'bronze',
        source: input.source === 'fixture' ? 'fixture' : 'live',
        testId: 'manual-pavilion-satchel-button',
      }),
      satchelLabel: input.satchelLabel,
      currencyRows: input.currencyRows,
    },
    feedback: input.feedback ?? {
      lastPurchaseMessage: null,
      lastErrorMessage: null,
    },
    debug: input.debug,
  };
}

export function createManualPavilionExactMockupFixture(
  overrides: Partial<ManualPavilionExactSurfaceV1> = {},
): ManualPavilionExactSurfaceV1 {
  const primarySlots = [
    makeFixtureSpine({
      slotIndex: 1,
      title: 'Iron Palm Sutra',
      colorKey: 'bone',
      primaryReason: 'path_aligned',
      state: 'new',
      selected: true,
      recommended: true,
      stateLabel: 'New',
      techniqueId: 'tech_iron_palm',
    }),
    makeFixtureSpine({
      slotIndex: 2,
      title: 'Quiet Guard Verse',
      colorKey: 'cinnabar',
      primaryReason: 'fills_empty_slot',
      state: 'recommended',
      recommended: true,
      stateLabel: 'New',
      techniqueId: 'tech_quiet_guard',
    }),
    makeFixtureSpine({
      slotIndex: 3,
      title: 'Cloudstep Notes',
      colorKey: 'jade',
      primaryReason: 'new_technique',
      state: 'new',
      stateLabel: 'New',
      techniqueId: 'tech_cloudstep_notes',
    }),
    makeFixtureSpine({
      slotIndex: 4,
      title: 'Red Crane Method',
      colorKey: 'bone',
      primaryReason: 'gate_prep',
      state: 'recommended',
      recommended: true,
      stateLabel: 'New',
      techniqueId: 'tech_red_crane',
    }),
    makeFixtureSpine({
      slotIndex: 5,
      title: 'Stone Root Manual',
      colorKey: 'indigo',
      primaryReason: 'duplicate_fragments',
      state: 'fragment',
      duplicate: true,
      stateLabel: 'Fragment +2',
      techniqueId: 'tech_stone_root',
    }),
    makeFixtureSpine({
      slotIndex: 6,
      title: 'Mending Breath',
      colorKey: 'lacquer',
      primaryReason: 'support_manual',
      state: 'duplicate',
      duplicate: true,
      stateLabel: 'Duplicate',
      techniqueId: 'tech_mending_breath',
    }),
  ];
  const selectedSlot = primarySlots[0];

  const surface = baseSurface({
    mode: 'fixture',
    source: 'fixture',
    cityId: MANUAL_PAVILION_DEFAULT_CITY_ID,
    pavilionId: MANUAL_PAVILION_DEFAULT_PAVILION_ID,
    selectedSlotIndex: 1,
    selectedTechniqueId: 'tech_iron_palm',
    breadcrumb: MANUAL_PAVILION_FIXTURE_COPY.breadcrumb,
    stockRefreshLabel: MANUAL_PAVILION_FIXTURE_COPY.stockRefreshLabel,
    buildGapLine: MANUAL_PAVILION_FIXTURE_COPY.buildGapLine,
    buildGapChips: [
      chip('fixture-path-needed', 'Path-Aligned Needed', 'jade', 'fixture', 'bookHeaven'),
      chip('fixture-support-useful', 'Support Manual Useful', 'bronze', 'fixture', 'inkShield'),
      chip('fixture-gate-relevance', 'Next Gate Relevance', 'recommended', 'fixture', 'foundationPill'),
    ],
    ledgerRows: [
      fact('fixture-stock-total', 'Stock', '6 manuals', 'neutral', 'fixture', 'recordSlip'),
      fact('fixture-stock-visible', 'Recommended', '6 shown', 'jade', 'fixture', 'sealJade'),
      fact('fixture-refresh-bias', 'Refresh Bias', 'Path-aligned', 'jade', 'fixture', 'inkRefresh'),
      fact('fixture-owned', 'Owned', '3 / 60', 'neutral', 'fixture', 'bookHeaven'),
      fact('fixture-fragments', 'Fragments', '8', 'warning', 'fixture', 'dustPurple'),
      fact('fixture-current-need', 'Current Need', 'Support / Passive', 'critical', 'fixture', 'inkShield'),
    ],
    primarySlots,
    selectedSlot,
    totalStockLabel: 'Showing 6 of 6',
    inspectorRows: [
      fact('fixture-grade', 'Grade', 'Mortal Grade', 'neutral', 'fixture', 'placeholderRingSmall'),
      fact('fixture-rarity', 'Rarity', 'Common', 'neutral', 'fixture', 'sealBronze'),
      fact('fixture-family', 'Family', 'Martial Family', 'neutral', 'fixture', 'bookMartial'),
      fact('fixture-role', 'Role', 'Active', 'neutral', 'fixture', 'jadeSword'),
      fact('fixture-path-fit', 'Path Fit', 'Path Fit: Strong', 'jade', 'fixture', 'jadeSword'),
      fact('fixture-state', 'State', 'New', 'bronze', 'fixture', 'sealRed'),
    ],
    whyRows: [
      fact('fixture-why-path', 'Path fit', 'Path fit: strong match for current doctrine.', 'jade', 'fixture', 'bookHeaven'),
      fact('fixture-why-gate', 'Gate prep', 'Gate prep: improves next Gate readiness.', 'recommended', 'fixture', 'foundationPill'),
      fact('fixture-why-study', 'Study route', 'Study route: can start now; no active study.', 'positive', 'fixture', 'recordSlip'),
      fact('fixture-why-unlock', 'Unlock route', 'Unlock route: buy and study before equipping.', 'bronze', 'fixture', 'inkSparkles'),
    ],
    costLine: '3,000 Gold \u00b7 160 Merit',
    buyButton: createManualPavilionButton('fixture-buy-and-study', 'Buy & Study', 'buy-manual', {
      actionKind: 'buy_and_study',
      tone: 'jade',
      source: 'fixture',
      testId: 'manual-pavilion-inspector-primary-action',
    }),
    studyLaterButton: createManualPavilionButton('fixture-buy-to-satchel', 'Buy to Satchel', 'study-later', {
      actionKind: 'buy_to_satchel',
      tone: 'bronze',
      source: 'fixture',
      testId: 'manual-pavilion-inspector-secondary-action',
    }),
    viewTechniquesButton: createManualPavilionButton('fixture-preview-technique', 'Preview Technique', 'view-techniques', {
      actionKind: 'preview_technique',
      tone: 'neutral',
      source: 'fixture',
      testId: 'manual-pavilion-inspector-tertiary-action',
    }),
    refreshButton: createManualPavilionButton('fixture-free-refresh', 'Free Refresh', 'refresh-stock', {
      actionKind: 'free_refresh',
      tone: 'jade',
      source: 'fixture',
      testId: 'manual-pavilion-refresh-button',
    }),
    refreshState: 'free_ready',
    refreshCostLine: 'Free refresh ready now',
    pityLabel: 'Featured quality progress',
    pityProgressLabel: 'Epic pity: 3 / 10 \u00b7 Legendary pity: 13 / 30',
    pityProgressPct: 30,
    pityRows: [
      fact('fixture-pity-epic', 'Epic pity', '3 / 10', 'warning', 'fixture', 'sealBronze'),
      fact('fixture-pity-legendary', 'Legendary pity', '13 / 30', 'recommended', 'fixture', 'sealRed'),
    ],
    satchelLabel: 'Manual Satchel 3 manuals',
    currencyRows: [
      fact('fixture-gold', 'Gold', '128,450', 'bronze', 'fixture', 'coin'),
      fact('fixture-merit', 'Merit', '1,260', 'warning', 'fixture', 'dustPurple'),
    ],
    debug: {
      missingDataFallbacks: [],
      notes: ['Fixture values are locked to the Manual Pavilion mockup.'],
    },
  });

  return { ...surface, ...overrides };
}

function placeholderSpine(index: number, source: 'live' | 'synthetic' = 'synthetic'): ManualPavilionSpineSurface {
  const titleFields = spineTitleFields(null, 'Preparing');
  return {
    id: `manual-placeholder-${index}`,
    slotIndex: null,
    stockId: null,
    techniqueId: null,
    manualInstanceId: null,
    title: 'Stock Preparing',
    ...titleFields,
    gradeLabel: 'Unknown Grade',
    rarityLabel: 'Unknown',
    pathLabel: 'Unsorted',
    familyLabel: 'Unsorted Family',
    roleLabel: 'Unavailable',
    state: 'placeholder',
    stateLabel: 'Preparing',
    lifecycleState: 'sealed',
    lifecycleLabel: 'Preparing',
    stockState: 'locked',
    recommendationState: 'none',
    primaryReason: 'collection',
    primaryReasonLabel: 'Preparing',
    secondaryReasons: [],
    selectionState: 'idle',
    canAfford: false,
    selected: false,
    recommended: false,
    duplicate: false,
    locked: true,
    sold: false,
    sealed: false,
    notSold: false,
    priceLabel: 'Unavailable',
    ariaLabel: 'Manual stock is preparing.',
    testId: `manual-spine-placeholder-${index}`,
    tags: [chip(`placeholder-${index}-tag`, 'Preparing', 'locked', source)],
    spineVisual: {
      colorKey: 'neutral',
      assetKey: spineAssetForColor('neutral'),
      iconKey: 'recordSlip',
      pathIconKey: 'recordSlip',
      roleIconKey: 'inkLock',
      sealKey: 'none',
    },
    source,
  };
}

function fallbackSurface(input: {
  cityId: string;
  pavilionId: string | null;
  missingDataFallbacks: string[];
  nowMs: number;
  cityName?: string | null;
}): ManualPavilionExactSurfaceV1 {
  const placeholders = Array.from({ length: MANUAL_PAVILION_PRIMARY_SLOT_COUNT }, (_, index) => placeholderSpine(index + 1));
  const selectedSlot = placeholders[0] ?? null;
  return baseSurface({
    mode: 'live',
    source: 'stores',
    cityId: input.cityId,
    pavilionId: input.pavilionId,
    selectedSlotIndex: null,
    selectedTechniqueId: null,
    breadcrumb: `${input.cityName ?? 'City'} / Manual Pavilion`,
    stockRefreshLabel: 'Stock Refresh: Loading',
    stockRefreshTone: 'warning',
    buildGapLine: 'manual stock is still being prepared; doctrine recommendations will appear when content is ready.',
    buildGapChips: [
      chip('fallback-stock-loading', 'Stock Loading', 'warning', 'synthetic', 'hourglassProgress'),
      chip('fallback-path-needed', 'Path-Aligned Needed', 'jade', 'synthetic', 'bookHeaven'),
      chip('fallback-support-useful', 'Support Manual Useful', 'bronze', 'synthetic', 'inkShield'),
    ],
    ledgerRows: [
      fact('fallback-stock-total', 'Stock', '0 manuals', 'warning', 'synthetic', 'recordSlip'),
      fact('fallback-stock-visible', 'Recommended', '0 shown', 'warning', 'synthetic', 'sealJade'),
      fact('fallback-refresh-bias', 'Refresh Bias', 'Path-aligned', 'jade', 'synthetic', 'inkRefresh'),
      fact('fallback-owned', 'Owned', '0 / 0', 'neutral', 'synthetic', 'bookHeaven'),
      fact('fallback-fragments', 'Fragments', '0', 'neutral', 'synthetic', 'dustPurple'),
      fact('fallback-current-need', 'Current Need', 'Support / Passive', 'warning', 'synthetic', 'inkShield'),
    ],
    primarySlots: placeholders,
    selectedSlot,
    totalStockLabel: 'Showing 0 of 0',
    inspectorRows: [
      fact('fallback-grade', 'Grade', 'Unavailable', 'locked', 'synthetic', 'placeholderRingSmall'),
      fact('fallback-family', 'Family', 'Unavailable', 'locked', 'synthetic', 'recordSlip'),
      fact('fallback-path-fit', 'Path Fit', 'Path Fit: Pending', 'warning', 'synthetic', 'inkWarning'),
      fact('fallback-state', 'State', 'Loading', 'warning', 'synthetic', 'hourglassProgress'),
    ],
    whyRows: [
      fact('fallback-why-stock', 'Reason', 'Stock will be generated by the pavilion store.', 'warning', 'synthetic', 'hourglassProgress'),
      fact('fallback-why-actions', 'Reason', 'Purchase actions remain disabled until live stock exists.', 'locked', 'synthetic', 'inkLock'),
    ],
    costLine: 'Unavailable',
    buyButton: createManualPavilionButton('fallback-buy-manual', 'Stock Preparing', 'buy-manual', {
      actionKind: 'none',
      enabled: false,
      disabledReason: 'Manual stock is not ready yet.',
      tone: 'locked',
      source: 'synthetic',
      testId: 'manual-pavilion-inspector-primary-action',
    }),
    studyLaterButton: createManualPavilionButton('fallback-open-satchel', 'Open Satchel', 'study-later', {
      actionKind: 'open_satchel',
      enabled: false,
      disabledReason: 'Manual stock is not ready yet.',
      tone: 'locked',
      source: 'synthetic',
      testId: 'manual-pavilion-inspector-secondary-action',
    }),
    viewTechniquesButton: createManualPavilionButton('fallback-preview-technique', 'Preview Technique', 'view-techniques', {
      actionKind: 'preview_technique',
      enabled: false,
      disabledReason: 'No technique selected.',
      tone: 'locked',
      source: 'synthetic',
      testId: 'manual-pavilion-inspector-tertiary-action',
    }),
    refreshButton: createManualPavilionButton('fallback-refresh-stock', 'Refresh Preparing', 'refresh-stock', {
      actionKind: 'none',
      enabled: Boolean(input.pavilionId),
      disabledReason: input.pavilionId ? null : 'Pavilion reference is unavailable.',
      tone: input.pavilionId ? 'bronze' : 'locked',
      source: 'synthetic',
      testId: 'manual-pavilion-refresh-button',
    }),
    refreshState: 'cooldown_locked',
    refreshCostLine: 'Free refresh pending stock preparation',
    pityLabel: 'Featured quality progress',
    pityProgressLabel: 'Epic pity: 0 / 10 \u00b7 Legendary pity: 0 / 30',
    pityProgressPct: 0,
    pityRows: [
      fact('fallback-pity-epic', 'Epic pity', '0 / 10', 'warning', 'synthetic', 'sealBronze'),
      fact('fallback-pity-legendary', 'Legendary pity', '0 / 30', 'recommended', 'synthetic', 'sealRed'),
    ],
    satchelLabel: 'Manual Satchel 0 manuals',
    currencyRows: [
      fact('fallback-gold', 'Gold', '0', 'bronze', 'synthetic', 'coin'),
      fact('fallback-merit', 'Merit', '0', 'warning', 'synthetic', 'dustPurple'),
    ],
    debug: {
      missingDataFallbacks: input.missingDataFallbacks,
      notes: [MANUAL_PAVILION_VISIBLE_SLOT_ORDER_NOTE, `Fallback built at ${input.nowMs}.`],
    },
  });
}

function resolvePavilionId(city: CityDef | null, requested: string | null | undefined): string | null {
  if (requested) return requested;
  return city?.refs?.pavilionId ?? null;
}

function scoreOffer(input: {
  slot: PavilionStockSlot;
  analysis: ManualOfferAnalysis;
  isNewTechnique: boolean;
}): number {
  let score = 0;
  if (input.analysis.fillsCurrentGap) score += 1000;
  if (input.analysis.pathAligned) score += 700;
  if (input.analysis.supportOffer) score += 600;
  if (input.isNewTechnique) score += 500;
  if (input.analysis.improvesCurrentMilestone) score += 400;
  if (input.analysis.isDuplicate && input.analysis.fragmentProgressValue > 0) score += 300;
  score += MANUAL_PAVILION_RARITY_WEIGHTS[input.slot.rarity] ?? 0;
  if (input.slot.sold) score -= 300;
  if (input.slot.notSold) score -= 500;
  if (input.slot.sealed) score -= 250;
  return score;
}

function stateForSlot(input: {
  slot: PavilionStockSlot;
  selected: boolean;
  analysis: ManualOfferAnalysis;
  tags: readonly ManualOfferTag[];
}): ManualPavilionSpineSurface['state'] {
  if (input.selected) return 'selected';
  if (input.slot.sold) return 'sold';
  if (input.slot.sealed) return 'sealed';
  if (input.slot.notSold) return 'notSold';
  if (input.analysis.isDuplicate && input.tags.includes('Fragment Progress')) return 'fragment';
  if (input.analysis.isDuplicate) return 'duplicate';
  if (input.tags.includes('New')) return 'new';
  if (input.analysis.fillsCurrentGap || input.analysis.pathAligned || input.analysis.supportOffer) return 'recommended';
  return 'available';
}

function stateLabelForSlot(input: {
  slot: PavilionStockSlot;
  analysis: ManualOfferAnalysis;
  tags: readonly ManualOfferTag[];
  duplicateFragments: number;
}): string {
  if (input.slot.sold) return 'Sold';
  if (input.slot.sealed) return 'Sealed';
  if (input.slot.notSold) return 'Not Sold';
  if (input.analysis.isDuplicate && input.duplicateFragments > 0) return `Fragment +${input.duplicateFragments}`;
  if (input.analysis.isDuplicate) return 'Duplicate';
  return input.tags[0] ?? 'Available';
}

function manualMatchesSlot(
  manual: { techId: string; grade: string; rarity: string } | null | undefined,
  slot: PavilionStockSlot,
): boolean {
  return Boolean(
    manual &&
    manual.techId === slot.techniqueId &&
    manual.grade === slot.grade &&
    manual.rarity === slot.rarity,
  );
}

function deriveLifecycle(input: {
  slot: PavilionStockSlot;
  analysis: ManualOfferAnalysis;
  canAfford: boolean;
  hasTechnique: boolean;
}): ManualLifecycleState {
  if (input.slot.sealed) return 'sealed';
  if (input.slot.notSold) return 'not_sold_here';

  const satchel = useManualSatchelStore.getState();
  const matchingManuals = satchel.manuals.filter((manual) => manualMatchesSlot(manual, input.slot));
  const activeMatches = manualMatchesSlot(satchel.activeStudy?.manual, input.slot);

  if (activeMatches) return 'studying';
  if (matchingManuals.length > 0) return 'owned_unstudied';
  if (input.slot.sold) {
    return input.hasTechnique ? 'learned' : 'sold';
  }
  if (input.analysis.isDuplicate) return 'duplicate_fragment';
  if (!input.canAfford) return 'unowned_unaffordable';
  return 'unowned_affordable';
}

function stateLabelForLifecycle(input: {
  lifecycle: ManualLifecycleState;
  duplicateFragments: number;
  fallback: string;
}): string {
  if (input.lifecycle === 'duplicate_fragment' && input.duplicateFragments > 0) {
    return `Fragments +${input.duplicateFragments}`;
  }
  return MANUAL_LIFECYCLE_LABELS[input.lifecycle] ?? input.fallback;
}

function buildSpineSurface(input: {
  scored: ScoredSlot;
  selectedSlotIndex: number | null;
  visualIndex: number;
  canAfford: boolean;
  buildAnalysis: BuildAnalysis;
}): ManualPavilionSpineSurface {
  const { slot, technique, analysis, tags } = input.scored;
  const selected = slot.slotIndex === input.selectedSlotIndex;
  const isNewTechnique = !analysis.isDuplicate;
  const duplicateFragments = analysis.isDuplicate ? getDuplicateFragmentValue(slot.grade, slot.rarity) : 0;
  const collection = useTechCollectionStore.getState();
  const hasTechnique = collection.hasTech(slot.techniqueId);
  const lifecycleState = deriveLifecycle({
    slot,
    analysis,
    canAfford: input.canAfford,
    hasTechnique,
  });
  const primaryReason = primaryReasonForOffer({
    slot,
    technique,
    analysis,
    tags,
    duplicateFragments,
    build: input.buildAnalysis,
    isNewTechnique,
  });
  const primaryReasonLabel = primaryReason === 'duplicate_fragments' && duplicateFragments > 0
    ? `Fragments +${duplicateFragments}`
    : MANUAL_PRIMARY_REASON_LABELS[primaryReason];
  const secondaryReasons = secondaryReasonsForOffer({
    analysis,
    primaryReason,
    duplicateFragments,
    isNewTechnique,
  });
  const tagSurfaces = [
    chip(`tag-primary-${slot.slotIndex}-${slug(primaryReasonLabel)}`, primaryReasonLabel, primaryReasonTone(primaryReason), 'derived'),
    ...secondaryReasons.map((reason) => chip(`tag-secondary-${slot.slotIndex}-${slug(reason)}`, reason, 'neutral', 'derived')),
  ].slice(0, 3);
  const pathIcon = getManualPathIcon(technique?.path ?? null);
  const roleIcon = getManualRoleIcon(technique?.role ?? null);
  const typeIcon = getManualTypeIcon(technique?.type === 'passive' || technique?.type === 'ultimate' ? technique.type : 'active');
  const colorKey = spineColorForIndex(input.visualIndex, technique?.path);
  const fallbackStateLabel = stateLabelForSlot({ slot, analysis, tags, duplicateFragments });
  const stateLabel = stateLabelForLifecycle({ lifecycle: lifecycleState, duplicateFragments, fallback: fallbackStateLabel });
  const fullTitle = technique?.name ?? titleCase(slot.techniqueId);
  const titleFields = spineTitleFields(slot.techniqueId, fullTitle);

  return {
    id: `stock-${slot.slotIndex}-${slot.techniqueId}`,
    slotIndex: slot.slotIndex,
    stockId: slot.slotIndex,
    techniqueId: slot.techniqueId,
    manualInstanceId: manualInstanceIdForSlot(slot),
    title: fullTitle,
    ...titleFields,
    gradeLabel: normalizeGradeLabel(slot.grade),
    rarityLabel: normalizeRarityLabel(slot.rarity),
    pathLabel: titleCase(technique?.path ?? 'unknown'),
    familyLabel: pathFamilyLabel(technique?.path),
    roleLabel: titleCase(technique?.role ?? technique?.type ?? 'general'),
    state: stateForSlot({ slot, selected, analysis, tags }),
    stateLabel,
    lifecycleState,
    lifecycleLabel: stateLabel,
    stockState: stockStateForSlot(slot, analysis.isDuplicate),
    recommendationState: recommendationFromPrimary(primaryReason),
    primaryReason,
    primaryReasonLabel,
    secondaryReasons,
    selectionState: selected ? 'selected' : 'idle',
    canAfford: input.canAfford,
    selected,
    recommended: analysis.fillsCurrentGap || analysis.pathAligned || analysis.supportOffer,
    duplicate: analysis.isDuplicate,
    locked: Boolean(slot.sealed || slot.notSold),
    sold: Boolean(slot.sold),
    sealed: Boolean(slot.sealed),
    notSold: Boolean(slot.notSold),
    priceLabel: formatCostLine(slot.price),
    ariaLabel: `${fullTitle}. ${primaryReasonLabel}. ${stateLabel}. ${formatCostLine(slot.price)}.`,
    testId: `manual-spine-${slot.slotIndex}`,
    tags: tagSurfaces.length > 0 ? tagSurfaces : [chip(`tag-${slot.slotIndex}-available`, isNewTechnique ? 'New' : 'Available', 'neutral', 'derived')],
    spineVisual: {
      colorKey,
      assetKey: spineAssetForColor(colorKey),
      iconKey: typeIcon.iconId ?? 'recordSlip',
      pathIconKey: pathIcon.iconId ?? 'recordSlip',
      roleIconKey: roleIcon.iconId ?? 'inkSparkles',
      sealKey: analysis.isDuplicate ? 'sealBronze' : analysis.pathAligned ? 'sealJade' : 'sealRed',
    },
    source: 'live',
  };
}

function selectPrimarySlots(input: {
  stock: PavilionStockState;
  techniquesById: Record<string, TechniqueDef>;
  buildAnalysis: BuildAnalysis;
}): ScoredSlot[] {
  const snapshot = buildDoctrineSnapshot();
  const collection = useTechCollectionStore.getState();

  const scored = input.stock.slots.map((slot) => {
    const technique = input.techniquesById[slot.techniqueId] ?? null;
    const analysis = analyzeManualOffer({
      techniqueId: slot.techniqueId,
      manualGrade: slot.grade,
      manualRarity: slot.rarity,
      snapshot,
      buildAnalysis: input.buildAnalysis,
    });
    const isNewTechnique = !collection.hasTech(slot.techniqueId);
    const tags = buildManualOfferTags({
      analysis,
      isNewTechnique,
      includeMilestoneValue: true,
      maxTags: 3,
    });
    return {
      slot,
      technique,
      analysis,
      tags,
      score: scoreOffer({ slot, analysis, isNewTechnique }),
    };
  });

  return scored
    .sort((a, b) => (b.score - a.score) || (a.slot.slotIndex - b.slot.slotIndex))
    .slice(0, MANUAL_PAVILION_PRIMARY_SLOT_COUNT)
    .sort((a, b) => a.slot.slotIndex - b.slot.slotIndex);
}

function resolveSelectedSlotIndex(input: {
  requested: number | null | undefined;
  primary: ScoredSlot[];
}): number | null {
  if (input.requested !== null && input.requested !== undefined) {
    const match = input.primary.find((entry) => entry.slot.slotIndex === input.requested);
    if (match) return match.slot.slotIndex;
  }
  return input.primary.find((entry) => !entry.slot.sold && !entry.slot.sealed && !entry.slot.notSold)?.slot.slotIndex
    ?? input.primary[0]?.slot.slotIndex
    ?? null;
}

function buildGapLine(build: BuildAnalysis): string {
  const top = build.gaps[0];
  if (!top) return 'current doctrine is stable; seek manuals that deepen the active path.';
  return MANUAL_PAVILION_GAP_LINES[top.code] ?? top.reason;
}

function buildNeedLabel(build: BuildAnalysis): string {
  const top = build.gaps[0];
  if (!top) return 'Path / Mastery';
  return MANUAL_PAVILION_GAP_NEEDS[top.code] ?? titleCase(top.code);
}

function buildGapChips(input: {
  build: BuildAnalysis;
  selected: ManualPavilionSpineSurface | null;
}): ManualPavilionChipSurface[] {
  const chips: ManualPavilionChipSurface[] = [];
  if (input.build.gaps.some((gap) => gap.code === 'low_alignment' || gap.code === 'empty_slot')) {
    chips.push(chip('live-path-aligned-needed', 'Path-Aligned Needed', 'jade', 'derived', 'bookHeaven'));
  }
  if (input.build.gaps.some((gap) => gap.code === 'missing_survival_tool' || gap.code === 'missing_setup_tool' || gap.code === 'empty_slot')) {
    chips.push(chip('live-support-manual-useful', 'Support Manual Useful', 'bronze', 'derived', 'inkShield'));
  }
  chips.push(chip('live-next-gate-relevance', 'Next Gate Relevance', 'recommended', 'derived', 'foundationPill'));
  if (input.selected?.duplicate) chips.push(chip('live-duplicate-value', 'Fragment Value', 'warning', 'derived', 'dustPurple'));
  return chips.slice(0, 3);
}

function selectedAnalysisFor(
  selected: ManualPavilionSpineSurface | null,
  scored: ScoredSlot[],
): ManualOfferAnalysis | null {
  if (!selected?.slotIndex) return null;
  return scored.find((entry) => entry.slot.slotIndex === selected.slotIndex)?.analysis ?? null;
}

function buildInspectorRows(input: {
  selected: ManualPavilionSpineSurface | null;
  analysis: ManualOfferAnalysis | null;
}): ManualPavilionFactRowSurface[] {
  if (!input.selected) {
    return [
      fact('inspector-grade-empty', 'Grade', 'Unavailable', 'locked', 'synthetic', 'placeholderRingSmall'),
      fact('inspector-family-empty', 'Family', 'Unavailable', 'locked', 'synthetic', 'recordSlip'),
      fact('inspector-path-fit-empty', 'Path Fit', 'Path Fit: Pending', 'warning', 'synthetic', 'inkWarning'),
      fact('inspector-state-empty', 'State', 'Select a spine', 'warning', 'synthetic', 'hourglassProgress'),
    ];
  }

  return [
    fact('inspector-grade', 'Grade', input.selected.gradeLabel, 'neutral', 'live', 'placeholderRingSmall'),
    fact('inspector-rarity', 'Rarity', input.selected.rarityLabel, 'neutral', 'live', 'sealBronze'),
    fact('inspector-family', 'Family', input.selected.familyLabel, 'neutral', 'live', input.selected.spineVisual.pathIconKey),
    fact('inspector-role', 'Role', input.selected.roleLabel, 'neutral', 'live', input.selected.spineVisual.roleIconKey),
    fact(
      'inspector-path-fit',
      'Path Fit',
      pathFitLabel(Boolean(input.analysis?.pathAligned), Boolean(input.analysis?.supportOffer)),
      input.analysis?.pathAligned ? 'jade' : input.analysis?.supportOffer ? 'bronze' : 'neutral',
      'derived',
      input.selected.spineVisual.roleIconKey,
    ),
    fact('inspector-state', 'State', input.selected.lifecycleLabel, stateToneForSlot(input.selected), 'derived', 'sealRed'),
  ];
}

function buildWhyRows(input: {
  selected: ManualPavilionSpineSurface | null;
  analysis: ManualOfferAnalysis | null;
  build: BuildAnalysis;
}): ManualPavilionFactRowSurface[] {
  if (!input.selected) {
    return [
      fact('why-select', 'Reason', 'Select a spine to inspect doctrine fit.', 'warning', 'synthetic', 'recordSlip'),
    ];
  }

  const rows: ManualPavilionFactRowSurface[] = [];
  const topGap = input.build.gaps[0]?.code ?? null;
  if (input.selected.primaryReason === 'fills_empty_slot' || topGap === 'empty_slot') {
    rows.push(fact('why-gap', 'Slot fix', 'Slot fix: fills an empty unlocked slot.', 'recommended', 'derived', 'jadeSword'));
  }
  if (input.selected.primaryReason === 'survival_fix') {
    rows.push(fact('why-survival', 'Gate impact', 'Gate impact: raises Survival readiness.', 'recommended', 'derived', 'inkShield'));
  }
  if (input.analysis?.pathAligned) {
    rows.push(fact('why-path', 'Path fit', `${input.selected.pathLabel} path fit: strong match.`, 'jade', 'derived', 'bookHeaven'));
  }
  if (input.analysis?.supportOffer) {
    rows.push(fact('why-support', 'Support', `Support role: ${input.selected.roleLabel} doctrine fills utility coverage.`, 'bronze', 'derived', 'inkShield'));
  }
  if (input.selected.duplicate) {
    rows.push(fact('why-duplicate', 'Duplicate value', `${input.selected.primaryReasonLabel} toward rank progress.`, 'warning', 'derived', 'dustPurple'));
  }
  if (input.analysis?.improvesCurrentMilestone && !rows.some((row) => row.id === 'why-gate')) {
    rows.push(fact('why-gate', 'Gate prep', 'Gate prep: improves next Gate readiness.', 'recommended', 'derived', 'foundationPill'));
  }
  if (input.selected.lifecycleState === 'unowned_affordable') {
    rows.push(fact('why-study-route', 'Study route', 'Study route: can start now if no manual is already active.', 'positive', 'derived', 'recordSlip'));
  } else if (input.selected.lifecycleState === 'owned_unstudied') {
    rows.push(fact('why-satchel-route', 'Study route', 'Study route: manual is already waiting in Satchel.', 'positive', 'derived', 'recordSlip'));
  } else if (input.selected.lifecycleState === 'learned') {
    rows.push(fact('why-techniques-route', 'Technique route', 'Technique route: open rank and mastery progress.', 'jade', 'derived', 'bookHeaven'));
  }
  if (rows.length === 0) {
    rows.push(fact('why-general', 'Collection', 'Collection value: adds a manual option for later study.', 'neutral', 'derived', 'recordSlip'));
  }
  return rows.slice(0, 5);
}

function refreshLineForState(refreshState: RefreshActionState, remainingMs: number): string {
  if (refreshState === 'free_ready') return 'Free refresh ready now';
  if (refreshState === 'cooldown_locked') return `Free refresh ready in ${formatDurationCompact(remainingMs)}`;
  return 'Refresh is unavailable.';
}

function resolveRefreshState(stock: PavilionStockState, nowMs: number): RefreshActionState {
  return stock.nextRefreshAt - nowMs <= 0 ? 'free_ready' : 'cooldown_locked';
}

function currencyRows(): ManualPavilionFactRowSurface[] {
  const inventory = useInventoryStore.getState();
  return [
    fact('currency-gold', 'Gold', formatThousands(inventory.currencies.gold), 'bronze', 'live', 'coin'),
    fact('currency-merit', 'Merit', formatThousands(inventory.currencies.merit), 'warning', 'live', 'dustPurple'),
  ];
}

function getPityRules(): { epicMax: number; legendaryMax: number } {
  const content = useContentStore.getState();
  const pity = (content.economy?.manualSystem as { pavilions?: { refresh?: { pity?: { featuredEpicPityToGuarantee?: number; featuredLegendaryPityToGuarantee?: number } } } } | undefined)
    ?.pavilions?.refresh?.pity;
  return {
    epicMax: Math.max(1, Number(pity?.featuredEpicPityToGuarantee ?? 10)),
    legendaryMax: Math.max(1, Number(pity?.featuredLegendaryPityToGuarantee ?? 30)),
  };
}

function resolvePity(stock: PavilionStockState | null): Pick<ManualPavilionExactSurfaceV1['bottomStrip'], 'pityLabel' | 'pityProgressLabel' | 'pityProgressPct' | 'pityRows'> {
  const { epicMax, legendaryMax } = getPityRules();
  const epicCurrent = Math.max(0, Math.min(epicMax, stock?.pity.featuredEpic ?? 0));
  const legendaryCurrent = Math.max(0, Math.min(legendaryMax, stock?.pity.featuredLegendary ?? 0));
  const epicLabel = `${epicCurrent} / ${epicMax}`;
  const legendaryLabel = `${legendaryCurrent} / ${legendaryMax}`;
  return {
    pityLabel: 'Featured quality progress',
    pityProgressLabel: `Epic pity: ${epicLabel} \u00b7 Legendary pity: ${legendaryLabel}`,
    pityProgressPct: Math.round((epicCurrent / epicMax) * 100),
    pityRows: [
      fact('pity-epic', 'Epic pity', epicLabel, 'warning', 'live', 'sealBronze'),
      fact('pity-legendary', 'Legendary pity', legendaryLabel, 'recommended', 'live', 'sealRed'),
    ],
  };
}

function inventoryCanAfford(slot: PavilionStockSlot): boolean {
  return useInventoryStore.getState().canAffordCurrency(normalizeCurrencyCosts(slot.price));
}

function manualInstanceIdForSlot(slot: PavilionStockSlot | null): string | null {
  if (!slot) return null;
  const satchel = useManualSatchelStore.getState();
  return satchel.manuals.find((manual) => manualMatchesSlot(manual, slot))?.id ?? null;
}

function buildInspectorActions(input: {
  selected: ManualPavilionSpineSurface | null;
  rawSlot: PavilionStockSlot | null;
  activeStudyName: string | null;
}): Pick<ManualPavilionExactSurfaceV1['inspector'], 'buyButton' | 'studyLaterButton' | 'viewTechniquesButton'> {
  const disabledBase = (label: string, reason: string, testId: string) => createManualPavilionButton(
    `live-${slug(label)}`,
    label,
    'disabled',
    {
      actionKind: 'none',
      enabled: false,
      disabledReason: reason,
      tone: 'locked',
      source: 'live',
      testId,
    },
  );
  const previewButton = createManualPavilionButton('live-preview-technique', MANUAL_ACTION_LABELS.preview_technique, 'view-techniques', {
    actionKind: 'preview_technique',
    enabled: Boolean(input.selected?.techniqueId),
    disabledReason: input.selected?.techniqueId ? null : 'No technique selected.',
    tone: 'bronze',
    source: 'live',
    testId: 'manual-pavilion-inspector-tertiary-action',
  });

  if (!input.selected || input.selected.state === 'placeholder') {
    return {
      buyButton: disabledBase('Stock Preparing', 'Manual stock is not ready yet.', 'manual-pavilion-inspector-primary-action'),
      studyLaterButton: disabledBase('Open Satchel', 'Manual stock is not ready yet.', 'manual-pavilion-inspector-secondary-action'),
      viewTechniquesButton: previewButton,
    };
  }

  const lifecycle = input.selected.lifecycleState;
  const studyBusyReason = input.activeStudyName ? `Already studying ${input.activeStudyName}.` : 'Already studying a manual.';
  const canStartStudy = !input.activeStudyName && Boolean(input.rawSlot ? manualInstanceIdForSlot(input.rawSlot) : null);

  if (lifecycle === 'unowned_affordable') {
    if (input.activeStudyName) {
      return {
        buyButton: createManualPavilionButton('live-buy-to-satchel', MANUAL_ACTION_LABELS.buy_to_satchel, 'buy-manual', {
          actionKind: 'buy_to_satchel',
          tone: 'jade',
          source: 'live',
          testId: 'manual-pavilion-inspector-primary-action',
        }),
        studyLaterButton: disabledBase('Study Busy', studyBusyReason, 'manual-pavilion-inspector-secondary-action'),
        viewTechniquesButton: previewButton,
      };
    }
    return {
      buyButton: createManualPavilionButton('live-buy-and-study', MANUAL_ACTION_LABELS.buy_and_study, 'buy-manual', {
        actionKind: 'buy_and_study',
        tone: 'jade',
        source: 'live',
        testId: 'manual-pavilion-inspector-primary-action',
      }),
      studyLaterButton: createManualPavilionButton('live-buy-to-satchel', MANUAL_ACTION_LABELS.buy_to_satchel, 'study-later', {
        actionKind: 'buy_to_satchel',
        tone: 'bronze',
        source: 'live',
        testId: 'manual-pavilion-inspector-secondary-action',
      }),
      viewTechniquesButton: previewButton,
    };
  }

  if (lifecycle === 'unowned_unaffordable') {
    const label = input.rawSlot ? priceShortageLabel(input.rawSlot) : 'Need currency';
    return {
      buyButton: disabledBase(label, 'Insufficient currency reserves.', 'manual-pavilion-inspector-primary-action'),
      studyLaterButton: previewButton,
      viewTechniquesButton: createManualPavilionButton('live-open-satchel', MANUAL_ACTION_LABELS.open_satchel, 'open-satchel', {
        actionKind: 'open_satchel',
        tone: 'bronze',
        source: 'live',
        testId: 'manual-pavilion-inspector-tertiary-action',
      }),
    };
  }

  if (lifecycle === 'owned_unstudied') {
    return {
      buyButton: createManualPavilionButton('live-start-study', input.activeStudyName ? 'Study Busy' : MANUAL_ACTION_LABELS.start_study, 'buy-manual', {
        actionKind: input.activeStudyName ? 'none' : 'start_study',
        enabled: canStartStudy,
        disabledReason: input.activeStudyName ? studyBusyReason : canStartStudy ? null : 'Manual instance is not available in Satchel.',
        tone: canStartStudy ? 'jade' : 'locked',
        source: 'live',
        testId: 'manual-pavilion-inspector-primary-action',
      }),
      studyLaterButton: createManualPavilionButton('live-open-satchel', MANUAL_ACTION_LABELS.open_satchel, 'open-satchel', {
        actionKind: 'open_satchel',
        tone: 'bronze',
        source: 'live',
        testId: 'manual-pavilion-inspector-secondary-action',
      }),
      viewTechniquesButton: previewButton,
    };
  }

  if (lifecycle === 'studying') {
    return {
      buyButton: disabledBase('Studying', 'This manual is already being studied.', 'manual-pavilion-inspector-primary-action'),
      studyLaterButton: createManualPavilionButton('live-open-satchel', MANUAL_ACTION_LABELS.open_satchel, 'open-satchel', {
        actionKind: 'open_satchel',
        tone: 'bronze',
        source: 'live',
        testId: 'manual-pavilion-inspector-secondary-action',
      }),
      viewTechniquesButton: previewButton,
    };
  }

  if (lifecycle === 'learned') {
    return {
      buyButton: createManualPavilionButton('live-open-techniques', MANUAL_ACTION_LABELS.open_techniques, 'view-techniques', {
        actionKind: 'open_techniques',
        tone: 'jade',
        source: 'live',
        testId: 'manual-pavilion-inspector-primary-action',
      }),
      studyLaterButton: createManualPavilionButton('live-view-rank-progress', MANUAL_ACTION_LABELS.view_rank_progress, 'view-techniques', {
        actionKind: 'view_rank_progress',
        tone: 'bronze',
        source: 'live',
        testId: 'manual-pavilion-inspector-secondary-action',
      }),
      viewTechniquesButton: createManualPavilionButton('live-open-satchel', MANUAL_ACTION_LABELS.open_satchel, 'open-satchel', {
        actionKind: 'open_satchel',
        tone: 'neutral',
        source: 'live',
        testId: 'manual-pavilion-inspector-tertiary-action',
      }),
    };
  }

  if (lifecycle === 'duplicate_fragment') {
    return {
      buyButton: createManualPavilionButton('live-buy-duplicate-fragments', MANUAL_ACTION_LABELS.buy_duplicate_fragments, 'buy-manual', {
        actionKind: 'buy_duplicate_fragments',
        tone: 'jade',
        source: 'live',
        testId: 'manual-pavilion-inspector-primary-action',
      }),
      studyLaterButton: createManualPavilionButton('live-view-rank-progress', MANUAL_ACTION_LABELS.view_rank_progress, 'view-techniques', {
        actionKind: 'view_rank_progress',
        tone: 'bronze',
        source: 'live',
        testId: 'manual-pavilion-inspector-secondary-action',
      }),
      viewTechniquesButton: createManualPavilionButton('live-open-techniques', MANUAL_ACTION_LABELS.open_techniques, 'view-techniques', {
        actionKind: 'open_techniques',
        tone: 'neutral',
        source: 'live',
        testId: 'manual-pavilion-inspector-tertiary-action',
      }),
    };
  }

  const reason = lifecycle === 'sealed'
    ? 'This spine is sealed for now.'
    : lifecycle === 'not_sold_here'
      ? 'This manual is not sold by this pavilion.'
      : 'This manual has already been purchased.';
  return {
    buyButton: disabledBase(MANUAL_LIFECYCLE_LABELS[lifecycle] ?? 'Unavailable', reason, 'manual-pavilion-inspector-primary-action'),
    studyLaterButton: createManualPavilionButton('live-open-satchel', MANUAL_ACTION_LABELS.open_satchel, 'open-satchel', {
      actionKind: 'open_satchel',
      tone: 'bronze',
      source: 'live',
      testId: 'manual-pavilion-inspector-secondary-action',
    }),
    viewTechniquesButton: previewButton,
  };
}

export function buildManualPavilionExactSurfaceFromStores(
  cityId: string,
  options: BuildManualPavilionExactSurfaceOptions = {},
): ManualPavilionExactSurfaceV1 {
  if (options.mode === 'fixture') {
    return createManualPavilionExactMockupFixture();
  }

  const nowMs = options.nowMs ?? Date.now();
  const content = useContentStore.getState();
  const requestedCity = content.maps.citiesById[cityId] ?? null;
  const city = requestedCity ?? content.citiesSorted[0] ?? null;
  const resolvedCityId = city?.id ?? cityId ?? MANUAL_PAVILION_DEFAULT_CITY_ID;
  const pavilionId = resolvePavilionId(city, options.pavilionId);
  const pavilion = pavilionId ? content.maps.pavilionsById[pavilionId] ?? null : null;
  const stock = pavilionId ? useManualPavilionStore.getState().stockByPavilionId[pavilionId] ?? null : null;
  const missingDataFallbacks: string[] = [];

  if (!requestedCity) missingDataFallbacks.push(`City ${cityId} unavailable.`);
  if (!pavilionId) missingDataFallbacks.push('Manual Pavilion reference unavailable from city refs.');
  if (pavilionId && !pavilion) missingDataFallbacks.push(`Pavilion ${pavilionId} unavailable in content maps.`);
  if (pavilion && !stock) missingDataFallbacks.push(`Stock for ${pavilionId} has not been generated yet.`);

  if (!pavilion || !stock) {
    return fallbackSurface({
      cityId: resolvedCityId,
      pavilionId,
      missingDataFallbacks,
      nowMs,
      cityName: city?.name,
    });
  }

  let buildAnalysis: BuildAnalysis;
  try {
    buildAnalysis = analyzeSelectedBuild(buildDoctrineSnapshot());
  } catch {
    buildAnalysis = {
      loadoutId: 'fallback',
      archetypeId: null,
      pathAlignmentScore: 0,
      familyCoverage: {} as BuildAnalysis['familyCoverage'],
      supportCoverage: {} as BuildAnalysis['supportCoverage'],
      emptyUnlockedSlots: 0,
      masteryFloorMet: true,
      rankFloorMet: true,
      runeFloorMet: true,
      equippedTechniques: [],
      gaps: [],
    };
    missingDataFallbacks.push('Build analysis unavailable; generic doctrine copy used.');
  }

  const primaryScored = selectPrimarySlots({
    stock,
    techniquesById: content.maps.techniquesById,
    buildAnalysis,
  });
  const selectedSlotIndex = resolveSelectedSlotIndex({
    requested: options.selectedSlotIndex,
    primary: primaryScored,
  });
  const surfacedSlots = primaryScored.map((scored, index) => buildSpineSurface({
    scored,
    selectedSlotIndex,
    visualIndex: index,
    canAfford: inventoryCanAfford(scored.slot),
    buildAnalysis,
  }));
  while (surfacedSlots.length < MANUAL_PAVILION_PRIMARY_SLOT_COUNT) {
    surfacedSlots.push(placeholderSpine(surfacedSlots.length + 1, 'synthetic'));
  }
  const selectedSlot = surfacedSlots.find((slot) => slot.slotIndex === selectedSlotIndex) ?? surfacedSlots[0] ?? null;
  const selectedScored = selectedSlot?.slotIndex
    ? primaryScored.find((entry) => entry.slot.slotIndex === selectedSlot.slotIndex) ?? null
    : null;
  const selectedAnalysis = selectedAnalysisFor(selectedSlot, primaryScored);
  const satchel = useManualSatchelStore.getState();
  const satchelCount = satchel.manuals.length + (satchel.activeStudy ? 1 : 0);
  const activeStudyName = satchel.activeStudy
    ? (content.maps.techniquesById[satchel.activeStudy.manual.techId]?.name ?? satchel.activeStudy.manual.techId)
    : null;
  const inspectorActions = buildInspectorActions({
    selected: selectedSlot,
    rawSlot: selectedScored?.slot ?? null,
    activeStudyName,
  });
  const collection = useTechCollectionStore.getState();
  const ownedCount = Object.values(collection.unlockedTechs).filter((entry) => entry.unlocked).length;
  const totalTechniques = Object.keys(content.maps.techniquesById).length;
  const fragmentTotal = Object.values(collection.fragments).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const refreshRemaining = stock.nextRefreshAt - nowMs;
  const refreshState = resolveRefreshState(stock, nowMs);
  const refreshReady = refreshState === 'free_ready';
  const pity = resolvePity(stock);
  const lastErrorMessage = useManualPavilionStore.getState().lastError;

  return baseSurface({
    mode: 'live',
    source: 'stores',
    cityId: resolvedCityId,
    pavilionId,
    selectedSlotIndex: selectedSlot?.slotIndex ?? null,
    selectedTechniqueId: selectedSlot?.techniqueId ?? null,
    breadcrumb: `${city?.name ?? 'City'} / Manual Pavilion`,
    stockRefreshLabel: `Stock Refresh: ${refreshReady ? 'Ready' : formatDurationCompact(refreshRemaining)}`,
    stockRefreshTone: refreshReady ? 'positive' : 'neutral',
    buildGapLine: buildGapLine(buildAnalysis),
    buildGapChips: buildGapChips({ build: buildAnalysis, selected: selectedSlot }),
    ledgerRows: [
      fact('live-stock-total', 'Stock', `${stock.slots.length} manuals`, 'neutral', 'live', 'recordSlip'),
      fact('live-stock-visible', 'Recommended', `${Math.min(stock.slots.length, MANUAL_PAVILION_PRIMARY_SLOT_COUNT)} shown`, 'jade', 'live', 'sealJade'),
      fact('live-refresh-bias', 'Refresh Bias', buildAnalysis.pathAlignmentScore > 0 ? 'Path-aligned' : 'Balanced', 'jade', 'derived', 'inkRefresh'),
      fact('live-owned', 'Owned', `${ownedCount} / ${totalTechniques || 0}`, 'neutral', 'live', 'bookHeaven'),
      fact('live-fragments', 'Fragments', formatThousands(fragmentTotal), 'warning', 'live', 'dustPurple'),
      fact('live-current-need', 'Current Need', buildNeedLabel(buildAnalysis), 'critical', 'derived', 'inkShield'),
    ],
    primarySlots: surfacedSlots,
    selectedSlot,
    totalStockLabel: `Showing ${Math.min(stock.slots.length, MANUAL_PAVILION_PRIMARY_SLOT_COUNT)} of ${stock.slots.length}`,
    inspectorRows: buildInspectorRows({ selected: selectedSlot, analysis: selectedAnalysis }),
    whyRows: buildWhyRows({ selected: selectedSlot, analysis: selectedAnalysis, build: buildAnalysis }),
    costLine: selectedSlot?.priceLabel ?? 'Unavailable',
    buyButton: inspectorActions.buyButton,
    studyLaterButton: inspectorActions.studyLaterButton,
    viewTechniquesButton: inspectorActions.viewTechniquesButton,
    refreshButton: createManualPavilionButton('live-refresh-stock', refreshReady ? 'Free Refresh' : 'Refresh Locked', 'refresh-stock', {
      actionKind: refreshReady ? 'free_refresh' : 'none',
      enabled: Boolean(pavilionId && refreshReady),
      disabledReason: !pavilionId
        ? 'Pavilion reference is unavailable.'
        : refreshReady
          ? null
          : 'Stock refresh is still cooling down.',
      tone: refreshReady ? 'jade' : 'bronze',
      source: 'live',
      testId: 'manual-pavilion-refresh-button',
    }),
    refreshState,
    refreshCostLine: refreshLineForState(refreshState, refreshRemaining),
    pityLabel: pity.pityLabel,
    pityProgressLabel: pity.pityProgressLabel,
    pityProgressPct: pity.pityProgressPct,
    pityRows: pity.pityRows,
    satchelLabel: `Manual Satchel ${satchelCount} manuals`,
    currencyRows: currencyRows(),
    feedback: {
      lastPurchaseMessage: null,
      lastErrorMessage,
    },
    debug: {
      missingDataFallbacks,
      notes: [MANUAL_PAVILION_VISIBLE_SLOT_ORDER_NOTE],
    },
  });
}
