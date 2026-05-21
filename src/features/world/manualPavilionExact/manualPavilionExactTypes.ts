import type { IconId } from '../../../ui/icons/index.js';
import type { DaoMandateModuleSourceSinkProjection } from '../../../systems/ui/daoMandate/index.js';
import type { TechniqueVisualIdentity, VisualBadgeSurface } from '../../techniques/techniqueVisualIdentity.js';

export type ManualPavilionExactMode = 'fixture' | 'live';
export type ManualPavilionExactValueSource = 'fixture' | 'live' | 'derived' | 'content' | 'synthetic';
export type ManualPavilionExactTone =
  | 'neutral'
  | 'positive'
  | 'warning'
  | 'critical'
  | 'locked'
  | 'recommended'
  | 'jade'
  | 'bronze';
export type ManualPavilionSpineState =
  | 'available'
  | 'selected'
  | 'recommended'
  | 'new'
  | 'duplicate'
  | 'fragment'
  | 'sold'
  | 'sealed'
  | 'notSold'
  | 'locked'
  | 'placeholder';
export type ManualPavilionButtonIntent =
  | 'return-to-world'
  | 'select-spine'
  | 'buy-manual'
  | 'study-later'
  | 'view-techniques'
  | 'refresh-stock'
  | 'open-satchel'
  | 'disabled';

export type ManualLifecycleState =
  | 'unowned_affordable'
  | 'unowned_unaffordable'
  | 'owned_unstudied'
  | 'studying'
  | 'learned'
  | 'duplicate_fragment'
  | 'sold'
  | 'sealed'
  | 'not_sold_here';

export type ManualPrimaryReason =
  | 'fills_empty_slot'
  | 'path_aligned'
  | 'role_fix'
  | 'survival_fix'
  | 'damage_fix'
  | 'support_manual'
  | 'new_technique'
  | 'duplicate_fragments'
  | 'gate_prep'
  | 'collection';

export type ManualSelectionState = 'selected' | 'idle';
export type ManualStockState = 'new' | 'duplicate' | 'sold' | 'sealed' | 'not_sold_here' | 'locked';
export type ManualRecommendationState = ManualPrimaryReason | 'none';
export type RefreshActionState = 'free_ready' | 'cooldown_locked' | 'rush_affordable' | 'rush_unaffordable' | 'refreshing';
export type ManualSpineTitleLength = 'short' | 'medium' | 'long' | 'veryLong';

export type ManualPavilionActionKind =
  | 'buy_and_study'
  | 'buy_to_satchel'
  | 'buy_duplicate_fragments'
  | 'start_study'
  | 'open_satchel'
  | 'preview_technique'
  | 'open_techniques'
  | 'view_rank_progress'
  | 'free_refresh'
  | 'rush_refresh'
  | 'return_world'
  | 'none';

export type ManualPavilionSpineColorKey =
  | 'umber'
  | 'cinnabar'
  | 'jade'
  | 'indigo'
  | 'bone'
  | 'lacquer'
  | 'neutral';

export interface ManualPavilionButtonSurface {
  id: string;
  label: string;
  ariaLabel: string;
  intent: ManualPavilionButtonIntent;
  actionKind: ManualPavilionActionKind;
  enabled: boolean;
  visible: boolean;
  disabledReason?: string | null;
  tone: ManualPavilionExactTone;
  source: ManualPavilionExactValueSource;
  testId: string;
}

export interface ManualPavilionChipSurface {
  id: string;
  label: string;
  iconKey?: string;
  tone: ManualPavilionExactTone;
  source: ManualPavilionExactValueSource;
}

export interface ManualPavilionFactRowSurface {
  id: string;
  label: string;
  value: string;
  iconKey?: string;
  tone: ManualPavilionExactTone;
  source: ManualPavilionExactValueSource;
  rowKind?: string;
  detail?: string;
  badge?: VisualBadgeSurface;
}

