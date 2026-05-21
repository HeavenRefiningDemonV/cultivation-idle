import type {
  PavilionActionChipSurface,
  PavilionCategorySurface,
  PavilionEntrySurface,
  PavilionGuidanceGroupSurface,
  PavilionInfoChipSurface,
  PavilionSectionRowSurface,
  PavilionRecord,
  PavilionRecordListSurface,
  PavilionRecordState,
  PavilionSaveState,
  PavilionSurfaceV1,
  PavilionRuntimeSnapshot,
  PavilionThreadsBlockSurface,
} from './pavilionTypes.js';
import type { PavilionRecordsManifest } from './pavilionContentTypes.js';
import {
  normalizePavilionManifestEntries,
  normalizePavilionCategoryId,
} from './pavilionContentTypes.js';
import {
  PAVILION_CONTENT_VERSION_FALLBACK,
  PAVILION_DEFAULT_ENTRY_ID,
  PAVILION_FIRST_STEPS_ENTRY_ID,
  PAVILION_FIXTURE_RELATED,
  PAVILION_FIXTURE_RIBBON,
  PAVILION_FIXTURE_ROUTE_BUTTONS,
  PAVILION_FIXTURE_SECTIONS,
  buildPavilionRecordStateLegend,
} from './pavilionPresentation.js';
import {
  createDefaultPavilionSaveState,
  resolvePavilionRecordState,
} from './pavilionUnlocks.js';
import { buildGeneratedPavilionRecords } from './buildGeneratedPavilionRecords.js';
import { buildPavilionElderNote, createFallbackPavilionRuntimeSnapshot } from './buildPavilionRuntimeGuidance.js';
import { collectUnresolvedRelations, resolvePavilionRelatedEntries } from './pavilionRelations.js';
import { resolvePavilionRouteButton } from './pavilionRouteActions.js';
import { searchPavilionRecords } from './pavilionSearch.js';
import { buildLiveDaoMandateModuleSourceSinkProjection } from '../../systems/ui/daoMandate/index.js';

export interface BuildPavilionSurfaceArgs {
  mode: 'fixture' | 'live';
  manifest: PavilionRecordsManifest;
  content?: unknown;
  generatedRecords?: PavilionRecord[];
  generatedCounts?: Record<string, number>;
  generatedUnresolvedLinks?: string[];
  pavilionState?: Partial<PavilionSaveState> | null;
  runtime?: Partial<PavilionRuntimeSnapshot> | null;
  nowMs?: number;
  contentVersion?: string;
  jadeSlipEntryId?: string | null;
}

function stateLabel(state: PavilionRecordState): string {
  return state.replace(/\b\w/g, (char) => char.toUpperCase());
}

function routeContext(runtime: PavilionRuntimeSnapshot) {
  return {
    currentCityId: runtime.currentCityId,
    cityModules: runtime.cityModules,
    targetEntryId: runtime.recommendedEntryIds[0] ?? PAVILION_DEFAULT_ENTRY_ID,
  };
}

function applySaveStates(records: PavilionRecord[], saveState: PavilionSaveState): PavilionRecord[] {
  return records.map((record) => ({
    ...record,
    state: resolvePavilionRecordState(record, saveState),
    signals: saveState.pinnedEntryIds.includes(record.id)
      ? Array.from(new Set([...(record.signals ?? []), 'recommendedNow' as const]))
      : record.signals,
  }));
}

function pickSelectedEntry(args: {
  records: readonly PavilionRecord[];
  saveState: PavilionSaveState;
  runtime: PavilionRuntimeSnapshot;
  mode: 'fixture' | 'live';
}): PavilionRecord {
  const { records, saveState, runtime, mode } = args;
  const byId = new Map(records.map((record) => [record.id, record]));
  const preferredIds = mode === 'fixture'
    ? [saveState.selectedEntryId, PAVILION_DEFAULT_ENTRY_ID]
    : [
        saveState.selectedEntryId,
        runtime.recommendedEntryIds[0],
        PAVILION_DEFAULT_ENTRY_ID,
        PAVILION_FIRST_STEPS_ENTRY_ID,
      ];

  for (const entryId of preferredIds) {
    if (entryId && byId.has(entryId)) return byId.get(entryId)!;
  }

  const selectedCategoryId = saveState.selectedCategoryId;
  const firstInCategory = selectedCategoryId
    ? records.find((record) => record.categoryId === selectedCategoryId && record.state !== 'sealed')
    : null;
  return firstInCategory ?? records[0];
}

function buildCategories(
  manifest: PavilionRecordsManifest,
  records: readonly PavilionRecord[],
  selectedCategoryId: string,
): PavilionCategorySurface[] {
  const counts = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.categoryId] = (acc[record.categoryId] ?? 0) + 1;
    return acc;
  }, {});

  return manifest.global_labels.navigation_tabs.map((label) => {
    const id = normalizePavilionCategoryId(label);
    const hasWarning = records.some((record) => record.categoryId === id && record.signals?.includes('warning'));
    return {
      id,
      label,
      selected: id === selectedCategoryId,
      count: counts[id] ?? 0,
      stateKind: id === selectedCategoryId ? 'studied' : 'recorded',
      signal: hasWarning ? 'warning' : undefined,
    };
  });
}

