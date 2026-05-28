import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useBountyStore } from '../../../stores/bountyStore.js';
import { useCityStore } from '../../../stores/cityStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useExpeditionStore } from '../../../stores/expeditionStore.js';
import { buildExpeditionsExactSurfaceFromStores } from './buildExpeditionsExactSurface.js';
import { ExpeditionsExactScreen } from './ExpeditionsExactScreen.js';
import { useExpeditionsExactActionController } from './useExpeditionsExactActionController.js';
import { PERF_LABELS, time } from '../../../services/performance/index.js';
import { PerfProfiler, useRenderCounter } from '../../../services/performance/perfReact.js';
import './ExpeditionsExactScreen.scss';

export interface ExpeditionsExactScreenOwnerProps {
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

export function ExpeditionsExactScreenOwner({ cityId, forceFixture = false }: ExpeditionsExactScreenOwnerProps) {
  useRenderCounter(PERF_LABELS.renderExpeditionsExactScreenOwner);
  const ownerRef = useRef<HTMLDivElement | null>(null);
  const scale = useExactPlaneScale(ownerRef);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedDurationId, setSelectedDurationId] = useState<string | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const contentVersion = useContentStore((state) => state.contentVersion);
  const citySignature = useCityStore((state) => `${state.currentCityId}|${state.unlockedCityIds.join(',')}`);
  const expeditionVersion = useExpeditionStore((state) => state.expeditionVersion);
  const bountyVersion = useBountyStore((state) =>
    cityId ? state.bountyVersionByCityId[cityId] ?? 0 : state.bountyVersion,
  );
  const tick = useExpeditionStore((state) => state.tick);

  useEffect(() => {
    const handle = window.setInterval(() => {
      const nextNow = Date.now();
      setNow(nextNow);
      if (!forceFixture) tick(nextNow);
    }, 1000);
    return () => window.clearInterval(handle);
  }, [forceFixture, tick]);

  const storeInvalidationKey = useMemo(
    () => [contentVersion, citySignature, expeditionVersion, bountyVersion].join('||'),
    [bountyVersion, citySignature, contentVersion, expeditionVersion],
  );

  const surface = useMemo(() => {
    void storeInvalidationKey;
    return time(PERF_LABELS.surfaceExpeditions, () => buildExpeditionsExactSurfaceFromStores(cityId, {
      mode: forceFixture ? 'fixture' : 'live',
      selectedRouteId,
      selectedDurationId,
      selectedSlotIndex,
      now,
    }));
  }, [cityId, forceFixture, now, selectedDurationId, selectedRouteId, selectedSlotIndex, storeInvalidationKey]);

  useEffect(() => {
    if (surface.meta.selectedRouteId !== selectedRouteId) {
      setSelectedRouteId(surface.meta.selectedRouteId);
    }
  }, [selectedRouteId, surface.meta.selectedRouteId]);

  useEffect(() => {
    if (surface.meta.selectedDurationId !== selectedDurationId) {
      setSelectedDurationId(surface.meta.selectedDurationId);
    }
  }, [selectedDurationId, surface.meta.selectedDurationId]);

  useEffect(() => {
    if (surface.meta.selectedSlotIndex !== selectedSlotIndex) {
      setSelectedSlotIndex(surface.meta.selectedSlotIndex);
    }
  }, [selectedSlotIndex, surface.meta.selectedSlotIndex]);

  const actions = useExpeditionsExactActionController({
    surface,
    setSelectedRouteId,
    setSelectedDurationId,
    setSelectedSlotIndex,
  });

  return (
    <PerfProfiler id={PERF_LABELS.renderExpeditionsExactScreenOwner}>
    <div
      ref={ownerRef}
      className="expeditionsExactScreenOwner"
      data-testid="expeditions-exact-screen-owner"
      data-mode={surface.meta.mode}
      data-city-id={surface.meta.cityId}
    >
      <ExpeditionsExactScreen
        surface={surface}
        scale={scale}
        onSelectRoute={actions.selectRoute}
        onDispatch={actions.dispatchExpedition}
        onClaimFirstReady={actions.claimExpedition}
        onClaimAllReady={actions.claimAllReady}
        onAutoFillRecommended={actions.autoFillRecommended}
        onSlotAction={actions.slotAction}
      />
    </div>
    </PerfProfiler>
  );
}
