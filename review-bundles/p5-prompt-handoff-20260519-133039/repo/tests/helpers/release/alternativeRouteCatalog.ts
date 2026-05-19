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
    requiredInvariants: [
      'in_slice_only',
      'no_fake_city_six',
      'bypass_resolves_to_bypassed',
    ],
    routeWarningConditions: [
      'post-failure purchase notification missing',
      'unexpected bypass affordability drift',
    ],
    routeIntent: 'Emergency relief verification, not route optimization.',
    coverageMode: 'fully_automated',
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
    requiredInvariants: [
      'in_slice_only',
      'no_fake_city_six',
      'offline_excludes_combat_and_trial_progress',
    ],
    routeWarningConditions: [
      'offline summary missing',
      'offline outpaces active theoretical baseline',
    ],
    routeIntent: 'Idle-heavy viability check with strict combat/trial exclusion.',
    coverageMode: 'fully_automated',
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
    requiredInvariants: [
      'in_slice_only',
      'no_fake_city_six',
      'bounded_interaction_budget',
    ],
    routeWarningConditions: [
      'missing world-command alerts',
      'notification overlay blocks actionable guidance',
    ],
    routeIntent: 'Bounded-attention viability with surfaced recommendations.',
    coverageMode: 'fully_automated',
    knownLimitations: [
      'Uses representative deterministic interaction policy, not human variance.',
    ],
  },
  {
    id: 'high_skill',
    title: 'High-skill / optimizer route verification',
    goal: 'Validate informed play is faster/cleaner while remaining non-degenerate and in-policy.',
    automationMode: 'automated_non_blocking',
    proves: [
      'skillful route pace improves meaningful checkpoints versus representative baseline',
      'economy guidance surfaces can be followed without bypass dominance',
      'exploit-watchlist checks remain non-triggered under tuned constraints',
    ],
    doesNotProve: [
      'perfect speedrun route',
      'global balance superiority for one path in every future packet',
    ],
    requiredLiveSystems: [
      'runPhaseTimingProbe representative + highest_qi variants',
      'spendOrderPolicy + prepBudgetRegistry',
      'prepVsBypassReadModel + supportReservePacingReadModel',
      'economicRecommendationEngine + prestige AP/hour probe',
    ],
    baselineComparisonTarget: 'representative_phase_timing_probe',
    keyAcceptanceChecks: [
      'at least one major checkpoint is faster than representative baseline',
      'prep-vs-bypass emergency-only policy remains true',
      'reserve pacing assumptions remain true',
      'exploit watchlist is produced and non-blocking',
    ],
    requiredInvariants: [
      'in_slice_only',
      'no_fake_city_six',
      'high_skill_not_bypass_dominant',
      'high_skill_within_timing_envelope',
    ],
    routeWarningConditions: [
      'single recommendation loop dominates all phases',
      'ap/hour implications exceed locked policy',
    ],
    routeIntent: 'Reward player skill through cleaner execution without breaking economy/pacing truth.',
    coverageMode: 'hybrid',
    knownLimitations: ['Uses deterministic policy-guided simulation and compares against representative baseline probe.'],
  },
  {
    id: 'reclaim',
    title: 'Reclaim route verification',
    goal: 'Validate post-prestige reclaim acceleration is material, coherent, and policy-aligned.',
    automationMode: 'automated_non_blocking',
    proves: [
      'reclaim milestones are materially faster than first-life baseline',
      'starter spend plan and first-purchase feel satisfy live prestige target family',
      'prestige advisor/life summary surfaces remain coherent during report capture',
    ],
    doesNotProve: [
      'full runtime manual prestige UX coverage for every edge case',
      'future prestige tree expansions',
    ],
    requiredLiveSystems: [
      'runReclaimProbe + runPrestigeApHourProbe',
      'prestigeTargets + prestigeReclaimReadModel',
      'prestigeAdvisorSurface + lifeSummarySurface',
    ],
    baselineComparisonTarget: 'first_life_reclaim_baseline',
    keyAcceptanceChecks: [
      'foundation/core/nascent reclaim milestones improve materially versus baseline',
      'first purchase feel report passes',
      'unsupported prestige nodes remain absent from starter spend plan',
    ],
    requiredInvariants: [
      'in_slice_only',
      'no_fake_city_six',
      'reclaim_material_acceleration',
      'prestige_surface_coherence',
    ],
    routeWarningConditions: [
      'first purchase feel near floor threshold',
      'nascent reclaim acceleration weaker than expected',
    ],
    routeIntent: 'Prove reclaim acceleration quality without inventing a second prestige truth path.',
    coverageMode: 'partially_automated',
    knownLimitations: ['Combines live runtime hydration with target-model reclaim analysis for deterministic repeatability.'],
  },
]);

export const getAlternativeRouteSpec = (routeId: AlternativeRouteSpec['id']): AlternativeRouteSpec | null =>
  ALTERNATIVE_ROUTE_CATALOG.find((entry) => entry.id === routeId) ?? null;
