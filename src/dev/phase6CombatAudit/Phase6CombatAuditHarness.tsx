import { useEffect, useState } from 'react';
import type { TrialAttemptSummary } from '../../types/index.js';
import { useActivityStore } from '../../stores/activityStore.js';
import { useCityStore } from '../../stores/cityStore.js';
import { useCombatStore } from '../../stores/combatStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useRuinsStore } from '../../stores/ruinsStore.js';
import { useTrialStore } from '../../stores/trialStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useFxQuality } from '../../ui/fx/FxQualityProvider.js';
import type { FxRequestedQuality } from '../../ui/fx/types.js';
import { pickEnemyFromPool, resolveModuleRef } from '../../components/screens/world/worldUtils.js';
import { GateTrialScreenOwner } from '../../features/world/gateTrialExact/index.js';
import {
  PHASE6_COMBAT_CAPTURE_SLOT_BY_FILE,
  PHASE6_COMBAT_CAPTURE_SLOT_FILES,
  PHASE6_COMBAT_SURFACE_IDS,
  type Phase6CombatCaptureSlotFile,
  type Phase6CombatSurfaceId,
} from './phase6CombatSurfaceIds.js';
import './Phase6CombatAuditHarness.scss';

type AuditFxMode = 'high' | 'medium' | 'low' | 'reduced';
type AuditSlot = (typeof PHASE6_COMBAT_CAPTURE_SLOT_BY_FILE)[Phase6CombatCaptureSlotFile];
type RuinsExactMode = 'fixture' | 'live';
type GateTrialExactMode = 'fixture' | 'live';

const DEFAULT_CITY_ID = 'city_pinewind_hamlet';
const DEFAULT_SURFACE: Phase6CombatSurfaceId = 'outskirts';
const DEFAULT_SLOT: AuditSlot = 'base';

function parseSurfaceFromQuery(): Phase6CombatSurfaceId {
  const surface = new URLSearchParams(window.location.search).get('surface');
  if (surface && PHASE6_COMBAT_SURFACE_IDS.includes(surface as Phase6CombatSurfaceId)) {
    return surface as Phase6CombatSurfaceId;
  }
  return DEFAULT_SURFACE;
}

function parseFxModeFromQuery(): AuditFxMode {
  const fx = new URLSearchParams(window.location.search).get('fx');
  return fx === 'medium' || fx === 'low' || fx === 'reduced' ? fx : 'high';
}

function parseSlotFromQuery(): AuditSlot {
  const slot = new URLSearchParams(window.location.search).get('slot');
  if (
    slot === 'base'
    || slot === 'interaction'
    || slot === 'truth-states'
    || slot === 'high-fx'
    || slot === 'low-fx'
    || slot === 'reduced-motion'
  ) {
    return slot;
  }
  return DEFAULT_SLOT;
}

function parseRuinsExactModeFromQuery(): RuinsExactMode {
  const value = new URLSearchParams(window.location.search).get('ruinsExactMode');
  return value === 'fixture' ? 'fixture' : 'live';
}

function parseGateTrialExactModeFromQuery(): GateTrialExactMode {
  const value = new URLSearchParams(window.location.search).get('gateTrialExactMode');
  return value === 'live' ? 'live' : 'fixture';
}

function gateTrialModeForSlot(surface: Phase6CombatSurfaceId, slot: AuditSlot, requestedMode: GateTrialExactMode): GateTrialExactMode {
  if (surface !== 'gate-trial') return requestedMode;
  if (slot === 'interaction' || slot === 'truth-states') return 'live';
  return 'fixture';
}

