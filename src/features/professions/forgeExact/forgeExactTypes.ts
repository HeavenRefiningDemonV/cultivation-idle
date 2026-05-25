import type { WorldBuildingKey } from '../../../stores/uiStore.js';
export type ForgeExactTab = 'refine' | 'temper' | 'runes';
export type ForgeExactMode = 'idle' | 'assisted' | 'handsOn';
export type ForgeExactSurfaceMode = 'fixture' | 'live';
export type ForgeExactActivityMode =
  | 'fixture'
  | 'planning'
  | 'blocked'
  | 'queued'
  | 'active'
  | 'readyToClaim'
  | 'result';

export type ForgeExactStatus =
  | 'met'
  | 'missing'
  | 'warning'
  | 'locked'
  | 'recommended'
  | 'neutral';

export type ForgeExactAssetKey =
  | 'paperBackground'
  | 'refineCenter'
  | 'temperCenter'
  | 'runesCenter';

export type ForgeExactIconId =
  | 'ancientSeed'
  | 'artifactBundle'
  | 'artifactShard'
  | 'beastBlood'
  | 'bookEarth'
  | 'bookHeaven'
  | 'bookMartial'
  | 'dustBlue'
  | 'dustBrown'
  | 'dustGray'
  | 'dustGreen'
  | 'dustPurple'
  | 'foundationPill'
  | 'herbBundle'
  | 'hourglassEmpty'
  | 'hourglassProgress'
  | 'jadeSword'
  | 'metalChunk'
  | 'placeholderRingLarge'
  | 'placeholderRingSmall'
  | 'prayerBeads'
  | 'rustySword'
  | 'spiritGrass'
  | 'taskComplete'
  | 'inkBolt'
  | 'inkBurst'
  | 'inkCheck'
  | 'inkChevronDown'
  | 'inkChevronUp'
  | 'inkHeart'
  | 'inkLock'
  | 'inkRefresh'
  | 'inkShield'
  | 'inkSparkles'
  | 'inkSwirl'
  | 'inkWarning'
  | 'inkWip'
  | 'inkX';

export interface ForgeExactAssetDescriptor {
  key: ForgeExactAssetKey;
  src: string;
  role: string;
  sourcePath: string;
  status: 'ready' | 'missing' | 'fallback';
  fallbackSourcePath?: string;
}

export type ForgeExactAssetMap = Record<ForgeExactAssetKey, ForgeExactAssetDescriptor>;

export interface ForgeExactChip {
  id: string;
  label: string;
  status: ForgeExactStatus;
}

export interface ForgeExactTruthCell {
  id: string;
  label: string;
  value: string;
  icon: ForgeExactIconId;
  status: ForgeExactStatus;
}

export interface ForgeExactTabRow {
  id: ForgeExactTab;
  label: string;
  icon: ForgeExactIconId;
  selected: boolean;
  enabled: boolean;
  status: ForgeExactStatus;
  description?: string;
}

export interface ForgeExactModeRow {
  id: ForgeExactMode;
  label: string;
  selected: boolean;
  enabled: boolean;
  badge?: string;
  note?: string;
  status: ForgeExactStatus;
}

export interface ForgeExactToolRow {
  id: string;
  label: string;
  value: string;
  icon: ForgeExactIconId;
  status: ForgeExactStatus;
}

export interface ForgeExactButtonSurface {
  id: string;
  label: string;
  enabled: boolean;
  reasonIfDisabled?: string;
  variant: 'primary' | 'secondary' | 'route' | 'ghost';
  intent:
    | 'start-forge'
    | 'claim-forge'
    | 'route-source'
    | 'select-tab'
    | 'select-mode'
    | 'select-slot'
    | 'dismiss-result'
    | 'disabled';
  mode?: ForgeExactMode;
  tab?: ForgeExactTab;
  targetSlot?: 'weapon' | 'accessory';
  route?: {
    cityId: string | null;
    moduleKey: WorldBuildingKey | null;
  };
}

