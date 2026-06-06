import { resolvePrestigeMemoryEffects } from '../../systems/prestige/prestigeMemory.js';

export type PrestigeResetBucketKind = 'reset' | 'carry' | 'rebuilt' | 'hybrid';

export type PrestigeResetBucketLine = {
  id: string;
  kind: PrestigeResetBucketKind;
  label: string;
  detail: string;
  source: 'prestige_reset_service' | 'prestige_store' | 'progression_contract' | 'content' | 'derived';
  confidence: 'high' | 'medium' | 'low';
};

export type PrestigeResetContractSurface = {
  reset: PrestigeResetBucketLine[];
  carry: PrestigeResetBucketLine[];
  rebuilt: PrestigeResetBucketLine[];
  hybrid: PrestigeResetBucketLine[];
};

export const MASTERY_RETENTION_BY_NODE_ID: Readonly<Record<string, number>> = {
  ap_mastery_retention_10: 0.1,
  ap_mastery_retention_25: 0.25,
  ap_mastery_retention_50: 0.5,
};

export const deriveMasteryRetentionCarryOver = (purchasesById: Record<string, number>): number =>
  Object.entries(MASTERY_RETENTION_BY_NODE_ID).reduce((best, [nodeId, ratio]) => {
    const purchasedLevels = purchasesById[nodeId] ?? 0;
    return purchasedLevels > 0 ? Math.max(best, ratio) : best;
  }, 0);

const line = (input: PrestigeResetBucketLine): PrestigeResetBucketLine => input;

