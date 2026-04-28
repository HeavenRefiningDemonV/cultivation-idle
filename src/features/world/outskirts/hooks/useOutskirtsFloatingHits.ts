import { useEffect, useRef, useState } from 'react';

import type { OutskirtsCombatStage, OutskirtsFloatingHit } from '../types.js';

export interface UseOutskirtsFloatingHitsOptions {
  maxVisible?: number;
  durationMs?: number;
}

export function useOutskirtsFloatingHits(
  combatStage: OutskirtsCombatStage,
  options: UseOutskirtsFloatingHitsOptions = {},
): OutskirtsFloatingHit[] {
  const maxVisible = options.maxVisible ?? 4;
  const durationMs = options.durationMs ?? 950;
  const [visible, setVisible] = useState<OutskirtsFloatingHit[]>(combatStage.floatingHits.slice(-maxVisible));
  const seenIdsRef = useRef<string[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!combatStage.active) {
      setVisible([]);
      for (const timer of timersRef.current.values()) clearTimeout(timer);
      timersRef.current.clear();
      seenIdsRef.current = [];
      return;
    }

    if (!combatStage.hasLiveCombat && combatStage.floatingHits.length === 0) {
      setVisible([]);
      return;
    }

    const unseen = combatStage.floatingHits.filter((hit) => !seenIdsRef.current.includes(hit.id));
    if (unseen.length === 0) return;

    for (const hit of unseen) {
      seenIdsRef.current.push(hit.id);
      if (seenIdsRef.current.length > 40) seenIdsRef.current = seenIdsRef.current.slice(-40);
    }

    setVisible((current) => [...current, ...unseen].slice(-maxVisible));

    for (const hit of unseen) {
      const existing = timersRef.current.get(hit.id);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        setVisible((current) => current.filter((entry) => entry.id !== hit.id));
        timersRef.current.delete(hit.id);
      }, durationMs);
      timersRef.current.set(hit.id, timer);
    }
  }, [combatStage.active, combatStage.hasLiveCombat, combatStage.floatingHits, maxVisible, durationMs]);

  useEffect(() => () => {
    for (const timer of timersRef.current.values()) clearTimeout(timer);
    timersRef.current.clear();
  }, []);

  return visible;
}
