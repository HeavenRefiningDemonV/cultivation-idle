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
  const ownerRef = useRef<HTMLDivElement | null>(null);
  const pouchAnchorRef = useRef<HTMLButtonElement | null>(null);
  const [pouchOpen, setPouchOpen] = useState(false);
  const scale = useExactPlaneScale(ownerRef);
  const forceFixtureFromRoute = isApothecaryExactFixtureRouteEnabled();
  const mode = props.forceFixture || forceFixtureFromRoute ? 'fixture' : 'live';

  const contentSignature = useContentStore((state) => [
    state.isLoaded ? 'loaded' : 'unloaded',
    state.citiesSorted.length,
    Object.keys(state.maps.apothecariesById).length,
    Object.keys(state.maps.itemsById).length,
  ].join('|'));
  const inventorySignature = useInventoryStore((state) => JSON.stringify({ currencies: state.currencies, items: state.items }));
  const shopSignature = useShopStore((state) => JSON.stringify({
    dayKey: state.dayKey,
    purchased: props.shopId ? state.purchasedToday[props.shopId] ?? {} : state.purchasedToday,
  }));
  const pouchSignature = useMedicinePouchStore((state) => JSON.stringify(state.slots));
  const brewSignature = useProfessionStore((state) => state.alchemyQueue.map((job) => `${job.id}:${job.recipeId}:${job.qty}:${job.endsAt}`).join('|'));
  const expeditionSignature = useExpeditionStore((state) => `${state.slots}:${state.active.map((run) => `${run.slotIndex}:${run.status}:${run.endsAt}`).join('|')}`);
  const bountySignature = useBountyStore((state) => JSON.stringify({
    tracked: state.trackedByCityId[props.cityId] ?? null,
    board: state.activeByCityId[props.cityId]?.map((bounty) => `${bounty.instanceId}:${bounty.progress}:${bounty.claimed}`).join('|') ?? '',
  }));

  const surface = useMemo(
    () => buildApothecaryExactSurfaceFromStores(props.cityId, {
      mode,
      shopId: props.shopId ?? null,
      focus: props.focus,
    }),
    [
      props.cityId,
      props.shopId,
      props.focus,
      mode,
      contentSignature,
      inventorySignature,
      shopSignature,
      pouchSignature,
      brewSignature,
      expeditionSignature,
      bountySignature,
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
      <ApothecaryExactScreen surface={surface} scale={scale} {...screenActions} />
      <MedicinePouchModal open={pouchOpen} onClose={() => setPouchOpen(false)} anchorRef={pouchAnchorRef} />
    </div>
  );
}
