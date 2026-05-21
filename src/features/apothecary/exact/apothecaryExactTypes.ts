import type { DaoMandateModuleSourceSinkProjection } from '../../../systems/ui/daoMandate/index.js';

export type ApothecaryExactMode = 'fixture' | 'live' | 'live-content-parity';
export type ApothecaryExactSource = 'fixture' | 'live' | 'fallback';
export type ApothecaryExactTone = 'neutral' | 'ready' | 'warning' | 'danger' | 'gold' | 'muted';
export type ApothecaryExactRouteTarget =
  | 'apothecary'
  | 'gateTrial'
  | 'ruins'
  | 'outskirts'
  | 'expeditions'
  | 'bounties'
  | 'manualPavilion'
  | 'forge'
  | 'inventory'
  | 'unknown';

export type ApothecaryExactFocus = 'prescription' | 'buy' | 'brew' | 'pouch' | 'source';

export type ApothecaryExactAssetKey =
  | 'room.scenicPlate'
  | 'frames.prescription'
  | 'objects.medicinePouch'
  | 'frames.primaryCta'
  | 'frames.laneDefault'
  | 'frames.laneReady'
  | 'frames.laneWarning'
  | 'frames.laneDisabled'
  | 'frames.laneSelected'
  | 'frames.laneRecommended'
  | 'remedies.healingPellet'
  | 'remedies.wardSalt'
  | 'remedies.focusDew'
  | 'remedies.meridianTea'
  | 'remedies.ironbloodPellet'
  | 'remedies.qiElixir'
  | 'remedies.spiritLeaf'
  | 'remedies.moonDew'
  | 'remedies.genericPowder'
  | 'sources.buy'
  | 'sources.apothecaryShelf'
  | 'sources.brew'
  | 'sources.herb'
  | 'sources.outskirts'
  | 'sources.ruins'
  | 'sources.expedition'
  | 'sources.bounty'
  | 'sources.forge'
  | 'sources.manual'
  | 'sources.gate'
  | 'sources.inventory'
  | 'sources.meritExchange'
  | 'sources.locked'
  | 'warnings.healing'
  | 'warnings.specialty'
  | 'warnings.pouch'
  | 'warnings.unknown'
  | 'warnings.locked';

export interface ApothecaryExactAssetDescriptor {
  key: ApothecaryExactAssetKey;
  src: string;
  role: string;
  sourcePath: string;
  status: 'ready' | 'missing' | 'placeholder';
  required: boolean;
  allowedAsFlattenedMockupSubstitute: false;
}

export type ApothecaryExactAssetMap = Record<ApothecaryExactAssetKey, ApothecaryExactAssetDescriptor>;

export type ApothecaryExactButtonIntent =
  | 'buy-row'
  | 'brew-row'
  | 'source-row'
  | 'configure-pouch'
  | 'autofill-pouch'
  | 'buy-missing'
  | 'brew-missing'
  | 'source-ingredients'
  | 'prepare-package'
  | 'return-gate'
  | 'disabled';

export interface ApothecaryExactButtonSurface {
  id: string;
  label: string;
  ariaLabel: string;
  intent: ApothecaryExactButtonIntent;
  enabled: boolean;
  tone: ApothecaryExactTone;
  disabledReason?: string;
  itemId?: string | null;
  itemName?: string | null;
  stockId?: string | null;
  recipeId?: string | null;
  qty?: number;
  routeTarget?: ApothecaryExactRouteTarget;
  sourceItemId?: string | null;
}

export interface ApothecaryExactHeaderSurface {
  title: string;
  purpose: string;
  cityStatus: string;
}

export interface ApothecaryExactPrepCell {
  id: string;
  label: string;
  value: string;
  iconKey: ApothecaryExactAssetKey;
  tone: ApothecaryExactTone;
}

export interface ApothecaryExactPrescriptionRowSurface {
  id: string;
  itemId: string | null;
  itemName: string;
  optional: boolean;
  iconKey: ApothecaryExactAssetKey;
  ownedLabel: string;
  recommendedLabel: string;
  missingLabel: string;
  missingQty: number;
  tone: ApothecaryExactTone;
  actions: readonly [
    ApothecaryExactButtonSurface,
    ApothecaryExactButtonSurface,
    ApothecaryExactButtonSurface,
  ];
}

export interface ApothecaryExactPrescriptionSurface {
  title: string;
  subtitle: string;
  columns: readonly ['Item', 'Owned', 'Recommended', 'Missing', 'Actions'];
  rows: readonly ApothecaryExactPrescriptionRowSurface[];
  sealLabel: string;
}

