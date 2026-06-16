import './temperingCourt.scss';
import { useObservatoryScale } from '../status/observatory/useObservatoryScale';
import { CourtDefs } from './CourtDefs';
import { CourtPanel } from './CourtPanel';
import {
  ConstitutionContent,
  CourtNavContent,
  ForgeHeatContent,
  IntensityBellowsContent,
  LintelContent,
  PathMeridiansContent,
  RegimensShelfContent,
  ThisPracticeContent,
} from './regions/CourtRegions';
import { Room } from './room/Room';
import { ReturnModal } from './ReturnModal';
import { COURT_PATH_DISPLAY } from './courtPathDisplay';
import type { CourtIntensityId, TemperingCourtSurface } from '../../systems/meridians/index.js';

/**
 * W7 — the Tempering Court stage shell (artifact §1.1). Fixed 2048×1152 design space
 * scaled uniformly by the shared useObservatoryScale hook; the 4-row / nested-column
 * grid + gold keyline frame the composition. Mounts <CourtDefs/> once. Render-only: it
 * consumes the W6 TemperingCourtSurface and recomputes nothing.
 *
 * Built region-by-region across parity passes: Lintel/Constitution/Intensity/ForgeHeat/
 * ThisPractice/Nav are live; Regimens, Path Meridians, and the Room (figure + channel +
 * scenery + overlays) are placeholders pending their passes.
 */
export interface TemperingCourtProps {
  surface: TemperingCourtSurface;
  reducedMotion?: boolean;
  onSelectMeridian?: (meridianId: string) => void;
  onSelectIntensity?: (intensityId: CourtIntensityId) => void;
  onStart?: () => void;
  onCease?: () => void;
  onReturn?: () => void;
  onResume?: () => void;
}

export function TemperingCourt({
  surface,
  reducedMotion = false,
  onSelectMeridian,
  onSelectIntensity,
  onStart,
  onCease,
  onReturn,
  onResume,
}: TemperingCourtProps) {
  const { viewportRef, scale } = useObservatoryScale();
  const watermark = surface.path ? COURT_PATH_DISPLAY[surface.path].watermark : '气';
  const roomBanner = surface.activeMeridian ? `THE ROOM · ${surface.activeMeridian.room}` : 'THE ROOM';

  return (
    <div className="courtViewport" ref={viewportRef}>
      <div className="courtStage" style={{ transform: `scale(${scale})` }} data-testid="tempering-court">
        <CourtDefs />

        <CourtPanel
          ariaLabel="Tempering Court"
          className="courtStage__lintel"
          tag="锤炼堂"
          watermark="堂"
          watermarkRight={64}
          rollers
          contentPadding="0 18px"
        >
          <LintelContent surface={surface} />
        </CourtPanel>

        <div className="courtRowMain">
          <CourtPanel ariaLabel="Regimens" banner="REGIMENS" watermark="法">
            <RegimensShelfContent surface={surface} onSelectMeridian={onSelectMeridian} />
          </CourtPanel>
          <CourtPanel ariaLabel="The Room" banner={roomBanner} watermark={watermark} flush>
            <Room surface={surface} reducedMotion={reducedMotion} />
          </CourtPanel>
          <div className="courtRightCol">
            <CourtPanel ariaLabel="Path Meridians" banner="PATH MERIDIANS" watermark="脉">
              <PathMeridiansContent surface={surface} />
            </CourtPanel>
            <CourtPanel ariaLabel="Constitution" banner="CONSTITUTION">
              <ConstitutionContent surface={surface} />
            </CourtPanel>
          </div>
        </div>

        <div className="courtRowBottom">
          <CourtPanel ariaLabel="Intensity" banner="INTENSITY">
            <IntensityBellowsContent surface={surface} onSelectIntensity={onSelectIntensity} />
          </CourtPanel>
          <CourtPanel ariaLabel="Forge Heat" banner="FORGE HEAT">
            <ForgeHeatContent surface={surface} />
          </CourtPanel>
          <CourtPanel ariaLabel="This Practice" banner="THIS PRACTICE">
            <ThisPracticeContent surface={surface} />
          </CourtPanel>
        </div>

        <nav className="courtNav" aria-label="Court navigation">
          <CourtNavContent surface={surface} onReturn={onReturn} onStart={onStart} onCease={onCease} />
        </nav>

        <ReturnModal summary={surface.offlineSummary} onResume={onResume} />
      </div>
    </div>
  );
}
