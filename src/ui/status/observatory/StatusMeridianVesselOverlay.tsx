import type { CSSProperties, ReactNode } from 'react';
import type { StatusLedgerActionSurface } from '../../../systems/ui/status/statusLedgerTypes.js';
import type { StatusObservatorySurfaceV1 } from '../../../systems/ui/status/statusObservatoryTypes.js';
import { StatusObservatoryOverlayShell, type StatusOverlayGoalContext } from './StatusObservatoryOverlayShell.js';
import { StatusMeridianVesselCompass, StatusMeridianSharedCauseStamps } from './StatusMeridianVesselCompass.js';
import './StatusMeridianVesselOverlay.scss';

type VesselSurface = StatusObservatorySurfaceV1['meridianVessel'];

export interface StatusMeridianVesselOverlayProps {
  open: boolean;
  surface: VesselSurface;
  visualState?: StatusObservatorySurfaceV1['meta']['visualState'];
  goal?: StatusOverlayGoalContext | null;
  onClose: () => void;
  onAction?: (action: StatusLedgerActionSurface) => void;
}

// Artifact ovcontent ≈ 1810x900 inner; coordinates ported as % so the absolute
// composition scales with the panel.
const CW = 1810;
const CH = 900;
const px = (v: number, dim: number): string => `${((v / dim) * 100).toFixed(2)}%`;
function box(left: number | null, top: number, opts: { w?: number; right?: number; bottom?: number } = {}): CSSProperties {
  const s: CSSProperties = { position: 'absolute', top: px(top, CH) };
  if (left != null) s.left = px(left, CW);
  if (opts.w != null) s.width = px(opts.w, CW);
  if (opts.right != null) s.right = px(opts.right, CW);
  if (opts.bottom != null) s.bottom = px(opts.bottom, CH);
  return s;
}

function Card({ style, children }: { style: CSSProperties; children: ReactNode }) {
  return (
    <div className="statusVesselOverlay__card" style={style}>
      {children}
    </div>
  );
}

const LEGEND: ReadonlyArray<[string, string]> = [
  ['var(--observatory-jade)', 'Stable — functioning normally'],
  ['var(--observatory-gold-deep, var(--observatory-gold))', 'Needs Work — improvement required'],
  ['var(--observatory-cinnabar)', 'At Risk — significant weakness'],
  ['var(--observatory-muted)', 'Locked — not yet unlocked'],
];

/**
 * Full-screen "Meridian Vessel Compass" detail overlay (artifact `ovVessel`).
 * Frames the reused in-panel vessel (figure + six organ cards + focus lens) with
 * the artifact's side rails — Overview / Current Focus / Inspection Mode / Vessel
 * State on the left, the state Legend + How-This-Works on the right — and the
 * shared-causes strip along the foot.
 */
export function StatusMeridianVesselOverlay({
  open,
  surface,
  visualState,
  goal,
  onClose,
  onAction,
}: StatusMeridianVesselOverlayProps) {
  const organs = surface.organs;
  const strained = organs.some((o) => o.state === 'atrisk');
  const focusTitle = surface.focusLens.label;

  return (
    <StatusObservatoryOverlayShell
      open={open}
      title="Meridian Vessel Compass"
      subtitle="Full-state inner ledger of mind, body, root, path, preparation, and current work"
      tagChars="內視"
      sealChars="內視"
      sealVariant="cinnabar"
      watermark="內視臟腑"
      goal={goal}
      onClose={onClose}
      dataTestId="status-meridian-vessel-overlay"
      ariaLabel="Meridian Vessel Compass detail"
      className="statusVesselOverlayPanel"
    >
      <div className="statusVesselOverlay" data-vessel-state={strained ? 'strained' : 'stable'}>
        {/* Left rail */}
        <div className="statusVesselOverlay__rail" style={box(18, 8, { w: 196 })}>
          <Card style={{}}>
            <div className="statusVesselOverlay__sub">Overview</div>
            <p>Observe the meridian vessel and its six organs. Use the focus lens to inspect the root cause behind current bottlenecks.</p>
          </Card>
          <Card style={{}}>
            <div className="statusVesselOverlay__sub">Current Focus</div>
            <strong className="statusVesselOverlay__focus">{focusTitle}</strong>
          </Card>
          <Card style={{}}>
            <div className="statusVesselOverlay__sub">Inspection Mode</div>
            <div className="statusVesselOverlay__mode">
              <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
                <circle cx="13" cy="13" r="11" fill="none" stroke="url(#goldG)" strokeWidth="2" />
                <circle cx="13" cy="13" r="5" fill="url(#goldRad)" />
              </svg>
              <div>
                <strong>Reserved Lens</strong>
                <small>One organ in focus — select any organ seal</small>
              </div>
            </div>
          </Card>
          <Card style={{}}>
            <div className="statusVesselOverlay__sub">Vessel State</div>
            <div className="statusVesselOverlay__mode">
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" fill="none" stroke={strained ? 'var(--observatory-cinnabar)' : 'var(--observatory-jade)'} strokeWidth="2.2" strokeDasharray="3 3" />
              </svg>
              <div>
                <strong style={{ color: strained ? 'var(--observatory-cinnabar)' : 'var(--observatory-jade)' }}>{strained ? 'Strained' : 'Stable'}</strong>
                <small>{strained ? 'Multiple risks detected' : 'Functioning normally'}</small>
              </div>
            </div>
          </Card>
        </div>

        {/* Center: reused live vessel (figure + 6 organ cards + focus lens) */}
        <div className="statusVesselOverlay__center">
          <StatusMeridianVesselCompass surface={surface} visualState={visualState} onAction={onAction} />
        </div>

        {/* Right rail */}
        <div className="statusVesselOverlay__rail" style={box(null, 8, { right: 18, w: 196 })}>
          <Card style={{}}>
            <div className="statusVesselOverlay__sub">Legend</div>
            <div className="statusVesselOverlay__legend">
              {LEGEND.map(([color, text]) => (
                <div key={text} className="statusVesselOverlay__legendRow">
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                    <circle cx="7" cy="7" r="6" fill="none" stroke={color} strokeWidth="1.6" />
                    <circle cx="7" cy="7" r="2.6" fill={color} />
                  </svg>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card style={{}}>
            <div className="statusVesselOverlay__sub">How This Works</div>
            <p>Each organ reflects one core aspect of your cultivation. Focus reveals the primary cause and the best route to resolve it.</p>
          </Card>
        </div>

        {/* Foot: shared causes across all organs (reused stamps), anchored to the
            bottom edge only. */}
        <div
          className="statusVesselOverlay__shared"
          style={{ position: 'absolute', left: '1%', right: '1%', bottom: '1.2%' }}
        >
          <StatusMeridianSharedCauseStamps stamps={surface.sharedCauseStamps} />
        </div>
      </div>
    </StatusObservatoryOverlayShell>
  );
}
