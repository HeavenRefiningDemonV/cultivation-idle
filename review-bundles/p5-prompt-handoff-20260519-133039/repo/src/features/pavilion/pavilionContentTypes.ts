import type { PavilionRecord, PavilionRecordState } from './pavilionTypes.js';

export interface PavilionManifestEntryRaw {
  id: string;
  title: string;
  category: string;
  plain: string;
  why?: string;
  sect?: string;
  how?: string;
  used?: string;
  mistakes?: string[];
  related: string[];
  state: string;
  tags: string[];
  route: string[];
  unlock?: string;
  jade?: string;
  quick_rule?: string;
  when_to_read?: string;
  player_question?: string;
  action_steps?: string[];
  readiness_checks?: string[];
  best_sources?: string[];
  fallback_sources?: string[];
  numbers_to_watch?: string[];
  diagnosis?: string[];
  elder?: string | null;
  prior?: string | null;
  labels?: Record<string, string>;
  implementation: string;
}

export interface PavilionGlobalLabels {
  main_screen: {
    full_title: 'Pavilion of Ten Thousand Records';
    short_nav: string;
    subtitle: 'Jade Slip Archive';
    search_placeholder: 'Search the Records';
    top_context_template: string;
    archive_completion: string;
    studied_count: string;
    mastered_count: string;
    breadcrumb_template: string;
  };
  navigation_tabs: string[];
  filters: string[];
  entry_section_labels: string[];
  right_rail_labels: string[];
  states: Record<string, string>;
  buttons: string[];
  empty_states: Record<string, string>;
}

export interface PavilionRecordsManifest {
  document: string;
  version: string;
  created: string;
  global_labels: PavilionGlobalLabels;
  entries: PavilionManifestEntryRaw[];
  generated_record_families?: unknown;
  known_named_records?: unknown;
  milestones?: unknown[];
}

const REQUIRED_LABEL_KEYS = [
  'main_screen',
  'navigation_tabs',
  'filters',
  'entry_section_labels',
  'right_rail_labels',
  'states',
  'buttons',
  'empty_states',
] as const;

const REQUIRED_NAVIGATION_TABS = [
  'First Steps',
  'Current Life',
  'Cultivation',
  'Gate Trials',
  'Cities',
  'Activities',
  'Combat',
  'Manuals',
  'Crafting',
  'Items',
  'Bestiary',
  'Bounties',
  'Reincarnation',
  'Systems',
  'Xianxia Glossary',
] as const;

const REQUIRED_FILTERS = [
  'Needed Now',
  'Needed Soon',
  'Recorded',
  'Studied',
  'Mastered',
  'Sealed',
  'Rumored',
  'Path: Heaven',
  'Path: Earth',
  'Path: Martial',
  'City',
  'Source',
  'Used For',
  'Rarity',
  'Activity',
  'Missing',
  'Safe to Sell',
  'Do Not Sell',
] as const;

