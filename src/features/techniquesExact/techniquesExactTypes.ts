import type {
  AiProfile,
  CastingPolicy,
  TechniqueSlotType,
} from '../../types/index.js';
import type { DaoMandateModuleSourceSinkProjection } from '../../systems/ui/daoMandate/index.js';
import type { GameTab, WorldBuildingKey, WorldBuildingModalIntent } from '../../stores/uiStore.js';
import type {
  TechniqueGradeTone,
  TechniquePathTone,
  TechniqueRarityFx,
  TechniqueRarityTone,
  TechniqueRoleTone,
  TechniqueVisualIdentity,
  VisualBadgeSurface,
} from '../techniques/techniqueVisualIdentity.js';

export type TechniquesExactMode = 'fixture' | 'live' | 'legacy';
export type TechniquesExactSource = 'fixture' | 'stores';
export type TechniquesExactStatus =
  | 'idle'
  | 'selected'
  | 'equipped'
  | 'recommended'
  | 'locked'
  | 'warning'
  | 'good'
  | 'bad'
  | 'disabled';
export type TechniquesExactTone = 'ink' | 'jade' | 'bronze' | 'red' | 'amber' | 'muted';
export type TechniquesExactFilterId = 'all' | 'pathFit' | 'damage' | 'guard' | 'heal' | 'control' | 'setup';
export type TechniquesExactFeedbackTone = 'success' | 'error' | 'info' | 'idle';
export type TechniquesExactDetailIntent = 'open' | 'upgradeRank' | 'rerollTraits' | null;

export interface TechniquesExactButtonSurface {
  id: string;
  label: string;
  ariaLabel: string;
  enabled: boolean;
  variant: 'primary' | 'secondary' | 'seal' | 'ghost' | 'disabled';
  reason?: string;
  status?: TechniquesExactStatus;
}

export interface TechniquesExactChipSurface {
  id: string;
  label: string;
  value?: string;
  tone: TechniquesExactTone;
  iconId?: string;
  selected?: boolean;
}

export interface TechniquesExactFactRowSurface {
  id: string;
  label: string;
  value: string;
  detail?: string;
  tone?: TechniquesExactTone;
  status?: TechniquesExactStatus;
  iconId?: string;
  rowKind?: string;
  badge?: VisualBadgeSurface;
}

export interface TechniquesExactLoadoutRowSurface {
  id: string;
  label: string;
  subtitle: string;
  selected: boolean;
  aiProfile: AiProfile;
  castingPolicy: CastingPolicy;
  equippedCountLabel: string;
  statusLabel?: string;
}

export interface TechniquesExactAiProfileButtonSurface {
  id: AiProfile;
  label: string;
  description: string;
  selected: boolean;
  warning?: string;
  enabled: boolean;
}

export interface TechniquesExactCastingPolicyButtonSurface {
  id: 'aggressive' | 'balanced' | 'defensive' | 'reactive' | 'ordered' | 'holdUltimate';
  underlyingPolicy: CastingPolicy;
  displayLabel: 'Reactive' | 'Ordered' | 'Hold Ultimate';
  selected: boolean;
  helper: string;
  technicalMapping: string;
  enabled: boolean;
}

export interface TechniquesExactSlotSurface {
  key: string;
  label: string;
  slotType: TechniqueSlotType;
  slotIndex: number;
  displayRole?: 'active' | 'passive' | 'support' | 'ultimate';
  accepts: TechniqueSlotType;
  techniqueId: string | null;
  techniqueName: string | null;
  iconId?: string;
  isUnlocked: boolean;
  selected: boolean;
  equipped: boolean;
  recommended: boolean;
  unlockLabel?: string;
  pathFit?: 'strong' | 'partial' | 'off' | 'unknown';
  visualIdentity?: TechniqueVisualIdentity | null;
  badges?: Partial<Record<'grade' | 'rarity' | 'path' | 'role', VisualBadgeSurface>>;
  rarityFx?: TechniqueRarityFx;
  gradeKey?: TechniqueGradeTone;
  rarityKey?: TechniqueRarityTone;
  pathKey?: TechniquePathTone;
  roleKey?: TechniqueRoleTone;
  masteryLabel?: string;
  runeSocketLabel?: string;
  fixedGeometryKey: string;
  canEquipSelected: boolean;
  canUnequip: boolean;
  disabledReason?: string;
}

