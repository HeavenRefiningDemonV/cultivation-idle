export const TECHNIQUE_FAMILY_ORDER = Object.freeze([
    'coreDamage',
    'aoe',
    'execute',
    'guard',
    'heal',
    'buff',
    'setup',
    'control',
    'mobility',
    'cleanse',
    'farm',
]);
export const TECHNIQUE_SUPPORT_FLAG_ORDER = Object.freeze([
    'survival',
    'tempo',
    'boss',
    'farm',
]);
export const RECOGNIZED_PRIMARY_EFFECT_TYPES = Object.freeze([
    'applyStatus',
    'buff',
    'cleanse',
    'composite',
    'damage',
    'damageWithStacks',
    'debuff',
    'heal',
    'lifestealOnBossHit',
    'nextHitReduction',
    'passive',
    'passiveConditional',
    'restoreMaxQiPct',
    'shield',
    'stackingPassive',
]);
export const RECOGNIZED_SECONDARY_EFFECT_TYPES = Object.freeze([
    'addBuffOnCast',
    'addDebuffOnCast',
    'addDebuffOnHit',
    'addOnCast',
    'addStatusOnHit',
    'conditionalBonus',
    'conditionalRefund',
    'counterstrikeOnSuccess',
    'modifyNthHit',
    'modifyThisHit',
    'passive',
    'passiveConditional',
    'proc',
    'upgradeBuff',
    'upgradeCleanse',
    'upgradeDebuff',
    'upgradeHeal',
    'upgradeLifesteal',
    'upgradeRestoreMaxQiPct',
    'upgradeStacks',
    'upgradeStackingPassive',
    'upgradeStatus',
]);
const TEMPO_TAGS = new Set(['tempo', 'combo', 'multihit', 'qi', 'drain', 'stance']);
const GUARD_STAT_KEYS = new Set([
    'damageReduction',
    'damageReductionWhileShielded',
    'def',
    'dodge',
    'enemyCritChanceAgainstYou',
    'enemyCritDmgAgainstYou',
    'maxHp',
    'reflectDamageTakenPct',
    'shieldStrength',
].map((value) => value.toLowerCase()));
const HEAL_STAT_KEYS = new Set(['regen']);
const BUFF_STAT_KEYS = new Set([
    'allMasteryGain',
    'atk',
    'atkWhileShielded',
    'buffDuration',
    'burnDamage',
    'burnMaxStacks',
    'critChance',
    'critDmg',
    'damageToBosses',
    'haste',
    'heavenCooldown',
    'heavenCost',
    'heavenMasteryGain',
    'intentRegenCombat',
    'martialCost',
    'martialDamage',
    'maxIntent',
    'maxQi',
    'shieldDuration',
    'stanceCooldown',
    'stanceDuration',
].map((value) => value.toLowerCase()));
const SETUP_ENEMY_STAT_KEYS = new Set([
    'enemyDamageTaken',
    'enemyDamageTakenFromMartial',
    'enemyDef',
].map((value) => value.toLowerCase()));
const CONTROL_ENEMY_STAT_KEYS = new Set([
    'enemyAtk',
    'enemyCritChance',
    'enemyDodge',
    'enemyHaste',
].map((value) => value.toLowerCase()));
const FARM_STAT_KEYS = new Set([
    'forgeSpeed',
    'refineEffectiveness',
    'ruinsDropRate',
    'ruinsFragmentGain',
    'runeDustYield',
].map((value) => value.toLowerCase()));
const SETUP_STATUSES = new Set(['bleed', 'burn', 'poison']);
const CONTROL_STATUSES = new Set(['frost']);
const TEMPO_STAT_KEYS = new Set([
    'allMasteryGain',
    'buffDuration',
    'haste',
    'heavenCooldown',
    'heavenCost',
    'heavenMasteryGain',
    'intentRegenCombat',
    'martialCost',
    'maxIntent',
    'maxQi',
    'shieldDuration',
    'stanceCooldown',
    'stanceDuration',
].map((value) => value.toLowerCase()));
function asRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? value
        : null;
}
function asArray(value) {
    return Array.isArray(value) ? value : [];
}
function asString(value) {
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
}
function lowerCaseList(values) {
    if (!Array.isArray(values)) {
        return [];
    }
    return values
        .filter((value) => typeof value === 'string')
        .map((value) => value.trim().toLowerCase())
        .filter((value) => value.length > 0);
}
function sortAndDedupeStrings(values) {
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}
function sortFamilies(values) {
    const seen = new Set(values);
    return TECHNIQUE_FAMILY_ORDER.filter((family) => seen.has(family));
}
function sortSupportFlags(values) {
    const seen = new Set(values);
    return TECHNIQUE_SUPPORT_FLAG_ORDER.filter((flag) => seen.has(flag));
}
function collectPrimaryEffectTypes(node, collector) {
    if (Array.isArray(node)) {
        node.forEach((entry) => collectPrimaryEffectTypes(entry, collector));
        return;
    }
    const record = asRecord(node);
    if (record === null) {
        return;
    }
    const type = asString(record.type);
    if (type !== null) {
        collector.add(type);
    }
    Object.values(record).forEach((value) => collectPrimaryEffectTypes(value, collector));
}
function collectStatKeys(node, collector) {
    if (Array.isArray(node)) {
        node.forEach((entry) => collectStatKeys(entry, collector));
        return;
    }
    const record = asRecord(node);
    if (record === null) {
        return;
    }
    const stat = asString(record.stat);
    if (stat !== null) {
        collector.add(stat.toLowerCase());
    }
    Object.values(record).forEach((value) => collectStatKeys(value, collector));
}
function collectStatusIds(node, collector) {
    if (Array.isArray(node)) {
        node.forEach((entry) => collectStatusIds(entry, collector));
        return;
    }
    const record = asRecord(node);
    if (record === null) {
        return;
    }
    const statusId = asString(record.statusId);
    if (statusId !== null) {
        collector.add(statusId.toLowerCase());
    }
    const status = asRecord(record.status);
    const nestedStatusId = status ? asString(status.id) : null;
    if (nestedStatusId !== null) {
        collector.add(nestedStatusId.toLowerCase());
    }
    if (record.type === 'applyStatus') {
        const directStatusId = asString(record.id);
        if (directStatusId !== null) {
            collector.add(directStatusId.toLowerCase());
        }
    }
    Object.values(record).forEach((value) => collectStatusIds(value, collector));
}
function hasTag(def, tag) {
    return lowerCaseList(def.tags).includes(tag);
}
function hasAnyTag(def, tags) {
    const tagSet = new Set(lowerCaseList(def.tags));
    return tags.some((tag) => tagSet.has(tag));
}
function getMatchingStats(summary, group) {
    return summary.statKeys.filter((stat) => group.has(stat));
}
function hasPrimaryEffectType(summary, type) {
    return summary.primaryEffectTypes.includes(type);
}
function hasSecondaryEffectType(summary, type) {
    return summary.secondaryEffectTypes.includes(type);
}
function hasAnyStat(summary, group) {
    return summary.statKeys.some((stat) => group.has(stat));
}
function hasAnyStatus(summary, group) {
    return summary.statusIds.some((status) => group.has(status));
}
function walkValues(node, visitor) {
    if (Array.isArray(node)) {
        node.forEach((entry) => walkValues(entry, visitor));
        return;
    }
    const record = asRecord(node);
    if (record === null) {
        return;
    }
    visitor(record);
    Object.values(record).forEach((value) => walkValues(value, visitor));
}
function hasGuaranteedCrit(def) {
    let found = false;
    walkValues(def.effect, (record) => {
        if (record.guaranteedCrit === true) {
            found = true;
        }
    });
    return found;
}
function hasLargeDamageMultiplier(def) {
    let found = false;
    walkValues(def.effect, (record) => {
        const type = asString(record.type);
        if (type !== 'damage' && type !== 'damageWithStacks') {
            return;
        }
        ['mult', 'baseMult', 'value'].forEach((key) => {
            const raw = record[key];
            if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 4) {
                found = true;
            }
        });
    });
    return found;
}
function hasBurstCritInjection(def) {
    const secondary = asRecord(def.secondaryAtMastery75);
    if (secondary === null) {
        return false;
    }
    const type = asString(secondary.type);
    if (type !== 'modifyThisHit' && type !== 'modifyNthHit') {
        return false;
    }
    return asArray(secondary.mods).some((mod) => {
        const record = asRecord(mod);
        if (record === null) {
            return false;
        }
        const stat = asString(record.stat);
        const addPctPoints = record.addPctPoints;
        return stat?.toLowerCase() === 'critchance' && typeof addPctPoints === 'number' && addPctPoints >= 25;
    });
}
function hasIgnoreDefSignal(summary) {
    return summary.statKeys.includes('ignoredefpct');
}
function hasSelfBuffAndStat(def, statKeys) {
    const wanted = new Set(statKeys.map((key) => key.toLowerCase()));
    let found = false;
    walkValues(def.effect, (record) => {
        const type = asString(record.type);
        const stat = asString(record.stat);
        if ((type === 'buff' || type === 'passive' || type === 'passiveConditional' || type === 'stackingPassive') && stat && wanted.has(stat.toLowerCase())) {
            found = true;
        }
    });
    walkValues(def.secondaryAtMastery75, (record) => {
        const type = asString(record.type);
        const stat = asString(record.stat);
        if (type && stat && wanted.has(stat.toLowerCase())) {
            found = true;
        }
    });
    return found;
}
function isBossLockedHeal(def, summary) {
    return hasPrimaryEffectType(summary, 'lifestealOnBossHit');
}
function shouldTreatAsSetup(def, summary) {
    const hasSetupSignal = hasAnyStat(summary, SETUP_ENEMY_STAT_KEYS) ||
        hasAnyStatus(summary, SETUP_STATUSES) ||
        hasSecondaryEffectType(summary, 'conditionalBonus') ||
        hasIgnoreDefSignal(summary);
    if (!hasSetupSignal) {
        return false;
    }
    const isBurstUltimateDamage = (def.type === 'ultimate' || hasTag(def, 'burst')) &&
        (hasPrimaryEffectType(summary, 'damage') || hasPrimaryEffectType(summary, 'damageWithStacks'));
    return !isBurstUltimateDamage;
}
function shouldTreatAsGuard(def, summary) {
    if (hasPrimaryEffectType(summary, 'shield') || hasPrimaryEffectType(summary, 'nextHitReduction') || hasTag(def, 'counter')) {
        return true;
    }
    const guardStats = getMatchingStats(summary, GUARD_STAT_KEYS);
    const nonDodgeGuardStats = guardStats.filter((stat) => stat !== 'dodge');
    if (nonDodgeGuardStats.length > 0) {
        return true;
    }
    if (def.role === 'defense' && !isBossLockedHeal(def, summary)) {
        return true;
    }
    return false;
}
function deriveFamiliesWithTrace(def) {
    const summary = buildTechniqueSignalSummary(def);
    const families = new Set();
    const fallbackMarkers = [];
    const lowerId = (def.id ?? '').toLowerCase();
    const lowerName = (def.name ?? '').toLowerCase();
    const isClearlyDamage = hasPrimaryEffectType(summary, 'damage') ||
        hasPrimaryEffectType(summary, 'damageWithStacks') ||
        (def.role === 'offense' && !hasPrimaryEffectType(summary, 'heal') && !hasPrimaryEffectType(summary, 'shield') && !hasPrimaryEffectType(summary, 'cleanse'));
    if (isClearlyDamage) {
        families.add('coreDamage');
    }
    if (hasAnyTag(def, ['aoe', 'area', 'cleave', 'multi-target'])) {
        families.add('aoe');
    }
    if (families.has('coreDamage') && ((def.type === 'ultimate' && isClearlyDamage) ||
        hasTag(def, 'burst') ||
        hasLargeDamageMultiplier(def) ||
        hasGuaranteedCrit(def) ||
        hasSecondaryEffectType(summary, 'conditionalBonus') ||
        (hasSecondaryEffectType(summary, 'conditionalRefund') && def.type === 'ultimate' && isClearlyDamage) ||
        hasIgnoreDefSignal(summary) ||
        hasBurstCritInjection(def))) {
        families.add('execute');
    }
    if (shouldTreatAsGuard(def, summary)) {
        families.add('guard');
    }
    if (hasPrimaryEffectType(summary, 'heal') ||
        hasPrimaryEffectType(summary, 'lifestealOnBossHit') ||
        hasAnyStat(summary, HEAL_STAT_KEYS)) {
        families.add('heal');
    }
    if (hasPrimaryEffectType(summary, 'buff') ||
        hasAnyStat(summary, BUFF_STAT_KEYS) ||
        (hasAnyStat(summary, FARM_STAT_KEYS) && (def.type === 'passive' || def.role === 'utility'))) {
        families.add('buff');
    }
    if (shouldTreatAsSetup(def, summary)) {
        families.add('setup');
    }
    if (hasAnyStat(summary, CONTROL_ENEMY_STAT_KEYS) ||
        hasAnyStatus(summary, CONTROL_STATUSES) ||
        (hasTag(def, 'curse') && (hasPrimaryEffectType(summary, 'debuff') || hasSecondaryEffectType(summary, 'addDebuffOnCast') || hasSecondaryEffectType(summary, 'addDebuffOnHit') || families.has('control')))) {
        families.add('control');
    }
    if (lowerId.includes('mirror') ||
        lowerName.includes('mirror') ||
        lowerId.includes('footwork') ||
        lowerName.includes('footwork') ||
        (hasSelfBuffAndStat(def, ['haste']) && hasSelfBuffAndStat(def, ['dodge']))) {
        families.add('mobility');
    }
    if (hasPrimaryEffectType(summary, 'cleanse') ||
        hasSecondaryEffectType(summary, 'upgradeCleanse') ||
        (() => {
            const secondary = asRecord(def.secondaryAtMastery75);
            const effect = secondary ? asRecord(secondary.effect) : null;
            return effect?.type === 'cleanse';
        })()) {
        families.add('cleanse');
    }
    if (hasAnyStat(summary, FARM_STAT_KEYS)) {
        families.add('farm');
    }
    if (families.size === 0) {
        if (def.role === 'defense') {
            families.add('guard');
            fallbackMarkers.push('fallback:role:defense');
        }
        else if (def.role === 'offense') {
            families.add('coreDamage');
            fallbackMarkers.push('fallback:role:offense');
        }
        else if (def.role === 'utility') {
            families.add('buff');
            fallbackMarkers.push('fallback:role:utility');
        }
    }
    return {
        families: sortFamilies(families),
        fallbackMarkers,
    };
}
export function buildTechniqueSignalSummary(def) {
    const primaryEffectTypes = new Set();
    const secondaryEffectTypes = new Set();
    const statKeys = new Set();
    const statusIds = new Set();
    collectPrimaryEffectTypes(def.effect, primaryEffectTypes);
    collectStatKeys(def.effect, statKeys);
    collectStatKeys(def.secondaryAtMastery75, statKeys);
    collectStatusIds(def.effect, statusIds);
    collectStatusIds(def.secondaryAtMastery75, statusIds);
    const secondary = asRecord(def.secondaryAtMastery75);
    const secondaryType = secondary ? asString(secondary.type) : null;
    if (secondaryType !== null) {
        secondaryEffectTypes.add(secondaryType);
    }
    return {
        primaryEffectTypes: sortAndDedupeStrings(primaryEffectTypes),
        secondaryEffectTypes: sortAndDedupeStrings(secondaryEffectTypes),
        statKeys: sortAndDedupeStrings(statKeys),
        statusIds: sortAndDedupeStrings(statusIds),
    };
}
export function deriveTechniqueFamilies(def) {
    return deriveFamiliesWithTrace(def).families;
}
export function deriveTechniqueSupportFlags(def, families) {
    const resolvedFamilies = families ? sortFamilies(families) : deriveTechniqueFamilies(def);
    const familySet = new Set(resolvedFamilies);
    const summary = buildTechniqueSignalSummary(def);
    const flags = new Set();
    const lowerTags = new Set(lowerCaseList(def.tags));
    if (familySet.has('guard') || familySet.has('heal') || familySet.has('cleanse')) {
        flags.add('survival');
    }
    if (Array.from(TEMPO_TAGS).some((tag) => lowerTags.has(tag)) ||
        familySet.has('mobility') ||
        hasAnyStat(summary, TEMPO_STAT_KEYS) ||
        hasPrimaryEffectType(summary, 'restoreMaxQiPct')) {
        flags.add('tempo');
    }
    if (familySet.has('execute') ||
        lowerTags.has('boss') ||
        summary.statKeys.includes('damagetobosses') ||
        summary.statKeys.includes('enemydamagetaken') ||
        summary.statKeys.includes('enemydamagetakenfrommartial') ||
        hasIgnoreDefSignal(summary) ||
        hasSecondaryEffectType(summary, 'conditionalBonus') ||
        hasSecondaryEffectType(summary, 'conditionalRefund') ||
        hasGuaranteedCrit(def) ||
        hasPrimaryEffectType(summary, 'lifestealOnBossHit')) {
        flags.add('boss');
    }
    if (familySet.has('aoe') || familySet.has('farm') || hasAnyStat(summary, FARM_STAT_KEYS)) {
        flags.add('farm');
    }
    return sortSupportFlags(flags);
}
export function buildTechniqueFamilyDerivation(def) {
    const summary = buildTechniqueSignalSummary(def);
    const { families, fallbackMarkers } = deriveFamiliesWithTrace(def);
    const supportFlags = deriveTechniqueSupportFlags(def, families);
    const derivedFrom = new Set([
        `path:${def.path}`,
        `type:${def.type}`,
        ...fallbackMarkers,
    ]);
    if (typeof def.role === 'string' && def.role.trim().length > 0) {
        derivedFrom.add(`role:${def.role}`);
    }
    lowerCaseList(def.tags).forEach((tag) => {
        derivedFrom.add(`tag:${tag}`);
    });
    summary.primaryEffectTypes.forEach((type) => {
        derivedFrom.add(`primary:${type}`);
    });
    summary.secondaryEffectTypes.forEach((type) => {
        derivedFrom.add(`secondary:${type}`);
    });
    summary.statKeys.forEach((stat) => {
        derivedFrom.add(`stat:${stat}`);
    });
    summary.statusIds.forEach((statusId) => {
        derivedFrom.add(`status:${statusId}`);
    });
    return {
        families,
        supportFlags,
        derivedFrom: Array.from(derivedFrom).sort((a, b) => a.localeCompare(b)),
    };
}
