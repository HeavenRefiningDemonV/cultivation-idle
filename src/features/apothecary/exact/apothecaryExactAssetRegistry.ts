import type {
  ApothecaryExactAssetDescriptor,
  ApothecaryExactAssetKey,
  ApothecaryExactAssetMap,
} from './apothecaryExactTypes.js';
import { APOTHECARY_EXACT_REQUIRED_ASSET_KEYS } from './apothecaryExactPresentation.js';

const roomScenicPlate = new URL('../../../assets/apothecaryExact/room/apothecary_room_scenic_plate.png', import.meta.url).href;
const prescriptionFrame = new URL('../../../assets/apothecaryExact/frames/prescription_parchment_frame_cropped.png', import.meta.url).href;
const medicinePouchObject = new URL('../../../assets/apothecaryExact/objects/medicine_pouch_object_cropped.png', import.meta.url).href;
const goldCtaPlaque = new URL('../../../assets/apothecaryExact/frames/gold_cta_plaque_cropped.png', import.meta.url).href;
const laneCardDefault = new URL('../../../assets/apothecaryExact/frames/lane_card_default.png', import.meta.url).href;
const laneCardReady = new URL('../../../assets/apothecaryExact/frames/lane_card_ready.png', import.meta.url).href;
const laneCardWarning = new URL('../../../assets/apothecaryExact/frames/lane_card_warning.png', import.meta.url).href;
const laneCardDisabled = new URL('../../../assets/apothecaryExact/frames/lane_card_disabled.png', import.meta.url).href;
const laneCardSelected = new URL('../../../assets/apothecaryExact/frames/lane_card_selected.png', import.meta.url).href;
const laneCardRecommended = new URL('../../../assets/apothecaryExact/frames/lane_card_recommended.png', import.meta.url).href;
const healingPellet = new URL('../../../assets/apothecaryExact/remedies/healing_pellet.png', import.meta.url).href;
const wardSalt = new URL('../../../assets/apothecaryExact/remedies/ward_salt.png', import.meta.url).href;
const focusDew = new URL('../../../assets/apothecaryExact/remedies/focus_dew.png', import.meta.url).href;
const meridianTea = new URL('../../../assets/apothecaryExact/remedies/meridian_tea.png', import.meta.url).href;
const ironbloodPellet = new URL('../../../assets/apothecaryExact/remedies/ironblood_pellet.png', import.meta.url).href;
const qiElixir = new URL('../../../assets/apothecaryExact/remedies/qi_elixir.png', import.meta.url).href;
const spiritLeaf = new URL('../../../assets/apothecaryExact/remedies/spirit_leaf.png', import.meta.url).href;
const bluePotionBottle = new URL('../../../assets/apothecaryExact/remedies/blue_potion_bottle.png', import.meta.url).href;
const powderPacket = new URL('../../../assets/apothecaryExact/remedies/powder_packet.png', import.meta.url).href;
const sourceCityMarket = new URL('../../../assets/apothecaryExact/sources/source_city_market.png', import.meta.url).href;
const sourceApothecaryShelf = new URL('../../../assets/apothecaryExact/sources/source_apothecary_shelf.png', import.meta.url).href;
const sourceBrewCauldron = new URL('../../../assets/apothecaryExact/sources/source_brew_cauldron.png', import.meta.url).href;
const sourceHerbGrove = new URL('../../../assets/apothecaryExact/sources/source_herb_grove.png', import.meta.url).href;
const sourceOutskirts = new URL('../../../assets/apothecaryExact/sources/source_outskirts.png', import.meta.url).href;
const sourceRuins = new URL('../../../assets/apothecaryExact/sources/source_ruins.png', import.meta.url).href;
const sourceExpedition = new URL('../../../assets/apothecaryExact/sources/source_expedition.png', import.meta.url).href;
const sourceBounty = new URL('../../../assets/apothecaryExact/sources/source_bounty.png', import.meta.url).href;
const sourceForge = new URL('../../../assets/apothecaryExact/sources/source_forge.png', import.meta.url).href;
const sourceManualPavilion = new URL('../../../assets/apothecaryExact/sources/source_manual_pavilion.png', import.meta.url).href;
const sourceGateTrial = new URL('../../../assets/apothecaryExact/sources/source_gate_trial.png', import.meta.url).href;
const sourceInventoryCache = new URL('../../../assets/apothecaryExact/sources/source_inventory_cache.png', import.meta.url).href;
const sourceMeritExchange = new URL('../../../assets/apothecaryExact/sources/source_merit_exchange.png', import.meta.url).href;
const sourceLockedUnknown = new URL('../../../assets/apothecaryExact/sources/source_locked_unknown.png', import.meta.url).href;
const warningHealingBelowFloor = new URL('../../../assets/apothecaryExact/warnings/warning_healing_below_floor.png', import.meta.url).href;
const warningCitySpecialtyMissing = new URL('../../../assets/apothecaryExact/warnings/warning_city_specialty_missing.png', import.meta.url).href;
const warningPouchRequirement = new URL('../../../assets/apothecaryExact/warnings/warning_pouch_requirement.png', import.meta.url).href;
const warningUnknownProblem = new URL('../../../assets/apothecaryExact/warnings/warning_unknown_problem.png', import.meta.url).href;
const warningLocked = new URL('../../../assets/apothecaryExact/warnings/warning_locked.png', import.meta.url).href;

