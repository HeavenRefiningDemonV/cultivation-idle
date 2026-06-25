import { useMemo } from 'react';
import { useManualPavilionStore } from '../../../stores/manualPavilionStore.js';
import { useUIStore } from '../../../stores/uiStore.js';
import type { FortuneDrawActions } from '../../../ui/world/fortune/FortuneDrawScreen.js';

/**
 * M.IV.3 ARTS-PORT — the Fortune Draw action controller: routes the screen's opaque intents to the live
 * stores. Mirrors usePanoplyActionController. DRAW / Buy & Study / Buy to Satchel → manualPavilionStore.buyManual;
 * Reroll → rerollStock (paid, never-regress); Open Inner Altar → close the world modal + the Techniques tab.
 * The screen NEVER touches a store — it only emits `route` strings.
 */
export function useFortuneDrawActionController(input: {
  pavilionId: string;
  selectedStockId: number | null;
  setSelectedStockId: (id: number | null) => void;
}): FortuneDrawActions {
  const { pavilionId, selectedStockId, setSelectedStockId } = input;

  return useMemo<FortuneDrawActions>(() => {
    const buy = (stockId: number, mode: 'buy' | 'buyAndStudy') => {
      const pav = useManualPavilionStore.getState();
      const ui = useUIStore.getState();
      const result = pav.buyManual({ pavilionId, stockId, mode });
      if (result.ok) {
        ui.addNotification('success', `Fate yields: ${result.manualName} acquired.`);
      } else {
        const why: Record<string, string> = {
          insufficient_funds: 'Not enough to claim this scroll.',
          already_sold: 'That scroll has already been drawn.',
          sealed: 'That scroll is sealed.',
          not_sold_here: 'That scroll is not offered here.',
        };
        ui.addNotification('warning', why[result.reason] ?? 'The draw could not be completed.');
      }
    };

    return {
      onSelect: (stockId: number) => setSelectedStockId(stockId),
      onAction: (route: string) => {
        if (route === 'fortune.draw') {
          // DRAW acquires the focused scroll; with none focused, the day's featured apex.
          let target = selectedStockId;
          if (target === null) {
            const stock = useManualPavilionStore.getState().getStock(pavilionId);
            const featured = stock?.slots.find((s) => s.shelf === 'featured' && !s.sold) ?? stock?.slots.find((s) => !s.sold);
            target = featured ? featured.slotIndex : null;
          }
          if (target !== null) buy(target, 'buyAndStudy');
          return;
        }
        if (route === 'fortune.reroll') {
          const result = useManualPavilionStore.getState().rerollStock(pavilionId);
          const ui = useUIStore.getState();
          if (result.ok) ui.addNotification('success', 'The offers are renewed — the fate-thread carries over.');
          else if (result.reason === 'reroll_not_configured') ui.addNotification('info', 'The reroll cost is not yet set (held → D15).');
          else if (result.reason === 'insufficient_funds') ui.addNotification('warning', 'Not enough to reroll.');
          else if (result.reason === 'not_ready') ui.addNotification('info', 'The free draw has not yet renewed.');
          return;
        }
        if (route.startsWith('fortune.buyAndStudy:')) { buy(Number(route.split(':')[1]), 'buyAndStudy'); return; }
        if (route.startsWith('fortune.buy:')) { buy(Number(route.split(':')[1]), 'buy'); return; }
        if (route === 'fortune.altar') {
          const ui = useUIStore.getState();
          ui.closeWorldBuildingModal();
          ui.setActiveTab('techniques');
          return;
        }
      },
    };
  }, [pavilionId, selectedStockId, setSelectedStockId]);
}
