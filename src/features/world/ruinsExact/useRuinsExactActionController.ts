import { useMemo } from 'react';
import { useRuinsStore } from '../../../stores/ruinsStore.js';
import { useUIStore } from '../../../stores/uiStore.js';
import type { RuinsExactSurfaceV1 } from './types.js';

export function useRuinsExactActionController({ cityId, ruinId, surface }: { cityId: string; ruinId?: string | null; surface: RuinsExactSurfaceV1 }) {
  const startRun = useRuinsStore((s) => s.startRun);
  const setAutoRepeat = useRuinsStore((s) => s.setAutoRepeat);
  const autoRepeatDefault = useRuinsStore((s) => s.autoRepeatDefault);
  const activeRun = useRuinsStore((s) => s.activeRun);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const closeModal = useUIStore((s) => s.closeWorldBuildingModal);
  const openModal = useUIStore((s) => s.openWorldBuildingModal);

  return useMemo(() => ({
    onPrimaryAction: () => {
      if (!surface.primaryAction.enabled) return;
      if (surface.primaryAction.intent !== 'enter-ruins') return;
      if (!ruinId) return;
      if (activeRun?.ruinId === ruinId) return;
      startRun(ruinId);
    },
    onToggleAutoRepeat: () => setAutoRepeat(!autoRepeatDefault),
    onOpenMedicinePouch: () => openModal({ cityId, buildingKey: 'apothecary', intent: { apothecarySurface: 'pouch' } }),
    onOpenLoadout: () => { setActiveTab('techniques'); closeModal(); },
    onOpenAiProfile: () => { setActiveTab('techniques'); closeModal(); },
    onOpenEquipmentSlot: () => { setActiveTab('inventory'); closeModal(); },
    onOpenTacticalCell: (cellId: RuinsExactSurfaceV1['tacticalStrip']['cells'][number]['id']) => {
      if (cellId === 'loadout' || cellId === 'aiProfile') { setActiveTab('techniques'); closeModal(); return; }
      if (cellId === 'healing') { openModal({ cityId, buildingKey: 'apothecary', intent: { apothecarySurface: 'pouch' } }); return; }
      if (cellId === 'bounty') { setActiveTab('bounties'); closeModal(); return; }
      if (cellId === 'expedition') { setActiveTab('expeditions'); closeModal(); }
    },
    onOpenSettings: undefined,
    onOpenAreaSelector: undefined,
  }), [surface.primaryAction.enabled, surface.primaryAction.intent, ruinId, activeRun?.ruinId, startRun, setAutoRepeat, autoRepeatDefault, cityId, openModal, setActiveTab, closeModal]);
}
