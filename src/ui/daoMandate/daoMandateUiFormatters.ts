import type {
  DaoMandateEffectiveMotionMode,
  DaoMandateGuidanceProfile,
  DaoMandateObstruction,
  DaoMandateRoute,
  DaoMandateRouteTarget,
  DaoMandateTone,
  DaoRequirementBucket,
  DaoRequirementState,
} from '../../systems/ui/daoMandate/index.js';
import type { IconId } from '../icons/index.js';

export type DaoMandateRouteButtonKind = 'enabled' | 'blocked' | 'no-target' | 'no-handler' | 'empty' | 'disabled';

export interface DaoMandateRouteButtonViewModel {
  kind: DaoMandateRouteButtonKind;
  enabled: boolean;
  label: string;
  destinationLabel: string | null;
  reason: string | null;
  ariaLabel: string;
}

const PLAYER_SAFE_ROUTE_UNAVAILABLE = 'This route cannot be opened from here yet.';
const UNSAFE_ROUTE_REASON_PATTERN = /owner not wired|not wired|debug|adapter|placeholder|stub|mock|route target unavailable|no route target/i;

function sanitizeRouteReason(reason: string | null | undefined): string | null {
  if (!reason) return null;
  return UNSAFE_ROUTE_REASON_PATTERN.test(reason) ? PLAYER_SAFE_ROUTE_UNAVAILABLE : reason;
}

export function getDaoMandateToneIconId(tone: DaoMandateTone): IconId {
  switch (tone) {
    case 'success':
      return 'inkCheck';
    case 'warning':
      return 'inkWarning';
    case 'danger':
      return 'inkX';
    case 'info':
      return 'inkSparkles';
    case 'muted':
      return 'inkWip';
    case 'neutral':
      return 'inkSwirl';
  }
}

export function getDaoMandateToneLabel(tone: DaoMandateTone): string {
  switch (tone) {
    case 'success':
      return 'Resolved';
    case 'warning':
      return 'Caution';
    case 'danger':
      return 'Blocked';
    case 'info':
      return 'Guidance';
    case 'muted':
      return 'Quiet';
    case 'neutral':
      return 'Mandate';
  }
}

export function getDaoObstructionSeverityTone(severity: DaoMandateObstruction['severity']): DaoMandateTone {
  switch (severity) {
    case 'success':
      return 'success';
    case 'danger':
      return 'danger';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    case 'none':
      return 'muted';
  }
}

export function getDaoRequirementBucketLabel(bucket: DaoRequirementBucket): string {
  switch (bucket) {
    case 'hard_gate':
      return 'Hard Gate';
    case 'readiness_floor':
      return 'Readiness Floor';
    case 'support_reserve':
      return 'Support Reserve';
    case 'source_route':
      return 'Source Route';
    case 'optional_optimization':
      return 'Optional Optimization';
    case 'recent_omen':
      return 'Recent Omen';
  }
}

export function getDaoRequirementStateLabel(state: DaoRequirementState): string {
  switch (state) {
    case 'unmet':
      return 'Needed';
    case 'partial':
      return 'In progress';
    case 'met':
      return 'Met';
    case 'resolved':
      return 'Resolved';
    case 'blocked':
      return 'Blocked';
    case 'unknown':
      return 'Unknown';
  }
}

export function getDaoRequirementStateTone(state: DaoRequirementState): DaoMandateTone {
  switch (state) {
    case 'met':
    case 'resolved':
      return 'success';
    case 'partial':
      return 'info';
    case 'unmet':
      return 'warning';
    case 'blocked':
      return 'danger';
    case 'unknown':
      return 'muted';
  }
}

export function getDaoRequirementStateIconId(state: DaoRequirementState): IconId {
  return getDaoMandateToneIconId(getDaoRequirementStateTone(state));
}

