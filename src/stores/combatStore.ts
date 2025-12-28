import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  CombatState,
  CombatContext,
  EnemyDefinition,
  CombatLogEntry,
  EnemyMechanic,
  CombatBuff,
  CombatResources,
  CombatShield,
  CombatTechniqueLogEntry,
  CombatEvent,
} from '../types';
import type { TechniqueDef } from '../content';
import type { OutskirtsDef, OutskirtsDropsConfig } from '../content';
import { useGameStore } from './gameStore';
import { useZoneStore } from './zoneStore';
import { useInventoryStore } from './inventoryStore';
import { useContentStore } from './contentStore';
import { useActivityStore } from './activityStore';
import { useOutskirtsStore } from './outskirtsStore';
import { useCityStore } from './cityStore';
import { useTrialStore } from './trialStore';
import { useRuinsStore } from './ruinsStore';
import { useTechniqueStore, type AiProfile, type CastingPolicy } from './techniqueStore';
import { useBountyStore } from './bountyStore';
import { useHeartLawStore } from './heartLawStore';
import { masteryLevelFromXp, rankMultiplier, useTechCollectionStore } from './techCollectionStore';
import { D, subtract, greaterThan, lessThanOrEqualTo, add, clamp } from '../utils/numbers';
import { BossMechanics } from '../systems/bossMechanics';
import { generateLoot, formatLootMessage } from '../systems/loot';
import { RewardService, applyLootBonuses, type RewardBundle, type RewardItemBundle } from '../services/rewards';
import { getTalismanBonusesNow } from './buffStore';
import { createEnemy } from '../systems/enemyFactory';
import type { NormalizedEffect } from '../systems/techniques/effects';
import { applyRankMultiplier, classifyTechnique, normalizeTechniqueEffects, summarizeEffects } from '../systems/techniques/effects';
import { getHeartLawBonuses } from '../systems/heartLaw/heartLawLogic';
import { getSpiritRootSnapshot } from './gameStore';
import { COMBAT_ACTIVITY_TYPES } from '../types/activity';
import { COMPREHENSION_EVENT_BONUSES } from '../content/tuning/cultivationTuning';
import { buildTrialDefeatSummary } from '../systems/combat/trialModel';
import { applyAiProfileBias, getTechniqueAiTags } from '../systems/combat/aiProfiles';
import { useUIStore } from './uiStore';


function getHeartLawCombatMultiplier(): number {
  const selectedId = useHeartLawStore.getState().selectedHeartLawId;
  if (!selectedId) return 1;
  const heartLawDef = useContentStore.getState().maps.heartLawsById[selectedId] ?? null;
  if (!heartLawDef) return 1;
  const bonuses = getHeartLawBonuses({
    heartLawDef,
    chapter: useHeartLawStore.getState().chapter,
    spiritRoot: getSpiritRootSnapshot(),
  });
  return bonuses.combatDamageMult ?? 1;
}

/**
 * Defense constant for damage calculation
 * Damage = ATK * (1 - DEF/(DEF + K))
 */
export const DEFENSE_CONSTANT_K = 100;

/**
 * Combat timing constants (in milliseconds)
 */
export const PLAYER_ATTACK_COOLDOWN = 1000;  // 1 second between attacks
export const ENEMY_ATTACK_COOLDOWN = 1500;   // 1.5 seconds between enemy attacks
const MAX_COMBAT_LOG_ENTRIES = 100;   // Limit log size for performance
const OUTSKIRTS_NEXT_FIGHT_DELAY_MS = 700;
const MAX_TECHNIQUE_LOG_ENTRIES = 50;
const MAX_COMBAT_EVENT_ENTRIES = 200;
const DEFAULT_SHIELD_DURATION_SEC = 12;
const DEFAULT_BUFF_DURATION_SEC = 10;
const QI_REGEN_PER_SEC_PCT = 0.02;
const INTENT_REGEN_PER_SEC = 10;
const AI_DECISION_INTERVAL_MS = 250;
const MIN_TECHNIQUE_CAST_INTERVAL_MS = 300;
const PASSIVE_BUFF_DURATION_SEC = 999999;

/**
 * Boss mechanics instance (single instance per combat)
 */
let bossMechanics: BossMechanics | null = null;

let combatLoopErrorLogged = false;

