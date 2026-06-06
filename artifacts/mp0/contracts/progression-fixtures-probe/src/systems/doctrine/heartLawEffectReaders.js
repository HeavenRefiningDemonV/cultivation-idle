import { VERSE_COMPREHENSION_THRESHOLD } from '../../content/tuning/cultivationTuning.js';
const DOMAIN_WEIGHTS = {
    cultivation: 1.5,
    profession: 1.25,
    economy: 1.0,
    breakthrough: 1.5,
    utility: 1.0,
    combat: 1.0,
};
const RAW_KEY_DOMAIN = Object.freeze({
    cultivateQiMult: 'cultivation',
    offlineEfficiencyAdd: 'cultivation',
    stabilityCostMult: 'cultivation',
    maxQiMult: 'cultivation',
    heavenCostMult: 'cultivation',
    cultivationCharge: 'cultivation',
    emberCapAdd: 'cultivation',
    combatDamageMult: 'combat',
    combatOpenerBuff: 'combat',
    combatOpenerAtkMultAddPer10Charge: 'combat',
    combatOpenerDurationAddSec: 'combat',
    burnDamageMult: 'combat',
    critDmgMult: 'combat',
    martialDamageMult: 'combat',
    critChanceAddPctPoints: 'combat',
    combatFireDamageMult: 'combat',
    burnMaxStacksAdd: 'combat',
    poisonDamageMult: 'combat',
    soulDamageMult: 'combat',
    bossDamageMult: 'combat',
    voidWindow: 'combat',
    voidWindowIgnoreDefPct: 'combat',
    voidWindowDurationAddSec: 'combat',
    voidDamageMult: 'combat',
    ultimateDamageMult: 'combat',
    techniqueMasteryGainMult: 'profession',
    forgeSpeed: 'profession',
    herbYieldMult: 'profession',
    regenMult: 'profession',
    alchemyYieldMult: 'profession',
    refineEffectiveness: 'profession',
    runeDustYield: 'profession',
    heavenManualDropChance: 'economy',
    ruinsFragmentGainMult: 'economy',
    combatFirstBossKillBonus: 'economy',
    bossRespawnTimeMult: 'economy',
    bossKillLantern: 'economy',
    manualFragmentBonusPerLantern: 'economy',
    maxLanternBonus: 'economy',
    lanternCapAdd: 'economy',
    bossChestManualDropChanceAdd: 'economy',
    artifactShardGainMult: 'economy',
    ruinsDropRate: 'economy',
    breakthroughRequirementMult: 'breakthrough',
    tribulationResist: 'breakthrough',
    maxHpMult: 'utility',
    defMult: 'utility',
    damageReduction: 'utility',
    bossDamageTakenMult: 'utility',
    cooldownMult: 'utility',
    shieldStrength: 'utility',
    dodgeAddPctPoints: 'utility',
    poisonResist: 'utility',
    bossUltimateDamageTakenMult: 'utility',
    intentMaxAdd: 'utility',
    ultimateCooldownMult: 'utility',
    hasteMult: 'utility',
    lifestealMaxHpPct: 'utility',
    cooldownRefundChance: 'utility',
    cooldownRefundPct: 'utility',
    bossUltimateWarningAddSec: 'utility',
    note: 'utility',
    cap: 'utility',
});
export const LIVE_SPIRIT_ROOT_ELEMENTS = Object.freeze([
    'fire',
    'water',
    'earth',
    'metal',
    'wood',
]);
export const SUPPORTED_HEART_LAW_RAW_KEYS = Object.freeze([
    'cultivateQiMult',
    'offlineEfficiencyAdd',
    'stabilityCostMult',
    'maxQiMult',
    'combatDamageMult',
    'techniqueMasteryGainMult',
    'maxHpMult',
    'defMult',
    'damageReduction',
    'forgeSpeed',
    'bossDamageTakenMult',
    'cultivationCharge',
    'combatOpenerBuff',
    'emberCapAdd',
    'combatOpenerAtkMultAddPer10Charge',
    'burnDamageMult',
    'heavenManualDropChance',
    'note',
    'combatOpenerDurationAddSec',
    'cooldownMult',
    'shieldStrength',
    'dodgeAddPctPoints',
    'poisonResist',
    'bossUltimateDamageTakenMult',
    'herbYieldMult',
    'regenMult',
    'alchemyYieldMult',
    'poisonDamageMult',
    'critDmgMult',
    'intentMaxAdd',
    'martialDamageMult',
    'critChanceAddPctPoints',
    'combatFireDamageMult',
    'heavenCostMult',
    'burnMaxStacksAdd',
    'ultimateCooldownMult',
    'ruinsFragmentGainMult',
    'cap',
    'hasteMult',
    'combatFirstBossKillBonus',
    'bossRespawnTimeMult',
    'bossKillLantern',
    'manualFragmentBonusPerLantern',
    'maxLanternBonus',
    'lanternCapAdd',
    'soulDamageMult',
    'bossChestManualDropChanceAdd',
    'lifestealMaxHpPct',
    'bossDamageMult',
    'voidWindow',
    'voidWindowIgnoreDefPct',
    'voidWindowDurationAddSec',
    'voidDamageMult',
    'cooldownRefundChance',
    'cooldownRefundPct',
    'bossUltimateWarningAddSec',
    'breakthroughRequirementMult',
    'ultimateDamageMult',
    'tribulationResist',
    'refineEffectiveness',
    'runeDustYield',
    'artifactShardGainMult',
    'ruinsDropRate',
]);
function isObjectLike(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function asPrimitive(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string' || typeof value === 'boolean') {
        return value;
    }
    return null;
}
function toChapter(source) {
    if (source === 'signature') {
        return null;
    }
    const chapter = Number(source.split(':')[1] ?? '');
    return Number.isFinite(chapter) ? chapter : null;
}
function getBudgetWeight(domain) {
    return DOMAIN_WEIGHTS[domain];
}
function buildEffect(source, rawKey, normalizedKey, value, domain, budgetWeight, appliesAffinityOverride) {
    return Object.freeze({
        source,
        chapter: toChapter(source),
        rawKey,
        normalizedKey,
        domain,
        value,
        appliesAffinity: appliesAffinityOverride ?? (source === 'signature'),
        budgetWeight,
    });
}
function pairCapKey(payload) {
    const keys = Object.keys(payload).filter((key) => key !== 'note' && key !== 'cap');
    if (keys.length !== 1) {
        return null;
    }
    return keys[0] ?? null;
}
export function getHeartLawChapterThresholds() {
    return Object.freeze([
        0,
        VERSE_COMPREHENSION_THRESHOLD,
        VERSE_COMPREHENSION_THRESHOLD * 2,
        VERSE_COMPREHENSION_THRESHOLD * 3,
        VERSE_COMPREHENSION_THRESHOLD * 4,
    ]);
}
export function getNormalizedHeartLawAffinityRules(rules) {
    const tierDefaults = {
        starter: 0.10,
        tier1: 0.14,
        tier2: 0.18,
        tier3: 0.22,
    };
    const matchBonusByTier = { ...tierDefaults };
    if (rules?.matchBonusByTier) {
        Object.entries(rules.matchBonusByTier).forEach(([tier, value]) => {
            if (typeof value === 'number' && Number.isFinite(value)) {
                matchBonusByTier[tier] = value;
            }
        });
    }
    return {
        matchBonusByTier,
        mismatchPenalty: typeof rules?.mismatchPenalty === 'number' && Number.isFinite(rules.mismatchPenalty)
            ? rules.mismatchPenalty
            : 0.05,
        appliesTo: typeof rules?.appliesTo === 'string' && rules.appliesTo.trim().length > 0
            ? rules.appliesTo.trim()
            : 'signatureOnly',
    };
}
export function normalizeHeartLawEffectEntries(source, payload) {
    if (!isObjectLike(payload)) {
        return [];
    }
    const entries = [];
    const pairedCapKey = pairCapKey(payload);
    Object.entries(payload).forEach(([rawKey, rawValue]) => {
        if (!SUPPORTED_HEART_LAW_RAW_KEYS.includes(rawKey)) {
            return;
        }
        if (rawKey === 'note') {
            if (typeof rawValue === 'string' && rawValue.trim().length > 0) {
                entries.push(buildEffect(source, 'note', 'note', rawValue.trim(), 'utility', 0, false));
            }
            return;
        }
        if (rawKey === 'cap') {
            if (!pairedCapKey) {
                return;
            }
            const primitive = asPrimitive(rawValue);
            if (primitive !== null) {
                entries.push(buildEffect(source, 'cap', `${pairedCapKey}.cap`, primitive, 'utility', 0, false));
            }
            return;
        }
        if (rawKey === 'cultivationCharge' && isObjectLike(rawValue)) {
            const primitiveEntries = [
                ['cultivationCharge.resourceId', rawValue.resourceId, 0],
                ['cultivationCharge.gainPerCultivateMinute', rawValue.gainPerCultivateMinute, getBudgetWeight('cultivation')],
                ['cultivationCharge.cap', rawValue.cap, 0],
            ];
            primitiveEntries.forEach(([normalizedKey, value, budgetWeight]) => {
                const primitive = asPrimitive(value);
                if (primitive !== null) {
                    entries.push(buildEffect(source, rawKey, normalizedKey, primitive, 'cultivation', budgetWeight));
                }
            });
            return;
        }
        if (rawKey === 'combatOpenerBuff' && isObjectLike(rawValue)) {
            const potencyPriority = [
                ['combatOpenerBuff.atkMult', rawValue.atkMult],
                ['combatOpenerBuff.atkMultPer10Charge', rawValue.atkMultPer10Charge],
                ['combatOpenerBuff.burnChanceAdd', rawValue.burnChanceAdd],
                ['combatOpenerBuff.burnStacksOnHit', rawValue.burnStacksOnHit],
            ];
            const weightedKey = potencyPriority.find(([, value]) => asPrimitive(value) !== null)?.[0] ?? null;
            const primitiveEntries = [
                ['combatOpenerBuff.durationSec', rawValue.durationSec],
                ...potencyPriority,
            ];
            primitiveEntries.forEach(([normalizedKey, value]) => {
                const primitive = asPrimitive(value);
                if (primitive !== null) {
                    entries.push(buildEffect(source, rawKey, normalizedKey, primitive, 'combat', normalizedKey === weightedKey ? getBudgetWeight('combat') : 0));
                }
            });
            return;
        }
        if (rawKey === 'combatFirstBossKillBonus' && isObjectLike(rawValue)) {
            const primitiveEntries = [
                ['combatFirstBossKillBonus.type', rawValue.type, 0],
                ['combatFirstBossKillBonus.chance', rawValue.chance, getBudgetWeight('economy')],
                ['combatFirstBossKillBonus.capPerHour', rawValue.capPerHour, 0],
            ];
            primitiveEntries.forEach(([normalizedKey, value, budgetWeight]) => {
                const primitive = asPrimitive(value);
                if (primitive !== null) {
                    entries.push(buildEffect(source, rawKey, normalizedKey, primitive, 'economy', budgetWeight));
                }
            });
            return;
        }
        if (rawKey === 'bossKillLantern' && isObjectLike(rawValue)) {
            const primitiveEntries = [
                ['bossKillLantern.resourceId', rawValue.resourceId, 0],
                ['bossKillLantern.gainPerBossKill', rawValue.gainPerBossKill, getBudgetWeight('economy')],
                ['bossKillLantern.cap', rawValue.cap, 0],
            ];
            primitiveEntries.forEach(([normalizedKey, value, budgetWeight]) => {
                const primitive = asPrimitive(value);
                if (primitive !== null) {
                    entries.push(buildEffect(source, rawKey, normalizedKey, primitive, 'economy', budgetWeight));
                }
            });
            return;
        }
        if (rawKey === 'voidWindow' && isObjectLike(rawValue)) {
            const primitiveEntries = [
                ['voidWindow.everySec', rawValue.everySec, 0],
                ['voidWindow.durationSec', rawValue.durationSec, 0],
                ['voidWindow.ignoreDefPct', rawValue.ignoreDefPct, getBudgetWeight('combat')],
            ];
            primitiveEntries.forEach(([normalizedKey, value, budgetWeight]) => {
                const primitive = asPrimitive(value);
                if (primitive !== null) {
                    entries.push(buildEffect(source, rawKey, normalizedKey, primitive, 'combat', budgetWeight));
                }
            });
            return;
        }
        const primitive = asPrimitive(rawValue);
        if (primitive === null) {
            return;
        }
        const domain = RAW_KEY_DOMAIN[rawKey];
        entries.push(buildEffect(source, rawKey, rawKey, primitive, domain, getBudgetWeight(domain)));
    });
    return entries;
}
