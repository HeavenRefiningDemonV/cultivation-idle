import { memo } from 'react';
import type { CSSProperties } from 'react';
import { deepEqualProps } from './fx/memoProps.js';
import type { StatusLedgerTone } from '../../../systems/ui/status/statusLedgerTypes.js';
import type {
  StatusObservatoryDrawerRequest,
  StatusObservatorySurfaceV1,
  StatusObservatoryVisualState,
} from '../../../systems/ui/status/statusObservatoryTypes.js';
import { useObservatoryRoving } from './useObservatoryRoving.js';

export interface StatusBuildPreparationScalesProps {
  surface: StatusObservatorySurfaceV1['buildPreparation'];
  /** Whole-screen state; drives the artifact's per-state tilt + verdict + readiness rows. */
  visualState?: StatusObservatoryVisualState;
  onOpenDrawer?: (drawer: StatusObservatoryDrawerRequest) => void;
}

type SupportState = 'stable' | 'info' | 'warning' | 'danger' | 'muted';

/* Artifact scales() checklist mark: ok = jade + check, warn = gold + bang,
   risk = cinnabar + cross. Display only; no recompute. */
type ChecklistMark = 'ok' | 'warn' | 'risk';

/* The six fixed Title-Case readiness criteria the artifact shows (scales().rows).
   The surface does not expose per-criterion build/prep status, so the row marks are
   keyed on the whole-screen visualState (the same source the artifact's per-state
   table uses) and fall back to the scale signal when the state is unknown. */
const READINESS_LABELS = [
  'Path Alignment',
  'Empty Slots',
  'Mastery Floor',
  'Rank Floor',
  'Rune Floor',
  'Policy Fit',
] as const;

const READINESS_MARKS: Record<StatusObservatoryVisualState, readonly ChecklistMark[]> = {
  blocked: ['ok', 'warn', 'warn', 'risk', 'risk', 'risk'],
  postFailure: ['warn', 'risk', 'risk', 'risk', 'risk', 'risk'],
  healthy: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok'],
  prestigePressure: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok'],
  contentCap: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok'],
  unknown: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok'],
};

/* Per-state arm tilt (deg) + verdict ribbon text, mirroring the artifact scales() data. */
const SCALE_TILT: Record<StatusObservatoryVisualState, number> = {
  blocked: -9,
  postFailure: -11,
  healthy: 0,
  prestigePressure: 1,
  contentCap: 0,
  unknown: 0,
};

const SCALE_VERDICT: Record<StatusObservatoryVisualState, string> = {
  blocked: 'Strained',
  postFailure: 'Failed',
  healthy: 'Strong',
  prestigePressure: 'Strong',
  contentCap: 'Strong',
  unknown: 'Strong',
};

function toneToSupportState(tone: StatusLedgerTone): SupportState {
  if (tone === 'danger') return 'danger';
  if (tone === 'warning' || tone === 'gold') return 'warning';
  if (tone === 'muted') return 'muted';
  if (tone === 'success' || tone === 'jade') return 'stable';
  return 'info';
}

/* Whole-screen state for the panel: prefer the explicit visualState, else derive a
   close bucket from the scale signal (lowStateRows + build/prep tone). */
function resolveState(
  surface: StatusObservatorySurfaceV1['buildPreparation'],
  visualState?: StatusObservatoryVisualState,
): StatusObservatoryVisualState {
  if (visualState && visualState !== 'unknown') return visualState;
  const lowRows = surface.scales.lowStateRows;
  if (lowRows.some((row) => row.tone === 'danger')) return 'postFailure';
  if (lowRows.length > 0) return 'blocked';
  const build = toneToSupportState(surface.scales.build.tone);
  const prep = toneToSupportState(surface.scales.preparation.tone);
  if (build === 'danger' || prep === 'danger') return 'postFailure';
  if (build === 'warning' || prep === 'warning') return 'blocked';
  return 'healthy';
}

/* Map the resolved verdict to the existing data-scale-state buckets the contract +
   overlay keep (stable/warning/danger), so the verdict ribbon styling is unchanged. */
function scaleStateForVerdict(state: StatusObservatoryVisualState): SupportState {
  if (state === 'postFailure') return 'danger';
  if (state === 'blocked') return 'warning';
  return 'stable';
}

function styleForTilt(tilt: number): CSSProperties {
  return { '--scale-tilt': `${tilt}deg` } as CSSProperties;
}

const RAD = Math.PI / 180;

/* Pan group from the artifact scales() pan(ex,ey,heavy): three short cords from the
   arm end down to py-6 (py = ey + 44), a brass dish, a brass rim ellipse, and two
   stacked weight discs on the heavy side. Cords are drawn straight down from the arm
   end as the artifact does (no counter-rotation needed). */
function ScalePan({ ex, ey, heavy }: { ex: number; ey: number; heavy: boolean }) {
  const py = ey + 44;
  const rimY = py - 6;
  return (
    <>
      <line x1={ex - 13} y1={ey} x2={ex - 11} y2={py - 6} stroke="#6e4c16" strokeWidth="1" />
      <line x1={ex + 13} y1={ey} x2={ex + 11} y2={py - 6} stroke="#6e4c16" strokeWidth="1" />
      <line x1={ex} y1={ey} x2={ex} y2={py - 6} stroke="#6e4c16" strokeWidth="1" />
      <path
        d={`M${ex - 19},${rimY} Q${ex},${py + 11} ${ex + 19},${rimY} Z`}
        fill="url(#brass)"
        stroke="#4a330e"
        strokeWidth="1"
      />
      <ellipse cx={ex} cy={rimY} rx="19" ry="4" fill="#c79a45" stroke="#4a330e" strokeWidth="0.8" />
      {heavy ? (
        <>
          <ellipse cx={ex} cy={py - 9} rx="10" ry="4.5" fill="#6e4c16" />
          <ellipse cx={ex} cy={py - 13} rx="7" ry="3.5" fill="#7a5b26" />
        </>
      ) : null}
    </>
  );
}

