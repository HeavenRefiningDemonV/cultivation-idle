import { useCallback, useRef, useState } from 'react';
import { useGameStore } from '../../../stores/gameStore.js';
import { useActivityStore } from '../../../stores/activityStore.js';
import { useUIStore, type GameTab } from '../../../stores/uiStore.js';
import type { FocusMode } from '../../../types/index.js';
import type {
  CultivationDeepLink,
  CultivationFocusAxisId,
  CultivationScrollId,
} from '../../../systems/ui/cultivation/cultivationSeatTypes.js';
import {
  CULTIVATION_CEREMONY_EXIT_INTENT,
  type BreakthroughCeremonyResult,
} from '../../../systems/ui/cultivation/cultivationBreakthroughCeremony.js';

/**
 * M.II.3 — the ONLY mutation path (§6). The screen emits these intents; the runtime decides
 * their effect. UI-only state (which scroll is open) is local here. No gameplay math, no dice.
 */
export interface CultivationSeatActions {
  onSetFocusEmphasis: (axisId: CultivationFocusAxisId) => void;
  onSetForeground: (kind: 'cultivate' | 'temper' | 'tend') => void;
  onCommitCrossing: () => void;
  onOpenScroll: (id: CultivationScrollId) => void;
  onCloseScroll: () => void;
  onDeepLink: (target: CultivationDeepLink) => void;
  selectedScroll: CultivationScrollId | null;
  // M.II.3 Wave 6 — the F2 ceremony seam (the crossing is resolved by the engine; the shell presents it).
  ceremony: { open: boolean; result: BreakthroughCeremonyResult | null };
  onCeremonyIntent: (intent: string) => void;
  onCeremonyClose: () => void;
}

// §6 Option B: each of the seven display axes maps to the real live 3-way FocusMode whose mechanical
// trade MATCHES the axis's intent, so the pick never contradicts its own effect text (M.II.3
// truthful-now). spirit = +50% qi/s, −20% HP; body = +50% HP & DEF, −20% qi/s; balanced = no trade.
// The exact 7-way pick is preserved separately in uiStore.cultivationFocusAxis for the display.
function axisToFocusMode(axisId: CultivationFocusAxisId): FocusMode {
  // qi / mind / throughput axes lean into faster cultivation (Spirit).
  if (axisId === 'qiPool' || axisId === 'spiritualSense' || axisId === 'meridian' || axisId === 'dao') return 'spirit';
  // endurance / survivability axes lean into the body (Body).
  if (axisId === 'soulStrength' || axisId === 'body') return 'body';
  // qiPurity = the even, balanced cycle.
  return 'balanced';
}

// Deep-link → the live top tab (world-building modules route to the world tab; module-open is a follow-up).
const DEEP_LINK_TAB: Record<CultivationDeepLink, GameTab> = {
  'status.constellation': 'status',
  'court.meridians': 'adventure',
  daoHeart: 'cultivation',
  'world.map': 'adventure',
  'prestige.records': 'prestige',
  'forge.equipment': 'adventure',
  expeditions: 'adventure',
  alchemy: 'adventure',
};

export function useCultivationSeatActionController(): CultivationSeatActions {
  const [selectedScroll, setSelectedScroll] = useState<CultivationScrollId | null>(null);
  const [ceremony, setCeremony] = useState<{ open: boolean; result: BreakthroughCeremonyResult | null }>({ open: false, result: null });
  // Single-fire guard: one crossing resolves/presents at a time. A rapid double-click (before the
  // ceremony modal renders over the commit button) must not call game.breakthrough() twice.
  const crossingInFlightRef = useRef(false);

  const onSetFocusEmphasis = useCallback((axisId: CultivationFocusAxisId) => {
    // Store the exact 7-way pick (the display source of truth) AND apply the mapped 3-way gameplay
    // focus. This is why picking now "works the same" as the artifact — the clicked axis is the one
    // that stays emphasised, instead of round-tripping lossily through the 3-way mode.
    try {
      useUIStore.getState().setCultivationFocusAxis(axisId);
    } catch {
      // ui focus setter unavailable
    }
    try {
      useGameStore.getState().setFocusMode(axisToFocusMode(axisId));
    } catch {
      // focus setter unavailable
    }
  }, []);

  const onSetForeground = useCallback((kind: 'cultivate' | 'temper' | 'tend') => {
    if (kind !== 'cultivate') return; // temper/tend route through their own systems; cultivate is the Seat's foreground
    try {
      useActivityStore.getState().startActivity('meditate', undefined, 'cultivation-seat-start');
    } catch {
      // activity store unavailable
    }
  }, []);

  const onCommitCrossing = useCallback(() => {
    // The menu REQUESTS the crossing; the engine resolves it (realm advance on success, pity bank
    // on failure — never-regress is enforced in gameStore.breakthrough(), M.II.1). The ceremony
    // then PRESENTS the held outcome via the F2 RitualCeremonyShell. No client-side dice.
    if (crossingInFlightRef.current) return; // ignore re-entry while a crossing is resolving/presenting
    crossingInFlightRef.current = true;
    setSelectedScroll(null);
    let result: BreakthroughCeremonyResult = { ok: false, advanced: false, fromRealmName: '' };
    try {
      const game = useGameStore.getState();
      const fromRealmName = game.realm.name;
      const fromIndex = game.realm.index;
      const ok = game.breakthrough();
      const after = useGameStore.getState();
      result = { ok: ok === true, advanced: after.realm.index > fromIndex, fromRealmName };
    } catch (err) {
      // breakthrough trigger unavailable — present the held (not-yet) outcome rather than crash
      console.warn('[cultivationSeat] breakthrough() threw; presenting the held (not-yet) outcome', err);
    }
    setCeremony({ open: true, result });
  }, []);

  const closeCeremony = useCallback(() => {
    crossingInFlightRef.current = false;
    setCeremony({ open: false, result: null });
  }, []);
  const onCeremonyClose = closeCeremony;
  const onCeremonyIntent = useCallback(
    (intent: string) => {
      // exit / skip both close the ceremony (the outcome is already held in the surface).
      if (intent === CULTIVATION_CEREMONY_EXIT_INTENT || intent.endsWith('.skip') || intent.endsWith('.exit')) {
        closeCeremony();
      }
    },
    [closeCeremony],
  );

  const onOpenScroll = useCallback((id: CultivationScrollId) => setSelectedScroll(id), []);
  const onCloseScroll = useCallback(() => setSelectedScroll(null), []);

  const onDeepLink = useCallback((target: CultivationDeepLink) => {
    try {
      useUIStore.getState().setActiveTab(DEEP_LINK_TAB[target]);
    } catch {
      // nav unavailable
    }
  }, []);

  return { onSetFocusEmphasis, onSetForeground, onCommitCrossing, onOpenScroll, onCloseScroll, onDeepLink, selectedScroll, ceremony, onCeremonyIntent, onCeremonyClose };
}
