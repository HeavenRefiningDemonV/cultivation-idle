import type { GameTab, WorldBuildingKey } from '../../stores/uiStore.js';

export type PavilionSurfaceMode = 'fixture' | 'live';

export type PavilionRecordState =
  | 'sealed'
  | 'rumored'
  | 'recorded'
  | 'studied'
  | 'mastered';

export type PavilionRecordSignal =
  | 'recommendedNow'
  | 'warning'
  | 'future';

export interface PavilionSaveState {
  selectedEntryId: string | null;
  selectedCategoryId: string | null;
  searchQuery: string;
  activeFilters: string[];
  stateByEntryId: Record<string, PavilionRecordState>;
  seenEntryIds: string[];
  recordedEntryIds: string[];
  studiedEntryIds: string[];
  masteredEntryIds: string[];
  pinnedEntryIds: string[];
  recentEntryIds: string[];
  dismissedGuidanceIds: string[];
  priorLifeAnnotations: Record<string, string[]>;
  entryUnlockVersion: number;
}

export interface PavilionRecordDebug {
  generated: boolean;
  sourceFamily?: string;
  sourceId?: string;
  unresolvedRelations: string[];
}

export interface PavilionRecord {
  id: string;
  title: string;
  categoryId: string;
  categoryLabel: string;
  state: PavilionRecordState;
  tags: string[];
  plain: string;
  why?: string;
  sect?: string;
  how?: string;
  used?: string;
  mistakes?: string[];
  related: string[];
  route: string[];
  unlock?: string;
  jade: string;
  quickRule?: string;
  whenToRead?: string;
  playerQuestion?: string;
  actionSteps?: string[];
  readinessChecks?: string[];
  bestSources?: string[];
  fallbackSources?: string[];
  numbersToWatch?: string[];
  diagnosis?: string[];
  elder?: string | null;
  prior?: string | null;
  aliases?: string[];
  implementation: string;
  searchText: string;
  signals?: PavilionRecordSignal[];
  sourceUse?: PavilionSourceUseSurface[];
  debug: PavilionRecordDebug;
}

export interface PavilionFilterChipSurface {
  id: string;
  label: string;
  active: boolean;
}

export interface PavilionCategorySurface {
  id: string;
  label: string;
  selected: boolean;
  count: number;
  stateKind: PavilionRecordState;
  signal?: PavilionRecordSignal;
}

export interface PavilionRecordListItemSurface {
  id: string;
  title: string;
  categoryId: string;
  categoryLabel: string;
  stateKind: PavilionRecordState;
  signals: PavilionRecordSignal[];
  generated: boolean;
  selected: boolean;
  summary: string;
}

export interface PavilionRecordListSurface {
  title: string;
  mode: 'category' | 'search';
  emptyLabel: string;
  totalMatches: number;
  records: PavilionRecordListItemSurface[];
}

export interface PavilionTagSurface {
  id: string;
  label: string;
  tone: 'jade' | 'bronze' | 'amber' | 'blue' | 'red';
}

export interface PavilionEntrySectionSurface {
  id: string;
  number: number;
  title: string;
  body?: string;
  tone?: 'plain' | 'warning' | 'positive' | 'muted';
  rows?: PavilionSectionRowSurface[];
}

export interface PavilionSectionRowSurface {
  id: string;
  label: string;
  value?: string;
  status?: 'complete' | 'warning' | 'open' | 'sealed';
  routeLabel?: string;
  routeAction?: PavilionRouteActionKind;
}

export interface PavilionRequirementSurface {
  id: string;
  label: string;
  status: 'complete' | 'warning' | 'open' | 'sealed';
  detail?: string;
}

export interface PavilionSourceUseSurface {
  id: string;
  label: string;
  value: string;
  kind: 'source' | 'usedFor' | 'requirement' | 'debug';
  routeLabel?: string;
}

export type PavilionRouteActionKind =
  | 'routeCultivation'
  | 'routeWorld'
  | 'routeGateTrial'
  | 'routeApothecary'
  | 'routeForge'
  | 'routeManualPavilion'
  | 'routeRuins'
  | 'routeBountyBoard'
  | 'routeExpeditions'
  | 'routeTechniques'
  | 'routePrestige'
  | 'openLifeProfile'
  | 'askRecords'
  | 'focusSearch'
  | 'selectEntry'
  | 'none';

