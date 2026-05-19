import type {
  ApothecaryExactButtonSurface,
  ApothecaryExactPrescriptionRowSurface,
  ApothecaryExactSurfaceV1,
} from './apothecaryExactTypes.js';

export type ApothecaryExactPlanStatus = 'ready' | 'risky' | 'blocked' | 'partially-actionable';
export type ApothecaryExactNextFix =
  | 'stock-healing'
  | 'buy-specialty'
  | 'brew-remedy'
  | 'source-ingredients'
  | 'configure-pouch'
  | 'return-gate';

export interface PackageTargetLine {
  itemId: string | null;
  itemName: string;
  ownedQty: number;
  targetQty: number;
  missingQty: number;
  optional: boolean;
}

export interface PackageBuyLine {
  itemId: string | null;
  itemName: string;
  stockId: string | null;
  qty: number;
  unitGoldCost: number;
  enabled: boolean;
  disabledReason?: string;
}

export interface PackageBrewLine {
  itemId: string | null;
  itemName: string;
  recipeId: string | null;
  qty: number;
  enabled: boolean;
  disabledReason?: string;
}

export interface PackagePouchLine {
  label: string;
  configured: boolean;
  value: string;
}

export interface PackageSourceBlocker {
  itemId: string | null;
  itemName: string;
  reason: string;
  routeLabel: string;
}

export interface ApothecaryExactPackagePlan {
  targetLabel: string;
  status: ApothecaryExactPlanStatus;
  nextFix: ApothecaryExactNextFix;
  targetLines: PackageTargetLine[];
  buyLines: PackageBuyLine[];
  brewLines: PackageBrewLine[];
  pouchLines: PackagePouchLine[];
  sourceBlockers: PackageSourceBlocker[];
  totalGoldCost: number;
  queueJobs: number;
  missingSummary: string;
  canExecuteSafely: boolean;
  disabledReason?: string;
}

