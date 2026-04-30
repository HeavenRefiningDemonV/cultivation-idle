import React from 'react';
import type { RuinsExactSurfaceV1 } from './types.js';
import { RUINS_EXACT_REGION_ORDER } from './ruinsExactPresentation.js';
import { RuinsTopRegion } from './components/RuinsTopRegion.js';

export function RuinsExactMockupScreen(props: { surface: RuinsExactSurfaceV1; onPrimaryAction?: () => void; onToggleAutoRepeat?: () => void; onOpenSettings?: () => void; onOpenTacticalCell?: (cellId: RuinsExactSurfaceV1['tacticalStrip']['cells'][number]['id']) => void; onOpenAreaSelector?: () => void }) {
  const { surface, onPrimaryAction, onOpenSettings, onOpenTacticalCell, onOpenAreaSelector } = props;
  return React.createElement('article', { className: 'ruinsExactPage', 'data-testid': 'ruins-exact-page', 'data-activity-mode': surface.meta.activityMode },
    React.createElement('div', { className: 'ruinsExactPage__underlay', 'aria-hidden': 'true' }),
    React.createElement(RuinsTopRegion, { surface, onOpenSettings, onOpenTacticalCell, onOpenAreaSelector }),
    React.createElement('section', { className: 'ruinsExactPage__bodyCluster', 'data-testid': 'ruins-exact-body-grid' },
      React.createElement('aside', { 'data-testid': 'ruins-exact-left-rail' }, React.createElement('h2', null, surface.kitCard.title), React.createElement('div', null, surface.kitCard.stampLabel), React.createElement('div', null, surface.kitCard.setupRows.map((r) => React.createElement('p', { key: r.label }, `${r.label} ${r.value}`))), React.createElement('div', null, surface.kitCard.survivalRows.map((r) => React.createElement('p', { key: r.label }, `${r.label} ${r.value}`))), React.createElement('p', null, surface.kitCard.medicinePouch.value), React.createElement('div', null, surface.kitCard.equipmentSlots.map((s) => React.createElement('span', { key: s.id }, s.label)))),
      React.createElement('main', { 'data-testid': 'ruins-exact-center-scenic-slot' }, React.createElement('p', null, surface.scenicStage.environmentDescriptor)),
      React.createElement('aside', { 'data-testid': 'ruins-exact-right-rail' }, React.createElement('h2', null, surface.targetedMaterialsCard.title), React.createElement('p', null, surface.targetedMaterialsCard.leadMaterials.map((m) => m.label).join(' · ')), React.createElement('p', null, surface.targetedMaterialsCard.guaranteedAnchor.label), React.createElement('p', null, surface.targetedMaterialsCard.guaranteedAnchor.sourceLabel), React.createElement('p', null, surface.targetedMaterialsCard.rarePity), React.createElement('p', null, surface.targetedMaterialsCard.autoRepeat.value), React.createElement('p', null, surface.targetedMaterialsCard.autoRepeat.helperText), React.createElement('p', null, surface.targetedMaterialsCard.footer)),
      React.createElement('section', { 'data-testid': 'ruins-exact-route-slot' }, React.createElement('h3', null, surface.roomRoute.title), React.createElement('p', null, surface.roomRoute.chip), surface.roomRoute.nodes.map((n) => React.createElement('p', { key: n.id }, `${n.label} ${n.sublabel} ${n.state}`))),
      React.createElement('section', { 'data-testid': 'ruins-exact-cta-slot' }, React.createElement('button', { type: 'button', disabled: !surface.primaryAction.enabled, onClick: onPrimaryAction }, surface.primaryAction.label)),
      React.createElement('aside', { 'data-testid': 'ruins-exact-summary-dock' }, React.createElement('h3', null, surface.explorationSummary.title), surface.explorationSummary.rows.map((r) => React.createElement('p', { key: r.label }, `${r.label} — ${r.value}`))),
    ),
    React.createElement('aside', { 'data-testid': 'ruins-exact-shell-flags', hidden: true }, JSON.stringify(surface.shell)),
    React.createElement('aside', { 'data-testid': 'ruins-exact-region-order', hidden: true }, RUINS_EXACT_REGION_ORDER.join('|')),
  );
}