const CATEGORY_LABEL_ALIASES: Record<string, string> = {
  'Disciple\'s First Steps': 'First Steps',
  'Disciple\u2019s First Steps': 'First Steps',
  'Current Life and Doctrine': 'Current Life',
  'Cultivation, Realms, and Breakthroughs': 'Cultivation',
  'Gate Trials and Thresholds': 'Gate Trials',
  'Cities and the Mortal World': 'Cities',
  'World Activities and Buildings': 'Activities',
  'Combat, Readiness, and Failure Diagnosis': 'Combat',
  'Manuals, Techniques, and Buildcraft': 'Manuals',
  'Crafting and Preparation': 'Crafting',
  'Items, Resources, and Economy': 'Items',
  'Bestiary and Encounters': 'Bestiary',
  'Bounties, Expeditions, and Offline Cultivation': 'Bounties',
  'Reincarnation and Prior Lives': 'Reincarnation',
  'Systems, UI, and Controls': 'Systems',
  'Xianxia Glossary': 'Xianxia Glossary',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function assertPavilion(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[PavilionContent] ${message}`);
  }
}

function assertStringArray(value: unknown, label: string): asserts value is string[] {
  assertPavilion(Array.isArray(value), `${label} must be an array`);
  value.forEach((entry, index) => {
    assertPavilion(typeof entry === 'string', `${label}[${index}] must be a string`);
  });
}

export function getPavilionCategoryLabel(category: string): string {
  return CATEGORY_LABEL_ALIASES[category] ?? category;
}

export function normalizePavilionCategoryId(labelOrCategory: string): string {
  const label = getPavilionCategoryLabel(labelOrCategory);
  return label
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['\u2019]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function normalizePavilionRecordState(value: string | PavilionRecordState | null | undefined): PavilionRecordState {
  const normalized = String(value ?? 'recorded').trim().toLowerCase();
  if (normalized === 'sealed') return 'sealed';
  if (normalized === 'rumored') return 'rumored';
  if (normalized === 'studied') return 'studied';
  if (normalized === 'mastered') return 'mastered';
  return 'recorded';
}

export function validatePavilionRecordsManifest(input: unknown): PavilionRecordsManifest {
  assertPavilion(isRecord(input), 'manifest root must be an object');
  assertPavilion(typeof input.document === 'string', 'document must be a string');
  assertPavilion(typeof input.version === 'string', 'version must be a string');
  assertPavilion(typeof input.created === 'string', 'created must be a string');
  assertPavilion(isRecord(input.global_labels), 'global_labels must be an object');

  for (const key of REQUIRED_LABEL_KEYS) {
    assertPavilion(key in input.global_labels, `global_labels.${key} is required`);
  }

  const labels = input.global_labels as Record<string, unknown>;
  assertPavilion(isRecord(labels.main_screen), 'global_labels.main_screen must be an object');
  assertStringArray(labels.navigation_tabs, 'global_labels.navigation_tabs');
  assertStringArray(labels.filters, 'global_labels.filters');
  assertStringArray(labels.entry_section_labels, 'global_labels.entry_section_labels');
  assertStringArray(labels.right_rail_labels, 'global_labels.right_rail_labels');
  assertPavilion(isRecord(labels.states), 'global_labels.states must be an object');
  assertStringArray(labels.buttons, 'global_labels.buttons');
  assertPavilion(isRecord(labels.empty_states), 'global_labels.empty_states must be an object');
  assertPavilion(Array.isArray(input.entries), 'entries must be an array');
  assertPavilion(input.entries.length >= 302, 'entries must contain at least 302 authored records');

  const navigationTabs = new Set((labels.navigation_tabs as string[]).map(getPavilionCategoryLabel));
  REQUIRED_NAVIGATION_TABS.forEach((label) => {
    assertPavilion(navigationTabs.has(label), `global_labels.navigation_tabs missing ${label}`);
  });
  const filterLabels = new Set(labels.filters as string[]);
  REQUIRED_FILTERS.forEach((label) => {
    assertPavilion(filterLabels.has(label), `global_labels.filters missing ${label}`);
  });

  const seen = new Set<string>();
  input.entries.forEach((entry, index) => {
    assertPavilion(isRecord(entry), `entries[${index}] must be an object`);
    const record = entry as Record<string, unknown>;
    for (const key of ['id', 'title', 'category', 'plain', 'state', 'implementation']) {
      assertPavilion(typeof record[key] === 'string', `entries[${index}].${key} must be a string`);
    }
    assertStringArray(record.tags, `entries[${index}].tags`);
    assertStringArray(record.related, `entries[${index}].related`);
    assertStringArray(record.route, `entries[${index}].route`);
    assertPavilion(!seen.has(record.id as string), `duplicate entry id ${String(record.id)}`);
    seen.add(record.id as string);
  });
  assertPavilion(seen.has('gate_trials_and_thresholds.foundation_gate'), 'default Foundation Gate entry is required');

  return input as unknown as PavilionRecordsManifest;
}

function buildSearchText(entry: PavilionManifestEntryRaw, categoryLabel: string): string {
  const specialAliases = entry.id === 'gate_trials_and_thresholds.foundation_gate'
    ? ['Foundation Breakthrough', 'Apothecary', 'Safety Net', 'Medicine weak', 'Path Heaven']
    : [];
  return [
    entry.title,
    entry.category,
    categoryLabel,
    entry.plain,
    entry.why,
    entry.sect,
    entry.how,
    entry.used,
    entry.jade,
    entry.quick_rule,
    entry.when_to_read,
    entry.player_question,
    ...(entry.action_steps ?? []),
    ...(entry.readiness_checks ?? []),
    ...(entry.best_sources ?? []),
    ...(entry.fallback_sources ?? []),
    ...(entry.numbers_to_watch ?? []),
    ...(entry.diagnosis ?? []),
    ...(entry.mistakes ?? []),
    ...entry.related,
    ...entry.tags,
    ...entry.route,
    ...specialAliases,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function normalizePavilionManifestEntries(manifest: PavilionRecordsManifest): PavilionRecord[] {
  return manifest.entries.map((entry) => {
    const categoryLabel = getPavilionCategoryLabel(entry.category);
    return {
      id: entry.id,
      title: entry.title,
      categoryId: normalizePavilionCategoryId(categoryLabel),
      categoryLabel,
      state: normalizePavilionRecordState(entry.state),
      tags: [...entry.tags],
      plain: entry.plain,
      why: entry.why,
      sect: entry.sect,
      how: entry.how,
      used: entry.used,
      mistakes: entry.mistakes ? [...entry.mistakes] : [],
      related: [...entry.related],
      route: [...entry.route],
      unlock: entry.unlock,
      jade: entry.jade ?? entry.plain,
      quickRule: entry.quick_rule,
      whenToRead: entry.when_to_read,
      playerQuestion: entry.player_question,
      actionSteps: entry.action_steps ? [...entry.action_steps] : [],
      readinessChecks: entry.readiness_checks ? [...entry.readiness_checks] : [],
      bestSources: entry.best_sources ? [...entry.best_sources] : [],
      fallbackSources: entry.fallback_sources ? [...entry.fallback_sources] : [],
      numbersToWatch: entry.numbers_to_watch ? [...entry.numbers_to_watch] : [],
      diagnosis: entry.diagnosis ? [...entry.diagnosis] : [],
      elder: entry.elder ?? null,
      prior: entry.prior ?? null,
      implementation: entry.implementation,
      searchText: buildSearchText(entry, categoryLabel),
      debug: {
        generated: false,
        unresolvedRelations: [],
      },
    };
  });
}