function buildTags(record: PavilionRecord): PavilionEntrySurface['tags'] {
  const tags = record.id === PAVILION_DEFAULT_ENTRY_ID
    ? ['Milestone Gate', 'Readiness Check', 'Safety Net']
    : record.tags;
  return tags.slice(0, 5).map((tag, index) => ({
    id: normalizePavilionCategoryId(tag),
    label: tag,
    tone: index === 0 ? 'jade' : index === 1 ? 'blue' : 'bronze',
  }));
}

function pushSection(
  sections: PavilionEntrySurface['sections'],
  section: Omit<PavilionEntrySurface['sections'][number], 'number'>,
): void {
  const hasBody = typeof section.body === 'string' && section.body.trim().length > 0;
  const hasRows = Boolean(section.rows?.length);
  if (!hasBody && !hasRows) return;
  sections.push({ ...section, number: sections.length + 1 });
}

function buildGuidanceRows(
  values: readonly string[] | undefined,
  idPrefix: string,
  status: 'complete' | 'warning' | 'open' | 'sealed' = 'open',
): PavilionSectionRowSurface[] {
  return (values ?? [])
    .filter((value) => value.trim().length > 0)
    .slice(0, 8)
    .map((value, index) => ({
      id: `${idPrefix}-${index}`,
      label: value,
      status,
    }));
}


function buildSourceUse(record: PavilionRecord, mode: 'fixture' | 'live'): PavilionEntrySurface['sourceUseBlocks'] {
  if (mode === 'fixture' && record.id === PAVILION_DEFAULT_ENTRY_ID) {
    return [
      { id: 'source-apothecary', label: 'Best Source', value: 'Apothecary', kind: 'source', routeLabel: 'Route to Apothecary' },
      { id: 'used-foundation', label: 'Used For', value: 'Foundation Breakthrough', kind: 'usedFor', routeLabel: 'Route to Cultivation' },
    ];
  }
  if (record.sourceUse && record.sourceUse.length > 0) return record.sourceUse;
  return [
    { id: 'source', label: 'Known From', value: record.debug.generated ? 'Generated record' : 'Authored record', kind: 'source' },
  ];
}

function richToken(kind: 'term' | 'item' | 'stat' | 'route' | 'warning' | 'success' | 'action' | 'path' | 'realm', text: string): string {
  return `{${kind}|${text}}`;
}

function uniqueNonEmpty(values: readonly (string | undefined | null)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const trimmed = value?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    result.push(trimmed);
  });
  return result;
}

function rowFromText(
  text: string,
  idPrefix: string,
  index: number,
  status: PavilionSectionRowSurface['status'] = 'open',
): PavilionSectionRowSurface {
  return {
    id: `${idPrefix}-${index}`,
    label: text,
    status,
  };
}

function rowsFromValues(
  values: readonly string[] | undefined,
  idPrefix: string,
  status: PavilionSectionRowSurface['status'] = 'open',
  limit = 8,
): PavilionSectionRowSurface[] {
  return uniqueNonEmpty(values ?? [])
    .slice(0, limit)
    .map((value, index) => rowFromText(value, idPrefix, index, status));
}

function pathQuickAnswer(record: PavilionRecord): string | null {
  const normalizedTitle = record.title.toLowerCase();
  if (!record.tags.some((tag) => tag.toLowerCase() === 'path') && !normalizedTitle.endsWith(' path')) {
    return null;
  }

  if (normalizedTitle.includes('earth')) {
    return `${richToken('path', record.title)} is the defensive cultivation route. It rewards ${richToken('stat', 'HP')}, ${richToken('stat', 'Defense')}, ${richToken('item', 'armor floor')}, and ${richToken('action', 'survival AI')} more than raw burst damage.`;
  }

  if (normalizedTitle.includes('heaven')) {
    return `${richToken('path', record.title)} is the clarity and resonance route. It rewards clean doctrine fit, cultivation rhythm, and technique choices that keep the life profile coherent.`;
  }

  if (normalizedTitle.includes('martial')) {
    return `${richToken('path', record.title)} is the combat pressure route. It rewards weapon floor, offensive technique timing, and loadouts that end dangerous fights before attrition wins.`;
  }

  return `${richToken('path', record.title)} defines this life profile. Read it as a route and build check, not just a doctrine label.`;
}

function buildQuickAnswer(record: PavilionRecord): string {
  const pathAnswer = pathQuickAnswer(record);
  if (pathAnswer) return pathAnswer;

  if (record.id === PAVILION_DEFAULT_ENTRY_ID || record.id.startsWith('trial.')) {
    return `${richToken('term', record.title)} is the threshold check where cultivation progress must become prepared power. Clear it, use the safety net if eligible, then return to ${richToken('route', 'Cultivation')} for the breakthrough handoff.`;
  }

  if (record.debug.generated && record.categoryId === 'items') {
    return `${richToken('item', record.title)} is a live item record. Check ${richToken('term', 'Best Source')} and ${richToken('term', 'Used For')} before spending, selling, or farming for it.`;
  }

  if (record.debug.generated && record.id.startsWith('technique.')) {
    return `${richToken('term', record.title)} only changes combat after it is learned, equipped, and selected by an AI profile that can use its role.`;
  }

  if (record.quickRule?.trim()) return record.quickRule;
  return record.plain;
}

