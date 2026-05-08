import type { ApothecaryExactAssetKey, ApothecaryExactFocus } from './apothecaryExactTypes.js';

export const APOTHECARY_EXACT_SURFACE_VERSION = 1 as const;
export const APOTHECARY_EXACT_ROOT_TEST_ID = 'apothecary-exact-page' as const;
export const APOTHECARY_EXACT_TARGET_MOCKUP_ID = 'apothecary-exact-foundation-prep-2048x1152' as const;

export const APOTHECARY_EXACT_PLANE = {
  width: 2048,
  height: 1152,
  sourceImageWidth: 1672,
  sourceImageHeight: 941,
  sourceToCanonicalScaleX: 2048 / 1672,
  sourceToCanonicalScaleY: 1152 / 941,
} as const;

export const APOTHECARY_EXACT_REGIONS = {
  header: { id: 'A', className: 'apothecaryExactHeader', x: 74, y: 27, w: 420, h: 80 },
  cityChip: { id: 'B', className: 'apothecaryExactCityChip', x: 1328, y: 28, w: 593, h: 55 },
  prepStrip: { id: 'C', className: 'apothecaryExactPrepStrip', x: 74, y: 120, w: 1902, h: 100 },
  prescription: { id: 'D', className: 'apothecaryExactPrescription', x: 486, y: 225, w: 1014, h: 318 },
  warnings: { id: 'E', className: 'apothecaryExactWarnings', x: 500, y: 554, w: 1009, h: 45 },
  buyLane: { id: 'F', className: 'apothecaryExactBuyLane', x: 51, y: 629, w: 481, h: 346 },
  brewLane: { id: 'G', className: 'apothecaryExactBrewLane', x: 680, y: 629, w: 518, h: 346 },
  pouchCard: { id: 'H', className: 'apothecaryExactPouchCard', x: 1341, y: 629, w: 380, h: 346 },
  pouchObject: { id: 'I', className: 'apothecaryExactPouchObject', x: 1709, y: 643, w: 294, h: 306 },
  bottomActions: { id: 'J', className: 'apothecaryExactBottomActions', x: 68, y: 997, w: 636, h: 88 },
  primaryCta: { id: 'K', className: 'apothecaryExactPrimaryCta', x: 724, y: 977, w: 530, h: 121 },
  returnGate: { id: 'L', className: 'apothecaryExactReturnGate', x: 1284, y: 997, w: 176, h: 88 },
  attemptFit: { id: 'M', className: 'apothecaryExactAttemptFit', x: 1472, y: 987, w: 528, h: 125 },
} as const;

export const APOTHECARY_EXACT_REGION_ORDER = [
  'header',
  'cityChip',
  'prepStrip',
  'prescription',
  'warnings',
  'buyLane',
  'brewLane',
  'pouchCard',
  'pouchObject',
  'bottomActions',
  'primaryCta',
  'returnGate',
  'attemptFit',
] as const;

export const APOTHECARY_EXACT_COPY = {
  title: 'Apothecary',
  purpose: 'Use gold and reagents to prepare the next serious attempt.',
  cityStatus: `Pinewind Hamlet \u00b7 2 Expeditions Idle \u00b7 1 Tracked Bounty`,
  targetGate: 'Foundation Gate',
  prescriptionTitle: 'Prescription for Foundation Gate',
  prescriptionSubtitle: 'Recommended stock before attempting the gate.',
  cta: 'Prepare Foundation Package',
  returnGate: 'Return to Gate Trial',
} as const;

export const APOTHECARY_EXACT_FIXTURE_PREP_CELLS = [
  { id: 'next-test', label: 'Next Test', value: 'Foundation Gate', iconKey: 'sources.gate' },
  { id: 'readiness', label: 'Readiness', value: '74 / 100', iconKey: 'sources.inventory' },
  { id: 'healing-floor', label: 'Healing Floor', value: '8 / 12', iconKey: 'remedies.healingPellet' },
  { id: 'specialty-stock', label: 'Specialty Stock', value: '0 / 2', iconKey: 'remedies.focusDew' },
  { id: 'pouch', label: 'Pouch', value: '3 / 5 Set', iconKey: 'objects.medicinePouch' },
  { id: 'gold', label: 'Gold', value: '610', iconKey: 'sources.meritExchange' as ApothecaryExactAssetKey },
  { id: 'queue', label: 'Queue', value: 'Idle', iconKey: 'sources.brew' },
] as const;

export const APOTHECARY_EXACT_DEFAULT_FOCUS: ApothecaryExactFocus = 'prescription';

export const APOTHECARY_EXACT_REQUIRED_ASSET_KEYS: readonly ApothecaryExactAssetKey[] = [
  'objects.medicinePouch',
  'remedies.healingPellet',
  'remedies.wardSalt',
  'remedies.focusDew',
  'remedies.meridianTea',
  'remedies.ironbloodPellet',
  'remedies.qiElixir',
  'remedies.spiritLeaf',
  'sources.buy',
  'sources.brew',
  'sources.herb',
  'sources.ruins',
  'sources.expedition',
  'sources.locked',
  'warnings.healing',
  'warnings.specialty',
  'warnings.pouch',
] as const;

export const APOTHECARY_EXACT_CONTENT_PARITY_TARGETS = {
  cityId: 'city_pinewind_hamlet',
  itemNames: ['Healing Pellet', 'Ward Salt', 'Focus Dew', 'Meridian Tea'],
  blockers: [
    'Live Pinewind package still uses current content until APX-14.',
    'Five-slot pouch copy is fixture-only until APX-15.',
  ],
} as const;
