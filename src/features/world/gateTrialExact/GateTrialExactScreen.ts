import React from 'react';
import type {
  GateTrialExactStatus,
  GateTrialExactSurfaceV1,
  GateTrialFactRowSurface,
  GateTrialFixSurface,
  GateTrialReadinessNodeId,
  GateTrialReadinessNodeSurface,
  GateTrialSummaryRowSurface,
  GateTrialTacticalCellId,
  GateTrialTacticalCellSurface,
} from './gateTrialExactTypes.js';
import {
  GATE_TRIAL_EXACT_REGION_ORDER,
  GATE_TRIAL_EXACT_TOP_REGION_CONTRACT,
} from './gateTrialExactPresentation.js';

type GateTrialRailRowSurface =
  | GateTrialExactSurfaceV1['minimumChecklist']['rows'][number]
  | GateTrialExactSurfaceV1['recommendedPanel']['prepRows'][number];

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
function normalizeGateTrialIconKey(iconKey: string): string { return iconKey.replace(/[^a-zA-Z0-9_-]/g, ''); }

const el = React.createElement;

function GateTrialStatusMedallion(props: { status: GateTrialExactStatus; size?: 'small' | 'medium' | 'large'; tone?: string }) {
  const { status, size = 'medium', tone } = props;
  return el('span', {
    className: [
      'gateTrialStatusMedallion',
      gateTrialStatusClass(status),
      tone ? gateTrialToneClass(tone) : '',
    ].filter(Boolean).join(' '),
    'data-status': status,
    'data-size': size,
    'aria-hidden': 'true',
  }, el('span', { className: 'gateTrialStatusMedallion__mark' }));
}

function GateTrialIconSlot(props: { iconKey: string; tone?: string; className?: string }) {
  const { iconKey, tone, className } = props;
  const normalizedIconKey = normalizeGateTrialIconKey(iconKey);
  return el('span', {
    className: [
      'gateTrialIconSlot',
      className ?? '',
      tone ? gateTrialToneClass(tone) : '',
    ].filter(Boolean).join(' '),
    'data-icon-key': iconKey,
    'aria-hidden': 'true',
  }, el('span', { className: `gateTrialIconSlot__glyph gateTrialIconSlot__glyph--${normalizedIconKey}` }));
}

function GateTrialRailRowView(props: { row: GateTrialRailRowSurface; variant: 'minimum' | 'prep' }) {
  const { row, variant } = props;
  if (variant === 'minimum') {
    return el('li', {
      className: `gateTrialMinimumChecklist__row gateTrialMinimumChecklist__row--${row.status}`,
      'data-testid': `gate-trial-minimum-row-${row.id}`,
      'data-row-id': row.id,
      'data-status': row.status,
      'data-route-target': row.routeTarget ?? undefined,
    },
      el('span', { className: 'gateTrialMinimumChecklist__rowMedallion' },
        el(GateTrialStatusMedallion, { status: row.status, size: 'large' }),
      ),
      el('div', { className: 'gateTrialMinimumChecklist__rowCopy' },
        el('div', { className: 'gateTrialMinimumChecklist__rowTitle' }, row.title),
        row.detail ? el('div', { className: 'gateTrialMinimumChecklist__rowDetail' }, row.detail) : null,
      ),
    );
  }

  return el('div', {
    className: `gateTrialRecommendedPanel__prepRow gateTrialRecommendedPanel__prepRow--${row.status}`,
    'data-testid': `gate-trial-prep-row-${row.id}`,
    'data-row-id': row.id,
    'data-status': row.status,
    'data-route-target': row.routeTarget ?? undefined,
  },
    el(GateTrialIconSlot, { iconKey: row.iconKey, tone: row.status }),
    el('div', { className: 'gateTrialRecommendedPanel__prepCopy' },
      el('div', { className: 'gateTrialRecommendedPanel__prepTitle' }, row.title),
      row.detail ? el('div', { className: 'gateTrialRecommendedPanel__prepDetail' }, row.detail) : null,
    ),
    el(GateTrialStatusMedallion, { status: row.status, size: 'small' }),
  );
}