export interface ApothecaryExactWarningChip {
  id: string;
  label: string;
  tone: ApothecaryExactTone;
  iconKey: ApothecaryExactAssetKey;
  visible: boolean;
}

export interface ApothecaryExactBuyRowSurface {
  id: string;
  itemId: string | null;
  itemName: string;
  iconKey: ApothecaryExactAssetKey;
  priceLabel: string;
  stockLabel: string;
  missingQty: number;
  action: ApothecaryExactButtonSurface;
  tone: ApothecaryExactTone;
}

export interface ApothecaryExactBuyLaneSurface {
  title: string;
  subtitle: string;
  rows: readonly ApothecaryExactBuyRowSurface[];
}

export interface ApothecaryExactBrewRowSurface {
  id: string;
  itemId: string | null;
  itemName: string;
  iconKey: ApothecaryExactAssetKey;
  outputLabel: string;
  ingredientLabel: string;
  ingredientCountLabel: string | null;
  ingredientIconKey: ApothecaryExactAssetKey;
  action: ApothecaryExactButtonSurface;
  tone: ApothecaryExactTone;
}

export interface ApothecaryExactBrewLaneSurface {
  title: string;
  subtitle: string;
  rows: readonly ApothecaryExactBrewRowSurface[];
}

export interface ApothecaryExactPouchLineSurface {
  id: string;
  label: string;
  value: string;
  tone: ApothecaryExactTone;
  iconKey: ApothecaryExactAssetKey;
}

export interface ApothecaryExactPouchCardSurface {
  title: string;
  subtitle: string;
  lines: readonly ApothecaryExactPouchLineSurface[];
  buttons: readonly [ApothecaryExactButtonSurface, ApothecaryExactButtonSurface];
}

export interface ApothecaryExactPouchObjectSurface {
  alt: string;
  action: ApothecaryExactButtonSurface;
}

export interface ApothecaryExactAttemptFitLineSurface {
  id: string;
  label: string;
  value: string;
  tone: ApothecaryExactTone;
}

export interface ApothecaryExactAttemptFitSurface {
  title: string;
  lines: readonly [
    ApothecaryExactAttemptFitLineSurface,
    ApothecaryExactAttemptFitLineSurface,
    ApothecaryExactAttemptFitLineSurface,
  ];
}

export interface ApothecaryExactPreparedStateSurface {
  status: 'idle' | 'prepared' | 'partial' | 'blocked';
  message: string;
}

export interface ApothecaryExactSurfaceV1 {
  meta: {
    surfaceId: 'apothecary-exact';
    version: 1;
    mode: ApothecaryExactMode;
    cityId: string | null;
    shopId: string | null;
    targetGateId: string | null;
    targetGateLabel: string;
    rootTestId: 'apothecary-exact-page';
    source: ApothecaryExactSource;
    focus: ApothecaryExactFocus;
  };
  shell: {
    useScreenOwnedExactPage: true;
    showLegacyTabs: false;
    showLegacyContextStrip: false;
    singleDominantCta: true;
  };
  assets: ApothecaryExactAssetMap;
  pageHeader: ApothecaryExactHeaderSurface;
  prepStrip: readonly [
    ApothecaryExactPrepCell,
    ApothecaryExactPrepCell,
    ApothecaryExactPrepCell,
    ApothecaryExactPrepCell,
    ApothecaryExactPrepCell,
    ApothecaryExactPrepCell,
    ApothecaryExactPrepCell,
  ];
  prescription: ApothecaryExactPrescriptionSurface;
  warningStrip: readonly ApothecaryExactWarningChip[];
  buyLane: ApothecaryExactBuyLaneSurface;
  brewLane: ApothecaryExactBrewLaneSurface;
  pouchCard: ApothecaryExactPouchCardSurface;
  pouchObject: ApothecaryExactPouchObjectSurface;
  bottomActions: readonly [
    ApothecaryExactButtonSurface,
    ApothecaryExactButtonSurface,
    ApothecaryExactButtonSurface,
  ];
  primaryAction: ApothecaryExactButtonSurface;
  returnAction: ApothecaryExactButtonSurface;
  attemptFit: ApothecaryExactAttemptFitSurface;
  mandateSourceSink?: DaoMandateModuleSourceSinkProjection | null;
  preparedState?: ApothecaryExactPreparedStateSurface;
  debug?: {
    notes: string[];
    contentParityWarnings: string[];
    assetWarnings: string[];
    placeholderAssetKeysInUse: string[];
  };
}
