import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import type { StatusLedgerActionSurface, StatusLedgerTone } from '../../../systems/ui/status/statusLedgerTypes.js';
import type {
  StatusBottleneckTalismanSlipSurface,
  StatusObservatorySurfaceV1,
} from '../../../systems/ui/status/statusObservatoryTypes.js';
import type { ObservatoryCanopyMode } from '../../../systems/ui/status/statusObservatoryPresentation.js';
import { StatusBottleneckInspector } from './StatusBottleneckInspector.js';
import { StatusCausalThreadLayer } from './StatusCausalThreadLayer.js';
import { useObservatorySelection } from './useObservatorySelection.js';
import { useRitualMotion } from './fx/useRitualMotion.js';
import { useObservatoryMotion } from './useObservatoryMotion.js';
import { InkWaxSeal } from '../../ink/InkWaxSeal.js';
import { InkTassel } from '../../ink/InkTassel.js';

export interface StatusBottleneckTalismanCanopyProps {
  surface: StatusObservatorySurfaceV1['bottleneckCanopy'];
  canopyMode?: ObservatoryCanopyMode;
  onAction?: (action: StatusLedgerActionSurface) => void;
}

function toneOf(action: StatusLedgerActionSurface | null | undefined, fallback: StatusLedgerTone): StatusLedgerTone {
  return action?.tone ?? fallback;
}

function charmDisabled(action: StatusLedgerActionSurface, onAction: StatusBottleneckTalismanCanopyProps['onAction']): boolean {
  return action.disabled || !onAction;
}

function slipStyle(slip: StatusBottleneckTalismanSlipSurface): CSSProperties {
  return {
    '--slip-x': `${slip.geometry.x}`,
    '--slip-y': `${slip.geometry.y}`,
    '--slip-rotation': `${slip.geometry.rotationDeg}deg`,
  } as CSSProperties;
}

function charmStyle(charm: StatusObservatorySurfaceV1['bottleneckCanopy']['routeCharms'][number]): CSSProperties {
  return {
    '--charm-x': `${charm.geometry.x}`,
    '--charm-y': `${charm.geometry.y}`,
  } as CSSProperties;
}

function defaultSlipId(surface: StatusObservatorySurfaceV1['bottleneckCanopy']): string | null {
  return surface.inspector.selectedSlipId
    ?? surface.talismanSlips.find((slip) => slip.routeAction)?.id
    ?? surface.talismanSlips[0]?.id
    ?? null;
}

function edictActionLabel(action: StatusLedgerActionSurface): string {
  return action.destinationLabel ? `${action.label} / ${action.destinationLabel}` : action.label;
}

/* Decorative Kai-ti chop per visual state (chrome only - not surface data). */
const CANOPY_EDICT_CHOP: Record<string, { chars: string; variant: 'cinnabar' | 'jade' }> = {
  blocked: { chars: '瓶頸', variant: 'cinnabar' },
  healthy: { chars: '順遂', variant: 'jade' },
  postFailure: { chars: '敗', variant: 'cinnabar' },
  prestigePressure: { chars: '鼎', variant: 'cinnabar' },
  contentCap: { chars: '待續', variant: 'cinnabar' },
  unknown: { chars: '瓶頸', variant: 'cinnabar' },
};

function edictChop(visualState: string): { chars: string; variant: 'cinnabar' | 'jade' } {
  return CANOPY_EDICT_CHOP[visualState] ?? CANOPY_EDICT_CHOP.unknown;
}

/* Display-only parse of the surface progressLabel ("N / M") into shape-coded pips.
   The label stays the truth; pips are a redundant grayscale-safe meter. */
function parseProgressPips(progressLabel: string): { on: number; of: number } | null {
  const match = /(\d+)\s*\/\s*(\d+)/.exec(progressLabel);
  if (!match) return null;
  const on = Number.parseInt(match[1], 10);
  const of = Number.parseInt(match[2], 10);
  if (!Number.isFinite(of) || of <= 0 || of > 12) return null;
  return { on: Math.min(Math.max(on, 0), of), of };
}

/* Default canopyMode when the shell doesn't thread it (standalone / tests).
   Mirrors resolveObservatoryPresentation()'s visualState -> canopyMode map
   (single source of truth: statusObservatoryPresentation.ts). */
