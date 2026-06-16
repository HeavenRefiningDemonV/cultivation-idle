import { memo } from 'react';
import type { CSSProperties } from 'react';
import { deepEqualProps } from './fx/memoProps.js';
import type { StatusLedgerActionSurface, StatusLedgerTone } from '../../../systems/ui/status/statusLedgerTypes.js';
import type {
  StatusObservatoryDrawerRequest,
  StatusObservatorySurfaceV1,
  StatusWorkWheelSpokeSurface,
} from '../../../systems/ui/status/statusObservatoryTypes.js';
import { useRitualMotion } from './fx/useRitualMotion.js';
import { polar } from './observatoryAstrolabeGeometry.js';
import { useObservatoryRoving } from './useObservatoryRoving.js';

export interface StatusCurrentWorkTimeWheelProps {
  surface: StatusObservatorySurfaceV1['workWheel'];
  onAction?: (action: StatusLedgerActionSurface) => void;
  onOpenDrawer?: (drawer: StatusObservatoryDrawerRequest) => void;
}

type WorkSegmentState = 'active' | 'idle' | 'blocked' | 'warning' | 'low-yield' | 'none' | 'unavailable';

/* Artifact wheel(): four fixed rim satellites at NE/SE/SW/NW (Combat 45, Exped 135,
   Prof 225, Bounty 315). The labels are fixed chrome; the value/tone bind from the
   matching surface spoke (by keyword), defaulting to None when there is no spoke. */
const WORK_WHEEL_DIAL = 212;
const WORK_WHEEL_RADIUS = 88;
const WORK_WHEEL_SATELLITES = [
  { slot: 'ne', label: 'Combat', angle: 45, match: /combat|attack|battle|fight/ },
  { slot: 'se', label: 'Exped', angle: 135, match: /exped|expedition|gather|scout/ },
  { slot: 'sw', label: 'Prof', angle: 225, match: /prof|refine|forge|craft|alchemy/ },
  { slot: 'nw', label: 'Bounty', angle: 315, match: /bounty|quest|mission|task/ },
] as const;

function toneToSegmentState(tone: StatusLedgerTone, text: string): WorkSegmentState {
  const normalized = text.toLowerCase();
  if (/blocked|failed|failure|below|stalled|cannot/.test(normalized)) return 'blocked';
  if (/active|running|training|cultivat|gathering|queued/.test(normalized)) return 'active';
  if (/prestige|low-yield|low yield|reincarnation/.test(normalized)) return 'low-yield';
  if (/none|idle|not active|empty|no /.test(normalized)) return 'idle';
  if (tone === 'danger') return 'blocked';
  if (tone === 'warning' || tone === 'gold') return 'warning';
  if (tone === 'muted') return 'unavailable';
  if (tone === 'success' || tone === 'jade') return 'active';
  return 'none';
}

function segmentStyle(index: number, segmentCount: number): CSSProperties {
  const count = Math.max(1, segmentCount);
  const angle = 360 / count;
  return {
    '--segment-index': index,
    '--segment-count': count,
    '--segment-angle': `${index * angle}deg`,
  } as CSSProperties;
}

function routeDisabled(action: StatusLedgerActionSurface | null, onAction?: (action: StatusLedgerActionSurface) => void): boolean {
  return !action || action.disabled || !onAction;
}

function forwardSpokeAction(
  spoke: StatusWorkWheelSpokeSurface | null,
  onAction?: (action: StatusLedgerActionSurface) => void,
): boolean {
  if (!spoke?.route || spoke.route.disabled || !onAction) return false;
  onAction?.(spoke.route);
  return true;
}

function foregroundRead(surface: StatusObservatorySurfaceV1['workWheel']): {
  label: string;
  value: string;
  detail: string;
  tone: StatusLedgerTone;
} {
  if (surface.foreground) {
    return {
      label: surface.foreground.label,
      value: surface.foreground.value ?? surface.foreground.detail,
      detail: surface.foreground.detail,
      tone: surface.foreground.tone,
    };
  }

  return {
    label: 'Foreground',
    value: 'Idle',
    detail: `${surface.rows.length} current-work rows available.`,
    tone: 'muted',
  };
}

