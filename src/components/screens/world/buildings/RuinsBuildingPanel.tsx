import { useMemo } from 'react';
import { useContentStore } from '../../../../stores/contentStore.js';
import { resolveModuleRef } from '../worldUtils.js';
import { RuinsScreenOwner } from '../../../../features/world/ruinsExact/index.js';

interface RuinsBuildingPanelProps {
  cityId: string;
  forceFixture?: boolean;
}

export function RuinsBuildingPanel({ cityId, forceFixture }: RuinsBuildingPanelProps) {
  const city = useContentStore((state) => state.maps.citiesById[cityId]);
  const ruinsById = useContentStore((state) => state.maps.ruinsById);
  const ruinRefId = useMemo(() => resolveModuleRef(city ?? null, 'ruins'), [city]);
  const ruinDef = ruinRefId ? ruinsById[ruinRefId] : undefined;

  if (!ruinDef) {
    return (
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>Ruins</div>
          <div className={'worldScreenPlaceholderKey'}>ruins</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>
          <div className={'worldScreenPlaceholderLine'}>Unavailable for this city.</div>
        </div>
      </div>
    );
  }

  return <RuinsScreenOwner cityId={cityId} ruinId={ruinDef.id} forceFixture={forceFixture} />;
}
