export function clamp01(n) {
    if (!Number.isFinite(n))
        return 0;
    return Math.min(1, Math.max(0, n));
}
export function hpPercent(current, max) {
    const currentVal = Number.isFinite(parseFloat(current)) ? parseFloat(current) : 0;
    const maxVal = Number.isFinite(parseFloat(max)) ? parseFloat(max) : 0;
    if (maxVal <= 0)
        return 0;
    const ratio = clamp01(currentVal / maxVal);
    return Math.round(ratio * 1000) / 10; // one decimal place precision
}
export function getNextActionTimerMs(now, lastActionAt, cooldownMs) {
    const remaining = (lastActionAt ?? 0) + (cooldownMs ?? 0) - (now ?? 0);
    if (!Number.isFinite(remaining))
        return 0;
    return Math.max(0, remaining);
}
export function getCooldownProgress(now, lastActionAt, cooldownMs) {
    if (!Number.isFinite(cooldownMs) || cooldownMs <= 0)
        return 1;
    const remaining = getNextActionTimerMs(now, lastActionAt, cooldownMs);
    const progress = 1 - remaining / cooldownMs;
    return clamp01(progress);
}
export function formatSeconds(ms) {
    const seconds = Number.isFinite(ms) ? ms / 1000 : 0;
    return `${seconds.toFixed(1)}s`;
}
function safeNumber(value, fallback = 0) {
    const num = typeof value === 'number' ? value : parseFloat(value ?? '');
    return Number.isFinite(num) ? num : fallback;
}
export function computeCombatSafety(input) {
    const defenseConstantK = safeNumber(input.defenseConstantK, 0);
    const playerDef = Math.max(0, safeNumber(input.playerDef, 0));
    const playerHp = Math.max(0, safeNumber(input.playerHp, 0));
    const playerMaxHp = Math.max(0, safeNumber(input.playerMaxHp, 0));
    const absorptionShield = Math.max(0, safeNumber(input.absorptionShield, 0));
    const combatShieldAmount = Math.max(0, safeNumber(input.combatShieldAmount, 0));
    const enemyAtk = Math.max(0, safeNumber(input.enemyAtk, 0));
    const enemyCritDmgPct = Math.max(0, safeNumber(input.enemyCritDmgPct, 100));
    const enemyAuraDps = Math.max(0, safeNumber(input.enemyAuraDps, 0));
    const enemyAttackCooldownMs = Math.max(1, safeNumber(input.enemyAttackCooldownMs, 1000));
    const enrageMultiplier = input.enemyEnrageMultiplier ?? 1.5;
    const damageReductionRaw = playerDef / (playerDef + defenseConstantK);
    const damageReduction = Math.min(0.95, clamp01(damageReductionRaw));
    const enemyBaseHit = enemyAtk * (1 - damageReduction);
    let enemyMaxHit = enemyBaseHit * (enemyCritDmgPct / 100);
    if (input.enemyHasEnrageMechanic || input.enemyIsBoss) {
        enemyMaxHit *= enrageMultiplier;
    }
    const attacksPerSecond = 1000 / enemyAttackCooldownMs;
    const enemyDps = enemyBaseHit * attacksPerSecond + enemyAuraDps;
    const effectiveHp = playerHp + absorptionShield + combatShieldAmount;
    const spikeRatio = enemyMaxHit / Math.max(1, effectiveHp);
    const timeToDieSec = effectiveHp / Math.max(1, enemyDps);
    let tier = 'safe';
    if (spikeRatio >= 0.9 || timeToDieSec <= 4) {
        tier = 'deadly';
    }
    else if (spikeRatio >= 0.6 || timeToDieSec <= 10) {
        tier = 'risky';
    }
    const maxHitPct = Math.round(spikeRatio * 1000) / 10;
    const reasons = [
        `Max hit est: ${enemyMaxHit.toFixed(0)} (${maxHitPct}% of your effective HP)`,
        `Incoming DPS est: ${enemyDps.toFixed(1)}/s${enemyAuraDps > 0 ? ' (includes aura)' : ''}`,
        `Time to die est: ${timeToDieSec.toFixed(1)}s at current HP/shields`,
    ];
    if (input.enemyHasEnrageMechanic || input.enemyIsBoss) {
        reasons.push('Boss/enrage spikes are factored in.');
    }
    const debug = {
        playerHp,
        playerMaxHp,
        absorptionShield,
        combatShieldAmount,
        damageReduction,
        enemyBaseHit,
        enemyMaxHit,
        enemyDps,
        spikeRatio,
        timeToDieSec,
    };
    return { tier, reasons, debug };
}
