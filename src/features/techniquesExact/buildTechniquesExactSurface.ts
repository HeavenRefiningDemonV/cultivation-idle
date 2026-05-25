import type { TechniqueDef } from '../../content/index.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useTechCollectionStore } from '../../stores/techCollectionStore.js';
import { useTechniqueStore, type TechniqueLoadout } from '../../stores/techniqueStore.js';
import type { AiProfile, CastingPolicy, CultivationPath, TechniqueSlotType } from '../../types/index.js';
import { AI_PROFILE_OPTIONS } from '../../systems/combat/aiProfiles.js';
import { buildDoctrineSnapshot } from '../../systems/doctrine/index.js';
import {
  ACTIVE_PASSIVE_MASTERY_FLOOR,
  ACTIVE_PASSIVE_MIN_RANK_FLOOR,
  type BuildAnalysis,
} from '../../systems/builds/buildAnalysisTypes.js';
import { analyzeSelectedBuild } from '../../systems/builds/buildAnalysisService.js';
import { getBuildArchetype } from '../../systems/builds/archetypeRegistry.js';
import { buildLoadoutSnapshotFromLoadout } from '../../systems/builds/loadoutSnapshot.js';
import { evaluateCurrentCombatPostureFit } from '../../systems/builds/combatPostureFit.js';
import { getPathAlignmentStrengthForTechnique, getTechniqueTaxonomyProfile } from '../../systems/builds/techniqueTaxonomy.js';
import type { TechniqueFamily } from '../../systems/builds/techniqueFamilies.js';
import type { TechniqueProgressionSnapshot } from '../../systems/builds/index.js';
import { buildCurrentGateEconomyContext } from '../../systems/progression/currentGateEconomyContext.js';
import {
  resolveTechniqueVisualIdentity,
  type TechniqueVisualIdentity,
  type VisualBadgeSurface,
} from '../techniques/techniqueVisualIdentity.js';
import {
  CASTING_POLICY_DISPLAY,
  CASTING_POLICY_ORDER,
  AI_PROFILE_LABELS,
  TECHNIQUES_EXACT_COPY,
  TECHNIQUES_EXACT_ROOT_TEST_ID,
  TECHNIQUES_EXACT_SURFACE_VERSION,
  TECHNIQUES_FILTERS,
  romanizeRank,
  titleCase,
} from './techniquesExactPresentation.js';
import type {
  TechniquesExactButtonSurface,
  TechniquesExactChipSurface,
  TechniquesExactFactRowSurface,
  TechniquesExactFilterId,
  TechniquesExactFeedback,
  TechniquesExactOwnedTechniqueRowSurface,
  TechniquesExactSlotSurface,
  TechniquesExactSurfaceV1,
  TechniquesExactTone,
} from './techniquesExactTypes.js';

export interface BuildTechniquesExactSurfaceOptions {
  mode?: 'fixture' | 'live';
  selectedTechniqueId?: string | null;
  selectedSlotKey?: string | null;
  selectedFilter?: TechniquesExactFilterId;
  feedback?: TechniquesExactFeedback;
}

const createButton = (
  id: string,
  label: string,
  variant: TechniquesExactButtonSurface['variant'] = 'secondary',
  enabled = true,
  reason?: string,
): TechniquesExactButtonSurface => ({
  id,
  label,
  ariaLabel: label,
  enabled,
  variant: enabled ? variant : 'disabled',
  reason,
  status: enabled ? 'idle' : 'disabled',
});

const createShell = (): TechniquesExactSurfaceV1['shell'] => ({
  topLevelTabPage: true,
  useExistingBottomNav: true,
  showLegacyTechniqueLibrary: false,
  showManualPavilionBookshelf: false,
  singleDominantAltar: true,
  denseManagementSurface: true,
});

const makeFilterChips = (selectedFilter: TechniquesExactFilterId): TechniquesExactChipSurface[] =>
  TECHNIQUES_FILTERS.map((filter) => ({
    id: filter.id,
    label: filter.label,
    tone: filter.tone,
    selected: filter.id === selectedFilter,
  }));

const makeCastingPolicies = (selectedPolicy: CastingPolicy) =>
  CASTING_POLICY_ORDER.map((underlyingPolicy) => {
    const display = CASTING_POLICY_DISPLAY[underlyingPolicy];
    return {
      id: display.id,
      underlyingPolicy,
      displayLabel: display.label,
      selected: selectedPolicy === underlyingPolicy,
      helper: display.shortHelp,
      technicalMapping: display.technicalMapping,
      enabled: true,
    };
  });

const pathFitLabel = (fit: 'strong' | 'neutral' | 'off' | 'unknown' | null | undefined) => {
  if (fit === 'strong') return 'Strong';
  if (fit === 'neutral') return 'Partial';
  if (fit === 'off') return 'Off-path';
  return 'Unknown';
};

const pathFitTone = (fit: string | null | undefined): TechniquesExactTone => {
  if (fit === 'strong') return 'jade';
  if (fit === 'neutral' || fit === 'partial') return 'bronze';
  if (fit === 'off') return 'red';
  return 'muted';
};

const familyLabel = (family: string): string => {
  const labels: Record<string, string> = {
    coreDamage: 'Damage',
    execute: 'Execute',
    aoe: 'AoE',
    guard: 'Guard',
    heal: 'Heal',
    setup: 'Setup',
    control: 'Control',
    buff: 'Buff',
    mobility: 'Mobility',
    cleanse: 'Cleanse',
    farm: 'Farm',
  };
  return labels[family] ?? titleCase(family);
};

const roleLabelFromFamilies = (families: readonly TechniqueFamily[], def?: TechniqueDef | null): string => {
  if (families.includes('coreDamage')) return 'Core Damage';
  if (families.includes('guard')) return 'Guard';
  if (families.includes('heal')) return 'Heal';
  if (families.includes('control')) return 'Control';
  if (families.includes('setup')) return 'Setup';
  if (families.includes('mobility')) return 'Mobility';
  if (def?.role) return titleCase(def.role);
  return def?.type === 'passive' ? 'Passive Support' : def?.type === 'ultimate' ? 'Ultimate' : 'Technique';
};

const getTechniqueTypeLabel = (def?: TechniqueDef | null): 'Active' | 'Passive' | 'Ultimate' => {
  if (def?.type === 'passive') return 'Passive';
  if (def?.type === 'ultimate') return 'Ultimate';
  return 'Active';
};

