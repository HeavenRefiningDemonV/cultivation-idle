import type { ApothecaryShopDef, ValidatedContent } from '../../../content/index.js';
import { resolveModuleRef } from '../../../components/screens/world/worldUtils.js';
import { useBountyStore } from '../../../stores/bountyStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useExpeditionStore } from '../../../stores/expeditionStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { useMedicinePouchStore } from '../../../stores/medicinePouchStore.js';
import { useProfessionStore } from '../../../stores/professionStore.js';
import { useShopStore } from '../../../stores/shopStore.js';
import { APOTHECARY_STOCK_FLOORS } from '../apothecaryStockFloors.js';
import { buildApothecaryBuyReadModel } from '../apothecaryBuyReadModel.js';
import { buildApothecaryPrepReadModel } from '../apothecaryPrepReadModel.js';
import { getGatePrepPackageForCity, type GatePrepLineDef } from '../gatePrepPackageCatalog.js';
import { APOTHECARY_EXACT_ASSETS, getApothecaryExactAssetWarnings } from './apothecaryExactAssetRegistry.js';
import { buildApothecaryExactPackagePlan } from './apothecaryExactPackagePlanner.js';
import {
  APOTHECARY_EXACT_CONTENT_PARITY_TARGETS,
  APOTHECARY_EXACT_COPY,
  APOTHECARY_EXACT_DEFAULT_FOCUS,
  APOTHECARY_EXACT_FIXTURE_PREP_CELLS,
  APOTHECARY_EXACT_ROOT_TEST_ID,
  APOTHECARY_EXACT_SURFACE_VERSION,
} from './apothecaryExactPresentation.js';
import type {
  ApothecaryExactAssetKey,
  ApothecaryExactBrewRowSurface,
  ApothecaryExactButtonSurface,
  ApothecaryExactFocus,
  ApothecaryExactMode,
  ApothecaryExactPrescriptionRowSurface,
  ApothecaryExactPrepCell,
  ApothecaryExactRouteTarget,
  ApothecaryExactSurfaceV1,
  ApothecaryExactTone,
  ApothecaryExactWarningChip,
} from './apothecaryExactTypes.js';

const COLUMNS = ['Item', 'Owned', 'Recommended', 'Missing', 'Actions'] as const;
const DEFAULT_CITY_ID = 'city_pinewind_hamlet';
const FIXTURE_SHOP_ID = 'shop_apothecary_pinewind';
const FIXTURE_TRIAL_ID = 'trial_novices_clearing';

interface BuildOptions {
  mode?: ApothecaryExactMode;
  shopId?: string | null;
  focus?: ApothecaryExactFocus;
}

type AlchemyRecipe = ValidatedContent['alchemy_recipes'][number];

function shellFlags(): ApothecaryExactSurfaceV1['shell'] {
  return {
    useScreenOwnedExactPage: true,
    showLegacyTabs: false,
    showLegacyContextStrip: false,
    singleDominantCta: true,
  };
}

function button(
  id: string,
  label: string,
  intent: ApothecaryExactButtonSurface['intent'],
  options: Partial<Omit<ApothecaryExactButtonSurface, 'id' | 'label' | 'intent' | 'ariaLabel' | 'tone' | 'enabled'>> & {
    enabled?: boolean;
    tone?: ApothecaryExactTone;
    ariaLabel?: string;
  } = {},
): ApothecaryExactButtonSurface {
  return {
    id,
    label,
    intent,
    ariaLabel: options.ariaLabel ?? label,
    enabled: options.enabled ?? true,
    tone: options.tone ?? 'neutral',
    ...options,
  };
}

function itemIconKey(itemId: string | null | undefined, itemName = ''): ApothecaryExactAssetKey {
  const lower = `${itemId ?? ''} ${itemName}`.toLowerCase();
  if (lower.includes('healing')) return 'remedies.healingPellet';
  if (lower.includes('ward') || lower.includes('salt')) return 'remedies.wardSalt';
  if (lower.includes('focus')) return 'remedies.focusDew';
  if (lower.includes('meridian') || lower.includes('tea')) return 'remedies.meridianTea';
  if (lower.includes('ironblood')) return 'remedies.ironbloodPellet';
  if (lower.includes('qi_elixir') || lower.includes('qi elixir')) return 'remedies.qiElixir';
  if (lower.includes('spirit_leaf') || lower.includes('spirit leaf')) return 'remedies.spiritLeaf';
  if (lower.includes('moon_dew') || lower.includes('moon dew')) return 'remedies.moonDew';
  return 'remedies.genericPowder';
}

function formatItemName(content: ValidatedContent | null, itemId: string | null): string {
  if (!itemId) return 'Unavailable';
  return content?.items.find((item) => item.id === itemId)?.name ?? itemId;
}

function formatGold(price: Partial<Record<'gold' | 'spiritStones' | 'merit', string>> | undefined): string {
  const raw = price?.gold;
  if (!raw) return '0';
  return String(raw);
}

function titleCaseWords(value: string): string {
  return value
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ');
}

