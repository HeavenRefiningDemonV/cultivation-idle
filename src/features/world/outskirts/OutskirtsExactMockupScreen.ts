import React from 'react';
import type { OutskirtsMockupSurface } from './types.js';

export interface OutskirtsExactMockupScreenProps {
  surface: OutskirtsMockupSurface;
}

const e = React.createElement;

/**
 * Planning-state scaffold for the future exact Outskirts screen.
 * P1 contract-only: not mounted as the live Outskirts runtime surface.
 */
export function OutskirtsExactMockupScreen({ surface }: OutskirtsExactMockupScreenProps) {
  return e(
    'article',
    { 'data-testid': 'outskirts-exact-mockup-screen', 'data-planning-only': surface.page.planningStateOnly ? '1' : '0' },
    e('header', { 'data-testid': 'region-a-page-title' }, e('h2', null, surface.page.title), e('p', null, surface.page.screenStateLabel)),
    e(
      'section',
      { 'data-testid': 'region-b-macro-track', 'aria-label': 'Macro progression track' },
      e(
        'ol',
        null,
        ...surface.macroTrack.nodes.map((node) => e('li', { key: node.id, 'data-node-state': node.state, 'data-current': node.id === surface.macroTrack.currentNodeId ? '1' : '0' }, node.label)),
      ),
    ),
    e(
      'section',
      { 'data-testid': 'region-c-tactical-strip', 'aria-label': 'Tactical summary strip' },
      e('ul', null, ...surface.tacticalStrip.cells.map((cell) => e('li', { key: cell.id, 'data-cell-id': cell.id, 'data-severity': cell.severity ?? 'none' }, e('strong', null, cell.label), e('span', null, cell.value.text), cell.sublabel ? e('small', null, cell.sublabel.text) : null))),
    ),
    e('section', { 'data-testid': 'region-d-selector-plaque', 'aria-label': 'Area selector plaque' }, e('h3', null, surface.selectorPlaque.selectorLabel), e('p', null, surface.selectorPlaque.subtitle), e('small', null, surface.selectorPlaque.zoneLabel)),
    e('section', { 'data-testid': 'region-e-scenic-field', 'aria-label': 'Scenic encounter field' }, e('p', null, `Scenic plate: ${surface.scenicField.scenicPlateAssetKey}`), e('p', null, `Encounter asset: ${surface.scenicField.encounterAssetKey}`)),
    e('section', { 'data-testid': 'region-f-encounter-identity', 'aria-label': 'Encounter identity' }, e('strong', null, surface.encounterIdentity.displayName), e('span', null, surface.encounterIdentity.displayLevel), e('span', { 'data-chip-severity': surface.encounterIdentity.chipSeverity }, surface.encounterIdentity.chipLabel)),
    e('section', { 'data-testid': 'region-g-setup-card', 'aria-label': 'Setup card' },
      e('h4', null, 'Setup'),
      e('p', null, `Loadout Set: ${surface.setupCard.loadoutSet.text}`),
      e('p', null, `AI Profile: ${surface.setupCard.aiProfile.text}`),
      e('p', null, `Attack Focus: ${surface.setupCard.attackFocus.text}`),
      e('p', null, `Offense: ATK ${surface.setupCard.offense.atk.value.text} / ACC ${surface.setupCard.offense.acc.value.text} / CRIT ${surface.setupCard.offense.crit.value.text}`),
      e('p', null, `Defense: HP ${surface.setupCard.defense.hp.value.text} / EVA ${surface.setupCard.defense.eva.value.text} / RES ${surface.setupCard.defense.res.value.text}`),
      e('p', null, `Medicine Pouch: ${surface.setupCard.medicinePouch.text}`),
      e('p', null, `Equipment: ${surface.setupCard.equipmentGrid.weapon.equippedItem.text} | ${surface.setupCard.equipmentGrid.accessory.equippedItem.text}`),
    ),
    e('section', { 'data-testid': 'region-h-rewards-card', 'aria-label': 'Rewards card' },
      e('h4', null, 'Rewards'),
      e('p', null, `Gold range: ${surface.rewardsCard.goldRange.text}`),
      e('p', null, `Common materials: ${surface.rewardsCard.commonMaterials.text}`),
      e('p', null, `Tracked bounty: ${surface.rewardsCard.trackedBountyProgress.text}`),
      e('p', null, `Estimated efficiency: ${surface.rewardsCard.estimatedEfficiency.text}`),
      e('p', null, `Auto-repeat: ${surface.rewardsCard.autoRepeatState.text}`),
    ),
    e('section', { 'data-testid': 'region-i-encounter-strip', 'aria-label': 'Encounter progression strip' },
      e('button', { type: 'button', disabled: !surface.encounterStrip.arrows.canMoveLeft }, '◀'),
      e('ol', null, ...surface.encounterStrip.nodes.map((node) => e('li', { key: node.id, 'data-state': node.state, 'data-selected': node.id === surface.encounterStrip.selectedNodeId ? '1' : '0' }, node.displayName, node.displayLevel ? e('small', null, ` ${node.displayLevel}`) : null))),
      e('button', { type: 'button', disabled: !surface.encounterStrip.arrows.canMoveRight }, '▶'),
    ),
    e('section', { 'data-testid': 'region-j-primary-cta', 'aria-label': 'Primary action' }, e('button', { type: 'button', disabled: !surface.primaryAction.enabled, title: surface.primaryAction.disabledReason ?? undefined }, surface.primaryAction.label)),
    e('section', { 'data-testid': 'region-k-grind-summary', 'aria-label': 'Grind summary' },
      e('h4', null, surface.grindSummary.label),
      e('p', null, `Runs: ${surface.grindSummary.runs.text}`),
      e('p', null, `Gold/hr: ${surface.grindSummary.goldPerHour.text}`),
      e('p', null, `Main drop: ${surface.grindSummary.mainDrop.text}`),
      e('p', null, `Area filter: ${surface.grindSummary.areaFilter.text}`),
    ),
  );
}
