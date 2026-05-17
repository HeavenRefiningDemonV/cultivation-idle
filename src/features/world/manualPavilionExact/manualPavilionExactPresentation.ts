import type { BuildGapCode } from '../../../systems/builds/buildAnalysisTypes.js';
import type { ManualOfferTag } from '../../../systems/manuals/manualOfferAnalysis.js';
import type { ManualGrade, ManualRarity } from '../../manuals/pavilionStockTypes.js';
import type {
  ManualLifecycleState,
  ManualPavilionButtonIntent,
  ManualPavilionActionKind,
  ManualPavilionButtonSurface,
  ManualPavilionChipSurface,
  ManualPavilionExactTone,
  ManualPavilionExactValueSource,
  ManualPrimaryReason,
  ManualPavilionSpineColorKey,
  ManualSpineTitleLength,
} from './manualPavilionExactTypes.js';

export const MANUAL_PAVILION_EXACT_SURFACE_VERSION = 'manual-pavilion-exact-v1';
export const MANUAL_PAVILION_TARGET_MOCKUP_ID = 'manual-pavilion-b3a76e7b-2048x1152';
export const MANUAL_PAVILION_EXACT_ROOT_TEST_ID = 'manual-pavilion-exact-page' as const;
export const MANUAL_PAVILION_DEFAULT_CITY_ID = 'city_pinewind_hamlet';
export const MANUAL_PAVILION_DEFAULT_PAVILION_ID = 'pavilion_pinewind_manual';
export const MANUAL_PAVILION_PRIMARY_SLOT_COUNT = 6;
export const MANUAL_PAVILION_VISIBLE_SLOT_ORDER_NOTE =
  'Primary-six scoring chooses the most useful offers, then restores original shelf order to preserve the spine wall.';

export const MANUAL_PAVILION_FIXTURE_COPY = {
  title: 'Manual Pavilion',
  subtitle: 'Spiritual texts \u00b7 build correction \u00b7 doctrine study',
  breadcrumb: 'Pinewind Hamlet / Manual Pavilion',
  stockRefreshLabel: 'Stock Refresh: 29:47',
  buildGapLine: 'one passive slot is empty; seek support or guard doctrine.',
  selectedManualTitle: 'Iron Palm Sutra',
} as const;

export const MANUAL_PAVILION_RARITY_WEIGHTS: Record<ManualRarity, number> = {
  legendary: 90,
  epic: 70,
  rare: 50,
  uncommon: 20,
  common: 0,
};

export const MANUAL_PAVILION_GRADE_LABELS: Record<ManualGrade, string> = {
  mortal: 'Mortal Grade',
  earth: 'Earth Grade',
  heaven: 'Heaven Grade',
  mystic: 'Mystic Grade',
};

export const MANUAL_PAVILION_RARITY_LABELS: Record<ManualRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

export const MANUAL_SPINE_TITLE_OVERRIDES: Record<string, string> = {};

export const MANUAL_PAVILION_TAG_SHORT_LABELS: Record<ManualOfferTag, string> = {
  'Build Fix': 'Slot Fix',
  'Path-Aligned': 'Path Fit',
  Support: 'Support',
  New: 'New',
  Duplicate: 'Duplicate',
  'Fragment Progress': 'Fragment',
  'Milestone Value': 'Gate Value',
};

export const MANUAL_PAVILION_TAG_TONES: Record<ManualOfferTag, ManualPavilionExactTone> = {
  'Build Fix': 'recommended',
  'Path-Aligned': 'jade',
  Support: 'bronze',
  New: 'positive',
  Duplicate: 'warning',
  'Fragment Progress': 'warning',
  'Milestone Value': 'recommended',
};

export const MANUAL_LIFECYCLE_LABELS: Record<ManualLifecycleState, string> = {
  unowned_affordable: 'New',
  unowned_unaffordable: 'Need Currency',
  owned_unstudied: 'In Satchel',
  studying: 'Studying',
  learned: 'Learned',
  duplicate_fragment: 'Fragments',
  sold: 'Purchased',
  sealed: 'Sealed',
  not_sold_here: 'Not sold here',
};

export const MANUAL_PRIMARY_REASON_LABELS: Record<ManualPrimaryReason, string> = {
  fills_empty_slot: 'Slot Fix',
  path_aligned: 'Path Fit',
  role_fix: 'Role Fix',
  survival_fix: 'Guard Need',
  damage_fix: 'Damage Need',
  support_manual: 'Support',
  new_technique: 'New',
  duplicate_fragments: 'Fragments',
  gate_prep: 'Gate Prep',
  collection: 'Collection',
};

export const MANUAL_ACTION_LABELS: Record<ManualPavilionActionKind, string> = {
  buy_and_study: 'Buy & Study',
  buy_to_satchel: 'Buy to Satchel',
  buy_duplicate_fragments: 'Buy Duplicate for Fragments',
  start_study: 'Start Study',
  open_satchel: 'Open Satchel',
  preview_technique: 'Preview Technique',
  open_techniques: 'Open in Techniques',
  view_rank_progress: 'View Rank Progress',
  free_refresh: 'Free Refresh',
  rush_refresh: 'Rush Refresh',
  return_world: 'Return to World',
  none: 'Unavailable',
};

export const MANUAL_PAVILION_GAP_LINES: Record<BuildGapCode, string> = {
  empty_slot: 'one unlocked technique slot is empty; seek a role-filling manual.',
  low_alignment: 'current doctrine is only partially path-aligned; favor matching texts.',
  missing_survival_tool: 'survival coverage is thin; seek guard or healing doctrine.',
  missing_setup_tool: 'setup and control coverage is thin; seek support doctrine.',
  low_mastery: 'equipped doctrine needs more mastery before harder gates.',
  low_rank: 'equipped doctrine ranks lag behind the semester floor.',
  rune_gap: 'rune sockets are underfilled; pair study with rune work.',
};