function gateTitleForTrial(content: ValidatedContent | null, trialId: string | null): string {
  const trial = trialId ? content?.trials.find((entry) => entry.id === trialId) : null;
  const target = trial?.gatesToMajorRealm ? titleCaseWords(trial.gatesToMajorRealm) : 'Foundation';
  return target.includes('Gate') ? target : `${target} Gate`;
}

function compactGateLabel(label: string): string {
  return label
    .replace(/\bEstablishment\s+Gate\b/u, 'Gate')
    .replace(/\s{2,}/gu, ' ')
    .trim();
}

function compactPrepareLabel(label: string): string {
  return `Prepare ${compactGateLabel(label).replace(/\s+Gate$/u, '')} Package`;
}

function compactSourceLabel(name: string): string {
  if (/common herb bundle/i.test(name)) return 'Source Herb';
  if (/spirit leaf/i.test(name)) return 'Source Spirit Leaf';
  if (/moon dew/i.test(name)) return 'Source Moon Dew';
  if (/beast blood/i.test(name)) return 'Source Beast Blood';
  return `Source ${name}`;
}

function recipeForOutput(content: ValidatedContent | null, cityId: string | null, itemId: string | null): AlchemyRecipe | null {
  if (!content || !cityId || !itemId) return null;
  const targetIndex = content.cities.findIndex((city) => city.id === cityId);
  if (targetIndex < 0) return null;
  return content.alchemy_recipes.find((recipe) => {
    const unlockIndex = content.cities.findIndex((city) => city.id === recipe.unlocksAtCityId);
    return unlockIndex >= 0 && unlockIndex <= targetIndex && Object.keys(recipe.outputs ?? {}).includes(itemId);
  }) ?? null;
}

function stockForItem(shop: ApothecaryShopDef | null, itemId: string | null) {
  if (!shop || !itemId) return null;
  return shop.stock.find((entry) => entry.itemId === itemId) ?? null;
}

function sourceRouteForItem(itemId: string | null, itemName: string): ApothecaryExactRouteTarget {
  const lower = `${itemId ?? ''} ${itemName}`.toLowerCase();
  if (lower.includes('spirit') || lower.includes('leaf')) return 'outskirts';
  if (lower.includes('moon') || lower.includes('dew')) return 'expeditions';
  if (lower.includes('core') || lower.includes('fragment')) return 'ruins';
  return 'unknown';
}

function warningIcon(code: string): ApothecaryExactAssetKey {
  if (code.includes('healing')) return 'warnings.healing';
  if (code.includes('specialty')) return 'warnings.specialty';
  if (code.includes('pouch')) return 'warnings.pouch';
  return 'warnings.unknown';
}

function compactWarningLabel(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('healing')) return 'Healing below floor';
  if (lower.includes('specialty')) return 'No city specialty stock';
  if (lower.includes('pouch')) return 'Medicine pouch underfilled';
  return title;
}

function createFixturePrescriptionRow(input: {
  id: string;
  itemName: string;
  owned: string;
  recommended: string;
  missing: string;
  missingQty: number;
  optional?: boolean;
  iconKey: ApothecaryExactAssetKey;
}): ApothecaryExactPrescriptionRowSurface {
  const itemName = input.optional ? `${input.itemName} (Optional)` : input.itemName;
  return {
    id: input.id,
    itemId: input.id,
    itemName,
    optional: input.optional ?? false,
    iconKey: input.iconKey,
    ownedLabel: input.owned,
    recommendedLabel: input.recommended,
    missingLabel: input.missing,
    missingQty: input.missingQty,
    tone: input.missingQty > 0 ? 'warning' : 'neutral',
    actions: [
      button(`${input.id}.buy`, 'Buy', 'buy-row', { itemName, itemId: input.id, qty: Math.max(1, input.missingQty), tone: 'muted' }),
      button(`${input.id}.brew`, 'Brew', 'brew-row', { itemName, itemId: input.id, qty: Math.max(1, input.missingQty), tone: 'muted' }),
      button(`${input.id}.source`, 'Source', 'source-row', { itemName, itemId: input.id, routeTarget: 'unknown', tone: 'muted' }),
    ],
  };
}

