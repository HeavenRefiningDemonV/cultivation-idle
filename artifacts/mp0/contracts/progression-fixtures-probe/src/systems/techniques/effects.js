function warn(message, payload) {
    // eslint-disable-next-line no-console
    console.warn(`[technique effects] ${message}`, payload);
}
function parseEffectString(raw) {
    const trimmed = raw.trim();
    const damageMatch = trimmed.match(/^(damage[:(]\s*([0-9.]+)\s*\)?)/i);
    if (damageMatch) {
        const mult = Number(damageMatch[2]);
        return Number.isFinite(mult) ? { kind: 'damage', mult } : undefined;
    }
    const healMatch = trimmed.match(/^(heal[:(]\s*([0-9.]+)\s*\)?)/i);
    if (healMatch) {
        const mult = Number(healMatch[2]);
        return Number.isFinite(mult) ? { kind: 'heal', mult } : undefined;
    }
    const shieldMatch = trimmed.match(/^(shield[:(]\s*([0-9.]+)\s*\)?)/i);
    if (shieldMatch) {
        const mult = Number(shieldMatch[2]);
        return Number.isFinite(mult) ? { kind: 'shield', mult } : undefined;
    }
    const buffMatch = trimmed.match(/^buff\(([^,]+),\s*([0-9.+-]+)(?:,\s*([0-9.+-]+))?\)/i);
    if (buffMatch) {
        const stat = buffMatch[1].trim();
        const value = Number(buffMatch[2]);
        const duration = buffMatch[3] !== undefined ? Number(buffMatch[3]) : undefined;
        if (stat && Number.isFinite(value)) {
            return { kind: 'buff', stat, value, duration: Number.isFinite(duration || NaN) ? duration : undefined };
        }
    }
    return undefined;
}
function toBuffMode(value, explicit) {
    if (explicit === 'flat' || explicit === 'pct')
        return explicit;
    return Math.abs(value) <= 1 ? 'pct' : 'flat';
}
function normalizeBuffLike(raw) {
    if (!raw || typeof raw !== 'object')
        return undefined;
    const stat = raw.stat;
    const value = raw.pct ?? raw.value ?? raw.pctOrFlat ?? raw.flat;
    if (stat && typeof value === 'number' && Number.isFinite(value)) {
        const durationSec = typeof raw.durationSec === 'number' ? raw.durationSec : undefined;
        const mode = toBuffMode(value, raw.mode);
        return { type: 'buff', stat, value, mode, durationSec };
    }
    return undefined;
}
function normalizeObjectEffect(raw, source = 'primary') {
    if (!raw || typeof raw !== 'object')
        return [];
    if (Array.isArray(raw)) {
        return raw.flatMap((entry) => normalizeObjectEffect(entry, source));
    }
    const type = raw.type;
    switch (type) {
        case 'composite':
            if (Array.isArray(raw.effects)) {
                return raw.effects.flatMap((entry) => normalizeObjectEffect(entry, source));
            }
            warn('composite effect missing effects array', raw);
            return [];
        case 'damage': {
            const mult = raw.mult ?? raw.value;
            if (typeof mult === 'number' && Number.isFinite(mult)) {
                return [{ type: 'damage', mult, source }];
            }
            warn('invalid damage effect', raw);
            return [];
        }
        case 'heal': {
            const mult = raw.mult ?? raw.maxHpPct;
            if (typeof mult === 'number' && Number.isFinite(mult)) {
                return [{ type: 'heal', mult, source }];
            }
            warn('invalid heal effect', raw);
            return [];
        }
        case 'shield': {
            const mult = raw.mult ?? raw.maxHpPct;
            if (typeof mult === 'number' && Number.isFinite(mult)) {
                return [{ type: 'shield', mult, source }];
            }
            warn('invalid shield effect', raw);
            return [];
        }
        case 'buff': {
            const buff = normalizeBuffLike(raw);
            if (buff)
                return [{ ...buff, source }];
            warn('invalid buff effect', raw);
            return [];
        }
        case 'passive': {
            if (Array.isArray(raw.mods)) {
                const buffs = raw.mods
                    .map((mod) => normalizeBuffLike(mod))
                    .filter((b) => Boolean(b));
                if (buffs.length)
                    return buffs;
            }
            return [];
        }
        case 'addStatus':
        case 'addStatusOnHit':
            return [{ type: 'addStatus', status: raw.status ?? raw, source }];
        default:
            return [];
    }
}
function normalizeRawEffect(rawEffect, source = 'primary') {
    if (!rawEffect)
        return [];
    if (typeof rawEffect === 'string') {
        const parsed = parseEffectString(rawEffect);
        if (!parsed)
            return [];
        if (parsed.kind === 'buff') {
            const mode = toBuffMode(parsed.value);
            return [
                {
                    type: 'buff',
                    stat: parsed.stat,
                    value: parsed.value,
                    mode,
                    durationSec: parsed.duration,
                    source,
                },
            ];
        }
        return [{ type: parsed.kind, mult: parsed.mult, source }];
    }
    return normalizeObjectEffect(rawEffect, source);
}
export function normalizeTechniqueEffects(techDef, options) {
    if (!techDef)
        return [];
    const effects = [];
    const includeSecondary = Boolean(options?.includeSecondary);
    effects.push(...normalizeRawEffect(techDef.effect, 'primary'));
    if (includeSecondary && techDef.secondaryAtMastery75) {
        effects.push(...normalizeRawEffect(techDef.secondaryAtMastery75, 'secondary'));
    }
    return effects;
}
export function applyRankMultiplier(effects, rankMult) {
    if (!Number.isFinite(rankMult) || rankMult === 1) {
        return effects;
    }
    return effects.map((effect) => {
        switch (effect.type) {
            case 'damage':
            case 'heal':
            case 'shield':
                return { ...effect, mult: effect.mult * rankMult };
            case 'buff':
                return { ...effect, value: effect.value * rankMult };
            default:
                return effect;
        }
    });
}
export function summarizeEffects(effects) {
    return effects.map((effect) => {
        switch (effect.type) {
            case 'damage':
                return `Damage x${effect.mult}`;
            case 'heal':
                return `Heal ${Math.round(effect.mult * 100)}% Max HP`;
            case 'shield':
                return `Shield ${Math.round(effect.mult * 100)}% Max HP`;
            case 'buff': {
                const value = effect.mode === 'pct' ? `${Math.round(effect.value * 100)}%` : `${effect.value}`;
                const duration = effect.durationSec ? ` for ${effect.durationSec}s` : '';
                return `Buff ${effect.stat} by ${value}${duration}`;
            }
            case 'addStatus':
                return 'Applies status';
            default:
                return 'Unknown effect';
        }
    });
}
export function classifyTechnique(techDef) {
    if (!techDef) {
        return { isPassive: false, isUltimate: false, isDefensive: false, isAoE: false, isBurst: false };
    }
    const tags = techDef.tags ?? [];
    const effects = normalizeTechniqueEffects(techDef);
    const isPassive = techDef.type === 'passive' || tags.includes('passive');
    const isUltimate = techDef.type === 'ultimate' || tags.includes('ultimate');
    const isDefensive = techDef.role === 'defense' ||
        tags.includes('defense') ||
        effects.some((e) => e.type === 'heal' || e.type === 'shield' || (e.type === 'buff' && /def|hp|resist/i.test(e.stat)));
    const isAoE = tags.some((tag) => ['aoe', 'area', 'cleave', 'multi-target'].includes(tag));
    const isBurst = tags.includes('burst') || effects.some((e) => e.type === 'damage' && e.mult >= 3);
    return { isPassive, isUltimate, isDefensive, isAoE, isBurst };
}
// Formulas documented for future CombatStore use:
// - damage(mult): damage = ATK * mult
// - heal(mult): heal = MaxHP * mult
// - shield(mult): shield = MaxHP * mult
