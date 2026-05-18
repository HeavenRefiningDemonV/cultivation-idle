import { useCityStore } from '../../stores/cityStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useEquipmentStore } from '../../stores/equipmentStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { useTechCollectionStore } from '../../stores/techCollectionStore.js';
import { buildCurrentGateEconomyContext } from '../progression/currentGateEconomyContext.js';
import { buildForgeFloorReadModel, collectSocketedRuneIds } from './forgeFloorReadModel.js';

export function getLiveForgeFloorReadModel(options: { cityId?: string | null } = {}) {
  const equipment = useEquipmentStore.getState();
  const inventory = useInventoryStore.getState();
  const content = useContentStore.getState();
  const techCollection = useTechCollectionStore.getState();
  const cityStore = useCityStore.getState();
  const game = useGameStore.getState();

  const resolvedCityId = options.cityId ?? cityStore.currentCityId ?? cityStore.unlockedCityIds[0] ?? null;
  const cityIndex = resolvedCityId ? content.maps.citiesById[resolvedCityId]?.index ?? null : null;
  const gateContext = content.raw
    ? buildCurrentGateEconomyContext({
        content: content.raw,
        realmIndex: game.realm.index,
        cityId: resolvedCityId,
      })
    : null;
  const inventoryRuneCounts = Object.fromEntries(
    Object.keys(content.maps.runesById).map((runeId) => [runeId, inventory.getQty(runeId)]),
  );

  return buildForgeFloorReadModel({
    weaponRefineFloor: equipment.refineLevelBySlot.weapon,
    accessoryRefineFloor: equipment.refineLevelBySlot.accessory,
    temperSuccessesBySlot: {
      weapon: equipment.temperBonusesBySlot.weapon.length,
      accessory: equipment.temperBonusesBySlot.accessory.length,
    },
    inventoryRuneCounts,
    socketedRuneIds: collectSocketedRuneIds(techCollection.unlockedTechs),
    cityIndex,
    currentGateIndex: gateContext?.gateIndex ?? null,
    gateLabel: gateContext?.gateLabel ?? null,
    gateContextSource: gateContext?.source ?? null,
  });
}