function numberFromLabel(label: string): number {
  const parsed = Number(label.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function targetLineFromPrescription(row: ApothecaryExactPrescriptionRowSurface): PackageTargetLine {
  return {
    itemId: row.itemId,
    itemName: row.itemName.replace(/\s+\(Optional\)$/u, ''),
    ownedQty: numberFromLabel(row.ownedLabel),
    targetQty: numberFromLabel(row.recommendedLabel),
    missingQty: row.missingQty,
    optional: row.optional,
  };
}

function buyLineFromAction(action: ApothecaryExactButtonSurface): PackageBuyLine | null {
  if (action.intent !== 'buy-row' && action.intent !== 'buy-missing') return null;
  if (!action.itemName && !action.itemId) return null;

  return {
    itemId: action.itemId ?? null,
    itemName: action.itemName ?? action.itemId ?? 'Unknown item',
    stockId: action.stockId ?? null,
    qty: Math.max(1, Math.floor(action.qty ?? 1)),
    unitGoldCost: 0,
    enabled: action.enabled,
    disabledReason: action.disabledReason,
  };
}

function brewLineFromAction(action: ApothecaryExactButtonSurface): PackageBrewLine | null {
  if (action.intent !== 'brew-row' && action.intent !== 'brew-missing') return null;
  if (!action.itemName && !action.itemId) return null;

  return {
    itemId: action.itemId ?? null,
    itemName: action.itemName ?? action.itemId ?? 'Unknown item',
    recipeId: action.recipeId ?? null,
    qty: Math.max(1, Math.floor(action.qty ?? 1)),
    enabled: action.enabled,
    disabledReason: action.disabledReason,
  };
}

function compactItemName(itemName: string): string {
  if (/healing/i.test(itemName)) return 'Healing';
  if (/ironblood/i.test(itemName)) return 'Ironblood';
  if (/qi elixir/i.test(itemName)) return 'Qi';
  if (/ward salt/i.test(itemName)) return 'Ward Salt';
  if (/focus dew/i.test(itemName)) return 'Focus Dew';
  return itemName.replace(/\s+Pellet$/u, '').replace(/\s+\(Optional\)$/u, '');
}

function buildMissingSummary(surface: ApothecaryExactSurfaceV1, lines: PackageTargetLine[]): string {
  const missingParts = lines
    .filter((line) => !line.optional && line.missingQty > 0)
    .map((line) => `${line.missingQty} ${compactItemName(line.itemName)}`);

  const pouchFit = surface.pouchCard.lines.find((line) => line.id === 'gate-fit');
  if (pouchFit && /underfilled|empty|unconfigured/i.test(pouchFit.value)) {
    missingParts.push('Pouch Slots');
  }

  return missingParts.length > 0 ? missingParts.join(' \u00b7 ') : 'None';
}

function inferNextFix(surface: ApothecaryExactSurfaceV1, lines: PackageTargetLine[]): ApothecaryExactNextFix {
  const healing = lines.find((line) => /healing/i.test(line.itemName));
  if (healing && healing.missingQty > 0) return 'stock-healing';

  const sourceBlocked = surface.brewLane.rows.some((row) => row.action.intent === 'source-row' && row.action.enabled);
  if (sourceBlocked) return 'source-ingredients';

  if (surface.brewLane.rows.some((row) => row.action.intent === 'brew-row' && row.action.enabled)) {
    return 'brew-remedy';
  }

  const specialty = lines.find((line) => !/healing/i.test(line.itemName) && line.missingQty > 0);
  if (specialty) return 'buy-specialty';

  const pouchFit = surface.pouchCard.lines.find((line) => line.id === 'gate-fit');
  if (pouchFit && /underfilled|empty|unconfigured/i.test(pouchFit.value)) return 'configure-pouch';

  return 'return-gate';
}

export function buildApothecaryExactPackagePlan(surface: ApothecaryExactSurfaceV1): ApothecaryExactPackagePlan {
  const targetLines = surface.prescription.rows.map(targetLineFromPrescription);
  const buyLines = [
    ...surface.prescription.rows.flatMap((row) => row.actions.map(buyLineFromAction).filter((line): line is PackageBuyLine => Boolean(line))),
    ...surface.buyLane.rows.map((row) => buyLineFromAction(row.action)).filter((line): line is PackageBuyLine => Boolean(line)),
    ...surface.bottomActions.map(buyLineFromAction).filter((line): line is PackageBuyLine => Boolean(line)),
  ];
  const brewLines = [
    ...surface.prescription.rows.flatMap((row) => row.actions.map(brewLineFromAction).filter((line): line is PackageBrewLine => Boolean(line))),
    ...surface.brewLane.rows.map((row) => brewLineFromAction(row.action)).filter((line): line is PackageBrewLine => Boolean(line)),
    ...surface.bottomActions.map(brewLineFromAction).filter((line): line is PackageBrewLine => Boolean(line)),
  ];
  const sourceBlockers = surface.brewLane.rows
    .filter((row) => row.action.intent === 'source-row')
    .map((row) => ({
      itemId: row.action.sourceItemId ?? row.itemId,
      itemName: row.action.itemName ?? row.ingredientLabel,
      reason: row.action.disabledReason ?? row.ingredientCountLabel ?? 'Source ingredients first.',
      routeLabel: row.action.label,
    }));
  const pouchLines = surface.pouchCard.lines.map((line) => ({
    label: line.label,
    configured: line.id !== 'gate-fit' ? !/empty/i.test(line.value) : !/underfilled|empty|unconfigured/i.test(line.value),
    value: line.value,
  }));
  const missingSummary = buildMissingSummary(surface, targetLines);
  const nextFix = inferNextFix(surface, targetLines);
  const hasRequiredMissing = targetLines.some((line) => !line.optional && line.missingQty > 0);
  const actionable = buyLines.some((line) => line.enabled) || brewLines.some((line) => line.enabled);
  const hasPouchBlocker = pouchLines.some((line) => !line.configured);
  const status: ApothecaryExactPlanStatus =
    !hasRequiredMissing && !hasPouchBlocker
      ? 'ready'
      : actionable
        ? 'partially-actionable'
        : sourceBlockers.length > 0 || hasPouchBlocker
          ? 'blocked'
          : 'risky';

  return {
    targetLabel: surface.meta.targetGateLabel,
    status,
    nextFix,
    targetLines,
    buyLines,
    brewLines,
    pouchLines,
    sourceBlockers,
    totalGoldCost: buyLines.reduce((sum, line) => sum + line.unitGoldCost * line.qty, 0),
    queueJobs: brewLines.filter((line) => line.enabled).length,
    missingSummary,
    canExecuteSafely: status !== 'blocked',
    disabledReason: status === 'blocked' ? 'Source ingredients or configure pouch before preparing.' : undefined,
  };
}