export function createApothecaryExactMockupFixture(
  overrides: Partial<ApothecaryExactSurfaceV1> = {},
): ApothecaryExactSurfaceV1 {
  const assetWarnings = getApothecaryExactAssetWarnings();
  const fixture: ApothecaryExactSurfaceV1 = {
    meta: {
      surfaceId: 'apothecary-exact',
      version: APOTHECARY_EXACT_SURFACE_VERSION,
      mode: 'fixture',
      cityId: DEFAULT_CITY_ID,
      shopId: FIXTURE_SHOP_ID,
      targetGateId: FIXTURE_TRIAL_ID,
      targetGateLabel: APOTHECARY_EXACT_COPY.targetGate,
      rootTestId: APOTHECARY_EXACT_ROOT_TEST_ID,
      source: 'fixture',
      focus: APOTHECARY_EXACT_DEFAULT_FOCUS,
    },
    shell: shellFlags(),
    assets: APOTHECARY_EXACT_ASSETS,
    pageHeader: {
      title: APOTHECARY_EXACT_COPY.title,
      purpose: APOTHECARY_EXACT_COPY.purpose,
      cityStatus: APOTHECARY_EXACT_COPY.cityStatus,
    },
    prepStrip: APOTHECARY_EXACT_FIXTURE_PREP_CELLS.map((cell) => ({
      ...cell,
      iconKey: cell.iconKey,
      tone: cell.id === 'readiness' ? 'ready' : cell.id === 'specialty-stock' ? 'warning' : 'neutral',
    })) as ApothecaryExactSurfaceV1['prepStrip'],
    prescription: {
      title: APOTHECARY_EXACT_COPY.prescriptionTitle,
      subtitle: APOTHECARY_EXACT_COPY.prescriptionSubtitle,
      columns: COLUMNS,
      sealLabel: 'Prescription seal',
      rows: [
        createFixturePrescriptionRow({ id: 'healing-pellet', itemName: 'Healing Pellet', owned: '8', recommended: '12', missing: '4', missingQty: 4, iconKey: 'remedies.healingPellet' }),
        createFixturePrescriptionRow({ id: 'ward-salt', itemName: 'Ward Salt', owned: '0', recommended: '2', missing: '2', missingQty: 2, iconKey: 'remedies.wardSalt' }),
        createFixturePrescriptionRow({ id: 'focus-dew', itemName: 'Focus Dew', owned: '1', recommended: '3', missing: '2', missingQty: 2, iconKey: 'remedies.focusDew' }),
        createFixturePrescriptionRow({ id: 'meridian-tea', itemName: 'Meridian Tea', owned: '0', recommended: '1', missing: '\u2014', missingQty: 0, optional: true, iconKey: 'remedies.meridianTea' }),
      ],
    },
    warningStrip: [
      { id: 'healing', label: 'Healing below floor', tone: 'warning', iconKey: 'warnings.healing', visible: true },
      { id: 'specialty', label: 'No city specialty stock', tone: 'warning', iconKey: 'warnings.specialty', visible: true },
      { id: 'pouch', label: 'Medicine pouch underfilled', tone: 'warning', iconKey: 'warnings.pouch', visible: true },
    ],
    buyLane: {
      title: 'Buy Stock',
      subtitle: `Fast \u00b7 costs gold \u00b7 limited city supply`,
      rows: [
        { id: 'buy-healing', itemId: 'healing-pellet', itemName: 'Healing Pellet', iconKey: 'remedies.healingPellet', priceLabel: '40', stockLabel: 'City stock: 9', missingQty: 4, tone: 'warning', action: button('buy-healing-floor', 'Buy to Floor', 'buy-row', { itemId: 'healing-pellet', itemName: 'Healing Pellet', qty: 4 }) },
        { id: 'buy-ward', itemId: 'ward-salt', itemName: 'Ward Salt', iconKey: 'remedies.wardSalt', priceLabel: '90', stockLabel: 'City stock: 2', missingQty: 2, tone: 'warning', action: button('buy-ward-two', 'Buy x2', 'buy-row', { itemId: 'ward-salt', itemName: 'Ward Salt', qty: 2 }) },
        { id: 'buy-focus', itemId: 'focus-dew', itemName: 'Focus Dew', iconKey: 'remedies.focusDew', priceLabel: '65', stockLabel: 'City stock: 3', missingQty: 2, tone: 'warning', action: button('buy-focus-two', 'Buy x2', 'buy-row', { itemId: 'focus-dew', itemName: 'Focus Dew', qty: 2 }) },
      ],
    },
    brewLane: {
      title: 'Brew Remedies',
      subtitle: `Efficient \u00b7 uses reagents \u00b7 queue-based`,
      rows: [
        { id: 'brew-healing', itemId: 'healing-pellet', itemName: 'Healing Pellet', iconKey: 'remedies.healingPellet', outputLabel: 'Healing Pellet \u00d74', ingredientLabel: 'Spirit Leaf', ingredientCountLabel: '6 / 8', ingredientIconKey: 'remedies.spiritLeaf', tone: 'warning', action: button('source-spirit-leaf', 'Source Spirit Leaf', 'source-row', { itemId: 'healing-pellet', itemName: 'Spirit Leaf', sourceItemId: 'spirit-leaf', routeTarget: 'outskirts' }) },
        { id: 'brew-ward', itemId: 'ward-salt', itemName: 'Ward Salt', iconKey: 'remedies.wardSalt', outputLabel: 'Ward Salt \u00d72', ingredientLabel: 'Ingredients Ready', ingredientCountLabel: null, ingredientIconKey: 'remedies.wardSalt', tone: 'ready', action: button('brew-ward-batch', 'Brew Batch', 'brew-row', { itemId: 'ward-salt', itemName: 'Ward Salt', qty: 1, tone: 'ready' }) },
        { id: 'brew-focus', itemId: 'focus-dew', itemName: 'Focus Dew', iconKey: 'remedies.focusDew', outputLabel: 'Focus Dew \u00d72', ingredientLabel: 'Moon Dew', ingredientCountLabel: '0 / 1', ingredientIconKey: 'remedies.moonDew', tone: 'warning', action: button('source-moon-dew', 'Source Moon Dew', 'source-row', { itemId: 'focus-dew', itemName: 'Moon Dew', sourceItemId: 'moon-dew', routeTarget: 'expeditions' }) },
      ],
    },
    pouchCard: {
      title: 'Medicine Pouch',
      subtitle: '3 / 5 slots configured',
      lines: [
        { id: 'healing', label: 'Healing', value: 'triggers below 45% HP', tone: 'ready', iconKey: 'remedies.healingPellet' },
        { id: 'defense', label: 'Defense', value: 'empty', tone: 'warning', iconKey: 'remedies.wardSalt' },
        { id: 'spirit', label: 'Spirit', value: 'Focus Dew, boss-only', tone: 'ready', iconKey: 'remedies.focusDew' },
        { id: 'gate-fit', label: 'Gate Fit', value: 'Underfilled', tone: 'warning', iconKey: 'sources.gate' },
      ],
      buttons: [
        button('configure-pouch', 'Configure Pouch', 'configure-pouch'),
        button('autofill-pouch', 'Auto-fill Recommended', 'autofill-pouch'),
      ],
    },
    pouchObject: {
      alt: 'Embroidered medicine pouch',
      action: button('pouch-object-configure', 'Configure Pouch', 'configure-pouch'),
    },
    bottomActions: [
      button('buy-missing', 'Buy Missing', 'buy-missing', { tone: 'muted' }),
      button('brew-missing', 'Brew Missing', 'brew-missing', { tone: 'muted' }),
      button('source-ingredients', 'Source Ingredients', 'source-ingredients', { tone: 'muted', routeTarget: 'outskirts' }),
    ],
    primaryAction: button('prepare-foundation-package', APOTHECARY_EXACT_COPY.cta, 'prepare-package', { tone: 'gold' }),
    returnAction: button('return-gate-trial', APOTHECARY_EXACT_COPY.returnGate, 'return-gate', { routeTarget: 'gateTrial' }),
    attemptFit: {
      title: 'Attempt Fit',
      lines: [
        { id: 'next-fix', label: 'Next Fix', value: 'Stock Healing', tone: 'warning' },
        { id: 'gate-fit', label: 'Gate Fit', value: 'Risky', tone: 'warning' },
        { id: 'missing', label: 'Missing', value: `4 Healing \u00b7 2 Ward Salt \u00b7 Pouch Slots`, tone: 'warning' },
      ],
    },
    debug: {
      notes: ['Fixture values are locked to the approved Apothecary mockup and master plan v2.'],
      contentParityWarnings: [],
      assetWarnings,
      placeholderAssetKeysInUse: [],
    },
  };

  return { ...fixture, ...overrides };
}