/* Position (as a % of the dial box) of a rim satellite centre, from the artifact
   PT(C, C, R-1, angle) polar helper (-90deg = up, clockwise). */
function satelliteStyle(angle: number): CSSProperties {
  const [x, y] = polar(WORK_WHEEL_DIAL / 2, WORK_WHEEL_DIAL / 2, WORK_WHEEL_RADIUS - 1, angle);
  return {
    left: `${(x / WORK_WHEEL_DIAL) * 100}%`,
    top: `${(y / WORK_WHEEL_DIAL) * 100}%`,
  };
}

export const StatusCurrentWorkTimeWheel = memo(StatusCurrentWorkTimeWheelBase, deepEqualProps);

function StatusCurrentWorkTimeWheelBase({
  surface,
  onAction,
  onOpenDrawer,
}: StatusCurrentWorkTimeWheelProps) {
  const spokes = surface.spokes;
  const segmentCount = Math.max(1, spokes.length);
  const foreground = foregroundRead(surface);

  // Bind each fixed rim slot to the first matching surface spoke (by keyword).
  const satellites = WORK_WHEEL_SATELLITES.map((sat) => {
    const spoke = spokes.find((entry) => sat.match.test(`${entry.label} ${entry.detail}`.toLowerCase())) ?? null;
    const value = spoke?.value ?? 'None';
    const tone = spoke?.tone ?? 'muted';
    const state = toneToSegmentState(tone, `${value} ${spoke?.detail ?? ''}`);
    const active = !/^(none|idle)$/i.test(value.trim());
    return { ...sat, spoke, value, tone, state, active };
  });

  const ritual = useRitualMotion();
  const satellitesRoving = useObservatoryRoving(satellites.length);

  return (
    <section
      className="statusObservatoryInstrument statusObservatoryWorkWheel statusCurrentWorkTimeWheel"
      data-testid="status-ledger-current-work"
      data-surface-testid={surface.rootTestId}
      data-s7-instrument="current-work-time-wheel"
      data-work-segments={spokes.length}
      data-animate={ritual.animate ? 'true' : 'false'}
      aria-label={`Current Work Wheel. ${foreground.label}: ${foreground.value}. ${surface.rows.length} exact work rows available.`}
    >
      <div className="statusCurrentWorkTimeWheel__body">
        <div
          className="statusCurrentWorkTimeWheel__dial"
          data-foreground-tone={foreground.tone}
          aria-label={`${foreground.label}. ${foreground.value}. ${foreground.detail}`}
        >
          {/* Artifact wheel(): exact 0 0 212 212 brass dial (C=106, R=88). Paint
              servers (#brass / #jadeRad / #soft / #goldRad) come from the shared
              <InkObservatoryDefs/> mounted in the Observatory shell. */}
          <svg
            className="statusCurrentWorkTimeWheel__rig"
            viewBox="0 0 212 212"
            aria-hidden="true"
            focusable={false}
          >
            {/* outer dashed ring (64s forward spin) */}
            <g className="statusCurrentWorkTimeWheel__spinRing">
              <circle
                className="statusCurrentWorkTimeWheel__rigDash"
                cx="106"
                cy="106"
                r="93"
                fill="none"
              />
            </g>
            {/* brass rim + two dark detail rings */}
            <circle className="statusCurrentWorkTimeWheel__rigRim" cx="106" cy="106" r="88" fill="none" stroke="url(#brass)" />
            <circle className="statusCurrentWorkTimeWheel__rigRingInner" cx="106" cy="106" r="83" fill="none" />
            <circle className="statusCurrentWorkTimeWheel__rigRingOuter" cx="106" cy="106" r="92" fill="none" />
            {/* inner tick ring (110s reverse spin): 24 ticks at i*15deg, exact PT geometry */}
            <g className="statusCurrentWorkTimeWheel__spinRingInner">
              {Array.from({ length: 24 }, (_, i) => {
                const ang = (i * 15 - 90) * (Math.PI / 180);
                const cos = Math.cos(ang);
                const sin = Math.sin(ang);
                const innerR = i % 3 ? 77 : 73;
                const minor = i % 3 !== 0;
                return (
                  <line
                    key={i}
                    className="statusCurrentWorkTimeWheel__rigTick"
                    data-minor={minor ? 'true' : 'false'}
                    x1={(106 + 81 * cos).toFixed(1)}
                    y1={(106 + 81 * sin).toFixed(1)}
                    x2={(106 + innerR * cos).toFixed(1)}
                    y2={(106 + innerR * sin).toFixed(1)}
                  />
                );
              })}
            </g>
            {/* jade breath glow */}
            <circle className="statusCurrentWorkTimeWheel__coreBreath" cx="106" cy="106" r="52" filter="url(#soft)" />
            {/* jade core: brass-rimmed disc + inner detail ring */}
            <circle className="statusCurrentWorkTimeWheel__rigCore" cx="106" cy="106" r="44" fill="url(#jadeRad)" stroke="url(#brass)" />
            <circle className="statusCurrentWorkTimeWheel__rigCoreInner" cx="106" cy="106" r="38" fill="none" />
            {/* Hub text: 行 watermark, then the LABEL above the VALUE (artifact order). */}
            <text
              className="statusCurrentWorkTimeWheel__rigCoreMark"
              x="106"
              y="90"
              textAnchor="middle"
            >
              行
            </text>
            <text className="statusCurrentWorkTimeWheel__hubLabel" x="106" y="104" textAnchor="middle">
              {foreground.label.toUpperCase()}
            </text>
            <text className="statusCurrentWorkTimeWheel__hubValue" x="106" y="120" textAnchor="middle">
              {foreground.value}
            </text>
          </svg>

          {/* Legacy decorative bar layer kept in DOM with its data-* + --segment-angle
              for the S7 stylesheet contract (hidden — the artifact conveys per-spoke
              state through the satellites, not radial bars). */}
          <div className="statusCurrentWorkTimeWheel__segmentLayer" aria-hidden="true">
            {spokes.map((spoke, index) => {
              const state = toneToSegmentState(spoke.tone, `${spoke.label} ${spoke.value ?? ''} ${spoke.detail}`);
              return (
                <span
                  key={spoke.id}
                  className="statusCurrentWorkTimeWheel__segment"
                  data-spoke-id={spoke.id}
                  data-tone={spoke.tone}
                  data-segment-state={state}
                  style={segmentStyle(index, segmentCount)}
                />
              );
            })}
          </div>

          {/* Hub: an invisible focusable overlay over the jade core that opens the
              exact Current Work drawer (the visible label/value live in the SVG). */}
          <button
            type="button"
            className="statusCurrentWorkTimeWheel__core"
            aria-haspopup="dialog"
            aria-label={`${foreground.label}: ${foreground.value}. Opens the Current Work ledger.`}
            onClick={() => onOpenDrawer?.({ kind: 'currentWork', sourceId: surface.foreground?.id })}
          />

          {/* Four rim satellites (artifact text-in-circles), as positioned buttons so
              they stay keyboard reachable and forward the matched spoke route. */}
          <div
            className="statusCurrentWorkTimeWheel__satellites"
            aria-label="Current work wheel satellites"
            onKeyDown={satellitesRoving.onKeyDown}
          >
            {satellites.map((sat, index) => {
              const disabled = routeDisabled(sat.spoke?.route ?? null, onAction);
              return (
                <button
                  key={sat.slot}
                  type="button"
                  className="statusCurrentWorkTimeWheel__satellite"
                  data-slot={sat.slot}
                  data-segment-state={sat.state}
                  data-active={sat.active ? 'true' : 'false'}
                  style={satelliteStyle(sat.angle)}
                  aria-disabled={disabled ? 'true' : undefined}
                  aria-label={`${sat.label}, ${sat.value}. ${sat.spoke?.detail ?? 'No active work.'}`}
                  title={sat.spoke?.route?.disabled ? sat.spoke.route.disabledReason ?? sat.spoke.route.detail : sat.spoke?.detail}
                  onClick={() => {
                    if (!forwardSpokeAction(sat.spoke, onAction)) {
                      onOpenDrawer?.({ kind: 'currentWork', sourceId: sat.spoke?.id });
                    }
                  }}
                  {...satellitesRoving.getItemProps(index)}
                >
                  <span className="statusCurrentWorkTimeWheel__satelliteLabel">{sat.label}</span>
                  <span className="statusCurrentWorkTimeWheel__satelliteValue">{sat.value}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
