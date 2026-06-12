import { useState, type CSSProperties } from 'react';
import type { StatusLedgerActionSurface } from '../../../systems/ui/status/statusLedgerTypes.js';
import {
  resolveObservatoryPresentation,
  STATUS_OBSERVATORY_VISUAL_STATE_LABELS,
} from '../../../systems/ui/status/statusObservatoryPresentation.js';
import type {
  StatusObservatoryDrawerRequest,
  StatusObservatorySurfaceV1,
} from '../../../systems/ui/status/statusObservatoryTypes.js';
import { StatusBottleneckTalismanCanopy } from './StatusBottleneckTalismanCanopy.js';
import { StatusBuildPreparationScales } from './StatusBuildPreparationScales.js';
import { StatusCurrentWorkTimeWheel } from './StatusCurrentWorkTimeWheel.js';
import { StatusFoldedLedgerRail } from './StatusFoldedLedgerRail.js';
import { StatusLifeDecreeScroll } from './StatusLifeDecreeScroll.js';
import { StatusMeridianVesselCompass } from './StatusMeridianVesselCompass.js';
import { StatusObservatoryDrawers } from './StatusObservatoryDrawers.js';
import { StatusRootLawCoupledInstrument } from './StatusRootLawCoupledInstrument.js';
import { StatusStatMeridianConstellation } from './StatusStatMeridianConstellation.js';
import { StatusVitalsSealRibbon } from './StatusVitalsSealRibbon.js';
import { StatusObservatoryStateOverlays } from './StatusObservatoryStateOverlays.js';
import { InkGrain } from '../../ink/InkGrain.js';
import { InkObservatoryDefs } from '../../ink/InkObservatoryDefs.js';
import { ObservatorySelectionProvider } from './useObservatorySelection.js';
import { useObservatoryScale } from './useObservatoryScale.js';
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
  const presentation = resolveObservatoryPresentation(surface);
  const { viewportRef, scale, atFloor } = useObservatoryScale();

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
        style={{ '--obs-scale': scale } as unknown as CSSProperties}
      >
        <div className="obsStage">
          <InkObservatoryDefs />
          <div className="statusObservatoryCanvas" data-testid="status-ledger-grid">
          <ObservatorySelectionProvider
            defaultSelection={surface.meta.selectedContext}
            threads={surface.bottleneckCanopy.causalThreads}
          >
          <section className="obsRegion obsRegion--decree" data-testid="obs-region-decree" aria-label="Life Decree">
            <StatusLifeDecreeScroll
              surface={surface.lifeDecree}
              visualState={surface.meta.visualState}
              currentPath={surface.meta.currentPath}
              onAction={onAction}
            />
          </section>

          <section className="obsRegion obsRegion--vitals" data-testid="obs-region-vitals" aria-label="Vitals">
            <StatusVitalsSealRibbon surface={surface.vitalsRibbon} />
          </section>

          <section
            className="obsRegion obsRegion--root-law"
            data-testid="obs-region-root-law"
            aria-label="Root / Law Coupled Instrument"
          >
            <StatusRootLawCoupledInstrument surface={surface.rootLawInstrument} onAction={onAction} />
          </section>

          <section
            className="obsRegion obsRegion--vessel"
            data-testid="obs-region-vessel"
            aria-label="Meridian Vessel Compass"
          >
            <StatusMeridianVesselCompass
              surface={surface.meridianVessel}
              visualState={surface.meta.visualState}
              onAction={onAction}
            />
          </section>

          <section
            className="obsRegion obsRegion--canopy"
            data-testid="obs-region-canopy"
            aria-label="Bottleneck Talisman Canopy"
          >
            <StatusBottleneckTalismanCanopy
              surface={surface.bottleneckCanopy}
              canopyMode={presentation.canopyMode}
              onAction={onAction}
            />
          </section>

          <div className="obsBelt">
            <section
              className="obsRegion obsRegion--constellation"
              data-testid="obs-region-constellation"
              aria-label="Stat Meridian Constellation"
            >
              <StatusStatMeridianConstellation surface={surface.statConstellation} onAction={onAction} />
            </section>

            <section
              className="obsRegion obsRegion--scales"
              data-testid="obs-region-scales"
              aria-label="Build & Preparation"
            >
              <StatusBuildPreparationScales surface={surface.buildPreparation} onOpenDrawer={setActiveDrawer} />
            </section>

            <section className="obsRegion obsRegion--wheel" data-testid="obs-region-wheel" aria-label="Current Work">
              <StatusCurrentWorkTimeWheel
                surface={surface.workWheel}
                onAction={onAction}
                onOpenDrawer={setActiveDrawer}
              />
            </section>

            <section
              className="obsRegion obsRegion--ledgers"
              data-testid="obs-region-ledgers"
              aria-label="Details and Folded Ledgers"
            >
              <StatusFoldedLedgerRail
                surface={surface.ledgerRail}
                noLoss={surface.noLoss}
                activeDrawer={activeDrawer}
                onOpenDrawer={setActiveDrawer}
              />
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
          </ObservatorySelectionProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
