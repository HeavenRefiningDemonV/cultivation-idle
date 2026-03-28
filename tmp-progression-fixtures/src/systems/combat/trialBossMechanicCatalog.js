function asNumber(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
function asId(value) {
    return typeof value === 'string' ? value : '';
}
export function normalizeTrialBossMechanics(rawMechanics) {
    if (!Array.isArray(rawMechanics))
        return [];
    return rawMechanics.flatMap((entry) => {
        const source = entry;
        const id = asId(source.id);
        switch (id) {
            case 'shieldPhase':
                return [{
                        type: 'shieldPhase',
                        trigger: { hpPercent: asNumber(source.triggerHpPct, 0.55) * 100 },
                        effect: { shieldAmountPct: asNumber(source.shieldMaxHpPct, 0.25) },
                        description: 'Shield phase',
                    }];
            case 'ultimate':
                return [{
                        type: 'ultimate',
                        trigger: { intervalSec: asNumber(source.intervalSec, 24), warnSec: asNumber(source.warnSec, 3) },
                        effect: { damageMult: asNumber(source.damageMult, 2.8) },
                        description: 'Ultimate strike',
                    }];
            case 'damageReduction':
                return [{
                        type: 'damageReduction',
                        trigger: {},
                        effect: { pct: asNumber(source.basePct, 0.2) },
                        description: 'Damage reduction',
                    }];
            case 'shatterWindow':
                return [{
                        type: 'shatterWindow',
                        trigger: { everySec: asNumber(source.everySec, 28), durationSec: asNumber(source.durationSec, 8) },
                        effect: { defReducedPct: asNumber(source.defReducedPct, 0.25) },
                        description: 'Shatter window',
                    }];
            case 'soulDrain':
                return [{
                        type: 'soulDrain',
                        trigger: { tickSec: asNumber(source.tickSec, 3) },
                        effect: { maxQiPctPerTick: asNumber(source.maxQiPctPerTick, 0.03) },
                        description: 'Soul drain',
                    }];
            case 'burstWindow':
                return [{
                        type: 'burstWindow',
                        trigger: { everySec: asNumber(source.everySec, 30), durationSec: asNumber(source.durationSec, 7) },
                        effect: { takesMoreDamagePct: asNumber(source.takesMoreDamagePct, 0.25) },
                        description: 'Burst window',
                    }];
            case 'auraDoT':
                return [{
                        type: 'auraDoT',
                        trigger: { startSec: asNumber(source.startSec, 8), tickSec: asNumber(source.tickSec, 2) },
                        effect: { dotMaxHpPctPerTick: asNumber(source.dotMaxHpPctPerTick, 0.02) },
                        description: 'Aura pressure',
                    }];
            default:
                return [];
        }
    });
}
