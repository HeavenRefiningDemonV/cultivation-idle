import { useCallback, useState, type CSSProperties } from 'react';
import type { StatusLedgerActionSurface } from '../../../systems/ui/status/statusLedgerTypes.js';
import {
  resolveObservatoryPresentation,
  STATUS_OBSERVATORY_VISUAL_STATE_LABELS,
} from '../../../systems/ui/status/statusObservatoryPresentation.js';
import type {
  StatusObservatoryDrawerRequest,
  StatusObservatorySurfaceV1,
} from '../../../systems/ui/status/statusObservatoryTypes.js';
import { ObsPanelChrome } from './ObsPanel.js';
import { StatusBottleneckTalismanCanopy } from './StatusBottleneckTalismanCanopy.js';
import { StatusBuildPreparationScales } from './StatusBuildPreparationScales.js';
import { StatusCurrentWorkTimeWheel } from './StatusCurrentWorkTimeWheel.js';
import { StatusFoldedLedgerRail } from './StatusFoldedLedgerRail.js';
import { StatusLifeDecreeScroll } from './StatusLifeDecreeScroll.js';
import { StatusMeridianVesselCompass, StatusMeridianSharedCauseStamps } from './StatusMeridianVesselCompass.js';
import { StatusObservatoryDrawers } from './StatusObservatoryDrawers.js';
import { StatusReserveJars } from './StatusReserveJars.js';
import { StatusRootLawCoupledInstrument } from './StatusRootLawCoupledInstrument.js';
import { StatusStatMeridianConstellation } from './StatusStatMeridianConstellation.js';
import { StatusConstellationOverlay } from './StatusConstellationOverlay.js';
import { StatusRootLawOverlay } from './StatusRootLawOverlay.js';
import { StatusMeridianVesselOverlay } from './StatusMeridianVesselOverlay.js';
import { StatusCanopyOverlay } from './StatusCanopyOverlay.js';
import { StatusBuildOverlay } from './StatusBuildOverlay.js';
import { StatusWorkOverlay } from './StatusWorkOverlay.js';
import { StatusLedgerOverlay } from './StatusLedgerOverlay.js';
import type { StatusOverlayGoalContext } from './StatusObservatoryOverlayShell.js';
import { StatusVitalsSealRibbon } from './StatusVitalsSealRibbon.js';
import { StatusObservatoryStateOverlays } from './StatusObservatoryStateOverlays.js';
import { InkGrain } from '../../ink/InkGrain.js';
import { InkObservatoryDefs } from '../../ink/InkObservatoryDefs.js';
import { ObservatorySelectionProvider } from './useObservatorySelection.js';
import { useObservatoryScale } from './useObservatoryScale.js';
import { useObservatoryMotion } from './useObservatoryMotion.js';
import './StatusLivingStateObservatory.scss';

export const STATUS_OBSERVATORY_PUBLIC_DEFAULT_ENABLED = true;

export interface StatusLivingStateObservatoryProps {
  surface: StatusObservatorySurfaceV1;
  onAction?: (action: StatusLedgerActionSurface) => void;
  /** Dev-only: set when rendered from a fixture mount, for spec assertions. */
  fixtureId?: string | null;
}