export const PRESTIGE_RESET_CONTRACT_BUCKETS = Object.freeze([
  line({
    id: 'realm_progress',
    kind: 'reset',
    label: 'Realm body and Qi progress',
    detail: 'The active realm run, Qi pool, and per-life run counters return to a new-life baseline.',
    source: 'prestige_reset_service',
    confidence: 'high',
  }),
  line({
    id: 'cultivation_state',
    kind: 'reset',
    label: 'Cultivation active state',
    detail: 'Heart Law selection, study state, comprehension, and active cultivation timers are cleared for the new life.',
    source: 'prestige_reset_service',
    confidence: 'high',
  }),
  line({
    id: 'inventory_currencies',
    kind: 'reset',
    label: 'Inventory and currencies',
    detail: 'Items and per-life currencies are reset by the inventory owner before the new-life baseline is restored.',
    source: 'prestige_reset_service',
    confidence: 'high',
  }),
  line({
    id: 'equipment_loadout',
    kind: 'reset',
    label: 'Equipment and loadout state',
    detail: 'Equipped gear and refinement state are hard-reset with the old body.',
    source: 'prestige_reset_service',
    confidence: 'high',
  }),
  line({
    id: 'trial_progress',
    kind: 'reset',
    label: 'Gate trial progress',
    detail: 'Trial attempts, clears, bypasses, and active trial sessions are life-scoped.',
    source: 'prestige_reset_service',
    confidence: 'high',
  }),
  line({
    id: 'ruins_progress',
    kind: 'reset',
    label: 'Ruins progress',
    detail: 'Ruins run records and current ruins state return to the starter-life baseline.',
    source: 'prestige_reset_service',
    confidence: 'high',
  }),
  line({
    id: 'outskirts_progress',
    kind: 'reset',
    label: 'Outskirts progress',
    detail: 'Outskirts zone progress is reset for the next ascent route.',
    source: 'prestige_reset_service',
    confidence: 'high',
  }),
  line({
    id: 'bounty_progress',
    kind: 'reset',
    label: 'Bounties and Merit loops',
    detail: 'Bounty progress is life-scoped and resets with the city support economy.',
    source: 'prestige_reset_service',
    confidence: 'high',
  }),
  line({
    id: 'active_activity',
    kind: 'reset',
    label: 'Active foreground activity',
    detail: 'The central ActivityStore gate is cleared so no prior-life activity remains active.',
    source: 'prestige_reset_service',
    confidence: 'high',
  }),
  line({
    id: 'manual_satchel_pavilion',
    kind: 'reset',
    label: 'Manual satchel and pavilion',
    detail: 'Manual inventory, study state, and pavilion state are reset unless a future live decree says otherwise.',
    source: 'prestige_reset_service',
    confidence: 'high',
  }),
  line({
    id: 'technique_collection',
    kind: 'reset',
    label: 'Technique collection and loadout',
    detail: 'Known techniques are reset; retained mastery is reapplied only as latent memory through retention decrees.',
    source: 'prestige_reset_service',
    confidence: 'high',
  }),
  line({
    id: 'recipe_mastery',
    kind: 'reset',
    label: 'Recipe mastery',
    detail: 'Recipe mastery resets, then eligible retained mastery is restored as partial memory.',
    source: 'prestige_reset_service',
    confidence: 'high',
  }),
  line({
    id: 'profession_queues',
    kind: 'reset',
    label: 'Profession queues',
    detail: 'Alchemy, forge, and talisman queues are emptied for the new life.',
    source: 'prestige_reset_service',
    confidence: 'high',
  }),
  line({
    id: 'expeditions',
    kind: 'reset',
    label: 'Expeditions',
    detail: 'Active expedition runs are cleared; slot count itself remains owned by the expedition store.',
    source: 'prestige_reset_service',
    confidence: 'high',
  }),
  line({
    id: 'craft_session',
    kind: 'reset',
    label: 'Craft session',
    detail: 'Any active craft session is cancelled at reincarnation.',
    source: 'prestige_reset_service',
    confidence: 'high',
  }),
  line({
    id: 'breakthrough_echoes',
    kind: 'reset',
    label: 'Breakthrough echoes',
    detail: 'Current-life breakthrough echoes are archived through the life summary, then cleared for the new life.',
    source: 'prestige_reset_service',
    confidence: 'high',
  }),
  line({
    id: 'training_raw_ratings',
    kind: 'reset',
    label: 'Training raw ratings and stat XP',
    detail: 'Training stat ratings and stat XP are per-life power and reset; Form Memory may reapply only a bounded floor.',
    source: 'prestige_reset_service',
    confidence: 'high',
  }),
  line({
    id: 'training_fatigue_session',
    kind: 'reset',
    label: 'Training fatigue and active session',
    detail: 'Fatigue, active regimen, active intensity, tick timers, and offline summaries are cleared at reincarnation.',
    source: 'prestige_reset_service',
    confidence: 'high',
  }),
  line({
    id: 'dao_heart_turbulence',
    kind: 'reset',
    label: 'Dao Heart clarity and turbulence',
    detail: 'Dao Heart clarity, turbulence, active practice, and current-life risk snapshots reset with the old life.',
    source: 'prestige_reset_service',
    confidence: 'high',
  }),
  line({
    id: 'root_awakening_state',
    kind: 'reset',
    label: 'Root awakening and resonance',
    detail: 'Root resonance and prior-life awakening state reset; only explicit root clarity floors affect the next roll.',
    source: 'prestige_reset_service',
    confidence: 'high',
  }),
  line({
    id: 'combat_state',
    kind: 'reset',
    label: 'Combat state',
    detail: 'Combat is exited or reset by CombatStore; no prior-life fight is resolved outside that owner.',
    source: 'prestige_reset_service',
    confidence: 'high',
  }),
  line({
    id: 'ap',
    kind: 'carry',
    label: 'Ascension Points (AP)',
    detail: 'Available AP, earned AP, and the new ritual gain remain in the prestige ledger.',
    source: 'prestige_store',
    confidence: 'high',
  }),
  line({
    id: 'lifetime_ap',
    kind: 'carry',
    label: 'Lifetime AP',
    detail: 'Lifetime AP earned stays permanent for prestige history and future balancing.',
    source: 'prestige_store',
    confidence: 'high',
  }),
  line({
    id: 'purchases',
    kind: 'carry',
    label: 'Purchased decrees',
    detail: 'Runtime-live prestige purchases remain owned and are reapplied after the reset.',
    source: 'prestige_store',
    confidence: 'high',
  }),
  line({
    id: 'prestige_history',
    kind: 'carry',
    label: 'Run history and life count',
    detail: 'Prestige count and bounded run history remain in the ledger.',
    source: 'prestige_store',
    confidence: 'high',
  }),
  line({
    id: 'last_life_summary',
    kind: 'carry',
    label: 'Completed-life summary',
    detail: 'The prepared life summary is captured before reset and remains viewable afterward.',
    source: 'prestige_store',
    confidence: 'high',
  }),
  line({
    id: 'city_baseline',
    kind: 'rebuilt',
    label: 'City baseline (starter city)',
    detail: 'City progression is reset and initialized from live content, starting at the first city.',
    source: 'content',
    confidence: 'high',
  }),
  line({
    id: 'new_spirit_root',
    kind: 'rebuilt',
    label: 'Spirit root (new roll)',
    detail: 'The prior root is remembered in the life summary, but the next life rolls a fresh root.',
    source: 'prestige_store',
    confidence: 'high',
  }),
  line({
    id: 'root_clarity_floor',
    kind: 'rebuilt',
    label: 'Root Clarity floor',
    detail: 'Purchased Root Clarity clamps the next spirit-root grade floor to the MP5 rank value without retaining the old root.',
    source: 'prestige_store',
    confidence: 'high',
  }),
  line({
    id: 'heart_law_unlocks',
    kind: 'rebuilt',
    label: 'Heart Law decree unlocks',
    detail: 'Purchased Heart Law tiers are recomputed from live prestige effects when the new life begins.',
    source: 'progression_contract',
    confidence: 'medium',
  }),
  line({
    id: 'technique_slots',
    kind: 'rebuilt',
    label: 'Technique slot decrees',
    detail: 'Purchased technique-slot decrees are recomputed and applied to the technique store.',
    source: 'progression_contract',
    confidence: 'medium',
  }),
  line({
    id: 'mastery_retention_active',
    kind: 'hybrid',
    label: 'Latent mastery memory',
    detail: 'Technique XP and recipe mastery are partially restored only when a mastery retention decree has been purchased.',
    source: 'prestige_reset_service',
    confidence: 'high',
  }),
] satisfies PrestigeResetBucketLine[]);

