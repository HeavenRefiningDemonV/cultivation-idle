import type { CombatEvent } from '../../../types/index.js';
import type {
  OutskirtsCombatStageLogLine,
  OutskirtsFloatingHit,
} from './types.js';

export interface OutskirtsFloatingHitBuildInput {
  combatEvents: CombatEvent[];
  logLines: OutskirtsCombatStageLogLine[];
  existingFixtureHits?: OutskirtsFloatingHit[];
}

export function classifyOutskirtsFloatingHitFromCombatEvent(
  event: CombatEvent,
): Omit<OutskirtsFloatingHit, 'x' | 'y' | 'source'> | null {
  if (event.type === 'HIT') {
    const amount = Number(event.amount);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    return {
      id: `floating-${event.id}`,
      text: `-${Math.round(amount)}`,
      target: event.target,
      kind: event.isCrit ? 'crit' : 'normal',
    };
  }

  if (event.type === 'HEAL') {
    const amount = Number(event.amount);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    return {
      id: `floating-${event.id}`,
      text: `+${Math.round(amount)}`,
      target: 'player',
      kind: 'heal',
    };
  }

  return null;
}

export function classifyOutskirtsFloatingHitFromLogLine(
  line: OutskirtsCombatStageLogLine,
): Omit<OutskirtsFloatingHit, 'x' | 'y' | 'source'> | null {
  const text = line.text.toLowerCase();

  const isPlayerMiss = (text.includes('you attacked') || text.includes('you struck')) && text.includes('missed');
  if (isPlayerMiss) {
    return { id: `floating-${line.id}`, text: 'Miss', target: 'enemy', kind: 'miss' };
  }

  const isEnemyMiss = line.tone === 'enemy' && text.includes('missed');
  if (isEnemyMiss || text.includes('attacked but it missed')) {
    return { id: `floating-${line.id}`, text: 'Miss', target: 'player', kind: 'miss' };
  }

  return null;
}

function hashToUnitInterval(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return ((hash >>> 0) % 10000) / 10000;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function pickOutskirtsFloatingHitPosition(
  hit: Pick<OutskirtsFloatingHit, 'id' | 'kind' | 'target'>,
): { x: number; y: number } {
  const base = (() => {
    if (hit.target === 'enemy' && hit.kind === 'crit') return { x: 70, y: 39 };
    if (hit.target === 'enemy' && hit.kind === 'miss') return { x: 68, y: 48 };
    if (hit.target === 'enemy') return { x: 72, y: 42 };
    if (hit.target === 'player' && hit.kind === 'crit') return { x: 29, y: 49 };
    if (hit.target === 'player' && hit.kind === 'miss') return { x: 27, y: 50 };
    if (hit.target === 'player' && hit.kind === 'heal') return { x: 28, y: 42 };
    return { x: 30, y: 52 };
  })();

  const xJitter = (hashToUnitInterval(`${hit.id}-x`) * 10) - 5;
  const yJitter = (hashToUnitInterval(`${hit.id}-y`) * 14) - 7;

  return {
    x: clamp(base.x + xJitter, 16, 84),
    y: clamp(base.y + yJitter, 18, 72),
  };
}

export function buildOutskirtsFloatingHitsFromCombatFeedback(
  input: OutskirtsFloatingHitBuildInput,
): OutskirtsFloatingHit[] {
  const combined: OutskirtsFloatingHit[] = [];
  if (input.existingFixtureHits?.length) {
    combined.push(...input.existingFixtureHits.map((hit) => ({ ...hit })));
  }

  for (const event of input.combatEvents) {
    const classified = classifyOutskirtsFloatingHitFromCombatEvent(event);
    if (!classified) continue;
    const pos = pickOutskirtsFloatingHitPosition(classified);
    combined.push({ ...classified, ...pos, source: 'live' });
  }

  for (const line of input.logLines) {
    const classified = classifyOutskirtsFloatingHitFromLogLine(line);
    if (!classified) continue;
    const pos = pickOutskirtsFloatingHitPosition(classified);
    combined.push({ ...classified, ...pos, source: 'live' });
  }

  const byId = new Map<string, OutskirtsFloatingHit>();
  for (const hit of combined) byId.set(hit.id, hit);
  return Array.from(byId.values()).slice(-8);
}
