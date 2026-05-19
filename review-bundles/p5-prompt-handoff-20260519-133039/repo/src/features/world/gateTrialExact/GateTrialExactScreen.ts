import React from 'react';
import type {
  GateTrialActiveTheaterSurface,
  GateTrialExactStatus,
  GateTrialExactSurfaceV1,
  GateTrialFactRowSurface,
  GateTrialFixSurface,
  GateTrialReadinessNodeId,
  GateTrialReadinessNodeSurface,
  GateTrialResultTransitionSurface,
  GateTrialSummaryRowSurface,
  GateTrialTacticalCellId,
  GateTrialTacticalCellSurface,
} from './gateTrialExactTypes.js';
import { CombatAftermathCard, type CombatAftermathRouteSurface } from '../../combatAftermath/index.js';
import {
  GATE_TRIAL_EXACT_REGION_ORDER,
  GATE_TRIAL_EXACT_TOP_REGION_CONTRACT,
} from './gateTrialExactPresentation.js';
import { GateTrialExactIcon } from './GateTrialExactIcon.js';

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
  onAftermathRoute?: (route: CombatAftermathRouteSurface) => void;
}

function gateTrialToneClass(tone: string): string { return `gateTrialTone--${tone}`; }
function gateTrialStatusClass(status: GateTrialExactStatus): string { return `gateTrialStatusMedallion--${status === 'open' ? 'active' : status}`; }

const el = React.createElement;

function gateTrialStatusIconKey(status: GateTrialExactStatus, explicitIconKey?: string): string {
  if (explicitIconKey) return explicitIconKey;
  if (status === 'success' || status === 'cleared') return 'statusCheck';
  if (status === 'warning' || status === 'open' || status === 'active') return 'statusWarning';
  if (status === 'locked') return 'statusLock';
  return 'unknown';
}

function GateTrialStatusMedallion(props: {
  status: GateTrialExactStatus;
  iconKey?: string;
  testId?: string;
  size?: 'small' | 'medium' | 'large';
  tone?: string;
}) {
  const { status, size = 'medium', tone } = props;
  const iconKey = gateTrialStatusIconKey(status, props.iconKey);
  return el('span', {
    className: [
      'gateTrialStatusMedallion',
      gateTrialStatusClass(status),
      tone ? gateTrialToneClass(tone) : '',
    ].filter(Boolean).join(' '),
    'data-testid': props.testId,
    'data-status': status,
    'data-size': size,
    'data-icon-key': iconKey,
    'aria-hidden': 'true',
  },
    el(GateTrialExactIcon, {
      iconKey,
      size: 'status',
      tone: status === 'success' || status === 'cleared'
        ? 'positive'
        : status === 'locked'
          ? 'locked'
          : 'warning',
      className: 'gateTrialStatusMedallion__icon',
    }),
  );
}

