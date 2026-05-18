import type { RuinDef, ValidatedContent } from '../../../content/index.js';
import { p3ModuleRoute, type P3Route } from '../../../systems/world/p3SurfaceTypes.js';

export interface RuinsReliefSurfaceV1 {
  version: 1;
  ruinId: string;
  cityId?: string;
  currentShortageTarget?: RuinsShortageTarget;
  expectedMaterialRelief: RuinsReliefLine[];
  deterministicCallouts: RuinsDeterministicCallout[];
  supportRunContribution?: RuinsSupportRunLine;
  riskState: 'safe' | 'manageable' | 'risky' | 'locked' | 'unknown';
  bestNextRoomRoute?: P3Route;
  aftermathLines: string[];
  debugNotes: string[];
}

export interface RuinsShortageTarget {
  itemId: string;
  label: string;
  detail: string;
}

export interface RuinsReliefLine {
  itemId: string;
  label: string;
  expectedLine: string;
}

export interface RuinsDeterministicCallout {
  label: string;
  detail: string;
}

export interface RuinsSupportRunLine {
  label: string;
  detail: string;
  route: P3Route;
}

interface BuildRuinsReliefSurfaceArgs {
  content: ValidatedContent;
  cityId: string;
  ruinId: string;
  shortageItemId?: string | null;
}

function itemName(content: ValidatedContent, itemId: string): string {
  return content.items.find((item) => item.id === itemId)?.name ?? itemId;
}

function ruinItems(ruin: RuinDef): Set<string> {
  const ids = new Set<string>();
  for (const table of [ruin.dropsPerRoom, ruin.finalChestDrops]) {
    table.pool.forEach((entry) => ids.add(entry.itemId));
    table.guaranteed?.forEach((entry) => ids.add(entry.itemId));
  }
  return ids;
}

export function buildRuinsReliefSurface(args: BuildRuinsReliefSurfaceArgs): RuinsReliefSurfaceV1 {
  const ruin = args.content.ruins.find((entry) => entry.id === args.ruinId) ?? null;
  const debugNotes: string[] = [];
  const ids = ruin ? ruinItems(ruin) : new Set<string>();
  if (!ruin) debugNotes.push(`Ruin ${args.ruinId} not found.`);
  const targetId = args.shortageItemId && ids.has(args.shortageItemId) ? args.shortageItemId : null;
  if (args.shortageItemId && !targetId) debugNotes.push(`${args.shortageItemId} not obtainable from this ruin.`);
  const relief = [...ids].slice(0, 4).map((itemId) => ({
    itemId,
    label: itemName(args.content, itemId),
    expectedLine: ruin?.finalChestDrops.guaranteed?.some((entry) => entry.itemId === itemId)
      ? 'Guaranteed final chest relief.'
      : 'Targeted ruin pool relief; not broad Outskirts farming.',
  }));
  const target = targetId ? {
    itemId: targetId,
    label: itemName(args.content, targetId),
    detail: 'This ruin can reduce the named shortage instead of farming broad drops.',
  } : undefined;

  return {
    version: 1,
    ruinId: args.ruinId,
    cityId: args.cityId,
    currentShortageTarget: target,
    expectedMaterialRelief: relief,
    deterministicCallouts: relief
      .filter((line) => /Guaranteed/i.test(line.expectedLine))
      .map((line) => ({ label: line.label, detail: line.expectedLine })),
    supportRunContribution: {
      label: 'Support run',
      detail: 'A completed city ruin run can satisfy the background support row when the gate expects it.',
      route: p3ModuleRoute('gateTrial', 'Return to Gate Trial to see support-row impact.', args.cityId),
    },
    riskState: ruin ? 'manageable' : 'unknown',
    bestNextRoomRoute: p3ModuleRoute('ruins', target ? `Run this ruin for ${target.label}.` : 'Run this ruin for targeted support.', args.cityId),
    aftermathLines: target ? [`${target.label} shortage can move after this ruin run.`] : ['No current shortage affected; relief is routine or future support.'],
    debugNotes,
  };
}
