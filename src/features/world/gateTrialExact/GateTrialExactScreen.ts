import React from 'react';
import type {
  GateTrialButtonSurface,
  GateTrialChecklistRowSurface,
  GateTrialExactStatus,
  GateTrialExactSurfaceV1,
  GateTrialFactRowSurface,
  GateTrialFixSurface,
  GateTrialReadinessNodeId,
  GateTrialReadinessNodeSurface,
  GateTrialTacticalCellId,
  GateTrialTacticalCellSurface,
} from './gateTrialExactTypes.js';
import { GATE_TRIAL_EXACT_REGION_ORDER } from './gateTrialExactPresentation.js';

export interface GateTrialExactScreenProps {
  surface: GateTrialExactSurfaceV1;
  onPrimaryAction?: () => void;
  onSafetyNetAction?: () => void;
  onTopFixAction?: (fix: GateTrialFixSurface) => void;
  onTacticalCellAction?: (cellId: GateTrialTacticalCellId) => void;
  onReadinessNodeAction?: (nodeId: GateTrialReadinessNodeId) => void;
}

function gateTrialToneClass(tone: string): string { return `gateTrialTone--${tone}`; }
function gateTrialStatusClass(status: GateTrialExactStatus): string { return `gateTrialStatusMedallion--${status === 'open' ? 'active' : status}`; }

const el = React.createElement;

function GateTrialStatusMedallion(props: { status: GateTrialExactStatus }) { return el('span', { className: `gateTrialStatusMedallion ${gateTrialStatusClass(props.status)}`, 'aria-hidden': 'true' }, el('span', { className: 'gateTrialStatusMedallion__mark' })); }

function GateTrialTacticalCell(props: { cell: GateTrialTacticalCellSurface; onPress?: (id: GateTrialTacticalCellId) => void }) {
  const { cell, onPress } = props;
  return el('button', { type: 'button', className: `gateTrialTacticalCell gateTrialTacticalCell--${cell.id} gateTrialTacticalCell--${cell.tone}`, 'data-testid': `gate-trial-tactical-cell-${cell.id}`, 'data-cell-id': cell.id, 'data-tone': cell.tone, 'data-visible': cell.visible ? 'true' : 'false', 'aria-label': `${cell.label}: ${cell.primaryText}`, onClick: () => onPress?.(cell.id) },
    el('span', { className: 'gateTrialTacticalCell__iconDock', 'data-icon-key': cell.iconKey, 'aria-hidden': 'true' }),
    el('span', { className: 'gateTrialTacticalCell__text' }, el('span', { className: 'gateTrialTacticalCell__label' }, cell.label), el('span', { className: 'gateTrialTacticalCell__primary' }, cell.primaryText)),
    cell.showUnderlineBar ? el('span', { className: 'gateTrialTacticalCell__underlineTrack' }, el('span', { className: 'gateTrialTacticalCell__underlineFill', style: { width: `${cell.underlineBarPct ?? 0}%` } })) : null,
  );
}