function buildBriefActions(record: PavilionRecord, routeButtons: PavilionEntrySurface['routeButtons']): PavilionActionChipSurface[] {
  const routeActions = routeButtons
    .filter((button) => button.enabled)
    .slice(0, 2)
    .map<PavilionActionChipSurface>((button) => ({
      id: `route-${button.id}`,
      label: button.label,
      tone: 'route',
      routeLabel: button.label,
      status: 'open',
    }));

  const authoredActions = uniqueNonEmpty(record.actionSteps ?? [])
    .slice(0, Math.max(1, 3 - routeActions.length))
    .map<PavilionActionChipSurface>((label, index) => ({
      id: `action-${index}`,
      label,
      tone: label.toLowerCase().includes('warning') ? 'warning' : 'action',
      status: 'open',
    }));

  const fallbackActions: PavilionActionChipSurface[] = routeActions.length || authoredActions.length
    ? []
    : [{
        id: 'action-read-ledger',
        label: 'Read source and use ledger',
        tone: 'action',
        status: 'open',
      }];

  return [...routeActions, ...authoredActions, ...fallbackActions].slice(0, 4);
}

function buildBriefWatch(record: PavilionRecord, runtime: PavilionRuntimeSnapshot): PavilionInfoChipSurface[] {
  const pathWatch = record.id === 'current_life_and_doctrine.earth_path'
    ? ['HP / Defense', 'Armor floor', 'Medicine count', 'Survival AI']
    : [];
  const runtimeWatch = [
    runtime.path !== 'No Path Selected' && record.tags.includes('path') ? `Current path: ${runtime.path}` : null,
    runtime.medicineWeak ? 'Medicine weak' : null,
    runtime.loadoutComplete ? 'Loadout complete' : null,
  ];
  return uniqueNonEmpty([
    ...pathWatch,
    ...runtimeWatch,
    ...(record.numbersToWatch ?? []),
  ])
    .slice(0, 6)
    .map<PavilionInfoChipSurface>((label, index) => ({
      id: `watch-${index}`,
      label,
      tone: label.toLowerCase().includes('medicine weak') ? 'warning' : label.toLowerCase().includes('path') ? 'path' : 'stat',
      status: label.toLowerCase().includes('weak') ? 'warning' : 'open',
    }));
}

function buildBriefWarnings(
  record: PavilionRecord,
  currentRelevance: PavilionEntrySurface['currentRelevance'],
): PavilionInfoChipSurface[] {
  return uniqueNonEmpty([
    currentRelevance?.tone === 'warning' ? `${currentRelevance.label}: ${currentRelevance.body}` : null,
    ...(record.diagnosis ?? []),
    ...(record.mistakes ?? []),
  ])
    .slice(0, 3)
    .map<PavilionInfoChipSurface>((label, index) => ({
      id: `warning-${index}`,
      label,
      tone: 'warning',
      status: 'warning',
    }));
}

function buildRecordBrief(args: {
  record: PavilionRecord;
  routeButtons: PavilionEntrySurface['routeButtons'];
  currentRelevance: PavilionEntrySurface['currentRelevance'];
  runtime: PavilionRuntimeSnapshot;
}): PavilionEntrySurface['recordBrief'] {
  const routeLabels = args.routeButtons
    .filter((button) => button.enabled)
    .map((button) => button.label);

  return {
    quickAnswer: buildQuickAnswer(args.record),
    currentUse: args.currentRelevance
      ? `${args.currentRelevance.label}: ${args.currentRelevance.body}`
      : undefined,
    doNext: buildBriefActions(args.record, args.routeButtons),
    watch: buildBriefWatch(args.record, args.runtime),
    warnings: buildBriefWarnings(args.record, args.currentRelevance),
    routeLabels,
  };
}

function buildSourceRows(
  record: PavilionRecord,
  sourceUseBlocks: PavilionEntrySurface['sourceUseBlocks'],
): PavilionSectionRowSurface[] {
  return [
    ...rowsFromValues(record.bestSources, 'best-source', 'complete'),
    ...sourceUseBlocks
      .filter((block) => block.kind === 'source' || block.label.toLowerCase().includes('source') || block.label.toLowerCase().includes('route'))
      .map<PavilionSectionRowSurface>((block) => ({
        id: `source-${block.id}`,
        label: block.label,
        value: block.value,
        status: block.kind === 'debug' ? 'warning' : 'complete',
        routeLabel: block.routeLabel,
      })),
    ...rowsFromValues(record.fallbackSources, 'fallback-source', 'open'),
  ];
}

function buildUsedForRows(
  sourceUseBlocks: PavilionEntrySurface['sourceUseBlocks'],
): PavilionSectionRowSurface[] {
  return sourceUseBlocks
    .filter((block) => block.kind === 'usedFor' || block.kind === 'requirement' || /used|consumed|unlock|found/i.test(block.label))
    .map((block) => ({
      id: `use-${block.id}`,
      label: block.label,
      value: block.value,
      status: block.kind === 'requirement' ? 'open' as const : 'complete' as const,
      routeLabel: block.routeLabel,
    }));
}

function pushGuidanceGroup(
  groups: PavilionGuidanceGroupSurface[],
  group: PavilionGuidanceGroupSurface,
): void {
  const hasBody = typeof group.body === 'string' && group.body.trim().length > 0;
  const hasRows = Boolean(group.rows?.length);
  if (!hasBody && !hasRows) return;
  groups.push(group);
}

