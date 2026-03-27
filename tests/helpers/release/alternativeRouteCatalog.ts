import type { AlternativeRouteSpec } from './alternativeRouteTypes.js';

export const ALTERNATIVE_ROUTE_CATALOG: readonly AlternativeRouteSpec[] = Object.freeze([
  {
    id: 'fail_safe',
    title: 'Fail-safe / Safety Net verification',
    goal: 'Validate the emergency bypass route is honest, threshold-gated, and non-dominant.',
    automationMode: 'automated_non_blocking',
    proves: [
      'eligible defeats gate availability',
      'bypass purchase routes through live fix action and trial lifecycle state',
      'bypass resolves to bypassed (not cleared) and run can continue',
    ],
    doesNotProve: [
      'full combat balance retuning',
      'every gate in a single deterministic simulation',
    ],
    requiredLiveSystems: [
      'trialLifecycle',
      'trialStore.recordFailure/markBypassed',
      'postFailureFixActions.performSafetyNetPurchase path',
      'prepVsBypassReadModel + supportReservePacingReadModel',
    ],
    baselineComparisonTarget: 'prep_vs_bypass_economy_policy',
    keyAcceptanceChecks: [
      'locked before threshold',
      'eligible failures increment threshold',
      'purchase available only after threshold + affordability',
      'emergency_only comparison remains true',
    ],
    knownLimitations: [
      'Uses deterministic trial failure recording instead of full combat-death loop to keep CI stable.',
    ],
  },
  {
    id: 'offline_heavy',
    title: 'Offline-heavy verification',
    goal: 'Validate repeated offline windows remain meaningful without skipping combat/gate truths.',
    automationMode: 'automated_non_blocking',
    proves: [
      'offline pipeline affects cultivation/professions/expeditions only',
      'combat and trial clears do not progress from offline',
      'offline route remains coherent and in-slice',
    ],
    doesNotProve: [
      'absolute pacing preference for all players',
      'future semester content pacing',
    ],
    requiredLiveSystems: [
      'buildOfflineContext',
      'OfflineCatchup.apply',
      'professionStore offline apply',
      'expeditionStore offline tick',
    ],
    baselineComparisonTarget: 'active_qi_theoretical_baseline',
    keyAcceptanceChecks: [
      'no trial clear from offline',
      'no combat progress from offline',
      'offline windows recorded with contribution families',
    ],
    knownLimitations: [
      'Comparison baseline is representative/theoretical, not a full active-route replay.',
    ],
  },
  {
    id: 'low_attention',
    title: 'Low-attention verification',
    goal: 'Validate bounded-interaction play is viable and guided by live surfaces.',
    automationMode: 'automated_non_blocking',
    proves: [
      'run compass/status/world alerts provide actionable signals',
      'interaction budget remains bounded',
      'route remains viable without constant babysitting',
    ],
    doesNotProve: [
      'zero-click autoplay',
      'perfectly minimal click count for every build/path',
    ],
    requiredLiveSystems: [
      'runCompass',
      'worldCommandSurface',
      'statusTroubleshootingSurface',
      'notificationPolicy',
    ],
    baselineComparisonTarget: 'bounded_attention_budget',
    keyAcceptanceChecks: [
      'alert-triggered interactions dominate non-alert interventions',
      'critical handoff moments are surfaced by guidance',
      'no out-of-slice leaks',
    ],
    knownLimitations: [
      'Uses representative deterministic interaction policy, not human variance.',
    ],
  },
  {
    id: 'high_skill',
    title: 'High-skill / optimizer route (placeholder)',
    goal: 'Reserved for packet 7.3d extension.',
    automationMode: 'manual_coverage',
    proves: [],
    doesNotProve: ['Not implemented in packet 7.3a-c.'],
    requiredLiveSystems: [],
    baselineComparisonTarget: 'tbd_7_3d',
    keyAcceptanceChecks: [],
    knownLimitations: ['Placeholder only.'],
  },
  {
    id: 'reclaim',
    title: 'Reclaim route (placeholder)',
    goal: 'Reserved for packet 7.3e extension.',
    automationMode: 'manual_coverage',
    proves: [],
    doesNotProve: ['Not implemented in packet 7.3a-c.'],
    requiredLiveSystems: [],
    baselineComparisonTarget: 'tbd_7_3e',
    keyAcceptanceChecks: [],
    knownLimitations: ['Placeholder only.'],
  },
]);

export const getAlternativeRouteSpec = (routeId: AlternativeRouteSpec['id']): AlternativeRouteSpec | null =>
  ALTERNATIVE_ROUTE_CATALOG.find((entry) => entry.id === routeId) ?? null;
