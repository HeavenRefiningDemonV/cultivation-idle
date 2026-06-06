import type { SpiritRootElement } from '../../types/index.js';
import type { SpiritRootProgressionSnapshot } from './spiritRootProgressionResolver.js';

export type SpiritRootCombatTrigger =
  | 'basic_attack'
  | 'technique_damage'
  | 'technique_heal'
  | 'technique_shield'
  | 'technique_buff'
  | 'incoming_damage'
  | 'medicine';

export interface SpiritRootCombatModifiers {
  damageMult: number;
  incomingDamageMult: number;
  healPct: number;
  shieldPct: number;
  armorPenPct: number;
  dodgePct: number;
  critPct: number;
  cooldownRefundPct: number;
  cleanseChancePct: number;
}

export interface SpiritRootCombatProc {
  didProc: boolean;
  effectId: string | null;
  procName: string | null;
  modifiers: SpiritRootCombatModifiers;
  nextLastProcAtByElementId: Partial<Record<SpiritRootElement, number>>;
  logLine: string | null;
}

export interface ResolveSpiritRootCombatProcInput {
  snapshot?: SpiritRootProgressionSnapshot | null;
  now: number;
  trigger: SpiritRootCombatTrigger;
  rollPct: number;
  lastProcAtByElementId?: Partial<Record<SpiritRootElement, number>>;
}

const EMPTY_MODIFIERS: SpiritRootCombatModifiers = Object.freeze({
  damageMult: 1,
  incomingDamageMult: 1,
  healPct: 0,
  shieldPct: 0,
  armorPenPct: 0,
  dodgePct: 0,
  critPct: 0,
  cooldownRefundPct: 0,
  cleanseChancePct: 0,
});

function emptyProc(lastProcAtByElementId?: Partial<Record<SpiritRootElement, number>>): SpiritRootCombatProc {
  return {
    didProc: false,
    effectId: null,
    procName: null,
    modifiers: { ...EMPTY_MODIFIERS },
    nextLastProcAtByElementId: { ...(lastProcAtByElementId ?? {}) },
    logLine: null,
  };
}

function triggerAllowed(effectId: string, trigger: SpiritRootCombatTrigger): boolean {
  if (trigger === 'medicine') return /wood|water|light|soul/.test(effectId);
  if (trigger === 'incoming_damage') return /earth|water|wind|ice|shadow|void|time/.test(effectId);
  if (trigger === 'technique_heal' || trigger === 'technique_shield') return /wood|earth|water|light|soul/.test(effectId);
  if (trigger === 'technique_buff') return /wood|earth|water|wind|light|soul|astral|time/.test(effectId);
  return true;
}

function modifiersFor(effectId: string, strength: number): SpiritRootCombatModifiers {
  const value = Math.max(0, strength);
  const modifiers = { ...EMPTY_MODIFIERS };

  if (effectId.includes('wood')) {
    modifiers.healPct = value;
  } else if (effectId.includes('fire')) {
    modifiers.damageMult = 1 + value;
  } else if (effectId.includes('earth')) {
    modifiers.incomingDamageMult = Math.max(0.75, 1 - value);
    modifiers.shieldPct = value * 0.7;
  } else if (effectId.includes('metal')) {
    modifiers.armorPenPct = value * 100;
    modifiers.critPct = value * 25;
  } else if (effectId.includes('water')) {
    modifiers.incomingDamageMult = Math.max(0.82, 1 - value * 0.8);
    modifiers.cooldownRefundPct = Math.min(8, value * 80);
  } else if (effectId.includes('wind')) {
    modifiers.dodgePct = value * 100;
  } else if (effectId.includes('lightning')) {
    modifiers.damageMult = 1 + value * 1.15;
  } else if (effectId.includes('ice')) {
    modifiers.incomingDamageMult = Math.max(0.85, 1 - value * 0.65);
  } else if (effectId.includes('light')) {
    modifiers.cleanseChancePct = value * 100;
    modifiers.healPct = value * 0.5;
  } else if (effectId.includes('shadow')) {
    modifiers.dodgePct = value * 85;
    modifiers.damageMult = 1 + value * 0.4;
  } else if (effectId.includes('soul')) {
    modifiers.shieldPct = value;
  } else if (effectId.includes('void')) {
    modifiers.incomingDamageMult = Math.max(0.85, 1 - value * 0.7);
    modifiers.armorPenPct = value * 80;
  } else if (effectId.includes('time')) {
    modifiers.cooldownRefundPct = Math.min(10, value * 100);
  } else if (effectId.includes('astral')) {
    modifiers.critPct = value * 30;
    modifiers.damageMult = 1 + value * 0.45;
  }

  return modifiers;
}

export function resolveSpiritRootCombatProc(input?: ResolveSpiritRootCombatProcInput): SpiritRootCombatProc {
  if (!input?.snapshot) return emptyProc(input?.lastProcAtByElementId);

  const snapshot = input.snapshot;
  const lastProcAt = input.lastProcAtByElementId?.[snapshot.elementId];
  const cooldownMs = snapshot.proc.cooldownSec * 1000;
  if (typeof lastProcAt === 'number' && Number.isFinite(lastProcAt) && input.now - lastProcAt < cooldownMs) {
    return emptyProc(input.lastProcAtByElementId);
  }
  if (snapshot.awakening.procMultiplier <= 0) return emptyProc(input.lastProcAtByElementId);
  if (!triggerAllowed(snapshot.proc.effectId, input.trigger)) return emptyProc(input.lastProcAtByElementId);
  if (input.rollPct > snapshot.proc.chancePct) return emptyProc(input.lastProcAtByElementId);

  const nextLastProcAtByElementId = {
    ...(input.lastProcAtByElementId ?? {}),
    [snapshot.elementId]: input.now,
  };
  const modifiers = modifiersFor(snapshot.proc.effectId, snapshot.proc.effectStrength);
  const variantSuffix = snapshot.variant ? ` (${snapshot.variant.displayName})` : '';

  return {
    didProc: true,
    effectId: snapshot.proc.effectId,
    procName: snapshot.proc.procName,
    modifiers,
    nextLastProcAtByElementId,
    logLine: `${snapshot.proc.procName}${variantSuffix} triggered. Cooldown ${snapshot.proc.cooldownSec}s.`,
  };
}
