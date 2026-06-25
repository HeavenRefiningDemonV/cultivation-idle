import { useEffect, useMemo, useState } from 'react';
import { useContentStore } from '../../../stores/contentStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { useManualPavilionStore } from '../../../stores/manualPavilionStore.js';
import { useManualSatchelStore } from '../../../stores/manualSatchelStore.js';
import { buildFortuneDrawSurfaceLive } from '../../../systems/ui/fortune/fortuneDrawLiveInput.js';
import { FORTUNE_DRAW_FIXTURE_SEEDS } from '../../../systems/ui/fortune/fortuneDrawFixtures.js';
import type { FortuneDrawVisualState } from '../../../systems/ui/fortune/fortuneDrawTypes.js';
import { FortuneDrawScreen } from '../../../ui/world/fortune/FortuneDrawScreen.js';
import { useFortuneDrawActionController } from './useFortuneDrawActionController.js';
import { resolveFortuneDrawFlag } from './fortuneDrawFlag.js';

/**
 * M.IV.3 ARTS-PORT — the owner: narrow store selectors → buildFortuneDrawSurfaceLive → the render-only screen
 * + the action controller. Mirrors PanoplyScreenOwner. The F2 inspector is DOCKED in the right rail (part of
 * the surface), so no modal is mounted here. Fixture mode (`forceFixture`) serves the Playwright state matrix.
 */
export function FortuneDrawScreenOwner({
  cityId,
  pavilionId,
  forceFixture = false,
  fixtureState = 'preDraw',
}: {
  cityId?: string;
  pavilionId?: string;
  forceFixture?: boolean;
  fixtureState?: string;
}) {
  // Resolve the pavilion for this city when not given explicitly.
  const resolvedPavilionId = useMemo(() => {
    if (pavilionId) return pavilionId;
    const pavs = useContentStore.getState().maps.pavilionsById;
    if (cityId) {
      const hit = Object.values(pavs).find((p) => p.cityId === cityId);
      if (hit) return hit.id;
    }
    return Object.keys(pavs)[0] ?? '';
  }, [pavilionId, cityId]);

  // Harness affordance: `?fortune=fixture&fortuneState=<state>` forces the deterministic fixture matrix.
  const flag = useMemo(
    () => resolveFortuneDrawFlag(typeof window !== 'undefined' ? window.location.search : ''),
    [],
  );
  const useFixture = forceFixture || flag.mode === 'fixture';
  const fxState = forceFixture ? fixtureState : flag.fixtureState ?? fixtureState;

  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);
  const actions = useFortuneDrawActionController({ pavilionId: resolvedPavilionId, selectedStockId, setSelectedStockId });

  // Narrow subscriptions that drive a rebuild when the live truth changes.
  const stockVersion = useManualPavilionStore((s) => s.stockVersion);
  const manuals = useManualSatchelStore((s) => s.manuals);
  const activeStudy = useManualSatchelStore((s) => s.activeStudy);
  const currencyVersion = useInventoryStore((s) => s.currencyVersion);

  // Ensure the day's stock exists (idle-safe; §F).
  useEffect(() => {
    if (!useFixture && resolvedPavilionId) {
      useManualPavilionStore.getState().ensureStock(resolvedPavilionId);
    }
  }, [useFixture, resolvedPavilionId]);

  const surface = useMemo(() => {
    if (useFixture) {
      return FORTUNE_DRAW_FIXTURE_SEEDS[(fxState as FortuneDrawVisualState)] ?? FORTUNE_DRAW_FIXTURE_SEEDS.preDraw;
    }
    return buildFortuneDrawSurfaceLive(resolvedPavilionId, { selectedStockId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useFixture, fxState, resolvedPavilionId, selectedStockId, stockVersion, manuals, activeStudy, currencyVersion]);

  return <FortuneDrawScreen surface={surface} actions={actions} />;
}
