import { useEffect, useState } from 'react';
import { LifeStartWizardModal } from '../../components/modals/LifeStartWizardModal.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useHeartLawStore } from '../../stores/heartLawStore.js';
import { useUIStore, type WorldBuildingKey } from '../../stores/uiStore.js';
import { useFxQuality } from '../../ui/fx/FxQualityProvider.js';
import type { FxRequestedQuality } from '../../ui/fx/types.js';
import {
  PHASE0_CORE_CAPTURE_SLOT_BY_FILE,
  PHASE0_CORE_CAPTURE_SLOT_FILES,
  PHASE0_CORE_SURFACE_IDS,
  type Phase0CoreCaptureSlotFile,
  type Phase0CoreSurfaceId,
} from './phase0CoreSurfaceIds.js';
import './Phase0CoreAuditHarness.scss';

type AuditFxMode = 'high' | 'medium' | 'low' | 'reduced';
type AuditSlot = (typeof PHASE0_CORE_CAPTURE_SLOT_BY_FILE)[Phase0CoreCaptureSlotFile];

const DEFAULT_SURFACE: Phase0CoreSurfaceId = 'path-life-start';
const DEFAULT_SLOT: AuditSlot = 'base';
const DEFAULT_CITY_ID = 'city_pinewind_hamlet';