function asset(
  key: ApothecaryExactAssetKey,
  src: string,
  role: string,
  sourcePath: string,
  required = false,
): ApothecaryExactAssetDescriptor {
  return {
    key,
    src,
    role,
    sourcePath,
    status: src ? 'ready' : 'missing',
    required,
    allowedAsFlattenedMockupSubstitute: false,
  };
}

export const APOTHECARY_EXACT_ASSETS: ApothecaryExactAssetMap = {
  'room.scenicPlate': asset('room.scenicPlate', roomScenicPlate, 'historical full 2048x1152 apothecary room plate, no longer rendered by exact screen', 'src/assets/apothecaryExact/room/apothecary_room_scenic_plate.png'),
  'frames.prescription': asset('frames.prescription', prescriptionFrame, 'historical central prescription parchment frame, replaced by CSS parchment', 'src/assets/apothecaryExact/frames/prescription_parchment_frame_cropped.png'),
  'objects.medicinePouch': asset('objects.medicinePouch', medicinePouchObject, 'cropped large right medicine pouch object', 'src/assets/apothecaryExact/objects/medicine_pouch_object_cropped.png', true),
  'frames.primaryCta': asset('frames.primaryCta', goldCtaPlaque, 'historical gold Prepare Foundation Package CTA plaque, replaced by CSS plaque', 'src/assets/apothecaryExact/frames/gold_cta_plaque_cropped.png'),
  'frames.laneDefault': asset('frames.laneDefault', laneCardDefault, 'historical warm lane row frame, replaced by CSS lane rows', 'src/assets/apothecaryExact/frames/lane_card_default.png'),
  'frames.laneReady': asset('frames.laneReady', laneCardReady, 'historical jade ready lane row frame, replaced by CSS lane rows', 'src/assets/apothecaryExact/frames/lane_card_ready.png'),
  'frames.laneWarning': asset('frames.laneWarning', laneCardWarning, 'historical cinnabar warning lane row frame, replaced by CSS lane rows', 'src/assets/apothecaryExact/frames/lane_card_warning.png'),
  'frames.laneDisabled': asset('frames.laneDisabled', laneCardDisabled, 'historical disabled lane row frame, replaced by CSS lane rows', 'src/assets/apothecaryExact/frames/lane_card_disabled.png'),
  'frames.laneSelected': asset('frames.laneSelected', laneCardSelected, 'selected jade lane row frame', 'src/assets/apothecaryExact/frames/lane_card_selected.png'),
  'frames.laneRecommended': asset('frames.laneRecommended', laneCardRecommended, 'recommended lane row frame', 'src/assets/apothecaryExact/frames/lane_card_recommended.png'),
  'remedies.healingPellet': asset('remedies.healingPellet', healingPellet, 'Healing Pellet icon', 'src/assets/apothecaryExact/remedies/healing_pellet.png', true),
  'remedies.wardSalt': asset('remedies.wardSalt', wardSalt, 'Ward Salt icon', 'src/assets/apothecaryExact/remedies/ward_salt.png', true),
  'remedies.focusDew': asset('remedies.focusDew', focusDew, 'Focus Dew icon', 'src/assets/apothecaryExact/remedies/focus_dew.png', true),
  'remedies.meridianTea': asset('remedies.meridianTea', meridianTea, 'Meridian Tea icon', 'src/assets/apothecaryExact/remedies/meridian_tea.png', true),
  'remedies.ironbloodPellet': asset('remedies.ironbloodPellet', ironbloodPellet, 'Ironblood Pellet live fallback icon', 'src/assets/apothecaryExact/remedies/ironblood_pellet.png', true),
  'remedies.qiElixir': asset('remedies.qiElixir', qiElixir, 'Qi Elixir live fallback icon', 'src/assets/apothecaryExact/remedies/qi_elixir.png', true),
  'remedies.spiritLeaf': asset('remedies.spiritLeaf', spiritLeaf, 'Spirit Leaf ingredient icon', 'src/assets/apothecaryExact/remedies/spirit_leaf.png', true),
  'remedies.moonDew': asset('remedies.moonDew', bluePotionBottle, 'Moon Dew ingredient icon fallback', 'src/assets/apothecaryExact/remedies/blue_potion_bottle.png'),
  'remedies.genericPowder': asset('remedies.genericPowder', powderPacket, 'generic missing material packet icon', 'src/assets/apothecaryExact/remedies/powder_packet.png'),
  'sources.buy': asset('sources.buy', sourceCityMarket, 'buy route source icon', 'src/assets/apothecaryExact/sources/source_city_market.png', true),
  'sources.apothecaryShelf': asset('sources.apothecaryShelf', sourceApothecaryShelf, 'apothecary shelf source icon', 'src/assets/apothecaryExact/sources/source_apothecary_shelf.png'),
  'sources.brew': asset('sources.brew', sourceBrewCauldron, 'brew route source icon', 'src/assets/apothecaryExact/sources/source_brew_cauldron.png', true),
  'sources.herb': asset('sources.herb', sourceHerbGrove, 'herb route source icon', 'src/assets/apothecaryExact/sources/source_herb_grove.png', true),
  'sources.outskirts': asset('sources.outskirts', sourceOutskirts, 'outskirts route source icon', 'src/assets/apothecaryExact/sources/source_outskirts.png'),
  'sources.ruins': asset('sources.ruins', sourceRuins, 'ruins route source icon', 'src/assets/apothecaryExact/sources/source_ruins.png', true),
  'sources.expedition': asset('sources.expedition', sourceExpedition, 'expedition route source icon', 'src/assets/apothecaryExact/sources/source_expedition.png', true),
  'sources.bounty': asset('sources.bounty', sourceBounty, 'bounty route source icon', 'src/assets/apothecaryExact/sources/source_bounty.png'),
  'sources.forge': asset('sources.forge', sourceForge, 'forge route source icon', 'src/assets/apothecaryExact/sources/source_forge.png'),
  'sources.manual': asset('sources.manual', sourceManualPavilion, 'manual pavilion source icon', 'src/assets/apothecaryExact/sources/source_manual_pavilion.png'),
  'sources.gate': asset('sources.gate', sourceGateTrial, 'gate trial route source icon', 'src/assets/apothecaryExact/sources/source_gate_trial.png'),
  'sources.inventory': asset('sources.inventory', sourceInventoryCache, 'inventory cache source icon', 'src/assets/apothecaryExact/sources/source_inventory_cache.png'),
  'sources.meritExchange': asset('sources.meritExchange', sourceMeritExchange, 'gold and merit exchange source icon', 'src/assets/apothecaryExact/sources/source_merit_exchange.png'),
  'sources.locked': asset('sources.locked', sourceLockedUnknown, 'locked or unknown source icon', 'src/assets/apothecaryExact/sources/source_locked_unknown.png', true),
  'warnings.healing': asset('warnings.healing', warningHealingBelowFloor, 'healing below floor warning stamp', 'src/assets/apothecaryExact/warnings/warning_healing_below_floor.png', true),
  'warnings.specialty': asset('warnings.specialty', warningCitySpecialtyMissing, 'city specialty missing warning stamp', 'src/assets/apothecaryExact/warnings/warning_city_specialty_missing.png', true),
  'warnings.pouch': asset('warnings.pouch', warningPouchRequirement, 'medicine pouch requirement warning stamp', 'src/assets/apothecaryExact/warnings/warning_pouch_requirement.png', true),
  'warnings.unknown': asset('warnings.unknown', warningUnknownProblem, 'unknown warning stamp', 'src/assets/apothecaryExact/warnings/warning_unknown_problem.png'),
  'warnings.locked': asset('warnings.locked', warningLocked, 'locked warning stamp', 'src/assets/apothecaryExact/warnings/warning_locked.png'),
};

export function getApothecaryExactAssetWarnings(
  assets: ApothecaryExactAssetMap = APOTHECARY_EXACT_ASSETS,
): string[] {
  return APOTHECARY_EXACT_REQUIRED_ASSET_KEYS
    .filter((key) => !assets[key]?.src || assets[key].status !== 'ready')
    .map((key) => `Missing required Apothecary Exact asset role: ${key}`);
}

export function getApothecaryExactAssetSrc(
  key: ApothecaryExactAssetKey,
  assets: ApothecaryExactAssetMap = APOTHECARY_EXACT_ASSETS,
): string {
  return assets[key]?.src ?? '';
}
