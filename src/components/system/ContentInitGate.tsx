import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';
import { useContentStore } from '../../stores/contentStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { getLiveRealmByIndex } from '../../systems/progression/runtime/index.js';
import { bootstrapLiveWorldStores } from '../../systems/world/bootstrapLiveWorld.js';
import { GameIcon } from '../../ui/icons/index.js';

const EMPTY_RUINS = Object.freeze([]) as ReadonlyArray<
  NonNullable<ReturnType<typeof useContentStore.getState>['raw']>['ruins'][number]
>;

export function ContentInitGate({ children }: PropsWithChildren) {
  const isLoading = useContentStore((state) => state.isLoading);
  const isLoaded = useContentStore((state) => state.isLoaded);
  const error = useContentStore((state) => state.error);
  const load = useContentStore((state) => state.load);
  const citiesSorted = useContentStore((state) => state.citiesSorted);
  const raw = useContentStore((state) => state.raw);
  const ruins = raw?.ruins ?? EMPTY_RUINS;
  const realmIndex = useGameStore((state) => state.realm.index);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    load().catch(() => {});
  }, [load]);

  useEffect(() => {
    if (!isLoaded) return;
    bootstrapLiveWorldStores({
      cities: citiesSorted,
      ruins,
      majorRealmId: getLiveRealmByIndex(realmIndex).id,
    });
  }, [isLoaded, citiesSorted, realmIndex, ruins]);

  if (error) {
    return (
      <div className={'appShell'}>
        <div className={'appMessageCard'}>
          <div className={'appHeroIcon'}>
            <GameIcon icon="inkWarning" size={64} decorative />
          </div>
          <h1 className={'appTitle'}>Content Load Failed</h1>
          <p className={'appSubtext'}>{error}</p>
          <button
            onClick={() => {
              startedRef.current = false;
              load().catch(() => {});
            }}
            className={'button-standard appPrimaryButton'}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={'appShell'}>
        <div className={'appMessageCard'}>
          <div className={'appHeroIcon'}>
            <GameIcon icon="inkSparkles" size={64} decorative className="appLoader" />
          </div>
          <h1 className={'appTitle'}>Loading Content</h1>
          <p className={'appSubtext'}>{isLoading ? 'Fetching configuration...' : 'Preparing content...'}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