function createLivePrescriptionRow(input: {
  content: ValidatedContent | null;
  shop: ApothecaryShopDef | null;
  cityId: string | null;
  inventoryItems: Record<string, number>;
  line: GatePrepLineDef;
}): ApothecaryExactPrescriptionRowSurface {
  const { content, shop, cityId, inventoryItems, line } = input;
  const itemName = formatItemName(content, line.itemId);
  const owned = inventoryItems[line.itemId] ?? 0;
  const missingQty = Math.max(0, line.qty - owned);
  const stock = stockForItem(shop, line.itemId);
  const recipe = recipeForOutput(content, cityId, line.itemId);
  const sourceRoute = sourceRouteForItem(line.itemId, itemName);
  const buyEnabled = Boolean(stock && missingQty > 0);
  const brewEnabled = Boolean(recipe && missingQty > 0);

  return {
    id: line.itemId,
    itemId: line.itemId,
    itemName,
    optional: false,
    iconKey: itemIconKey(line.itemId, itemName),
    ownedLabel: `${owned}`,
    recommendedLabel: `${line.qty}`,
    missingLabel: missingQty > 0 ? `${missingQty}` : '\u2014',
    missingQty,
    tone: missingQty > 0 ? 'warning' : 'ready',
    actions: [
      button(`${line.itemId}.buy`, 'Buy', 'buy-row', {
        enabled: buyEnabled,
        disabledReason: stock ? undefined : 'Not sold by this city apothecary.',
        itemId: line.itemId,
        itemName,
        stockId: stock?.id ?? null,
        qty: Math.max(1, missingQty),
        tone: buyEnabled ? 'neutral' : 'muted',
      }),
      button(`${line.itemId}.brew`, 'Brew', 'brew-row', {
        enabled: brewEnabled,
        disabledReason: recipe ? undefined : 'No visible live recipe in this city.',
        itemId: line.itemId,
        itemName,
        recipeId: recipe?.id ?? null,
        qty: Math.max(1, Math.ceil(missingQty / Math.max(1, Number(Object.values(recipe?.outputs ?? {})[0] ?? 1)))),
        tone: brewEnabled ? 'neutral' : 'muted',
      }),
      button(`${line.itemId}.source`, 'Source', 'source-row', {
        enabled: sourceRoute !== 'unknown',
        disabledReason: sourceRoute === 'unknown' ? 'No known source route for this live item yet.' : undefined,
        itemId: line.itemId,
        itemName,
        routeTarget: sourceRoute,
        tone: sourceRoute === 'unknown' ? 'muted' : 'neutral',
      }),
    ],
  };
}