export interface ForgeExactCenterStage {
  assetKey: ForgeExactAssetKey;
  title: string;
  subtitle: string;
  mood: 'refine' | 'temper' | 'runes';
  workpieceLabel: string;
  activeSessionEmbedded: boolean;
  readinessSeal: {
    kicker: string;
    title: string;
    stat: string;
    detail: string;
    status: ForgeExactStatus;
  };
  resultOverlay?: {
    title: string;
    lines: string[];
  };
}

export interface ForgeExactMaterialRow {
  id: string;
  label: string;
  ownedLabel: string;
  neededLabel: string;
  valueLabel: string;
  icon: ForgeExactIconId;
  status: ForgeExactStatus;
}

export interface ForgeExactPreviewRow {
  id: string;
  label: string;
  before: string;
  after: string;
  status: ForgeExactStatus;
}

export interface ForgeExactSourceButton extends ForgeExactButtonSurface {
  intent: 'route-source';
  variant: 'route';
  icon: ForgeExactIconId;
}

export interface ForgeExactMaterialInspector {
  title: 'Material Inspector';
  materialsTitle: 'Materials';
  materialRows: ForgeExactMaterialRow[];
  outputPreview: {
    title: 'Output Preview';
    itemName: string;
    itemIcon: ForgeExactIconId;
    upgradeLabel: string;
    rows: ForgeExactPreviewRow[];
  };
  bestSources: {
    title: 'Best Sources';
    buttons: ForgeExactSourceButton[];
  };
  recommendation: {
    title: 'Recommendation';
    headline: string;
    reason: string;
    status: ForgeExactStatus;
  };
}

export interface ForgeExactFloorNode {
  id: string;
  label: string;
  value: string;
  icon: ForgeExactIconId;
  status: ForgeExactStatus;
}

export interface ForgeExactFloorRail {
  title: 'Permanent Floor';
  nodes: readonly [
    ForgeExactFloorNode,
    ForgeExactFloorNode,
    ForgeExactFloorNode,
    ForgeExactFloorNode,
    ForgeExactFloorNode,
  ];
  comparisonLine: string;
}

export interface ForgeExactActionResult {
  ok: boolean;
  title: string;
  lines: string[];
}

export interface ForgeExactSurfaceV1 {
  meta: {
    surfaceId: 'forge-exact';
    version: 1;
    mode: ForgeExactSurfaceMode;
    cityId: string | null;
    cityName: string;
    activeTab: ForgeExactTab;
    activeMode: ForgeExactMode;
    activityMode: ForgeExactActivityMode;
    selectedBlueprintId: string | null;
    selectedTargetSlot?: 'weapon' | 'accessory';
    readyJobId?: string | null;
    rootTestId: 'forge-exact-page';
  };
  shell: {
    useScreenOwnedExactPage: true;
    showLegacyForgeWorkshop: false;
    singleDominantCta: true;
    bottomNavVisible: boolean;
    assetWarnings: string[];
  };
  assets: ForgeExactAssetMap;
  page: {
    title: 'Forge';
    subtitle: 'Permanent floor workshop';
  };
  topTruthStrip: readonly [
    ForgeExactTruthCell,
    ForgeExactTruthCell,
    ForgeExactTruthCell,
    ForgeExactTruthCell,
    ForgeExactTruthCell,
    ForgeExactTruthCell,
    ForgeExactTruthCell,
  ];
  centerHeader: {
    title: string;
    subtitle: string;
    chips: ForgeExactChip[];
  };
  leftRail: {
    title: 'Forge Discipline';
    tabs: ForgeExactTabRow[];
    modes: ForgeExactModeRow[];
    tools: ForgeExactToolRow[];
  };
  centerStage: ForgeExactCenterStage;
  rightInspector: ForgeExactMaterialInspector;
  floorRail: ForgeExactFloorRail;
  primaryAction: ForgeExactButtonSurface;
  secondaryActions: ForgeExactButtonSurface[];
  debug?: {
    notes: string[];
    visibleBlueprintIds?: string[];
    hiddenBlueprintLeakCheck?: string[];
  };
}
