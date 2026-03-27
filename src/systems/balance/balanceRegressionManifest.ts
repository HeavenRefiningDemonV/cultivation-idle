export type BalanceRegressionMetricSection =
  | 'timing'
  | 'activities'
  | 'prep'
  | 'combat'
  | 'offline'
  | 'prestige'
  | 'telemetry';

export interface BalanceRegressionMetricManifestEntry {
  id: string;
  section: BalanceRegressionMetricSection;
  lockedByPacket: string;
  owner: string;
}

export const BALANCE_REGRESSION_MANIFEST = Object.freeze([
  { id: 'timing.gate1_available_window', section: 'timing', lockedByPacket: '6.2d', owner: 'phaseTimingTargets' },
  { id: 'timing.foundation_entry_window', section: 'timing', lockedByPacket: '6.2d', owner: 'phaseTimingTargets' },
  { id: 'timing.city_phase.pinewind', section: 'timing', lockedByPacket: '6.9a', owner: 'phaseTimingTargets' },
  { id: 'timing.city_phase.stonecrag', section: 'timing', lockedByPacket: '6.9a', owner: 'phaseTimingTargets' },
  { id: 'timing.city_phase.spirit_cavern', section: 'timing', lockedByPacket: '6.9a', owner: 'phaseTimingTargets' },
  { id: 'timing.city_phase.lotusford', section: 'timing', lockedByPacket: '6.9a', owner: 'phaseTimingTargets' },
  { id: 'timing.city_phase.ironpeak', section: 'timing', lockedByPacket: '6.9a', owner: 'phaseTimingTargets' },
  { id: 'timing.content_cap_band', section: 'timing', lockedByPacket: '6.2d', owner: 'phaseTimingTargets' },

  { id: 'activities.outskirts_gold_dominance', section: 'activities', lockedByPacket: '6.3a', owner: 'activityThroughputTargets' },
  { id: 'activities.ruins_targeted_dominance', section: 'activities', lockedByPacket: '6.3a', owner: 'activityThroughputTargets' },
  { id: 'activities.bounty_support_primary', section: 'activities', lockedByPacket: '6.3c', owner: 'supportCurrencyTargets' },
  { id: 'activities.expedition_short_ratio', section: 'activities', lockedByPacket: '6.3d', owner: 'activityThroughputTargets' },
  { id: 'activities.expedition_medium_ratio', section: 'activities', lockedByPacket: '6.3d', owner: 'activityThroughputTargets' },
  { id: 'activities.expedition_long_ratio', section: 'activities', lockedByPacket: '6.3d', owner: 'activityThroughputTargets' },

  { id: 'prep.minimum_to_failsafe_ratio', section: 'prep', lockedByPacket: '6.4a', owner: 'prepEconomyTargets' },
  { id: 'prep.recommended_to_failsafe_ratio', section: 'prep', lockedByPacket: '6.4a', owner: 'prepEconomyTargets' },
  { id: 'prep.recovery.consumables_only.gate_3', section: 'prep', lockedByPacket: '6.4b', owner: 'prepRecoveryWindowReadModel' },
  { id: 'prep.recovery.forge_floor_only.gate_3', section: 'prep', lockedByPacket: '6.4b', owner: 'prepRecoveryWindowReadModel' },
  { id: 'prep.recovery.build_correction_only.gate_3', section: 'prep', lockedByPacket: '6.4b', owner: 'prepRecoveryWindowReadModel' },
  { id: 'prep.route_first.consumables', section: 'prep', lockedByPacket: '6.4b', owner: 'prepRecoveryWindowReadModel' },
  { id: 'prep.route_first.forge', section: 'prep', lockedByPacket: '6.4b', owner: 'prepRecoveryWindowReadModel' },
  { id: 'prep.route_first.build_correction', section: 'prep', lockedByPacket: '6.4b', owner: 'prepRecoveryWindowReadModel' },
  { id: 'prep.route_first.reserve', section: 'prep', lockedByPacket: '6.4c', owner: 'supportReservePacingReadModel' },

  { id: 'combat.gate_1.recommended_winrate', section: 'combat', lockedByPacket: '6.5a', owner: 'gateCombatTargets' },
  { id: 'combat.gate_2.recommended_winrate', section: 'combat', lockedByPacket: '6.5a', owner: 'gateCombatTargets' },
  { id: 'combat.gate_3.recommended_winrate', section: 'combat', lockedByPacket: '6.5a', owner: 'gateCombatTargets' },
  { id: 'combat.gate_4.recommended_winrate', section: 'combat', lockedByPacket: '6.5a', owner: 'gateCombatTargets' },
  { id: 'combat.gate_5.recommended_winrate', section: 'combat', lockedByPacket: '6.5a', owner: 'gateCombatTargets' },

  { id: 'offline.base_efficiency', section: 'offline', lockedByPacket: '1.8', owner: 'progressionContract.offline' },
  { id: 'offline.max_efficiency', section: 'offline', lockedByPacket: '1.8', owner: 'progressionContract.offline' },
  { id: 'offline.cap_seconds', section: 'offline', lockedByPacket: '1.8', owner: 'progressionContract.offline' },
  { id: 'offline.reclaim_run_8h_max', section: 'offline', lockedByPacket: '6.6', owner: 'offlineCatchup' },
  { id: 'offline.no_combat_progress', section: 'offline', lockedByPacket: '1.8', owner: 'progressionContract.offline' },

  { id: 'prestige.unlock_floor.core_formation', section: 'prestige', lockedByPacket: '6.7a', owner: 'prestigeTargets' },
  { id: 'prestige.ap_checkpoint.core', section: 'prestige', lockedByPacket: '6.7b', owner: 'prestigeTargets' },
  { id: 'prestige.ap_checkpoint.nascent', section: 'prestige', lockedByPacket: '6.7b', owner: 'prestigeTargets' },
  { id: 'prestige.ap_checkpoint.soul', section: 'prestige', lockedByPacket: '6.7b', owner: 'prestigeTargets' },
  { id: 'prestige.ap_checkpoint.spirit_severing', section: 'prestige', lockedByPacket: '6.7b', owner: 'prestigeTargets' },
  { id: 'prestige.ap_hour.core_floor', section: 'prestige', lockedByPacket: '6.7c', owner: 'prestigeTargets' },
  { id: 'prestige.ap_hour.spirit_severing', section: 'prestige', lockedByPacket: '6.7c', owner: 'prestigeTargets' },
  { id: 'prestige.reclaim.first_viable_core_reset_starter_spend', section: 'prestige', lockedByPacket: '6.7d', owner: 'prestigeTargets' },
  { id: 'prestige.reclaim.deep_cap_reset_starter_spend.nascent_reentry', section: 'prestige', lockedByPacket: '6.7d', owner: 'prestigeTargets' },

  { id: 'telemetry.family.progression', section: 'telemetry', lockedByPacket: '6.8', owner: 'balanceTelemetrySchema' },
  { id: 'telemetry.family.trials', section: 'telemetry', lockedByPacket: '6.8', owner: 'balanceTelemetrySchema' },
  { id: 'telemetry.family.economy', section: 'telemetry', lockedByPacket: '6.8', owner: 'balanceTelemetrySchema' },
  { id: 'telemetry.family.prestige', section: 'telemetry', lockedByPacket: '6.8', owner: 'balanceTelemetrySchema' },
  { id: 'telemetry.family.offline', section: 'telemetry', lockedByPacket: '6.8', owner: 'balanceTelemetrySchema' },
  { id: 'telemetry.kpi.time_to_gate_available', section: 'telemetry', lockedByPacket: '6.8', owner: 'balanceTelemetryReport' },
  { id: 'telemetry.kpi.attempts_per_gate', section: 'telemetry', lockedByPacket: '6.8', owner: 'balanceTelemetryReport' },
] as const satisfies readonly BalanceRegressionMetricManifestEntry[]);

export function listBalanceRegressionMetricIds(): string[] {
  return BALANCE_REGRESSION_MANIFEST.map((entry) => entry.id);
}
