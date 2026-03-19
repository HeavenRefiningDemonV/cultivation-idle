import type { CityDef, RuinDef } from '../../content/index.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useRuinsStore } from '../../stores/ruinsStore.js';
import type { MajorRealmId } from '../progression/contract/contractTypes.js';

export function bootstrapLiveWorldStores({
  cities,
  ruins,
  majorRealmId,
}: {
  cities: CityDef[];
  ruins: RuinDef[];
  majorRealmId: MajorRealmId;
}): void {
  useCityStore.getState().initializeFromContent(cities);
  useRuinsStore.getState().initializeFromContent(ruins);
  useCityStore.getState().syncRealmEntry(majorRealmId);
}