function resolveTechniquePathFit(
  techniqueId: string | null,
  selectedPath: CultivationPath | null,
): 'strong' | 'neutral' | 'off' | 'unknown' {
  if (!techniqueId || !selectedPath) return 'unknown';
  return getPathAlignmentStrengthForTechnique(techniqueId, selectedPath);
}

const slotAcceptsTechnique = (slotType: TechniqueSlotType, def?: TechniqueDef | null): boolean => {
  if (!def) return false;
  const typeLabel = getTechniqueTypeLabel(def).toLowerCase();
  return slotType === typeLabel;
};

const formatMasteryLabel = (level: number): string => {
  const next = level < 25 ? 25 : level < 50 ? 50 : level < 75 ? 75 : level < 100 ? 100 : 100;
  return next === level && level >= 100 ? '100' : `${level} / ${next}`;
};

const gradeFromDef = (def?: TechniqueDef | null): string => titleCase(def?.tier ?? 'mortal');
const rarityFromDef = (def?: TechniqueDef | null): string => titleCase(def?.rarity ?? 'common');

function badgeFactExtras(rowKind: string, detail?: string, badge?: VisualBadgeSurface) {
  return { rowKind, detail, badge };
}

function resolveIdentityForTechnique(args: {
  techId: string;
  def?: TechniqueDef | null;
  progression?: TechniqueProgressionSnapshot | null;
  selectedPath?: CultivationPath | null;
  fixture?: {
    path?: string;
    role?: string;
    type?: string;
    grade?: string;
    rarity?: string;
    families?: readonly string[];
  };
}): TechniqueVisualIdentity {
  const taxonomy = getTechniqueTaxonomyProfile(args.techId);
  return resolveTechniqueVisualIdentity({
    techId: args.techId,
    name: args.def?.name ?? args.fixture?.role ?? args.techId,
    path: taxonomy?.path ?? args.def?.path ?? args.fixture?.path ?? null,
    type: args.def?.type ?? args.fixture?.type ?? null,
    role: args.def?.role ?? args.fixture?.role ?? null,
    tags: args.def?.tags ?? null,
    families: taxonomy?.families ?? args.fixture?.families ?? null,
    supportFlags: taxonomy?.supportFlags ?? null,
    grade: args.progression?.grade ?? args.fixture?.grade ?? args.def?.tier ?? null,
    rarity: args.progression?.rarity ?? args.fixture?.rarity ?? args.def?.rarity ?? null,
    selectedPath: args.selectedPath ?? null,
  });
}

function getProgression(techId: string) {
  return useTechCollectionStore.getState().getTechniqueProgressionSnapshot(techId);
}

const makeOwnedRow = (args: {
  techId: string;
  def?: TechniqueDef | null;
  selected: boolean;
  equipped: boolean;
  recommended: boolean;
  selectedPath: CultivationPath | null;
}): TechniquesExactOwnedTechniqueRowSurface => {
  const { techId, def, selected, equipped, recommended, selectedPath } = args;
  const collection = useTechCollectionStore.getState();
  const progression = collection.getTechniqueProgressionSnapshot(techId);
  const taxonomy = getTechniqueTaxonomyProfile(techId);
  const fit = taxonomy && selectedPath
    ? taxonomy.path === selectedPath
      ? taxonomy.alignment
      : taxonomy.families.some((family) => ['guard', 'heal', 'buff', 'setup', 'control', 'mobility', 'cleanse', 'farm'].includes(family))
        ? 'neutral'
        : 'off'
    : null;
  const traitSummary = collection.getTraitDisplay(techId).slice(0, 2).join(', ') || 'No traits yet';
  const visualIdentity = resolveIdentityForTechnique({
    techId,
    def,
    progression,
    selectedPath,
  });

  return {
    id: techId,
    name: def?.name ?? techId,
    roleLabel: visualIdentity.roleDisplayLabel,
    typeLabel: getTechniqueTypeLabel(def),
    gradeLabel: visualIdentity.gradeDisplayLabel,
    rarityLabel: visualIdentity.rarityDisplayLabel,
    rankLabel: romanizeRank(progression.rank),
    masteryLabel: formatMasteryLabel(progression.masteryLevel),
    masteryProgressPct: Math.max(0, Math.min(100, progression.masteryLevel)),
    pathLabel: visualIdentity.pathDisplayLabel,
    pathFitLabel: pathFitLabel(fit),
    familyTags: (taxonomy?.families ?? []).slice(0, 3).map(familyLabel),
    supportTags: (taxonomy?.supportFlags ?? []).slice(0, 2).map(titleCase),
    traitSummary,
    runeSocketLabel: `${progression.appliedRuneCount} / ${progression.runeSockets}`,
    equipped,
    selected,
    recommended,
    visualIdentity,
    badges: visualIdentity.badges,
  };
};

const makeSlot = (args: {
  key: string;
  label: string;
  slotType: TechniqueSlotType;
  slotIndex: number;
  displayRole?: TechniquesExactSlotSurface['displayRole'];
  techniqueId: string | null;
  def?: TechniqueDef | null;
  isUnlocked: boolean;
  selected: boolean;
  recommended: boolean;
  selectedTechniqueDef?: TechniqueDef | null;
  selectedPath: CultivationPath | null;
}): TechniquesExactSlotSurface => {
  const progression = args.techniqueId ? getProgression(args.techniqueId) : null;
  const pathFit = resolveTechniquePathFit(args.techniqueId, args.selectedPath);
  const canEquipSelected = args.isUnlocked && slotAcceptsTechnique(args.slotType, args.selectedTechniqueDef);
  const visualIdentity = args.techniqueId
    ? resolveIdentityForTechnique({
        techId: args.techniqueId,
        def: args.def,
        progression,
        selectedPath: args.selectedPath,
      })
    : null;
  return {
    key: args.key,
    label: args.label,
    slotType: args.slotType,
    slotIndex: args.slotIndex,
    displayRole: args.displayRole,
    accepts: args.slotType,
    techniqueId: args.techniqueId,
    techniqueName: args.techniqueId ? args.def?.name ?? args.techniqueId : null,
    iconId: args.slotType === 'active' ? 'inkBurst' : args.displayRole === 'support' ? 'inkHeart' : args.slotType === 'ultimate' ? 'inkSparkles' : 'inkShield',
    isUnlocked: args.isUnlocked,
    selected: args.selected,
    equipped: Boolean(args.techniqueId),
    recommended: args.recommended,
    unlockLabel: args.isUnlocked ? undefined : 'Locked',
    pathFit: pathFit === 'strong' ? 'strong' : pathFit === 'neutral' ? 'partial' : pathFit === 'off' ? 'off' : 'unknown',
    visualIdentity,
    badges: visualIdentity?.badges,
    rarityFx: visualIdentity?.rarityFx,
    gradeKey: visualIdentity?.gradeKey,
    rarityKey: visualIdentity?.rarityKey,
    pathKey: visualIdentity?.pathKey,
    roleKey: visualIdentity?.roleKey,
    masteryLabel: progression ? formatMasteryLabel(progression.masteryLevel) : undefined,
    runeSocketLabel: progression ? `${progression.appliedRuneCount} / ${progression.runeSockets}` : undefined,
    fixedGeometryKey: `${args.slotType}-${args.slotIndex}`,
    canEquipSelected,
    canUnequip: Boolean(args.techniqueId) && args.isUnlocked,
    disabledReason: args.isUnlocked ? undefined : 'Slot unlocks later.',
  };
};

