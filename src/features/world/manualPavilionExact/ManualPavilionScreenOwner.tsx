import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useContentStore } from '../../../stores/contentStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { useManualPavilionStore } from '../../../stores/manualPavilionStore.js';
import { useManualSatchelStore } from '../../../stores/manualSatchelStore.js';
import { useTechCollectionStore } from '../../../stores/techCollectionStore.js';
import { useDaoMandateRouteActionHandler } from '../../../systems/ui/daoMandate/index.js';
import { ManualPavilionExactScreen } from './ManualPavilionExactScreen.js';
import { buildManualPavilionExactSurfaceFromStores } from './buildManualPavilionExactSurface.js';
import { useManualPavilionExactActionController } from './useManualPavilionExactActionController.js';
import './ManualPavilionExactScreen.scss';

export interface ManualPavilionScreenOwnerProps {
  cityId: string;
  pavilionId?: string | null;
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
      setScale(Math.max(0.78, Math.min(1.12, nextScale)));
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

export function ManualPavilionScreenOwner({
  cityId,
  pavilionId = null,
  forceFixture = false,
}: ManualPavilionScreenOwnerProps) {
  const ownerRef = useRef<HTMLDivElement | null>(null);
  const scale = useExactPlaneScale(ownerRef);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const resolvedPavilionId = useContentStore((state) => {
    if (pavilionId) return pavilionId;
    return state.maps.citiesById[cityId]?.refs?.pavilionId ?? null;
  });
  const contentSignature = useContentStore((state) => [
    state.isLoaded ? 'loaded' : 'unloaded',
    state.citiesSorted.length,
    Object.keys(state.maps.pavilionsById).length,
    Object.keys(state.maps.techniquesById).length,
  ].join('|'));
  const hasContentPavilion = useContentStore((state) => Boolean(resolvedPavilionId && state.maps.pavilionsById[resolvedPavilionId]));
  const stockSignature = useManualPavilionStore((state) => {
    const stock = resolvedPavilionId ? state.stockByPavilionId[resolvedPavilionId] : null;
    if (!stock) return 'stock:none';
    return JSON.stringify({
      generatedAt: stock.generatedAt,
      nextRefreshAt: stock.nextRefreshAt,
      pity: stock.pity,
      slots: stock.slots.map((slot) => [
        slot.slotIndex,
        slot.techniqueId,
        slot.grade,
        slot.rarity,
        slot.sold ? 1 : 0,
        slot.sealed ? 1 : 0,
        slot.notSold ? 1 : 0,
      ]),
    });
  });
  const inventorySignature = useInventoryStore((state) => `${state.currencies.gold}|${state.currencies.merit}|${state.currencies.spiritStones}`);
  const satchelSignature = useManualSatchelStore((state) => `${state.manuals.length}|${state.activeStudy?.manual.id ?? 'none'}`);
  const techSignature = useTechCollectionStore((state) => JSON.stringify({
    unlocked: Object.keys(state.unlockedTechs).filter((techId) => state.unlockedTechs[techId]?.unlocked).length,
    fragments: Object.entries(state.fragments).reduce((sum, [, qty]) => sum + (Number(qty) || 0), 0),
  }));
  const ensureStock = useManualPavilionStore((state) => state.ensureStock);

  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(handle);
  }, []);

  useEffect(() => {
    if (forceFixture || !resolvedPavilionId || !hasContentPavilion) return;
    const stock = useManualPavilionStore.getState().stockByPavilionId[resolvedPavilionId];
    if (!stock) ensureStock(resolvedPavilionId, Date.now());
  }, [ensureStock, forceFixture, hasContentPavilion, resolvedPavilionId]);

  const storeInvalidationKey = useMemo(
    () => [contentSignature, stockSignature, inventorySignature, satchelSignature, techSignature].join('||'),
    [contentSignature, inventorySignature, satchelSignature, stockSignature, techSignature],
  );

  const surface = useMemo(() => {
    void storeInvalidationKey;
    return buildManualPavilionExactSurfaceFromStores(cityId, {
      mode: forceFixture ? 'fixture' : 'live',
      pavilionId: resolvedPavilionId,
      selectedSlotIndex,
      nowMs: now,
    });
  }, [cityId, forceFixture, now, resolvedPavilionId, selectedSlotIndex, storeInvalidationKey]);

  useEffect(() => {
    if (surface.meta.selectedSlotIndex !== selectedSlotIndex) {
      setSelectedSlotIndex(surface.meta.selectedSlotIndex);
    }
  }, [selectedSlotIndex, surface.meta.selectedSlotIndex]);

  const actions = useManualPavilionExactActionController({
    cityId,
    pavilionId: surface.meta.pavilionId,
    surface,
    selectedSlotIndex,
    setSelectedSlotIndex,
    nowMs: now,
  });
  const onMandateRouteAction = useDaoMandateRouteActionHandler('dao-mandate-manual-pavilion-source');

  return (
    <div
      ref={ownerRef}
      className="manualPavilionExactScreenOwner"
      data-testid="manual-pavilion-exact-screen-owner"
      data-mode={surface.meta.mode}
      data-city-id={surface.meta.cityId}
      data-pavilion-id={surface.meta.pavilionId ?? ''}
    >
      <ManualPavilionExactScreen
        surface={surface}
        scale={scale}
        onReturnToWorld={actions.returnToWorld}
        onSelectSpine={actions.selectSpine}
        onRefreshStock={actions.refreshStock}
        onBuyManual={actions.buyManual}
        onStudyLater={actions.studyLater}
        onViewTechniques={actions.viewTechniques}
        onOpenSatchel={actions.openSatchel}
        onMandateRouteAction={onMandateRouteAction}
      />
    </div>
  );
}