export interface ManualPavilionSpineSurface {
  id: string;
  slotIndex: number | null;
  stockId: number | null;
  techniqueId: string | null;
  manualInstanceId?: string | null;
  title: string;
  shortTitle: string;
  displayTitle: string;
  titleLength: ManualSpineTitleLength;
  gradeLabel: string;
  rarityLabel: string;
  pathLabel: string;
  familyLabel: string;
  roleLabel: string;
  state: ManualPavilionSpineState;
  stateLabel: string;
  lifecycleState: ManualLifecycleState;
  lifecycleLabel: string;
  stockState: ManualStockState;
  recommendationState: ManualRecommendationState;
  primaryReason: ManualPrimaryReason;
  primaryReasonLabel: string;
  secondaryReasons: string[];
  selectionState: ManualSelectionState;
  canAfford: boolean;
  selected: boolean;
  recommended: boolean;
  duplicate: boolean;
  locked: boolean;
  sold: boolean;
  sealed: boolean;
  notSold: boolean;
  priceLabel: string;
  ariaLabel: string;
  testId: string;
  tags: ManualPavilionChipSurface[];
  visualIdentity: TechniqueVisualIdentity;
  displayBadges: {
    grade: VisualBadgeSurface;
    rarity: VisualBadgeSurface;
    path: VisualBadgeSurface;
    role: VisualBadgeSurface;
  };
  spineVisual: {
    colorKey: ManualPavilionSpineColorKey;
    assetKey: string;
    iconKey: string;
    pathIconKey: string;
    roleIconKey: string;
    sealKey: string;
  };
  source: ManualPavilionExactValueSource;
}

export interface ManualPavilionExactAssets {
  background: {
    room: string;
    cityManual: string;
    textureOverlay: string;
  };
  spines: {
    heaven: string;
    earth: string;
    martial: string;
    neutral: string;
    fallback: string;
  };
  chrome: {
    scroll: string;
    buttonCorners: string;
    barLong: string;
    barShort: string;
    blockFancy: string;
  };
}

export interface ManualPavilionExactSurfaceV1 {
  meta: {
    surfaceId: 'manual-pavilion-exact';
    version: string;
    mode: ManualPavilionExactMode;
    source: 'fixture' | 'stores';
    cityId: string;
    pavilionId: string | null;
    selectedSlotIndex: number | null;
    selectedTechniqueId: string | null;
    targetMockupId: string;
    rootTestId: 'manual-pavilion-exact-page';
  };
  shell: {
    useScreenOwnedExactPage: true;
    showLegacyPanel: false;
    showGenericWorldClose: false;
    showContextStrip: false;
    showBottomNav: false;
    singleDominantShelf: true;
  };
  assets: ManualPavilionExactAssets;
  page: {
    title: 'Manual Pavilion';
    subtitle: string;
    breadcrumb: string;
    stockRefreshLabel: string;
    stockRefreshTone: ManualPavilionExactTone;
    returnButton: ManualPavilionButtonSurface;
  };
  buildGapBanner: {
    title: 'Current Build Gap';
    line: string;
    sealTone: ManualPavilionExactTone;
    sealIconKey: string;
    chips: ManualPavilionChipSurface[];
  };
  leftLedger: {
    title: string;
    rows: ManualPavilionFactRowSurface[];
  };
  shelf: {
    title: string;
    subtitle: string;
    primarySlots: ManualPavilionSpineSurface[];
    selectedSlot: ManualPavilionSpineSurface | null;
    totalStockLabel: string;
    shelfVisualKey: string;
  };
  inspector: {
    visible: boolean;
    title: string;
    stateStamp: string;
    stateTone: ManualPavilionExactTone;
    lifecycleState: ManualLifecycleState | null;
    selectedTechniqueId: string | null;
    rows: ManualPavilionFactRowSurface[];
    whyTitle: 'Why this matters now';
    whyRows: ManualPavilionFactRowSurface[];
    costTitle: string;
    costLine: string;
    buyButton: ManualPavilionButtonSurface;
    studyLaterButton: ManualPavilionButtonSurface;
    viewTechniquesButton: ManualPavilionButtonSurface;
    footerNote: string | null;
  };
  bottomStrip: {
    refreshButton: ManualPavilionButtonSurface;
    refreshState: RefreshActionState;
    refreshCostLine: string;
    pityLabel: string;
    pityProgressLabel: string;
    pityProgressPct: number;
    pityRows: ManualPavilionFactRowSurface[];
    satchelButton: ManualPavilionButtonSurface;
    satchelLabel: string;
    currencyRows: ManualPavilionFactRowSurface[];
  };
  feedback: {
    lastPurchaseMessage: string | null;
    lastErrorMessage: string | null;
  };
  mandateSourceSink?: DaoMandateModuleSourceSinkProjection | null;
  debug?: {
    missingDataFallbacks: string[];
    notes: string[];
  };
}

export type ManualPavilionIconKey = IconId | 'sealRed' | 'sealJade' | 'sealBronze' | 'none';