export const StatusBuildPreparationScales = memo(StatusBuildPreparationScalesBase, deepEqualProps);

function StatusBuildPreparationScalesBase({ surface, visualState, onOpenDrawer }: StatusBuildPreparationScalesProps) {
  const state = resolveState(surface, visualState);
  const marks = READINESS_MARKS[state];
  const tilt = SCALE_TILT[state];
  const verdict = SCALE_VERDICT[state];
  const verdictState = scaleStateForVerdict(state);
  const rowsRoving = useObservatoryRoving(READINESS_LABELS.length);

  // Artifact arm endpoints rotate about the pivot (100, 38); pans hang from each end.
  const armL = 68;
  const cx = 100;
  const pivY = 38;
  const rad = tilt * RAD;
  const ex1 = cx - armL * Math.cos(rad);
  const ey1 = pivY - armL * Math.sin(rad);
  const ex2 = cx + armL * Math.cos(rad);
  const ey2 = pivY + armL * Math.sin(rad);

  return (
    <section
      className="statusObservatoryInstrument statusObservatoryPreparation statusBuildPreparationScales"
      data-testid="status-ledger-build-preparation"
      data-surface-testid={surface.rootTestId}
      data-s7-instrument="build-preparation-scales"
      data-scale-state={verdictState}
      style={styleForTilt(tilt)}
      aria-label={`Build and Preparation Scales. Readiness: ${verdict}. ${surface.rows.length} exact rows available.`}
    >
      <div className="statusBuildPreparationScales__plate">
        {/* LEFT: artifact six fixed Title-Case readiness rows with colour-coded status dots. */}
        <div
          className="statusBuildPreparationScales__checklist"
          aria-label="Readiness checklist"
          onKeyDown={rowsRoving.onKeyDown}
        >
          {READINESS_LABELS.map((label, index) => {
            const mark = marks[index];
            return (
              <button
                key={label}
                type="button"
                className="statusBuildPreparationScales__weight"
                data-mark={mark}
                aria-label={`${label}: ${mark === 'ok' ? 'met' : mark === 'warn' ? 'needs support' : 'below floor'}. Opens Build and Preparation ledger.`}
                onClick={() => onOpenDrawer?.({ kind: 'buildPreparation', sourceId: label })}
                {...rowsRoving.getItemProps(index)}
              >
                <span className="statusBuildPreparationScales__dot" data-mark={mark} aria-hidden="true">
                  {mark === 'ok' ? (
                    <svg viewBox="0 0 16 16" width="9" height="9" focusable={false}>
                      <path d="M3 8.5 L6.5 12 L13 4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : mark === 'warn' ? (
                    '!'
                  ) : (
                    <svg viewBox="0 0 16 16" width="9" height="9" focusable={false}>
                      <path d="M4 4 L12 12 M12 4 L4 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </span>
                <span className="statusBuildPreparationScales__rowLabel">{label}</span>
              </button>
            );
          })}
        </div>

        {/* RIGHT: artifact tilting brass balance + verdict ribbon. */}
        <div className="statusBuildPreparationScales__balance" aria-label="Readiness comparison balance">
          <svg
            className="statusBuildPreparationScales__rig"
            viewBox="0 0 200 200"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
            focusable={false}
          >
            {/* base ellipse (brass) + inner flat seat */}
            <ellipse cx="100" cy="176" rx="44" ry="9" fill="url(#brass)" stroke="#4a330e" />
            <ellipse cx="100" cy="174" rx="28" ry="5" fill="#6e4c16" />
            {/* central post (x=95 y=30 h=144) */}
            <rect x="95" y="30" width="10" height="144" rx="3" fill="url(#brassH)" stroke="#4a330e" strokeWidth="0.8" />
            {/* top finial knob at the post top */}
            <circle cx="100" cy="30" r="8" fill="url(#goldRad)" stroke="#4a330e" />
            {/* ARM rotated by tilt about the pivot (100, 38); pans hang from each end */}
            <line
              x1={ex1.toFixed(1)}
              y1={ey1.toFixed(1)}
              x2={ex2.toFixed(1)}
              y2={ey2.toFixed(1)}
              stroke="url(#brassH)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <circle cx="100" cy="38" r="6" fill="url(#goldRad)" stroke="#4a330e" />
            <ScalePan ex={ex1} ey={ey1} heavy={tilt < -1} />
            <ScalePan ex={ex2} ey={ey2} heavy={tilt > 1} />
          </svg>
          {/* Invisible structural keep: __beam/__pan still drive --scale-tilt on a live
              element (S7 stylesheet contract). Zero visual footprint. */}
          <div className="statusBuildPreparationScales__beam statusBuildPreparationScales__pan" aria-hidden="true">
            <span className="statusBuildPreparationScales__pan--build" />
            <span className="statusBuildPreparationScales__pan--prep" />
          </div>
          <span className="statusBuildPreparationScales__verdict" data-scale-state={verdictState}>
            {verdict}
          </span>
        </div>
      </div>

      {/* Artifact bottom-right hint replaces the row-dump footer; reaches the exact
          Build / Prep Ledger drawer (onOpenDrawer with kind: 'buildPreparation'). */}
      <button
        type="button"
        className="statusBuildPreparationScales__inspector"
        aria-haspopup="dialog"
        aria-label={`Open Build / Prep Ledger. ${surface.rows.length} exact rows.`}
        onClick={() => onOpenDrawer?.({ kind: 'buildPreparation' })}
      >
        Open Inspector ⤢
      </button>
    </section>
  );
}