const NO_RETENTION_LINE: PrestigeResetBucketLine = line({
  id: 'mastery_retention_inactive',
  kind: 'hybrid',
  label: 'No mastery retention decree active',
  detail: 'Technique and recipe mastery reset completely until a Root Memory retention decree is purchased.',
  source: 'derived',
  confidence: 'high',
});

const activeRetentionLine = (carryOver: number): PrestigeResetBucketLine => line({
  id: 'mastery_retention_active',
  kind: 'hybrid',
  label: `Latent mastery memory ${Math.round(carryOver * 100)}%`,
  detail: 'Technique XP and recipe mastery are partially restored as memory; techniques or recipes may still need to be relearned before use.',
  source: 'prestige_reset_service',
  confidence: 'high',
});

const memoryLine = (input: PrestigeResetBucketLine): PrestigeResetBucketLine => line(input);

export function classifyPrestigeResetBucket(id: string): PrestigeResetBucketLine | null {
  return PRESTIGE_RESET_CONTRACT_BUCKETS.find((line) => line.id === id) ?? null;
}

export function getPrestigeResetContractSurface(input?: {
  purchasesById?: Record<string, number>;
}): PrestigeResetContractSurface {
  const carryOver = deriveMasteryRetentionCarryOver(input?.purchasesById ?? {});
  const effects = resolvePrestigeMemoryEffects(input?.purchasesById ?? {});
  const buckets = [...PRESTIGE_RESET_CONTRACT_BUCKETS];
  const hybrid = carryOver > 0 ? [activeRetentionLine(carryOver)] : [NO_RETENTION_LINE];
  if (effects.formMemoryRank > 0) {
    hybrid.push(memoryLine({
      id: 'form_memory',
      kind: 'hybrid',
      label: `Form Memory floor +${effects.formMemoryFloor}`,
      detail: 'A bounded starting path stat floor is applied within the current realm cap; raw stat XP is not retained.',
      source: 'prestige_reset_service',
      confidence: 'high',
    }));
  }
  if (effects.scriptureEchoRank > 0) {
    hybrid.push(memoryLine({
      id: 'scripture_echo',
      kind: 'hybrid',
      label: `Scripture Echo ${Math.round(effects.scriptureVerseRetentionPct * 100)}%`,
      detail: 'Same-law verse mastery echo and Heart Law XP catch-up are retained only through explicit memory.',
      source: 'prestige_reset_service',
      confidence: 'high',
    }));
  }
  if (effects.calmFirstBreathRank > 0) {
    hybrid.push(memoryLine({
      id: 'calm_first_breath',
      kind: 'hybrid',
      label: `Calm First Breath -${effects.calmFirstBreathRiskReduction} risk`,
      detail: 'Breakthrough risk reduction applies only when Heart Law is at parity with cultivation.',
      source: 'derived',
      confidence: 'high',
    }));
  }
  if (effects.oldSparringRank > 0) {
    hybrid.push(memoryLine({
      id: 'old_sparring_shadows',
      kind: 'hybrid',
      label: `Old Sparring Shadows +${Math.round(effects.oldSparringMasteryCatchupMultiplier * 100)}%`,
      detail: 'Regimen mastery catch-up applies only until the previous milestone is reached.',
      source: 'prestige_reset_service',
      confidence: 'high',
    }));
  }

  return {
    reset: buckets.filter((line) => line.kind === 'reset'),
    carry: buckets.filter((line) => line.kind === 'carry'),
    rebuilt: buckets.filter((line) => line.kind === 'rebuilt'),
    hybrid,
  };
}
