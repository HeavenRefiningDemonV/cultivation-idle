import type { ValidatedContent } from '../../../content/index.js';
import type { MedicinePouchSlotState } from '../../../types/index.js';
import { getPrepBudgetByNextCityId } from '../../../systems/economy/prepBudgetRegistry.js';
import { buildResourceProvenanceSurface } from '../../../systems/economy/resourceProvenanceSurface.js';
import type { P3Route } from '../../../systems/world/p3SurfaceTypes.js';
import { p3ModuleRoute } from '../../../systems/world/p3SurfaceTypes.js';

export interface ApothecaryPrepSurfaceV1 {
  version: 1;
  gateId?: string;
  readinessBand: string;
  stockRows: ApothecaryStockRow[];
  pouchRows: ApothecaryPouchRow[];
  supportRows: ApothecarySupportRow[];
  missingIngredientRoutes: P3Route[];
  conservativeSimulation: PouchSimulationResult;
  quickActions: ApothecaryQuickAction[];
  summaryLine: string;
  debugNotes: string[];
}

export interface ApothecaryStockRow {
  itemId: string;
  label: string;
  owned: number;
  minimum: number;
  recommended: number;
  state: 'missing' | 'minimum_met' | 'recommended_met' | 'overstocked';
}

export interface ApothecaryPouchRow {
  slotKey: string;
  label: string;
  equippedItemId: string | null;
  triggerLine: string;
  state: 'missing' | 'late_trigger' | 'ready' | 'disabled';
}

export interface ApothecarySupportRow {
  id: string;
  label: string;
  state: 'missing' | 'minimum_met' | 'recommended_met' | 'not_applicable';
  detail: string;
}

export interface PouchSimulationResult {
  state: 'insufficient' | 'minimum' | 'comfortable' | 'overstocked' | 'unknown';
  line: string;
}

export interface ApothecaryQuickAction {
  id: string;
  label: string;
  enabled: boolean;
  disabledReason?: string;
  route?: P3Route;
}

interface BuildApothecaryPrepSurfaceArgs {
  content: ValidatedContent;
  cityId: string;
  itemCountsById: Record<string, number>;
  pouchSlots: Record<string, MedicinePouchSlotState>;
}

function itemName(content: ValidatedContent, itemId: string): string {
  return content.items.find((item) => item.id === itemId)?.name ?? itemId;
}

function stockState(owned: number, minimum: number, recommended: number): ApothecaryStockRow['state'] {
  if (owned < minimum) return 'missing';
  if (owned < recommended) return 'minimum_met';
  if (owned === recommended) return 'recommended_met';
  return 'overstocked';
}

function triggerLine(slot: MedicinePouchSlotState): string {
  if (!slot.enabled) return 'disabled';
  if (slot.trigger === 'hpBelowPct') return `uses below ${slot.thresholdPct}% HP`;
  if (slot.trigger === 'bossStart') return 'uses at boss start';
  if (slot.trigger === 'fightStart') return 'uses at fight start';
  return `${slot.trigger.replace(/([A-Z])/g, ' $1').toLowerCase()} trigger`;
}

function pouchState(slot: MedicinePouchSlotState, itemCountsById: Record<string, number>): ApothecaryPouchRow['state'] {
  if (!slot.enabled) return 'disabled';
  if (!slot.equippedItemId || (itemCountsById[slot.equippedItemId] ?? 0) <= 0) return 'missing';
  if (slot.trigger === 'hpBelowPct' && slot.thresholdPct < 45) return 'late_trigger';
  return 'ready';
}

