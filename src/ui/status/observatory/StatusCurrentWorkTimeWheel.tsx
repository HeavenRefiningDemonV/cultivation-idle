import type { CSSProperties } from 'react';
import type { StatusLedgerActionSurface, StatusLedgerTone } from '../../../systems/ui/status/statusLedgerTypes.js';
import type {
  StatusObservatoryDrawerRequest,
  StatusObservatorySurfaceV1,
  StatusWorkWheelSpokeSurface,
} from '../../../systems/ui/status/statusObservatoryTypes.js';
import { useRitualMotion } from './fx/useRitualMotion.js';
import { useObservatoryMotion } from './useObservatoryMotion.js';
import { ObservatoryDiscMedallion, type ObservatoryDiscVariant } from './ObservatoryDiscMedallion.js';
import { useObservatoryRoving } from './useObservatoryRoving.js';

export interface StatusCurrentWorkTimeWheelProps {
  surface: StatusObservatorySurfaceV1['workWheel'];
  onAction?: (action: StatusLedgerActionSurface) => void;
  onOpenDrawer?: (drawer: StatusObservatoryDrawerRequest) => void;
}

type WorkSegmentState = 'active' | 'idle' | 'blocked' | 'warning' | 'low-yield' | 'none' | 'unavailable';

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
  spoke: StatusWorkWheelSpokeSurface,
  onAction?: (action: StatusLedgerActionSurface) => void,
): boolean {
  if (!spoke.route || spoke.route.disabled || !onAction) return false;
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

/* Decorative per-spoke disc tone — the spoke's label + value + data-segment-state
   remain the truth; the disc tint is redundant chrome. */
function spokeVariant(state: WorkSegmentState): ObservatoryDiscVariant {
  if (state === 'active') return 'jade';
  if (state === 'blocked') return 'cinnabar';
  return 'gold';
}

export function StatusCurrentWorkTimeWheel({
  surface,
  onAction,
  onOpenDrawer,
}: StatusCurrentWorkTimeWheelProps) {
  const spokes = surface.spokes;
  const segmentCount = Math.max(1, spokes.length);
  const foreground = foregroundRead(surface);
  const ritual = useRitualMotion();
  const motion = useObservatoryMotion({ purityPct: 0, fitAngleDeg: 0, qiPerSecond: null, cultivationRate: null });
  const spokesRoving = useObservatoryRoving(spokes.length);

  return (
    <section
      className="statusObservatoryInstrument statusObservatoryWorkWheel statusCurrentWorkTimeWheel"
      data-testid="status-ledger-current-work"
      data-surface-testid={surface.rootTestId}
      data-s7-instrument="current-work-time-wheel"
      data-work-segments={spokes.length}
      data-animate={ritual.animate ? 'true' : 'false'}
      style={motion as CSSProperties}
      aria-label={`Current Work Wheel. ${foreground.label}: ${foreground.value}. ${surface.rows.length} exact work rows available.`}
    >
      <div className="statusObservatoryInstrument__header statusCurrentWorkTimeWheel__header">
        <span className="statusObservatoryInstrument__sigil" aria-hidden="true" />
        <div>
          <h2>{surface.title}</h2>
          <p>Foreground, combat, bounty, expeditions, queues, and pressure read as one time wheel.</p>
        </div>
      </div>

      <div className="statusCurrentWorkTimeWheel__body">
        <div
          className="statusCurrentWorkTimeWheel__dial"
          data-foreground-tone={foreground.tone}
          aria-label={`${foreground.label}. ${foreground.value}. ${foreground.detail}`}
        >
          <svg
            className="statusCurrentWorkTimeWheel__rig"
            viewBox="0 0 100 100"
            aria-hidden="true"
            focusable={false}
          >
            <circle className="statusCurrentWorkTimeWheel__rigRim" cx="50" cy="50" r="46" fill="none" stroke="url(#brass)" />
            <circle className="statusCurrentWorkTimeWheel__rigRing" cx="50" cy="50" r="48" fill="none" />
            <circle className="statusCurrentWorkTimeWheel__rigRing" cx="50" cy="50" r="43" fill="none" />
            <g className="statusCurrentWorkTimeWheel__spinRing">
              <circle className="statusCurrentWorkTimeWheel__rigDash" cx="50" cy="50" r="40" fill="none" />
            </g>
            <g className="statusCurrentWorkTimeWheel__spinRingInner">
              {Array.from({ length: 24 }, (_, i) => {
                const a = (i / 24) * 2 * Math.PI;
                const r1 = 29;
                const r2 = i % 3 === 0 ? 35 : 32;
                return (
                  <line
                    key={i}
                    className="statusCurrentWorkTimeWheel__rigTick"
                    x1={(50 + r1 * Math.cos(a)).toFixed(2)}
                    y1={(50 + r1 * Math.sin(a)).toFixed(2)}
                    x2={(50 + r2 * Math.cos(a)).toFixed(2)}
                    y2={(50 + r2 * Math.sin(a)).toFixed(2)}
                  />
                );
              })}
            </g>
            <circle className="statusCurrentWorkTimeWheel__coreBreath" cx="50" cy="50" r="21" filter="url(#soft)" />
            <circle className="statusCurrentWorkTimeWheel__rigCore" cx="50" cy="50" r="20" fill="url(#jadeRad)" stroke="url(#brass)" />
            <text
              className="statusCurrentWorkTimeWheel__rigCoreMark"
              x="50"
              y="50"
              textAnchor="middle"
              dominantBaseline="central"
            >
              行
            </text>
          </svg>

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

          <button
            type="button"
            className="statusCurrentWorkTimeWheel__core"
            aria-haspopup="dialog"
            onClick={() => onOpenDrawer?.({ kind: 'currentWork', sourceId: surface.foreground?.id })}
          >
            <span>Foreground</span>
            <strong>{foreground.value}</strong>
            <small>{foreground.label}</small>
          </button>
        </div>

        <div
          className="statusCurrentWorkTimeWheel__spokes"
          aria-label="Current work wheel segments"
          onKeyDown={spokesRoving.onKeyDown}
        >
          {spokes.map((spoke, index) => {
            const state = toneToSegmentState(spoke.tone, `${spoke.label} ${spoke.value ?? ''} ${spoke.detail}`);
            const disabled = routeDisabled(spoke.route, onAction);

            return (
              <button
                key={spoke.id}
                type="button"
                className="statusCurrentWorkTimeWheel__spoke"
                data-spoke-index={index}
                data-spoke-id={spoke.id}
                data-tone={spoke.tone}
                data-segment-state={state}
                aria-disabled={disabled ? 'true' : undefined}
                aria-label={`${spoke.label}, ${state}, ${spoke.value ?? spoke.detail}. ${spoke.detail}`}
                title={spoke.route?.disabled ? spoke.route.disabledReason ?? spoke.route.detail : spoke.detail}
                onClick={() => {
                  if (!forwardSpokeAction(spoke, onAction)) {
                    onOpenDrawer?.({ kind: 'currentWork', sourceId: spoke.id });
                  }
                }}
                {...spokesRoving.getItemProps(index)}
              >
                <ObservatoryDiscMedallion
                  className="statusCurrentWorkTimeWheel__spokeMedallion"
                  variant={spokeVariant(state)}
                />
                <span>{spoke.label}</span>
                <strong>{spoke.value ?? state}</strong>
                <small>{spoke.detail}</small>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className="statusCurrentWorkTimeWheel__openLedger"
        aria-haspopup="dialog"
        onClick={() => onOpenDrawer?.({ kind: 'currentWork' })}
      >
        <span>Open Current Work Ledger</span>
        <strong>{surface.rows.length} exact rows</strong>
      </button>
    </section>
  );
}