function GateTrialFactRowView(props: { row: GateTrialFactRowSurface }) {
  const { row } = props;
  return el('div', {
    className: 'gateTrialFailSafeFactRow',
    'data-testid': `gate-trial-failsafe-row-${row.id}`,
    'data-fact-id': row.id,
    'data-tone': row.tone,
  },
    el(GateTrialIconSlot, { iconKey: row.iconKey, tone: row.tone, className: 'gateTrialFailSafeFactRow__icon' }),
    el('span', { className: 'gateTrialFailSafeFactRow__label' }, row.label),
    el('span', { className: 'gateTrialFailSafeFactRow__value' }, row.value),
  );
}

function GateTrialTopFixButtonView(props: { fix: GateTrialFixSurface; onTopFixAction?: (fix: GateTrialFixSurface) => void }) {
  const { fix } = props;
  return el('button', {
    key: fix.id,
    type: 'button',
    className: 'gateTrialTopFixButton',
    'data-testid': `gate-trial-top-fix-${fix.id}`,
    'data-fix-id': fix.id,
    'data-route-target': fix.routeTarget,
    'data-intent': fix.button.intent,
    disabled: !fix.button.enabled,
    'aria-label': fix.button.ariaLabel,
    onClick: () => {
      if (fix.button.enabled) {
        props.onTopFixAction?.(fix);
      }
    },
  },
    el(GateTrialIconSlot, { iconKey: fix.iconKey, className: 'gateTrialTopFixButton__icon' }),
    el('span', { className: 'gateTrialTopFixButton__label' }, fix.label),
    el('span', { className: 'gateTrialTopFixButton__chevron', 'aria-hidden': 'true' }),
  );
}

function GateTrialSummaryRowView(props: { row: GateTrialSummaryRowSurface }) {
  const { row } = props;
  return el('div', {
    className: `gateTrialTrialSummary__row gateTrialTrialSummary__row--${row.tone}`,
    'data-testid': `gate-trial-summary-row-${row.id}`,
    'data-row-id': row.id,
    'data-tone': row.tone,
  },
    el('span', { className: 'gateTrialTrialSummary__label' }, row.label),
    el('span', { className: 'gateTrialTrialSummary__value' }, row.value),
  );
}

function GateTrialTacticalCell(props: { cell: GateTrialTacticalCellSurface }) {
  const { cell } = props;
  const underlineStyle = cell.underlineBarPct === undefined
    ? undefined
    : ({ '--gate-tactical-underline-pct': `${cell.underlineBarPct}%` } as React.CSSProperties);
  return el('div', {
    className: `gateTrialTacticalCell gateTrialTacticalCell--${cell.id} gateTrialTacticalCell--${cell.tone}`,
    'data-testid': `gate-trial-tactical-cell-${cell.id}`,
    'data-cell-id': cell.id,
    'data-tone': cell.tone,
    'data-source': cell.source,
    'data-visible': cell.visible ? 'true' : 'false',
    'data-has-underline-bar': cell.showUnderlineBar ? 'true' : undefined,
    'data-underline-pct': cell.underlineBarPct === undefined ? undefined : String(cell.underlineBarPct),
    'aria-label': `${cell.label}: ${cell.primaryText}`,
    style: underlineStyle,
  },
    el('span', { className: 'gateTrialTacticalCell__iconDock', 'data-icon-key': cell.iconKey, 'aria-hidden': 'true' },
      el('span', { className: `gateTrialTacticalCell__icon gateTrialTacticalCell__icon--${cell.id}` }),
    ),
    el('span', { className: 'gateTrialTacticalCell__text' },
      el('span', { className: 'gateTrialTacticalCell__label' }, cell.label),
      el('span', { className: 'gateTrialTacticalCell__primary' }, cell.primaryText),
      cell.secondaryText ? el('span', { className: 'gateTrialTacticalCell__secondary' }, cell.secondaryText) : null,
    ),
    cell.reserveAdornmentSpace ? el('span', { className: 'gateTrialTacticalCell__rightOrnament', 'aria-hidden': 'true' }) : null,
    cell.showCaret ? el('span', { className: 'gateTrialTacticalCell__caret', 'aria-hidden': 'true' }) : null,
    cell.showUnderlineBar ? el('span', { className: 'gateTrialTacticalCell__underlineTrack', 'aria-hidden': 'true' }, el('span', { className: 'gateTrialTacticalCell__underlineFill' })) : null,
  );
}

