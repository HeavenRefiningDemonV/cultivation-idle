import type { DaoMandateRoute, DaoMandateScreenId } from './daoMandateTypes.js';
import type { DaoOmenDirectRouteReason, DaoOmenKind } from './daoOmenProjectionTypes.js';

export const DAO_OMEN_PRIORITY: Record<DaoOmenKind, number> = {
  life_setup: 10,
  content_cap: 20,
  reincarnation_viable: 30,
  breakthrough_ready: 40,
  proof_missing: 50,
  threshold_unreached: 60,
  reflection: 70,
  safety_net_ready: 80,
  reserve_thin: 90,
  gear_floor_strained: 91,
  doctrine_uncertain: 92,
  currency_reserve_low: 100,
  support_reserve_low: 101,
  source_drought: 102,
  risky_attempt: 110,
  attemptable: 120,
  quiet: 999,
};

export interface DaoOmenDirectRouteContext {
  playerExpanded?: boolean;
  currentScreen?: DaoMandateScreenId;
}

export interface DaoOmenDirectRouteDecision {
  allowed: boolean;
  exposeRoute: boolean;
  reason?: DaoOmenDirectRouteReason;
  note: string;
}

export function getDaoOmenPriority(kind: DaoOmenKind): number {
  return DAO_OMEN_PRIORITY[kind];
}

export function isDaoOmenOrdinaryPressure(kind: DaoOmenKind): boolean {
  return kind === 'quiet'
    || kind === 'threshold_unreached'
    || kind === 'reserve_thin'
    || kind === 'gear_floor_strained'
    || kind === 'doctrine_uncertain'
    || kind === 'currency_reserve_low'
    || kind === 'support_reserve_low'
    || kind === 'source_drought';
}

export function daoOmenRouteTargetsGateTrial(route: DaoMandateRoute): boolean {
  if (route.target?.kind === 'world_module') return route.target.moduleKey === 'gateTrial';
  if (route.target?.kind === 'tab') return false;

  return /gate trial|inspect gate|attempt gate|review gate proof/i.test(routeSearchText(route));
}

export function decideDaoOmenDirectRoute(
  kind: DaoOmenKind,
  route: DaoMandateRoute,
  context: DaoOmenDirectRouteContext = {},
): DaoOmenDirectRouteDecision {
  if (context.playerExpanded) {
    return route.target
      ? allow('player_expanded', 'player explicitly opened detail/source context')
      : hide('player-expanded context cannot expose a route without a target');
  }

  switch (kind) {
    case 'life_setup':
      return daoOmenRouteTargetsSetup(route)
        ? allow('setup', 'missing life setup is a legal repair route')
        : hide('life setup route is hidden because it does not target setup ownership');
    case 'proof_missing':
      return daoOmenRouteTargetsGateTrial(route)
        ? allow('hard_lock', 'gate proof is a legal progression proof inspected by Gate Trial')
        : hide('proof_missing suppresses non-Gate route by default');
    case 'attemptable':
    case 'risky_attempt':
      return daoOmenRouteTargetsGateTrial(route)
        ? allow('hard_lock', 'open gate state may expose Gate Trial inspect route')
        : hide('attemptable/risky omen suppresses non-Gate route by default');
    case 'reflection':
      return route.target
        ? allow('repeated_failure', 'repeated failure pattern may expose one correction route')
        : hide('repeated failure route is hidden because it has no target');
    case 'safety_net_ready':
      return daoOmenRouteTargetsGateTrial(route)
        ? allow('safety_net', 'mercy proof is anti-softlock information owned by Gate Trial')
        : hide('safety_net_ready suppresses non-Gate route by default');
    case 'breakthrough_ready':
      return daoOmenRouteTargetsBreakthrough(route)
        ? allow('breakthrough', 'breakthrough is the intended next state')
        : hide('breakthrough route is hidden because it does not target cultivation');
    case 'reincarnation_viable':
      return daoOmenRouteTargetsPrestigeOrRecords(route)
        ? allow('reincarnation', 'reincarnation is meaningful meta-loop handoff')
        : hide('reincarnation route is hidden because it does not target Prestige or Records');
    case 'content_cap':
      return daoOmenRouteTargetsPrestigeOrRecords(route)
        ? allow('content_cap', 'content cap must be honest without fake future grind')
        : hide('content cap route is hidden because it does not target Prestige or Records');
    default:
      return hide(`ordinary ${kind} omen suppresses direct routes by default`);
  }
}