function canopyModeForVisualState(visualState: string): ObservatoryCanopyMode {
  switch (visualState) {
    case 'healthy':
      return 'maintenance';
    case 'postFailure':
      return 'failureDiagnosis';
    case 'prestigePressure':
      return 'reincarnationEdict';
    case 'contentCap':
      return 'capNotice';
    case 'blocked':
      return 'bottleneck';
    default:
      return 'maintenance';
  }
}

export function StatusBottleneckTalismanCanopy({
  surface,
  canopyMode,
  onAction,
}: StatusBottleneckTalismanCanopyProps) {
  const slipsById = useMemo(() => new Map(surface.talismanSlips.map((slip) => [slip.id, slip])), [surface.talismanSlips]);
  const fallbackSlipId = useMemo(() => defaultSlipId(surface), [surface]);
  const [selectedSlipId, setSelectedSlipId] = useState<string | null>(fallbackSlipId);
  const sharedSelection = useObservatorySelection();
  const ritual = useRitualMotion();
  const motion = useObservatoryMotion({
    purityPct: 0,
    fitAngleDeg: 0,
    qiPerSecond: null,
    cultivationRate: null,
  });

  useEffect(() => {
    setSelectedSlipId((current) => (current && slipsById.has(current) ? current : fallbackSlipId));
  }, [fallbackSlipId, slipsById]);

  const selectedSlip = selectedSlipId ? slipsById.get(selectedSlipId) ?? null : surface.talismanSlips[0] ?? null;
  const edictAction = surface.centralEdict.primaryAction;
  const edictDisabled = !edictAction || edictAction.disabled || !onAction;
  const chop = edictChop(surface.centralEdict.visualState);
  const safetyPips = parseProgressPips(surface.safetySeal.progressLabel);
  const resolvedCanopyMode = canopyMode ?? canopyModeForVisualState(surface.centralEdict.visualState);
  const slipButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const handleSlipRovingKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const active = document.activeElement as HTMLElement | null;
    const currentId = active?.getAttribute?.('data-slip-id');
    if (!currentId) return;
    const slips = surface.talismanSlips;
    const index = slips.findIndex((slip) => slip.id === currentId);
    if (index < 0) return;
    let target = index;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        target = Math.min(index + 1, slips.length - 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        target = Math.max(index - 1, 0);
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = slips.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const next = slips[target];
    if (!next || next.id === currentId) return;
    setSelectedSlipId(next.id);
    sharedSelection.select('talisman', next.id);
    slipButtonRefs.current.get(next.id)?.focus();
  };

  return (
    <section
      className="statusObservatoryInstrument statusObservatoryCanopy statusBottleneckTalismanCanopy"
      data-testid="status-bottleneck-canopy"
      data-surface-testid={surface.rootTestId}
      data-s6-instrument="bottleneck-talisman-canopy"
      data-visual-state={surface.centralEdict.visualState}
      data-canopy-mode={resolvedCanopyMode}
      data-selected-slip-id={selectedSlip?.id ?? 'none'}
      data-animate={ritual.animate ? 'true' : 'false'}
      style={motion as CSSProperties}
      aria-label="Bottleneck Talisman Canopy"
    >
      <div className="statusBottleneckTalismanCanopy__header">
        <span className="statusObservatoryInstrument__sigil" aria-hidden="true" />
        <div>
          <h2>{surface.title}</h2>
          <p>{surface.subtitle}</p>
        </div>
      </div>

      <div className="statusBottleneckTalismanCanopy__board">
        <div className="statusBottleneckTalismanCanopy__backboard" aria-hidden="true" />

        <svg
          className="statusBottleneckTalismanCanopy__rail"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path className="statusBottleneckTalismanCanopy__railArc" d="M5 6 Q50 2 95 6" />
          <circle className="statusBottleneckTalismanCanopy__railCap" cx="5" cy="6" r="1.4" />
          <circle className="statusBottleneckTalismanCanopy__railCap" cx="95" cy="6" r="1.4" />
          {surface.talismanSlips.map((slip) => {
            const tx = slip.geometry.x;
            const ty = slip.geometry.y - 6;
            const ax = slip.geometry.x + (50 - slip.geometry.x) * 0.34;
            const ay = 6.4;
            return (
              <g key={slip.id}>
                <path
                  className="statusBottleneckTalismanCanopy__cord"
                  data-tone={slip.tone}
                  d={`M${ax} ${ay} C${ax} ${ay + 12} ${tx} ${ty - 12} ${tx} ${ty}`}
                />
                <circle className="statusBottleneckTalismanCanopy__cordAnchor" cx={ax} cy={ay} r="0.7" />
                <circle className="statusBottleneckTalismanCanopy__cordAnchor" cx={tx} cy={ty} r="0.8" />
              </g>
            );
          })}
        </svg>

        <StatusCausalThreadLayer
          threads={surface.causalThreads}
          className="statusBottleneckTalismanCanopy__threads"
        />

        <div className="statusBottleneckTalismanCanopy__missionAnchor" data-testid="status-ledger-mission-requirements">
          <article
            className="statusBottleneckTalismanCanopy__edict"
            data-testid="status-bottleneck-edict"
            data-visual-state={surface.centralEdict.visualState}
            data-tone={toneOf(edictAction, toneOf(surface.safetySeal.action, surface.safetySeal.tone))}
            data-has-action={edictAction ? 'true' : 'false'}
          >
            <span className="statusBottleneckTalismanCanopy__pin" aria-hidden="true" />
            <span>{surface.centralEdict.sourceLabel}</span>
            <h3>{surface.centralEdict.label}</h3>
            <p>{surface.centralEdict.detail}</p>
            {edictAction ? (
              <button
                type="button"
                className="statusBottleneckTalismanCanopy__edictRoute"
                data-action-id={edictAction.id}
                data-disabled={edictDisabled ? 'true' : 'false'}
                disabled={edictDisabled}
                aria-disabled={edictDisabled ? 'true' : undefined}
                title={edictAction.disabled ? edictAction.disabledReason ?? edictAction.detail : edictAction.detail}
                onClick={() => {
                  if (!edictDisabled && edictAction) onAction?.(edictAction);
                }}
              >
                {edictActionLabel(edictAction)}
              </button>
            ) : null}
            <InkWaxSeal
              className="statusBottleneckTalismanCanopy__edictChop"
              chars={chop.chars}
              size={44}
              rotation={7}
              variant={chop.variant}
            />
            <svg
              className="statusBottleneckTalismanCanopy__stand"
              viewBox="0 0 100 16"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M18 3 Q50 12 82 3 M30 3 Q50 14 70 3 M44 6 L44 14 M56 6 L56 14" />
              <circle cx="50" cy="14" r="2" />
            </svg>
          </article>
        </div>

        <div
          className="statusBottleneckTalismanCanopy__slips"
          aria-label="Pinned bottleneck talisman slips"
          onKeyDown={handleSlipRovingKeyDown}
        >
          {surface.talismanSlips.map((slip) => {
            const selected = slip.id === selectedSlip?.id;
            return (
              <button
                key={slip.id}
                ref={(el) => {
                  if (el) slipButtonRefs.current.set(slip.id, el);
                  else slipButtonRefs.current.delete(slip.id);
                }}
                type="button"
                className="statusBottleneckTalismanCanopy__slip"
                style={slipStyle(slip)}
                data-testid="status-bottleneck-slip"
                data-slip-id={slip.id}
                data-source-family={slip.sourceFamily}
                data-tone={slip.tone}
                data-selected={selected ? 'true' : 'false'}
                data-related={sharedSelection.isRelated('bottleneckCanopy', slip.id) ? 'true' : 'false'}
                data-rotation={slip.geometry.rotationDeg}
                tabIndex={selected ? 0 : -1}
                aria-pressed={selected}
                aria-label={slip.ariaLabel}
                onClick={() => {
                  setSelectedSlipId(slip.id);
                  sharedSelection.select('talisman', slip.id);
                }}
                onFocus={() => {
                  setSelectedSlipId(slip.id);
                  sharedSelection.select('talisman', slip.id);
                }}
              >
                <span>{slip.priorityLabel ?? slip.stateLabel ?? slip.sourceLabel}</span>
                <strong>{slip.title}</strong>
                <small>{slip.routeLabel ?? slip.detail}</small>
              </button>
            );
          })}
        </div>

        <div className="statusBottleneckTalismanCanopy__routeCharms" aria-label="Best improvement route charms">
          <div className="statusBottleneckTalismanCanopy__charmRod" aria-hidden="true" />
          {surface.routeCharms.map((charm) => {
            const disabled = charmDisabled(charm.action, onAction);
            return (
              <button
                key={charm.id}
                type="button"
                className="statusBottleneckTalismanCanopy__routeCharm"
                style={charmStyle(charm)}
                data-testid="status-bottleneck-route-charm"
                data-action-id={charm.action.id}
                data-destination-kind={charm.action.target.kind}
                data-disabled={disabled ? 'true' : 'false'}
                disabled={disabled}
                aria-disabled={disabled ? 'true' : undefined}
                title={charm.action.disabled ? charm.action.disabledReason ?? charm.detail : charm.detail}
                onClick={() => {
                  if (!disabled) onAction?.(charm.action);
                }}
              >
                {/* W5-deferred: per-route glyph atlas (own Design packet). Medallion truth = ring + order + label. */}
                <svg className="statusBottleneckTalismanCanopy__charmMedallion" viewBox="0 0 24 30" aria-hidden="true">
                  <line className="statusBottleneckTalismanCanopy__charmCord" x1="12" y1="0" x2="12" y2="5" />
                  <ellipse className="statusBottleneckTalismanCanopy__charmRim" cx="12" cy="14" rx="9.5" ry="11" />
                  <ellipse
                    className="statusBottleneckTalismanCanopy__charmDisc"
                    data-charm-tone={charm.action.tone}
                    cx="12"
                    cy="14"
                    rx="7"
                    ry="8.5"
                  />
                  <text
                    className="statusBottleneckTalismanCanopy__charmMark"
                    x="12"
                    y="14"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {charm.order}
                  </text>
                  <InkTassel x={12} y={25} color="var(--observatory-cinnabar)" length={4} />
                </svg>
                <strong>{charm.label}</strong>
              </button>
            );
          })}
        </div>
      </div>

      <StatusBottleneckInspector inspector={surface.inspector} slip={selectedSlip} onAction={onAction} />

      <div
        className="statusBottleneckTalismanCanopy__safetySeal"
        data-testid="status-bottleneck-safety-seal"
        data-tone={surface.safetySeal.tone}
        data-has-action={surface.safetySeal.action ? 'true' : 'false'}
        aria-label={`${surface.safetySeal.label}: ${surface.safetySeal.stateLabel}. ${surface.safetySeal.progressLabel}`}
      >
        <svg className="statusBottleneckTalismanCanopy__mercyRing" viewBox="0 0 40 40" aria-hidden="true">
          <circle className="statusBottleneckTalismanCanopy__mercyRingOuter" cx="20" cy="18" r="14" />
          <circle className="statusBottleneckTalismanCanopy__mercyRingInner" cx="20" cy="18" r="11" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * 2 * Math.PI;
            return (
              <circle
                key={i}
                className="statusBottleneckTalismanCanopy__mercyBead"
                cx={(20 + 14 * Math.cos(a)).toFixed(2)}
                cy={(18 + 14 * Math.sin(a)).toFixed(2)}
                r="0.9"
              />
            );
          })}
          <path
            className="statusBottleneckTalismanCanopy__lotus"
            d="M20 24 C16.5 21 16.5 14.5 20 12.5 C23.5 14.5 23.5 21 20 24 Z M14.5 20 C11 17.5 11.8 12.8 16 11.8 M25.5 20 C29 17.5 28.2 12.8 24 11.8"
          />
          <InkTassel x={10} y={30} color="var(--observatory-state)" length={4.5} />
        </svg>
        <span>{surface.safetySeal.label} / Mercy Path</span>
        <strong>{surface.safetySeal.stateLabel}</strong>
        <small>{surface.safetySeal.progressLabel}</small>
        {safetyPips ? (
          <span className="statusBottleneckTalismanCanopy__progressPips" aria-hidden="true">
            {Array.from({ length: safetyPips.of }, (_, i) => (
              <i key={i} data-on={i < safetyPips.on ? 'true' : 'false'} />
            ))}
          </span>
        ) : null}
        {surface.safetySeal.action ? (
          <button
            type="button"
            data-action-id={surface.safetySeal.action.id}
            disabled={surface.safetySeal.action.disabled || !onAction}
            aria-disabled={surface.safetySeal.action.disabled || !onAction ? 'true' : undefined}
            title={surface.safetySeal.action.disabled ? surface.safetySeal.action.disabledReason ?? surface.safetySeal.action.detail : surface.safetySeal.action.detail}
            onClick={() => {
              if (!surface.safetySeal.action?.disabled && surface.safetySeal.action) onAction?.(surface.safetySeal.action);
            }}
          >
            {surface.safetySeal.action.label}
          </button>
        ) : null}
      </div>
    </section>
  );
}