const countEquipped = (active: readonly string[], passive: readonly string[], ultimate: string | null) =>
  active.filter(Boolean).length + passive.filter(Boolean).length + (ultimate ? 1 : 0);

export function createTechniquesExactMockupFixture(): TechniquesExactSurfaceV1 {
  const loadouts = [
    { id: 'loadout_1', label: 'Loadout 1', subtitle: 'Balanced Striker', aiProfile: 'balanced' as const, castingPolicy: 'balanced' as const, selected: true },
    { id: 'loadout_2', label: 'Loadout 2', subtitle: 'Defensive', aiProfile: 'survivor' as const, castingPolicy: 'defensive' as const, selected: false },
    { id: 'loadout_3', label: 'Loadout 3', subtitle: 'Farmer', aiProfile: 'farmer' as const, castingPolicy: 'balanced' as const, selected: false },
  ];

  const slots: TechniquesExactSlotSurface[] = [
    makeFixtureSlot('active-0', 'Active 1', 'active', 0, 'tech_iron_palm', 'Iron Palm', true, true, 'strong'),
    makeFixtureSlot('active-1', 'Active 2', 'active', 1, 'tech_cloudstep', 'Cloudstep', true, false, 'strong'),
    makeFixtureSlot('passive-0', 'Passive 1', 'passive', 0, 'tech_quiet_guard', 'Quiet Guard', true, false, 'partial'),
    makeFixtureSlot('passive-1', 'Passive 2', 'passive', 1, null, null, false, false, 'unknown'),
    makeFixtureSlot('support-0', 'Support', 'passive', 2, 'tech_mending_breath', 'Mending Breath', true, false, 'partial', 'support'),
    makeFixtureSlot('ultimate-0', 'Ultimate', 'ultimate', 0, null, null, false, false, 'unknown'),
  ];
  const selectedIdentity = fixtureIdentity('tech_iron_palm', 'Iron Palm', 'Core Damage');

  return {
    meta: {
      surfaceId: 'techniques-exact',
      version: TECHNIQUES_EXACT_SURFACE_VERSION,
      mode: 'fixture',
      source: 'fixture',
      selectedLoadoutId: 'loadout_1',
      selectedTechniqueId: 'tech_iron_palm',
      selectedSlotKey: 'active-0',
      rootTestId: TECHNIQUES_EXACT_ROOT_TEST_ID,
      legacyFallbackAvailable: true,
    },
    shell: createShell(),
    page: {
      title: TECHNIQUES_EXACT_COPY.title,
      subtitle: TECHNIQUES_EXACT_COPY.subtitle,
      loadoutBadge: 'Loadout 1',
      aiSeal: 'Balanced',
      backgroundAssetId: 'tech',
    },
    diagnosisBanner: {
      title: TECHNIQUES_EXACT_COPY.diagnosisTitle,
      primaryLine: TECHNIQUES_EXACT_COPY.fixtureDiagnosisLine,
      chips: [
        { id: 'target', label: 'Target', value: 'Foundation Gate', tone: 'bronze' },
        { id: 'archetype', label: 'Archetype', value: 'Balanced Striker', tone: 'bronze' },
        { id: 'alignment', label: 'Path Alignment', value: '72%', tone: 'jade' },
        { id: 'mastery', label: 'Mastery Floor', value: '25', tone: 'ink' },
        { id: 'rank', label: 'Rank Floor', value: 'I', tone: 'ink' },
      ],
    },
    leftRail: {
      title: 'Loadouts',
      loadouts: loadouts.map((loadout) => ({
        ...loadout,
        equippedCountLabel: loadout.id === 'loadout_1' ? '4 equipped' : '0 equipped',
      })),
      aiProfileTitle: 'AI Profile',
      aiProfiles: AI_PROFILE_OPTIONS.map((profile) => ({
        id: profile.value,
        label: profile.label,
        description: profile.description,
        selected: profile.value === 'balanced',
        warning: profile.value === 'farmer' ? TECHNIQUES_EXACT_COPY.farmerWarning : undefined,
        enabled: true,
      })),
      aiWarning: TECHNIQUES_EXACT_COPY.farmerWarning,
      castingPolicyTitle: 'Casting Policy',
      castingPolicies: makeCastingPolicies('balanced'),
      castingHelper: CASTING_POLICY_DISPLAY.balanced.shortHelp,
    },
    altar: {
      title: 'Current Combat Form',
      centerOrb: { label: 'Combat Form', glyph: '\u6218', tone: 'jade' },
      slots,
      metrics: [
        fact('active', 'Active', '2 / 3 Active'),
        fact('passive', 'Passive', '1 / 2 Passive'),
        fact('ultimate', 'Ultimate', '0 / 1 Ultimate'),
        fact('ai', 'AI', 'AI: Balanced'),
        fact('policy', 'Policy', 'Policy: Reactive'),
      ],
      feedback: { tone: 'idle', message: null },
    },
    ownedLibrary: {
      title: 'Owned Techniques',
      selectedFilter: 'all',
      filterChips: makeFilterChips('all'),
      rows: [
        fixtureOwned('tech_iron_palm', 'Iron Palm', 'Core Damage', '25 / 50', true, true),
        fixtureOwned('tech_quiet_guard', 'Quiet Guard', 'Guard', '10 / 50', false, false),
        fixtureOwned('tech_cloudstep', 'Cloudstep', 'Mobility', '15 / 50', true, false),
        fixtureOwned('tech_mending_breath', 'Mending Breath', 'Heal', '5 / 50', true, false),
      ],
      emptyState: null,
      advancedFilterButton: createButton('advanced-filter', 'Advanced Filters', 'ghost'),
    },
    inspector: {
      title: 'Selected Technique',
      selectedName: 'Iron Palm',
      selectedTechniqueId: 'tech_iron_palm',
      iconId: 'inkBurst',
      stateStamp: 'Recommended',
      visualIdentity: selectedIdentity,
      heroBadges: [
        selectedIdentity.badges.role,
        selectedIdentity.badges.grade,
        selectedIdentity.badges.rarity,
        selectedIdentity.badges.path,
      ],
      rows: [
        fact('role', 'Role', selectedIdentity.roleDisplayLabel, undefined, undefined, badgeFactExtras('role', 'direct strike doctrine', selectedIdentity.badges.role)),
        fact('grade', 'Grade', selectedIdentity.gradeDisplayLabel, undefined, undefined, badgeFactExtras('grade', selectedIdentity.gradeMaterialLabel, selectedIdentity.badges.grade)),
        fact('rarity', 'Rarity', selectedIdentity.rarityDisplayLabel, undefined, undefined, badgeFactExtras('rarity', selectedIdentity.rarityProvenanceLabel, selectedIdentity.badges.rarity)),
        fact('rank', 'Rank', 'I'),
        fact('mastery', 'Mastery', '25 / 50'),
        fact('path-fit', 'Path Fit', 'Strong', 'jade', undefined, badgeFactExtras('path-fit', 'Martial doctrine resonates')),
        fact('traits', 'Traits', 'direct strike, stable opener'),
        fact('runes', 'Rune Sockets', '0 / 1'),
      ],
      recommendedAction: 'raise mastery to 50',
      openDetailsButton: createButton('open-details', 'Open Details', 'secondary'),
      missingKnowledgeButton: createButton('missing-knowledge', TECHNIQUES_EXACT_COPY.missingKnowledge, 'ghost'),
    },
    readinessImpact: {
      title: 'Gate Readiness Impact',
      segments: [
        fact('damage', 'Damage', 'Adequate', 'jade', 'good'),
        fact('survival', 'Survival', 'Thin', 'amber', 'warning'),
        fact('control', 'Control', 'Missing', 'red', 'bad'),
        fact('ai', 'AI', 'Good', 'jade', 'good'),
        fact('medicine', 'Medicine', 'External', 'muted'),
      ],
      applyLoadoutButton: createButton('apply-loadout', TECHNIQUES_EXACT_COPY.applyLoadout, 'primary'),
      goToManualPavilionButton: createButton('go-manual-pavilion', TECHNIQUES_EXACT_COPY.manualPavilion, 'secondary'),
    },
  };
}

