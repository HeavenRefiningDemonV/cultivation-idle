import { useEffect, useMemo, useRef, useState } from 'react';

import type {
  OutskirtsCombatMotionState,
  OutskirtsCombatStage,
  OutskirtsCombatStageLogLine,
} from '../types.js';

export interface OutskirtsActorMotionState {
  playerMotion: OutskirtsCombatMotionState;
  enemyMotion: OutskirtsCombatMotionState;
}

export interface OutskirtsMotionCue {
  player?: OutskirtsCombatMotionState;
  enemy?: OutskirtsCombatMotionState;
}

export function classifyOutskirtsCombatMotionLine(line: Pick<OutskirtsCombatStageLogLine, 'text' | 'tone'>): OutskirtsMotionCue | null {
  const text = line.text.toLowerCase();
  const enemyAttack = /\b(attacked you|landed a critical hit|attacked but it missed|attacked, but your shield absorbed it)\b/.test(text);
  const playerAttack = /\byou attacked\b/.test(text);

  if (playerAttack && /\bmissed\b/.test(text)) return { player: 'attack', enemy: 'dodge' };
  if (playerAttack && /(damage|critical hit|struck)/.test(text)) return { player: 'attack', enemy: 'hit' };
  if (enemyAttack && /\bmissed\b/.test(text)) return { enemy: 'attack', player: 'dodge' };
  if (enemyAttack) return { enemy: 'attack', player: 'hit' };

  if (/\b(defeated|slain|fell|collapsed)\b/.test(text)) {
    if (line.tone === 'enemy' || /you /.test(text)) return { player: 'defeat' };
    if (line.tone === 'player' || /wolf|foe|enemy/.test(text)) return { enemy: 'defeat' };
  }

  return null;
}

export function useOutskirtsCombatMotion(combatStage: OutskirtsCombatStage): OutskirtsActorMotionState {
  const base = useMemo<OutskirtsActorMotionState>(() => {
    if (!combatStage.active) return { playerMotion: 'idle', enemyMotion: 'idle' };
    return {
      playerMotion: combatStage.player.motionState === 'defeat' ? 'defeat' : 'idle',
      enemyMotion: combatStage.enemy.motionState === 'defeat' ? 'defeat' : 'idle',
    };
  }, [combatStage.active, combatStage.player.motionState, combatStage.enemy.motionState]);

  const [motion, setMotion] = useState<OutskirtsActorMotionState>(base);
  const seenLineIdsRef = useRef<string[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMotion(base);
  }, [base]);

  useEffect(() => {
    if (!combatStage.active || !combatStage.hasLiveCombat) return;

    for (const line of combatStage.logLines) {
      if (seenLineIdsRef.current.includes(line.id)) continue;
      seenLineIdsRef.current.push(line.id);
      if (seenLineIdsRef.current.length > 20) seenLineIdsRef.current = seenLineIdsRef.current.slice(-20);

      const cue = classifyOutskirtsCombatMotionLine(line);
      if (!cue) continue;

      setMotion((current) => {
        const next: OutskirtsActorMotionState = { ...current };
        if (current.playerMotion !== 'defeat' && cue.player) next.playerMotion = cue.player;
        if (current.enemyMotion !== 'defeat' && cue.enemy) next.enemyMotion = cue.enemy;
        return next;
      });

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setMotion((current) => ({
          playerMotion: current.playerMotion === 'defeat' ? 'defeat' : 'idle',
          enemyMotion: current.enemyMotion === 'defeat' ? 'defeat' : 'idle',
        }));
      }, 260);
    }
  }, [combatStage.active, combatStage.hasLiveCombat, combatStage.logLines]);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return motion;
}