function GateTrialExactScreen(props: GateTrialExactScreenProps) {
  const { surface } = props;
  return el('article', { className: 'gateTrialExactPage', 'data-testid': surface.meta.rootTestId, 'data-surface-mode': surface.meta.mode, 'data-activity-mode': surface.meta.activityMode, 'data-lifecycle-state': surface.meta.lifecycleState, 'data-readiness-score': surface.meta.readinessScore },
    el('div', { className: 'gateTrialExactPage__underlay' }),
    el('header', { className: 'gateTrialTopRegion', 'data-testid': 'gate-trial-exact-top-region' },
      el('div', { className: 'gateTrialTopRegion__topBand' },
        el('div', { className: 'gateTrialTopRegion__titleAnchor' }, el('h1', { 'data-testid': 'gate-trial-page-title' }, surface.page.title), el('span', { className: 'gateTrialTopRegion__titleSeal', 'data-testid': 'gate-trial-title-seal' })),
        el('section', { className: 'gateTrialTopRegion__macroRibbon', 'data-testid': 'gate-trial-macro-ribbon', 'aria-label': surface.topRibbon.ariaLabel }, el('div', { className: 'gateTrialTopRegion__macroTrack' }, el('ol', { className: 'gateTrialTopRegion__macroNodes' }, surface.topRibbon.nodes.map((node) => el('li', { key: node.id, className: 'gateTrialTopRegion__macroNode', 'data-node-id': node.id, 'data-state': node.state, 'data-variant': node.variant, 'data-current': node.id === surface.topRibbon.activeNodeId ? 'true' : 'false' }))))),
        el('div', { className: 'gateTrialTopRegion__topStatus', 'data-testid': 'gate-trial-top-status' }, surface.page.topRightStatus.join(' · ')),
      ),
      el('div', { className: 'gateTrialTopRegion__tacticalStrip', 'data-testid': 'gate-trial-tactical-strip' }, surface.tacticalStrip.cells.map((cell) => el(GateTrialTacticalCell, { key: cell.id, cell, onPress: props.onTacticalCellAction }))),
    ),
    el('section', { className: 'gateTrialExactPage__gateHeaderSlot', 'data-testid': 'gate-trial-exact-gate-header-slot' },
      el('section', { className: 'gateTrialGateHeader', 'data-testid': 'gate-trial-header-plaque' }, el('h2', { 'data-testid': 'gate-trial-header-title' }, surface.gateHeader.title), el('p', { 'data-testid': 'gate-trial-header-subtitle' }, surface.gateHeader.subtitle), el('div', { className: 'gateTrialGateHeader__chipRow', 'data-testid': 'gate-trial-header-chip-row' }, surface.gateHeader.chips.map((chip) => el('span', { key: chip.id, className: `gateTrialGateHeader__chip ${gateTrialToneClass(chip.tone)}`, 'data-testid': 'gate-trial-header-chip' }, chip.label))))),
    el('aside', { className: 'gateTrialExactPage__leftRail', 'data-testid': 'gate-trial-exact-left-rail' },
      el('section', { className: 'gateTrialMinimumChecklist', 'data-testid': 'gate-trial-minimum-checklist' }, el('header', { className: 'gateTrialMinimumChecklist__head' }, el('h3', { 'data-testid': 'gate-trial-minimum-title' }, surface.minimumChecklist.title), el('span', { className: 'gateTrialMinimumChecklist__stamp', 'data-testid': 'gate-trial-minimum-stamp' }, surface.minimumChecklist.stamp.label)),
        el('ol', { className: 'gateTrialMinimumChecklist__rows' }, surface.minimumChecklist.rows.map((row: GateTrialChecklistRowSurface) => el('li', { key: row.id, className: 'gateTrialMinimumChecklist__row', 'data-testid': `gate-trial-minimum-row-${row.id}` }, el(GateTrialStatusMedallion, { status: row.status }), el('div', null, el('div', null, row.title), el('div', null, row.detail))))))),
    el('main', { className: 'gateTrialExactPage__scenicSlot', 'data-testid': 'gate-trial-exact-scenic-slot' },
      el('section', { className: 'gateTrialScenicStage', 'data-testid': 'gate-trial-scenic-stage', 'data-scene-asset-id': surface.scenicStage.sceneAssetId, 'data-art-status': surface.scenicStage.artStatus, 'data-final-art-required': surface.scenicStage.requiresFinalArtBinding ? 'true' : 'false', role: 'img', 'aria-label': surface.scenicStage.environmentDescriptor },
        el('div', { className: 'gateTrialScenicStage__frame', 'data-testid': 'gate-trial-scenic-frame' }, el('div', { className: 'gateTrialScenicStage__underpaint', 'data-testid': 'gate-trial-scenic-underpaint' }), el('div', { className: 'gateTrialScenicStage__mist' }), el('div', { className: 'gateTrialScenicStage__portal', 'data-testid': 'gate-trial-scenic-portal' }), el('div', { className: 'gateTrialScenicStage__stairs', 'data-testid': 'gate-trial-scenic-stairs' }), el('div', { className: 'gateTrialScenicStage__torch gateTrialScenicStage__torch--left', 'data-testid': 'gate-trial-scenic-torch-left' }), el('div', { className: 'gateTrialScenicStage__torch gateTrialScenicStage__torch--right', 'data-testid': 'gate-trial-scenic-torch-right' }), el('div', { className: 'gateTrialScenicStage__cultivatorShadow', 'data-testid': 'gate-trial-scenic-cultivator-shadow' }), el('div', { className: 'gateTrialScenicStage__edgeFade' })),
        el('section', { className: 'gateTrialReadinessSeal', 'data-testid': 'gate-trial-readiness-seal' }, el('div', { 'data-testid': 'gate-trial-readiness-verdict' }, surface.scenicStage.readinessSeal.verdict), el('div', { 'data-testid': 'gate-trial-readiness-score' }, surface.scenicStage.readinessSeal.scoreLabel)),
        el('section', { className: 'gateTrialGuardianPlaque', 'data-testid': 'gate-trial-guardian-plaque' }, el('div', { 'data-testid': 'gate-trial-guardian-title' }, surface.scenicStage.guardianPlaque.title), el('div', { 'data-testid': 'gate-trial-guardian-subtitle' }, surface.scenicStage.guardianPlaque.subtitle), surface.scenicStage.guardianPlaque.rewardLines.map((line) => el('div', { key: line, 'data-testid': 'gate-trial-reward-line' }, line))),
      )),
    el('aside', { className: 'gateTrialExactPage__rightRail', 'data-testid': 'gate-trial-exact-right-rail' },
      el('section', { className: 'gateTrialRecommendedPanel', 'data-testid': 'gate-trial-recommended-panel' }, el('h3', { 'data-testid': 'gate-trial-recommended-title' }, surface.recommendedPanel.title), el('h4', { 'data-testid': 'gate-trial-recommended-prep-title' }, surface.recommendedPanel.recommendedPrepTitle), el('div', { className: 'gateTrialRecommendedPanel__prepRows' }, surface.recommendedPanel.prepRows.map((row: GateTrialChecklistRowSurface) => el('div', { key: row.id, className: 'gateTrialRecommendedPanel__prepRow', 'data-testid': `gate-trial-prep-row-${row.id}` }, row.title))), el('h4', { 'data-testid': 'gate-trial-failsafe-title' }, surface.recommendedPanel.failSafeTitle), el('div', { className: 'gateTrialRecommendedPanel__failSafeRows' }, surface.recommendedPanel.failSafeRows.map((row: GateTrialFactRowSurface) => el('div', { key: row.id, className: 'gateTrialRecommendedPanel__factRow', 'data-testid': `gate-trial-failsafe-row-${row.id}` }, el('span', null, row.label), el('span', null, row.value)))) , el('button', { type: 'button', className: 'gateTrialRecommendedPanel__safetyNetButton', 'data-testid': 'gate-trial-safety-net-button', disabled: !surface.recommendedPanel.safetyNetButton.enabled, onClick: () => props.onSafetyNetAction?.() }, surface.recommendedPanel.safetyNetButton.label), el('h4', { 'data-testid': 'gate-trial-top-fixes-title' }, surface.recommendedPanel.topFixesTitle), el('div', { className: 'gateTrialRecommendedPanel__topFixes' }, surface.recommendedPanel.topFixes.map((fix: GateTrialFixSurface) => el('button', { key: fix.id, type: 'button', className: 'gateTrialRecommendedPanel__topFixButton', 'data-testid': `gate-trial-top-fix-${fix.id}`, 'data-intent': fix.button.intent, 'data-route-target': fix.routeTarget, onClick: () => props.onTopFixAction?.(fix) }, fix.label))))),
    el('section', { className: 'gateTrialExactPage__readinessRailSlot', 'data-testid': 'gate-trial-exact-readiness-rail' }, el('section', { className: 'gateTrialReadinessRail' }, el('h3', { className: 'gateTrialReadinessRail__title', 'data-testid': 'gate-trial-readiness-rail-title' }, surface.readinessRail.title), el('div', { className: 'gateTrialReadinessRail__track' }, el('div', { className: 'gateTrialReadinessRail__connector' }), el('ol', { className: 'gateTrialReadinessRail__nodeList' }, surface.readinessRail.nodes.map((node: GateTrialReadinessNodeSurface) => el('li', { key: node.id, className: 'gateTrialReadinessRail__node', 'data-testid': `gate-trial-readiness-node-${node.id}` }, el('button', { type: 'button', className: 'gateTrialReadinessRail__medallion', 'data-status': node.status, onClick: () => props.onReadinessNodeAction?.(node.id) }, el(GateTrialStatusMedallion, { status: node.status })), el('span', { className: 'gateTrialReadinessRail__label' }, node.label))))))),
    el('section', { className: 'gateTrialExactPage__ctaSlot', 'data-testid': 'gate-trial-exact-cta-slot' }, el('button', { type: 'button', className: 'gateTrialPrimaryCta', 'data-testid': 'gate-trial-primary-cta', disabled: !surface.primaryAction.enabled, onClick: () => props.onPrimaryAction?.() }, el('span', { className: 'gateTrialPrimaryCta__ornament gateTrialPrimaryCta__ornament--left', 'data-testid': 'gate-trial-primary-cta-ornament-left' }), el('span', { className: 'gateTrialPrimaryCta__plate' }, el('span', { className: 'gateTrialPrimaryCta__label', 'data-testid': 'gate-trial-primary-cta-label' }, surface.primaryAction.label)), el('span', { className: 'gateTrialPrimaryCta__ornament gateTrialPrimaryCta__ornament--right', 'data-testid': 'gate-trial-primary-cta-ornament-right' }))),
    el('aside', { className: 'gateTrialExactPage__summaryDock', 'data-testid': 'gate-trial-exact-summary-dock' }, el('section', { className: 'gateTrialTrialSummary', 'data-testid': 'gate-trial-summary-card' }, el('h3', { 'data-testid': 'gate-trial-summary-title' }, surface.trialSummary.title), el('div', { className: 'gateTrialTrialSummary__rows' }, surface.trialSummary.rows.map((row) => el('div', { key: row.id, className: 'gateTrialTrialSummary__row', 'data-testid': `gate-trial-summary-row-${row.id}` }, el('span', { className: 'gateTrialTrialSummary__label' }, row.label), el('span', { className: 'gateTrialTrialSummary__value' }, row.value)))))),
    el('aside', { 'data-testid': 'gate-trial-exact-shell-flags', hidden: true }, JSON.stringify(surface.shell)),
    el('aside', { 'data-testid': 'gate-trial-exact-region-order', hidden: true }, (surface.debug.regionOrder ?? GATE_TRIAL_EXACT_REGION_ORDER).join('|')),
  );
}

export { GateTrialExactScreen };