function buildLivePrescriptionRows(args: {
  content: ValidatedContent | null;
  shop: ApothecaryShopDef | null;
  cityId: string | null;
  inventoryItems: Record<string, number>;
}): ApothecaryExactPrescriptionRowSurface[] {
  const packageDef = getGatePrepPackageForCity(args.cityId);
  const packageLines = packageDef?.directCore ?? [];
  if (packageLines.length > 0) {
    return packageLines.map((line) => createLivePrescriptionRow({ ...args, line })).slice(0, 4);
  }

  return (args.shop?.stock ?? []).slice(0, 3).map((entry) =>
    createLivePrescriptionRow({
      ...args,
      line: {
        itemId: entry.itemId,
        qty: entry.itemId.includes('healing') ? APOTHECARY_STOCK_FLOORS.healing.targetQty : APOTHECARY_STOCK_FLOORS.specialty.targetQty,
      },
    }),
  );
}

function buildLiveWarnings(prepWarnings: ReturnType<typeof buildApothecaryPrepReadModel>['stockWarnings']): ApothecaryExactWarningChip[] {
  const visible = prepWarnings.slice(0, 3).map((warning) => ({
    id: warning.code,
    label: compactWarningLabel(warning.title),
    tone: 'warning' as const,
    iconKey: warningIcon(warning.code),
    visible: true,
  }));

  while (visible.length < 3) {
    visible.push({
      id: `reserved-${visible.length + 1}`,
      label: '',
      tone: 'muted',
      iconKey: 'warnings.unknown',
      visible: false,
    });
  }

  return visible;
}