function fact(
  id: string,
  label: string,
  value: string,
  tone?: TechniquesExactTone,
  status?: TechniquesExactFactRowSurface['status'],
  extras: Pick<TechniquesExactFactRowSurface, 'rowKind' | 'detail' | 'badge'> = {},
): TechniquesExactFactRowSurface {
  return { id, label, value, tone, status, ...extras };
}

function fixtureIdentity(techId: string, name: string, roleLabel: string): TechniqueVisualIdentity {
  const fixtureById: Record<string, { path: string; role: string; type: string; grade: string; rarity: string; families: string[] }> = {
    tech_iron_palm: { path: 'martial', role: 'damage', type: 'active', grade: 'mortal', rarity: 'common', families: ['coreDamage'] },
    tech_quiet_guard: { path: 'earth', role: 'guard', type: 'passive', grade: 'mortal', rarity: 'uncommon', families: ['guard'] },
    tech_cloudstep: { path: 'heaven', role: 'mobility', type: 'active', grade: 'earth', rarity: 'rare', families: ['mobility'] },
    tech_mending_breath: { path: 'earth', role: 'heal', type: 'passive', grade: 'mortal', rarity: 'common', families: ['heal'] },
  };
  const fixture = fixtureById[techId] ?? {
    path: roleLabel === 'Guard' || roleLabel === 'Heal' ? 'earth' : 'martial',
    role: roleLabel.toLowerCase(),
    type: roleLabel === 'Guard' || roleLabel === 'Heal' ? 'passive' : 'active',
    grade: 'mortal',
    rarity: 'common',
    families: [roleLabel],
  };
  return resolveTechniqueVisualIdentity({
    techId,
    name,
    path: fixture.path,
    type: fixture.type,
    role: fixture.role,
    families: fixture.families,
    grade: fixture.grade,
    rarity: fixture.rarity,
  });
}

function makeFixtureSlot(
  key: string,
  label: string,
  slotType: TechniqueSlotType,
  slotIndex: number,
  techniqueId: string | null,
  techniqueName: string | null,
  isUnlocked: boolean,
  selected: boolean,
  pathFit: TechniquesExactSlotSurface['pathFit'],
  displayRole?: TechniquesExactSlotSurface['displayRole'],
): TechniquesExactSlotSurface {
  const visualIdentity = techniqueId && techniqueName ? fixtureIdentity(techniqueId, techniqueName, displayRole ?? slotType) : null;
  return {
    key,
    label,
    slotType,
    slotIndex,
    displayRole,
    accepts: slotType,
    techniqueId,
    techniqueName,
    iconId: slotType === 'active' ? 'inkBurst' : displayRole === 'support' ? 'inkHeart' : slotType === 'ultimate' ? 'inkSparkles' : 'inkShield',
    isUnlocked,
    selected,
    equipped: Boolean(techniqueId),
    recommended: selected || key === 'passive-0' || key === 'support-0',
    unlockLabel: isUnlocked ? undefined : 'Locked',
    pathFit,
    visualIdentity,
    badges: visualIdentity?.badges,
    rarityFx: visualIdentity?.rarityFx,
    gradeKey: visualIdentity?.gradeKey,
    rarityKey: visualIdentity?.rarityKey,
    pathKey: visualIdentity?.pathKey,
    roleKey: visualIdentity?.roleKey,
    masteryLabel: techniqueId ? (selected ? '25 / 50' : '10 / 50') : undefined,
    runeSocketLabel: techniqueId ? '0 / 1' : undefined,
    fixedGeometryKey: key,
    canEquipSelected: isUnlocked,
    canUnequip: Boolean(techniqueId) && isUnlocked,
    disabledReason: isUnlocked ? undefined : 'Slot unlocks later.',
  };
}

