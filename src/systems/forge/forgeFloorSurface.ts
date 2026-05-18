import type { ValidatedContent } from '../../content/index.js';
import type { ForgeFloorReadModel } from './forgeFloorReadModel.js';
import { getPrepBudgetByNextCityId } from '../economy/prepBudgetRegistry.js';
import { buildResourceProvenanceSurface } from '../economy/resourceProvenanceSurface.js';
import { p3ModuleRoute, type P3Route } from '../world/p3SurfaceTypes.js';

export interface ForgeFloorSurfaceV1 {
  version: 1;
  gateId?: string;
  currentFloorLabel: string;
  rows: ForgeFloorRow[];
  cheapestFix?: ForgeFloorAction;
  highestImpactFix?: ForgeFloorAction;
  missingMaterialRoutes: P3Route[];
  readinessDeltaForecast?: string;
  summaryLine: string;
  debugNotes: string[];
}

export interface ForgeFloorRow {
  id: string;
  type: 'weapon_refine' | 'armor' | 'accessory' | 'temper' | 'rune' | 'optional';
  label: string;
  state: 'missing' | 'minimum_met' | 'recommended_met' | 'overbuilt' | 'not_applicable';
  currentLine: string;
  minimumLine?: string;
  recommendedLine?: string;
  materials?: ResourceCostLine[];
  goldCost?: number;
  route?: P3Route;
  deltaForecast?: string;
}

export interface ResourceCostLine {
  id: string;
  label: string;
  owned: number;
  required: number;
}

export interface ForgeFloorAction {
  rowId: string;
  label: string;
  reason: string;
  route?: P3Route;
}

interface BuildForgeFloorSurfaceArgs {
  content: ValidatedContent;
  cityId: string;
  itemCountsById: Record<string, number>;
  currencies: { gold: string; merit: string; spiritStones: string };
  forgeFloor: ForgeFloorReadModel;
}

function state(current: number, minimum: number, recommended: number): ForgeFloorRow['state'] {
  if (recommended <= 0 && minimum <= 0) return 'not_applicable';
  if (current < minimum) return 'missing';
  if (current < recommended) return 'minimum_met';
  if (current === recommended) return 'recommended_met';
  return 'overbuilt';
}

function firstBlueprintInputs(content: ValidatedContent, cityId: string, service: string): Record<string, number> {
  const cityIndex = content.cities.find((city) => city.id === cityId)?.index ?? 0;
  return content.forge_blueprints.find((blueprint) => {
    const unlockIndex = content.cities.findIndex((city) => city.id === blueprint.unlocksAtCityId);
    return blueprint.service === service && unlockIndex >= 0 && unlockIndex <= cityIndex;
  })?.inputs ?? {};
}

function costLines(content: ValidatedContent, itemCountsById: Record<string, number>, inputs: Record<string, number>): ResourceCostLine[] {
  return Object.entries(inputs).map(([id, required]) => ({
    id,
    label: content.items.find((item) => item.id === id)?.name ?? id,
    owned: itemCountsById[id] ?? 0,
    required,
  }));
}