function buildGuidanceGroups(args: {
  record: PavilionRecord;
  sourceUseBlocks: PavilionEntrySurface['sourceUseBlocks'];
  routeButtons: PavilionEntrySurface['routeButtons'];
  relatedEntries: PavilionEntrySurface['relatedEntries'];
  currentRelevance: PavilionEntrySurface['currentRelevance'];
}): PavilionGuidanceGroupSurface[] {
  const { record, sourceUseBlocks, routeButtons, relatedEntries, currentRelevance } = args;
  const groups: PavilionGuidanceGroupSurface[] = [];
  const requirementRows = [
    ...rowsFromValues(record.readinessChecks, 'readiness', 'open'),
    ...(record.unlock ? [rowFromText(record.unlock, 'unlock', 0, record.state === 'sealed' ? 'sealed' : 'open')] : []),
  ];
  const routeRows = routeButtons.map<PavilionSectionRowSurface>((button) => ({
    id: button.id,
    label: button.label,
    value: button.enabled ? undefined : button.disabledReason,
    status: button.enabled ? 'open' : 'sealed',
    routeLabel: button.label,
  }));
  const sourceRows = buildSourceRows(record, sourceUseBlocks);
  const usedForRows = buildUsedForRows(sourceUseBlocks);
  const mistakeRows = [
    ...rowsFromValues(record.mistakes, 'mistake', 'warning', 5),
    ...rowsFromValues(record.diagnosis, 'diagnosis', 'warning', 5),
  ];

  pushGuidanceGroup(groups, {
    id: 'answer',
    type: 'answer',
    title: 'What It Means',
    column: 'main',
    tone: 'positive',
    body: record.plain,
  });
  pushGuidanceGroup(groups, {
    id: 'why',
    type: 'why',
    title: 'Why It Matters Now',
    column: 'main',
    tone: currentRelevance?.tone === 'warning' ? 'warning' : 'plain',
    body: uniqueNonEmpty([
      currentRelevance ? `${currentRelevance.label}: ${currentRelevance.body}` : null,
      record.why,
      record.whenToRead,
    ]).join(' '),
  });
  pushGuidanceGroup(groups, {
    id: 'do-next',
    type: 'do-next',
    title: 'What To Do Next',
    column: 'main',
    tone: 'action',
    rows: [
      ...rowsFromValues(record.actionSteps, 'action', 'open', 5),
      ...routeRows,
    ],
  });
  pushGuidanceGroup(groups, {
    id: 'requirements',
    type: 'requirements',
    title: 'Requirements',
    column: 'side',
    tone: record.state === 'sealed' ? 'warning' : 'plain',
    rows: requirementRows,
  });
  pushGuidanceGroup(groups, {
    id: 'sources',
    type: 'sources',
    title: 'Best Source',
    column: 'side',
    tone: 'source',
    body: record.how,
    rows: sourceRows,
  });
  pushGuidanceGroup(groups, {
    id: 'used-for',
    type: 'used-for',
    title: 'What Uses This',
    column: 'side',
    tone: 'plain',
    body: record.used,
    rows: usedForRows,
  });
  pushGuidanceGroup(groups, {
    id: 'numbers',
    type: 'numbers',
    title: 'Numbers To Watch',
    column: 'side',
    tone: 'muted',
    rows: rowsFromValues(record.numbersToWatch, 'number', 'open', 8),
  });
  pushGuidanceGroup(groups, {
    id: 'mistakes',
    type: 'mistakes',
    title: 'Common Mistakes',
    column: 'main',
    tone: 'warning',
    rows: mistakeRows,
  });
  pushGuidanceGroup(groups, {
    id: 'lore',
    type: 'lore',
    title: 'Jade Slip',
    column: 'main',
    tone: 'lore',
    body: uniqueNonEmpty([record.jade, record.sect, record.elder ?? undefined, record.prior ?? undefined]).join(' '),
  });
  pushGuidanceGroup(groups, {
    id: 'relations',
    type: 'relations',
    title: 'Related Records',
    column: 'main',
    tone: 'muted',
    rows: relatedEntries.slice(0, 12).map((entry) => ({
      id: entry.id,
      label: entry.label,
      value: entry.unresolved ? 'Missing Relation' : undefined,
      status: entry.unresolved ? 'warning' : 'open',
    })),
  });
  pushGuidanceGroup(groups, {
    id: 'debug',
    type: 'debug',
    title: 'Archive Metadata',
    column: 'side',
    tone: 'muted',
    rows: [
      ...(record.debug.generated
        ? [{
            id: 'debug-source',
            label: 'Generated from',
            value: `${record.debug.sourceFamily ?? 'runtime content'}${record.debug.sourceId ? ` / ${record.debug.sourceId}` : ''}`,
            status: 'open' as const,
          }]
        : []),
      ...record.debug.unresolvedRelations.map<PavilionSectionRowSurface>((relation, index) => ({
        id: `debug-unresolved-${index}`,
        label: relation,
        status: 'warning' as const,
      })),
    ],
  });

  return groups;
}

function buildRouteButtons(
  record: PavilionRecord,
  runtime: PavilionRuntimeSnapshot,
  mode: 'fixture' | 'live',
): PavilionEntrySurface['routeButtons'] {
  if (mode === 'fixture' && record.id === PAVILION_DEFAULT_ENTRY_ID) return PAVILION_FIXTURE_ROUTE_BUTTONS;
  return record.route.map((label) => resolvePavilionRouteButton(label, routeContext(runtime)));
}