function buildLiveBuyRows(args: {
  content: ValidatedContent | null;
  shop: ApothecaryShopDef | null;
  rows: ApothecaryExactPrescriptionRowSurface[];
  purchasedTodayByStockId: Record<string, number>;
  canBuy: (shopId: string, stockId: string, qty?: number) => { ok: boolean; error?: string };
}): ApothecaryExactSurfaceV1['buyLane']['rows'] {
  const rows = args.rows
    .map((row) => {
      const stock = stockForItem(args.shop, row.itemId);
      if (!stock || !args.shop) return null;
      const remaining = stock.dailyLimit == null
        ? null
        : Math.max(0, stock.dailyLimit - (args.purchasedTodayByStockId[stock.id] ?? 0));
      const qty = Math.max(1, row.missingQty || 1);
      const canBuy = args.canBuy(args.shop.id, stock.id, qty);
      const itemName = formatItemName(args.content, stock.itemId);
      return {
        id: `buy-${stock.id}`,
        itemId: stock.itemId,
        itemName,
        iconKey: itemIconKey(stock.itemId, itemName),
        priceLabel: formatGold(stock.price),
        stockLabel: remaining == null ? 'City stock: Open' : `City stock: ${remaining}`,
        missingQty: row.missingQty,
        tone: row.missingQty > 0 ? 'warning' : 'ready',
        action: button(`buy-${stock.id}`, row.itemName.toLowerCase().includes('healing') ? 'Buy to Floor' : `Buy \u00d7${qty}`, 'buy-row', {
          enabled: canBuy.ok && row.missingQty > 0,
          disabledReason: row.missingQty <= 0 ? 'Reserve already meets target.' : canBuy.error,
          itemId: stock.itemId,
          itemName,
          stockId: stock.id,
          qty,
          tone: canBuy.ok ? 'neutral' : 'muted',
        }),
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  const fallback = (args.shop?.stock ?? [])
    .filter((entry) => !rows.some((row) => row.itemId === entry.itemId))
    .slice(0, Math.max(0, 3 - rows.length))
    .map((entry) => {
      const itemName = formatItemName(args.content, entry.itemId);
      const canBuy = args.shop ? args.canBuy(args.shop.id, entry.id, 1) : { ok: false, error: 'No shop' };
      return {
        id: `buy-${entry.id}`,
        itemId: entry.itemId,
        itemName,
        iconKey: itemIconKey(entry.itemId, itemName),
        priceLabel: formatGold(entry.price),
        stockLabel: entry.dailyLimit == null ? 'City stock: Open' : `City stock: ${entry.dailyLimit}`,
        missingQty: 0,
        tone: 'neutral' as const,
        action: button(`buy-${entry.id}`, 'Buy 1', 'buy-row', {
          enabled: canBuy.ok,
          disabledReason: canBuy.error,
          itemId: entry.itemId,
          itemName,
          stockId: entry.id,
          qty: 1,
        }),
      };
    });

  return [...rows, ...fallback].slice(0, 3);
}

function buildLiveBrewRows(args: {
  content: ValidatedContent | null;
  cityId: string | null;
  inventoryItems: Record<string, number>;
  prescriptionRows: ApothecaryExactPrescriptionRowSurface[];
}): ApothecaryExactBrewRowSurface[] {
  return args.prescriptionRows
    .map((row) => {
      const recipe = recipeForOutput(args.content, args.cityId, row.itemId);
      if (!recipe) return null;
      const outputs = Object.entries(recipe.outputs ?? {});
      const outputQty = Number(outputs.find(([itemId]) => itemId === row.itemId)?.[1] ?? outputs[0]?.[1] ?? 1);
      const batchQty = Math.max(1, Math.ceil(Math.max(1, row.missingQty) / Math.max(1, outputQty)));
      const missingInputs = Object.entries(recipe.inputs ?? {})
        .map(([itemId, qty]) => {
          const required = Math.max(1, Math.floor(Number(qty) * batchQty));
          const owned = args.inventoryItems[itemId] ?? 0;
          return { itemId, required, owned, missing: Math.max(0, required - owned), name: formatItemName(args.content, itemId) };
        })
        .filter((entry) => entry.missing > 0);
      const firstInput = missingInputs[0] ?? Object.entries(recipe.inputs ?? {}).map(([itemId, qty]) => ({
        itemId,
        required: Math.max(1, Math.floor(Number(qty) * batchQty)),
        owned: args.inventoryItems[itemId] ?? 0,
        missing: 0,
        name: formatItemName(args.content, itemId),
      }))[0] ?? null;
      const ready = missingInputs.length === 0;
      const itemName = row.itemName;

      return {
        id: `brew-${recipe.id}`,
        itemId: row.itemId,
        itemName,
        iconKey: row.iconKey,
        outputLabel: `${itemName} \u00d7${Math.max(1, outputQty * batchQty)}`,
        ingredientLabel: ready ? 'Ingredients Ready' : firstInput?.name ?? 'Ingredients Missing',
        ingredientCountLabel: ready || !firstInput ? null : `${firstInput.owned} / ${firstInput.required}`,
        ingredientIconKey: itemIconKey(firstInput?.itemId ?? null, firstInput?.name ?? ''),
        tone: ready ? 'ready' : 'warning',
        action: ready
          ? button(`brew-${recipe.id}`, 'Brew Batch', 'brew-row', {
              itemId: row.itemId,
              itemName,
              recipeId: recipe.id,
              qty: batchQty,
              tone: 'ready',
            })
          : button(`source-${firstInput?.itemId ?? recipe.id}`, compactSourceLabel(firstInput?.name ?? 'Ingredients'), 'source-row', {
              itemId: row.itemId,
              itemName: firstInput?.name ?? itemName,
              sourceItemId: firstInput?.itemId ?? null,
              routeTarget: sourceRouteForItem(firstInput?.itemId ?? null, firstInput?.name ?? ''),
              disabledReason: `Missing ${firstInput?.missing ?? 1} ${firstInput?.name ?? 'ingredient'}.`,
              tone: 'warning',
            }),
      };
    })
    .filter((row): row is ApothecaryExactBrewRowSurface => Boolean(row))
    .slice(0, 3);
}

function buildLivePouchCard(args: {
  prepModel: ReturnType<typeof buildApothecaryPrepReadModel>;
}): ApothecaryExactSurfaceV1['pouchCard'] {
  const pouch = args.prepModel.pouchSummary;
  const slotLines = pouch.slotStatuses.map((slot) => ({
    id: slot.slotKey,
    label: slot.slotKey.slice(0, 1).toUpperCase() + slot.slotKey.slice(1),
    value: slot.equippedItemId ? `${slot.itemName}, ${slot.enabled ? slot.trigger : 'disabled'}` : 'empty',
    tone: slot.equippedItemId && slot.stocked ? 'ready' as const : 'warning' as const,
    iconKey: itemIconKey(slot.equippedItemId, slot.itemName),
  }));
  const gateFit = pouch.configured && pouch.stocked ? 'Usable' : 'Underfilled';

  return {
    title: 'Medicine Pouch',
    subtitle: `${pouch.filledSlots} / ${pouch.totalSlots} slots configured`,
    lines: [
      ...slotLines,
      { id: 'gate-fit', label: 'Gate Fit', value: gateFit, tone: gateFit === 'Usable' ? 'ready' : 'warning', iconKey: 'sources.gate' as ApothecaryExactAssetKey },
    ].slice(0, 4),
    buttons: [
      button('configure-pouch', 'Configure Pouch', 'configure-pouch'),
      button('autofill-pouch', 'Auto-fill Recommended', 'autofill-pouch'),
    ],
  };
}

function normalizePrepCells(cells: ApothecaryExactPrepCell[]): ApothecaryExactSurfaceV1['prepStrip'] {
  return cells.slice(0, 7) as ApothecaryExactSurfaceV1['prepStrip'];
}

function buildContentParityWarnings(cityId: string | null, prescriptionRows: ApothecaryExactPrescriptionRowSurface[]): string[] {
  if (cityId !== APOTHECARY_EXACT_CONTENT_PARITY_TARGETS.cityId) return [];
  const liveNames = prescriptionRows.map((row) => row.itemName.replace(/\s+\(Optional\)$/u, ''));
  const missing = APOTHECARY_EXACT_CONTENT_PARITY_TARGETS.itemNames.filter((name) => !liveNames.includes(name));
  return missing.length > 0
    ? [
        `APX-14 blocked: live Pinewind package is truthful to current content and does not yet include ${missing.join(', ')}.`,
        ...APOTHECARY_EXACT_CONTENT_PARITY_TARGETS.blockers,
      ]
    : [];
}

export function buildApothecaryExactSurfaceFromStores(
  cityId?: string | null,
  options: BuildOptions = {},
): ApothecaryExactSurfaceV1 {
  const mode = options.mode ?? 'live';
  if (mode === 'fixture') {
    return createApothecaryExactMockupFixture({
      meta: {
        ...createApothecaryExactMockupFixture().meta,
        mode: 'fixture',
        cityId: cityId ?? DEFAULT_CITY_ID,
        focus: options.focus ?? APOTHECARY_EXACT_DEFAULT_FOCUS,
      },
    });
  }

  const contentStore = useContentStore.getState();
  const content = contentStore.raw;
  const resolvedCityId = cityId ?? DEFAULT_CITY_ID;
  const city = contentStore.maps.citiesById[resolvedCityId] ?? null;
  const resolvedShopId = options.shopId ?? resolveModuleRef(city, 'apothecary') ?? contentStore.maps.apothecariesByCityId[resolvedCityId]?.id ?? null;
  const shop = resolvedShopId ? contentStore.maps.apothecariesById[resolvedShopId] ?? null : null;
  const inventory = useInventoryStore.getState();
  const shopState = useShopStore.getState();
  const pouchSlots = useMedicinePouchStore.getState().slots;
  const brewQueue = useProfessionStore.getState().alchemyQueue;
  const expedition = useExpeditionStore.getState();
  const bounty = useBountyStore.getState();
  const targetGateId = resolveModuleRef(city, 'gateTrial') ?? null;
  const targetGateLabel = compactGateLabel(gateTitleForTrial(content, targetGateId));
  const prepModel = buildApothecaryPrepReadModel({
    content,
    shop,
    inventoryItems: inventory.items,
    pouchSlots,
    purchasedTodayByStockId: resolvedShopId ? shopState.purchasedToday[resolvedShopId] ?? {} : {},
    brewQueue,
    bundleCount: 0,
  });
  const buyReadModel = buildApothecaryBuyReadModel({
    content,
    shop,
    inventoryItems: inventory.items,
    currencies: inventory.currencies,
    purchasedTodayByStockId: resolvedShopId ? shopState.purchasedToday[resolvedShopId] ?? {} : {},
  });
  const prescriptionRows = buildLivePrescriptionRows({
    content,
    shop,
    cityId: resolvedCityId,
    inventoryItems: inventory.items,
  });
  const healingFloor = buyReadModel.floorStatuses.find((floor) => floor.key === 'healing');
  const specialtyFloor = buyReadModel.floorStatuses.find((floor) => floor.key === 'specialty');
  const pouch = prepModel.pouchSummary;
  const idleExpeditions = Math.max(0, expedition.slots - expedition.active.length);
  const trackedBounty = bounty.getTrackedBounty(resolvedCityId);
  const missingTotal = prescriptionRows.reduce((sum, row) => sum + row.missingQty, 0);
  const readiness = Math.max(0, Math.min(100, 100 - missingTotal * 8 - (pouch.configured && pouch.stocked ? 0 : 18)));
  const queueLabel = brewQueue.length === 0 ? 'Idle' : `${brewQueue.length} queued`;
  const warningStrip = buildLiveWarnings(prepModel.stockWarnings);
  const buyRows = buildLiveBuyRows({
    content,
    shop,
    rows: prescriptionRows,
    purchasedTodayByStockId: resolvedShopId ? shopState.purchasedToday[resolvedShopId] ?? {} : {},
    canBuy: shopState.canBuy,
  });
  const brewRows = buildLiveBrewRows({
    content,
    cityId: resolvedCityId,
    inventoryItems: inventory.items,
    prescriptionRows,
  });
  const pouchCard = buildLivePouchCard({ prepModel });
  const baseSurface: ApothecaryExactSurfaceV1 = {
    ...createApothecaryExactMockupFixture(),
    meta: {
      surfaceId: 'apothecary-exact',
      version: APOTHECARY_EXACT_SURFACE_VERSION,
      mode,
      cityId: resolvedCityId,
      shopId: resolvedShopId,
      targetGateId,
      targetGateLabel,
      rootTestId: APOTHECARY_EXACT_ROOT_TEST_ID,
      source: shop ? 'live' : 'fallback',
      focus: options.focus ?? APOTHECARY_EXACT_DEFAULT_FOCUS,
    },
    pageHeader: {
      title: APOTHECARY_EXACT_COPY.title,
      purpose: APOTHECARY_EXACT_COPY.purpose,
      cityStatus: `${city?.name ?? 'This city'} \u00b7 ${idleExpeditions} ${idleExpeditions === 1 ? 'Expedition' : 'Expeditions'} Idle \u00b7 ${trackedBounty ? 1 : 0} Tracked ${trackedBounty ? 'Bounty' : 'Bounties'}`,
    },
    prepStrip: normalizePrepCells([
      { id: 'next-test', label: 'Next Test', value: targetGateLabel, iconKey: 'sources.gate', tone: 'neutral' },
      { id: 'readiness', label: 'Readiness', value: `${readiness} / 100`, iconKey: 'sources.inventory', tone: readiness >= 80 ? 'ready' : readiness >= 50 ? 'warning' : 'danger' },
      { id: 'healing-floor', label: 'Healing Floor', value: `${healingFloor?.ownedQty ?? 0} / ${healingFloor?.targetQty ?? APOTHECARY_STOCK_FLOORS.healing.targetQty}`, iconKey: 'remedies.healingPellet', tone: healingFloor?.met ? 'ready' : 'warning' },
      { id: 'specialty-stock', label: 'Specialty Stock', value: `${specialtyFloor?.ownedQty ?? 0} / ${specialtyFloor?.targetQty ?? APOTHECARY_STOCK_FLOORS.specialty.targetQty}`, iconKey: 'remedies.focusDew', tone: specialtyFloor?.met ? 'ready' : 'warning' },
      { id: 'pouch', label: 'Pouch', value: `${pouch.filledSlots} / ${pouch.totalSlots} Set`, iconKey: 'objects.medicinePouch', tone: pouch.stocked ? 'ready' : 'warning' },
      { id: 'gold', label: 'Gold', value: inventory.currencies.gold ?? '0', iconKey: 'sources.meritExchange', tone: 'gold' },
      { id: 'queue', label: 'Queue', value: queueLabel, iconKey: 'sources.brew', tone: brewQueue.length === 0 ? 'ready' : 'neutral' },
    ]),
    prescription: {
      title: `Prescription for ${targetGateLabel}`,
      subtitle: APOTHECARY_EXACT_COPY.prescriptionSubtitle,
      columns: COLUMNS,
      sealLabel: 'Prescription seal',
      rows: prescriptionRows,
    },
    warningStrip,
    buyLane: {
      title: 'Buy Stock',
      subtitle: `Fast \u00b7 costs gold \u00b7 limited city supply`,
      rows: buyRows,
    },
    brewLane: {
      title: 'Brew Remedies',
      subtitle: `Efficient \u00b7 uses reagents \u00b7 queue-based`,
      rows: brewRows.length > 0 ? brewRows : prescriptionRows.slice(0, 3).map((row) => ({
        id: `brew-unavailable-${row.id}`,
        itemId: row.itemId,
        itemName: row.itemName,
        iconKey: row.iconKey,
        outputLabel: row.itemName,
        ingredientLabel: 'No live recipe',
        ingredientCountLabel: null,
        ingredientIconKey: 'sources.locked' as ApothecaryExactAssetKey,
        tone: 'muted' as const,
        action: button(`brew-unavailable-${row.id}`, 'Source', 'source-row', {
          enabled: false,
          disabledReason: 'No visible live recipe for this package line.',
          itemId: row.itemId,
          itemName: row.itemName,
          routeTarget: 'unknown',
        }),
      })),
    },
    pouchCard,
    bottomActions: [
      button('buy-missing', 'Buy Missing', 'buy-missing', { enabled: buyRows.some((row) => row.action.enabled), tone: 'muted' }),
      button('brew-missing', 'Brew Missing', 'brew-missing', { enabled: brewRows.some((row) => row.action.intent === 'brew-row' && row.action.enabled), tone: 'muted' }),
      button('source-ingredients', 'Source Ingredients', 'source-ingredients', { enabled: brewRows.some((row) => row.action.intent === 'source-row'), tone: 'muted', routeTarget: 'outskirts' }),
    ],
    primaryAction: button('prepare-foundation-package', compactPrepareLabel(targetGateLabel), 'prepare-package', { tone: 'gold' }),
    returnAction: button('return-gate-trial', APOTHECARY_EXACT_COPY.returnGate, 'return-gate', { routeTarget: 'gateTrial' }),
    debug: {
      notes: [
        'Live surface is adapted from current Apothecary content, inventory, shop, pouch, expedition, bounty, and alchemy queue stores.',
        'Alchemy remains an Apothecary brew focus, not a separate live room.',
      ],
      contentParityWarnings: buildContentParityWarnings(resolvedCityId, prescriptionRows),
      assetWarnings: getApothecaryExactAssetWarnings(),
      placeholderAssetKeysInUse: [],
    },
  };

  const plan = buildApothecaryExactPackagePlan(baseSurface);
  const gateFitValue = plan.status === 'ready' ? 'Ready' : plan.status === 'blocked' ? 'Blocked' : 'Risky';
  const nextFixLabel = plan.nextFix
    .split('-')
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ');

  return {
    ...baseSurface,
    attemptFit: {
      title: 'Attempt Fit',
      lines: [
        { id: 'next-fix', label: 'Next Fix', value: nextFixLabel, tone: plan.status === 'ready' ? 'ready' : 'warning' },
        { id: 'gate-fit', label: 'Gate Fit', value: gateFitValue, tone: plan.status === 'ready' ? 'ready' : plan.status === 'blocked' ? 'danger' : 'warning' },
        { id: 'missing', label: 'Missing', value: plan.missingSummary, tone: plan.missingSummary === 'None' ? 'ready' : 'warning' },
      ],
    },
    primaryAction: {
      ...baseSurface.primaryAction,
      enabled: plan.canExecuteSafely,
      disabledReason: plan.disabledReason,
    },
  };
}