export function buildForgeFloorSurface(args: BuildForgeFloorSurfaceArgs): ForgeFloorSurfaceV1 {
  const budget = getPrepBudgetByNextCityId(args.cityId as never);
  const min = budget?.minimumPrepPackage.forgeFloor;
  const rec = budget?.recommendedPrepPackage.forgeFloor;
  const refineInputs = firstBlueprintInputs(args.content, args.cityId, 'refine');
  const temperInputs = firstBlueprintInputs(args.content, args.cityId, 'temper');
  const rows: ForgeFloorRow[] = [
    {
      id: 'weapon_refine',
      type: 'weapon_refine',
      label: 'Weapon Refine',
      state: state(args.forgeFloor.weaponRefineFloor, min?.weaponRefine ?? 0, rec?.weaponRefine ?? 0),
      currentLine: `Weapon +${args.forgeFloor.weaponRefineFloor}.`,
      minimumLine: min ? `Minimum +${min.weaponRefine}.` : undefined,
      recommendedLine: rec ? `Recommended +${rec.weaponRefine}.` : undefined,
      materials: costLines(args.content, args.itemCountsById, refineInputs),
      route: p3ModuleRoute('forge', 'Refine weapon floor.', args.cityId),
      deltaForecast: 'Weapon floor row can move toward minimum.',
    },
    {
      id: 'accessory_refine',
      type: 'accessory',
      label: 'Accessory Refine',
      state: state(args.forgeFloor.accessoryRefineFloor, min?.accessoryRefine ?? 0, rec?.accessoryRefine ?? 0),
      currentLine: `Accessory +${args.forgeFloor.accessoryRefineFloor}.`,
      minimumLine: min ? `Minimum +${min.accessoryRefine}.` : undefined,
      recommendedLine: rec ? `Recommended +${rec.accessoryRefine}.` : undefined,
      materials: costLines(args.content, args.itemCountsById, refineInputs),
      route: p3ModuleRoute('forge', 'Refine accessory floor.', args.cityId),
    },
    {
      id: 'temper',
      type: 'temper',
      label: 'Temper',
      state: state(args.forgeFloor.temperSuccessTotal, min?.temperSuccesses ?? 0, rec?.temperSuccesses ?? 0),
      currentLine: `${args.forgeFloor.temperSuccessTotal} temper successes.`,
      minimumLine: min ? `Minimum ${min.temperSuccesses}.` : undefined,
      recommendedLine: rec ? `Recommended ${rec.temperSuccesses}.` : undefined,
      materials: costLines(args.content, args.itemCountsById, temperInputs),
      route: p3ModuleRoute('forge', 'Temper gear after refine floor is stable.', args.cityId),
    },
    {
      id: 'rune',
      type: 'rune',
      label: 'Rune',
      state: state(args.forgeFloor.runeTotalCount, min?.runeRecommendation.minimum ?? 0, rec?.runeRecommendation.recommendedLow ?? 0),
      currentLine: args.forgeFloor.runeSummaryLabel,
      minimumLine: min?.runeRecommendation.note,
      recommendedLine: rec?.runeRecommendation.note,
      route: p3ModuleRoute('forge', 'Socket runes when the gate recommends them.', args.cityId),
    },
  ];
  const missing = rows.filter((row) => row.state === 'missing');
  const cheapest = missing.find((row) => row.id === 'weapon_refine') ?? missing[0] ?? null;
  const missingMaterialRoutes = rows
    .flatMap((row) => row.materials ?? [])
    .filter((line) => line.owned < line.required)
    .flatMap((line) => {
      const provenance = buildResourceProvenanceSurface({
        content: args.content,
        kind: 'item',
        id: line.id,
        currentCityId: args.cityId,
        currentShortageIds: [line.id],
      });
      return provenance.bestSourceRoute ? [provenance.bestSourceRoute] : [];
    });

  return {
    version: 1,
    gateId: args.content.trials.find((trial) => trial.cityId === args.cityId)?.id,
    currentFloorLabel: `Weapon +${args.forgeFloor.weaponRefineFloor} / Accessory +${args.forgeFloor.accessoryRefineFloor}`,
    rows,
    cheapestFix: cheapest ? {
      rowId: cheapest.id,
      label: `Fix ${cheapest.label}`,
      reason: cheapest.deltaForecast ?? 'Missing minimum floor comes before recommended floor.',
      route: cheapest.route,
    } : undefined,
    highestImpactFix: missing[0] ? {
      rowId: missing[0].id,
      label: `Improve ${missing[0].label}`,
      reason: 'This row is still missing against the gate package.',
      route: missing[0].route,
    } : undefined,
    missingMaterialRoutes,
    readinessDeltaForecast: cheapest ? `${cheapest.label} can change the gate floor/readiness row from missing toward minimum.` : 'Forge floor is not the current missing minimum.',
    summaryLine: cheapest ? `${cheapest.label} is the next permanent-floor fix.` : 'Minimum forge floor is met; recommended rows remain useful.',
    debugNotes: budget ? [] : [`No prep budget for ${args.cityId}`],
  };
}