function fixtureOwned(
  id: string,
  name: string,
  roleLabel: string,
  masteryLabel: string,
  equipped: boolean,
  selected: boolean,
): TechniquesExactOwnedTechniqueRowSurface {
  const family = roleLabel === 'Heal' ? 'Heal' : roleLabel === 'Guard' ? 'Guard' : roleLabel === 'Mobility' ? 'Mobility' : 'Damage';
  const visualIdentity = fixtureIdentity(id, name, roleLabel);
  return {
    id,
    name,
    roleLabel: visualIdentity.roleDisplayLabel,
    typeLabel: roleLabel === 'Guard' || roleLabel === 'Heal' ? 'Passive' : 'Active',
    gradeLabel: visualIdentity.gradeDisplayLabel,
    rarityLabel: visualIdentity.rarityDisplayLabel,
    rankLabel: 'I',
    masteryLabel,
    masteryProgressPct: Number.parseInt(masteryLabel, 10) || 0,
    pathLabel: visualIdentity.pathDisplayLabel,
    pathFitLabel: roleLabel === 'Core Damage' || roleLabel === 'Mobility' ? 'Strong' : 'Partial',
    familyTags: [family],
    supportTags: [],
    traitSummary: selected ? 'direct strike, stable opener' : 'No traits yet',
    runeSocketLabel: '0 / 1',
    equipped,
    selected,
    recommended: selected || roleLabel === 'Guard',
    visualIdentity,
    badges: visualIdentity.badges,
  };
}