function buildAdaptiveSections(args: {
  record: PavilionRecord;
  sourceUseBlocks: PavilionEntrySurface['sourceUseBlocks'];
  routeButtons: PavilionEntrySurface['routeButtons'];
  relatedEntries: PavilionEntrySurface['relatedEntries'];
  currentRelevance: PavilionEntrySurface['currentRelevance'];
}): PavilionEntrySurface['sections'] {
  const { record, sourceUseBlocks, routeButtons, relatedEntries, currentRelevance } = args;
  const sections: PavilionEntrySurface['sections'] = [];

  pushSection(sections, {
    id: 'jade-slip',
    title: 'Jade Slip',
    body: record.jade,
    tone: record.debug.generated ? 'muted' : 'positive',
  });
  pushSection(sections, {
    id: 'sect-note',
    title: 'Sect Note',
    body: record.sect,
  });
  pushSection(sections, {
    id: 'plain-meaning',
    title: 'Plain Meaning',
    body: record.plain,
  });
  pushSection(sections, {
    id: 'why-it-matters',
    title: 'Why It Matters',
    body: record.why,
  });
  pushSection(sections, {
    id: 'current-relevance',
    title: 'Current Relevance',
    body: currentRelevance ? `${currentRelevance.label}: ${currentRelevance.body}` : undefined,
    tone: currentRelevance?.tone === 'warning' ? 'warning' : currentRelevance?.tone === 'positive' ? 'positive' : 'plain',
  });
  pushSection(sections, {
    id: 'player-question',
    title: 'Player Question',
    body: record.playerQuestion,
  });
  pushSection(sections, {
    id: 'quick-rule',
    title: 'Quick Rule',
    body: record.quickRule,
    tone: 'positive',
  });
  pushSection(sections, {
    id: 'when-to-read',
    title: 'When To Read',
    body: record.whenToRead,
  });
  pushSection(sections, {
    id: 'what-to-do-next',
    title: 'What To Do Next',
    rows: buildGuidanceRows(record.actionSteps, 'action-step', 'open'),
  });
  pushSection(sections, {
    id: 'readiness-checks',
    title: 'Readiness Checks',
    rows: buildGuidanceRows(record.readinessChecks, 'readiness-check', 'complete'),
  });
  pushSection(sections, {
    id: 'how-to-get',
    title: 'How to Get / Where to Act',
    body: record.how,
  });
  pushSection(sections, {
    id: 'used-for',
    title: 'Used For',
    body: record.used,
  });
  pushSection(sections, {
    id: 'requirements',
    title: 'Requirements',
    body: record.unlock,
    tone: record.state === 'sealed' ? 'warning' : 'plain',
  });

  const sourceRows = sourceUseBlocks.map((block) => ({
    id: block.id,
    label: block.label,
    value: block.value,
    status: block.kind === 'debug' ? 'warning' as const : 'complete' as const,
    routeLabel: block.routeLabel,
  }));
  pushSection(sections, {
    id: 'source-use-ledger',
    title: 'Source / Use Ledger',
    rows: sourceRows,
  });

  const bestSourceRows = [
    ...buildGuidanceRows(record.bestSources, 'authored-best-source', 'complete'),
    ...sourceUseBlocks
      .filter((block) => block.label.toLowerCase().includes('source') || block.kind === 'source')
      .map((block) => ({
        id: `best-${block.id}`,
        label: block.value,
        value: block.routeLabel,
        status: block.kind === 'debug' ? 'warning' as const : 'complete' as const,
        routeLabel: block.routeLabel,
      })),
  ];
  pushSection(sections, {
    id: 'best-source',
    title: 'Best Source',
    rows: bestSourceRows,
  });

  pushSection(sections, {
    id: 'numbers-to-watch',
    title: 'Numbers To Watch',
    rows: buildGuidanceRows(record.numbersToWatch, 'number-to-watch', 'open'),
  });

  const fallbackRows = [
    ...buildGuidanceRows(record.fallbackSources, 'authored-fallback-source', 'open'),
    ...sourceUseBlocks
      .filter((block) => block.label.toLowerCase().includes('fallback'))
      .map((block) => ({
        id: `fallback-${block.id}`,
        label: block.value,
        value: block.routeLabel,
        status: 'open' as const,
        routeLabel: block.routeLabel,
      })),
  ];
  pushSection(sections, {
    id: 'fallback-source',
    title: 'Fallback Source',
    rows: fallbackRows,
  });

  pushSection(sections, {
    id: 'failure-diagnosis',
    title: 'Failure Diagnosis',
    rows: buildGuidanceRows(record.diagnosis, 'diagnosis', 'warning'),
    tone: 'warning',
  });

  pushSection(sections, {
    id: 'elder-note',
    title: 'Elder Note',
    body: record.elder ?? undefined,
  });

  pushSection(sections, {
    id: 'prior-life-note',
    title: 'Prior-Life Note',
    body: record.prior ?? undefined,
    tone: 'muted',
  });

  if ((record.mistakes ?? []).length > 0) {
    pushSection(sections, {
      id: 'common-mistakes',
      title: 'Common Mistakes',
      rows: (record.mistakes ?? []).slice(0, 5).map((mistake, index) => ({
        id: `mistake-${index}`,
        label: mistake,
        status: 'warning',
      })),
    });
  }

  pushSection(sections, {
    id: 'route-buttons',
    title: 'Route Buttons',
    rows: routeButtons.map((button) => ({
      id: button.id,
      label: button.label,
      value: button.enabled ? undefined : button.disabledReason,
      status: button.enabled ? 'open' : 'sealed',
      routeLabel: button.label,
    })),
  });
  pushSection(sections, {
    id: 'related-records',
    title: 'Related Records',
    rows: relatedEntries.slice(0, 8).map((entry) => ({
      id: entry.id,
      label: entry.label,
      value: entry.unresolved ? 'Missing Relation' : undefined,
      status: entry.unresolved ? 'warning' : 'open',
    })),
  });

  return sections;
}