function titleCaseIdentifier(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveRouteTarget(value: DaoMandateRoute | DaoMandateRouteTarget | null): DaoMandateRouteTarget | null {
  if (!value) return null;
  if ('target' in value) return value.target;
  return value;
}

export function describeDaoRouteTarget(value: DaoMandateRoute | DaoMandateRouteTarget | null): string {
  const target = resolveRouteTarget(value);
  if (!target) return PLAYER_SAFE_ROUTE_UNAVAILABLE;

  switch (target.kind) {
    case 'tab':
      return `Tab: ${titleCaseIdentifier(target.tab)}`;
    case 'world_module':
      return `World module: ${titleCaseIdentifier(target.moduleKey)} in ${target.cityId}`;
  }
}

export function isDaoRouteActionable(route: DaoMandateRoute | null): boolean {
  return Boolean(route && !route.blocked && route.target);
}

export function getDaoRouteDisabledReason(
  route: DaoMandateRoute | null,
  explicitReason?: string | null,
): string | null {
  if (explicitReason) return sanitizeRouteReason(explicitReason);
  if (!route) return 'No route is available.';
  if (route.blocked) return sanitizeRouteReason(route.blockedReason) ?? 'This route is currently blocked.';
  if (!route.target) return PLAYER_SAFE_ROUTE_UNAVAILABLE;
  return null;
}

export function getDaoMandateProfileLabel(_profile: DaoMandateGuidanceProfile): string {
  return 'Sparse compatibility';
}

export function getDaoMandateMotionClassName(motionMode: DaoMandateEffectiveMotionMode = 'medium'): string {
  return `daoMandateMotion--${motionMode}`;
}

export function getDaoMotionClassName(motionMode: DaoMandateEffectiveMotionMode = 'medium'): string {
  return getDaoMandateMotionClassName(motionMode);
}

export function sanitizeDomIdPart(value: string): string {
  const sanitized = value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return sanitized || 'dao';
}

export function getDaoRouteReasonElementId(routeId: string | null | undefined, reactId: string): string {
  return `dao-route-reason-${sanitizeDomIdPart(routeId ?? 'route')}-${sanitizeDomIdPart(reactId)}`;
}

export function getDaoRouteButtonViewModel(args: {
  route: DaoMandateRoute | null;
  hasHandler: boolean;
  disabled?: boolean;
  disabledReason?: string | null;
}): DaoMandateRouteButtonViewModel {
  const { route, hasHandler, disabled = false, disabledReason = null } = args;
  const routeReason = getDaoRouteDisabledReason(route, disabled ? disabledReason ?? 'This route is currently unavailable.' : disabledReason);
  const label = route?.actionLabel ?? 'No route';
  const destinationLabel = route?.destinationLabel ?? null;

  if (!route) {
    return {
      kind: 'empty',
      enabled: false,
      label,
      destinationLabel,
      reason: routeReason,
      ariaLabel: 'No route is available.',
    };
  }

  if (disabled) {
    return {
      kind: 'disabled',
      enabled: false,
      label,
      destinationLabel,
      reason: routeReason ?? 'This route is currently unavailable.',
      ariaLabel: `${label}. ${routeReason ?? 'This route is currently unavailable.'}`,
    };
  }

  if (route.blocked) {
    const reason = routeReason ?? 'This route is currently blocked.';
    return {
      kind: 'blocked',
      enabled: false,
      label,
      destinationLabel,
      reason,
      ariaLabel: `${label}. ${reason}`,
    };
  }

  if (!route.target) {
    const reason = routeReason ?? PLAYER_SAFE_ROUTE_UNAVAILABLE;
    return {
      kind: 'no-target',
      enabled: false,
      label,
      destinationLabel,
      reason,
      ariaLabel: `${label}. ${reason}`,
    };
  }

  if (!hasHandler) {
    const reason = disabledReason ?? 'Route action is unavailable from this view.';
    return {
      kind: 'no-handler',
      enabled: false,
      label,
      destinationLabel,
      reason,
      ariaLabel: `${label}. ${reason}`,
    };
  }

  const destination = destinationLabel ? ` Route target: ${destinationLabel}.` : '';
  return {
    kind: 'enabled',
    enabled: true,
    label,
    destinationLabel,
    reason: null,
    ariaLabel: `${label}.${destination}`,
  };
}
