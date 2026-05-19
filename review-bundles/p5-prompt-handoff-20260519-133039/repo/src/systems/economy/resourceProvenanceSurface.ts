import type { ValidatedContent } from '../../content/index.js';
import { getWorldModuleLabel } from '../../ui/text/playerFacingLabels.js';
import { buildBestSourceIndex, getBestSourceIndexEntry, type BestSourceOption } from './bestSourceIndex.js';
import { getAllPrepBudgetRegistryEntries } from './prepBudgetRegistry.js';
import { listVisibleForgeInputItemIds } from './economicSourceAdapters.js';
import { p3ModuleRoute, type P3ModuleKey, type P3Route } from '../world/p3SurfaceTypes.js';

export interface ResourceProvenanceSurfaceV1 {
  version: 1;
  kind: 'item' | 'currency' | 'fragment' | 'manual' | 'merit';
  id: string;
  displayName: string;
  displayPriority: 'critical' | 'recommended' | 'useful' | 'future' | 'archive';
  purpose: ResourcePurpose;
  sourceTags: ResourceSourceTag[];
  sinkTags: ResourceSinkTag[];
  currentGateRelevance: ResourceCurrentRelevance;
  bestSourceRoute?: ResourceRoute;
  bestSinkRoute?: ResourceRoute;
  futureUseRealm?: string;
  quantityLine?: string;
  warningLine?: string;
  debugNotes: string[];
}

export interface ResourcePurpose {
  label: string;
  explanation: string;
}

export interface ResourceSourceTag {
  moduleKey?: P3ModuleKey;
  label: string;
  detail: string;
}

export interface ResourceSinkTag {
  moduleKey?: P3ModuleKey;
  label: string;
  detail: string;
}

export interface ResourceCurrentRelevance {
  state: 'required_now' | 'recommended_now' | 'solves_current_blocker' | 'useful_support' | 'future_use' | 'archive';
  line: string;
}

export interface ResourceRoute extends P3Route {
  moduleKey?: P3ModuleKey;
}

interface BuildResourceProvenanceSurfaceArgs {
  content: ValidatedContent;
  kind: ResourceProvenanceSurfaceV1['kind'];
  id: string;
  currentCityId?: string | null;
  currentShortageIds?: readonly string[];
  quantity?: number;
}

function itemName(content: ValidatedContent, id: string, kind: ResourceProvenanceSurfaceV1['kind']): string {
  if (id === 'gold') return 'Gold';
  if (id === 'merit') return 'Merit';
  if (id === 'spiritStones') return 'Spirit Stones';
  return content.items.find((item) => item.id === id)?.name ?? (kind === 'manual' ? id.replace(/^manual_/, 'Manual ') : id);
}

function optionToSourceTag(option: BestSourceOption): ResourceSourceTag {
  return {
    moduleKey: option.moduleKey,
    label: getWorldModuleLabel(option.moduleKey),
    detail: option.shortReason || option.reason,
  };
}

function optionToRoute(option: BestSourceOption): ResourceRoute {
  return {
    ...p3ModuleRoute(option.moduleKey, option.reason, option.cityId),
    label: getWorldModuleLabel(option.moduleKey),
    actionLabel: `Open ${getWorldModuleLabel(option.moduleKey)}`,
  };
}

function prepUse(content: ValidatedContent, id: string): 'minimum' | 'recommended' | null {
  for (const entry of getAllPrepBudgetRegistryEntries()) {
    if (entry.minimumPrepPackage.stockPackage.directCore.some((line) => line.itemId === id)) return 'minimum';
    if (entry.minimumPrepPackage.stockPackage.supplementLanes.some((lane) => lane.optionItemIds.includes(id))) return 'minimum';
    if (entry.recommendedPrepPackage.stockPackage.directCore.some((line) => line.itemId === id)) return 'recommended';
    if (entry.recommendedPrepPackage.stockPackage.supplementLanes.some((lane) => lane.optionItemIds.includes(id))) return 'recommended';
  }
  void content;
  return null;
}

function isForgeInput(content: ValidatedContent, id: string): boolean {
  return listVisibleForgeInputItemIds(content).includes(id);
}

function buildSinkTags(content: ValidatedContent, id: string, kind: ResourceProvenanceSurfaceV1['kind']): ResourceSinkTag[] {
  if (id === 'merit' || kind === 'merit') {
    return [{ moduleKey: 'gateTrial', label: 'Safety Net reserve', detail: 'Merit supports fail-safe and bounded gate fallback reserves.' }];
  }
  if (id.startsWith('gate_')) {
    return [{ moduleKey: 'cultivation', label: 'Breakthrough proof', detail: 'Gate proof should route to Cultivation breakthrough after the trial is cleared or bypassed.' }];
  }
  if (id === 'mat_technique_fragment' || id.startsWith('frag_manual') || id.startsWith('crate_manual')) {
    return [
      { moduleKey: 'manualPavilion', label: 'Manual support', detail: 'Feeds doctrine acquisition and duplicate conversion.' },
      { moduleKey: 'techniques', label: 'Technique rank', detail: 'Supports equipped technique rank and mastery work.' },
    ];
  }
  const sinks: ResourceSinkTag[] = [];
  const prep = prepUse(content, id);
  if (prep) {
    sinks.push({
      moduleKey: 'apothecary',
      label: prep === 'minimum' ? 'Gate prep minimum' : 'Gate prep recommendation',
      detail: 'Used by the Apothecary prep package and gate readiness rows.',
    });
  }
  if (isForgeInput(content, id)) {
    sinks.push({ moduleKey: 'forge', label: 'Forge floor', detail: 'Used by Forge recipes and permanent floor work.' });
  }
  return sinks;
}

