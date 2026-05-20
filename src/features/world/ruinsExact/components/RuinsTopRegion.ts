import React from 'react';
import { Settings, ChevronDown } from 'lucide-react';
import type { RuinsExactSurfaceV1 } from '../types.js';
import { RUINS_EXACT_ASSETS } from '../ruinsExactAssetRegistry.js';
import { LocalMandateLensHeader } from '../../../../ui/daoMandate/index.js';
import type {
  DaoLocalLensSurface,
  DaoMandateEffectiveMotionMode,
  DaoMandateGuidanceProfile,
} from '../../../../systems/ui/daoMandate/index.js';

export interface RuinsMandateLensView {
  lens: DaoLocalLensSurface | null;
  profile: DaoMandateGuidanceProfile;
  motionMode: DaoMandateEffectiveMotionMode;
  variant: 'compact' | 'default' | 'full';
}

export interface RuinsTopRegionProps {
  surface: RuinsExactSurfaceV1;
  mandateLens?: RuinsMandateLensView | null;
  onOpenSettings?: () => void;
  onOpenTacticalCell?: (cellId: RuinsExactSurfaceV1['tacticalStrip']['cells'][number]['id']) => void;
  onOpenAreaSelector?: () => void;
}

export function RuinsTopRegion({ surface, mandateLens, onOpenSettings, onOpenTacticalCell, onOpenAreaSelector }: RuinsTopRegionProps) {
  const displayLens = mandateLens?.lens ? { ...mandateLens.lens, route: null } : null;
  const tacticalCells = surface.tacticalStrip.cells.map((cell) => React.createElement(
    'button',
    { key: cell.id, type: 'button', className: 'ruinsTopRegion__tacticalCell', 'data-testid': `ruins-tactical-cell-${cell.id}`, onClick: onOpenTacticalCell ? () => onOpenTacticalCell(cell.id) : undefined, disabled: !onOpenTacticalCell, 'aria-label': `${cell.label}: ${cell.primaryText}` },
    React.createElement('span', { className: 'ruinsTopRegion__tacticalIconDock' }, React.createElement('img', { src: RUINS_EXACT_ASSETS.icons.tactical[cell.id], alt: '', className: 'ruinsTopRegion__tacticalIcon' })),
    React.createElement('span', { className: 'ruinsTopRegion__tacticalText' }, React.createElement('span', { className: 'ruinsTopRegion__tacticalLabel' }, cell.label), React.createElement('span', { className: 'ruinsTopRegion__tacticalPrimary' }, cell.primaryText), cell.showUnderlineBar ? React.createElement('span', { className: 'ruinsTopRegion__tacticalUnderlineTrack' }, React.createElement('span', { className: 'ruinsTopRegion__tacticalUnderlineFill', style: { width: `${cell.underlineBarPct ?? 0}%` } })) : null),
    React.createElement('span', { className: 'ruinsTopRegion__tacticalAdornment' }, cell.showCaret ? React.createElement(ChevronDown, { size: 14 }) : null),
    React.createElement('span', { className: 'ruinsTopRegion__tacticalDotDock' }, cell.showNotificationDot ? React.createElement('span', { className: 'ruinsTopRegion__tacticalDot' }) : null),
  ));

  const macroNodes = surface.topRibbon.nodes.map((node) => React.createElement('li', { key: node.id, className: `ruinsTopRegion__macroNode ruinsTopRegion__macroNode--${node.variant}`, 'data-state': node.state }));
  const roleChips = surface.areaHeader.chips.map((chip) => React.createElement('span', { key: chip.id, className: 'ruinsTopRegion__roleChip' }, React.createElement('span', { className: 'ruinsTopRegion__roleChipDot', 'aria-hidden': 'true' }), chip.label));

  return React.createElement(
    'header',
    { className: 'ruinsTopRegion', 'data-testid': 'ruins-exact-top-region' },
    React.createElement('section', { className: 'ruinsTopRegion__topBand' },
      React.createElement('div', { className: 'ruinsTopRegion__titleAnchor', 'data-testid': 'ruins-page-title' }, React.createElement('h1', null, surface.page.title), React.createElement('span', { className: 'ruinsTopRegion__titleSeal', 'aria-hidden': 'true' })),
      React.createElement('section', { className: 'ruinsTopRegion__macroRibbon', 'data-testid': 'ruins-macro-ribbon', 'aria-label': surface.topRibbon.ariaLabel }, React.createElement('span', { className: 'ruinsTopRegion__macroFlourish ruinsTopRegion__macroFlourish--left', style: { backgroundImage: `url(${RUINS_EXACT_ASSETS.chrome.barShort})` }, 'aria-hidden': 'true' }), React.createElement('span', { className: 'ruinsTopRegion__macroTrack', style: { backgroundImage: `url(${RUINS_EXACT_ASSETS.chrome.barLong})` }, 'aria-hidden': 'true' }), React.createElement('ol', { className: 'ruinsTopRegion__macroNodes', 'aria-hidden': 'true' }, ...macroNodes), React.createElement('span', { className: 'ruinsTopRegion__macroFlourish ruinsTopRegion__macroFlourish--right', style: { backgroundImage: `url(${RUINS_EXACT_ASSETS.chrome.barShort})` }, 'aria-hidden': 'true' })),
      React.createElement('button', { type: 'button', className: 'ruinsTopRegion__settingsButton', 'data-testid': 'ruins-settings-gear', 'aria-label': 'Open settings', onClick: () => onOpenSettings?.() }, React.createElement('span', { className: 'ruinsTopRegion__settingsButtonInner' }, React.createElement(Settings, { size: 14, strokeWidth: 1.8 }))),
    ),
    React.createElement('section', { className: 'ruinsTopRegion__tacticalStrip', 'data-testid': 'ruins-tactical-strip', 'aria-label': surface.tacticalStrip.ariaLabel }, ...tacticalCells),
    React.createElement('section', { className: 'ruinsTopRegion__plaqueCluster', 'data-testid': 'ruins-exact-plaque-cluster' }, React.createElement(surface.areaHeader.hasGroundedSelector ? 'button' : 'div', { className: 'ruinsTopRegion__areaPlaque', 'data-testid': 'ruins-area-plaque', onClick: surface.areaHeader.hasGroundedSelector ? onOpenAreaSelector : undefined }, React.createElement('span', { className: 'ruinsTopRegion__plaqueLabel' }, surface.areaHeader.plaqueLabel), surface.areaHeader.showDropdownCaret ? React.createElement('span', { className: 'ruinsTopRegion__plaqueCaret', 'aria-hidden': 'true' }, React.createElement(ChevronDown, { size: 16 })) : null), React.createElement('p', { className: 'ruinsTopRegion__subtitle', 'data-testid': 'ruins-page-subtitle' }, surface.areaHeader.subtitle), React.createElement('div', { className: 'ruinsTopRegion__roleChips', 'data-testid': 'ruins-role-chips' }, ...roleChips)),
    React.createElement(
      'section',
      { className: 'ruinsTopRegion__mandateSlot', 'aria-hidden': displayLens ? undefined : 'true' },
      displayLens ? React.createElement(LocalMandateLensHeader, {
        lens: displayLens,
        profile: mandateLens?.profile ?? 'elder',
        variant: mandateLens?.variant ?? 'compact',
        motionMode: mandateLens?.motionMode ?? 'low',
        className: 'ruinsMandateLens',
      }) : null,
    ),
  );
}
