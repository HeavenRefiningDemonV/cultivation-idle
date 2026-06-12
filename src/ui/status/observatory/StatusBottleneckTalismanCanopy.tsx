import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { StatusLedgerActionSurface, StatusLedgerTone } from '../../../systems/ui/status/statusLedgerTypes.js';
import type {
  StatusBottleneckTalismanSlipSurface,
  StatusObservatorySurfaceV1,
} from '../../../systems/ui/status/statusObservatoryTypes.js';
import { StatusBottleneckInspector } from './StatusBottleneckInspector.js';
import { StatusCausalThreadLayer } from './StatusCausalThreadLayer.js';
import { useObservatorySelection } from './useObservatorySelection.js';

export interface StatusBottleneckTalismanCanopyProps {
  surface: StatusObservatorySurfaceV1['bottleneckCanopy'];
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

export function StatusBottleneckTalismanCanopy({
  surface,
  onAction,
}: StatusBottleneckTalismanCanopyProps) {
  const slipsById = useMemo(() => new Map(surface.talismanSlips.map((slip) => [slip.id, slip])), [surface.talismanSlips]);
  const fallbackSlipId = useMemo(() => defaultSlipId(surface), [surface]);
  const [selectedSlipId, setSelectedSlipId] = useState<string | null>(fallbackSlipId);
  const sharedSelection = useObservatorySelection();

  useEffect(() => {
    setSelectedSlipId((current) => (current && slipsById.has(current) ? current : fallbackSlipId));
  }, [fallbackSlipId, slipsById]);

  const selectedSlip = selectedSlipId ? slipsById.get(selectedSlipId) ?? null : surface.talismanSlips[0] ?? null;
  const edictAction = surface.centralEdict.primaryAction;
  const edictDisabled = !edictAction || edictAction.disabled || !onAction;

  return (
    <section
      className="statusObservatoryInstrument statusObservatoryCanopy statusBottleneckTalismanCanopy"
      data-testid="status-bottleneck-canopy"
      data-surface-testid={surface.rootTestId}
      data-s6-instrument="bottleneck-talisman-canopy"
      data-visual-state={surface.centralEdict.visualState}
      data-selected-slip-id={selectedSlip?.id ?? 'none'}
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
          </article>
        </div>

        <div className="statusBottleneckTalismanCanopy__slips" aria-label="Pinned bottleneck talisman slips">
          {surface.talismanSlips.map((slip) => {
            const selected = slip.id === selectedSlip?.id;
            return (
              <button
                key={slip.id}
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
                <span>{charm.order}</span>
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
        <span>{surface.safetySeal.label} / Mercy Path</span>
        <strong>{surface.safetySeal.stateLabel}</strong>
        <small>{surface.safetySeal.progressLabel}</small>
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