export interface PavilionRouteButtonSurface {
  id: string;
  label: string;
  action: PavilionRouteActionKind;
  enabled: boolean;
  disabledReason?: string;
  targetTab?: GameTab;
  worldBuildingKey?: WorldBuildingKey;
  targetEntryId?: string;
}

export interface PavilionRelatedEntrySurface {
  id: string;
  label: string;
  stateKind: PavilionRecordState;
  targetEntryId?: string;
  routeLabel?: string;
  unresolved?: boolean;
}

export interface PavilionCurrentRelevanceSurface {
  label: string;
  body: string;
  tone: 'warning' | 'positive' | 'neutral';
}

export interface PavilionEntrySurface {
  id: string;
  title: string;
  categoryId: string;
  categoryLabel: string;
  stateLabel: string;
  stateKind: PavilionRecordState;
  signals: PavilionRecordSignal[];
  tags: PavilionTagSurface[];
  sections: PavilionEntrySectionSurface[];
  requirements: PavilionRequirementSurface[];
  sourceUseBlocks: PavilionSourceUseSurface[];
  routeButtons: PavilionRouteButtonSurface[];
  relatedEntries: PavilionRelatedEntrySurface[];
  currentRelevance: PavilionCurrentRelevanceSurface | null;
  debug: PavilionRecordDebug;
}

export interface PavilionThreadsBlockSurface {
  id: string;
  title: string;
  items: PavilionRelatedEntrySurface[];
}

export interface PavilionThreadsSurface {
  title: 'Threads of Karma';
  blocks: PavilionThreadsBlockSurface[];
}

export interface PavilionElderNoteSurface {
  title: 'Elder Note';
  body: string;
  checklist: Array<{
    id: string;
    label: string;
    status: 'warning' | 'complete' | 'open';
  }>;
}

export interface PavilionRecordStateLegendSurface {
  id: string;
  label: string;
  tooltip: string;
  kind: PavilionRecordState | PavilionRecordSignal | 'priorLife';
}

export interface PavilionJadeSlipSurface {
  entryId: string;
  title: string;
  body: string;
}

export interface PavilionSurfaceV1 {
  meta: {
    mode: PavilionSurfaceMode;
    selectedEntryId: string;
    selectedCategoryId: string;
    rootTestId: 'pavilion-exact-page';
    generatedAt: number;
    contentVersion: string;
  };
  page: {
    title: 'Pavilion of Ten Thousand Records';
    subtitle: 'Jade Slip Archive';
    titleSealText?: string;
  };
  currentLifeRibbon: {
    realm: string;
    path: string;
    heartLaw: string;
    city: string;
    milestone: string;
    display: string;
  };
  search: {
    query: string;
    placeholder: 'Search the Records';
    filterChips: PavilionFilterChipSurface[];
  };
  categories: PavilionCategorySurface[];
  recordList: PavilionRecordListSurface;
  selectedEntry: PavilionEntrySurface;
  rightRail: PavilionThreadsSurface;
  elderNote: PavilionElderNoteSurface | null;
  recordStatesLegend: PavilionRecordStateLegendSurface[];
  footer: {
    breadcrumbs: string[];
    recordsDiscoveredLabel: string;
    studiedLabel: string;
    masteredLabel: string;
  };
  jadeSlipDrawer: PavilionJadeSlipSurface | null;
  debug: {
    unresolvedLinks: string[];
    generatedCounts: Record<string, number>;
    missingRuntimeData: string[];
    routeFailures: string[];
  };
}

export interface PavilionRuntimeSnapshot {
  realm: string;
  path: string;
  heartLaw: string;
  city: string;
  milestone: string;
  currentCityId: string | null;
  cityModules: string[];
  recommendedEntryIds: string[];
  medicineWeak: boolean;
  weaponFloorClose: boolean;
  loadoutComplete: boolean;
  priorLifeNotes: Record<string, string[]>;
  missingRuntimeData: string[];
}
