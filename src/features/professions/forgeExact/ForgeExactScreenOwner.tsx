import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ForgeHandsOnSession } from '../../../components/crafting/ForgeHandsOnSession.js';
import { getForgeBlueprint, useContentStore } from '../../../stores/contentStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { useProfessionStore } from '../../../stores/professionStore.js';
import { useEquipmentStore } from '../../../stores/equipmentStore.js';
import { useActivityStore } from '../../../stores/activityStore.js';
import { useCraftSessionStore } from '../../../stores/craftSessionStore.js';
import { useCityStore } from '../../../stores/cityStore.js';
import { ForgeExactScreen } from './ForgeExactScreen.js';
import { buildForgeExactSurfaceFromStores } from './buildForgeExactSurface.js';
import { useForgeExactActionController } from './useForgeExactActionController.js';
import type { ForgeExactActionResult, ForgeExactMode, ForgeExactTab } from './forgeExactTypes.js';
import './ForgeExactScreen.scss';

export interface ForgeExactScreenOwnerProps {
  cityId: string | null;
  forceFixture?: boolean;
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

export function ForgeExactScreenOwner({ cityId, forceFixture = false }: ForgeExactScreenOwnerProps) {
  const ownerRef = useRef<HTMLDivElement | null>(null);
  const scale = useExactPlaneScale(ownerRef);
  const [activeTab, setActiveTab] = useState<ForgeExactTab>('refine');
  const [activeMode, setActiveMode] = useState<ForgeExactMode>('assisted');
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(null);
  const [selectedTargetSlot, setSelectedTargetSlot] = useState<'weapon' | 'accessory'>('weapon');
  const [actionResult, setActionResult] = useState<ForgeExactActionResult | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const contentSignature = useContentStore((state) => [
    state.isLoaded ? 'loaded' : 'unloaded',
    state.citiesSorted.length,
    state.raw?.forge_blueprints?.length ?? 0,
    Object.keys(state.maps.itemsById).length,
  ].join('|'));
  const citySignature = useCityStore((state) => `${state.currentCityId}|${state.unlockedCityIds.join(',')}`);
  const inventorySignature = useInventoryStore((state) => JSON.stringify({ currencies: state.currencies, items: state.items }));
  const professionSignature = useProfessionStore((state) => state.forgeQueue.map((job) => `${job.id}:${job.blueprintId}:${job.mode}:${job.status}:${job.endsAt}`).join('|'));
  const equipmentSignature = useEquipmentStore((state) => JSON.stringify({
    weapon: state.equippedWeaponId,
    accessory: state.equippedAccessoryId,
    refine: state.refineLevelBySlot,
    temper: state.temperBonusesBySlot,
    tools: state.forgeToolTiers,
  }));
  const activitySignature = useActivityStore((state) => state.active ? `${state.active.type}:${state.active.sourceId ?? ''}` : 'idle');
  const activeSession = useCraftSessionStore((state) => state.activeSession);
  const craftSessionSignature = useCraftSessionStore((state) => state.activeSession
    ? `${state.activeSession.station}:${state.activeSession.sourceId}:${state.activeSession.sessionId}:${state.activeSession.cursor.stepIndex}`
    : 'none');
  const storeInvalidationKey = useMemo(() => [
    contentSignature,
    citySignature,
    inventorySignature,
    professionSignature,
    equipmentSignature,
    activitySignature,
    craftSessionSignature,
  ].join('||'), [
    contentSignature,
    citySignature,
    inventorySignature,
    professionSignature,
    equipmentSignature,
    activitySignature,
    craftSessionSignature,
  ]);

  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(handle);
  }, []);

  const surface = useMemo(
    () => {
      void storeInvalidationKey;
      return buildForgeExactSurfaceFromStores(cityId, {
        mode: forceFixture ? 'fixture' : 'live',
        activeTab,
        activeMode,
        selectedBlueprintId,
        selectedTargetSlot,
        actionResult: actionResult ? { title: actionResult.title, lines: actionResult.lines } : null,
        now,
      });
    },
    [
      cityId,
      forceFixture,
      activeTab,
      activeMode,
      selectedBlueprintId,
      selectedTargetSlot,
      actionResult,
      now,
      storeInvalidationKey,
    ],
  );

  useEffect(() => {
    if (surface.meta.selectedBlueprintId && surface.meta.selectedBlueprintId !== selectedBlueprintId) {
      setSelectedBlueprintId(surface.meta.selectedBlueprintId);
    }
  }, [selectedBlueprintId, surface.meta.selectedBlueprintId]);

  useEffect(() => {
    if (surface.meta.activeMode !== activeMode) {
      setActiveMode(surface.meta.activeMode);
    }
  }, [activeMode, surface.meta.activeMode]);

  useEffect(() => {
    if (surface.meta.selectedTargetSlot && surface.meta.selectedTargetSlot !== selectedTargetSlot) {
      setSelectedTargetSlot(surface.meta.selectedTargetSlot);
    }
  }, [selectedTargetSlot, surface.meta.selectedTargetSlot]);

  const actions = useForgeExactActionController({
    surface,
    onSelectTab: setActiveTab,
    onSelectMode: setActiveMode,
    onSelectSlot: setSelectedTargetSlot,
    onResult: setActionResult,
  });

  const activeForgeSession = activeSession?.station === 'forge' ? activeSession : null;
  const activeBlueprint = activeForgeSession?.sourceId ? getForgeBlueprint(activeForgeSession.sourceId) : undefined;
  const activeSessionNode = activeForgeSession ? (
    <ForgeHandsOnSession
      session={activeForgeSession}
      now={now}
      blueprintName={activeBlueprint?.name ?? activeBlueprint?.id}
      bonus={activeBlueprint?.handsOnBonus}
    />
  ) : null;

  return (
    <div
      ref={ownerRef}
      className="forgeExactScreenOwner"
      data-testid="forge-exact-screen-owner"
      data-mode={surface.meta.mode}
      data-city-id={surface.meta.cityId ?? ''}
    >
      <ForgeExactScreen
        surface={surface}
        scale={scale}
        activeSessionNode={activeSessionNode}
        onAction={actions.onAction}
      />
    </div>
  );
}