function buildEntrySurface(
  record: PavilionRecord,
  records: readonly PavilionRecord[],
  runtime: PavilionRuntimeSnapshot,
  mode: 'fixture' | 'live',
): PavilionEntrySurface {
  const sourceUseBlocks = buildSourceUse(record, mode);
  const routeButtons = buildRouteButtons(record, runtime, mode);
  const relatedLabels = mode === 'fixture' && record.id === PAVILION_DEFAULT_ENTRY_ID
    ? PAVILION_FIXTURE_RELATED
    : record.related;
  const relatedEntries = resolvePavilionRelatedEntries(relatedLabels, records);
  const isFixtureFoundation = mode === 'fixture' && record.id === PAVILION_DEFAULT_ENTRY_ID;
  const currentRelevance = record.signals?.includes('recommendedNow') || isFixtureFoundation
    ? {
        label: 'Recommended now',
        body: isFixtureFoundation || runtime.medicineWeak
          ? 'near the threshold, but medicine is weak.'
          : `${runtime.milestone}.`,
        tone: isFixtureFoundation || runtime.medicineWeak ? 'warning' as const : 'neutral' as const,
      }
    : record.signals?.includes('warning')
      ? {
          label: 'Archive warning',
          body: record.debug.unresolvedRelations[0] ?? 'Some source or use relations are unresolved.',
          tone: 'warning' as const,
        }
      : record.debug.generated
        ? {
            label: 'Live content record',
            body: `Generated from ${record.debug.sourceFamily ?? 'runtime content'}; current ownership and route availability are derived where the runtime exposes them.`,
            tone: 'neutral' as const,
          }
        : null;
  const sections = isFixtureFoundation
    ? PAVILION_FIXTURE_SECTIONS
    : buildAdaptiveSections({
        record,
        sourceUseBlocks,
        routeButtons,
        relatedEntries,
        currentRelevance,
      });
  const recordBrief = buildRecordBrief({
    record,
    routeButtons,
    currentRelevance,
    runtime,
  });
  const guidanceGroups = buildGuidanceGroups({
    record,
    sourceUseBlocks,
    routeButtons,
    relatedEntries,
    currentRelevance,
  });
  return {
    id: record.id,
    title: record.title,
    categoryId: record.categoryId,
    categoryLabel: isFixtureFoundation ? 'Gate Trial' : record.categoryLabel,
    stateLabel: isFixtureFoundation ? 'Recorded / Studied' : stateLabel(record.state),
    stateKind: isFixtureFoundation ? 'studied' : record.state,
    signals: record.signals ?? (isFixtureFoundation ? ['recommendedNow', 'warning'] : []),
    tags: buildTags(record),
    sections,
    recordBrief,
    guidanceGroups,
    requirements: sections.find((section) => section.id === 'hard-requirements')?.rows?.map((row) => ({
      id: row.id,
      label: row.label,
      status: row.status ?? 'open',
      detail: row.value,
    })) ?? [],
    sourceUseBlocks,
    routeButtons,
    relatedEntries,
    currentRelevance,
    debug: record.debug,
  };
}