function setQuery(next: {
  surface?: Phase6CombatSurfaceId;
  fx?: AuditFxMode;
  slot?: AuditSlot;
  controls?: '0' | '1';
  gateTrialExactMode?: GateTrialExactMode;
}) {
  const params = new URLSearchParams(window.location.search);
  params.set('uiAudit', 'phase-6-combat');
  if (next.surface) params.set('surface', next.surface);
  if (next.fx) params.set('fx', next.fx);
  if (next.slot) params.set('slot', next.slot);
  if (next.controls) params.set('controls', next.controls);
  const surface = next.surface ?? (params.get('surface') as Phase6CombatSurfaceId | null);
  if (surface === 'gate-trial') {
    params.set('gateTrialExactMode', next.gateTrialExactMode ?? parseGateTrialExactModeFromQuery());
  }
  window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`);
}

function sanitizeUiOverlays() {
  useUIStore.setState((state) => ({
    ...state,
    showOfflineProgressModal: false,
    showManualSatchelModal: false,
    showTechniqueLearnedModal: false,
    showCurrentChapterExhaustedModal: false,
    showLifeSummaryModal: false,
    showMigrationIssuesModal: false,
    notifications: [],
    pendingNotifications: [],
    activeOnboardingPrompt: null,
    queuedOnboardingPrompts: [],
  }));
}

function resolveAuditCityId(): string | null {
  const content = useContentStore.getState();
  if (!content.citiesSorted.length) return null;
  return content.maps.citiesById[DEFAULT_CITY_ID] ? DEFAULT_CITY_ID : content.citiesSorted[0]?.id ?? null;
}

function mapSurfaceToBuildingKey(surface: Phase6CombatSurfaceId): 'outskirts' | 'ruins' | 'gateTrial' {
  if (surface === 'gate-trial') return 'gateTrial';
  return surface;
}

function primeWorldModal(
  surface: Phase6CombatSurfaceId,
  ruinsExactMode: RuinsExactMode,
  gateTrialExactMode: GateTrialExactMode,
) {
  const cityId = resolveAuditCityId();
  if (!cityId) return;
  const buildingKey = mapSurfaceToBuildingKey(surface);
  const intent =
    surface === 'ruins'
      ? { ruinsExactMode }
      : surface === 'gate-trial'
        ? { gateTrialExactMode: gateTrialExactMode }
        : null;
  useCityStore.getState().setCurrentCity(cityId);
  useCityStore.getState().setSelectedModule(cityId, buildingKey);
  useUIStore.setState((state) => ({
    ...state,
    activeTab: 'adventure',
    showWorldBuildingModal: true,
    worldBuildingModalCityId: cityId,
    worldBuildingModalKey: buildingKey,
    worldBuildingModalIntent: intent,
  }));
}

function primeOutskirtsInteractionState() {
  const cityId = resolveAuditCityId();
  if (!cityId) return;

  const content = useContentStore.getState();
  const city = content.maps.citiesById[cityId] ?? null;
  const outskirtsId = resolveModuleRef(city, 'outskirts');
  if (!outskirtsId) return;
  const outskirtsDef = content.maps.outskirtsById[outskirtsId];
  if (!outskirtsDef) return;

  const enemyId = pickEnemyFromPool(outskirtsDef.enemyPool) ?? outskirtsDef.bossId;
  const enemy = enemyId ? content.maps.enemiesById[enemyId] : null;
  if (!enemy) return;

  useActivityStore.setState((state) => ({
    ...state,
    active: {
      type: 'outskirts',
      cityId,
      sourceId: outskirtsId,
      startedAt: Date.now() - 45_000,
      payload: { cityId, sourceId: outskirtsId },
    },
  }));
  useCombatStore.setState((state) => ({
    ...state,
    inCombat: true,
    combatResolved: false,
    autoAttack: true,
    autoCombatAI: true,
    combatContext: {
      type: 'outskirts',
      cityId,
      sourceId: outskirtsId,
      cityIndex: content.maps.citiesById[cityId]?.index ?? 0,
      isBoss: false,
    },
    currentEnemy: enemy,
    playerHP: '780',
    playerMaxHP: '1020',
    enemyHP: '325',
    enemyMaxHP: '900',
    combatLog: [
      { timestamp: Date.now() - 6000, type: 'player', text: 'You attacked Wild Boar for 58 damage.' },
      { timestamp: Date.now() - 5000, type: 'enemy', text: 'Wild Boar attacked you for 19 damage.' },
      { timestamp: Date.now() - 3500, type: 'system', text: 'Critical hit! You attacked Wild Boar for 121 damage.' },
    ],
  }));
}

function primeRuinsInteractionState() {
  const cityId = resolveAuditCityId();
  if (!cityId) return;
  const content = useContentStore.getState();
  const city = content.maps.citiesById[cityId] ?? null;
  const ruinsId = resolveModuleRef(city, 'ruins');
  if (!ruinsId) return;

  const ruinDef = content.maps.ruinsById[ruinsId];
  if (!ruinDef) return;
  const roomCount = Math.max(ruinDef.roomCount ?? 1, 1);
  const roomIndex = Math.min(1, roomCount - 1);
  const enemyId = ruinDef.roomPools?.mobs?.[0] ?? ruinDef.roomPools?.miniBoss?.[0] ?? ruinDef.roomPools?.finalBoss?.[0] ?? null;
  const enemy = enemyId ? content.maps.enemiesById[enemyId] : null;
  if (!enemy) return;

  useRuinsStore.setState((state) => ({
    ...state,
    autoRepeatDefault: false,
    activeRun: {
      runId: 'phase6-audit-run',
      ruinId: ruinsId,
      cityId,
      roomIndex,
      roomCount,
      startedAt: Date.now() - 70_000,
      lastTransitionAt: Date.now() - 4_000,
      autoRepeat: false,
      goldEarned: 142,
      stopping: false,
    },
    progressByRuinId: {
      ...state.progressByRuinId,
      [ruinsId]: {
        totalRuns: 6,
        totalRoomsCleared: 19,
        bossKills: 2,
        bossChestRareFailures: 3,
      },
    },
  }));

  useActivityStore.setState((state) => ({
    ...state,
    active: {
      type: 'ruins',
      cityId,
      sourceId: ruinsId,
      startedAt: Date.now() - 70_000,
      payload: { cityId, sourceId: ruinsId },
    },
  }));

  useCombatStore.setState((state) => ({
    ...state,
    inCombat: true,
    combatResolved: false,
    autoAttack: true,
    autoCombatAI: true,
    combatContext: {
      type: 'ruins',
      cityId,
      sourceId: ruinsId,
      ruinsId,
      runId: 'phase6-audit-run',
      roomIndex,
      roomCount,
      isBoss: roomIndex >= roomCount - 1,
      cityIndex: content.maps.citiesById[cityId]?.index ?? 0,
    },
    currentEnemy: enemy,
    playerHP: '920',
    playerMaxHP: '1100',
    enemyHP: '410',
    enemyMaxHP: '780',
    combatLog: [
      { timestamp: Date.now() - 7000, type: 'player', text: 'You attacked Ruin Stalker for 67 damage.' },
      { timestamp: Date.now() - 5200, type: 'enemy', text: 'Ruin Stalker attacked you for 21 damage.' },
    ],
  }));
}

function buildTrialAttemptSummary(trialId: string): TrialAttemptSummary {
  const endedAt = Date.now() - 20_000;
  return {
    trialId,
    startedAt: endedAt - 38_000,
    endedAt,
    durationSec: 38,
    bossHpPct: 52,
    maxHit: 89,
    maxHitLabel: 'Boss hit',
    suggestions: ['Raise effective HP floor', 'Enable consumables', 'Shift AI profile to survivor'],
    rollingPlayerDps: 42,
    rollingEnemyDps: 58,
    effectiveHp: 560,
    timeToDieSec: 31,
    spikeRatio: 1.4,
    auraPressureSeen: true,
  };
}

function resolveGateTrialAuditRefs(): { cityId: string; trialId: string; bossId: string | null } | null {
  const cityId = resolveAuditCityId();
  if (!cityId) return null;
  const content = useContentStore.getState();
  const city = content.maps.citiesById[cityId] ?? null;
  const trialId = resolveModuleRef(city, 'gateTrial');
  if (!trialId) return null;
  const trial = content.maps.trialsById[trialId] ?? null;
  return { cityId, trialId, bossId: trial?.bossId ?? null };
}

function primeGateTrialAvailableState() {
  const refs = resolveGateTrialAuditRefs();
  if (!refs) return;
  useActivityStore.setState((state) => ({ ...state, active: null }));
  useCombatStore.getState().exitCombat();
  useTrialStore.setState((state) => ({
    ...state,
    progressByTrialId: {
      ...state.progressByTrialId,
      [refs.trialId]: {
        attempts: 0,
        sessionAttempts: 0,
        eligibleFailures: 0,
        resolution: 'none',
        cleared: false,
        lastAttemptAt: null,
        lastClearAt: null,
        bypassedAt: null,
        attemptStartAt: null,
        lastAttemptSummary: null,
      },
    },
  }));
}

function primeGateTrialActiveState() {
  const refs = resolveGateTrialAuditRefs();
  if (!refs) return;
  const content = useContentStore.getState();
  const enemy = refs.bossId ? content.maps.enemiesById[refs.bossId] : null;
  if (!enemy) return;
  const startedAt = Date.now() - 42_000;

  useActivityStore.setState((state) => ({
    ...state,
    active: {
      type: 'trial',
      cityId: refs.cityId,
      sourceId: refs.trialId,
      startedAt,
      payload: { cityId: refs.cityId, sourceId: refs.trialId },
    },
  }));

  useCombatStore.setState((state) => ({
    ...state,
    inCombat: true,
    combatResolved: false,
    autoAttack: true,
    autoCombatAI: true,
    combatStartTime: startedAt,
    combatContext: {
      type: 'trial',
      cityId: refs.cityId,
      trialId: refs.trialId,
      countsTowardFailSafe: true,
    },
    currentEnemy: enemy,
    playerHP: '102',
    playerMaxHP: '131',
    enemyHP: '620',
    enemyMaxHP: '950',
    combatLog: [
      { timestamp: Date.now() - 7000, type: 'player', text: 'You attacked Gate Guardian for 64 damage.' },
      { timestamp: Date.now() - 5200, type: 'enemy', text: 'Gate Guardian attacked you for 27 damage.' },
      { timestamp: Date.now() - 3600, type: 'system', text: 'The Foundation Gate pressure gathers.' },
    ],
    techniqueLog: [
      { at: Date.now() - 4200, techId: 'phase6-gate-technique', message: 'Iron Palm cycled through the guard.', kind: 'cast' },
    ],
  }));
}

function primeGateTrialFailureState() {
  const refs = resolveGateTrialAuditRefs();
  if (!refs) return;

  useActivityStore.setState((state) => ({ ...state, active: null }));
  useCombatStore.getState().exitCombat();

  useTrialStore.setState((state) => ({
    ...state,
    progressByTrialId: {
      ...state.progressByTrialId,
      [refs.trialId]: {
        attempts: 3,
        sessionAttempts: 2,
        eligibleFailures: 3,
        resolution: 'none',
        cleared: false,
        lastAttemptAt: Date.now() - 20_000,
        lastClearAt: null,
        bypassedAt: null,
        attemptStartAt: null,
        lastAttemptSummary: buildTrialAttemptSummary(refs.trialId),
      },
    },
  }));

  useUIStore.setState((state) => ({
    ...state,
    settings: {
      ...state.settings,
      combatAIProfile: 'balanced',
      useConsumablesInCombat: false,
    },
  }));
}

function primeGateTrialClearedState() {
  const refs = resolveGateTrialAuditRefs();
  if (!refs) return;
  useActivityStore.setState((state) => ({ ...state, active: null }));
  useCombatStore.getState().exitCombat();
  useTrialStore.setState((state) => ({
    ...state,
    progressByTrialId: {
      ...state.progressByTrialId,
      [refs.trialId]: {
        attempts: 4,
        sessionAttempts: 0,
        eligibleFailures: 3,
        resolution: 'cleared',
        cleared: true,
        lastAttemptAt: Date.now() - 30_000,
        lastClearAt: Date.now() - 20_000,
        bypassedAt: null,
        attemptStartAt: null,
        lastAttemptSummary: null,
      },
    },
  }));
}

function primeGateTrialBypassedState() {
  const refs = resolveGateTrialAuditRefs();
  if (!refs) return;
  useActivityStore.setState((state) => ({ ...state, active: null }));
  useCombatStore.getState().exitCombat();
  useTrialStore.setState((state) => ({
    ...state,
    progressByTrialId: {
      ...state.progressByTrialId,
      [refs.trialId]: {
        attempts: 3,
        sessionAttempts: 0,
        eligibleFailures: 3,
        resolution: 'bypassed',
        cleared: false,
        lastAttemptAt: Date.now() - 35_000,
        lastClearAt: null,
        bypassedAt: Date.now() - 18_000,
        attemptStartAt: null,
        lastAttemptSummary: null,
      },
    },
  }));
}

function applySurfaceState(
  surface: Phase6CombatSurfaceId,
  slot: AuditSlot,
  ruinsExactMode: RuinsExactMode,
  gateTrialExactMode: GateTrialExactMode,
) {
  sanitizeUiOverlays();
  const effectiveGateTrialExactMode = gateTrialModeForSlot(surface, slot, gateTrialExactMode);
  primeWorldModal(surface, ruinsExactMode, effectiveGateTrialExactMode);

  useActivityStore.getState().stopActivity('phase6-combat-audit-reset');
  useCombatStore.getState().exitCombat();

  if (surface === 'gate-trial') {
    if (slot === 'base' || slot === 'high-fx' || slot === 'low-fx' || slot === 'reduced-motion') {
      primeWorldModal(surface, ruinsExactMode, 'fixture');
      primeGateTrialAvailableState();
      return;
    }

    if (slot === 'interaction') {
      primeWorldModal(surface, ruinsExactMode, 'live');
      primeGateTrialActiveState();
      return;
    }

    if (slot === 'truth-states') {
      primeWorldModal(surface, ruinsExactMode, 'live');
      primeGateTrialFailureState();
      return;
    }
  }

  if (surface === 'outskirts' && slot === 'interaction') {
    primeOutskirtsInteractionState();
    return;
  }

  if (surface === 'ruins' && slot === 'interaction' && ruinsExactMode === 'live') {
    primeRuinsInteractionState();
    return;
  }

}

function mapFxModeToRequestedQuality(fxMode: AuditFxMode): FxRequestedQuality {
  if (fxMode === 'high') return 'high';
  if (fxMode === 'medium') return 'medium';
  if (fxMode === 'low') return 'low';
  return 'medium';
}

function toSlotFile(slot: AuditSlot): Phase6CombatCaptureSlotFile {
  const entry = Object.entries(PHASE6_COMBAT_CAPTURE_SLOT_BY_FILE).find(([, mappedSlot]) => mappedSlot === slot);
  if (!entry) return '01-base.png';
  return entry[0] as Phase6CombatCaptureSlotFile;
}

export function Phase6CombatAuditHarness() {
  const enabled = import.meta.env.DEV && new URLSearchParams(window.location.search).get('uiAudit') === 'phase-6-combat';
  const [surface, setSurface] = useState<Phase6CombatSurfaceId>(() => parseSurfaceFromQuery());
  const [fxMode, setFxMode] = useState<AuditFxMode>(() => parseFxModeFromQuery());
  const [slot, setSlot] = useState<AuditSlot>(() => parseSlotFromQuery());
  const [ruinsExactMode, setRuinsExactMode] = useState<RuinsExactMode>(() => parseRuinsExactModeFromQuery());
  const [gateTrialExactMode, setGateTrialExactMode] = useState<GateTrialExactMode>(() => parseGateTrialExactModeFromQuery());
  const [showControls, setShowControls] = useState(() => new URLSearchParams(window.location.search).get('controls') !== '0');
  const { setRequestedQuality, setReducedMotionOverride } = useFxQuality();

  useEffect(() => {
    if (!enabled) return;
    applySurfaceState(surface, slot, ruinsExactMode, gateTrialExactMode);
    document.documentElement.dataset.phase6CombatAuditReady = '1';
    return () => {
      delete document.documentElement.dataset.phase6CombatAuditReady;
    };
  }, [enabled, gateTrialExactMode, ruinsExactMode, slot, surface]);

  useEffect(() => {
    if (!enabled) return;
    setRequestedQuality(mapFxModeToRequestedQuality(fxMode));
    setReducedMotionOverride(fxMode === 'reduced' ? true : false);
    document.body.classList.toggle('uiAuditReducedMotion', fxMode === 'reduced');
    return () => {
      setReducedMotionOverride(null);
      document.body.classList.remove('uiAuditReducedMotion');
    };
  }, [enabled, fxMode, setReducedMotionOverride, setRequestedQuality]);

  useEffect(() => {
    if (!enabled) return;
    const onPopState = () => {
      setSurface(parseSurfaceFromQuery());
      setFxMode(parseFxModeFromQuery());
      setSlot(parseSlotFromQuery());
      setRuinsExactMode(parseRuinsExactModeFromQuery());
      setGateTrialExactMode(parseGateTrialExactModeFromQuery());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [enabled]);

  if (!enabled) return null;

  const updateSurface = (next: Phase6CombatSurfaceId) => {
    setSurface(next);
    setQuery({ surface: next, gateTrialExactMode });
  };

  const updateFxMode = (next: AuditFxMode) => {
    setFxMode(next);
    setQuery({ fx: next });
  };

  const updateSlot = (next: AuditSlot) => {
    setSlot(next);
    setQuery({ slot: next, gateTrialExactMode: gateTrialModeForSlot(surface, next, gateTrialExactMode) });
  };

  const toggleControls = () => {
    const next = !showControls;
    setShowControls(next);
    setQuery({ controls: next ? '1' : '0' });
  };
  const effectiveGateTrialExactMode = gateTrialModeForSlot(surface, slot, gateTrialExactMode);
  const gateTrialRefs = surface === 'gate-trial' ? resolveGateTrialAuditRefs() : null;

  return (
    <>
      {surface === 'gate-trial' && gateTrialRefs ? (
        <div
          data-ui="gate-trial-exact-audit-host"
          data-gate-trial-exact-mode={effectiveGateTrialExactMode}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483000,
            width: '100vw',
            height: '100vh',
            background: '#e8dcc8',
          }}
        >
          <GateTrialScreenOwner
            cityId={gateTrialRefs.cityId}
            trialId={gateTrialRefs.trialId}
            forceFixture={effectiveGateTrialExactMode === 'live' ? false : true}
          />
        </div>
      ) : null}

      <div
        data-ui="phase6-combat-ready"
        data-ready="1"
        data-surface={surface}
        data-slot={slot}
        data-slot-file={toSlotFile(slot)}
        data-fx={fxMode}
        data-gate-trial-exact-mode={surface === 'gate-trial' ? effectiveGateTrialExactMode : undefined}
        className="phase6CombatAuditReadyBeacon"
      />

      {showControls ? (
        <aside className="phase6CombatAuditPanel" data-ui="phase-6-combat-audit-controls">
          <div className="phase6CombatAuditPanel__title">Phase 6 Combat Audit Harness</div>
          <label>
            Surface
            <select value={surface} onChange={(event) => updateSurface(event.target.value as Phase6CombatSurfaceId)}>
              {PHASE6_COMBAT_SURFACE_IDS.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </label>
          <label>
            Slot
            <select value={slot} onChange={(event) => updateSlot(event.target.value as AuditSlot)}>
              {Object.values(PHASE6_COMBAT_CAPTURE_SLOT_BY_FILE).map((slotValue) => (
                <option key={slotValue} value={slotValue}>{slotValue}</option>
              ))}
            </select>
          </label>
          <label>
            FX
            <select value={fxMode} onChange={(event) => updateFxMode(event.target.value as AuditFxMode)}>
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
              <option value="reduced">reduced</option>
            </select>
          </label>
          <button type="button" className="button-standard" onClick={toggleControls}>Hide Controls</button>
          <div className="phase6CombatAuditPanel__meta">Route shape: <code>?uiAudit=phase-6-combat&amp;surface=&lt;id&gt;&amp;fx=&lt;mode&gt;&amp;slot=&lt;slot&gt;</code></div>
          <div className="phase6CombatAuditPanel__meta">City fixture default: <code>{DEFAULT_CITY_ID}</code>.</div>
        </aside>
      ) : null}
    </>
  );
}

export function isPhase6CombatAuditQueryEnabled() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('uiAudit') === 'phase-6-combat';
}

export function getPhase6CombatSlotFromFile(fileName: Phase6CombatCaptureSlotFile): AuditSlot {
  return PHASE6_COMBAT_CAPTURE_SLOT_BY_FILE[fileName];
}

export function getPhase6CombatCaptureSlotFiles() {
  return [...PHASE6_COMBAT_CAPTURE_SLOT_FILES];
}
