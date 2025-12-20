import type { TechniqueDef } from '../../content';

type NormalizedDamage = { type: 'damage'; mult: number };
type NormalizedHeal = { type: 'heal'; mult: number };
type NormalizedShield = { type: 'shield'; mult: number };
type NormalizedBuff = {
  type: 'buff';
  stat: string;
  value: number;
  mode: 'pct' | 'flat';
  durationSec?: number;
};
type NormalizedAddStatus = { type: 'addStatus'; status?: unknown };

export type NormalizedEffect =
  | NormalizedDamage
  | NormalizedHeal
  | NormalizedShield
  | NormalizedBuff
  | NormalizedAddStatus;

type ParsedStringEffect = {
  kind: 'damage' | 'heal' | 'shield';
  mult: number;
};

type ParsedBuffStringEffect = {
  kind: 'buff';
  stat: string;
  value: number;
  duration?: number;
};

function warn(message: string, payload?: unknown) {
  // eslint-disable-next-line no-console
  console.warn(`[technique effects] ${message}`, payload);
}

function parseEffectString(raw: string): ParsedStringEffect | ParsedBuffStringEffect | undefined {
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

function toBuffMode(value: number, explicit?: string): 'pct' | 'flat' {
  if (explicit === 'flat' || explicit === 'pct') return explicit;
  return Math.abs(value) <= 1 ? 'pct' : 'flat';
}

function normalizeBuffLike(raw: any): NormalizedBuff | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const stat = (raw as any).stat as string | undefined;
  const value = (raw as any).pct ?? (raw as any).value ?? (raw as any).pctOrFlat ?? (raw as any).flat;
  if (stat && typeof value === 'number' && Number.isFinite(value)) {
    const durationSec = typeof (raw as any).durationSec === 'number' ? (raw as any).durationSec : undefined;
    const mode = toBuffMode(value, (raw as any).mode);
    return { type: 'buff', stat, value, mode, durationSec };
  }
  return undefined;
}

function normalizeObjectEffect(raw: any): NormalizedEffect[] {
  if (!raw || typeof raw !== 'object') return [];

  if (Array.isArray(raw)) {
    return raw.flatMap((entry) => normalizeObjectEffect(entry));
  }

  const type = (raw as any).type as string | undefined;
  switch (type) {
    case 'composite':
      if (Array.isArray((raw as any).effects)) {
        return (raw as any).effects.flatMap((entry: unknown) => normalizeObjectEffect(entry));
      }
      warn('composite effect missing effects array', raw);
      return [];
    case 'damage': {
      const mult = (raw as any).mult ?? (raw as any).value;
      if (typeof mult === 'number' && Number.isFinite(mult)) {
        return [{ type: 'damage', mult }];
      }
      warn('invalid damage effect', raw);
      return [];
    }
    case 'heal': {
      const mult = (raw as any).mult ?? (raw as any).maxHpPct;
      if (typeof mult === 'number' && Number.isFinite(mult)) {
        return [{ type: 'heal', mult }];
      }
      warn('invalid heal effect', raw);
      return [];
    }
    case 'shield': {
      const mult = (raw as any).mult ?? (raw as any).maxHpPct;
      if (typeof mult === 'number' && Number.isFinite(mult)) {
        return [{ type: 'shield', mult }];
      }
      warn('invalid shield effect', raw);
      return [];
    }
    case 'buff': {
      const buff = normalizeBuffLike(raw);
      if (buff) return [buff];
      warn('invalid buff effect', raw);
      return [];
    }
    case 'passive': {
      if (Array.isArray((raw as any).mods)) {
        const buffs = (raw as any).mods
          .map((mod: any) => normalizeBuffLike(mod))
          .filter((b: NormalizedBuff | undefined): b is NormalizedBuff => Boolean(b));
        if (buffs.length) return buffs;
      }
      return [];
    }
    case 'addStatus':
    case 'addStatusOnHit':
      return [{ type: 'addStatus', status: (raw as any).status ?? raw }];
    default:
      return [];
  }
}

export function normalizeTechniqueEffects(techDef: TechniqueDef | undefined): NormalizedEffect[] {
  if (!techDef) return [];
  const rawEffect = (techDef as any).effect;
  if (!rawEffect) return [];

  if (typeof rawEffect === 'string') {
    const parsed = parseEffectString(rawEffect);
    if (!parsed) return [];
    if (parsed.kind === 'buff') {
      const mode = toBuffMode(parsed.value);
      return [
        {
          type: 'buff',
          stat: parsed.stat,
          value: parsed.value,
          mode,
          durationSec: parsed.duration,
        },
      ];
    }
    return [{ type: parsed.kind, mult: parsed.mult } as NormalizedEffect];
  }

  return normalizeObjectEffect(rawEffect);
}

export function applyRankMultiplier(effects: NormalizedEffect[], rankMult: number): NormalizedEffect[] {
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

export function summarizeEffects(effects: NormalizedEffect[]): string[] {
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

export function classifyTechnique(techDef: TechniqueDef | undefined): {
  isPassive: boolean;
  isUltimate: boolean;
  isDefensive: boolean;
  isAoE: boolean;
  isBurst: boolean;
} {
  if (!techDef) {
    return { isPassive: false, isUltimate: false, isDefensive: false, isAoE: false, isBurst: false };
  }

  const tags = techDef.tags ?? [];
  const effects = normalizeTechniqueEffects(techDef);
  const isPassive = techDef.type === 'passive' || tags.includes('passive');
  const isUltimate = techDef.type === 'ultimate' || tags.includes('ultimate');
  const isDefensive =
    techDef.role === 'defense' ||
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