function GateTrialRailRowView(props: { row: GateTrialRailRowSurface; variant: 'minimum' | 'prep' }) {
  const { row, variant } = props;
  if (variant === 'minimum') {
    return el('li', {
      className: `gateTrialMinimumChecklist__row gateTrialMinimumChecklist__row--${row.status}`,
      'data-testid': `gate-trial-minimum-row-${row.id}`,
      'data-row-id': row.id,
      'data-status': row.status,
      'data-icon-key': row.iconKey,
      'data-route-target': row.routeTarget ?? undefined,
    },
      el('span', { className: 'gateTrialMinimumChecklist__rowMedallion' },
        el(GateTrialStatusMedallion, {
          status: row.status,
          iconKey: row.iconKey,
          testId: `gate-trial-minimum-row-icon-${row.id}`,
          size: 'large',
        }),
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
    'data-icon-key': row.iconKey,
    'data-route-target': row.routeTarget ?? undefined,
  },
    el(GateTrialStatusMedallion, {
      status: row.status,
      iconKey: row.iconKey,
      testId: `gate-trial-prep-row-icon-${row.id}`,
      size: 'small',
    }),
    el('div', { className: 'gateTrialRecommendedPanel__prepCopy' },
      el('div', { className: 'gateTrialRecommendedPanel__prepTitle' }, row.title),
      row.detail ? el('div', { className: 'gateTrialRecommendedPanel__prepDetail' }, row.detail) : null,
    ),
  );
}

function GateTrialFactRowView(props: { row: GateTrialFactRowSurface }) {
  const { row } = props;
  return el('div', {
    className: `gateTrialFailSafeFactRow gateTrialRecommendedPanel__factRow ${gateTrialToneClass(row.tone)}`,
    'data-testid': `gate-trial-failsafe-row-${row.id}`,
    'data-fact-id': row.id,
    'data-tone': row.tone,
    'data-icon-key': row.iconKey,
  },
    el('span', { className: 'gateTrialRecommendedPanel__factIcon gateTrialFailSafeFactRow__icon', 'aria-hidden': 'true' },
      el(GateTrialExactIcon, {
        iconKey: row.iconKey,
        size: 'panel',
        tone: row.tone,
        testId: `gate-trial-icon-failsafe-${row.id}`,
      }),
    ),
    el('span', { className: 'gateTrialRecommendedPanel__factLabel gateTrialFailSafeFactRow__label' }, row.label),
    el('span', { className: 'gateTrialRecommendedPanel__factValue gateTrialFailSafeFactRow__value' }, row.value),
  );
}

function GateTrialTopFixButtonView(props: {
  fix: GateTrialFixSurface;
  emphasized?: boolean;
  onTopFixAction?: (fix: GateTrialFixSurface) => void;
}) {
  const { fix } = props;
  const isEmphasized = props.emphasized === true;
  return el('button', {
    key: fix.id,
    type: 'button',
    className: [
      'gateTrialTopFixButton',
      isEmphasized ? 'gateTrialTopFixButton--emphasized' : '',
    ].filter(Boolean).join(' '),
    'data-testid': `gate-trial-top-fix-${fix.id}`,
    'data-fix-id': fix.id,
    'data-route-target': fix.routeTarget,
    'data-intent': fix.button.intent,
    'data-emphasized': isEmphasized ? 'true' : 'false',
    disabled: !fix.button.enabled,
    'aria-label': fix.button.ariaLabel,
    onClick: () => {
      if (fix.button.enabled) {
        props.onTopFixAction?.(fix);
      }
    },
  },
    el(GateTrialExactIcon, {
      iconKey: fix.iconKey,
      size: 'panel',
      tone: 'neutral',
      className: 'gateTrialTopFixButton__icon gateTrialRecommendedPanel__topFixIcon',
      testId: `gate-trial-icon-top-fix-${fix.id}`,
    }),
    el('span', { className: 'gateTrialRecommendedPanel__topFixLabel gateTrialTopFixButton__label' }, fix.label),
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

function GateTrialTacticalCell(props: {
  cell: GateTrialTacticalCellSurface;
  onTacticalCellAction?: (cellId: GateTrialTacticalCellId) => void;
}) {
  const { cell } = props;
  const shouldRoute = cell.id !== 'hp' && cell.id !== 'gate';
  const canRouteTacticalCell = Boolean(props.onTacticalCellAction && shouldRoute);
  const tacticalElement = canRouteTacticalCell ? 'button' : 'div';
  const underlineStyle = cell.underlineBarPct === undefined
    ? undefined
    : ({ '--gate-tactical-underline-pct': `${cell.underlineBarPct}%` } as React.CSSProperties);
  return el(tacticalElement, {
    ...(canRouteTacticalCell ? {
      type: 'button',
      disabled: !cell.visible,
      onClick: () => props.onTacticalCellAction?.(cell.id),
    } : {}),
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
      el(GateTrialExactIcon, {
        iconKey: cell.iconKey,
        size: 'tactical',
        tone: cell.tone,
        className: 'gateTrialTacticalCell__icon',
        testId: `gate-trial-icon-${cell.id}`,
      }),
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

function renderGateTrialReadinessRail(
  surface: GateTrialExactSurfaceV1,
  onReadinessNodeAction?: (nodeId: GateTrialReadinessNodeId) => void,
): React.ReactElement {
  return el('section', {
    className: 'gateTrialExactPage__readinessRailSlot',
    'data-testid': 'gate-trial-exact-readiness-rail',
  },
    el('section', {
      className: 'gateTrialReadinessRail',
      'data-testid': 'gate-trial-readiness-rail',
      'aria-labelledby': 'gate-trial-readiness-rail-title',
    },
      el('h3', {
        id: 'gate-trial-readiness-rail-title',
        className: 'gateTrialReadinessRail__title',
        'data-testid': 'gate-trial-readiness-rail-title',
      }, surface.readinessRail.title),
      el('div', {
        className: 'gateTrialReadinessRail__track',
        'data-testid': 'gate-trial-readiness-rail-track',
      },
        el('div', {
          className: 'gateTrialReadinessRail__connector',
          'data-testid': 'gate-trial-readiness-rail-connector',
          'aria-hidden': 'true',
        }),
        el('ol', {
          className: 'gateTrialReadinessRail__nodeList',
          'data-testid': 'gate-trial-readiness-rail-node-list',
        }, surface.readinessRail.nodes.map((node: GateTrialReadinessNodeSurface) => el('li', {
          key: node.id,
          className: [
            'gateTrialReadinessRail__node',
            `gateTrialReadinessRail__node--${node.status}`,
            node.id === 'gate' ? 'gateTrialReadinessRail__node--gate' : '',
          ].filter(Boolean).join(' '),
          'data-testid': `gate-trial-readiness-node-${node.id}`,
          'data-node-id': node.id,
          'data-status': node.status,
          'data-variant': node.medallionVariant,
          'data-source': node.source,
          'data-icon-key': node.iconKey,
        },
          el('button', {
            type: 'button',
            className: [
              'gateTrialReadinessRail__nodeButton',
              `gateTrialReadinessRail__nodeButton--${node.medallionVariant}`,
            ].join(' '),
            'data-testid': `gate-trial-readiness-node-medallion-${node.id}`,
            'aria-label': node.ariaLabel,
            onClick: () => onReadinessNodeAction?.(node.id),
          },
            el('span', {
              className: [
                'gateTrialReadinessRail__medallion',
                `gateTrialReadinessRail__medallion--${node.medallionVariant}`,
              ].join(' '),
              'aria-hidden': 'true',
            },
              el('span', { className: 'gateTrialReadinessRail__medallionRing' }),
              el('span', { className: 'gateTrialReadinessRail__medallionInner' },
                el('span', {
                  className: [
                    'gateTrialReadinessRail__mark',
                    node.medallionVariant === 'gate-glow'
                      ? 'gateTrialReadinessRail__mark--gate gateTrialReadinessRail__mark--gate-glow'
                      : `gateTrialReadinessRail__mark--${node.medallionVariant}`,
                  ].join(' '),
                },
                  el(GateTrialExactIcon, {
                    iconKey: node.iconKey,
                    size: node.id === 'gate' ? 'railGate' : 'rail',
                    tone: node.status === 'success' || node.status === 'cleared'
                      ? 'positive'
                      : node.status === 'locked'
                        ? 'locked'
                        : node.id === 'gate'
                          ? 'ceremonial'
                          : 'warning',
                    className: 'gateTrialReadinessRail__icon',
                    testId: `gate-trial-icon-readiness-${node.id}`,
                  }),
                ),
              ),
            ),
          ),
          el('span', {
            className: 'gateTrialReadinessRail__label',
            'data-testid': `gate-trial-readiness-node-label-${node.id}`,
          }, node.label),
          el('span', {
            className: 'gateTrialReadinessRail__diamond',
            'aria-hidden': 'true',
          }),
        ))),
      ),
    ),
  );
}

function renderGateTrialPrimaryCta(
  surface: GateTrialExactSurfaceV1,
  onPrimaryAction?: () => void,
): React.ReactElement {
  return el('section', {
    className: 'gateTrialExactPage__ctaSlot',
    'data-testid': 'gate-trial-exact-cta-slot',
  },
    el('button', {
      type: 'button',
      className: [
        'gateTrialPrimaryCta',
        surface.primaryAction.enabled ? 'gateTrialPrimaryCta--enabled' : 'gateTrialPrimaryCta--disabled',
        `gateTrialPrimaryCta--${surface.primaryAction.tone}`,
      ].join(' '),
      'data-testid': 'gate-trial-primary-cta',
      'data-intent': surface.primaryAction.intent,
      'data-tone': surface.primaryAction.tone,
      'data-enabled': surface.primaryAction.enabled ? 'true' : 'false',
      disabled: !surface.primaryAction.enabled,
      'aria-label': surface.primaryAction.ariaLabel,
      onClick: () => {
        if (!surface.primaryAction.enabled) return;
        onPrimaryAction?.();
      },
    },
      el('span', {
        className: 'gateTrialPrimaryCta__glow',
        'data-testid': 'gate-trial-primary-cta-glow',
        'aria-hidden': 'true',
      }),
      el('span', {
        className: 'gateTrialPrimaryCta__ring',
        'data-testid': 'gate-trial-primary-cta-ring',
        'aria-hidden': 'true',
      }),
      el('span', {
        className: 'gateTrialPrimaryCta__plate',
        'data-testid': 'gate-trial-primary-cta-plate',
      },
        el('span', { className: 'gateTrialPrimaryCta__plateEdge', 'aria-hidden': 'true' }),
        el('span', {
          className: 'gateTrialPrimaryCta__label',
          'data-testid': 'gate-trial-primary-cta-label',
        }, surface.primaryAction.label),
      ),
    ),
  );
}

function renderGateTrialActiveTheater(activeTheater: GateTrialActiveTheaterSurface | undefined): React.ReactElement | null {
  if (!activeTheater?.visible) return null;

  const bossHpStyle = { '--gate-active-hp-pct': `${activeTheater.enemyHpPct}%` } as React.CSSProperties;
  const playerHpStyle = { '--gate-active-hp-pct': `${activeTheater.playerHpPct}%` } as React.CSSProperties;
  const bossNameLabel = `${activeTheater.enemyName} ${activeTheater.bossLevelLabel}`.trim();

  return el('section', {
    className: 'gateTrialActiveTheater',
    'data-testid': 'gate-trial-active-theater',
    'data-state': activeTheater.state,
    'aria-label': 'Active Gate Trial combat',
  },
    el('div', {
      className: 'gateTrialActiveTheater__topChips',
      'data-testid': 'gate-trial-active-theater-top-chips',
    },
      el('span', { className: 'gateTrialActiveTheater__attemptLabel' }, activeTheater.attemptLabel),
      activeTheater.chips.map((chip) => el('span', {
        key: chip.id,
        className: `gateTrialActiveTheater__chip ${gateTrialToneClass(chip.tone)}`,
        'data-testid': `gate-trial-active-theater-chip-${chip.id}`,
        'data-chip-id': chip.id,
        'data-tone': chip.tone,
      },
        el('span', { className: 'gateTrialActiveTheater__chipLabel' }, chip.label),
        el('span', { className: 'gateTrialActiveTheater__chipValue' }, chip.value),
      )),
    ),
    el('div', {
      className: 'gateTrialActiveTheater__statusCluster',
    },
      el('span', {
        className: 'gateTrialActiveTheater__elapsed',
        'data-testid': 'gate-trial-active-theater-elapsed',
      }, activeTheater.elapsedLabel),
      el('span', {
        className: 'gateTrialActiveTheater__autoState',
        'data-testid': 'gate-trial-active-theater-auto-state',
      }, activeTheater.autoStateLabel),
    ),
    el('section', {
      className: 'gateTrialActiveTheater__bossHp',
      'data-testid': 'gate-trial-active-theater-boss-hp',
    },
      el('div', { className: 'gateTrialActiveTheater__hpHeader' },
        el('span', {
          className: 'gateTrialActiveTheater__hpName',
          'data-testid': 'gate-trial-active-theater-boss-name',
        }, bossNameLabel),
        el('span', { className: 'gateTrialActiveTheater__hpValue' }, activeTheater.enemyHpLabel),
      ),
      el('div', {
        className: 'gateTrialActiveTheater__hpTrack',
        'data-testid': 'gate-trial-active-theater-boss-hp-bar',
      },
        el('span', {
          className: 'gateTrialActiveTheater__hpFill gateTrialActiveTheater__hpFill--boss',
          'data-testid': 'gate-trial-active-theater-boss-hp-fill',
          style: bossHpStyle,
        }),
      ),
    ),
    el('section', {
      className: 'gateTrialActiveTheater__playerHp',
      'data-testid': 'gate-trial-active-theater-player-hp',
    },
      el('div', { className: 'gateTrialActiveTheater__hpHeader' },
        el('span', {
          className: 'gateTrialActiveTheater__hpName',
          'data-testid': 'gate-trial-active-theater-player-name',
        }, activeTheater.playerName),
        el('span', { className: 'gateTrialActiveTheater__hpValue' }, activeTheater.playerHpLabel),
      ),
      el('div', {
        className: 'gateTrialActiveTheater__hpTrack',
        'data-testid': 'gate-trial-active-theater-player-hp-bar',
      },
        el('span', {
          className: 'gateTrialActiveTheater__hpFill gateTrialActiveTheater__hpFill--player',
          'data-testid': 'gate-trial-active-theater-player-hp-fill',
          style: playerHpStyle,
        }),
      ),
    ),
    el('div', {
      className: 'gateTrialActiveTheater__actorLayer',
      'data-testid': 'gate-trial-active-theater-actor-layer',
      'aria-hidden': 'true',
    },
      el('span', {
        className: 'gateTrialActiveTheater__portalPulse',
        'data-testid': 'gate-trial-active-theater-portal-pulse',
      }),
      el('span', {
        className: 'gateTrialActiveTheater__actor gateTrialActiveTheater__actor--player',
        'data-testid': 'gate-trial-active-theater-player-actor',
      },
        el('span', { className: 'gateTrialActiveTheater__actorAura' }),
      ),
      el('span', {
        className: 'gateTrialActiveTheater__actor gateTrialActiveTheater__actor--boss',
        'data-testid': 'gate-trial-active-theater-boss-actor',
      },
        el('span', { className: 'gateTrialActiveTheater__actorAura' }),
      ),
    ),
    el('aside', {
      className: 'gateTrialActiveTheater__logSlip',
      'data-testid': 'gate-trial-active-theater-log-slip',
      'aria-label': 'Gate Trial combat log',
    },
      el('div', { className: 'gateTrialActiveTheater__logHeader' }, 'Combat Flow'),
      el('ol', {
        className: 'gateTrialActiveTheater__logLines',
        'data-testid': 'gate-trial-active-theater-log-lines',
      }, activeTheater.logLines.map((line) => el('li', {
        key: line.id,
        className: 'gateTrialActiveTheater__logLine',
        'data-line-id': line.id,
        'data-tone': line.tone,
        'data-source': line.source,
      }, line.text))),
      el('ol', {
        className: 'gateTrialActiveTheater__techniqueLines',
        'data-testid': 'gate-trial-active-theater-technique-lines',
      }, activeTheater.techniqueLines.map((line) => el('li', {
        key: line.id,
        className: 'gateTrialActiveTheater__techniqueLine',
        'data-line-id': line.id,
        'data-tone': line.tone,
        'data-source': line.source,
      }, line.text))),
    ),
    el('div', {
      className: 'gateTrialActiveTheater__floatingEvents',
      'data-testid': 'gate-trial-active-theater-floating-events',
      'aria-hidden': 'true',
    }, activeTheater.floatingEvents.map((event) => el('span', {
      key: event.id,
      className: [
        'gateTrialActiveTheater__floatingEvent',
        `gateTrialActiveTheater__floatingEvent--${event.tone}`,
        `gateTrialActiveTheater__floatingEvent--${event.lane}`,
      ].join(' '),
      'data-event-id': event.id,
      'data-tone': event.tone,
      'data-lane': event.lane,
    }, event.label))),
  );
}

function renderGateTrialResultTransition(
  resultTransition: GateTrialResultTransitionSurface | undefined,
): React.ReactElement | null {
  if (!resultTransition?.visible) return null;

  return el('section', {
    className: [
      'gateTrialResultTransition',
      `gateTrialResultTransition--${resultTransition.kind}`,
      `gateTrialResultTransition--${resultTransition.tone}`,
    ].join(' '),
    'data-testid': 'gate-trial-result-transition',
    'data-result-kind': resultTransition.kind,
    'data-tone': resultTransition.tone,
    'aria-labelledby': 'gate-trial-result-transition-title',
  },
    el('span', { className: 'gateTrialResultTransition__halo', 'aria-hidden': 'true' }),
    el('div', { className: 'gateTrialResultTransition__frame' },
      el('span', {
        className: 'gateTrialResultTransition__corner gateTrialResultTransition__corner--topLeft',
        'aria-hidden': 'true',
      }),
      el('span', {
        className: 'gateTrialResultTransition__corner gateTrialResultTransition__corner--topRight',
        'aria-hidden': 'true',
      }),
      el('div', {
        className: 'gateTrialResultTransition__stamp',
        'data-testid': 'gate-trial-result-transition-stamp',
      }, resultTransition.stampLabel),
      el('h3', {
        className: 'gateTrialResultTransition__title',
        id: 'gate-trial-result-transition-title',
        'data-testid': 'gate-trial-result-transition-title',
      }, resultTransition.title),
      el('p', {
        className: 'gateTrialResultTransition__subtitle',
        'data-testid': 'gate-trial-result-transition-subtitle',
      }, resultTransition.subtitle),
      el('dl', {
        className: 'gateTrialResultTransition__details',
        'data-testid': 'gate-trial-result-transition-details',
      }, resultTransition.detailLines.map((line) => el('div', {
        key: line.id,
        className: `gateTrialResultTransition__detailRow ${gateTrialToneClass(line.tone)}`,
        'data-testid': `gate-trial-result-transition-detail-${line.id}`,
        'data-detail-id': line.id,
        'data-tone': line.tone,
        'data-source': line.source,
      },
        el('dt', { className: 'gateTrialResultTransition__detailLabel' }, line.label),
        el('dd', { className: 'gateTrialResultTransition__detailValue' }, line.value),
      ))),
      resultTransition.rewardLines.length > 0
        ? el('ul', {
            className: 'gateTrialResultTransition__rewardLines',
            'data-testid': 'gate-trial-result-transition-reward-lines',
          }, resultTransition.rewardLines.map((line, index) => el('li', {
            key: `${line}-${index}`,
            className: 'gateTrialResultTransition__rewardLine',
          }, line)))
        : null,
      el('p', {
        className: 'gateTrialResultTransition__ctaHint',
        'data-testid': 'gate-trial-result-transition-cta-hint',
      }, resultTransition.ctaHint),
    ),
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
          el('span', { className: 'gateTrialTopRegion__statusMedallion', 'aria-hidden': 'true' },
            el(GateTrialExactIcon, {
              iconKey: 'expedition',
              size: 'micro',
              tone: 'positive',
              className: 'gateTrialTopRegion__statusIcon',
              testId: 'gate-trial-icon-top-status',
            }),
          ),
          el('span', { className: 'gateTrialTopRegion__statusText' }, surface.page.topRightStatus.join(GATE_TRIAL_EXACT_TOP_REGION_CONTRACT.fixtureStatusJoiner)),
          el('span', { className: 'gateTrialTopRegion__settingsOrnament', 'aria-hidden': 'true' }),
        ),
      ),
      el('div', { className: 'gateTrialTopRegion__tacticalStrip', 'data-testid': 'gate-trial-tactical-strip', 'aria-label': surface.tacticalStrip.ariaLabel, 'data-cell-count': GATE_TRIAL_EXACT_TOP_REGION_CONTRACT.tacticalCellCount }, surface.tacticalStrip.cells.map((cell) => el(GateTrialTacticalCell, { key: cell.id, cell, onTacticalCellAction: props.onTacticalCellAction }))),
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
          'data-icon-key': chip.iconKey ?? '',
        },
          chip.iconKey ? el(GateTrialExactIcon, {
            iconKey: chip.iconKey,
            size: 'chip',
            tone: chip.tone,
            className: 'gateTrialGateHeader__chipIcon',
            testId: `gate-trial-icon-header-chip-${chip.id}`,
          }) : null,
          el('span', { className: 'gateTrialGateHeader__chipLabel' }, chip.label),
        ))),
      )),
    surface.runCompass ? el('section', {
      className: 'gateTrialRunCompassSlip gateTrialExactCard',
      'data-testid': 'gate-trial-run-compass',
      'aria-label': 'Run Compass',
    },
      el('div', { className: 'gateTrialRunCompassSlip__main' },
        el('span', { className: 'gateTrialRunCompassSlip__eyebrow' }, surface.runCompass.primaryRouteLabel),
        el('strong', {}, surface.runCompass.milestoneLabel),
        el('p', {}, surface.runCompass.primaryBlockerLabel),
        surface.runCompass.recentDeltaLine ? el('small', {}, surface.runCompass.recentDeltaLine) : null,
      ),
      el('span', { className: 'gateTrialRunCompassSlip__detail' }, surface.runCompass.detail),
    ) : null,
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
          surface.scenicStage.activeTheater?.visible ? 'gateTrialScenicStage--active' : '',
          surface.scenicStage.resultTransition?.visible ? 'gateTrialScenicStage--hasResult' : '',
          surface.scenicStage.resultTransition?.kind
            ? `gateTrialScenicStage--result-${surface.scenicStage.resultTransition.kind}`
            : '',
        ].join(' '),
        'data-testid': 'gate-trial-scenic-stage',
        'data-scene-asset-id': surface.scenicStage.sceneAssetId,
        'data-art-status': surface.scenicStage.artStatus,
        'data-final-art-required': surface.scenicStage.requiresFinalArtBinding ? 'true' : 'false',
        'data-approved-plate-bound': surface.scenicStage.artStatus === 'approved-bound' ? 'true' : 'false',
        'data-strict-visual-parity-blocked': surface.scenicStage.requiresFinalArtBinding ? 'true' : 'false',
        role: 'img',
        'aria-label': 'Foundation Gate threshold scene',
        'aria-description': surface.scenicStage.environmentDescriptor,
      },
        el('div', { className: 'gateTrialScenicStage__frame', 'data-testid': 'gate-trial-scenic-frame' },
          el('div', {
            className: 'gateTrialScenicStage__approvedPlate',
            'data-testid': 'gate-trial-scenic-approved-plate',
            'data-scene-asset-id': surface.scenicStage.sceneAssetId,
            'data-bound': surface.scenicStage.artStatus === 'approved-bound' ? 'true' : 'false',
            'aria-hidden': 'true',
          }),
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
        renderGateTrialActiveTheater(surface.scenicStage.activeTheater),
        renderGateTrialResultTransition(surface.scenicStage.resultTransition),
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
            el('span', {
              className: 'gateTrialGuardianPlaque__rewardIconDock gateTrialGuardianPlaque__rewardIcon',
              'data-testid': 'gate-trial-guardian-reward-icon',
              'data-icon-key': surface.scenicStage.guardianPlaque.rewardIconKey,
              'aria-hidden': 'true',
            },
              el(GateTrialExactIcon, {
                iconKey: surface.scenicStage.guardianPlaque.rewardIconKey,
                size: 'reward',
                tone: 'positive',
                testId: 'gate-trial-icon-foundationPill',
              }),
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
          surface.recommendedPanel.supportRun ? el('div', {
            className: 'gateTrialRecommendedPanel__supportRun',
            'data-testid': 'gate-trial-support-run',
            'data-route-target': surface.recommendedPanel.supportRun.routeTarget,
            'data-source': surface.recommendedPanel.supportRun.source,
          },
            el('strong', {}, surface.recommendedPanel.supportRun.title),
            el('span', {}, surface.recommendedPanel.supportRun.detail),
          ) : null,
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
              surface.scenicStage.resultTransition?.kind === 'fail-safe-available'
              || (surface.scenicStage.resultTransition?.kind === 'defeat' && surface.recommendedPanel.safetyNetButton.enabled)
                ? 'gateTrialRecommendedPanel__safetyNetButton--resultEmphasis'
                : '',
            ].filter(Boolean).join(' '),
            'data-testid': 'gate-trial-safety-net-button',
            'data-intent': surface.recommendedPanel.safetyNetButton.intent,
            'data-tone': surface.recommendedPanel.safetyNetButton.tone,
            'data-enabled': surface.recommendedPanel.safetyNetButton.enabled ? 'true' : 'false',
            'data-result-emphasis': surface.scenicStage.resultTransition?.kind === 'fail-safe-available'
            || (surface.scenicStage.resultTransition?.kind === 'defeat' && surface.recommendedPanel.safetyNetButton.enabled)
              ? 'true'
              : 'false',
            disabled: !surface.recommendedPanel.safetyNetButton.enabled,
            'aria-label': surface.recommendedPanel.safetyNetButton.ariaLabel,
            onClick: () => {
              if (surface.recommendedPanel.safetyNetButton.enabled) {
                props.onSafetyNetAction?.();
              }
            },
          },
            el(GateTrialExactIcon, {
              iconKey: 'safetyNet',
              size: 'panel',
              tone: surface.recommendedPanel.safetyNetButton.tone,
              className: 'gateTrialRecommendedPanel__safetyNetIcon',
              testId: 'gate-trial-icon-safetyNet',
            }),
            el('span', { className: 'gateTrialRecommendedPanel__safetyNetLabel' }, surface.recommendedPanel.safetyNetButton.label),
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
            surface.recommendedPanel.topFixes.map((fix: GateTrialFixSurface) => el(GateTrialTopFixButtonView, {
              key: fix.id,
              fix,
              emphasized: surface.scenicStage.resultTransition?.emphasizedFixId === fix.id,
              onTopFixAction: props.onTopFixAction,
            })),
          ),
        ),
      )),
    renderGateTrialReadinessRail(surface, props.onReadinessNodeAction),
    renderGateTrialPrimaryCta(surface, props.onPrimaryAction),
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
      ),
      surface.aftermath ? el('section', {
        className: 'gateTrialExactPage__aftermathSlot',
        'data-testid': 'gate-trial-aftermath-slot',
      },
        el(CombatAftermathCard, { surface: surface.aftermath, compact: true, onRoute: props.onAftermathRoute }),
      ) : null),
    el('aside', { 'data-testid': 'gate-trial-exact-shell-flags', hidden: true }, 'exact-shell-active'),
    el('aside', { 'data-testid': 'gate-trial-exact-region-order', hidden: true }, (surface.debug.regionOrder ?? GATE_TRIAL_EXACT_REGION_ORDER).join('|')),
  );
}

export { GateTrialExactScreen };
