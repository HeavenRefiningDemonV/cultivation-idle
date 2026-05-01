import React from 'react';
import type { RuinsExactSurfaceV1 } from './types.js';
import { RUINS_EXACT_REGION_ORDER } from './ruinsExactPresentation.js';
import { RuinsTopRegion } from './components/RuinsTopRegion.js';
import { RuinsKitCard } from './components/RuinsKitCard.js';
import { RuinsScenicStage } from './components/RuinsScenicStage.js';
import { RuinsTargetedMaterialsCard } from './components/RuinsTargetedMaterialsCard.js';
import { RuinsRoomRouteStrip } from './components/RuinsRoomRouteStrip.js';
import { RuinsPrimaryCta } from './components/RuinsPrimaryCta.js';
import { RuinsExplorationSummaryCard } from './components/RuinsExplorationSummaryCard.js';

export function RuinsExactMockupScreen(props: { surface: RuinsExactSurfaceV1; onPrimaryAction?: () => void; onToggleAutoRepeat?: () => void; onOpenSettings?: () => void; onOpenTacticalCell?: (cellId: RuinsExactSurfaceV1['tacticalStrip']['cells'][number]['id']) => void; onOpenAreaSelector?: () => void; onOpenMedicinePouch?: () => void; onOpenLoadout?: () => void; onOpenAiProfile?: () => void; onOpenEquipmentSlot?: (slotId: RuinsExactSurfaceV1['kitCard']['equipmentGrid'][number]['slotId']) => void }) {
  const { surface, onPrimaryAction, onOpenSettings, onOpenTacticalCell, onOpenAreaSelector, onOpenMedicinePouch, onOpenLoadout, onOpenAiProfile, onOpenEquipmentSlot } = props;
  return React.createElement('article', { className: 'ruinsExactPage', 'data-testid': 'ruins-exact-page', 'data-activity-mode': surface.meta.activityMode },
    React.createElement('div', { className: 'ruinsExactPage__underlay', 'aria-hidden': 'true' }),
    React.createElement(RuinsTopRegion, { surface, onOpenSettings, onOpenTacticalCell, onOpenAreaSelector }),
    React.createElement('section', { className: 'ruinsExactPage__bodyCluster', 'data-testid': 'ruins-exact-body-grid' },
      React.createElement('aside', { className: 'ruinsExactPage__leftRail', 'data-testid': 'ruins-exact-left-rail' }, React.createElement(RuinsKitCard, { kit: surface.kitCard, onOpenMedicinePouch, onOpenLoadout, onOpenAiProfile, onOpenEquipmentSlot })),
      React.createElement('main', { className: 'ruinsExactPage__centerScenic', 'data-testid': 'ruins-exact-center-scenic-slot' }, React.createElement(RuinsScenicStage, { scenic: surface.scenicStage })),
      React.createElement('aside', { className: 'ruinsExactPage__rightRail', 'data-testid': 'ruins-exact-right-rail' }, React.createElement(RuinsTargetedMaterialsCard, { card: surface.targetedMaterialsCard, onToggleAutoRepeat: props.onToggleAutoRepeat })),
      React.createElement('section', { className: 'ruinsExactPage__routeSlot', 'data-testid': 'ruins-exact-route-slot' }, React.createElement(RuinsRoomRouteStrip, { route: surface.roomRoute })),
      React.createElement('section', { className: 'ruinsExactPage__ctaSlot', 'data-testid': 'ruins-exact-cta-slot' }, React.createElement(RuinsPrimaryCta, { action: surface.primaryAction, onPrimaryAction })),
      React.createElement('aside', { className: 'ruinsExactPage__summaryDock', 'data-testid': 'ruins-exact-summary-dock' }, React.createElement(RuinsExplorationSummaryCard, { summary: surface.explorationSummary })),
    ),
    React.createElement('aside', { 'data-testid': 'ruins-exact-shell-flags', hidden: true }, JSON.stringify(surface.shell)),
    React.createElement('aside', { 'data-testid': 'ruins-exact-region-order', hidden: true }, RUINS_EXACT_REGION_ORDER.join('|')),
  );
}
