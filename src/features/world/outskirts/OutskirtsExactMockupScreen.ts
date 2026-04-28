import React from 'react';
import { OUTSKIRTS_MOCKUP_REGION_ORDER } from './outskirtsMockupPresentation.js';
import type { OutskirtsExactSurfaceV2 } from './types.js';
import { OutskirtsTopRegion } from './components/OutskirtsTopRegion.js';
import { OutskirtsCenterStage } from './components/OutskirtsCenterStage.js';
import { OutskirtsEncounterIdentityRow } from './components/OutskirtsEncounterIdentityRow.js';
import { OutskirtsSetupCard } from './components/OutskirtsSetupCard.js';
import { OutskirtsEncounterProgressStrip } from './components/OutskirtsEncounterProgressStrip.js';
import { OutskirtsStartHuntCta } from './components/OutskirtsStartHuntCta.js';
import { OutskirtsGrindSummaryCard } from './components/OutskirtsGrindSummaryCard.js';
import { OutskirtsRewardsCard } from './components/OutskirtsRewardsCard.js';

export interface OutskirtsExactMockupScreenProps {
  surface: OutskirtsExactSurfaceV2;
  onPrimaryAction?: () => void;
  onStartHunt?: () => void;
  onOpenSettings?: () => void;
  onPreviewPreviousEncounter?: () => void;
  onPreviewNextEncounter?: () => void;
  onSelectEncounterPreview?: (encounterId: string) => void;
  onToggleAutoRepeat?: () => void;
  onOpenMedicinePouch?: () => void;
  onOpenLoadout?: () => void;
  onOpenAiProfile?: () => void;
  onOpenAttackFocus?: () => void;
  onOpenEquipmentSlot?: (slotId: OutskirtsExactSurfaceV2['setupCard']['equipmentGrid'][number]['slotId']) => void;
  onOpenTrackedBounties?: () => void;
  onOpenTacticalCell?: (cellId: OutskirtsExactSurfaceV2['tacticalStrip']['cells'][number]['id']) => void;
  onOpenAreaSelector?: () => void;
}

export function OutskirtsExactMockupScreen({
  surface,
  onPrimaryAction,
  onStartHunt,
  onOpenSettings,
  onPreviewPreviousEncounter,
  onPreviewNextEncounter,
  onSelectEncounterPreview,
  onToggleAutoRepeat,
  onOpenMedicinePouch,
  onOpenLoadout,
  onOpenAiProfile,
  onOpenAttackFocus,
  onOpenEquipmentSlot,
  onOpenTrackedBounties,
  onOpenTacticalCell,
  onOpenAreaSelector,
}: OutskirtsExactMockupScreenProps) {
  return React.createElement(
    'article',
    {
      className: 'outskirtsExactPage',
      'data-testid': 'outskirts-exact-page',
      'data-legacy-testid': 'outskirts-exact-mockup-screen',
      'data-activity-mode': surface.meta.activityMode,
    },
    React.createElement('div', { className: 'outskirtsExactPage__underlay', 'aria-hidden': 'true' }),
    React.createElement(OutskirtsTopRegion, { surface, onOpenSettings, onOpenTacticalCell, onOpenAreaSelector }),
    React.createElement(
      'section',
      { className: 'outskirtsExactPage__bodyCluster', 'data-testid': 'outskirts-exact-body-grid' },
      React.createElement(
        'aside',
        { className: 'outskirtsExactPage__leftRail', 'data-testid': 'outskirts-exact-left-rail', 'data-legacy-testid': 'outskirts-exact-left-rail-slot' },
        React.createElement(OutskirtsSetupCard, { setup: surface.setupCard, onOpenMedicinePouch, onOpenLoadout, onOpenAiProfile, onOpenAttackFocus, onOpenEquipmentSlot }),
      ),
      React.createElement(
        'main',
        { className: 'outskirtsExactPage__centerScenic', 'data-testid': 'outskirts-exact-center-scenic-slot', 'data-legacy-testid': 'outskirts-exact-center-slot' },
        React.createElement(OutskirtsCenterStage, { scenic: surface.scenicStage, identity: surface.encounterIdentity, combatStage: surface.combatStage, showCombatHpBars: surface.shell.showCombatHpBars, showCombatActors: surface.shell.showCombatActors, showFloatingDamage: surface.shell.showFloatingDamage, showCombatLog: surface.shell.showCombatLog, showCombatChips: surface.shell.showCombatChips }),
      ),
      React.createElement(
        'section',
        { className: 'outskirtsExactPage__centerIdentity', 'data-testid': 'outskirts-exact-identity-slot' },
        React.createElement(OutskirtsEncounterIdentityRow, { identity: surface.encounterIdentity }),
      ),
      React.createElement(
        'section',
        { className: 'outskirtsExactPage__centerStrip', 'data-testid': 'outskirts-exact-strip-slot' },
        React.createElement(OutskirtsEncounterProgressStrip, {
          strip: surface.encounterStrip,
          onPreviewPrevious: onPreviewPreviousEncounter,
          onPreviewNext: onPreviewNextEncounter,
          onSelectEncounter: onSelectEncounterPreview,
        }),
      ),
      React.createElement(
        'section',
        { className: 'outskirtsExactPage__centerCta', 'data-testid': 'outskirts-exact-cta-slot' },
        React.createElement(OutskirtsStartHuntCta, { cta: surface.primaryAction, onPrimaryAction: onPrimaryAction ?? onStartHunt }),
      ),
      React.createElement(
        'aside',
        { className: 'outskirtsExactPage__rightRail', 'data-testid': 'outskirts-exact-right-rail', 'data-legacy-testid': 'outskirts-exact-right-rail-slot' },
        React.createElement(OutskirtsRewardsCard, { rewards: surface.rewardsCard, onToggleAutoRepeat, onOpenTrackedBounties, onOpenTechniques: onOpenLoadout }),
      ),
      React.createElement(
        'aside',
        { className: 'outskirtsExactPage__summaryDock', 'data-testid': 'outskirts-exact-summary-dock', 'data-legacy-testid': 'outskirts-exact-summary-dock-slot' },
        React.createElement(OutskirtsGrindSummaryCard, { summary: surface.grindSummary }),
      ),
    ),
    React.createElement('aside', { 'data-testid': 'outskirts-exact-quality-state', hidden: true }, 'layout-static'),
    React.createElement('aside', { 'data-testid': 'outskirts-exact-shell-flags', hidden: true }, JSON.stringify(surface.shell)),
    React.createElement('aside', { 'data-testid': 'outskirts-exact-region-order', hidden: true }, OUTSKIRTS_MOCKUP_REGION_ORDER.join('|')),
  );
}
