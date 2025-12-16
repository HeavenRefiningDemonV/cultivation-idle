import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { useContentStore } from '../../stores/contentStore';

export function ContentInitGate({ children }: PropsWithChildren) {
  const { isLoading, isLoaded, error, load } = useContentStore((state) => ({
    isLoading: state.isLoading,
    isLoaded: state.isLoaded,
    error: state.error,
    load: state.load,
  }));

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className={'appShell'}>
        <div className={'appMessageCard'}>
          <div className={'appHeroIcon'}>🗺️</div>
          <h1 className={'appTitle'}>Content Load Failed</h1>
          <p className={'appSubtext'}>{error}</p>
          <button onClick={() => load()} className={'button-standard appPrimaryButton'}>
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
          <div className={`${'appHeroIcon'} ${'appLoader'}`}>📜</div>
          <h1 className={'appTitle'}>Loading Content</h1>
          <p className={'appSubtext'}>{isLoading ? 'Fetching configuration...' : 'Preparing content...'}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
