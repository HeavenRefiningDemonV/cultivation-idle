import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useBountyStore } from '../../../stores/bountyStore.js';
import { useCityStore } from '../../../stores/cityStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { BountiesExactScreen } from './BountiesExactScreen.js';
import { buildBountiesExactSurfaceFromStores } from './buildBountiesExactSurface.js';
import { useBountiesExactActionController } from './useBountiesExactActionController.js';
import { PERF_LABELS, time } from '../../../services/performance/index.js';
import { PerfProfiler, useRenderCounter } from '../../../services/performance/perfReact.js';
import './BountiesExactScreen.scss';

export interface BountiesExactScreenOwnerProps {
  cityId: string | null;
  forceFixture?: boolean;
}

function useExactPlaneScale(containerRef: React.RefObject<HTMLElement | null>) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;

    const updateScale = () => {
      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const nextScale = Math.min(rect.width / 2048, rect.height / 1152);
      setScale(Math.max(0.1, Math.min(1.25, nextScale)));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(node);
    window.addEventListener('resize', updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [containerRef]);

  return scale;
}

export function BountiesExactScreenOwner({ cityId, forceFixture = false }: BountiesExactScreenOwnerProps) {
  useRenderCounter(PERF_LABELS.renderBountiesExactScreenOwner);
  const ownerRef = useRef<HTMLDivElement | null>(null);
  const scale = useExactPlaneScale(ownerRef);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const contentVersion = useContentStore((state) => state.contentVersion);
  const citySignature = useCityStore((state) => `${state.currentCityId}|${state.unlockedCityIds.join(',')}`);
  const currencyVersion = useInventoryStore((state) => state.currencyVersion);
  const boardVersion = useBountyStore((state) =>
    cityId ? state.bountyVersionByCityId[cityId] ?? 0 : state.bountyVersion,
  );
  const generateForCity = useBountyStore((state) => state.generateForCity);

  const city = useContentStore((state) => (cityId ? state.maps.citiesById[cityId] : undefined));
  const hasBoard = useBountyStore((state) => Boolean(cityId && state.activeByCityId[cityId]?.length));

  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(handle);
  }, []);

  useEffect(() => {
    if (forceFixture || !cityId || !city || typeof city.index !== 'number' || hasBoard) return;
    generateForCity(cityId, city.index);
  }, [city, cityId, forceFixture, generateForCity, hasBoard]);

  const storeInvalidationKey = useMemo(
    () => [contentVersion, citySignature, currencyVersion, boardVersion].join('||'),
    [boardVersion, citySignature, contentVersion, currencyVersion],
  );

  const surface = useMemo(() => {
    void storeInvalidationKey;
    return time(PERF_LABELS.surfaceBounties, () => buildBountiesExactSurfaceFromStores(cityId, {
      mode: forceFixture ? 'fixture' : 'live',
      selectedOrderId,
      now,
    }));
  }, [cityId, forceFixture, now, selectedOrderId, storeInvalidationKey]);

  useEffect(() => {
    if (surface.meta.selectedOrderId !== selectedOrderId) {
      setSelectedOrderId(surface.meta.selectedOrderId);
    }
  }, [selectedOrderId, surface.meta.selectedOrderId]);

  const actions = useBountiesExactActionController({
    surface,
    setSelectedOrderId,
    now,
  });

  return (
    <PerfProfiler id={PERF_LABELS.renderBountiesExactScreenOwner}>
    <div
      ref={ownerRef}
      className="bountiesExactScreenOwner"
      data-testid="bounties-exact-screen-owner"
      data-mode={surface.meta.mode}
      data-city-id={surface.meta.cityId}
    >
      <BountiesExactScreen
        surface={surface}
        scale={scale}
        onSelectOrder={actions.selectOrder}
        onTrackSelected={actions.trackSelected}
        onClaimReady={actions.claimReady}
        onClaimAllReady={actions.claimAllReady}
        onRouteNow={actions.routeNow}
        onRouteNotice={actions.routeTrackedNotice}
        onRefreshBoard={actions.refreshBoard}
        onNotePrimaryAction={actions.notePrimaryAction}
      />
    </div>
    </PerfProfiler>
  );
}
