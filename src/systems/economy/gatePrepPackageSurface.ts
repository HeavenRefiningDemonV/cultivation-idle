import type { MedicinePouchSlotState } from '../../types/index.js';
import type { ValidatedContent } from '../../content/index.js';
import type { ForgeFloorReadModel } from '../forge/forgeFloorReadModel.js';
import { getPrepBudgetByNextCityId } from './prepBudgetRegistry.js';
import { p3ModuleRoute, type P3Route } from '../world/p3SurfaceTypes.js';

export interface GatePrepPackageSurfaceV1 {
  version: 1;
  gateId: string;
  gateName: string;
  realmTransition?: string;
  readinessBand: 'locked' | 'missing_minimum' | 'risky' | 'viable' | 'ready' | 'cleared' | 'bypassed';
  rows: GatePrepPackageRow[];
  primaryMissingRow?: GatePrepPackageRow;
  recommendedNextRow?: GatePrepPackageRow;
  safetyNet?: GatePrepSafetyNetRow;
  sourceRoutes: GatePrepRoute[];
  summaryLine: string;
  debugNotes: string[];
}

export interface GatePrepPackageRow {
  id: string;
  group:
    | 'entry'
    | 'gear_floor'
    | 'healing_stock'
    | 'support_pills'
    | 'build_technique'
    | 'background_support'
    | 'reserve'
    | 'safety_net';
  label: string;
  state: 'missing' | 'minimum_met' | 'recommended_met' | 'overbuilt' | 'not_applicable';
  currentLine: string;
  minimumLine?: string;
  recommendedLine?: string;
  route?: GatePrepRoute;
  provenanceIds?: string[];
}

export interface GatePrepSafetyNetRow {
  label: string;
  state: GatePrepPackageRow['state'];
  route: GatePrepRoute;
}

export interface GatePrepRoute extends P3Route {
  moduleKey?: P3Route['moduleKey'];
}

interface BuildGatePrepPackageSurfaceArgs {
  content: ValidatedContent;
  cityId: string;
  currentRealmIndex: number;
  currentSubstage: number;
  itemCountsById: Record<string, number>;
  currencies: { gold: string; merit: string; spiritStones: string };
  pouchSlots: Record<string, MedicinePouchSlotState>;
  forgeFloor: ForgeFloorReadModel;
}

function stateFor(current: number, minimum: number, recommended: number): GatePrepPackageRow['state'] {
  if (current < minimum) return 'missing';
  if (current < recommended) return 'minimum_met';
  if (current === recommended) return 'recommended_met';
  return 'overbuilt';
}

function sumStock(itemCountsById: Record<string, number>, itemIds: readonly string[]): number {
  return itemIds.reduce((total, itemId) => total + (itemCountsById[itemId] ?? 0), 0);
}