export function buildApothecaryPrepSurface(args: BuildApothecaryPrepSurfaceArgs): ApothecaryPrepSurfaceV1 {
  const budget = getPrepBudgetByNextCityId(args.cityId as never);
  const trial = args.content.trials.find((entry) => entry.cityId === args.cityId) ?? null;
  const minLines = budget?.minimumPrepPackage.stockPackage.directCore ?? [];
  const recLines = budget?.recommendedPrepPackage.stockPackage.directCore ?? minLines;
  const recById = new Map(recLines.map((line) => [line.itemId, line.qty]));
  const stockRows = minLines.map((line) => {
    const recommended = recById.get(line.itemId) ?? line.qty;
    const owned = args.itemCountsById[line.itemId] ?? 0;
    return {
      itemId: line.itemId,
      label: itemName(args.content, line.itemId),
      owned,
      minimum: line.qty,
      recommended,
      state: stockState(owned, line.qty, recommended),
    };
  });
  const pouchRows = Object.values(args.pouchSlots).map((slot) => ({
    slotKey: slot.slotKey,
    label: `${slot.slotKey.slice(0, 1).toUpperCase()}${slot.slotKey.slice(1)} slot`,
    equippedItemId: slot.equippedItemId,
    triggerLine: triggerLine(slot),
    state: pouchState(slot, args.itemCountsById),
  }));
  const missingStock = stockRows.filter((row) => row.state === 'missing');
  const missingPouch = pouchRows.filter((row) => row.state === 'missing' || row.state === 'disabled' || row.state === 'late_trigger');
  const supportRows: ApothecarySupportRow[] = [
    {
      id: 'support_package',
      label: 'Support Pills',
      state: missingStock.length > 0 ? 'missing' : 'minimum_met',
      detail: missingStock.length > 0 ? `${missingStock.length} stock rows are short.` : 'Minimum support package is stocked.',
    },
  ];
  const missingIngredientRoutes = missingStock
    .flatMap((row) => {
      const provenance = buildResourceProvenanceSurface({
        content: args.content,
        kind: 'item',
        id: row.itemId,
        currentCityId: args.cityId,
        currentShortageIds: [row.itemId],
      });
      return provenance.bestSourceRoute ? [provenance.bestSourceRoute] : [];
    });
  const simulation: PouchSimulationResult = missingPouch.length > 0
    ? {
      state: 'insufficient',
      line: missingPouch.some((row) => row.state === 'late_trigger')
        ? 'Pouch has medicine, but at least one trigger is too late for conservative gate coverage.'
        : 'Inventory stock is not enough by itself; pouch-ready medicine is missing.',
    }
    : missingStock.length > 0
      ? { state: 'insufficient', line: 'Pouch is configured, but stock cannot cover the minimum package.' }
      : { state: stockRows.some((row) => row.state === 'overstocked') ? 'comfortable' : 'minimum', line: 'Pouch covers minimum healing without promising survival.' };

  return {
    version: 1,
    gateId: trial?.id,
    readinessBand: missingPouch.length > 0 || missingStock.length > 0 ? 'missing_minimum' : 'viable',
    stockRows,
    pouchRows,
    supportRows,
    missingIngredientRoutes,
    conservativeSimulation: simulation,
    quickActions: [
      {
        id: 'configure_starter_pouch',
        label: 'Configure starter pouch',
        enabled: stockRows.some((row) => row.owned > 0),
        disabledReason: stockRows.some((row) => row.owned > 0) ? undefined : 'No medicine stock is available to assign.',
        route: p3ModuleRoute('apothecary', 'Configure pouch slots before the next gate.', args.cityId),
      },
      {
        id: 'source_missing',
        label: 'Route to missing ingredients',
        enabled: missingIngredientRoutes.length > 0,
        disabledReason: missingIngredientRoutes.length > 0 ? undefined : 'No missing ingredient route is active.',
        route: missingIngredientRoutes[0],
      },
    ],
    summaryLine: missingPouch.length > 0
      ? 'Stock is not the same as pouch-ready medicine.'
      : missingStock.length > 0
        ? 'Pouch is configured, but stock package is short.'
        : 'Minimum stock and pouch coverage are visible; recommended stock may still improve risk.',
    debugNotes: budget ? [] : [`No prep budget for ${args.cityId}`],
  };
}