function parseSurfaceFromQuery(): Phase0CoreSurfaceId {
  const surface = new URLSearchParams(window.location.search).get('surface');
  if (surface && PHASE0_CORE_SURFACE_IDS.includes(surface as Phase0CoreSurfaceId)) {
    return surface as Phase0CoreSurfaceId;
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

function setQuery(next: { surface?: Phase0CoreSurfaceId; fx?: AuditFxMode; slot?: AuditSlot; controls?: '0' | '1' }) {
  const params = new URLSearchParams(window.location.search);
  params.set('uiAudit', 'phase-0');
  if (next.surface) params.set('surface', next.surface);
  if (next.fx) params.set('fx', next.fx);
  if (next.slot) params.set('slot', next.slot);
  if (next.controls) params.set('controls', next.controls);
  window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`);
}

function sanitizeUiOverlays() {
  useUIStore.setState((state) => ({
    ...state,
    showOfflineProgressModal: false,
    showManualSatchelModal: false,
    showTechniqueLearnedModal: false,
    showWorldBuildingModal: false,
    worldBuildingModalCityId: null,
    worldBuildingModalKey: null,
    worldBuildingModalIntent: null,
    showCurrentChapterExhaustedModal: false,
    showLifeSummaryModal: false,
    showMigrationIssuesModal: false,
    showPrestigeModal: false,
    notifications: [],
    pendingNotifications: [],
    activeOnboardingPrompt: null,
    queuedOnboardingPrompts: [],
  }));
}

function setWorldBuildingState(buildingKey: WorldBuildingKey | null) {
  if (!buildingKey) return;
  useUIStore.setState((state) => ({
    ...state,
    activeTab: 'adventure',
    showWorldBuildingModal: true,
    worldBuildingModalCityId: DEFAULT_CITY_ID,
    worldBuildingModalKey: buildingKey,
    worldBuildingModalIntent: buildingKey === 'apothecary' ? { apothecarySurface: 'pouch' } : null,
  }));
}

function applySurfaceState(surface: Phase0CoreSurfaceId, slot: AuditSlot) {
  sanitizeUiOverlays();

  const slotIsInteraction = slot === 'interaction';
  const slotIsTruth = slot === 'truth-states';

  if (surface === 'path-life-start') {
    useUIStore.setState((state) => ({ ...state, activeTab: 'cultivation' }));
    if (slotIsInteraction || slotIsTruth) {
      useGameStore.setState((state) => ({ ...state, selectedPath: 'heaven' }));
      useHeartLawStore.setState((state) => ({ ...state, selectedHeartLawId: null }));
    } else {
      useGameStore.setState((state) => ({ ...state, selectedPath: null }));
      useHeartLawStore.setState((state) => ({ ...state, selectedHeartLawId: null }));
    }
    return;
  }

  useGameStore.setState((state) => ({ ...state, selectedPath: 'heaven' }));
  useHeartLawStore.setState((state) => ({ ...state, selectedHeartLawId: slotIsInteraction ? null : state.selectedHeartLawId }));

  if (surface === 'cultivation') {
    useUIStore.setState((state) => ({ ...state, activeTab: 'cultivation' }));
    return;
  }

  if (surface === 'status') {
    useUIStore.setState((state) => ({ ...state, activeTab: 'status' }));
    return;
  }

  if (surface === 'world') {
    useUIStore.setState((state) => ({ ...state, activeTab: 'adventure' }));
    return;
  }

  if (surface === 'manual-pavilion') {
    setWorldBuildingState('manualPavilion');
    return;
  }

  if (surface === 'techniques') {
    useUIStore.setState((state) => ({ ...state, activeTab: 'techniques' }));
    return;
  }

  if (surface === 'apothecary') {
    setWorldBuildingState('apothecary');
    return;
  }

  if (surface === 'forge') {
    setWorldBuildingState('forge');
    return;
  }

  if (surface === 'bounties-expeditions') {
    setWorldBuildingState(slotIsTruth ? 'expeditions' : 'bounties');
    return;
  }

  if (surface === 'prestige') {
    useUIStore.setState((state) => ({ ...state, activeTab: 'prestige' }));
  }
}

function mapFxModeToRequestedQuality(fxMode: AuditFxMode): FxRequestedQuality {
  if (fxMode === 'high') return 'high';
  if (fxMode === 'medium') return 'medium';
  if (fxMode === 'low') return 'low';
  return 'medium';
}

function toSlotFile(slot: AuditSlot): Phase0CoreCaptureSlotFile {
  const entry = Object.entries(PHASE0_CORE_CAPTURE_SLOT_BY_FILE).find(([, mappedSlot]) => mappedSlot === slot);
  if (!entry) return '01-base.png';
  return entry[0] as Phase0CoreCaptureSlotFile;
}

export function Phase0CoreAuditHarness() {
  const enabled = import.meta.env.DEV && new URLSearchParams(window.location.search).get('uiAudit') === 'phase-0';
  const [surface, setSurface] = useState<Phase0CoreSurfaceId>(() => parseSurfaceFromQuery());
  const [fxMode, setFxMode] = useState<AuditFxMode>(() => parseFxModeFromQuery());
  const [slot, setSlot] = useState<AuditSlot>(() => parseSlotFromQuery());
  const [showControls, setShowControls] = useState(() => new URLSearchParams(window.location.search).get('controls') !== '0');
  const { setRequestedQuality, setReducedMotionOverride } = useFxQuality();

  useEffect(() => {
    if (!enabled) return;
    applySurfaceState(surface, slot);
    document.documentElement.dataset.phase0AuditReady = '1';
    return () => {
      delete document.documentElement.dataset.phase0AuditReady;
    };
  }, [enabled, surface, slot]);

  useEffect(() => {
    if (!enabled) return;
    setRequestedQuality(mapFxModeToRequestedQuality(fxMode));
    setReducedMotionOverride(fxMode === 'reduced' ? true : false);
    // Compatibility shim for CSS transitions outside provider-backed FX surfaces.
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
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [enabled]);

  if (!enabled) return null;

  const updateSurface = (next: Phase0CoreSurfaceId) => {
    setSurface(next);
    setQuery({ surface: next });
  };

  const updateFxMode = (next: AuditFxMode) => {
    setFxMode(next);
    setQuery({ fx: next });
  };

  const updateSlot = (next: AuditSlot) => {
    setSlot(next);
    setQuery({ slot: next });
  };

  const toggleControls = () => {
    const next = !showControls;
    setShowControls(next);
    setQuery({ controls: next ? '1' : '0' });
  };

  return (
    <>
      <div
        data-ui="phase0-core-ready"
        data-ready="1"
        data-surface={surface}
        data-slot={slot}
        data-slot-file={toSlotFile(slot)}
        data-fx={fxMode}
        className="phase0CoreAuditReadyBeacon"
      />

      {showControls ? (
        <aside className="phase0CoreAuditPanel" data-ui="phase-0-audit-controls">
          <div className="phase0CoreAuditPanel__title">Phase 0 Core Audit Harness</div>
          <label>
            Surface
            <select value={surface} onChange={(event) => updateSurface(event.target.value as Phase0CoreSurfaceId)}>
              {PHASE0_CORE_SURFACE_IDS.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </label>
          <label>
            Slot
            <select value={slot} onChange={(event) => updateSlot(event.target.value as AuditSlot)}>
              {Object.values(PHASE0_CORE_CAPTURE_SLOT_BY_FILE).map((slotValue) => (
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
          <div className="phase0CoreAuditPanel__meta">Capture mode writes legal slot filenames in fixed order.</div>
          <div className="phase0CoreAuditPanel__meta">Route shape: <code>?uiAudit=phase-0&amp;surface=&lt;id&gt;&amp;fx=&lt;mode&gt;&amp;slot=&lt;slot&gt;</code></div>
        </aside>
      ) : null}

      {surface === 'path-life-start' ? (
        <LifeStartWizardModal debugForceOpen debugForceStep={slot === 'interaction' || slot === 'truth-states' ? 2 : 1} />
      ) : null}
    </>
  );
}

export function isPhase0CoreAuditQueryEnabled() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('uiAudit') === 'phase-0';
}

export function getPhase0SlotFromFile(fileName: Phase0CoreCaptureSlotFile): AuditSlot {
  return PHASE0_CORE_CAPTURE_SLOT_BY_FILE[fileName];
}

export function getPhase0CoreCaptureSlotFiles() {
  return [...PHASE0_CORE_CAPTURE_SLOT_FILES];
}