export function normalizeDaoOmenExposedRoute(
  route: DaoMandateRoute,
  reason: DaoOmenDirectRouteReason,
  kind: DaoOmenKind,
): DaoMandateRoute {
  switch (reason) {
    case 'setup':
      return {
        ...route,
        label: 'Review Life Setup',
        actionLabel: setupActionLabel(route),
        detail: 'Review the missing path or Heart Law before this life proceeds.',
        destinationLabel: 'Cultivation',
      };
    case 'hard_lock':
      return {
        ...route,
        label: kind === 'proof_missing' ? 'Review Gate Proof' : 'Inspect Gate Trial',
        actionLabel: kind === 'attemptable' ? 'Attempt Gate' : 'Inspect Gate Trial',
        detail: 'Gate Trial owns legal proof and attempt detail.',
        destinationLabel: 'Gate Trial',
      };
    case 'repeated_failure':
      return {
        ...route,
        label: reflectionRouteLabel(route),
        actionLabel: reflectionRouteLabel(route),
        detail: 'Review the repeated proof pattern before choosing a correction.',
      };
    case 'safety_net':
      return {
        ...route,
        label: 'Review Mercy Proof',
        actionLabel: 'Review Mercy Proof',
        detail: 'Gate Trial owns the mercy proof and safety net detail.',
        destinationLabel: 'Gate Trial',
      };
    case 'breakthrough':
      return {
        ...route,
        label: 'Breakthrough Proof',
        actionLabel: 'Break Through',
        detail: 'Qi and proof are sealed for the next realm.',
        destinationLabel: 'Cultivation',
      };
    case 'reincarnation':
      return {
        ...route,
        label: 'Reincarnation Decree',
        actionLabel: 'Review Reincarnation',
        detail: 'Review how this life can become permanent progress.',
        destinationLabel: 'Prestige',
      };
    case 'content_cap':
      return {
        ...route,
        label: 'Authored Chapter Complete',
        actionLabel: 'Review Chapter Handoff',
        detail: 'Review the honest handoff for the completed authored chapter.',
      };
    case 'player_expanded':
      return { ...route };
  }
}

function allow(reason: DaoOmenDirectRouteReason, note: string): DaoOmenDirectRouteDecision {
  return { allowed: true, exposeRoute: true, reason, note };
}

function hide(note: string): DaoOmenDirectRouteDecision {
  return { allowed: false, exposeRoute: false, note };
}

function daoOmenRouteTargetsSetup(route: DaoMandateRoute): boolean {
  if (route.target?.kind === 'tab') return route.target.tab === 'cultivation';
  if (route.target?.kind === 'world_module') return route.target.moduleKey === 'gateTrial';
  return /choose path|heart law|life setup|anchor life/i.test(routeSearchText(route));
}

function daoOmenRouteTargetsBreakthrough(route: DaoMandateRoute): boolean {
  if (route.target?.kind !== 'tab') return false;
  return route.target.tab === 'cultivation';
}

function daoOmenRouteTargetsPrestigeOrRecords(route: DaoMandateRoute): boolean {
  if (route.target?.kind !== 'tab') return false;
  return route.target.tab === 'prestige' || route.target.tab === 'records';
}

function setupActionLabel(route: DaoMandateRoute): string {
  const text = routeSearchText(route);
  if (/heart law/i.test(text)) return 'Choose Heart Law';
  if (/path/i.test(text)) return 'Choose Path';
  return 'Review Life Setup';
}

function reflectionRouteLabel(route: DaoMandateRoute): string {
  const text = routeSearchText(route);
  if (/apothecary|medicine|survival/i.test(text)) return 'Review survival evidence';
  if (/forge|weapon|gear/i.test(text)) return 'Review forge pressure';
  if (/technique|manual|doctrine|loadout/i.test(text)) return 'Review doctrine evidence';
  if (/source|herb|ore/i.test(text)) return 'Review source evidence';
  return 'Review reflection';
}

function routeSearchText(route: DaoMandateRoute): string {
  return `${route.id} ${route.label} ${route.actionLabel} ${route.detail} ${route.destinationLabel} ${route.source}`;
}
