import { useEffect, useMemo, useState } from 'react';
import { DaoHeartModal } from '../../components/modals/DaoHeartModal.js';
import { LifeStartWizardModal } from '../../components/modals/LifeStartWizardModal.js';
import { PrestigeRitualModal } from '../../components/modals/PrestigeRitualModal.js';
import { getPrestigeAdvisorSurface } from '../../features/prestige/prestigeAdvisorSurface.js';
import { getLiveRealmNameByIndex } from '../../systems/progression/runtime/index.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { ChangeHeartLawModal } from '../../ui/cultivation/heartLaw/ChangeHeartLawModal.js';
import { useFxQuality } from '../../ui/fx/FxQualityProvider.js';
import type { FxRequestedQuality } from '../../ui/fx/types.js';
import { SECTION_C_SURFACE_IDS, type SectionCSurfaceId } from './sectionCSurfaceIds.js';
import './SectionCAuditHarness.scss';
type AuditFxMode = 'high' | 'low' | 'reduced';

const FORCED_ONLY_SURFACES: ReadonlySet<SectionCSurfaceId> = new Set(['life-start-breath-focus']);
const DEFAULT_SURFACE: SectionCSurfaceId = 'life-start-path';

function parseSurfaceFromQuery(): SectionCSurfaceId {
  const surface = new URLSearchParams(window.location.search).get('surface');
  if (surface && SECTION_C_SURFACE_IDS.includes(surface as SectionCSurfaceId)) {
    return surface as SectionCSurfaceId;
  }
  return DEFAULT_SURFACE;
}

function parseFxModeFromQuery(): AuditFxMode {
  const fx = new URLSearchParams(window.location.search).get('fx');
  return fx === 'low' || fx === 'reduced' ? fx : 'high';
}

