import { Suspense, lazy, useMemo } from 'react';
import { useActivityStore } from '../../../../stores/activityStore.js';
import { useCombatStore } from '../../../../stores/combatStore.js';
import { useContentStore } from '../../../../stores/contentStore.js';
import { resolveModuleRef } from '../worldUtils.js';
import { getOutskirtsModuleViewState } from '../../../../features/world/outskirts/getOutskirtsModuleViewState.js';
import { OutskirtsPlanningOwner } from '../../../../features/world/outskirts/OutskirtsPlanningOwner.js';

const OutskirtsLegacyActiveSurface = lazy(async () => {
  const module = await import('../../../../features/world/outskirts/OutskirtsLegacyActiveSurface.js');
  return { default: module.OutskirtsLegacyActiveSurface };
});

interface OutskirtsBuildingPanelProps {
  cityId: string;
}

export function OutskirtsBuildingPanel({ cityId }: OutskirtsBuildingPanelProps) {
  const city = useContentStore((state) => state.maps.citiesById[cityId]);
  const outskirtsById = useContentStore((state) => state.maps.outskirtsById);
  const activity = useActivityStore((state) => state.active);
  const combatContext = useCombatStore((state) => state.combatContext);

  const outskirtsRefId = useMemo(() => resolveModuleRef(city ?? null, 'outskirts'), [city]);
  const outskirtsDef = outskirtsRefId ? outskirtsById[outskirtsRefId] : undefined;

  const viewState = getOutskirtsModuleViewState({
    cityId,
    outskirtsId: outskirtsDef?.id ?? null,
    activity,
    combatContext,
  });

  if (viewState === 'unavailable') {
    return (
      <div className={'worldScreenPlaceholder'} data-testid="outskirts-view-unavailable">
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>Outskirts</div>
          <div className={'worldScreenPlaceholderKey'}>outskirts</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>
          <div className={'worldScreenPlaceholderLine'}>Unavailable for this city.</div>
        </div>
      </div>
    );
  }

  if (viewState === 'planning') {
    return <OutskirtsPlanningOwner cityId={cityId} />;
  }

  return (
    <Suspense
      fallback={(
        <div className="worldScreenPlaceholder" data-testid="outskirts-active-boundary-loading">
          <div className="worldScreenPlaceholderHeader">
            <div className="worldScreenPlaceholderTitle">Outskirts</div>
            <div className="worldScreenPlaceholderKey">outskirts</div>
          </div>
          <div className="worldScreenPlaceholderBody">
            <div className="worldScreenPlaceholderLine">Resuming active run…</div>
          </div>
        </div>
      )}
    >
      <OutskirtsLegacyActiveSurface cityId={cityId} />
    </Suspense>
  );
}