function GateTrialExactScreen(props: GateTrialExactScreenProps) {
  const { surface } = props;
  return el('article', { className: 'gateTrialExactPage', 'data-testid': surface.meta.rootTestId, 'data-surface-mode': surface.meta.mode, 'data-activity-mode': surface.meta.activityMode, 'data-lifecycle-state': surface.meta.lifecycleState, 'data-readiness-score': surface.meta.readinessScore },
    el('div', { className: 'gateTrialExactPage__underlay' }),
    el('header', { className: 'gateTrialTopRegion', 'data-testid': 'gate-trial-exact-top-region', 'data-target-height-px': GATE_TRIAL_EXACT_TOP_REGION_CONTRACT.targetHeightPx },
      el('div', { className: 'gateTrialTopRegion__topBand' },
        el('div', { className: 'gateTrialTopRegion__titleAnchor', 'data-testid': 'gate-trial-page-title' },
          el('h1', null, surface.page.title),
          surface.page.titleSeal.visible ? el('span', { className: 'gateTrialTopRegion__titleSeal', 'data-testid': 'gate-trial-title-seal', 'aria-hidden': 'true' }) : null,
        ),
        el('section', { className: 'gateTrialTopRegion__macroRibbon', 'data-testid': 'gate-trial-macro-ribbon', 'aria-label': surface.topRibbon.ariaLabel },
          el('div', { className: 'gateTrialTopRegion__macroTrack', 'aria-hidden': 'true' }),
          el('ol', { className: 'gateTrialTopRegion__macroNodes', style: { '--gate-ribbon-node-count': surface.topRibbon.nodes.length } as React.CSSProperties }, surface.topRibbon.nodes.map((node) => el('li', {
            key: node.id,
            className: [
              'gateTrialTopRegion__macroNode',
              `gateTrialTopRegion__macroNode--${node.state}`,
              node.variant === 'gate-marker' ? 'gateTrialTopRegion__macroNode--gateMarker' : '',
            ].filter(Boolean).join(' '),
            'data-node-id': node.id,
            'data-state': node.state,
            'data-variant': node.variant,
            'data-current': node.id === surface.topRibbon.activeNodeId ? 'true' : 'false',
          }, el('span', { className: 'gateTrialSrOnly' }, node.label)))),
        ),
        el('div', { className: 'gateTrialTopRegion__statusCluster', 'data-testid': 'gate-trial-top-status' },
          el('span', { className: 'gateTrialTopRegion__statusMedallion', 'aria-hidden': 'true' }),
          el('span', { className: 'gateTrialTopRegion__statusText' }, surface.page.topRightStatus.join(GATE_TRIAL_EXACT_TOP_REGION_CONTRACT.fixtureStatusJoiner)),
          el('span', { className: 'gateTrialTopRegion__settingsOrnament', 'aria-hidden': 'true' }),
        ),
      ),
      el('div', { className: 'gateTrialTopRegion__tacticalStrip', 'data-testid': 'gate-trial-tactical-strip', 'aria-label': surface.tacticalStrip.ariaLabel, 'data-cell-count': GATE_TRIAL_EXACT_TOP_REGION_CONTRACT.tacticalCellCount }, surface.tacticalStrip.cells.map((cell) => el(GateTrialTacticalCell, { key: cell.id, cell }))),
    ),
    el('section', {
      className: 'gateTrialExactPage__gateHeaderSlot',
      'data-testid': 'gate-trial-exact-gate-header-slot',
    },
      el('section', {
        className: `gateTrialGateHeader gateTrialGateHeader--${surface.gateHeader.plaqueVariant}`,
        'data-testid': 'gate-trial-gate-header',
        'data-contract-alias': 'gate-trial-header-plaque',
        'aria-labelledby': 'gate-trial-gate-header-title',
      },
        el('div', {
          className: 'gateTrialGateHeader__plaqueShell',
          'data-testid': 'gate-trial-gate-header-plaque',
        },
          el('span', { className: 'gateTrialGateHeader__flourish gateTrialGateHeader__flourish--left', 'aria-hidden': 'true' }),
          el('h2', {
            className: 'gateTrialGateHeader__title',
            id: 'gate-trial-gate-header-title',
            'data-testid': 'gate-trial-gate-header-title',
            'data-contract-alias': 'gate-trial-header-title',
          }, surface.gateHeader.title),
          el('span', { className: 'gateTrialGateHeader__flourish gateTrialGateHeader__flourish--right', 'aria-hidden': 'true' }),
        ),
        el('p', {
          className: 'gateTrialGateHeader__subtitle',
          'data-testid': 'gate-trial-gate-header-subtitle',
          'data-contract-alias': 'gate-trial-header-subtitle',
        }, surface.gateHeader.subtitle),
        el('div', {
          className: 'gateTrialGateHeader__chipRow',
          'data-testid': 'gate-trial-gate-header-chips',
          'data-contract-alias': 'gate-trial-header-chip-row',
        }, surface.gateHeader.chips.map((chip) => el('span', {
          key: chip.id,
          className: `gateTrialGateHeader__chip ${gateTrialToneClass(chip.tone)}`,
          'data-testid': 'gate-trial-gate-header-chip',
          'data-chip-id': chip.id,
          'data-tone': chip.tone,
        },
          el('span', { className: 'gateTrialGateHeader__chipIcon', 'data-icon-key': chip.iconKey, 'aria-hidden': 'true' }),
          el('span', { className: 'gateTrialGateHeader__chipLabel' }, chip.label),
        ))),
      )),
    el('aside', {
      className: 'gateTrialExactPage__leftRail',
      'data-testid': 'gate-trial-exact-left-rail',
    },
      el('section', {
        className: 'gateTrialMinimumChecklist gateTrialExactCard',
        'data-testid': 'gate-trial-minimum-checklist',
        'aria-labelledby': 'gate-trial-minimum-title',
      },
        el('span', { className: 'gateTrialMinimumChecklist__ornament', 'aria-hidden': 'true' }),
        el('header', { className: 'gateTrialMinimumChecklist__header' },
          el('h3', {
            id: 'gate-trial-minimum-title',
            className: 'gateTrialMinimumChecklist__title',
            'data-testid': 'gate-trial-minimum-title',
          }, surface.minimumChecklist.title),
          surface.minimumChecklist.stamp.visible ? el('span', {
            className: 'gateTrialMinimumChecklist__stamp',
            'data-testid': 'gate-trial-minimum-stamp',
            'data-tone': surface.minimumChecklist.stamp.tone,
          }, el('span', { className: 'gateTrialMinimumChecklist__stampText' }, surface.minimumChecklist.stamp.label)) : null,
        ),
        el('ol', {
          className: 'gateTrialMinimumChecklist__rows',
          'data-testid': 'gate-trial-minimum-rows',
        }, surface.minimumChecklist.rows.map((row) => el(GateTrialRailRowView, { key: row.id, row, variant: 'minimum' }))),
        el('span', { className: 'gateTrialMinimumChecklist__bottomWash', 'aria-hidden': 'true' }),
      )),
    el('main', { className: 'gateTrialExactPage__scenicSlot', 'data-testid': 'gate-trial-exact-scenic-slot' },
      el('section', {
        className: [
          'gateTrialScenicStage',
          surface.scenicStage.artStatus === 'approved-bound'
            ? 'gateTrialScenicStage--approvedBound'
            : 'gateTrialScenicStage--deferredArt',
        ].join(' '),
        'data-testid': 'gate-trial-scenic-stage',
        'data-scene-asset-id': surface.scenicStage.sceneAssetId,
        'data-art-status': surface.scenicStage.artStatus,
        'data-final-art-required': surface.scenicStage.requiresFinalArtBinding ? 'true' : 'false',
        'data-approved-plate-bound': surface.scenicStage.artStatus === 'approved-bound' ? 'true' : 'false',
        role: 'img',
        'aria-label': 'Foundation Gate threshold scene',
        'aria-description': surface.scenicStage.environmentDescriptor,
      },
        el('div', { className: 'gateTrialScenicStage__frame', 'data-testid': 'gate-trial-scenic-frame' },
          el('div', { className: 'gateTrialScenicStage__approvedPlate', 'data-testid': 'gate-trial-scenic-approved-plate', 'aria-hidden': 'true' }),
          el('div', { className: 'gateTrialScenicStage__underpaint', 'data-testid': 'gate-trial-scenic-underpaint', 'aria-hidden': 'true' }),
          el('span', { className: 'gateTrialScenicStage__mountain gateTrialScenicStage__mountain--left', 'data-testid': 'gate-trial-scenic-mountain-left', 'aria-hidden': 'true' }),
          el('span', { className: 'gateTrialScenicStage__mountain gateTrialScenicStage__mountain--right', 'data-testid': 'gate-trial-scenic-mountain-right', 'aria-hidden': 'true' }),
          el('span', { className: 'gateTrialScenicStage__gateSilhouette', 'data-testid': 'gate-trial-scenic-gate-silhouette', 'aria-hidden': 'true' }),
          el('span', { className: 'gateTrialScenicStage__portalBloom', 'data-testid': 'gate-trial-scenic-portal-bloom', 'aria-hidden': 'true' }),
          el('span', { className: 'gateTrialScenicStage__stairs', 'data-testid': 'gate-trial-scenic-stairs', 'aria-hidden': 'true' }),
          el('span', { className: 'gateTrialScenicStage__platform', 'data-testid': 'gate-trial-scenic-platform', 'aria-hidden': 'true' }),
          el('span', { className: 'gateTrialScenicStage__torch gateTrialScenicStage__torch--left', 'data-testid': 'gate-trial-scenic-torch-left', 'aria-hidden': 'true' }),
          el('span', { className: 'gateTrialScenicStage__torch gateTrialScenicStage__torch--right', 'data-testid': 'gate-trial-scenic-torch-right', 'aria-hidden': 'true' }),
          el('span', { className: 'gateTrialScenicStage__cultivatorShadow', 'data-testid': 'gate-trial-scenic-cultivator-shadow', 'aria-hidden': 'true' }),
          el('span', { className: 'gateTrialScenicStage__mist', 'data-testid': 'gate-trial-scenic-mist', 'aria-hidden': 'true' }),
          el('span', { className: 'gateTrialScenicStage__edgeFade', 'data-testid': 'gate-trial-scenic-edge-fade', 'aria-hidden': 'true' }),
        ),
        el('section', {
          className: `gateTrialReadinessSeal gateTrialReadinessSeal--${surface.scenicStage.readinessSeal.state}`,
          'data-testid': 'gate-trial-readiness-seal',
          'data-seal-state': surface.scenicStage.readinessSeal.state,
          'aria-labelledby': 'gate-trial-readiness-verdict',
        },
          el('span', { className: 'gateTrialReadinessSeal__halo', 'data-testid': 'gate-trial-readiness-seal-halo', 'aria-hidden': 'true' }),
          el('span', { className: 'gateTrialReadinessSeal__ornament gateTrialReadinessSeal__ornament--left', 'data-testid': 'gate-trial-readiness-seal-ornament-left', 'aria-hidden': 'true' }),
          el('span', { className: 'gateTrialReadinessSeal__ornament gateTrialReadinessSeal__ornament--right', 'data-testid': 'gate-trial-readiness-seal-ornament-right', 'aria-hidden': 'true' }),
          el('div', { className: 'gateTrialReadinessSeal__body' },
            el('div', { className: 'gateTrialReadinessSeal__verdict', id: 'gate-trial-readiness-verdict', 'data-testid': 'gate-trial-readiness-verdict' }, surface.scenicStage.readinessSeal.verdict),
            el('span', { className: 'gateTrialReadinessSeal__divider', 'aria-hidden': 'true' }),
            el('div', { className: 'gateTrialReadinessSeal__score', 'data-testid': 'gate-trial-readiness-score' }, surface.scenicStage.readinessSeal.scoreLabel),
          ),
          el('span', { className: 'gateTrialReadinessSeal__bottomGem', 'data-testid': 'gate-trial-readiness-seal-bottom-gem', 'aria-hidden': 'true' }),
        ),
        el('section', {
          className: 'gateTrialGuardianPlaque',
          'data-testid': 'gate-trial-guardian-plaque',
          'data-reward-icon-key': surface.scenicStage.guardianPlaque.rewardIconKey,
          'aria-labelledby': 'gate-trial-guardian-title',
        },
          el('span', { className: 'gateTrialGuardianPlaque__corner gateTrialGuardianPlaque__corner--topLeft', 'aria-hidden': 'true' }),
          el('span', { className: 'gateTrialGuardianPlaque__corner gateTrialGuardianPlaque__corner--topRight', 'aria-hidden': 'true' }),
          el('header', { className: 'gateTrialGuardianPlaque__header' },
            el('h3', { className: 'gateTrialGuardianPlaque__title', id: 'gate-trial-guardian-title', 'data-testid': 'gate-trial-guardian-title' }, surface.scenicStage.guardianPlaque.title),
            el('p', { className: 'gateTrialGuardianPlaque__subtitle', 'data-testid': 'gate-trial-guardian-subtitle' }, surface.scenicStage.guardianPlaque.subtitle),
          ),
          el('div', { className: 'gateTrialGuardianPlaque__reward' },
            el('span', { className: 'gateTrialGuardianPlaque__rewardIconDock', 'data-testid': 'gate-trial-guardian-reward-icon', 'aria-hidden': 'true' },
              el('span', { className: `gateTrialGuardianPlaque__rewardIcon gateTrialGuardianPlaque__rewardIcon--${normalizeGateTrialIconKey(surface.scenicStage.guardianPlaque.rewardIconKey)}` }),
            ),
            el('div', { className: 'gateTrialGuardianPlaque__rewardCopy' },
              surface.scenicStage.guardianPlaque.rewardLines.map((line) => el('div', { key: line, className: 'gateTrialGuardianPlaque__rewardLine', 'data-testid': 'gate-trial-reward-line' }, line)),
            ),
          ),
        ),
      )),
    el('aside', {
      className: 'gateTrialExactPage__rightRail',
      'data-testid': 'gate-trial-exact-right-rail',
    },
      el('section', {
        className: 'gateTrialRecommendedPanel gateTrialExactCard',
        'data-testid': 'gate-trial-recommended-panel',
        'aria-labelledby': 'gate-trial-recommended-title',
      },
        el('header', { className: 'gateTrialRecommendedPanel__header' },
          el('h3', {
            id: 'gate-trial-recommended-title',
            className: 'gateTrialRecommendedPanel__title',
            'data-testid': 'gate-trial-recommended-title',
          }, surface.recommendedPanel.title),
        ),
        el('section', { className: 'gateTrialRecommendedPanel__section gateTrialRecommendedPanel__section--prep' },
          el('h4', {
            className: 'gateTrialRecommendedPanel__sectionTitle',
            'data-testid': 'gate-trial-recommended-prep-title',
          }, surface.recommendedPanel.recommendedPrepTitle),
          el('div', {
            className: 'gateTrialRecommendedPanel__prepRows',
            'data-testid': 'gate-trial-recommended-prep-rows',
          }, surface.recommendedPanel.prepRows.map((row) => el(GateTrialRailRowView, { key: row.id, row, variant: 'prep' }))),
        ),
        el('section', {
          className: 'gateTrialRecommendedPanel__section gateTrialRecommendedPanel__section--failSafe',
          'data-testid': 'gate-trial-fail-safe-section',
        },
          el('h4', {
            className: 'gateTrialRecommendedPanel__sectionTitle',
            'data-testid': 'gate-trial-failsafe-title',
          }, surface.recommendedPanel.failSafeTitle),
          el('div', {
            className: 'gateTrialFailSafeFactRows',
            'data-testid': 'gate-trial-failsafe-rows',
          }, surface.recommendedPanel.failSafeRows.map((row: GateTrialFactRowSurface) => el(GateTrialFactRowView, { key: row.id, row }))),
          surface.recommendedPanel.safetyNetButton.visible ? el('button', {
            type: 'button',
            className: [
              'gateTrialRecommendedPanel__safetyNetButton',
              surface.recommendedPanel.safetyNetButton.tone === 'locked' ? 'gateTrialRecommendedPanel__safetyNetButton--locked' : '',
            ].filter(Boolean).join(' '),
            'data-testid': 'gate-trial-safety-net-button',
            'data-intent': surface.recommendedPanel.safetyNetButton.intent,
            'data-tone': surface.recommendedPanel.safetyNetButton.tone,
            'data-enabled': surface.recommendedPanel.safetyNetButton.enabled ? 'true' : 'false',
            disabled: !surface.recommendedPanel.safetyNetButton.enabled,
            'aria-label': surface.recommendedPanel.safetyNetButton.ariaLabel,
            onClick: () => {
              if (surface.recommendedPanel.safetyNetButton.enabled) {
                props.onSafetyNetAction?.();
              }
            },
          },
            el('span', { className: 'gateTrialRecommendedPanel__safetyNetIcon', 'aria-hidden': 'true' },
              el('span', { className: 'gateTrialRecommendedPanel__safetyNetIconMark' }),
            ),
            el('span', null, surface.recommendedPanel.safetyNetButton.label),
          ) : null,
        ),
        el('section', {
          className: 'gateTrialRecommendedPanel__section gateTrialRecommendedPanel__section--topFixes',
          'data-testid': 'gate-trial-top-fixes',
        },
          el('h4', {
            className: 'gateTrialRecommendedPanel__sectionTitle',
            'data-testid': 'gate-trial-top-fixes-title',
          }, surface.recommendedPanel.topFixesTitle),
          el('div', { className: 'gateTrialRecommendedPanel__topFixes' },
            surface.recommendedPanel.topFixes.map((fix: GateTrialFixSurface) => el(GateTrialTopFixButtonView, { key: fix.id, fix, onTopFixAction: props.onTopFixAction })),
          ),
        ),
      )),
    el('section', { className: 'gateTrialExactPage__readinessRailSlot', 'data-testid': 'gate-trial-exact-readiness-rail' }, el('section', { className: 'gateTrialReadinessRail' }, el('h3', { className: 'gateTrialReadinessRail__title', 'data-testid': 'gate-trial-readiness-rail-title' }, surface.readinessRail.title), el('div', { className: 'gateTrialReadinessRail__track' }, el('div', { className: 'gateTrialReadinessRail__connector' }), el('ol', { className: 'gateTrialReadinessRail__nodeList' }, surface.readinessRail.nodes.map((node: GateTrialReadinessNodeSurface) => el('li', { key: node.id, className: 'gateTrialReadinessRail__node', 'data-testid': `gate-trial-readiness-node-${node.id}` }, el('button', { type: 'button', className: 'gateTrialReadinessRail__medallion', 'data-status': node.status, onClick: () => props.onReadinessNodeAction?.(node.id) }, el(GateTrialStatusMedallion, { status: node.status })), el('span', { className: 'gateTrialReadinessRail__label' }, node.label))))))),
    el('section', { className: 'gateTrialExactPage__ctaSlot', 'data-testid': 'gate-trial-exact-cta-slot' }, el('button', { type: 'button', className: 'gateTrialPrimaryCta', 'data-testid': 'gate-trial-primary-cta', disabled: !surface.primaryAction.enabled, onClick: () => props.onPrimaryAction?.() }, el('span', { className: 'gateTrialPrimaryCta__ornament gateTrialPrimaryCta__ornament--left', 'data-testid': 'gate-trial-primary-cta-ornament-left' }), el('span', { className: 'gateTrialPrimaryCta__plate' }, el('span', { className: 'gateTrialPrimaryCta__label', 'data-testid': 'gate-trial-primary-cta-label' }, surface.primaryAction.label)), el('span', { className: 'gateTrialPrimaryCta__ornament gateTrialPrimaryCta__ornament--right', 'data-testid': 'gate-trial-primary-cta-ornament-right' }))),
    el('aside', {
      className: 'gateTrialExactPage__summaryDock',
      'data-testid': 'gate-trial-exact-summary-dock',
    },
      el('section', {
        className: 'gateTrialTrialSummary gateTrialExactCard',
        'data-testid': 'gate-trial-trial-summary',
        'data-contract-alias': 'gate-trial-summary-card',
        'aria-labelledby': 'gate-trial-summary-title',
      },
        el('h3', {
          id: 'gate-trial-summary-title',
          className: 'gateTrialTrialSummary__title',
          'data-testid': 'gate-trial-summary-title',
        }, surface.trialSummary.title),
        el('div', {
          className: 'gateTrialTrialSummary__rows',
          'data-testid': 'gate-trial-summary-rows',
        }, surface.trialSummary.rows.map((row) => el(GateTrialSummaryRowView, { key: row.id, row }))),
      )),
    el('aside', { 'data-testid': 'gate-trial-exact-shell-flags', hidden: true }, JSON.stringify(surface.shell)),
    el('aside', { 'data-testid': 'gate-trial-exact-region-order', hidden: true }, (surface.debug.regionOrder ?? GATE_TRIAL_EXACT_REGION_ORDER).join('|')),
  );
}

export { GateTrialExactScreen };