function setQuery(next: { surface?: SectionCSurfaceId; fx?: AuditFxMode; controls?: '0' | '1' }) {
  const params = new URLSearchParams(window.location.search);
  params.set('uiAudit', 'section-c');
  if (next.surface) params.set('surface', next.surface);
  if (next.fx) params.set('fx', next.fx);
  if (next.controls) params.set('controls', next.controls);
  window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`);
}

function pickAuditHeartLawId(): string | null {
  const content = useContentStore.getState();
  if (!content.isLoaded) return null;
  try {
    return content.listHeartLaws()[0]?.id ?? null;
  } catch {
    return null;
  }
}

function sanitizeUiOverlays() {
  // Dev-only harness shim: this state hygiene prevents non-target overlays from contaminating manual captures.
  useUIStore.setState((state) => ({
    ...state,
    showOfflineProgressModal: false,
    showManualSatchelModal: false,
    showTechniqueLearnedModal: false,
    showWorldBuildingModal: false,
    showMigrationIssuesModal: false,
    notifications: [],
    pendingNotifications: [],
    activeOnboardingPrompt: null,
    queuedOnboardingPrompts: [],
  }));
}

function applySurfaceState(surface: SectionCSurfaceId) {
  sanitizeUiOverlays();
  const heartLawId = pickAuditHeartLawId();

  useUIStore.setState((state) => ({
    ...state,
    activeTab: surface === 'prestige-ritual' ? 'prestige' : 'cultivation',
    showCurrentChapterExhaustedModal: surface === 'current-chapter-exhausted',
    showLifeSummaryModal: surface === 'life-summary',
    lifeSummaryMode: 'current',
    currentChapterExhaustedAcknowledgedThisLife: false,
  }));

  if (surface === 'life-start-path') {
    useGameStore.setState((state) => ({ ...state, selectedPath: null }));
    useCultivationStore.setState((state) => ({ ...state, selectedHeartLawId: null }));
    return;
  }

  if (surface === 'life-start-heart-law') {
    useGameStore.setState((state) => ({ ...state, selectedPath: 'heaven' }));
    useCultivationStore.setState((state) => ({ ...state, selectedHeartLawId: null }));
    return;
  }

  if (surface === 'life-start-breath-focus') {
    useGameStore.setState((state) => ({ ...state, selectedPath: 'heaven' }));
    useCultivationStore.setState((state) => ({ ...state, selectedHeartLawId: heartLawId }));
    return;
  }

  useGameStore.setState((state) => ({ ...state, selectedPath: 'heaven' }));
  useCultivationStore.setState((state) => ({
    ...state,
    selectedHeartLawId: heartLawId,
    chapter: 2,
    comprehension: 24,
  }));
}

function mapFxModeToRequestedQuality(fxMode: AuditFxMode): FxRequestedQuality {
  return fxMode === 'high' ? 'high' : 'low';
}

export function SectionCAuditHarness() {
  const enabled = import.meta.env.DEV && new URLSearchParams(window.location.search).get('uiAudit') === 'section-c';
  const [surface, setSurface] = useState<SectionCSurfaceId>(() => parseSurfaceFromQuery());
  const [fxMode, setFxMode] = useState<AuditFxMode>(() => parseFxModeFromQuery());
  const [showControls, setShowControls] = useState(() => new URLSearchParams(window.location.search).get('controls') !== '0');
  const [showDaoHeart, setShowDaoHeart] = useState(false);
  const { setRequestedQuality } = useFxQuality();

  useEffect(() => {
    if (!enabled) return;
    applySurfaceState(surface);
  }, [enabled, surface]);

  useEffect(() => {
    if (!enabled) return;
    setRequestedQuality(mapFxModeToRequestedQuality(fxMode));
    document.body.classList.toggle('uiAuditReducedMotion', fxMode === 'reduced');
    return () => {
      document.body.classList.remove('uiAuditReducedMotion');
    };
  }, [enabled, fxMode, setRequestedQuality]);

  useEffect(() => {
    if (!enabled) return;
    setShowDaoHeart(surface === 'dao-heart-law' || surface === 'dao-heart-study');
  }, [enabled, surface]);

  useEffect(() => {
    if (!enabled) return;
    const onPopState = () => {
      setSurface(parseSurfaceFromQuery());
      setFxMode(parseFxModeFromQuery());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [enabled]);

  const prestigeModalProps = useMemo(() => {
    const advisor = getPrestigeAdvisorSurface();
    const breakdown = usePrestigeStore.getState().getApBreakdown();
    return {
      apGain: Math.max(1, advisor.apForecast.potentialGain),
      advisorLabel: advisor.stateLabel,
      advisorDetail: advisor.stateDetail,
      breakdown: {
        ...breakdown,
        potentialGain: Math.max(1, breakdown.potentialGain),
      },
      resetPreview: advisor.resetPreview,
      currentRealm: getLiveRealmNameByIndex(useGameStore.getState().realm.index),
    };
  }, [surface]);

  if (!enabled) return null;

  const updateSurface = (next: SectionCSurfaceId) => {
    setSurface(next);
    setQuery({ surface: next });
  };

  const updateFxMode = (next: AuditFxMode) => {
    setFxMode(next);
    setQuery({ fx: next });
  };

  const toggleControls = () => {
    const next = !showControls;
    setShowControls(next);
    setQuery({ controls: next ? '1' : '0' });
  };

  const heartLawId = useCultivationStore((state) => state.selectedHeartLawId);

  return (
    <>
      {showControls ? (
        <aside className="sectionCAuditPanel" data-ui="section-c-audit-controls">
          <div className="sectionCAuditPanel__title">Section C Audit Harness</div>
          <label>
            Surface
            <select value={surface} onChange={(event) => updateSurface(event.target.value as SectionCSurfaceId)}>
              {SECTION_C_SURFACE_IDS.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </label>
          <label>
            FX
            <select value={fxMode} onChange={(event) => updateFxMode(event.target.value as AuditFxMode)}>
              <option value="high">high</option>
              <option value="low">low</option>
              <option value="reduced">reduced</option>
            </select>
          </label>
          <button type="button" className="button-standard" onClick={toggleControls}>Hide Controls</button>
          <div className="sectionCAuditPanel__meta">
            Reachability: {FORCED_ONLY_SURFACES.has(surface) ? 'forced-only for audit' : 'live / state-gated'}
          </div>
          <div className="sectionCAuditPanel__meta">Narrow-width pass uses manual browser resize.</div>
        </aside>
      ) : (
        <button type="button" className="sectionCAuditPanel__show" onClick={toggleControls}>Show Audit Controls</button>
      )}

      {surface === 'life-start-breath-focus' ? <LifeStartWizardModal debugForceOpen debugForceStep={3} /> : null}

      {(surface === 'dao-heart-law' || surface === 'dao-heart-study') && showDaoHeart ? (
        <DaoHeartModal onClose={() => setShowDaoHeart(false)} debugInitialTab={surface === 'dao-heart-study' ? 'study' : 'heartLaw'} />
      ) : null}

      {surface === 'change-heart-law' ? (
        <ChangeHeartLawModal
          currentHeartLawId={heartLawId}
          canChange
          onClose={() => undefined}
        />
      ) : null}

      {surface === 'prestige-ritual' ? (
        <PrestigeRitualModal
          open
          apGain={prestigeModalProps.apGain}
          breakdown={prestigeModalProps.breakdown}
          advisorLabel={prestigeModalProps.advisorLabel}
          advisorDetail={prestigeModalProps.advisorDetail}
          resetPreview={prestigeModalProps.resetPreview}
          canPrestigeNow
          currentRealm={prestigeModalProps.currentRealm}
          sellBeforePrestige
          onClose={() => undefined}
          onConfirm={() => false}
        />
      ) : null}
    </>
  );
}

export function isSectionCAuditQueryEnabled() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('uiAudit') === 'section-c';
}
