import { getConsumableSpec } from '../consumables/consumableCatalog.js';
import { COMBAT_POSTURE_RATING_ORDER, SERIOUS_COMBAT_ENCOUNTERS } from './combatPostureTypes.js';
function downgradeRating(rating) {
    const index = COMBAT_POSTURE_RATING_ORDER.indexOf(rating);
    if (index < 0)
        return 'risky';
    return COMBAT_POSTURE_RATING_ORDER[Math.min(index + 1, COMBAT_POSTURE_RATING_ORDER.length - 1)] ?? 'bad';
}
function pushWarning(warnings, warning) {
    if (!warnings.includes(warning)) {
        warnings.push(warning);
    }
}
function isCombatConsumableForSlot(slot, slotKey) {
    const itemId = slot?.equippedItemId;
    if (!itemId)
        return false;
    const spec = getConsumableSpec(itemId);
    return !!spec && spec.domain === 'combat' && spec.recommendedSlot === slotKey;
}
function getUtilityOrSpecialtyStatus(slot, slotKey) {
    const carriesCombatConsumable = isCombatConsumableForSlot(slot, slotKey);
    const enabled = Boolean(slot?.enabled);
    const useful = enabled && carriesCombatConsumable && slot?.trigger !== 'manual';
    const manualOnly = enabled && carriesCombatConsumable && slot?.trigger === 'manual';
    return {
        carriesCombatConsumable,
        enabled,
        useful,
        manualOnly,
    };
}
export function evaluateMedicinePouchFit(input) {
    const warnings = [];
    const healingSlot = input.slots.healing;
    const utilitySlot = input.slots.utility;
    const specialtySlot = input.slots.specialty;
    const healingHasCombatConsumable = isCombatConsumableForSlot(healingSlot, 'healing');
    const healingCorrect = Boolean(healingSlot?.enabled) &&
        healingHasCombatConsumable &&
        healingSlot.trigger === 'hpBelowPct' &&
        healingSlot.thresholdPct >= 20 &&
        healingSlot.thresholdPct <= 45 &&
        healingSlot.bossOnly === false;
    const healingRiskyPresent = Boolean(healingSlot?.enabled) && healingHasCombatConsumable && !healingCorrect;
    const utilityStatus = getUtilityOrSpecialtyStatus(utilitySlot, 'utility');
    const specialtyStatus = getUtilityOrSpecialtyStatus(specialtySlot, 'specialty');
    const hasUsefulUtilityOrSpecialty = utilityStatus.useful || specialtyStatus.useful;
    const hasEnabledCombatUtilityOrSpecialty = (utilityStatus.enabled && utilityStatus.carriesCombatConsumable) ||
        (specialtyStatus.enabled && specialtyStatus.carriesCombatConsumable);
    const allEnabledCombatUtilityOrSpecialtyManualOnly = hasEnabledCombatUtilityOrSpecialty &&
        !hasUsefulUtilityOrSpecialty &&
        [utilityStatus, specialtyStatus].every((status) => !status.enabled || !status.carriesCombatConsumable || status.manualOnly);
    const hasEnabledEquippedSpecialtyCombatSlot = specialtyStatus.enabled && specialtyStatus.carriesCombatConsumable;
    const specialtyBossTimed = specialtyStatus.useful &&
        !!specialtySlot &&
        (specialtySlot.trigger === 'bossStart' ||
            specialtySlot.trigger === 'fightStart' ||
            specialtySlot.bossOnly === true);
    let rating;
    if (input.encounterType === 'outskirts') {
        rating = healingCorrect ? 'good' : 'risky';
    }
    else if (input.encounterType === 'ruins') {
        if (healingCorrect && hasUsefulUtilityOrSpecialty) {
            rating = 'good';
        }
        else if (healingCorrect || hasUsefulUtilityOrSpecialty) {
            rating = 'risky';
        }
        else {
            rating = 'bad';
        }
    }
    else if (healingCorrect && hasUsefulUtilityOrSpecialty) {
        rating = 'good';
    }
    else if (healingCorrect && !hasUsefulUtilityOrSpecialty) {
        rating = 'risky';
    }
    else if (healingRiskyPresent && hasUsefulUtilityOrSpecialty) {
        rating = 'risky';
    }
    else {
        rating = 'bad';
    }
    if (!input.pouchAutoUseEnabled) {
        rating = input.encounterType === 'outskirts' ? 'risky' : 'bad';
        pushWarning(warnings, 'Combat consumable auto-use is disabled.');
    }
    if (!healingCorrect && !healingRiskyPresent) {
        pushWarning(warnings, 'Healing pouch slot is empty, disabled, or not carrying a healing consumable.');
    }
    if (healingRiskyPresent) {
        pushWarning(warnings, 'Healing pouch should auto-trigger on low HP between 20% and 45%.');
    }
    if (SERIOUS_COMBAT_ENCOUNTERS.includes(input.encounterType) && !hasUsefulUtilityOrSpecialty) {
        pushWarning(warnings, 'Serious encounters want at least one enabled utility or specialty pouch item.');
    }
    if (SERIOUS_COMBAT_ENCOUNTERS.includes(input.encounterType) &&
        allEnabledCombatUtilityOrSpecialtyManualOnly) {
        pushWarning(warnings, 'Utility or specialty pouch should auto-trigger instead of staying manual-only in serious fights.');
    }
    if (input.encounterType === 'trial' &&
        hasEnabledEquippedSpecialtyCombatSlot &&
        !specialtyBossTimed) {
        rating = downgradeRating(rating);
        pushWarning(warnings, 'Trial posture wants a boss-timed specialty pouch if one is equipped.');
    }
    return {
        rating,
        warnings: [...warnings],
    };
}