export interface TechniquesExactOwnedTechniqueRowSurface {
  id: string;
  name: string;
  roleLabel: string;
  typeLabel: 'Active' | 'Passive' | 'Ultimate';
  gradeLabel: string;
  rarityLabel: string;
  rankLabel: string;
  masteryLabel: string;
  masteryProgressPct: number;
  pathLabel: string;
  pathFitLabel: 'Strong' | 'Partial' | 'Off-path' | 'Unknown';
  familyTags: string[];
  supportTags: string[];
  traitSummary: string;
  runeSocketLabel: string;
  equipped: boolean;
  selected: boolean;
  recommended: boolean;
  visualIdentity: TechniqueVisualIdentity;
  badges: {
    grade: VisualBadgeSurface;
    rarity: VisualBadgeSurface;
    path: VisualBadgeSurface;
    role: VisualBadgeSurface;
  };
  disabled?: boolean;
}

export interface TechniquesExactSurfaceV1 {
  meta: {
    surfaceId: 'techniques-exact';
    version: string;
    mode: 'fixture' | 'live';
    source: TechniquesExactSource;
    selectedLoadoutId: string;
    selectedTechniqueId: string | null;
    selectedSlotKey: string | null;
    rootTestId: 'techniques-exact-page';
    legacyFallbackAvailable: boolean;
  };
  shell: {
    topLevelTabPage: true;
    useExistingBottomNav: true;
    showLegacyTechniqueLibrary: false;
    showManualPavilionBookshelf: false;
    singleDominantAltar: true;
    denseManagementSurface: true;
  };
  page: {
    title: 'Techniques';
    subtitle: 'Inner Palace Combat Form';
    loadoutBadge: string;
    aiSeal: string;
    backgroundAssetId: 'tech';
  };
  diagnosisBanner: {
    title: 'Best next loadout fix';
    primaryLine: string;
    chips: TechniquesExactChipSurface[];
  };
  leftRail: {
    title: 'Loadouts';
    loadouts: TechniquesExactLoadoutRowSurface[];
    aiProfileTitle: 'AI Profile';
    aiProfiles: TechniquesExactAiProfileButtonSurface[];
    aiWarning: string | null;
    castingPolicyTitle: 'Casting Policy';
    castingPolicies: TechniquesExactCastingPolicyButtonSurface[];
    castingHelper: string;
  };
  altar: {
    title: 'Current Combat Form';
    centerOrb: { label: string; glyph: string; tone: TechniquesExactTone };
    slots: TechniquesExactSlotSurface[];
    metrics: TechniquesExactFactRowSurface[];
    feedback: { tone: TechniquesExactFeedbackTone; message: string | null };
  };
  ownedLibrary: {
    title: 'Owned Techniques';
    selectedFilter: TechniquesExactFilterId;
    filterChips: TechniquesExactChipSurface[];
    rows: TechniquesExactOwnedTechniqueRowSurface[];
    emptyState: string | null;
    advancedFilterButton: TechniquesExactButtonSurface;
  };
  inspector: {
    title: 'Selected Technique';
    selectedName: string | null;
    selectedTechniqueId: string | null;
    iconId?: string;
    stateStamp: string;
    visualIdentity?: TechniqueVisualIdentity | null;
    heroBadges?: VisualBadgeSurface[];
    rows: TechniquesExactFactRowSurface[];
    recommendedAction: string;
    openDetailsButton: TechniquesExactButtonSurface;
    missingKnowledgeButton: TechniquesExactButtonSurface;
  };
  readinessImpact: {
    title: 'Gate Readiness Impact';
    segments: TechniquesExactFactRowSurface[];
    applyLoadoutButton: TechniquesExactButtonSurface;
    goToManualPavilionButton: TechniquesExactButtonSurface;
  };
  mandateSourceSink?: DaoMandateModuleSourceSinkProjection | null;
  debug?: {
    missingDataFallbacks: string[];
    warnings: string[];
  };
}

export interface TechniquesExactFeedback {
  tone: TechniquesExactFeedbackTone;
  message: string | null;
}

export interface TechniquesExactManualPavilionRoute {
  cityId: string;
  buildingKey: Extract<WorldBuildingKey, 'manualPavilion'>;
  intent?: WorldBuildingModalIntent;
}

export interface TechniquesExactRouteDispatch {
  setActiveTab: (tab: GameTab) => void;
  openWorldBuildingModal: (args: TechniquesExactManualPavilionRoute) => void;
}