function numberValue(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildGatePrepPackageSurface(args: BuildGatePrepPackageSurfaceArgs): GatePrepPackageSurfaceV1 {
  const city = args.content.cities.find((entry) => entry.id === args.cityId) ?? null;
  const budget = getPrepBudgetByNextCityId(args.cityId as never);
  const trial = args.content.trials.find((entry) => entry.cityId === args.cityId) ?? null;
  const debugNotes: string[] = [];
  if (!budget) debugNotes.push(`No prep budget for ${args.cityId}`);

  const minForge = budget?.minimumPrepPackage.forgeFloor;
  const recForge = budget?.recommendedPrepPackage.forgeFloor;
  const minGearScore = Math.min(
    args.forgeFloor.weaponRefineFloor - (minForge?.weaponRefine ?? 0),
    args.forgeFloor.accessoryRefineFloor - (minForge?.accessoryRefine ?? 0),
    args.forgeFloor.temperSuccessTotal - (minForge?.temperSuccesses ?? 0),
  );
  const recGearScore = Math.min(
    args.forgeFloor.weaponRefineFloor - (recForge?.weaponRefine ?? 0),
    args.forgeFloor.accessoryRefineFloor - (recForge?.accessoryRefine ?? 0),
    args.forgeFloor.temperSuccessTotal - (recForge?.temperSuccesses ?? 0),
  );
  const gearState: GatePrepPackageRow['state'] = minGearScore < 0 ? 'missing' : recGearScore < 0 ? 'minimum_met' : 'recommended_met';

  const minStockItems = budget?.minimumPrepPackage.stockPackage.directCore.map((line) => line.itemId) ?? [];
  const recStockItems = budget?.recommendedPrepPackage.stockPackage.directCore.map((line) => line.itemId) ?? minStockItems;
  const minStockTotal = budget?.minimumPrepPackage.stockPackage.directCore.reduce((total, line) => total + line.qty, 0) ?? 0;
  const recStockTotal = budget?.recommendedPrepPackage.stockPackage.directCore.reduce((total, line) => total + line.qty, 0) ?? minStockTotal;
  const ownedMinStock = sumStock(args.itemCountsById, minStockItems);
  const ownedRecStock = sumStock(args.itemCountsById, recStockItems);
  const healingSlot = args.pouchSlots.healing;
  const pouchReady = Boolean(healingSlot?.enabled && healingSlot.equippedItemId && (args.itemCountsById[healingSlot.equippedItemId] ?? 0) > 0);
  const stockState = !pouchReady || ownedMinStock < minStockTotal
    ? 'missing'
    : ownedRecStock < recStockTotal
      ? 'minimum_met'
      : 'recommended_met';

  const finalSubstage = args.currentSubstage >= 9;
  const rows: GatePrepPackageRow[] = [
    {
      id: 'entry',
      group: 'entry',
      label: 'Entry',
      state: finalSubstage ? 'minimum_met' : 'missing',
      currentLine: finalSubstage ? 'Final substage reached. Gate proof routes to breakthrough after clear.' : 'Reach the final substage before attempting this gate.',
      minimumLine: 'Final substage and authored required item only if trial content defines requiredItemId.',
      route: p3ModuleRoute('cultivation', 'Finish cultivation entry requirements.'),
    },
    {
      id: 'gear_floor',
      group: 'gear_floor',
      label: 'Gear Floor',
      state: gearState,
      currentLine: `Weapon +${args.forgeFloor.weaponRefineFloor}, accessory +${args.forgeFloor.accessoryRefineFloor}, temper ${args.forgeFloor.temperSuccessTotal}.`,
      minimumLine: minForge ? `Minimum: weapon +${minForge.weaponRefine}, accessory +${minForge.accessoryRefine}, temper ${minForge.temperSuccesses}.` : undefined,
      recommendedLine: recForge ? `Recommended: weapon +${recForge.weaponRefine}, accessory +${recForge.accessoryRefine}, temper ${recForge.temperSuccesses}.` : undefined,
      route: p3ModuleRoute('forge', 'Raise permanent gear floor.', args.cityId),
    },
    {
      id: 'healing_stock',
      group: 'healing_stock',
      label: 'Healing Stock',
      state: stockState,
      currentLine: pouchReady ? `Stock package owned ${ownedMinStock}/${minStockTotal}; pouch has auto-use healing.` : `Stock ${ownedMinStock}/${minStockTotal}; pouch-ready healing missing.`,
      minimumLine: `Minimum stock package: ${minStockTotal} consumables and pouch-ready healing.`,
      recommendedLine: `Recommended stock package: ${recStockTotal} consumables.`,
      route: p3ModuleRoute('apothecary', 'Stock medicine and configure the pouch.', args.cityId),
      provenanceIds: recStockItems,
    },
    {
      id: 'support_pills',
      group: 'support_pills',
      label: 'Support Pills',
      state: stockState === 'missing' ? 'missing' : 'minimum_met',
      currentLine: 'Support pills are tracked with the Apothecary prep package.',
      route: p3ModuleRoute('apothecary', 'Fill support pill package.', args.cityId),
      provenanceIds: recStockItems.filter((itemId) => !/healing/i.test(itemId)),
    },
    {
      id: 'build_technique',
      group: 'build_technique',
      label: 'Build / Technique',
      state: 'minimum_met',
      currentLine: 'No hard technique entry lock is authored here; use Techniques if defeat diagnosis says underbuilt.',
      route: p3ModuleRoute('techniques', 'Review loadout and AI posture.'),
    },
    {
      id: 'background_support',
      group: 'background_support',
      label: 'Background Support',
      state: 'missing',
      currentLine: budget?.recommendedPrepPackage.backgroundExpectations.map((entry) => `${entry.qty} ${entry.key.replace(/_/g, ' ')}`).join(', ') ?? 'No background support target.',
      route: p3ModuleRoute('ruins', 'Complete support run or route shortage relief.', args.cityId),
    },
    {
      id: 'reserve',
      group: 'reserve',
      label: 'Reserve',
      state: numberValue(args.currencies.gold) >= (budget?.minimumPrepPackage.goldSpendRange.minimum ?? 0) ? 'minimum_met' : 'missing',
      currentLine: `Gold ${args.currencies.gold}; Merit ${args.currencies.merit}.`,
      minimumLine: budget ? `Minimum gold reserve ${budget.minimumPrepPackage.goldSpendRange.minimum}.` : undefined,
      recommendedLine: budget ? `Recommended gold reserve ${budget.recommendedPrepPackage.goldSpendRange.recommended}.` : undefined,
      route: p3ModuleRoute('bounties', 'Build reserve support through directed work.', args.cityId),
    },
    {
      id: 'safety_net',
      group: 'safety_net',
      label: 'Safety Net',
      state: 'missing',
      currentLine: 'Safety Net is owned by Gate Trial and appears after eligible failures or fail-safe availability.',
      route: p3ModuleRoute('gateTrial', 'Check Safety Net status in the threshold chamber.', args.cityId),
    },
  ];

  const primaryMissingRow = rows.find((row) => row.state === 'missing');
  const recommendedNextRow = rows.find((row) => row.state === 'minimum_met');
  const readinessBand: GatePrepPackageSurfaceV1['readinessBand'] = !finalSubstage
    ? 'locked'
    : primaryMissingRow
      ? 'missing_minimum'
      : recommendedNextRow
        ? 'viable'
        : 'ready';

  return {
    version: 1,
    gateId: trial?.id ?? `${args.cityId}:gate`,
    gateName: trial?.name ?? 'Gate Trial',
    realmTransition: budget ? `${budget.fromRealmId} -> ${budget.toRealmId}` : undefined,
    readinessBand,
    rows,
    primaryMissingRow,
    recommendedNextRow,
    safetyNet: { label: 'Safety Net', state: 'missing', route: p3ModuleRoute('gateTrial', 'Inspect fail-safe status.', args.cityId) },
    sourceRoutes: rows.map((row) => row.route).filter((route): route is GatePrepRoute => Boolean(route)),
    summaryLine: primaryMissingRow
      ? `${primaryMissingRow.label} is the first missing prep row.`
      : recommendedNextRow
        ? `Minimum package is viable; improve ${recommendedNextRow.label} for recommended readiness.`
        : 'Gate prep package is ready.',
    debugNotes,
  };
}