function randomIntInRange(range: [number, number] | undefined, fallback: [number, number] = [0, 0]): number {
  const [minRaw, maxRaw] = Array.isArray(range) && range.length === 2 ? range : fallback;
  const min = Number.isFinite(minRaw) ? Number(minRaw) : fallback[0];
  const max = Number.isFinite(maxRaw) ? Number(maxRaw) : fallback[1];
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

function randomFromList<T>(list: T[]): T | null {
  if (!Array.isArray(list) || list.length === 0) return null;
  const index = Math.floor(Math.random() * list.length);
  return list[index] ?? null;
}

const makeCombatEventId = (at: number) => `${at}-${Math.random().toString(16).slice(2, 10)}`;

function valueByIndex<T>(
  source: Record<number, T> | T[] | undefined,
  index: number,
  fallback: T,
): T {
  if (Array.isArray(source)) {
    return source[index] ?? source[source.length - 1] ?? fallback;
  }

  if (source && typeof source === 'object') {
    const byIndex = (source as Record<number, T>)[index];
    if (byIndex !== undefined) return byIndex;

    const values = Object.values(source as Record<number, T>);
    if (values.length > 0) return values[values.length - 1] ?? fallback;
  }

  return fallback;
}

function pickFromWeightedPool(
  pool: { enemyId: string; weight: number }[],
  fallbackId?: string,
): string | null {
  if (!Array.isArray(pool) || pool.length === 0) return fallbackId ?? null;
  const totalWeight = pool.reduce((sum, entry) => sum + (entry.weight ?? 0), 0);
  if (totalWeight <= 0) return fallbackId ?? pool[0]?.enemyId ?? null;

  let roll = Math.random() * totalWeight;
  for (const entry of pool) {
    roll -= entry.weight ?? 0;
    if (roll <= 0) return entry.enemyId;
  }

  return pool[pool.length - 1]?.enemyId ?? fallbackId ?? null;
}

function collapseItems(items: RewardItemBundle[]): RewardItemBundle[] {
  const merged = new Map<string, number>();

  items.forEach((item) => {
    if (!item?.itemId || typeof item.qty !== 'number' || item.qty <= 0) return;
    merged.set(item.itemId, (merged.get(item.itemId) ?? 0) + item.qty);
  });

  return Array.from(merged.entries()).map(([itemId, qty]) => ({ itemId, qty }));
}

function resolveCombatResourceModel(resourceModel?: string): 'qiPct' | 'intent' | 'none' {
  const normalized = (resourceModel ?? '').toLowerCase();
  if (normalized.includes('heaven') || normalized.includes('qi')) {
    return 'qiPct';
  }
  if (normalized.includes('martial') || normalized.includes('intent')) {
    return 'intent';
  }
  return 'none';
}

function buildCombatResources(): CombatResources {
  const gameState = useGameStore.getState();
  const qiValue = Number.isFinite(D(gameState.qi).toNumber()) ? D(gameState.qi).toNumber() : 0;
  const maxQi = Math.max(100, qiValue);
  const maxIntent = 100;

  return {
    qi: Math.min(qiValue, maxQi),
    maxQi,
    intent: maxIntent,
    maxIntent,
  };
}

const DEBUFF_TAGS = ['burn', 'poison', 'bleed', 'dot', 'debuff', 'curse', 'slow'];

function hasDebuffSignal(def: TechniqueDef | undefined, effects: NormalizedEffect[]): boolean {
  if (!def) return false;
  const tags = (def.tags ?? []).map((tag) => tag.toLowerCase());
  if (tags.some((tag) => DEBUFF_TAGS.includes(tag))) return true;
  return effects.some((effect) => effect.type === 'addStatus');
}

type ResourceAfterCastInfo = {
  resourceAfterPct: number;
  resourceModel: 'qiPct' | 'intent' | 'none';
};

function computeResourceAfterCastPct(
  def: TechniqueDef,
  costReductionPct: number,
  resources: CombatResources,
): ResourceAfterCastInfo {
  const resourceModel = resolveCombatResourceModel(def.resourceModel);
  const resourceCost = def.resourceCost ?? 0;
  const effectiveCost = resourceCost * (1 - costReductionPct);

  if (resourceModel === 'qiPct') {
    const costPct = effectiveCost > 1 ? effectiveCost / 100 : effectiveCost;
    const cost = resources.maxQi * costPct;
    const remaining = Math.max(0, resources.qi - cost);
    const pct = resources.maxQi > 0 ? remaining / resources.maxQi : 0;
    return { resourceAfterPct: pct, resourceModel };
  }

  if (resourceModel === 'intent') {
    const remaining = Math.max(0, resources.intent - effectiveCost);
    const pct = resources.maxIntent > 0 ? remaining / resources.maxIntent : 0;
    return { resourceAfterPct: pct, resourceModel };
  }

  return { resourceAfterPct: 1, resourceModel: 'none' };
}

const mapAiProfileToCastingPolicy = (
  profile: AiProfile,
  fallback?: CastingPolicy,
): CastingPolicy => {
  if (fallback) return fallback;
  switch (profile) {
    case 'burst':
      return 'aggressive';
    case 'survivor':
      return 'defensive';
    case 'farmer':
      return 'balanced';
    default:
      return 'balanced';
  }
};

type CandidateScoreInput = {
  policy: CastingPolicy;
  hpPct: number;
  isBossFight: boolean;
  shieldMissingOrExpiring: boolean;
  reservePct: number;
  resourceAfterPct: number;
  damageScore: number;
  defensiveScore: number;
  debuffScore: number;
  classification: ReturnType<typeof classifyTechnique>;
  hasShield: boolean;
};

function computeCandidateScore(input: CandidateScoreInput): number {
  const {
    policy,
    hpPct,
    isBossFight,
    shieldMissingOrExpiring,
    reservePct,
    resourceAfterPct,
    damageScore,
    defensiveScore,
    debuffScore,
    classification,
    hasShield,
  } = input;

  if (policy === 'aggressive') {
    let score = damageScore;
    if (classification.isBurst) score += 2;
    if (classification.isUltimate) score += isBossFight ? 2 : 1;
    if (defensiveScore > 0) {
      score += hpPct < 0.25 ? defensiveScore * 2 : -2;
    }
    return score;
  }

  if (policy === 'balanced') {
    let score = damageScore;
    score += debuffScore * 1.5;
    if (classification.isAoE) score += 0.5;
    if (defensiveScore > 0 && hpPct < 0.6) score += 1;
    if (reservePct > 0 && resourceAfterPct < reservePct) score -= 10;
    return score;
  }

  // defensive
  let score = damageScore * 0.6 + defensiveScore;
  if (shieldMissingOrExpiring && hasShield) {
    score += 2;
  }
  if (hpPct < 0.7 && defensiveScore > 0) {
    score += 2;
  }
  if (classification.isBurst || classification.isUltimate) {
    if (hpPct < 0.75) score -= 6;
    if (hpPct < 0.6) score -= 6;
  }
  if (reservePct > 0 && resourceAfterPct < reservePct) score -= 10;
  return score;
}

function getBasePlayerCombatStats() {
  const stats = useGameStore.getState().stats;
  return {
    atk: D(stats.atk).toNumber(),
    def: D(stats.def).toNumber(),
    maxHp: D(stats.maxHp).toNumber(),
    crit: stats.crit,
    critDmg: stats.critDmg,
    dodge: stats.dodge,
    speed: stats.speed,
  };
}

function resolveStatKey(stat: string): keyof ReturnType<typeof getBasePlayerCombatStats> | null {
  const normalized = stat.trim().toLowerCase();
  if (['atk', 'attack'].includes(normalized)) return 'atk';
  if (['def', 'defense'].includes(normalized)) return 'def';
  if (['hp', 'maxhp', 'max_hp', 'max hp'].includes(normalized)) return 'maxHp';
  if (['crit', 'critical'].includes(normalized)) return 'crit';
  if (['critdmg', 'crit_dmg', 'crit dmg'].includes(normalized)) return 'critDmg';
  if (['dodge', 'evasion'].includes(normalized)) return 'dodge';
  if (['speed', 'haste'].includes(normalized)) return 'speed';
  return null;
}

function getEffectivePlayerCombatStats(combatBuffs: CombatBuff[], now: number) {
  const base = getBasePlayerCombatStats();
  const updated = { ...base };

  combatBuffs
    .filter((buff) => buff.endsAt > now)
    .forEach((buff) => {
      const key = resolveStatKey(buff.stat);
      if (!key) return;
      const current = updated[key];
      const nextValue = buff.mode === 'pct' ? current * (1 + buff.value) : current + buff.value;
      updated[key] = nextValue;
    });

  updated.atk = Math.max(0, updated.atk);
  updated.def = Math.max(0, updated.def);
  updated.maxHp = Math.max(1, updated.maxHp);
  updated.crit = Math.max(0, updated.crit);
  updated.critDmg = Math.max(0, updated.critDmg);
  updated.dodge = Math.max(0, updated.dodge);
  updated.speed = Math.max(0, updated.speed);

  return updated;
}

function resolveShieldDurationSec(effect: unknown): number | null {
  if (!effect || typeof effect !== 'object') return null;
  if (Array.isArray(effect)) return null;
  const type = (effect as any).type;
  if (type !== 'shield') return null;
  const duration = (effect as any).durationSec;
  return typeof duration === 'number' && Number.isFinite(duration) ? duration : null;
}

function buildOutskirtsRewards(
  outskirtsDef: OutskirtsDef,
  dropsConfig: OutskirtsDropsConfig | undefined,
  cityIndex: number,
  isBoss: boolean,
): RewardBundle {
  const idx = Math.max(0, cityIndex ?? 0);
  const drops = dropsConfig ?? {};

  const mobGoldRange = valueByIndex<[number, number]>(drops.mobGoldByCityIndex, idx, [2, 6]);
  const mobCommonChance = drops.mobCommonMatChance ?? 0.35;
  const mobDoubleChance = drops.mobDoubleMatChance ?? 0.1;
  const mobRareChance = drops.mobRareMatChance ?? 0.02;

  const bossGoldRange = valueByIndex<[number, number]>(drops.bossGoldByCityIndex, idx, [20, 40]);
  const bossMatCountRange = valueByIndex<[number, number]>(drops.bossMatCountRangeByCityIndex, idx, [2, 4]);
  const bossRareChance = valueByIndex(drops.bossRareMatChanceByCityIndex, idx, 0.1);
  const bossSpiritChance = valueByIndex(drops.bossSpiritStoneChanceByCityIndex, idx, 0);
  const bossSpiritRange = valueByIndex<[number, number]>(drops.bossSpiritStoneRangeByCityIndex, idx, [0, 0]);

  const bundle: RewardBundle = { currencies: {} };
  const items: RewardItemBundle[] = [];

  if (isBoss) {
    const gold = randomIntInRange(bossGoldRange, bossGoldRange);
    bundle.currencies = { ...bundle.currencies, gold: gold.toString() };

    const matCount = Math.max(0, randomIntInRange(bossMatCountRange, bossMatCountRange));
    const commonPool = outskirtsDef.matPools?.common ?? [];
    for (let i = 0; i < matCount; i += 1) {
      const mat = randomFromList(commonPool);
      if (mat) items.push({ itemId: mat, qty: 1 });
    }

    const rarePool = outskirtsDef.matPools?.rare ?? [];
    const rareChance = bossRareChance ?? 0;
    if (rarePool.length > 0 && Math.random() < rareChance) {
      const rareMat = randomFromList(rarePool);
      if (rareMat) items.push({ itemId: rareMat, qty: 1 });
    }

    if (Math.random() < bossSpiritChance) {
      const spiritQty = randomIntInRange(bossSpiritRange, bossSpiritRange);
      if (spiritQty > 0) {
        bundle.currencies = { ...bundle.currencies, spiritStones: spiritQty.toString() };
      }
    }
  } else {
    const gold = randomIntInRange(mobGoldRange, mobGoldRange);
    bundle.currencies = { ...bundle.currencies, gold: gold.toString() };

    const commonPool = outskirtsDef.matPools?.common ?? [];
    const rarePool = outskirtsDef.matPools?.rare ?? [];

    const commonChance = mobCommonChance ?? 0;
    const doubleChance = mobDoubleChance ?? 0;
    const rareChance = mobRareChance ?? 0;

    if (commonPool.length > 0 && Math.random() < commonChance) {
      const mat = randomFromList(commonPool);
      if (mat) items.push({ itemId: mat, qty: 1 });
      if (Math.random() < doubleChance) {
        const second = randomFromList(commonPool);
        if (second) items.push({ itemId: second, qty: 1 });
      }
    }

    if (rarePool.length > 0 && Math.random() < rareChance) {
      const rareMat = randomFromList(rarePool);
      if (rareMat) items.push({ itemId: rareMat, qty: 1 });
    }
  }

  const collapsedItems = collapseItems(items);
  if (collapsedItems.length > 0) {
    bundle.items = collapsedItems;
  }

  return applyLootBonuses(bundle, 'outskirts');
}

/**
 * Extended Combat State
 */
interface ExtendedCombatState extends CombatState {
  resetCombat: () => void;
  hardResetCombat: () => void;
}

const createInitialCombatState = () => ({
  inCombat: false,
  currentZone: null as string | null,
  currentEnemy: null as EnemyDefinition | null,
  combatContext: { type: null } as CombatContext,
  playerHP: '0',
  playerMaxHP: '0',
  enemyHP: '0',
  enemyMaxHP: '0',
  combatLog: [] as CombatLogEntry[],
  autoAttack: false,
  autoCombatAI: false,
  lastAttackTime: 0,
  lastEnemyAttackTime: 0,
  techniqueCooldowns: {} as Record<string, number>,
  lastTechniqueCastAt: 0,
  nextAiDecisionAt: 0,
  combatShield: null as CombatShield | null,
  combatBuffs: [] as CombatBuff[],
  combatResources: buildCombatResources(),
  techniqueLog: [] as CombatTechniqueLogEntry[],
  events: [] as CombatEvent[],
  isBoss: false,
  combatStartTime: 0,
  enemyMechanics: [] as EnemyMechanic[],
  activeAura: null as ExtendedCombatState['activeAura'],
});

/**
 * Combat store managing all combat state and actions
 */
export const useCombatStore = create<ExtendedCombatState>()(
  immer((set, get) => {
    const applyCombatShield = (damage: ReturnType<typeof D>, now: number) => {
      let remainingDamage = damage;
      let absorbed = D(0);

      set((state) => {
        const shield = state.combatShield;
        if (!shield) return;
        if (shield.expiresAt !== null && shield.expiresAt <= now) {
          state.combatShield = null;
          return;
        }
        const shieldAmount = D(shield.amount);
        if (shieldAmount.lessThanOrEqualTo(0)) {
          state.combatShield = null;
          return;
        }

        const absorbAmount = remainingDamage.lessThan(shieldAmount) ? remainingDamage : shieldAmount;
        absorbed = absorbAmount;
        remainingDamage = remainingDamage.minus(absorbAmount);

        const nextAmount = shieldAmount.minus(absorbAmount).toNumber();
        if (nextAmount <= 0) {
          state.combatShield = null;
        } else if (state.combatShield) {
          state.combatShield.amount = nextAmount;
        }
      });

      return { remainingDamage, absorbed };
    };

    const addTechniqueLogEntry = (
      kind: CombatTechniqueLogEntry['kind'],
      message: string,
      techId?: string,
      at: number = Date.now(),
    ) => {
      set((state) => {
        state.techniqueLog.push({ at, kind, message, techId });
        if (state.techniqueLog.length > MAX_TECHNIQUE_LOG_ENTRIES) {
          state.techniqueLog.shift();
        }
      });
    };

    const emitEvent = (event: Omit<CombatEvent, 'id' | 'at'> & Partial<Pick<CombatEvent, 'id' | 'at'>>) => {
      const at = event.at ?? Date.now();
      get().pushEvent({ ...event, at } as CombatEvent);
    };

    const applyPassiveTechniques = (now: number) => {
      const contentStore = useContentStore.getState();
      const techCollection = useTechCollectionStore.getState();
      const passiveIds = useTechniqueStore.getState().getCombatEquippedTechIds().passive;

      if (passiveIds.length === 0) return;

      passiveIds.forEach((techId) => {
        if (!techCollection.hasTech(techId)) return;
        const techDef = contentStore.maps.techniquesById[techId];
        if (!techDef) return;

        const rank = techCollection.unlockedTechs[techId]?.rank ?? 1;
        const rankMult = rankMultiplier(rank);
        const scaling = getTechniqueScaling(techId, techDef);
        const effects = applyRankMultiplier(
          normalizeTechniqueEffects(techDef),
          rankMult,
        ).filter((effect) => effect.type === 'buff');
        if (effects.length === 0) return;

        set((state) => {
          effects.forEach((effect) => {
            const buffId = `${techId}:${effect.stat}`;
            state.combatBuffs = state.combatBuffs.filter((buff) => buff.id !== buffId);
            state.combatBuffs.push({
              id: buffId,
              stat: effect.stat,
              mode: effect.mode,
              value: effect.value * rankMult * scaling.traitMods.buffMult * scaling.runeMods.buffMult,
              endsAt: now + PASSIVE_BUFF_DURATION_SEC * 1000,
            });
          });
        });
      });
    };

    const selectTechniqueToCast = (now: number) => {
      const state = get();
      if (!state.inCombat || !state.currentEnemy) return null;
      if (now - state.lastTechniqueCastAt < MIN_TECHNIQUE_CAST_INTERVAL_MS) return null;

      const loadout = useTechniqueStore.getState().getSelectedLoadout();
      const uiSettings = useUIStore.getState().settings;
      const aiProfile: AiProfile =
        uiSettings?.combatAIProfile ?? (loadout?.aiProfile as AiProfile | undefined) ?? 'balanced';
      const castingPolicy = mapAiProfileToCastingPolicy(
        aiProfile,
        loadout?.castingPolicy as CastingPolicy | undefined,
      );
      const techCollection = useTechCollectionStore.getState();
      const contentStore = useContentStore.getState();
      const equipped = useTechniqueStore.getState().getCombatEquippedTechIds();
      const candidateIds = [...equipped.active];

      if (equipped.ultimate) {
        candidateIds.push(equipped.ultimate);
      }

      const uniqueCandidates = Array.from(new Set(candidateIds));

      type Candidate = {
        techId: string;
        def: TechniqueDef;
        classification: ReturnType<typeof classifyTechnique>;
        effects: NormalizedEffect[];
        aiTags: ReturnType<typeof getTechniqueAiTags>;
        damageScore: number;
        defensiveScore: number;
        debuffScore: number;
        hasShield: boolean;
        resourceAfterPct: number;
      };

      const hp = D(state.playerHP);
      const maxHp = D(state.playerMaxHP);
      const hpPct = maxHp.greaterThan(0) ? hp.dividedBy(maxHp).toNumber() : 0;
      const isBossFight = state.isBoss || state.combatContext.type === 'trial';
      const enemyHp = D(state.enemyHP);
      const enemyMaxHp = D(state.enemyMaxHP);
      const enemyHpPct = enemyMaxHp.greaterThan(0) ? enemyHp.dividedBy(enemyMaxHp).toNumber() : 0;
      const shieldMissingOrExpiring =
        !state.combatShield ||
        (state.combatShield.expiresAt !== null && state.combatShield.expiresAt <= now + 3000);

      const candidates = uniqueCandidates.reduce<Candidate[]>((acc, techId) => {
        if (!techCollection.hasTech(techId)) return acc;
        const def = contentStore.maps.techniquesById[techId];
        if (!def) return acc;
        if (!get().canCastTechnique(techId, now)) return acc;

        const scaling = getTechniqueScaling(techId, def);
        const effects = normalizeTechniqueEffects(def, { includeSecondary: scaling.secondaryUnlocked });
        const classification = classifyTechnique(def);
        const aiTags = getTechniqueAiTags(def, effects);
        const cooldownSec = Math.max(1, def.cooldownSec ?? 0);
        const damageMults = effects
          .filter((effect) => effect.type === 'damage')
          .map((effect) => effect.mult);
        const damageMult = damageMults.length ? Math.max(...damageMults) : 0;
        const damageScore = damageMult > 0 ? damageMult / cooldownSec : 0;

        const hasHeal = effects.some((effect) => effect.type === 'heal');
        const hasShield = effects.some((effect) => effect.type === 'shield');
        const hasDefBuff = effects.some(
          (effect) => effect.type === 'buff' && /def|hp|resist/i.test(effect.stat)
        );

        let defensiveScore = 0;
        if (hasHeal) defensiveScore += 5;
        if (hasShield) defensiveScore += 4;
        if (hasDefBuff) defensiveScore += 3;

        const debuffScore = hasDebuffSignal(def, effects) ? 2 : 0;
        const { resourceAfterPct } = computeResourceAfterCastPct(def, scaling.costReductionPct, state.combatResources);

        acc.push({
          techId,
          def,
          classification,
          effects,
          aiTags,
          damageScore,
          defensiveScore,
          debuffScore,
          hasShield,
          resourceAfterPct,
        });
        return acc;
      }, []);

      if (candidates.length === 0) return null;

      const reservePct = castingPolicy === 'defensive' ? 0.2 : castingPolicy === 'balanced' ? 0.12 : 0;
      const isPlayerDebuffed = false;

      const scored = candidates.map((candidate) => {
        const baseScore = computeCandidateScore({
          policy: castingPolicy,
          hpPct,
          isBossFight,
          shieldMissingOrExpiring,
          reservePct,
          resourceAfterPct: candidate.resourceAfterPct,
          damageScore: candidate.damageScore,
          defensiveScore: candidate.defensiveScore,
          debuffScore: candidate.debuffScore,
          classification: candidate.classification,
          hasShield: candidate.hasShield,
        });

        const score = applyAiProfileBias(baseScore, candidate.aiTags, candidate.classification, {
          profile: aiProfile,
          hpPct,
          enemyHpPct,
          enemyIsBoss: isBossFight,
          isPlayerDebuffed,
        });

        return { ...candidate, score };
      });

      if (castingPolicy === 'defensive' && hpPct < 0.55) {
        const defensiveCandidates = scored
          .filter((entry) => entry.defensiveScore > 0)
          .sort((a, b) => b.defensiveScore - a.defensiveScore || b.score - a.score);
        if (defensiveCandidates.length > 0) {
          return defensiveCandidates[0]?.techId ?? null;
        }
      }

      scored.sort((a, b) => b.score - a.score);
      const best = scored[0];
      if (!best) return null;
      if (best.score > 0) return best.techId;

      return castingPolicy === 'aggressive' ? best.techId : null;
    };

    const getTechniqueScaling = (techId: string, technique?: TechniqueDef) => {
      const techCollection = useTechCollectionStore.getState();
      const entry = techCollection.unlockedTechs[techId];
      const masteryLevel = masteryLevelFromXp(entry?.masteryXp ?? 0);
      const milestoneEffects = techCollection.getMasteryMilestoneEffects(masteryLevel);
      const isBoss = get().isBoss || get().combatContext.type === 'trial';
      const traitMods = techCollection.getTraitModifiers(techId, isBoss);
      const runeMods = techCollection.getRuneModifiers(techId, technique);
      const masteryCdr = techCollection.getMasteryCooldownReductionPct(techId);
      const masteryCostReduction = techCollection.getMasteryCostReductionPct(techId);
      const masteryEffectMult = techCollection.getMasteryEffectMultiplier(techId);

      const economy = useContentStore.getState().raw?.economy?.manualSystem;
      const heavenBonus = economy?.grades?.heaven?.mastery75PotencyBonus;
      const secondaryUnlocked = milestoneEffects.secondaryUnlocked;
      const secondaryPotencyMult =
        entry?.manualGrade === 'heaven' && masteryLevel >= 75 && secondaryUnlocked
          ? 1 + (typeof heavenBonus === 'number' ? heavenBonus : 0.25)
          : 1;

      const cooldownReductionPct = Math.min(
        0.3,
        traitMods.cooldownReductionPct + runeMods.cooldownReductionPct + masteryCdr,
      );
      const costReductionPct = Math.min(
        0.4,
        traitMods.costReductionPct + runeMods.costReductionPct + masteryCostReduction,
      );

      return {
        traitMods,
        runeMods,
        cooldownReductionPct,
        costReductionPct,
        masteryEffectMult,
        secondaryUnlocked,
        secondaryPotencyMult,
        isBoss,
      };
    };

    return {
      // Initial state
      ...createInitialCombatState(),

    /**
     * Enter combat with an enemy
     */
    enterCombat: (zone: string, enemy: EnemyDefinition) => {
      const playerStats = useGameStore.getState().stats;
      const now = Date.now();

      // Initialize boss mechanics if this is a boss
      const isBoss = enemy.isBoss || false;
      if (isBoss) {
        bossMechanics = new BossMechanics();
        console.log('[CombatStore] Boss mechanics initialized for', enemy.name);
      } else {
        bossMechanics = null;
      }

      combatLoopErrorLogged = false;

      set((state) => {
        state.inCombat = true;
        state.currentZone = zone;
        state.currentEnemy = enemy;
        state.combatContext = { type: null };
        state.enemyMechanics = (enemy as EnemyDefinition & { mechanics?: EnemyMechanic[] }).mechanics || [];
        state.activeAura = null;

        // Initialize HP
        state.playerHP = playerStats.hp;
        state.playerMaxHP = playerStats.maxHp;
        state.enemyHP = enemy.hp;
        state.enemyMaxHP = enemy.hp;

        // Clear combat log
        state.combatLog = [];
        state.events = [];

        // Reset timing
        state.lastAttackTime = now;
        state.lastEnemyAttackTime = now;
        state.techniqueCooldowns = {};
        state.lastTechniqueCastAt = 0;
        state.nextAiDecisionAt = now + AI_DECISION_INTERVAL_MS;
        state.combatShield = null;
        state.combatBuffs = [];
        state.combatResources = buildCombatResources();
        state.techniqueLog = [];

        // Boss tracking
        state.isBoss = isBoss;
        state.combatStartTime = now;
      });

      // Add entry to log
      if (isBoss) {
        get().addLogEntry('system', `⚠️ BOSS FIGHT: ${enemy.name}!`, '#f59e0b');
        emitEvent({ type: 'BOSS_SPAWN', enemyId: enemy.id, enemyName: enemy.name });
      } else {
        get().addLogEntry('system', `Combat started with ${enemy.name}!`, '#fbbf24');
      }

      applyPassiveTechniques(now);
    },



    /**
     * Start combat from a content-driven enemy template.
     *
     * This is the foundation entrypoint for city modules (Outskirts / Trials / Ruins).
     * Enemy stats are currently derived from player stats with simple multipliers and
     * will be refined when module-specific scaling is implemented.
     */
    startCombat: (enemyTemplateId: string, context: CombatContext) => {
      const playerStats = useGameStore.getState().stats;
      const now = Date.now();
      const contentStore = useContentStore.getState();

      const template = contentStore.maps.enemiesById[enemyTemplateId];
      if (!template) {
        console.warn('[CombatStore] Unknown enemy template', enemyTemplateId);
        return;
      }

      const tags = Array.isArray(template?.tags) ? template!.tags : [];
      const role = typeof template?.role === 'string' ? template!.role : 'mob';
      const contextCityId = context && 'cityId' in context ? (context as any).cityId : undefined;
      const contextCityIndex = context && 'cityIndex' in context ? (context as any).cityIndex : undefined;
      const cityIndex = typeof contextCityIndex === 'number'
        ? contextCityIndex
        : contextCityId
          ? contentStore.maps.citiesById[contextCityId]?.index ?? 0
          : 0;

      const isBoss =
        (context && 'isBoss' in context ? (context as any).isBoss : undefined) ??
        (role === 'boss' || tags.includes('boss'));

      const roomIndex = context?.type === 'ruins' ? context.roomIndex ?? 0 : 0;
      const roomCount = context?.type === 'ruins' ? context.roomCount ?? 1 : 1;
      const difficulty: 'outskirts' | 'trial' | 'ruins' | 'generic' =
        context?.type === 'ruins' ? 'ruins' : context?.type === 'trial' ? 'trial' : 'outskirts';

      if (context?.type === 'trial' && context.trialId) {
        const trialStore = useTrialStore.getState();
        if (trialStore.activeTrialSessionId !== context.trialId) {
          trialStore.beginTrialSession(context.trialId, now);
        } else {
          trialStore.setAttemptStart(context.trialId, now);
        }
      }

      const enemyScaled = createEnemy(enemyTemplateId, {
        cityIndex,
        isBoss,
        playerPowerSnapshot: {
          atk: playerStats.atk,
          def: playerStats.def,
          maxHp: playerStats.maxHp,
        },
        difficulty,
        roomIndex,
        roomCount,
      });

      const enemy: EnemyDefinition & { mechanics?: EnemyMechanic[] } = {
        id: enemyScaled.id,
        name: enemyScaled.name,
        level: enemyScaled.level,
        zone: context?.type ? context.type : 'unknown',
        hp: enemyScaled.maxHp,
        atk: enemyScaled.atk,
        def: enemyScaled.def,
        crit: enemyScaled.critChance ?? (isBoss ? 10 : 5),
        critDmg: isBoss ? 170 : 150,
        dodge: enemyScaled.dodgeChance ?? (isBoss ? 6 : 4),
        speed: enemyScaled.speed ?? 1.0,
        goldReward: enemyScaled.goldDrop ?? '0',
        expReward: enemyScaled.exp ?? '0',
        isBoss: enemyScaled.isBoss,
        mechanics: enemyScaled.mechanics ?? (Array.isArray(template?.mechanics)
          ? (template!.mechanics as unknown as EnemyMechanic[])
          : []),
      };

      // Initialize boss mechanics if this is a boss
      if (enemy.isBoss) {
        bossMechanics = new BossMechanics();
        console.log('[CombatStore] Boss mechanics initialized for', enemy.name);
      } else {
        bossMechanics = null;
      }

      set((state) => {
        state.inCombat = true;
        state.currentZone = null;
        state.currentEnemy = enemy;
        state.combatContext = context ?? { type: null };
        state.enemyMechanics = enemy.mechanics || [];
        state.activeAura = null;

        // Initialize HP
        state.playerHP = playerStats.hp;
        state.playerMaxHP = playerStats.maxHp;
        state.enemyHP = enemy.hp;
        state.enemyMaxHP = enemy.hp;

        // Clear combat log
        state.combatLog = [];
        state.events = [];

        // Reset timing
        state.lastAttackTime = now;
        state.lastEnemyAttackTime = now;
        state.techniqueCooldowns = {};
        state.lastTechniqueCastAt = 0;
        state.nextAiDecisionAt = now + AI_DECISION_INTERVAL_MS;
        state.combatShield = null;
        state.combatBuffs = [];
        state.combatResources = buildCombatResources();
        state.techniqueLog = [];

        // Boss tracking
        state.isBoss = isBoss;
        state.combatStartTime = now;
      });

      if (enemy.isBoss) {
        get().addLogEntry('system', `⚠️ BOSS FIGHT: ${enemy.name}!`, '#f59e0b');
        emitEvent({ type: 'BOSS_SPAWN', enemyId: enemy.id, enemyName: enemy.name });
      } else {
        get().addLogEntry('system', `Combat started with ${enemy.name}!`, '#fbbf24');
      }

      applyPassiveTechniques(now);
    },

    /**
     * End combat via a simple victory/defeat flag.
     *
     * This is a convenience wrapper for module callers.
     */
    endCombat: (victory: boolean) => {
      if (!get().inCombat) return;
      if (victory) get().defeatEnemy();
      else get().playerDefeat();
    },
    /**
     * Exit combat and clean up state
     */
    exitCombat: () => {
      // Clean up boss mechanics
      bossMechanics = null;

      const contextSnapshot = get().combatContext;
      if (contextSnapshot?.type === 'trial') {
        useTrialStore.getState().resetSession(contextSnapshot.trialId);
      }

      set((state) => {
        state.inCombat = false;
        state.currentZone = null;
        state.currentEnemy = null;
        state.combatContext = { type: null };
        state.playerHP = '0';
        state.playerMaxHP = '0';
        state.enemyHP = '0';
        state.enemyMaxHP = '0';
        state.lastAttackTime = 0;
        state.lastEnemyAttackTime = 0;
        state.techniqueCooldowns = {};
        state.lastTechniqueCastAt = 0;
        state.nextAiDecisionAt = 0;
        state.combatShield = null;
        state.combatBuffs = [];
        state.combatResources = buildCombatResources();
        state.techniqueLog = [];
        state.events = [];
        state.isBoss = false;
        state.combatStartTime = 0;
        state.enemyMechanics = [];
        state.activeAura = null;
      });
    },

    resetCombat: () => {
      bossMechanics = null;

      set((state) => {
        Object.assign(state, createInitialCombatState());
      });
    },

    hardResetCombat: () => {
      bossMechanics = null;
      set((state) => {
        Object.assign(state, createInitialCombatState());
      });
    },

    /**
     * Player attacks the current enemy
     */
    playerAttack: () => {
      const state = get();
      if (!state.inCombat || !state.currentEnemy) return;

      const now = Date.now();
      if (now - state.lastAttackTime < PLAYER_ATTACK_COOLDOWN) return;

      if (lessThanOrEqualTo(state.enemyHP, 0) || lessThanOrEqualTo(state.playerHP, 0)) return;

      const effectiveStats = getEffectivePlayerCombatStats(state.combatBuffs, now);
      const enemy = state.currentEnemy;

      // Check if enemy dodges
      const dodgeRoll = Math.random() * 100;
      if (dodgeRoll < enemy.dodge) {
        get().addLogEntry('player', `${enemy.name} dodged your attack!`, '#94a3b8');
        set((state) => {
          state.lastAttackTime = now;
        });
        return;
      }

      // Calculate base damage: ATK * (1 - DEF/(DEF + K))
      const atk = D(effectiveStats.atk);
      const def = D(enemy.def);
      const defReduction = def.dividedBy(def.plus(DEFENSE_CONSTANT_K));
      const baseDamage = atk.times(D(1).minus(defReduction));

      const bonusPct = Math.max(0, getTalismanBonusesNow().damageBonusPct);
      const damageMultiplier = D(1).plus(D(bonusPct).dividedBy(100));
      const heartLawMultiplier = D(getHeartLawCombatMultiplier());

      // Check for critical hit
      const critRoll = Math.random() * 100;
      const isCrit = critRoll < effectiveStats.crit;
      const critMultiplier = isCrit ? D(effectiveStats.critDmg).dividedBy(100) : D(1);

      const finalDamage = baseDamage.times(damageMultiplier).times(heartLawMultiplier).times(critMultiplier);
      const currentEnemyHp = D(state.enemyHP);
      const appliedDamage = currentEnemyHp.lessThan(finalDamage) ? currentEnemyHp : finalDamage;

      get().addLogEntry(
        isCrit ? 'damage' : 'player',
        isCrit
          ? `Critical hit! You deal ${appliedDamage.toFixed(0)} damage!`
          : `You deal ${appliedDamage.toFixed(0)} damage.`,
        isCrit ? '#f59e0b' : '#60a5fa'
      );

      // Apply damage to enemy
      set((state) => {
        const newHP = subtract(state.enemyHP, finalDamage.toString());
        const clampedHP = clamp(newHP, 0, state.enemyMaxHP);
        state.enemyHP = clampedHP.toString();
        state.lastAttackTime = now;
      });

      emitEvent({
        type: 'HIT',
        source: 'player',
        target: 'enemy',
        amount: appliedDamage.toFixed(0),
        isCrit,
        kind: 'basic',
      });

      // Check if enemy is defeated
      if (lessThanOrEqualTo(get().enemyHP, 0)) {
        setTimeout(() => {
          get().defeatEnemy();
        }, 500);
      }
    },

    /**
     * Enemy attacks the player
     */
    enemyAttack: () => {
      const state = get();
      if (!state.inCombat || !state.currentEnemy) return;

      const now = Date.now();
      if (now - state.lastEnemyAttackTime < ENEMY_ATTACK_COOLDOWN) return;

      if (lessThanOrEqualTo(state.playerHP, 0) || lessThanOrEqualTo(state.enemyHP, 0)) return;

      const gameStore = useGameStore.getState();
      const effectiveStats = getEffectivePlayerCombatStats(state.combatBuffs, now);
      const enemy = state.currentEnemy;

      // Check if player dodges
      const dodgeRoll = Math.random() * 100;
      if (dodgeRoll < effectiveStats.dodge) {
        get().addLogEntry('enemy', `You dodged ${enemy.name}'s attack!`, '#94a3b8');
        set((state) => {
          state.lastEnemyAttackTime = now;
        });
        return;
      }

      // Calculate base damage: ATK * (1 - DEF/(DEF + K))
      let enemyAttackPower = D(enemy.atk);

      // Apply boss enrage multiplier
      if (state.isBoss && bossMechanics) {
        const enrageMultiplier = bossMechanics.getEnrageMultiplier();
        if (enrageMultiplier > 1) {
          enemyAttackPower = enemyAttackPower.times(enrageMultiplier);
        }
      }

      const def = D(effectiveStats.def);
      const defReduction = def.dividedBy(def.plus(DEFENSE_CONSTANT_K));
      const baseDamage = enemyAttackPower.times(D(1).minus(defReduction));

      // Check for critical hit
      const critRoll = Math.random() * 100;
      const isCrit = critRoll < enemy.crit;
      const critMultiplier = isCrit ? D(enemy.critDmg).dividedBy(100) : D(1);
      const damageAfterCrit = baseDamage.times(critMultiplier);

      const { remainingDamage: damageAfterCombatShield, absorbed: combatAbsorbed } = applyCombatShield(
        damageAfterCrit,
        now
      );
      const { remainingDamage, absorbed } = gameStore.applyAbsorptionShield(damageAfterCombatShield.toString());
      const damageAfterAbsorption = D(remainingDamage);
      const absorbedAmount = D(absorbed).plus(combatAbsorbed);

      const startingHp = D(state.playerHP);
      const newHP = subtract(state.playerHP, damageAfterAbsorption.toString());
      const clampedHP = clamp(newHP, 0, state.playerMaxHP);
      const appliedDamage = startingHp.minus(D(clampedHP));
      const absorptionNote = absorbedAmount.greaterThan(0) ? ` (${absorbedAmount.toFixed(0)} absorbed)` : '';

      if (damageAfterAbsorption.lessThanOrEqualTo(0)) {
        get().addLogEntry(
          'system',
          `${enemy.name}'s attack was absorbed by your shield!`,
          '#22c55e'
        );
      } else {
        get().addLogEntry(
          isCrit ? 'damage' : 'enemy',
          isCrit
            ? `${enemy.name} lands a critical hit! Takes ${appliedDamage.toFixed(0)} damage!${absorptionNote}`
            : `${enemy.name} deals ${appliedDamage.toFixed(0)} damage.${absorptionNote}`,
          isCrit ? '#ef4444' : '#f87171'
        );
      }

      set((state) => {
        state.playerHP = clampedHP.toString();
        state.lastEnemyAttackTime = now;
      });

      if (damageAfterAbsorption.greaterThan(0) || absorbedAmount.greaterThan(0)) {
        emitEvent({
          type: 'HIT',
          source: 'enemy',
          target: 'player',
          amount: appliedDamage.toFixed(0),
          isCrit,
          absorbed: absorbedAmount.greaterThan(0) ? absorbedAmount.toFixed(0) : undefined,
          kind: 'basic',
        });
      }

      // Check if player is defeated
      if (lessThanOrEqualTo(get().playerHP, 0)) {
        setTimeout(() => {
          get().playerDefeat();
        }, 500);
      }
    },

    /**
     * Handle enemy defeat - award rewards
     */
    defeatEnemy: () => {
      const state = get();
      if (!state.currentEnemy) return;

      const enemy = state.currentEnemy;
      const currentZone = state.currentZone;
      const isBoss = state.isBoss;
      const combatContext = state.combatContext;
      const activityToken = useActivityStore.getState().active?.startedAt;
      const emitLootDrops = (items: RewardItemBundle[] | undefined, reason?: string) => {
        if (!items) return;
        const maps = useContentStore.getState().maps;
        items.forEach((item) => {
          if (!item?.itemId || !item.qty) return;
          const rarity = maps.itemsById[item.itemId]?.rarity ?? 'common';
          emitEvent({ type: 'LOOT_DROP', itemId: item.itemId, qty: item.qty, rarity, reason });
        });
      };

      // Add victory message
      if (isBoss) {
        get().addLogEntry('victory', `🏆 BOSS DEFEATED! ${enemy.name} has fallen!`, '#fbbf24');
        emitEvent({ type: 'BOSS_DEFEATED', enemyId: enemy.id, enemyName: enemy.name });
      } else {
        get().addLogEntry('victory', `Victory! ${enemy.name} has been defeated!`, '#22c55e');
      }

      const gameStore = useGameStore.getState();
      const inventoryStore = useInventoryStore.getState();

      if (combatContext.type === 'trial') {
        const { cityId, trialId, gateItemId, eligible } = combatContext;

        useActivityStore.getState().stopActivity();
        useBountyStore.getState().recordEvent({ type: 'TRIAL_CLEAR', cityId, amount: 1 });
        if (useHeartLawStore.getState().selectedHeartLawId) {
          useHeartLawStore
            .getState()
            .addComprehension(COMPREHENSION_EVENT_BONUSES.trialClear, 'trialClear');
        }

        if (eligible) {
          useTrialStore.getState().markCleared(trialId);
          useCityStore.getState().markGateTrialCleared(cityId);
          const rewards = { items: [{ itemId: gateItemId, qty: 1 }] };
          emitLootDrops(rewards.items, 'Gate Trial clear');
          RewardService.grantRewards(rewards, 'Gate Trial clear');
        } else {
          RewardService.grantRewards({ currencies: { gold: '500' } }, 'Gate Trial (not eligible)');
        }

        setTimeout(() => {
          get().exitCombat();
        }, 500);

        return;
      }

      if (combatContext.type === 'ruins') {
        const { runId, sourceId, cityId, roomIndex } = combatContext;
        const ruinId = sourceId ?? (combatContext as any).ruinsId;
        if (runId && ruinId && cityId) {
          useRuinsStore.getState().handleRoomVictory({ runId, ruinId, cityId, roomIndex });
        } else {
          console.warn('[CombatStore] Missing ruins context data', combatContext);
          useActivityStore.getState().stopActivity();
          useCombatStore.getState().exitCombat();
        }
        return;
      }

      if (combatContext.type === 'outskirts') {
        const { cityId, sourceId } = combatContext;
        const contentStore = useContentStore.getState();
        const outskirtsDef = sourceId ? contentStore.maps.outskirtsById[sourceId] : undefined;

        if (!outskirtsDef) {
          console.warn('[CombatStore] Missing outskirts def for', sourceId);
          setTimeout(() => get().exitCombat(), 500);
          return;
        }

        const cityIndex = combatContext.cityIndex ?? outskirtsDef.cityIndex ?? (cityId
          ? contentStore.maps.citiesById[cityId]?.index ?? 0
          : 0);
        const isBossFight = Boolean(combatContext.isBoss ?? isBoss);

        useOutskirtsStore.getState().recordKill(outskirtsDef.id, isBossFight);
        if (cityId) {
          useBountyStore
            .getState()
            .recordEvent({ type: isBossFight ? 'OUTSKIRTS_BOSS_KILL' : 'OUTSKIRTS_KILL', cityId, amount: 1 });
          if (isBossFight) {
            if (useHeartLawStore.getState().selectedHeartLawId) {
              useHeartLawStore
                .getState()
                .addComprehension(COMPREHENSION_EVENT_BONUSES.outskirtsBoss, 'outskirtsBoss');
            }
          }
        }
        if (isBossFight && cityId) {
          useCityStore.getState().markOutskirtsBossDefeated(cityId);
        }

        const economy = contentStore.raw?.economy;
        const rewards = buildOutskirtsRewards(outskirtsDef, economy?.drops?.outskirts, cityIndex, isBossFight);
        RewardService.grantRewards(rewards, `Outskirts Victory (${isBossFight ? 'Boss' : 'Mob'})`);
        emitLootDrops(rewards.items, isBossFight ? 'Outskirts Boss' : 'Outskirts Victory');

        const { autoContinue, stopAtBoss } = useOutskirtsStore.getState();

        setTimeout(() => {
          get().exitCombat();

          const activity = useActivityStore.getState().active;
          if (
            !activity ||
            activity.type !== 'outskirts' ||
            activity.cityId !== cityId ||
            activity.sourceId !== sourceId ||
            activity.startedAt !== activityToken
          ) {
            return;
          }

          if (stopAtBoss && isBossFight) {
            useActivityStore.getState().stopActivity('outskirts-stop-at-boss');
            return;
          }

          if (!autoContinue) {
            useActivityStore.getState().stopActivity('outskirts-auto-continue-disabled');
            return;
          }

          const latestContent = useContentStore.getState();
          const latestDef = sourceId ? latestContent.maps.outskirtsById[sourceId] : undefined;
          if (!latestDef) return;

          const nextIsBoss = useOutskirtsStore.getState().shouldSpawnBoss(latestDef.id, latestDef);
          const nextEnemyId = nextIsBoss
            ? latestDef.bossId
            : pickFromWeightedPool(latestDef.mobPool, latestDef.mobPool?.[0]?.enemyId);

          if (!nextEnemyId) return;

          get().startCombat(nextEnemyId, {
            type: 'outskirts',
            cityId,
            sourceId,
            cityIndex: latestDef.cityIndex,
            isBoss: nextIsBoss,
          });
        }, OUTSKIRTS_NEXT_FIGHT_DELAY_MS);

        return;
      }

      // Regular combat rewards (zone/enemy)
      // Generate loot
      const zoneProgress = currentZone
        ? useZoneStore.getState().getZoneProgress(currentZone)
        : null;
      const isFirstBossKill = isBoss && zoneProgress ? !zoneProgress.bossDefeated : false;

      const lootResult = generateLoot(
        enemy,
        gameStore.playerLuck,
        gameStore.pityState,
        isBoss,
        isFirstBossKill
      );

      // Add gold to inventory
      inventoryStore.addGold(lootResult.gold);

      // Add items to inventory
      for (const lootItem of lootResult.items) {
        const success = inventoryStore.addItem(lootItem.itemId, lootItem.quantity);
        if (!success) {
          get().addLogEntry('system', '⚠️ Inventory full! Some items were lost.', '#ef4444');
          break;
        }
      }

      emitLootDrops(
        lootResult.items?.map((item) => ({ itemId: item.itemId, qty: item.quantity })),
        isBoss ? 'Boss loot' : 'Victory loot',
      );

      // Format and display loot messages
      const lootMessages = formatLootMessage(lootResult);
      for (const message of lootMessages) {
        if (message.includes('RARE') || message.includes('EPIC') || message.includes('LEGENDARY')) {
          get().addLogEntry('loot', message, '#a855f7');
        } else {
          get().addLogEntry('loot', message, '#fbbf24');
        }
      }

      // Update pity counters
      useGameStore.setState({
        pityState: lootResult.updatedPityState,
      });

      // Record enemy defeat in zone progression
      if (currentZone) {
        if (isBoss) {
          useZoneStore
            .getState()
            .recordBossDefeat(currentZone, gameStore.realm.index);
        } else {
          useZoneStore.getState().recordEnemyDefeat(currentZone, enemy.id);
        }
      }

      // Exit combat after a short delay
      setTimeout(() => {
        get().exitCombat();
      }, 2000);
    },

    /**
     * Handle player defeat
     */
    playerDefeat: () => {
      const state = get();
      if (!state.currentEnemy) return;

      const now = Date.now();
      const enemy = state.currentEnemy;
      const context = state.combatContext;
      const uiSettings = useUIStore.getState().settings;
      const autoRetryOnDeath = uiSettings.autoRetryOnDeath;

      // Add defeat message
      get().addLogEntry(
        'defeat',
        `You have been defeated by ${enemy.name}...`,
        '#ef4444'
      );

      emitEvent({ type: 'PLAYER_DEFEATED', enemyId: enemy.id, enemyName: enemy.name });

      if (context?.type === 'outskirts') {
        if (!autoRetryOnDeath) {
          useActivityStore.getState().stopActivity();
        }
      }

      if (context?.type === 'trial') {
        useActivityStore.getState().stopActivity();

        const summary = buildTrialDefeatSummary({
          trialId: context.trialId,
          events: state.events,
          startedAt: state.combatStartTime,
          endedAt: now,
          enemyHp: state.enemyHP,
          enemyMaxHp: state.enemyMaxHP,
          playerMaxHp: state.playerMaxHP,
          absorptionShield: useGameStore.getState().absorptionShield,
          combatShieldAmount: state.combatShield?.amount ?? 0,
          enemyMechanics: state.enemyMechanics,
        });

        const trialStore = useTrialStore.getState();
        trialStore.recordAttemptSummary(context.trialId, summary);
        trialStore.recordFailure(context.trialId);
      }

      if (context?.type === 'ruins') {
        useActivityStore.getState().stopActivity();
        const ruinId = context.sourceId ?? (context as any).ruinsId;
        if (ruinId) {
          useRuinsStore.getState().handleRunDefeat({
            runId: context.runId,
            ruinId,
            cityId: context.cityId,
            roomIndex: context.roomIndex,
          });
        }
      }

      const shouldRetryOutskirts = autoRetryOnDeath && context?.type === 'outskirts';

      // Add respawn message (no death penalty in idle games usually)
      get().addLogEntry(
        'system',
        'You will respawn shortly...',
        '#94a3b8'
      );

      // Respawn player and exit combat
      setTimeout(() => {
        // Restore player HP
        const playerStats = useGameStore.getState().stats;
        set((state) => {
          state.playerHP = playerStats.maxHp;
        });

        get().exitCombat();

        if (shouldRetryOutskirts) {
          const activity = useActivityStore.getState().active;
          if (activity && activity.type === 'outskirts' && context && context.type === 'outskirts') {
            const content = useContentStore.getState();
            const outskirtsDef = context.sourceId
              ? content.maps.outskirtsById[context.sourceId]
              : undefined;
            if (outskirtsDef) {
              const nextIsBoss = Boolean(context.isBoss ?? state.isBoss ?? state.currentEnemy?.isBoss);
              const nextEnemyId = nextIsBoss
                ? outskirtsDef.bossId
                : pickFromWeightedPool(outskirtsDef.mobPool, outskirtsDef.mobPool?.[0]?.enemyId);
              if (nextEnemyId) {
                setTimeout(() => {
                  get().startCombat(nextEnemyId, {
                    type: 'outskirts',
                    cityId: context.cityId,
                    sourceId: outskirtsDef.id,
                    cityIndex: outskirtsDef.cityIndex,
                    isBoss: nextIsBoss,
                  });
                }, OUTSKIRTS_NEXT_FIGHT_DELAY_MS);
              }
            }
          }
        }
      }, 2000);
    },

    /**
     * Game tick for combat timing
     */
    tick: (deltaTime: number) => {
      const state = get();
      const activeActivity = useActivityStore.getState().active;
      const isForegroundCombat = activeActivity
        ? COMBAT_ACTIVITY_TYPES.includes(activeActivity.type)
        : false;
      const contextType = state.combatContext?.type ?? null;

      if (!isForegroundCombat || (contextType && activeActivity?.type && contextType !== activeActivity.type)) {
        return;
      }

      if (!state.inCombat || !state.currentEnemy) return;

      if (lessThanOrEqualTo(state.playerHP, 0) || lessThanOrEqualTo(state.enemyHP, 0)) return;

      const gameStore = useGameStore.getState();
      gameStore.removeExpiredBuffs();

      const now = Date.now();
      const currentEnemyHP = D(state.enemyHP);
      const currentEnemyMaxHP = D(state.enemyMaxHP);

      set((state) => {
        state.combatBuffs = state.combatBuffs.filter((buff) => buff.endsAt > now);

        if (state.combatShield) {
          const expired = state.combatShield.expiresAt !== null && state.combatShield.expiresAt <= now;
          if (expired || state.combatShield.amount <= 0) {
            state.combatShield = null;
          }
        }

        const qiRegen = state.combatResources.maxQi * QI_REGEN_PER_SEC_PCT * (deltaTime / 1000);
        const intentRegen = INTENT_REGEN_PER_SEC * (deltaTime / 1000);
        state.combatResources.qi = Math.min(state.combatResources.maxQi, state.combatResources.qi + qiRegen);
        state.combatResources.intent = Math.min(
          state.combatResources.maxIntent,
          state.combatResources.intent + intentRegen,
        );
      });

      if (now >= state.nextAiDecisionAt) {
        set((state) => {
          state.nextAiDecisionAt = now + AI_DECISION_INTERVAL_MS;
        });

        const selectedTechId = selectTechniqueToCast(now);
        if (selectedTechId) {
          get().castTechnique(selectedTechId, now, 'ai');
        }
      }

      // Process boss mechanics
      if (state.isBoss && bossMechanics) {
        const combatTime = (now - state.combatStartTime) / 1000; // Convert to seconds
        const mechanics = bossMechanics.update(deltaTime, currentEnemyHP, currentEnemyMaxHP, combatTime);

        // Handle enrage trigger
        if (mechanics.enrageTriggered) {
          get().addLogEntry(
            'system',
            `🔥 ${state.currentEnemy.name} has ENRAGED! Attack power increased by 50%!`,
            '#ef4444'
          );
        }

        // Handle heal trigger
        if (mechanics.healTriggered && mechanics.healAmount) {
          const healedHP = add(state.enemyHP, mechanics.healAmount.toString());
          const cappedHP = greaterThan(healedHP, state.enemyMaxHP) ? state.enemyMaxHP : healedHP.toString();

          set((state) => {
            state.enemyHP = cappedHP;
          });

          get().addLogEntry(
            'system',
            `💚 ${state.currentEnemy.name} heals for ${mechanics.healAmount.toFixed(0)} HP!`,
            '#22c55e'
          );
        }

        // Handle ultimate trigger
        if (mechanics.ultimateTriggered && mechanics.ultimateDamageMultiplier) {
          // Apply massive damage to player
          const effectiveStats = getEffectivePlayerCombatStats(state.combatBuffs, now);
          const enemy = state.currentEnemy;

          // Calculate base damage with ultimate multiplier
          let atk = D(enemy.atk).times(mechanics.ultimateDamageMultiplier);

          // Apply enrage if active
          const enrageMultiplier = bossMechanics.getEnrageMultiplier();
          if (enrageMultiplier > 1) {
            atk = atk.times(enrageMultiplier);
          }

          const def = D(effectiveStats.def);
          const defReduction = def.dividedBy(def.plus(DEFENSE_CONSTANT_K));
          const ultimateDamage = atk.times(D(1).minus(defReduction));

          const { remainingDamage: postCombatShield, absorbed: combatAbsorbed } = applyCombatShield(
            ultimateDamage,
            now
          );
          const { remainingDamage, absorbed } = gameStore.applyAbsorptionShield(
            postCombatShield.toString()
          );
          const damageAfterShield = D(remainingDamage);
          const absorbedAmount = D(absorbed).plus(combatAbsorbed);

          const absorptionNote = absorbedAmount.greaterThan(0)
            ? ` (${absorbedAmount.toFixed(0)} absorbed)`
            : '';

          let appliedDamage = damageAfterShield;

          // Apply damage to player
          set((state) => {
            const startingHp = D(state.playerHP);
            const newHP = subtract(state.playerHP, damageAfterShield.toString());
            const clampedHP = clamp(newHP, 0, state.playerMaxHP);
            appliedDamage = startingHp.minus(D(clampedHP));
            state.playerHP = clampedHP.toString();
          });

          get().addLogEntry(
            'damage',
            `⚡ ${enemy.name} unleashes ULTIMATE ATTACK! Takes ${appliedDamage.toFixed(0)} damage!${absorptionNote}`,
            '#a855f7'
          );

          emitEvent({
            type: 'HIT',
            source: 'enemy',
            target: 'player',
            amount: appliedDamage.toFixed(0),
            isCrit: false,
            absorbed: absorbedAmount.greaterThan(0) ? absorbedAmount.toFixed(0) : undefined,
            kind: 'boss_ultimate',
          });

          // Check if player is defeated
          if (lessThanOrEqualTo(get().playerHP, 0)) {
            setTimeout(() => {
              get().playerDefeat();
            }, 500);
          }

          if (lessThanOrEqualTo(get().playerHP, 0)) {
            return;
          }

          // Reset ultimate triggered flag so it can trigger again
          bossMechanics.resetUltimateTriggered();
        }

        // Handle ultimate warning
        if (mechanics.ultimateWarning && !mechanics.ultimateTriggered) {
          const progress = bossMechanics.getUltimateWarningProgress();
          if (progress === 0) {
            // Just started warning
            get().addLogEntry(
              'system',
              `⚠️ ${state.currentEnemy.name} is charging a powerful attack! (3s)`,
              '#f59e0b'
            );
            emitEvent({
              type: 'ENEMY_SPECIAL_TELEGRAPH',
              specialId: 'boss_ultimate',
              resolvesInMs: 3000,
            });
          }
        }
      }

      // Handle aura mechanics
      const hpPercentRemaining = currentEnemyMaxHP.greaterThan(0)
        ? currentEnemyHP.dividedBy(currentEnemyMaxHP).times(100).toNumber()
        : 0;

      const auraMechanic = state.enemyMechanics.find((mechanic) => mechanic.type === 'aura');
      if (auraMechanic && !state.activeAura && hpPercentRemaining <= auraMechanic.trigger.hpPercent) {
        set((state) => {
          state.activeAura = {
            damagePerSec: auraMechanic.effect.auraDamagePerSec || 0,
            description: auraMechanic.description,
          };
        });

        get().addLogEntry(
          'system',
          `☠️ ${state.currentEnemy.name}'s ${auraMechanic.description || 'aura'} activates!`,
          '#ef4444'
        );
      }

      if (state.activeAura && state.activeAura.damagePerSec > 0) {
        const auraDamage = D(state.activeAura.damagePerSec).times(deltaTime / 1000);
        const { remainingDamage: postCombatShield, absorbed: combatAbsorbed } = applyCombatShield(auraDamage, now);
        const { remainingDamage, absorbed } = gameStore.applyAbsorptionShield(postCombatShield.toString());
        const damageAfterShield = D(remainingDamage);
        const absorbedAmount = D(absorbed).plus(combatAbsorbed);

        if (damageAfterShield.greaterThan(0) || absorbedAmount.greaterThan(0)) {
          let appliedDamage = damageAfterShield;
          set((state) => {
            const startingHp = D(state.playerHP);
            const newHP = subtract(state.playerHP, damageAfterShield.toString());
            const clampedHP = clamp(newHP, 0, state.playerMaxHP);
            appliedDamage = startingHp.minus(D(clampedHP));
            state.playerHP = clampedHP.toString();
          });

          const absorptionNote = absorbedAmount.greaterThan(0)
            ? ` (${absorbedAmount.toFixed(0)} absorbed by shield)`
            : '';

          get().addLogEntry(
            'damage',
            `${state.currentEnemy.name}'s aura deals ${appliedDamage.toFixed(0)} damage${absorptionNote}.`,
            '#ef4444'
          );

          emitEvent({
            type: 'HIT',
            source: 'enemy',
            target: 'player',
            amount: appliedDamage.toFixed(0),
            isCrit: false,
            absorbed: absorbedAmount.greaterThan(0) ? absorbedAmount.toFixed(0) : undefined,
            kind: 'aura',
          });

          if (lessThanOrEqualTo(get().playerHP, 0)) {
            setTimeout(() => {
              get().playerDefeat();
            }, 500);
            return;
          }
        }
      }

      // Auto-attack if enabled
      if (state.autoAttack && now - state.lastAttackTime >= PLAYER_ATTACK_COOLDOWN) {
        try {
          get().playerAttack();
        } catch (error) {
          if (!combatLoopErrorLogged) {
            combatLoopErrorLogged = true;
            console.error('[CombatStore] Error during playerAttack:', error);
            try {
              get().addLogEntry('system', 'Combat halted due to an error. Please report.', '#f87171');
            } catch (logError) {
              console.error('[CombatStore] Failed to log combat error', logError);
            }
          }
          get().exitCombat();
          return;
        }
      }

      // Enemy auto-attacks (skip if ultimate just triggered)
      if (now - state.lastEnemyAttackTime >= ENEMY_ATTACK_COOLDOWN) {
        // Check if enemy is still alive before attacking
        if (greaterThan(state.enemyHP, 0)) {
          try {
            get().enemyAttack();
          } catch (error) {
            if (!combatLoopErrorLogged) {
              combatLoopErrorLogged = true;
              console.error('[CombatStore] Error during enemyAttack:', error);
              try {
                get().addLogEntry('system', 'Combat halted due to an error. Please report.', '#f87171');
              } catch (logError) {
                console.error('[CombatStore] Failed to log combat error', logError);
              }
            }
            get().exitCombat();
            return;
          }
        }
      }

      // Update technique cooldowns
      set((state) => {
        const updatedCooldowns: Record<string, number> = {};
        Object.entries(state.techniqueCooldowns).forEach(([techniqueId, readyAt]) => {
          if (readyAt > now) {
            updatedCooldowns[techniqueId] = readyAt;
          }
        });
        state.techniqueCooldowns = updatedCooldowns;
      });
    },

    canCastTechnique: (techId: string, now: number = Date.now()) => {
      const state = get();
      if (!state.inCombat || !state.currentEnemy) return false;

      const contentStore = useContentStore.getState();
      const techDef = contentStore.maps.techniquesById[techId];
      if (!techDef) return false;

      const readyAt = state.techniqueCooldowns[techId] ?? 0;
      if (now < readyAt) return false;

      const resourceModel = resolveCombatResourceModel(techDef.resourceModel);
      const resourceCost = techDef.resourceCost ?? 0;
      const { costReductionPct } = getTechniqueScaling(techId, techDef);
      const effectiveCost = resourceCost * (1 - costReductionPct);

      if (resourceModel === 'qiPct') {
        const costPct = effectiveCost > 1 ? effectiveCost / 100 : effectiveCost;
        const cost = state.combatResources.maxQi * costPct;
        return state.combatResources.qi >= cost;
      }

      if (resourceModel === 'intent') {
        return state.combatResources.intent >= effectiveCost;
      }

      return true;
    },

    castTechnique: (techId: string, now: number = Date.now(), source: 'ai' | 'manual' = 'ai') => {
      const state = get();
      if (!state.inCombat || !state.currentEnemy) return false;

      const contentStore = useContentStore.getState();
      const techDef = contentStore.maps.techniquesById[techId];
      if (!techDef) {
        addTechniqueLogEntry('warn', `Unknown technique ${techId}.`, techId, now);
        return false;
      }

      if (!get().canCastTechnique(techId, now)) {
        addTechniqueLogEntry('warn', `${techDef.name} is not ready or lacks resources.`, techId, now);
        return false;
      }

      const rank = useTechCollectionStore.getState().unlockedTechs[techId]?.rank ?? 1;
      const rankMult = rankMultiplier(rank);
      const scaling = getTechniqueScaling(techId, techDef);
      const effects = applyRankMultiplier(
        normalizeTechniqueEffects(techDef, { includeSecondary: scaling.secondaryUnlocked }),
        rankMult,
      );
      addTechniqueLogEntry('cast', `${techDef.name} (${source})`, techId, now);

      emitEvent({ type: 'SKILL_CAST', techniqueId: techId, source, at: now });

      set((state) => {
        const resourceModel = resolveCombatResourceModel(techDef.resourceModel);
        const resourceCost = techDef.resourceCost ?? 0;
        const effectiveCost = resourceCost * (1 - scaling.costReductionPct);

        if (resourceModel === 'qiPct') {
          const costPct = effectiveCost > 1 ? effectiveCost / 100 : effectiveCost;
          const cost = state.combatResources.maxQi * costPct;
          state.combatResources.qi = Math.max(0, state.combatResources.qi - cost);
        } else if (resourceModel === 'intent') {
          state.combatResources.intent = Math.max(0, state.combatResources.intent - effectiveCost);
        }

        const baseCdSec = techDef.cooldownSec ?? 0;
        if (baseCdSec > 0) {
          const cdSec = Math.max(0, baseCdSec * (1 - scaling.cooldownReductionPct));
          state.techniqueCooldowns[techId] = now + cdSec * 1000;
        }

        state.lastTechniqueCastAt = now;
      });

      const xpGain = techDef.type === 'passive' ? 0 : 1;
      if (xpGain > 0) {
        useTechCollectionStore.getState().addMasteryXp(techId, xpGain, now);
      }

      if (effects.length === 0) {
        addTechniqueLogEntry('warn', `${techDef.name} has no effects to apply.`, techId, now);
        return true;
      }

      const effectSummaries = summarizeEffects(effects);
      effectSummaries.forEach((summary) => addTechniqueLogEntry('effect', summary, techId, now));

      const effectiveStats = getEffectivePlayerCombatStats(get().combatBuffs, now);
      const maxHp = D(effectiveStats.maxHp);

      effects.forEach((effect) => {
        switch (effect.type) {
          case 'damage': {
            const bonusPct = Math.max(0, getTalismanBonusesNow().damageBonusPct);
            const damageMultiplier = D(1).plus(D(bonusPct).dividedBy(100));
            const heartLawMultiplier = D(getHeartLawCombatMultiplier());
            const masteryMult = scaling.masteryEffectMult ?? 1;
            const secondaryPotency = effect.source === 'secondary' ? scaling.secondaryPotencyMult : 1;
            const critRoll = Math.random() * 100;
            const isCrit = critRoll < effectiveStats.crit;
            const critMultiplier = isCrit ? D(effectiveStats.critDmg).dividedBy(100) : D(1);
            const damage = D(effectiveStats.atk)
              .times(
                effect.mult * masteryMult * secondaryPotency * scaling.traitMods.damageMult * scaling.runeMods.damageMult,
              )
              .times(damageMultiplier)
              .times(heartLawMultiplier)
              .times(critMultiplier);
            let appliedDamage = damage;
            set((state) => {
              const startingHp = D(state.enemyHP);
              const newHP = subtract(state.enemyHP, damage.toString());
              const clampedHP = clamp(newHP, 0, state.enemyMaxHP);
              appliedDamage = startingHp.minus(D(clampedHP));
              state.enemyHP = clampedHP.toString();
            });
            emitEvent({
              type: 'HIT',
              source: 'player',
              target: 'enemy',
              amount: appliedDamage.toFixed(0),
              isCrit,
              techniqueId: techId,
              kind: 'technique',
            });
            break;
          }
          case 'heal': {
            const masteryMult = scaling.masteryEffectMult ?? 1;
            const secondaryPotency = effect.source === 'secondary' ? scaling.secondaryPotencyMult : 1;
            const healAmount = maxHp.times(
              effect.mult * masteryMult * secondaryPotency * scaling.traitMods.healMult * scaling.runeMods.healMult,
            );
            let actualHeal = healAmount;
            set((state) => {
              const startingHp = D(state.playerHP);
              const newHP = startingHp.plus(healAmount);
              const cappedHP = newHP.greaterThan(maxHp) ? maxHp : newHP;
              actualHeal = cappedHP.minus(startingHp);
              state.playerHP = cappedHP.toString();
            });
            emitEvent({ type: 'HEAL', amount: actualHeal.toFixed(0), techniqueId: techId });
            break;
          }
          case 'shield': {
            const masteryMult = scaling.masteryEffectMult ?? 1;
            const secondaryPotency = effect.source === 'secondary' ? scaling.secondaryPotencyMult : 1;
            const shieldAmount = maxHp
              .times(
                effect.mult * masteryMult * secondaryPotency * scaling.traitMods.shieldMult * scaling.runeMods.shieldMult,
              )
              .toNumber();
            const durationSec = resolveShieldDurationSec(techDef.effect) ?? DEFAULT_SHIELD_DURATION_SEC;
            const expiresAt = now + durationSec * 1000;
            let totalShield = shieldAmount;
            set((state) => {
              if (!state.combatShield) {
                state.combatShield = { amount: shieldAmount, expiresAt };
                return;
              }
              state.combatShield.amount += shieldAmount;
              totalShield = state.combatShield.amount;
              if (state.combatShield.expiresAt === null || state.combatShield.expiresAt < expiresAt) {
                state.combatShield.expiresAt = expiresAt;
              }
            });
            emitEvent({
              type: 'SHIELD_GAINED',
              amount: shieldAmount.toFixed(0),
              total: totalShield.toFixed(0),
              durationSec: durationSec,
              techniqueId: techId,
            });
            break;
          }
          case 'buff': {
            const durationSec = effect.durationSec ?? DEFAULT_BUFF_DURATION_SEC;
            const buffId = `${techId}:${effect.stat}`;
            const masteryMult = scaling.masteryEffectMult ?? 1;
            const secondaryPotency = effect.source === 'secondary' ? scaling.secondaryPotencyMult : 1;
            const hadExisting = get().combatBuffs.some((buff) => buff.id === buffId);
            set((state) => {
              state.combatBuffs = state.combatBuffs.filter((buff) => buff.id !== buffId);
              state.combatBuffs.push({
                id: buffId,
                stat: effect.stat,
                mode: effect.mode,
                value:
                  effect.value *
                  masteryMult *
                  secondaryPotency *
                  scaling.traitMods.buffMult *
                  scaling.runeMods.buffMult,
                endsAt: now + durationSec * 1000,
              });
            });
            emitEvent({
              type: 'STATUS_APPLIED',
              statusId: `buff:${effect.stat}`,
              stacks: 1,
              durationSec,
              refreshed: hadExisting,
              techniqueId: techId,
              target: 'player',
            });
            break;
          }
          case 'addStatus':
            addTechniqueLogEntry('effect', `${techDef.name} applied a status (stub).`, techId, now);
            break;
          default:
            break;
        }
      });

      if (lessThanOrEqualTo(get().enemyHP, 0)) {
        setTimeout(() => {
          get().defeatEnemy();
        }, 500);
      }

      return true;
    },

    /**
     * Add an entry to the combat log
     */
    addLogEntry: (type: CombatLogEntry['type'], text: string, color: string) => {
      set((state) => {
        const entry: CombatLogEntry = {
          type,
          text,
          timestamp: Date.now(),
          color,
        };

        state.combatLog.push(entry);

        // Limit log size for performance
        if (state.combatLog.length > MAX_COMBAT_LOG_ENTRIES) {
          state.combatLog.shift();
        }
      });
    },

    pushEvent: (event: CombatEvent) => {
      const at = event.at ?? Date.now();
      const entry: CombatEvent = { ...event, at, id: event.id ?? makeCombatEventId(at) };

      set((state) => {
        state.events.push(entry);
        const overflow = state.events.length - MAX_COMBAT_EVENT_ENTRIES;
        if (overflow > 0) {
          state.events.splice(0, overflow);
        }
      });
    },

    clearEvents: () => {
      set((state) => {
        state.events = [];
      });
    },

    /**
     * Toggle auto-attack
     */
    setAutoAttack: (enabled: boolean) => {
      set((state) => {
        state.autoAttack = enabled;
      });

      if (enabled) {
        get().addLogEntry('system', 'Auto-attack enabled.', '#94a3b8');
      } else {
        get().addLogEntry('system', 'Auto-attack disabled.', '#94a3b8');
      }
    },

    /**
     * Toggle auto-combat AI (for techniques)
     */
    setAutoCombatAI: (enabled: boolean) => {
      set((state) => {
        state.autoCombatAI = enabled;
      });

      if (enabled) {
        get().addLogEntry('system', 'Combat AI enabled.', '#94a3b8');
      } else {
        get().addLogEntry('system', 'Combat AI disabled.', '#94a3b8');
      }
    },
  };
  })
);
