import React from 'react';

export type GateTrialExactIconKey =
  | 'hp'
  | 'gate'
  | 'gateMarker'
  | 'loadout'
  | 'aiProfile'
  | 'healing'
  | 'bounty'
  | 'expedition'
  | 'statusCheck'
  | 'statusWarning'
  | 'statusLock'
  | 'weapon'
  | 'technique'
  | 'foundationPill'
  | 'failureSeal'
  | 'currencySeal'
  | 'reserveSeal'
  | 'safetyNet'
  | 'qiCap'
  | 'medicine'
  | 'ruinSupport'
  | 'unknown';

export type GateTrialExactIconSize =
  | 'micro'
  | 'tactical'
  | 'chip'
  | 'status'
  | 'panel'
  | 'reward'
  | 'rail'
  | 'railGate';

export interface GateTrialExactIconProps {
  iconKey: string | null | undefined;
  size?: GateTrialExactIconSize;
  tone?: 'neutral' | 'positive' | 'warning' | 'critical' | 'locked' | 'ceremonial';
  title?: string;
  className?: string;
  testId?: string;
}

const el = React.createElement;

const lineProps = {
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export function normalizeGateTrialExactIconKey(iconKey: string | null | undefined): GateTrialExactIconKey {
  switch (iconKey) {
    case 'hp':
      return 'hp';
    case 'gate':
      return 'gate';
    case 'gateMarker':
      return 'gateMarker';
    case 'loadout':
      return 'loadout';
    case 'aiProfile':
      return 'aiProfile';
    case 'healing':
      return 'healing';
    case 'bounty':
      return 'bounty';
    case 'expedition':
      return 'expedition';
    case 'statusCheck':
    case 'check':
    case 'success':
      return 'statusCheck';
    case 'statusWarning':
    case 'warning':
      return 'statusWarning';
    case 'statusLock':
    case 'locked':
    case 'lock':
      return 'statusLock';
    case 'weapon':
    case 'forgeWeapon':
      return 'weapon';
    case 'technique':
    case 'upgradeTechnique':
      return 'technique';
    case 'foundationPill':
    case 'gateFoundationPill':
      return 'foundationPill';
    case 'failureSeal':
    case 'eligibleFailures':
      return 'failureSeal';
    case 'currencySeal':
    case 'cost':
      return 'currencySeal';
    case 'reserveSeal':
    case 'reserve':
      return 'reserveSeal';
    case 'safetyNet':
      return 'safetyNet';
    case 'qiCap':
      return 'qiCap';
    case 'medicine':
      return 'medicine';
    case 'ruinSupport':
    case 'ruins':
      return 'ruinSupport';
    case 'unknown':
    default:
      return 'unknown';
  }
}

export function GateTrialExactIcon(props: GateTrialExactIconProps): React.ReactElement {
  const normalizedKey = normalizeGateTrialExactIconKey(props.iconKey);
  const size = props.size ?? 'panel';
  const tone = props.tone ?? 'neutral';

  return el('span', {
    className: [
      'gateTrialExactIcon',
      `gateTrialExactIcon--${normalizedKey}`,
      `gateTrialExactIcon--${size}`,
      `gateTrialExactIcon--tone-${tone}`,
      props.className ?? '',
    ].filter(Boolean).join(' '),
    'data-testid': props.testId ?? `gate-trial-icon-${normalizedKey}`,
    'data-icon-key': normalizedKey,
    'data-raw-icon-key': props.iconKey ?? '',
    'data-icon-size': size,
    'data-tone': tone,
    'aria-hidden': props.title ? undefined : 'true',
  },
    el('svg', {
      className: 'gateTrialExactIcon__svg',
      viewBox: '0 0 24 24',
      focusable: 'false',
      role: props.title ? 'img' : undefined,
      'aria-label': props.title,
    }, props.title ? el('title', null, props.title) : null, renderGateTrialExactIconPaths(normalizedKey)),
  );
}

function renderGateTrialExactIconPaths(iconKey: GateTrialExactIconKey): React.ReactNode {
  switch (iconKey) {
    case 'hp':
      return group(
        fillPath('M12 3.5 18.5 6v5.4c0 4.5-3 7.4-6.5 9.1-3.5-1.7-6.5-4.6-6.5-9.1V6L12 3.5Z'),
        strokePath('M9 11.2c0-1.2.9-2 2-2 .6 0 1 .3 1 .3s.4-.3 1-.3c1.1 0 2 .8 2 2 0 1.8-3 3.8-3 3.8s-3-2-3-3.8Z', 'gateTrialExactIcon__accent'),
      );
    case 'gate':
    case 'gateMarker':
      return group(
        strokePath('M5 8.5c2.2-2.1 4.5-3.1 7-3.1s4.8 1 7 3.1'),
        strokePath('M6 9h12', 'gateTrialExactIcon__accent'),
        strokePath('M8 9v9 M16 9v9 M10 18v-5h4v5 M6.5 18.5h11'),
      );
    case 'loadout':
      return group(
        strokePath('M14.5 4.5 6.5 12.5'),
        strokePath('M8.4 14.6 5.8 12 M7 14.2 4.8 16.4', 'gateTrialExactIcon__accent'),
        strokePath('M15.5 7.5l2 2 M12.6 10.4l2 2'),
      );
    case 'aiProfile':
      return group(
        fillPath('M8 4.5h8l2 3v12H6v-12l2-3Z'),
        strokePath('M12 9v5 M9 15h6 M9.5 8.5h5', 'gateTrialExactIcon__accent'),
        circleNode(12, 16.5, 0.8, 'gateTrialExactIcon__softFill'),
      );
    case 'healing':
    case 'medicine':
      return group(
        fillPath('M10 4.5h4v3l2 2v8.5c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2V9.5l2-2v-3Z'),
        strokePath('M9.5 4.5h5', 'gateTrialExactIcon__accent'),
        strokePath('M12 11v5 M9.5 13.5h5'),
      );
    case 'bounty':
      return group(
        fillPath('M7 5.5h10v12.8l-2-1.2-2 1.2-2-1.2-2 1.2V5.5Z'),
        strokePath('M9 8.5h6 M9 11.2h4', 'gateTrialExactIcon__accent'),
        circleNode(15.2, 14.8, 1.2),
      );
    case 'expedition':
      return group(
        strokePath('M12 4.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Z'),
        fillPath('M14.8 8.7l-2.1 5.1-3.5 1.5 2.1-5.1 3.5-1.5Z', 'gateTrialExactIcon__accent'),
      );
    case 'statusCheck':
      return strokePath('M5.5 12.5 10 17 18.8 7.2', 'gateTrialExactIcon__stroke');
    case 'statusWarning':
      return group(
        fillPath('M12 4.8 20 18.8H4L12 4.8Z'),
        strokePath('M12 9v4.5 M12 17h.01', 'gateTrialExactIcon__accent'),
      );
    case 'statusLock':
      return group(
        fillRect(6.5, 11, 11, 8, 1.5),
        strokePath('M9 11V8.5a3 3 0 0 1 6 0V11 M12 14v2', 'gateTrialExactIcon__accent'),
      );
    case 'weapon':
      return group(
        strokePath('M14.8 4.2 6.8 12.2'),
        strokePath('M8.6 14 5.9 11.3 M7.2 14.4 4.8 16.8', 'gateTrialExactIcon__accent'),
        strokePath('M15.8 5.2l2 2'),
      );
    case 'technique':
      return group(
        fillPath('M6 5.5h6c1.2 0 2 .7 2 1.8v11.2c0-1.1-.8-1.8-2-1.8H6V5.5Z'),
        fillPath('M18 5.5h-4c-1.2 0-2 .7-2 1.8v11.2c0-1.1.8-1.8 2-1.8h4V5.5Z'),
        strokePath('M8 9h3 M8 12h3', 'gateTrialExactIcon__accent'),
      );
    case 'foundationPill':
      return group(
        circleNode(12, 12, 7, 'gateTrialExactIcon__fill'),
        strokePath('M8.5 12c1.2-2 3.4-3.3 5.2-2.5 2 .9 2.4 3.5.7 5-1.5 1.3-4.1.9-5.4-.8', 'gateTrialExactIcon__accent'),
        strokePath('M16.5 6.5v2 M15.5 7.5h2'),
      );
    case 'failureSeal':
      return group(
        strokePath('M12 4.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Z'),
        strokePath('M9 8.5v7 M12 8.5v7 M15 8.5v7 M8.5 15.5l7-7', 'gateTrialExactIcon__accent'),
      );
    case 'currencySeal':
      return group(
        strokePath('M7 8.5c0-1.4 2.2-2.5 5-2.5s5 1.1 5 2.5-2.2 2.5-5 2.5-5-1.1-5-2.5Z'),
        strokePath('M7 8.5v5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-5 M7 11c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5', 'gateTrialExactIcon__accent'),
      );
    case 'reserveSeal':
      return group(
        fillPath('M8 9c.6-1.8 1.8-3 4-3s3.4 1.2 4 3l1.2 7c.3 1.7-1 3-2.8 3H9.6c-1.8 0-3.1-1.3-2.8-3L8 9Z'),
        strokePath('M9 9h6 M10 6.5h4', 'gateTrialExactIcon__accent'),
        circleNode(12, 14.2, 1.5, 'gateTrialExactIcon__softFill'),
      );
    case 'safetyNet':
      return group(
        fillPath('M12 4 18 6.3v5.2c0 4.1-2.5 6.5-6 8.2-3.5-1.7-6-4.1-6-8.2V6.3L12 4Z'),
        fillRect(9.5, 12.3, 5, 4, 0.5, 'gateTrialExactIcon__softFill'),
        strokePath('M10.5 12.3v-1.1a1.5 1.5 0 0 1 3 0v1.1', 'gateTrialExactIcon__accent'),
      );
    case 'qiCap':
      return group(
        circleNode(12, 12, 7, 'gateTrialExactIcon__fill'),
        strokePath('M8 13c2.5-4 6.4-4 8 0 M9.5 15.5c1.4 1.1 3.6 1.1 5 0', 'gateTrialExactIcon__accent'),
      );
    case 'ruinSupport':
      return group(
        strokePath('M6 10l6-5 6 5', 'gateTrialExactIcon__accent'),
        fillPath('M7.5 10h9v8h-9z'),
        strokePath('M10.5 18v-4h3v4 M6.5 20h11'),
      );
    case 'unknown':
    default:
      return group(
        circleNode(12, 12, 7),
        strokePath('M9 12h6 M12 9v6', 'gateTrialExactIcon__accent'),
      );
  }
}

function group(...children: React.ReactNode[]): React.ReactElement {
  return el(React.Fragment, null, ...children);
}

function strokePath(d: string, className = 'gateTrialExactIcon__stroke'): React.ReactElement {
  return el('path', {
    className,
    d,
    ...lineProps,
  });
}

function fillPath(d: string, className = 'gateTrialExactIcon__fill'): React.ReactElement {
  return el('path', {
    className,
    d,
    ...lineProps,
  });
}

function circleNode(cx: number, cy: number, r: number, className = 'gateTrialExactIcon__stroke'): React.ReactElement {
  return el('circle', {
    className,
    cx,
    cy,
    r,
    ...lineProps,
  });
}

function fillRect(
  x: number,
  y: number,
  width: number,
  height: number,
  rx: number,
  className = 'gateTrialExactIcon__fill',
): React.ReactElement {
  return el('rect', {
    className,
    x,
    y,
    width,
    height,
    rx,
    ...lineProps,
  });
}
