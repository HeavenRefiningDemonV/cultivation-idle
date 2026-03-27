import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';
import { useContentStore } from '../../stores/contentStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { getLiveRealmByIndex } from '../../systems/progression/runtime/index.js';
import { bootstrapLiveWorldStores } from '../../systems/world/bootstrapLiveWorld.js';
import { ContentLoadFailureModal } from '../modals/ContentLoadFailureModal.js';
import { normalizeContentLoadFailure } from '../../services/diagnostics/buildContentLoadFailureDiagnostics.js';

const EMPTY_RUINS = Object.freeze([]) as ReadonlyArray<
  NonNullable<ReturnType<typeof useContentStore.getState>['raw']>['ruins'][number]
>;

export function ContentInitGate({ children }: PropsWithChildren) {
  const isLoading = useContentStore((state) => state.isLoading);
  const isLoaded = useContentStore((state) => state.isLoaded);
  const error = useContentStore((state) => state.error);
  const loadFailure = useContentStore((state) => state.loadFailure);
  const loadFailureDiagnostics = useContentStore((state) => state.loadFailureDiagnostics);
  const setLoadFailure = useContentStore((state) => state.setLoadFailure);
  const clearLoadFailure = useContentStore((state) => state.clearLoadFailure);
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
    try {
      bootstrapLiveWorldStores({
        cities: citiesSorted,
        ruins,
        majorRealmId: getLiveRealmByIndex(realmIndex).id,
      });
    } catch (error) {
      const failure = normalizeContentLoadFailure({
        phase: 'bootstrap',
        error,
        attemptCount: (loadFailure?.attemptCount ?? 0) + 1,
      });
      setLoadFailure(failure, error);
    }
  }, [isLoaded, citiesSorted, realmIndex, ruins, loadFailure?.attemptCount, setLoadFailure]);

  const handleRetry = () => {
    clearLoadFailure();
    startedRef.current = false;
    load().catch(() => {});
  };

  const handleDownloadDiagnostics = () => {
    if (!loadFailureDiagnostics) return;
    const blob = new Blob([JSON.stringify(loadFailureDiagnostics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `content_load_failure_${new Date(loadFailureDiagnostics.createdAt).toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (error && loadFailure) {
    return <ContentLoadFailureModal failure={loadFailure} onRetry={handleRetry} onDownloadDiagnostics={handleDownloadDiagnostics} />;
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