function buildRightRail(
  selected: PavilionEntrySurface,
  runtime: PavilionRuntimeSnapshot,
  mode: 'fixture' | 'live',
): PavilionSurfaceV1['rightRail'] {
  if (mode === 'fixture' && selected.id === PAVILION_DEFAULT_ENTRY_ID) {
    const blocks: PavilionThreadsBlockSurface[] = [
      { id: 'best-source', title: 'Best Source', items: [{ id: 'best-source-apothecary', label: 'Apothecary', stateKind: 'recorded' }] },
      { id: 'used-for', title: 'Used For', items: [{ id: 'used-foundation', label: 'Foundation Breakthrough', stateKind: 'recorded' }] },
      { id: 'related', title: 'Related Records', items: selected.relatedEntries },
      { id: 'milestone', title: 'Current Milestone', items: [{ id: 'milestone-foundation', label: runtime.milestone, stateKind: 'recorded' }] },
      { id: 'prior-life', title: 'Prior-Life Note', items: [{ id: 'prior-life-foundation', label: runtime.priorLifeNotes[selected.id]?.[0] ?? 'Past life failed here due to weak medicine.', stateKind: 'rumored' }] },
    ];
    return { title: 'Threads of Karma', blocks };
  }

  const groupedSourceUse = selected.sourceUseBlocks.reduce<Record<string, PavilionThreadsBlockSurface['items']>>((acc, block) => {
    const title = block.label || (block.kind === 'source' ? 'Best Source' : 'Used For');
    acc[title] = acc[title] ?? [];
    acc[title].push({
      id: block.id,
      label: block.value,
      stateKind: block.kind === 'debug' ? 'rumored' as const : 'recorded' as const,
      routeLabel: block.routeLabel,
    });
    return acc;
  }, {});

  const sourceUseBlocks: PavilionThreadsBlockSurface[] = Object.entries(groupedSourceUse).map(([title, items]) => ({
    id: normalizePavilionCategoryId(`thread-${title}`),
    title,
    items,
  }));
  const routeItems = selected.routeButtons.map((button) => ({
    id: button.id,
    label: button.enabled ? button.label : `${button.label}: ${button.disabledReason ?? 'unavailable'}`,
    stateKind: button.enabled ? 'recorded' as const : 'sealed' as const,
    routeLabel: button.label,
  }));
  const priorLife = runtime.priorLifeNotes[selected.id]?.map((note, index) => ({
    id: `prior-life-${index}`,
    label: note,
    stateKind: 'rumored' as const,
  })) ?? [];
  const blocks: PavilionThreadsBlockSurface[] = [
    ...sourceUseBlocks,
    { id: 'related', title: 'Related Records', items: selected.relatedEntries },
    { id: 'milestone', title: 'Current Milestone', items: [{ id: 'milestone-current', label: runtime.milestone, stateKind: 'recorded' }] },
  ];
  if (priorLife.length > 0) {
    blocks.push({ id: 'prior-life', title: 'Prior-Life Note', items: priorLife });
  }
  if (routeItems.length > 0) {
    blocks.push({ id: 'route', title: 'Route', items: routeItems });
  }

  return {
    title: 'Threads of Karma',
    blocks: blocks.filter((block) => block.items.length > 0),
  };
}

function applyRecommendedSignals(records: PavilionRecord[], runtime: PavilionRuntimeSnapshot): PavilionRecord[] {
  const recommended = new Set(runtime.recommendedEntryIds);
  return records.map((record) => ({
    ...record,
    signals: Array.from(new Set([
      ...(record.signals ?? []),
      ...(recommended.has(record.id) ? ['recommendedNow' as const] : []),
      ...(record.debug.unresolvedRelations.length > 0 ? ['warning' as const] : []),
      ...(record.state === 'sealed' ? ['future' as const] : []),
    ])),
  }));
}

function countStates(records: readonly PavilionRecord[]): Record<PavilionRecordState, number> {
  return records.reduce<Record<PavilionRecordState, number>>((acc, record) => {
    acc[record.state] += 1;
    return acc;
  }, { sealed: 0, rumored: 0, recorded: 0, studied: 0, mastered: 0 });
}

function recordListSummary(record: PavilionRecord): string {
  const firstTag = record.tags.find(Boolean);
  if (record.debug.generated) {
    return [record.categoryLabel, firstTag, record.debug.sourceFamily].filter(Boolean).join(' / ');
  }
  return firstTag ? `${record.categoryLabel} / ${firstTag}` : record.categoryLabel;
}

function buildRecordList(args: {
  records: readonly PavilionRecord[];
  selectedEntryId: string;
  selectedCategoryId: string;
  selectedCategoryLabel: string;
  saveState: PavilionSaveState;
  runtime: PavilionRuntimeSnapshot;
  mode: 'fixture' | 'live';
}): PavilionRecordListSurface {
  const { records, selectedEntryId, selectedCategoryId, selectedCategoryLabel, saveState, runtime, mode } = args;
  const query = mode === 'fixture' ? '' : saveState.searchQuery;
  const filters = mode === 'fixture' ? [] : saveState.activeFilters;
  const sourceRecords = query.trim()
    ? records
    : records.filter((record) => record.categoryId === selectedCategoryId);
  const results = searchPavilionRecords({
    records: sourceRecords,
    query,
    filters,
    recommendedEntryIds: runtime.recommendedEntryIds,
  }).results;
  const modeLabel = query.trim() ? 'search' : 'category';

  return {
    title: modeLabel === 'search'
      ? `Search Results for "${query.trim()}"`
      : `${selectedCategoryLabel} Records`,
    mode: modeLabel,
    emptyLabel: 'No record found. Loosen the seal, clear filters, or search by source, use, city, path, or milestone.',
    totalMatches: results.length,
    records: results.slice(0, 80).map((record) => ({
      id: record.id,
      title: record.title,
      categoryId: record.categoryId,
      categoryLabel: record.categoryLabel,
      stateKind: record.state,
      signals: record.signals ?? [],
      generated: record.debug.generated,
      selected: record.id === selectedEntryId,
      summary: recordListSummary(record),
    })),
  };
}