export const MANUAL_PAVILION_GAP_NEEDS: Record<BuildGapCode, string> = {
  empty_slot: 'Support / Passive',
  low_alignment: 'Path-Aligned',
  missing_survival_tool: 'Guard / Survival',
  missing_setup_tool: 'Setup / Control',
  low_mastery: 'Mastery / Core',
  low_rank: 'Rank / Core',
  rune_gap: 'Rune / Socket',
};

export function createManualPavilionButton(
  id: string,
  label: string,
  intent: ManualPavilionButtonIntent,
  options: {
    actionKind?: ManualPavilionActionKind;
    enabled?: boolean;
    visible?: boolean;
    ariaLabel?: string;
    disabledReason?: string | null;
    tone?: ManualPavilionExactTone;
    source?: ManualPavilionExactValueSource;
    testId?: string;
  } = {},
): ManualPavilionButtonSurface {
  const actionKind = options.actionKind ?? actionKindForIntent(intent);
  return {
    id,
    label,
    ariaLabel: options.ariaLabel ?? label,
    intent,
    actionKind,
    enabled: options.enabled ?? true,
    visible: options.visible ?? true,
    disabledReason: options.disabledReason ?? null,
    tone: options.tone ?? 'neutral',
    source: options.source ?? 'derived',
    testId: options.testId ?? `manual-pavilion-action-${actionKind}`,
  };
}

function actionKindForIntent(intent: ManualPavilionButtonIntent): ManualPavilionActionKind {
  switch (intent) {
    case 'return-to-world':
      return 'return_world';
    case 'buy-manual':
      return 'buy_to_satchel';
    case 'study-later':
      return 'buy_to_satchel';
    case 'view-techniques':
      return 'preview_technique';
    case 'refresh-stock':
      return 'free_refresh';
    case 'open-satchel':
      return 'open_satchel';
    default:
      return 'none';
  }
}

export function chip(
  id: string,
  label: string,
  tone: ManualPavilionExactTone = 'neutral',
  source: ManualPavilionExactValueSource = 'derived',
  iconKey?: string,
): ManualPavilionChipSurface {
  return { id, label, tone, source, iconKey };
}

export function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function buildManualSpineDisplayTitle(input: {
  techniqueId: string | null | undefined;
  fullTitle: string;
}): string {
  const override = input.techniqueId ? MANUAL_SPINE_TITLE_OVERRIDES[input.techniqueId] : null;
  if (override) return override;

  const clean = input.fullTitle
    .replace(/[’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  if (clean.length <= 18) return clean;

  const words = clean.split(' ').filter(Boolean);
  const twoWords = words.slice(0, 2).join(' ');
  if (twoWords.length > 0 && twoWords.length <= 18) return twoWords;

  const firstWord = words[0] ?? clean;
  if (firstWord.length <= 18) return firstWord;

  return `${firstWord.slice(0, 16)}...`;
}

export function classifyManualSpineTitleLength(title: string): ManualSpineTitleLength {
  const normalized = title.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 10) return 'short';
  if (normalized.length <= 16) return 'medium';
  if (normalized.length <= 22) return 'long';
  return 'veryLong';
}

export function formatThousands(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '0';
  const numeric = Number(String(value).replace(/,/g, ''));
  if (!Number.isFinite(numeric)) return String(value);
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(numeric);
}

export function formatCostLine(
  costs: Partial<Record<'gold' | 'spiritStones' | 'merit', string | number>>,
  emptyLabel = 'Unavailable',
): string {
  const rows: string[] = [];
  if (costs.gold !== undefined) rows.push(`${formatThousands(costs.gold)} Gold`);
  if (costs.merit !== undefined) rows.push(`${formatThousands(costs.merit)} Merit`);
  if (costs.spiritStones !== undefined) rows.push(`${formatThousands(costs.spiritStones)} Spirit Stones`);
  return rows.length > 0 ? rows.join(' \u00b7 ') : emptyLabel;
}

export function formatDurationCompact(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return 'Ready';
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function normalizeGradeLabel(grade: ManualGrade | string | null | undefined): string {
  return MANUAL_PAVILION_GRADE_LABELS[(grade ?? 'mortal') as ManualGrade] ?? `${titleCase(String(grade ?? 'mortal'))} Grade`;
}

export function normalizeRarityLabel(rarity: ManualRarity | string | null | undefined): string {
  return MANUAL_PAVILION_RARITY_LABELS[(rarity ?? 'common') as ManualRarity] ?? titleCase(String(rarity ?? 'common'));
}

export function spineColorForIndex(index: number, preferred?: string | null): ManualPavilionSpineColorKey {
  if (preferred === 'heaven') return 'bone';
  if (preferred === 'earth') return 'jade';
  if (preferred === 'martial') return 'cinnabar';
  const order: ManualPavilionSpineColorKey[] = ['bone', 'cinnabar', 'jade', 'bone', 'indigo', 'lacquer'];
  return order[index % order.length] ?? 'neutral';
}

export function pathFamilyLabel(path: string | null | undefined): string {
  if (path === 'heaven') return 'Heaven Family';
  if (path === 'earth') return 'Earth Family';
  if (path === 'martial') return 'Martial Family';
  return 'Unsorted Family';
}

export function pathFitLabel(pathAligned: boolean, supportOffer: boolean): string {
  if (pathAligned) return 'Path Fit: Strong';
  if (supportOffer) return 'Path Fit: Support';
  return 'Path Fit: Neutral';
}