function purposeFor(content: ValidatedContent, id: string, kind: ResourceProvenanceSurfaceV1['kind']): ResourcePurpose {
  if (id === 'merit' || kind === 'merit') {
    return { label: 'Support reserve', explanation: 'Merit turns directed city work into Safety Net and support-route readiness.' };
  }
  if (id.startsWith('gate_')) {
    return { label: 'Gate proof', explanation: 'Proof belongs to the breakthrough handoff, not trial entry unless content has a separate required item.' };
  }
  if (id === 'mat_technique_fragment' || id.startsWith('frag_manual') || kind === 'fragment' || kind === 'manual') {
    return { label: 'Doctrine support', explanation: 'Used to turn manuals and duplicates into technique progress.' };
  }
  if (isForgeInput(content, id)) {
    return { label: 'Permanent floor', explanation: 'Used to refine gear and raise permanent readiness floors.' };
  }
  if (prepUse(content, id)) {
    return { label: 'Immediate readiness', explanation: 'Used in the current or near-future Apothecary gate package.' };
  }
  return { label: 'General resource', explanation: content.items.find((item) => item.id === id)?.description ?? 'No current high-priority sink is exposed.' };
}

function relevance(args: BuildResourceProvenanceSurfaceArgs, sinks: readonly ResourceSinkTag[]): ResourceCurrentRelevance {
  if (args.currentShortageIds?.includes(args.id)) {
    return { state: 'solves_current_blocker', line: 'Solves current blocker: this is part of the active shortage route.' };
  }
  if (sinks.some((tag) => /minimum/i.test(tag.label))) {
    return { state: 'required_now', line: 'Required now by a gate prep minimum row.' };
  }
  if (sinks.some((tag) => /recommend/i.test(tag.label))) {
    return { state: 'recommended_now', line: 'Recommended now by a prep package row.' };
  }
  if (sinks.length > 0) {
    return { state: 'useful_support', line: 'Useful support for a visible module sink.' };
  }
  return { state: 'future_use', line: 'No current sink is active; keep as future/archive material.' };
}

function priority(relevanceState: ResourceCurrentRelevance['state']): ResourceProvenanceSurfaceV1['displayPriority'] {
  switch (relevanceState) {
    case 'solves_current_blocker':
    case 'required_now':
      return 'critical';
    case 'recommended_now':
      return 'recommended';
    case 'useful_support':
      return 'useful';
    case 'archive':
      return 'archive';
    case 'future_use':
    default:
      return 'future';
  }
}

export function buildResourceProvenanceSurface(args: BuildResourceProvenanceSurfaceArgs): ResourceProvenanceSurfaceV1 {
  const sourceIndex = buildBestSourceIndex(args.content);
  const entry = getBestSourceIndexEntry(sourceIndex, args.id);
  const sourceTags = entry?.sourceOptions.slice(0, 4).map(optionToSourceTag) ?? [];
  if (args.id === 'merit' && sourceTags.length === 0) {
    sourceTags.push({ moduleKey: 'bounties', label: 'Bounties', detail: 'Bounties are the canonical Merit source.' });
  }
  const sinkTags = buildSinkTags(args.content, args.id, args.kind);
  const currentGateRelevance = relevance(args, sinkTags);
  const displayPriority = priority(currentGateRelevance.state);
  return {
    version: 1,
    kind: args.kind,
    id: args.id,
    displayName: itemName(args.content, args.id, args.kind),
    displayPriority,
    purpose: purposeFor(args.content, args.id, args.kind),
    sourceTags,
    sinkTags,
    currentGateRelevance,
    bestSourceRoute: entry?.primarySource ? optionToRoute(entry.primarySource) : undefined,
    bestSinkRoute: sinkTags[0]?.moduleKey ? p3ModuleRoute(sinkTags[0].moduleKey, sinkTags[0].detail, args.currentCityId) : undefined,
    futureUseRealm: displayPriority === 'future' ? 'Later authored or deferred system' : undefined,
    quantityLine: args.quantity == null ? undefined : `Owned: ${args.quantity}`,
    warningLine: sourceTags.length === 0 && sinkTags.length === 0 ? 'No high-priority source or sink is currently exposed.' : undefined,
    debugNotes: entry ? [`sourceOptions=${entry.sourceOptions.length}`] : ['source index entry unavailable'],
  };
}