export function buildPavilionSurface(args: BuildPavilionSurfaceArgs): PavilionSurfaceV1 {
  const saveState = { ...createDefaultPavilionSaveState(), ...(args.pavilionState ?? {}) };
  const runtime: PavilionRuntimeSnapshot = {
    ...createFallbackPavilionRuntimeSnapshot(),
    ...(args.runtime ?? {}),
    ...(args.mode === 'fixture' ? PAVILION_FIXTURE_RIBBON : {}),
  };
  if (args.mode === 'fixture') {
    runtime.recommendedEntryIds = [PAVILION_DEFAULT_ENTRY_ID];
    runtime.priorLifeNotes = {
      ...runtime.priorLifeNotes,
      [PAVILION_DEFAULT_ENTRY_ID]: ['Past life failed here due to weak medicine.'],
    };
  }

  const generated = args.generatedRecords
    ? {
        records: args.generatedRecords,
        generatedCounts: args.generatedCounts ?? {},
        unresolvedLinks: args.generatedUnresolvedLinks ?? [],
      }
    : buildGeneratedPavilionRecords({ content: args.content });
  const authored = normalizePavilionManifestEntries(args.manifest);
  const allRecords = applyRecommendedSignals(applySaveStates([...authored, ...generated.records], saveState), runtime);
  const selectedRecord = pickSelectedEntry({
    records: allRecords,
    saveState,
    runtime,
    mode: args.mode,
  });
  const fixtureRecordOverride = args.mode === 'fixture'
    && Boolean(saveState.selectedEntryId)
    && selectedRecord.id === saveState.selectedEntryId
    && selectedRecord.id !== PAVILION_DEFAULT_ENTRY_ID;
  const selectedCategoryId = args.mode === 'fixture'
    ? fixtureRecordOverride ? selectedRecord.categoryId : 'gate-trials'
    : saveState.selectedCategoryId ?? selectedRecord.categoryId;
  const selectedCategoryLabel = args.manifest.global_labels.navigation_tabs.find((label) => (
    normalizePavilionCategoryId(label) === selectedCategoryId
  )) ?? selectedRecord.categoryLabel;
  const selectedEntry = buildEntrySurface(selectedRecord, allRecords, runtime, args.mode);
  const recordList = buildRecordList({
    records: allRecords,
    selectedEntryId: selectedRecord.id,
    selectedCategoryId,
    selectedCategoryLabel,
    saveState,
    runtime,
    mode: args.mode,
  });
  const stateCounts = args.mode === 'fixture'
    ? { sealed: 12, rumored: 65, recorded: 137, studied: 89, mastered: 23 }
    : countStates(allRecords);
  const totalCount = args.mode === 'fixture' ? 214 : allRecords.length;
  const filterLabels = args.mode === 'fixture'
    ? ['Needed Now', 'Recorded', 'Sealed', 'Path: Heaven']
    : args.manifest.global_labels.filters;

  return {
    meta: {
      mode: args.mode,
      selectedEntryId: selectedRecord.id,
      selectedCategoryId,
      rootTestId: 'pavilion-exact-page',
      generatedAt: args.nowMs ?? Date.now(),
      contentVersion: args.contentVersion ?? args.manifest.version ?? PAVILION_CONTENT_VERSION_FALLBACK,
    },
    page: {
      title: 'Pavilion of Ten Thousand Records',
      subtitle: 'Jade Slip Archive',
      titleSealText: 'Records',
    },
    currentLifeRibbon: {
      realm: runtime.realm,
      path: runtime.path,
      heartLaw: runtime.heartLaw,
      city: runtime.city,
      milestone: runtime.milestone,
      display: [runtime.realm, runtime.path, runtime.heartLaw, runtime.city, runtime.milestone].join(' \u00b7 '),
    },
    search: {
      query: saveState.searchQuery,
      placeholder: 'Search the Records',
      filterChips: filterLabels.map((label) => ({
        id: normalizePavilionCategoryId(label),
        label,
        active: args.mode === 'fixture'
          ? ['Needed Now', 'Recorded', 'Sealed', 'Path: Heaven'].includes(label)
          : saveState.activeFilters.includes(label),
      })),
    },
    categories: buildCategories(args.manifest, allRecords, selectedCategoryId),
    recordList,
    selectedEntry,
    rightRail: buildRightRail(selectedEntry, runtime, args.mode),
    elderNote: buildPavilionElderNote(runtime, args.mode),
    mandateSourceSink: args.mode === 'live'
      ? buildLiveDaoMandateModuleSourceSinkProjection({
        currentCityId: runtime.currentCityId,
        currentModuleKey: 'records',
        currentScreen: 'records',
      })
      : null,
    recordStatesLegend: buildPavilionRecordStateLegend(args.manifest.global_labels.states),
    footer: {
      breadcrumbs: ['Pavilion of Ten Thousand Records', selectedCategoryId === 'gate-trials' ? 'Gate Trials' : selectedRecord.categoryLabel, selectedRecord.title],
      recordsDiscoveredLabel: `Records Discovered: ${stateCounts.recorded} / ${totalCount}`,
      studiedLabel: `Studied: ${stateCounts.studied}`,
      masteredLabel: `Mastered: ${stateCounts.mastered}`,
    },
    jadeSlipDrawer: args.jadeSlipEntryId
      ? {
          entryId: args.jadeSlipEntryId,
          title: allRecords.find((record) => record.id === args.jadeSlipEntryId)?.title ?? 'Jade Slip',
          body: allRecords.find((record) => record.id === args.jadeSlipEntryId)?.jade ?? '',
        }
      : null,
    debug: {
      unresolvedLinks: Array.from(new Set([...generated.unresolvedLinks, ...collectUnresolvedRelations(allRecords)])).sort(),
      generatedCounts: generated.generatedCounts,
      missingRuntimeData: runtime.missingRuntimeData,
      routeFailures: selectedEntry.routeButtons
        .filter((button) => !button.enabled)
        .map((button) => `${button.label}: ${button.disabledReason ?? 'disabled'}`),
    },
  };
}
