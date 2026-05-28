import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MedicinePouchModal } from '../../../components/modals/MedicinePouchModal.js';
import { useBountyStore } from '../../../stores/bountyStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useExpeditionStore } from '../../../stores/expeditionStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { useMedicinePouchStore } from '../../../stores/medicinePouchStore.js';
import { useProfessionStore } from '../../../stores/professionStore.js';
import { useShopStore } from '../../../stores/shopStore.js';
import { ApothecaryExactScreen } from './ApothecaryExactScreen.js';
import { buildApothecaryExactSurfaceFromStores } from './buildApothecaryExactSurface.js';
import { isApothecaryExactFixtureRouteEnabled } from './apothecaryExactFixtureRoute.js';
import { useApothecaryExactActionController } from './useApothecaryExactActionController.js';
import type { ApothecaryExactFocus } from './apothecaryExactTypes.js';
import { PERF_LABELS, time } from '../../../services/performance/index.js';
import { PerfProfiler, useRenderCounter } from '../../../services/performance/perfReact.js';
import './ApothecaryExactScreen.scss';

export interface ApothecaryExactScreenOwnerProps {
  cityId: string;
  shopId?: string | null;
  forceFixture?: boolean;
  focus?: ApothecaryExactFocus;
}

function useExactPlaneScale(containerRef: React.RefObject<HTMLElement>) {
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

export function ApothecaryExactScreenOwner(props: ApothecaryExactScreenOwnerProps) {
  useRenderCounter(PERF_LABELS.renderApothecaryExactScreenOwner);
  const ownerRef = useRef<HTMLDivElement | null>(null);
  const pouchAnchorRef = useRef<HTMLButtonElement | null>(null);
  const [pouchOpen, setPouchOpen] = useState(false);
  const scale = useExactPlaneScale(ownerRef);
  const forceFixtureFromRoute = isApothecaryExactFixtureRouteEnabled();
  const mode = props.forceFixture || forceFixtureFromRoute ? 'fixture' : 'live';

  const contentVersion = useContentStore((state) => state.contentVersion);
  const inventoryVersion = useInventoryStore((state) => state.inventoryVersion);
  const currencyVersion = useInventoryStore((state) => state.currencyVersion);
  const shopVersion = useShopStore((state) => state.shopVersion);
  const pouchVersion = useMedicinePouchStore((state) => state.pouchVersion);
  const professionVersion = useProfessionStore((state) => state.professionVersion);
  const expeditionVersion = useExpeditionStore((state) => state.expeditionVersion);
  const bountyVersion = useBountyStore((state) => state.bountyVersionByCityId[props.cityId] ?? 0);

  const surface = useMemo(
    () => time(PERF_LABELS.surfaceApothecary, () => buildApothecaryExactSurfaceFromStores(props.cityId, {
      mode,
      shopId: props.shopId ?? null,
      focus: props.focus,
    })),
    [
      props.cityId,
      props.shopId,
      props.focus,
      mode,
      contentVersion,
      inventoryVersion,
      currencyVersion,
      shopVersion,
      pouchVersion,
      professionVersion,
      expeditionVersion,
      bountyVersion,
    ],
  );
  const actions = useApothecaryExactActionController({
    cityId: props.cityId,
    shopId: surface.meta.shopId ?? props.shopId ?? null,
    surface,
    onOpenPouchModal: () => setPouchOpen(true),
  });
  const screenActions = surface.meta.mode === 'live' ? actions : { onAction: actions.onAction };

  return (
    <PerfProfiler id={PERF_LABELS.renderApothecaryExactScreenOwner}>
    <div
      ref={ownerRef}
      className="apothecaryExactScreenOwner"
      data-testid="apothecary-exact-screen-owner"
      data-mode={surface.meta.mode}
      data-source={surface.meta.source}
      data-city-id={props.cityId}
      data-shop-id={surface.meta.shopId ?? ''}
    >
      <button ref={pouchAnchorRef} type="button" className="apothecaryExactSrAnchor" aria-hidden="true" tabIndex={-1} />
      <ApothecaryExactScreen
        surface={surface}
        scale={scale}
        {...screenActions}
      />
      <MedicinePouchModal open={pouchOpen} onClose={() => setPouchOpen(false)} anchorRef={pouchAnchorRef} />
    </div>
    </PerfProfiler>
  );
}