export function buildTechniquesExactSurfaceFromStores(
  options: BuildTechniquesExactSurfaceOptions = {},
): TechniquesExactSurfaceV1 {
  if (options.mode === 'fixture') {
    return createTechniquesExactMockupFixture();
  }

  const content = useContentStore.getState();
  const game = useGameStore.getState();
  const techniqueState = useTechniqueStore.getState();
  const collection = useTechCollectionStore.getState();
  const debug: NonNullable<TechniquesExactSurfaceV1['debug']> = { missingDataFallbacks: [], warnings: [] };
  const selectedFilter = options.selectedFilter ?? 'all';

  const selectedLoadout =
    techniqueState.loadouts.find((loadout) => loadout.id === techniqueState.selectedLoadoutId) ??
    techniqueState.loadouts[0] ??
    null;

  if (!selectedLoadout) {
    debug.missingDataFallbacks.push('No technique loadout exists; showing an empty live surface.');
  }

  const loadoutSnapshot = selectedLoadout
    ? buildLoadoutSnapshotFromLoadout({
        loadout: selectedLoadout,
        realmIndex: game.realm.index,
        activeBonusSlots: Math.max(0, Math.floor(techniqueState.activeSlots) - 2),
        passiveBonusSlots: Math.max(0, Math.floor(techniqueState.passiveSlots) - 1),
      })
    : null;

  let buildAnalysis = null as BuildAnalysis | null;
  try {
    buildAnalysis = analyzeSelectedBuild(buildDoctrineSnapshot());
  } catch (error) {
    debug.warnings.push(`Build analysis unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }

  let postureFit = null as ReturnType<typeof evaluateCurrentCombatPostureFit> | null;
  try {
    postureFit = evaluateCurrentCombatPostureFit('trial');
  } catch (error) {
    debug.warnings.push(`Combat posture fit unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }

  const selectedTechniqueId = resolveSelectedTechniqueId({
    requested: options.selectedTechniqueId ?? null,
    collectionIds: Object.keys(collection.unlockedTechs).filter((techId) => collection.unlockedTechs[techId]?.unlocked),
    selectedLoadout,
  });
  const selectedTechniqueDef = selectedTechniqueId ? content.maps.techniquesById[selectedTechniqueId] : null;
  const selectedSlotKey = options.selectedSlotKey ?? firstUnlockedEmptySlotKey(loadoutSnapshot) ?? 'active-0';
  const selectedAi = selectedLoadout?.aiProfile ?? 'balanced';
  const selectedPolicy = selectedLoadout?.castingPolicy ?? 'balanced';
  const selectedPath = game.selectedPath as CultivationPath | null;
  const cityState = useCityStore.getState();
  const currentGateContext = content.raw
    ? buildCurrentGateEconomyContext({
        content: content.raw,
        realmIndex: game.realm.index,
        cityId: cityState.currentCityId,
      })
    : null;
  const currentGateLabel = currentGateContext?.gateLabel ?? 'Current Gate';
  const equippedIds = new Set([
    ...(selectedLoadout?.slots.active ?? []).filter(Boolean),
    ...(selectedLoadout?.slots.passive ?? []).filter(Boolean),
    ...(selectedLoadout?.slots.ultimate ? [selectedLoadout.slots.ultimate] : []),
  ]);

  const allOwnedRows = Object.keys(collection.unlockedTechs)
    .filter((techId) => collection.unlockedTechs[techId]?.unlocked)
    .map((techId) => makeOwnedRow({
      techId,
      def: content.maps.techniquesById[techId],
      selected: techId === selectedTechniqueId,
      equipped: equippedIds.has(techId),
      recommended: isTechniqueRecommended(techId, buildAnalysis),
      selectedPath,
    }))
    .sort((a, b) => Number(b.equipped) - Number(a.equipped) || a.name.localeCompare(b.name));

  const rows = filterOwnedRows(allOwnedRows, selectedFilter);
  const slots = buildLiveSlots({
    selectedLoadout,
    selectedSlotKey,
    selectedTechniqueDef,
    contentTechniques: content.maps.techniquesById,
    loadoutSnapshot,
    selectedPath,
  });
  const selectedTechniqueRow = allOwnedRows.find((row) => row.id === selectedTechniqueId) ?? null;
  const selectedProgression = selectedTechniqueId ? collection.getTechniqueProgressionSnapshot(selectedTechniqueId) : null;
  const selectedTaxonomy = selectedTechniqueId ? getTechniqueTaxonomyProfile(selectedTechniqueId) : null;
  const manualCityId = resolveManualPavilionCityIdForTechniquesExact();

  return {
    meta: {
      surfaceId: 'techniques-exact',
      version: TECHNIQUES_EXACT_SURFACE_VERSION,
      mode: 'live',
      source: 'stores',
      selectedLoadoutId: selectedLoadout?.id ?? 'missing-loadout',
      selectedTechniqueId,
      selectedSlotKey,
      rootTestId: TECHNIQUES_EXACT_ROOT_TEST_ID,
      legacyFallbackAvailable: true,
    },
    shell: createShell(),
    page: {
      title: TECHNIQUES_EXACT_COPY.title,
      subtitle: TECHNIQUES_EXACT_COPY.subtitle,
      loadoutBadge: selectedLoadout?.name ?? 'Loadout',
      aiSeal: AI_PROFILE_LABELS[selectedAi],
      backgroundAssetId: 'tech',
    },
    diagnosisBanner: {
      title: TECHNIQUES_EXACT_COPY.diagnosisTitle,
      primaryLine: buildDiagnosisLine(buildAnalysis),
      chips: buildDiagnosisChips(buildAnalysis, currentGateLabel),
    },
    leftRail: {
      title: 'Loadouts',
      loadouts: techniqueState.loadouts.map((loadout) => {
        const snapshot = buildLoadoutSnapshotFromLoadout({
          loadout,
          realmIndex: game.realm.index,
          activeBonusSlots: Math.max(0, Math.floor(techniqueState.activeSlots) - 2),
          passiveBonusSlots: Math.max(0, Math.floor(techniqueState.passiveSlots) - 1),
        });
        return {
          id: loadout.id,
          label: loadout.name,
          subtitle: loadout.aiProfile === 'balanced' && loadout.id === selectedLoadout?.id
            ? getBuildArchetype(buildAnalysis?.archetypeId ?? null)?.label ?? 'Balanced Striker'
            : AI_PROFILE_LABELS[loadout.aiProfile],
          selected: loadout.id === selectedLoadout?.id,
          aiProfile: loadout.aiProfile,
          castingPolicy: loadout.castingPolicy,
          equippedCountLabel: `${countEquipped(loadout.slots.active, loadout.slots.passive, loadout.slots.ultimate)} equipped`,
          statusLabel: `${snapshot.filled.active}/${snapshot.unlocked.active} active`,
        };
      }),
      aiProfileTitle: 'AI Profile',
      aiProfiles: AI_PROFILE_OPTIONS.map((profile) => ({
        id: profile.value,
        label: profile.label,
        description: profile.description,
        selected: profile.value === selectedAi,
        warning: profile.value === 'farmer' ? TECHNIQUES_EXACT_COPY.farmerWarning : undefined,
        enabled: true,
      })),
      aiWarning: selectedAi === 'farmer' || postureFit?.aiFit === 'bad' ? TECHNIQUES_EXACT_COPY.farmerWarning : null,
      castingPolicyTitle: 'Casting Policy',
      castingPolicies: makeCastingPolicies(selectedPolicy),
      castingHelper: CASTING_POLICY_DISPLAY[selectedPolicy].shortHelp,
    },
    altar: {
      title: 'Current Combat Form',
      centerOrb: { label: 'Combat Form', glyph: '\u6218', tone: 'jade' },
      slots,
      metrics: [
        fact('active', 'Active', `${loadoutSnapshot?.filled.active ?? 0} / ${loadoutSnapshot?.displayed.active ?? 0} Active`),
        fact('passive', 'Passive', `${loadoutSnapshot?.filled.passive ?? 0} / ${loadoutSnapshot?.displayed.passive ?? 0} Passive`),
        fact('ultimate', 'Ultimate', `${loadoutSnapshot?.filled.ultimate ?? 0} / 1 Ultimate`),
        fact('ai', 'AI', `AI: ${AI_PROFILE_LABELS[selectedAi]}`),
        fact('policy', 'Policy', `Policy: ${CASTING_POLICY_DISPLAY[selectedPolicy].label}`),
      ],
      feedback: options.feedback ?? { tone: 'idle', message: null },
    },
    ownedLibrary: {
      title: 'Owned Techniques',
      selectedFilter,
      filterChips: makeFilterChips(selectedFilter),
      rows,
      emptyState: rows.length > 0 ? null : 'No learned techniques match this doctrine filter.',
      advancedFilterButton: createButton('advanced-filter', 'Advanced Filters', 'ghost'),
    },
    inspector: buildInspector({
      selectedTechniqueId,
      selectedTechniqueDef,
      selectedRow: selectedTechniqueRow,
      selectedProgression,
      selectedTaxonomy,
      manualCityId,
      debug,
    }),
    readinessImpact: {
      title: 'Gate Readiness Impact',
      segments: buildReadinessSegments(buildAnalysis, postureFit),
      applyLoadoutButton: createButton('apply-loadout', TECHNIQUES_EXACT_COPY.applyLoadout, 'primary'),
      goToManualPavilionButton: createButton(
        'go-manual-pavilion',
        TECHNIQUES_EXACT_COPY.manualPavilion,
        'secondary',
        Boolean(manualCityId),
        manualCityId ? undefined : 'No city with Manual Pavilion is available.',
      ),
    },
    debug,
  };
}

function resolveSelectedTechniqueId(args: {
  requested: string | null;
  collectionIds: string[];
  selectedLoadout: { slots: { active: string[]; passive: string[]; ultimate: string | null } } | null;
}) {
  if (args.requested && args.collectionIds.includes(args.requested)) return args.requested;
  const equipped = [
    ...(args.selectedLoadout?.slots.active ?? []),
    ...(args.selectedLoadout?.slots.passive ?? []),
    ...(args.selectedLoadout?.slots.ultimate ? [args.selectedLoadout.slots.ultimate] : []),
  ].filter(Boolean);
  return equipped.find((techId) => args.collectionIds.includes(techId)) ?? args.collectionIds[0] ?? null;
}

function firstUnlockedEmptySlotKey(loadoutSnapshot: ReturnType<typeof buildLoadoutSnapshotFromLoadout> | null) {
  const first = loadoutSnapshot?.emptyUnlockedSlots[0];
  return first ? `${first.slotType}-${first.slotIndex}` : null;
}

function buildLiveSlots(args: {
  selectedLoadout: TechniqueLoadout | null;
  selectedSlotKey: string | null;
  selectedTechniqueDef?: TechniqueDef | null;
  contentTechniques: Record<string, TechniqueDef>;
  loadoutSnapshot: ReturnType<typeof buildLoadoutSnapshotFromLoadout> | null;
  selectedPath: CultivationPath | null;
}): TechniquesExactSlotSurface[] {
  const active = args.selectedLoadout?.slots.active ?? [];
  const passive = args.selectedLoadout?.slots.passive ?? [];
  const ultimate = args.selectedLoadout?.slots.ultimate ?? null;
  const displayedActive = 2;
  const displayedPassive = 3;
  const unlockedActive = args.loadoutSnapshot?.unlocked.active ?? 0;
  const unlockedPassive = args.loadoutSnapshot?.unlocked.passive ?? 0;

  const slots: TechniquesExactSlotSurface[] = [];
  for (let index = 0; index < displayedActive; index += 1) {
    const techId = active[index] || null;
    const key = `active-${index}`;
    slots.push(makeSlot({
      key,
      label: `Active ${index + 1}`,
      slotType: 'active',
      slotIndex: index,
      displayRole: 'active',
      techniqueId: techId,
      def: techId ? args.contentTechniques[techId] : null,
      isUnlocked: index < unlockedActive,
      selected: args.selectedSlotKey === key,
      recommended: false,
      selectedTechniqueDef: args.selectedTechniqueDef,
      selectedPath: args.selectedPath,
    }));
  }

  for (let index = 0; index < displayedPassive; index += 1) {
    const techId = passive[index] || null;
    const key = `passive-${index}`;
    const displayRole = index === 2 ? 'support' : 'passive';
    slots.push(makeSlot({
      key,
      label: index === 2 ? 'Support' : `Passive ${index + 1}`,
      slotType: 'passive',
      slotIndex: index,
      displayRole,
      techniqueId: techId,
      def: techId ? args.contentTechniques[techId] : null,
      isUnlocked: index < unlockedPassive,
      selected: args.selectedSlotKey === key,
      recommended: !techId && index < unlockedPassive,
      selectedTechniqueDef: args.selectedTechniqueDef,
      selectedPath: args.selectedPath,
    }));
  }

  slots.push(makeSlot({
    key: 'ultimate-0',
    label: 'Ultimate',
    slotType: 'ultimate',
    slotIndex: 0,
    displayRole: 'ultimate',
    techniqueId: ultimate,
    def: ultimate ? args.contentTechniques[ultimate] : null,
    isUnlocked: Boolean(args.loadoutSnapshot?.unlocked.ultimate),
    selected: args.selectedSlotKey === 'ultimate-0',
    recommended: false,
    selectedTechniqueDef: args.selectedTechniqueDef,
    selectedPath: args.selectedPath,
  }));

  return slots;
}

function isTechniqueRecommended(techId: string, buildAnalysis: BuildAnalysis | null): boolean {
  if (!buildAnalysis) return false;
  const entry = buildAnalysis.equippedTechniques.find((technique) => technique.techId === techId);
  return Boolean(entry && (!entry.masteryFloorMet || !entry.rankFloorMet || !entry.runeFloorMet || entry.pathFit === 'strong'));
}

function filterOwnedRows(rows: TechniquesExactOwnedTechniqueRowSurface[], filterId: TechniquesExactFilterId) {
  if (filterId === 'all') return rows;
  if (filterId === 'pathFit') return rows.filter((row) => row.pathFitLabel === 'Strong' || row.recommended);
  const match = (label: string) => label.toLowerCase() === filterId.toLowerCase();
  return rows.filter((row) => row.familyTags.some(match) || row.roleLabel.toLowerCase().includes(filterId.toLowerCase()));
}

function buildDiagnosisLine(buildAnalysis: BuildAnalysis | null): string {
  const gap = buildAnalysis?.gaps[0];
  if (!gap) return 'keep this combat form polished before the next Gate.';
  switch (gap.code) {
    case 'empty_slot':
      return 'fill one unlocked slot before the next Gate.';
    case 'low_alignment':
      return 'replace an off-path technique before the next Gate.';
    case 'missing_survival_tool':
      return 'add guard, healing, or cleanse before the next Gate.';
    case 'missing_setup_tool':
      return 'add setup or control before the next Gate.';
    case 'low_mastery':
      return 'raise mastery on equipped techniques before the next Gate.';
    case 'low_rank':
      return 'upgrade rank on equipped techniques before the next Gate.';
    case 'rune_gap':
      return 'socket runes into your core techniques before the next Gate.';
    default:
      return gap.reason;
  }
}

function buildDiagnosisChips(buildAnalysis: BuildAnalysis | null, gateLabel: string): TechniquesExactChipSurface[] {
  const archetype = getBuildArchetype(buildAnalysis?.archetypeId ?? null);
  const alignment = Math.round(Math.max(0, Math.min(100, buildAnalysis?.pathAlignmentScore ?? 0)));
  return [
    { id: 'target', label: 'Target', value: gateLabel, tone: 'bronze' },
    { id: 'archetype', label: 'Archetype', value: archetype?.label ?? 'Unshaped Build', tone: 'bronze' },
    { id: 'alignment', label: 'Path Alignment', value: `${alignment}%`, tone: alignment >= 70 ? 'jade' : alignment >= 45 ? 'amber' : 'red' },
    { id: 'mastery', label: 'Mastery Floor', value: String(ACTIVE_PASSIVE_MASTERY_FLOOR), tone: buildAnalysis?.masteryFloorMet ? 'jade' : 'amber' },
    { id: 'rank', label: 'Rank Floor', value: romanizeRank(ACTIVE_PASSIVE_MIN_RANK_FLOOR), tone: buildAnalysis?.rankFloorMet ? 'jade' : 'amber' },
  ];
}

function buildInspector(args: {
  selectedTechniqueId: string | null;
  selectedTechniqueDef?: TechniqueDef | null;
  selectedRow: TechniquesExactOwnedTechniqueRowSurface | null;
  selectedProgression: TechniqueProgressionSnapshot | null;
  selectedTaxonomy: ReturnType<typeof getTechniqueTaxonomyProfile>;
  manualCityId: string | null;
  debug: NonNullable<TechniquesExactSurfaceV1['debug']>;
}): TechniquesExactSurfaceV1['inspector'] {
  if (!args.selectedTechniqueId || !args.selectedTechniqueDef || !args.selectedProgression) {
    return {
      title: 'Selected Technique',
      selectedName: null,
      selectedTechniqueId: null,
      stateStamp: 'No Selection',
      visualIdentity: null,
      heroBadges: [],
      rows: [fact('empty', 'Selection', 'Choose a learned technique slip.')],
      recommendedAction: 'empty technique slot',
      openDetailsButton: createButton('open-details', 'Open Details', 'disabled', false, 'Select a technique first.'),
      missingKnowledgeButton: createButton(
        'missing-knowledge',
        TECHNIQUES_EXACT_COPY.missingKnowledge,
        'ghost',
        Boolean(args.manualCityId),
        args.manualCityId ? undefined : 'No city with Manual Pavilion is available.',
      ),
    };
  }

  if (!args.selectedTechniqueDef) {
    args.debug.missingDataFallbacks.push(`Missing content for selected technique ${args.selectedTechniqueId}.`);
  }

  const traits = args.selectedRow?.traitSummary ?? 'No traits yet';
  const fit = args.selectedRow?.pathFitLabel ?? pathFitLabel(args.selectedTaxonomy?.alignment ?? null);
  const recommended = buildRecommendedAction(args.selectedProgression.masteryLevel, args.selectedProgression.rank, args.selectedProgression.runeSockets);
  const visualIdentity = args.selectedRow?.visualIdentity ?? resolveIdentityForTechnique({
    techId: args.selectedTechniqueId,
    def: args.selectedTechniqueDef,
    progression: args.selectedProgression,
  });
  return {
    title: 'Selected Technique',
    selectedName: args.selectedTechniqueDef.name ?? args.selectedTechniqueId,
    selectedTechniqueId: args.selectedTechniqueId,
    iconId: getTechniqueTypeLabel(args.selectedTechniqueDef) === 'Passive' ? 'inkShield' : 'inkBurst',
    stateStamp: args.selectedRow?.equipped ? 'Equipped' : args.selectedRow?.recommended ? 'Recommended' : 'Learned',
    visualIdentity,
    heroBadges: [
      visualIdentity.badges.role,
      visualIdentity.badges.grade,
      visualIdentity.badges.rarity,
      visualIdentity.badges.path,
    ],
    rows: [
      fact('role', 'Role', visualIdentity.roleDisplayLabel, undefined, undefined, badgeFactExtras('role', roleLabelFromFamilies(args.selectedTaxonomy?.families ?? [], args.selectedTechniqueDef), visualIdentity.badges.role)),
      fact('grade', 'Grade', visualIdentity.gradeDisplayLabel, undefined, undefined, badgeFactExtras('grade', visualIdentity.gradeMaterialLabel, visualIdentity.badges.grade)),
      fact('rarity', 'Rarity', visualIdentity.rarityDisplayLabel, undefined, undefined, badgeFactExtras('rarity', visualIdentity.rarityProvenanceLabel, visualIdentity.badges.rarity)),
      fact('rank', 'Rank', romanizeRank(args.selectedProgression.rank)),
      fact('mastery', 'Mastery', formatMasteryLabel(args.selectedProgression.masteryLevel)),
      fact('path-fit', 'Path Fit', fit, pathFitTone(fit), undefined, badgeFactExtras('path-fit', fit === 'Strong' ? `${visualIdentity.pathDisplayLabel} resonates` : 'doctrine fit is partial')),
      fact('traits', 'Traits', traits),
      fact('runes', 'Rune Sockets', `${args.selectedProgression.appliedRuneCount} / ${args.selectedProgression.runeSockets}`),
    ],
    recommendedAction: recommended,
    openDetailsButton: createButton('open-details', 'Open Details', 'secondary'),
    missingKnowledgeButton: createButton(
      'missing-knowledge',
      TECHNIQUES_EXACT_COPY.missingKnowledge,
      'ghost',
      Boolean(args.manualCityId),
      args.manualCityId ? undefined : 'No city with Manual Pavilion is available.',
    ),
  };
}

function buildRecommendedAction(mastery: number, rank: number, runeSockets: number): string {
  if (mastery < 50) return 'raise mastery to 50';
  if (rank < ACTIVE_PASSIVE_MIN_RANK_FLOOR) return 'upgrade rank';
  if (runeSockets <= 0) return 'unlock a rune socket';
  return 'keep this technique equipped';
}

function buildReadinessSegments(
  buildAnalysis: BuildAnalysis | null,
  postureFit: ReturnType<typeof evaluateCurrentCombatPostureFit> | null,
): TechniquesExactFactRowSurface[] {
  const coverage: Record<string, number> = buildAnalysis?.familyCoverage ?? {};
  const damage = (coverage.coreDamage ?? 0) > 0 || (coverage.execute ?? 0) > 0 ? 'Adequate' : 'Missing';
  const survival = (coverage.guard ?? 0) > 0 || (coverage.heal ?? 0) > 0 || (coverage.cleanse ?? 0) > 0 ? 'Good' : 'Thin';
  const control = (coverage.control ?? 0) > 0 || (coverage.setup ?? 0) > 0 ? 'Adequate' : 'Missing';
  return [
    fact('damage', 'Damage', damage, damage === 'Missing' ? 'red' : 'jade', damage === 'Missing' ? 'bad' : 'good'),
    fact('survival', 'Survival', survival, survival === 'Good' ? 'jade' : 'amber', survival === 'Good' ? 'good' : 'warning'),
    fact('control', 'Control', control, control === 'Missing' ? 'red' : 'jade', control === 'Missing' ? 'bad' : 'good'),
    fact('ai', 'AI', ratingLabel(postureFit?.aiFit), ratingTone(postureFit?.aiFit), ratingStatus(postureFit?.aiFit)),
    fact('medicine', 'Medicine', postureFit ? ratingLabel(postureFit.pouchFit) : 'External', postureFit ? ratingTone(postureFit.pouchFit) : 'muted'),
  ];
}

function ratingLabel(value?: string | null) {
  if (value === 'good') return 'Good';
  if (value === 'risky') return 'Thin';
  if (value === 'bad') return 'Missing';
  return 'External';
}

function ratingTone(value?: string | null): TechniquesExactTone {
  if (value === 'good') return 'jade';
  if (value === 'risky') return 'amber';
  if (value === 'bad') return 'red';
  return 'muted';
}

function ratingStatus(value?: string | null): TechniquesExactFactRowSurface['status'] {
  if (value === 'good') return 'good';
  if (value === 'risky') return 'warning';
  if (value === 'bad') return 'bad';
  return 'idle';
}

export function resolveManualPavilionCityIdForTechniquesExact(): string | null {
  const content = useContentStore.getState();
  const cities = content.citiesSorted.length > 0 ? content.citiesSorted : Object.values(content.maps.citiesById);
  const hasManualPavilion = (cityId: string | null | undefined) => {
    if (!cityId) return false;
    const city = content.maps.citiesById[cityId];
    return Boolean(city && (city.modules?.includes('manualPavilion') || city.refs?.pavilionId));
  };

  const cityState = useCityStore.getState();
  const currentCityId = cityState.currentCityId;

  if (hasManualPavilion(currentCityId)) return currentCityId;
  const unlocked = cityState.unlockedCityIds.find((cityId) => hasManualPavilion(cityId));
  if (unlocked) return unlocked;
  const first = cities.find((city) => hasManualPavilion(city.id));
  return first?.id ?? null;
}