export function StatusLivingStateObservatory({ surface, onAction, fixtureId }: StatusLivingStateObservatoryProps) {
  const [activeDrawer, setActiveDrawer] = useState<StatusObservatoryDrawerRequest | null>(null);
  const [activeOverlay, setActiveOverlay] = useState<'constellation' | 'rootLaw' | 'vessel' | 'canopy' | 'build' | 'work' | 'ledger' | null>(null);
  const presentation = resolveObservatoryPresentation(surface);
  const { viewportRef, scale, atFloor } = useObservatoryScale();

  // M.I.3 (G1) — the GLOBAL telemetry-driven motion vars (qi-flow ∝ qi/s, tick-spin ∝ cultivation rate,
  // breath) are set ONCE here on the stage from the typed surface (meta.motionHints) and CASCADE via CSS
  // to every instrument's keyframes. The shell already re-renders each tick with the new surface, while
  // the deep-equal-memoized instruments (whose slices never carry motionHints) do NOT — so live motion
  // costs zero heavy-SVG re-renders (stop condition #3). Per-instrument vars (needle/purity) stay local.
  // useObservatoryMotion collapses these to 0 off the high quality tier, keeping the default board static.
  const stageMotion = useObservatoryMotion({
    qiPerSecond: surface.meta.motionHints.qiPerSecond,
    cultivationRate: surface.meta.motionHints.cultivationRate,
    purityPct: null,
    fitAngleDeg: null,
  });

  // Stable handler so the memoized constellation isn't re-rendered every game
  // tick by a fresh inline arrow. setActiveOverlay is referentially stable.
  const openConstellationOverlay = useCallback(() => setActiveOverlay('constellation'), []);

  // The artifact paints the Next Goal / Main Bottleneck / Primary Action context
  // strip in every detail-overlay header; feed it from the decree hero.
  const hero = surface.lifeDecree.hero;
  const overlayGoal: StatusOverlayGoalContext = {
    nextGoalLabel: hero.nextMajorGoalLabel,
    mainBottleneckLabel: hero.mainBottleneckLabel,
    mainBottleneckTone: hero.mainBottleneckTone,
    primaryActionLabel: hero.primaryAction?.label ?? null,
  };

  return (
    <div
      className="statusObservatoryRoot"
      data-testid="status-ledger-root"
      data-surface-testid={surface.meta.rootTestId}
      data-observatory-root="status-living-state-observatory"
      data-schema-version={surface.meta.schemaVersion}
      data-source-schema-version={surface.meta.sourceSchemaVersion}
      data-observatory-mode={surface.meta.mode}
      data-observatory-visual-state={surface.meta.visualState}
      data-observatory-tone={presentation.tone}
      data-observatory-dominant={presentation.dominantRegion}
      data-observatory-canopy-mode={presentation.canopyMode}
      data-current-path={surface.meta.currentPath ?? 'none'}
      data-content-loaded={surface.meta.contentLoaded}
      data-observatory-fixture={fixtureId ?? undefined}
      aria-label="Status Living State Observatory"
    >
      <div className="obsVisuallyHidden" role="status" aria-live="polite">
        {STATUS_OBSERVATORY_VISUAL_STATE_LABELS[surface.meta.visualState]}
      </div>
      <div
        ref={viewportRef}
        className="obsStageViewport"
        data-obs-at-floor={atFloor ? 'true' : undefined}
        style={{
          '--obs-scale': scale,
          // M.I.3 (G1) — global motion vars cascade from here to all instruments (no per-instrument re-render).
          '--qi-flow-rate': stageMotion['--qi-flow-rate'],
          '--tick-spin-dur': stageMotion['--tick-spin-dur'],
          '--breath-period': stageMotion['--breath-period'],
        } as unknown as CSSProperties}
      >
        <div className="obsStage">
          <InkObservatoryDefs />
          <div className="statusObservatoryCanvas" data-testid="status-ledger-grid">
          {/* Artifact board-level cinnabar corner plaque 狀態堂 (decree §2.1.1). */}
          <span className="statusObservatoryCanvas__tag" aria-hidden="true">
            <span>狀</span>
            <span>態</span>
            <span>堂</span>
          </span>
          <ObservatorySelectionProvider
            defaultSelection={surface.meta.selectedContext}
            threads={surface.bottleneckCanopy.causalThreads}
          >
          {/* Row 1: Life Decree header band (full width, no banner) */}
          <section className="obsRegion obsRegion--decree" data-testid="obs-region-decree" aria-label="Life Decree">
            <ObsPanelChrome />
            <div className="obsRegion__content">
              <StatusLifeDecreeScroll
                surface={surface.lifeDecree}
                visualState={surface.meta.visualState}
                currentPath={surface.meta.currentPath}
                onAction={onAction}
              />
            </div>
          </section>

          {/* Row 2: Vitals ribbon (full width, no banner) */}
          <section className="obsRegion obsRegion--vitals" data-testid="obs-region-vitals" aria-label="Vitals">
            <ObsPanelChrome />
            <div className="obsRegion__content">
              <StatusVitalsSealRibbon surface={surface.vitalsRibbon} />
            </div>
          </section>

          {/* Row 3: main row — root/law (502) · vessel+causes (858) · canopy all-in-one (1fr) */}
          <div className="obsMainRow">
            <section
              className="obsRegion obsRegion--root-law obsRegion--mtn"
              data-testid="obs-region-root-law"
              aria-label="Root / Law Coupled Instrument"
            >
              <ObsPanelChrome
                banner="ROOT / LAW COUPLED INSTRUMENT"
                mtn="root-law"
                glyphColumn={{ text: '根骨鑑觀', modifier: 'root-law' }}
              />
              <div className="obsRegion__content">
                <StatusRootLawCoupledInstrument surface={surface.rootLawInstrument} onAction={onAction} />
              </div>
              <button
                type="button"
                className="obsRegion__expandHint"
                aria-haspopup="dialog"
                aria-label="Open Spirit Root Astrolabe detail"
                onClick={() => setActiveOverlay('rootLaw')}
              >
                Open Astrolabe ⤢
              </button>
            </section>

            <section
              className="obsRegion obsRegion--vessel obsRegion--mtn"
              data-testid="obs-region-vessel"
              aria-label="Meridian Vessel Compass"
            >
              <ObsPanelChrome
                banner="MERIDIAN VESSEL COMPASS"
                mtn="vessel"
                glyphColumn={{ text: '內視臟腑', modifier: 'vessel' }}
              />
              <div className="obsRegion__content">
                <StatusMeridianVesselCompass
                  surface={surface.meridianVessel}
                  visualState={surface.meta.visualState}
                  onAction={onAction}
                />
                <StatusMeridianSharedCauseStamps stamps={surface.meridianVessel.sharedCauseStamps} />
              </div>
              <button
                type="button"
                className="obsRegion__expandHint"
                aria-haspopup="dialog"
                aria-label="Open Meridian Vessel Compass detail"
                onClick={() => setActiveOverlay('vessel')}
              >
                Open Vessel ⤢
              </button>
            </section>

            <section
              className="obsRegion obsRegion--canopy obsRegion--mtn"
              data-testid="obs-region-canopy"
              aria-label="Bottleneck Talisman Canopy"
            >
              <ObsPanelChrome
                banner="BOTTLENECK TALISMAN CANOPY"
                mtn="canopy"
                glyphColumn={{ text: '厄結因緣', modifier: 'canopy' }}
              />
              <div className="obsRegion__content">
                <StatusBottleneckTalismanCanopy
                  surface={surface.bottleneckCanopy}
                  canopyMode={presentation.canopyMode}
                  onAction={onAction}
                  part="cluster"
                />
                <StatusBottleneckTalismanCanopy
                  surface={surface.bottleneckCanopy}
                  canopyMode={presentation.canopyMode}
                  onAction={onAction}
                  part="charms"
                />
                <StatusBottleneckTalismanCanopy
                  surface={surface.bottleneckCanopy}
                  canopyMode={presentation.canopyMode}
                  onAction={onAction}
                  part="safety"
                />
              </div>
              <button
                type="button"
                className="obsRegion__expandHint"
                aria-haspopup="dialog"
                aria-label="Open Bottleneck Talisman Canopy detail"
                onClick={() => setActiveOverlay('canopy')}
              >
                Open Canopy ⤢
              </button>
            </section>
          </div>

          {/* Row 4: bottom row — constellation (700) · scales (320) · jars (300) · wheel (230) · ledgers (1fr) */}
          <div className="obsBottomRow">
            <section
              className="obsRegion obsRegion--constellation obsRegion--mtn"
              data-testid="obs-region-constellation"
              aria-label="Stat Meridian Constellation"
            >
              <ObsPanelChrome
                banner="STAT MERIDIAN CONSTELLATION"
                mtn="constellation"
                glyphColumn={{ text: '周天星脈', modifier: 'constellation' }}
              />
              <div className="obsRegion__content">
                <StatusStatMeridianConstellation
                  surface={surface.statConstellation}
                  onAction={onAction}
                  onExpand={openConstellationOverlay}
                />
              </div>
            </section>

            <section
              className="obsRegion obsRegion--scales"
              data-testid="obs-region-scales"
              aria-label="Build & Preparation"
            >
              <ObsPanelChrome banner="BUILD & PREPARATION SCALES" />
              <div className="obsRegion__content">
                <StatusBuildPreparationScales
                  surface={surface.buildPreparation}
                  visualState={surface.meta.visualState}
                  onOpenDrawer={setActiveDrawer}
                />
              </div>
              <button
                type="button"
                className="obsRegion__expandHint"
                aria-haspopup="dialog"
                aria-label="Open Build and Preparation Inspector detail"
                onClick={() => setActiveOverlay('build')}
              >
                Open Inspector ⤢
              </button>
            </section>

            <section
              className="obsRegion obsRegion--jars"
              data-testid="obs-region-jars"
              aria-label="Reserve Jars"
            >
              <ObsPanelChrome banner="RESERVE JARS" />
              <div className="obsRegion__content">
                <StatusReserveJars
                  jars={surface.buildPreparation.reserveJars}
                  rows={surface.buildPreparation.rows}
                  onOpenDrawer={setActiveDrawer}
                />
              </div>
              <button
                type="button"
                className="obsRegion__expandHint"
                aria-haspopup="dialog"
                aria-label="Open Reserve Jars detail"
                onClick={() => setActiveOverlay('build')}
              >
                Detail ⤢
              </button>
            </section>

            <section className="obsRegion obsRegion--wheel" data-testid="obs-region-wheel" aria-label="Current Work">
              <ObsPanelChrome banner="CURRENT WORK WHEEL" />
              <div className="obsRegion__content">
                <StatusCurrentWorkTimeWheel
                  surface={surface.workWheel}
                  onAction={onAction}
                  onOpenDrawer={setActiveDrawer}
                />
              </div>
              <button
                type="button"
                className="obsRegion__expandHint"
                aria-haspopup="dialog"
                aria-label="Open Current Work Time Wheel detail"
                onClick={() => setActiveOverlay('work')}
              >
                Open Work ⤢
              </button>
            </section>

            <section
              className="obsRegion obsRegion--ledgers obsRegion--mtn"
              data-testid="obs-region-ledgers"
              aria-label="Details and Folded Ledgers"
            >
              <ObsPanelChrome mtn="ledgers" />
              <div className="obsRegion__content">
                <StatusFoldedLedgerRail
                  surface={surface.ledgerRail}
                  noLoss={surface.noLoss}
                  activeDrawer={activeDrawer}
                  onOpenDrawer={setActiveDrawer}
                />
              </div>
              <button
                type="button"
                className="obsRegion__expandHint"
                aria-haspopup="dialog"
                aria-label="Open Folded Ledgers detail"
                onClick={() => setActiveOverlay('ledger')}
              >
                Open Ledgers ⤢
              </button>
            </section>
          </div>

          <InkGrain />

          <StatusObservatoryStateOverlays presentation={presentation} />

          <StatusObservatoryDrawers
            open={activeDrawer !== null}
            drawer={activeDrawer}
            surface={surface}
            onClose={() => setActiveDrawer(null)}
            onAction={onAction}
          />

          <StatusConstellationOverlay
            open={activeOverlay === 'constellation'}
            surface={surface.statConstellation}
            goal={overlayGoal}
            onClose={() => setActiveOverlay(null)}
            onAction={onAction}
          />

          <StatusRootLawOverlay
            open={activeOverlay === 'rootLaw'}
            surface={surface.rootLawInstrument}
            goal={overlayGoal}
            onClose={() => setActiveOverlay(null)}
            onAction={onAction}
          />

          <StatusMeridianVesselOverlay
            open={activeOverlay === 'vessel'}
            surface={surface.meridianVessel}
            visualState={surface.meta.visualState}
            goal={overlayGoal}
            onClose={() => setActiveOverlay(null)}
            onAction={onAction}
          />

          <StatusCanopyOverlay
            open={activeOverlay === 'canopy'}
            surface={surface.bottleneckCanopy}
            goal={overlayGoal}
            onClose={() => setActiveOverlay(null)}
            onAction={onAction}
          />

          <StatusBuildOverlay
            open={activeOverlay === 'build'}
            surface={surface.buildPreparation}
            visualState={surface.meta.visualState}
            goal={overlayGoal}
            onClose={() => setActiveOverlay(null)}
            onAction={onAction}
          />

          <StatusWorkOverlay
            open={activeOverlay === 'work'}
            surface={surface.workWheel}
            recentChanges={surface.ledgerRail.recentChanges}
            goal={overlayGoal}
            onClose={() => setActiveOverlay(null)}
            onAction={onAction}
          />

          <StatusLedgerOverlay
            open={activeOverlay === 'ledger'}
            recentChanges={surface.ledgerRail.recentChanges}
            details={surface.ledgerRail.details}
            goal={overlayGoal}
            onClose={() => setActiveOverlay(null)}
          />
          </ObservatorySelectionProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
