import { memo } from 'react';
import type { StatusLedgerActionSurface } from '../../../systems/ui/status/statusLedgerTypes.js';
import type { StatusObservatorySurfaceV1 } from '../../../systems/ui/status/statusObservatoryTypes.js';
import { deepEqualProps } from './fx/memoProps.js';
import { StatusHeartLawSeal } from './StatusHeartLawSeal.js';
import { StatusSpiritRootAstrolabe } from './StatusSpiritRootAstrolabe.js';

export interface StatusRootLawCoupledInstrumentProps {
  surface: StatusObservatorySurfaceV1['rootLawInstrument'];
  onAction?: (action: StatusLedgerActionSurface) => void;
}

function bridgeMarkerCount(state: StatusObservatorySurfaceV1['rootLawInstrument']['bridge']['state']): number {
  if (state === 'opposed') return 3;
  if (state === 'strained') return 2;
  return 0;
}

type AstrolabeSurface = StatusObservatorySurfaceV1['rootLawInstrument']['astrolabe'];

function observeAction(astrolabe: AstrolabeSurface): StatusLedgerActionSurface | null {
  // The surface lists the spirit-root observation action first (statusObservatory
  // Surface builds routeActions = [observationAction, ...]). Prefer the typed
  // status_observation route, then the named one, then fall back to that first
  // route so the foot's Observe button is present whenever a route exists.
  return (
    astrolabe.routeActions.find((action) => action.target.kind === 'status_observation') ??
    astrolabe.routeActions.find((action) => action.label === 'Observe Spirit Root') ??
    astrolabe.routeActions[0] ??
    null
  );
}

export const StatusRootLawCoupledInstrument = memo(StatusRootLawCoupledInstrumentBase, deepEqualProps);

function StatusRootLawCoupledInstrumentBase({
  surface,
  onAction,
}: StatusRootLawCoupledInstrumentProps) {
  const markerCount = bridgeMarkerCount(surface.bridge.state);
  const forwardAction = (action: StatusLedgerActionSurface) => {
    if (!action.disabled && onAction) onAction(action);
  };

  // Artifact rootFoot: a thin full-width row of small stats below both columns.
  // "bad" (cinnabar) reads off the fit tier — opposed/strained suppress expression,
  // run validity, and the fit verdict.
  const tier = surface.bridge.fitTier;
  const fitBad = tier === 'opposed' || tier === 'strained';
  const footStats: Array<{ label: string; value: string; bad: boolean }> = [];
  if (surface.astrolabe.purityLabel) footStats.push({ label: 'Purity', value: surface.astrolabe.purityLabel, bad: false });
  if (surface.astrolabe.expressionCapLabel) footStats.push({ label: 'Expression Cap', value: surface.astrolabe.expressionCapLabel, bad: tier === 'opposed' });
  if (surface.astrolabe.proc) {
    footStats.push({
      label: 'Root Proc',
      value: surface.astrolabe.proc.cooldownLabel ? `${surface.astrolabe.proc.name} · ${surface.astrolabe.proc.cooldownLabel}` : surface.astrolabe.proc.name,
      bad: false,
    });
  }
  if (surface.astrolabe.runValidityLabel) footStats.push({ label: 'Run Validity', value: surface.astrolabe.runValidityLabel, bad: fitBad });
  if (surface.astrolabe.fitLabel) footStats.push({ label: 'Root / Law Fit', value: surface.astrolabe.fitLabel, bad: fitBad });

  const observe = observeAction(surface.astrolabe);
  const daoHeart = surface.heartLawSeal.routeAction;
  const observeDisabled = !observe || observe.disabled || !onAction;
  const daoDisabled = !daoHeart || daoHeart.disabled || !onAction;

  return (
    <section
      className="statusObservatoryInstrument statusObservatoryRootLaw statusRootLawCoupledInstrument"
      data-testid="status-root-law-instrument"
      data-surface-testid={surface.rootTestId}
      data-s5-instrument="root-law-coupled"
      data-bridge-state={surface.bridge.state}
      data-bridge-broken={surface.bridge.broken ? 'true' : 'false'}
      data-fit-tier={surface.bridge.fitTier}
      aria-label={surface.bridge.ariaLabel}
    >
      <div className="statusRootLawCoupledInstrument__body">
        <StatusSpiritRootAstrolabe surface={surface.astrolabe} />

        <div
          className="statusRootLawBridge"
          data-bridge-state={surface.bridge.state}
          data-bridge-broken={surface.bridge.broken ? 'true' : 'false'}
          data-fit-tier={surface.bridge.fitTier}
          data-tone={surface.bridge.tone}
          aria-label={surface.bridge.ariaLabel}
        >
          <div className="statusRootLawBridge__cord" aria-hidden="true">
            <span className="statusRootLawBridge__knot statusRootLawBridge__knot--root" />
            <span className="statusRootLawBridge__line" />
            <span className="statusRootLawBridge__knot statusRootLawBridge__knot--law" />
            {Array.from({ length: markerCount }, (_, index) => (
              <span
                key={index}
                className={`statusRootLawBridge__crack statusRootLawBridge__crack--${index + 1}`}
              />
            ))}
          </div>
          <span className="statusRootLawBridge__label">Root / Law Fit</span>
          <strong>{surface.bridge.label}</strong>
          <p>{surface.bridge.detail}</p>
        </div>

        <StatusHeartLawSeal
          surface={surface.heartLawSeal}
          distress={surface.bridge.fitTier === 'opposed'}
        />
      </div>

      {/* Artifact rootFoot: small full-width stat row + the two route buttons. */}
      <div className="statusRootLawCoupledInstrument__foot">
        <div className="statusRootLawCoupledInstrument__footStats">
          {footStats.map((stat) => (
            <div key={stat.label} className="statusRootLawCoupledInstrument__footStat" data-bad={stat.bad ? 'true' : 'false'}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>
        <div className="statusRootLawCoupledInstrument__footActions">
          {observe ? (
            <button
              type="button"
              className="statusRootLawRouteButton statusRootLawRouteButton--observe"
              data-route-kind={observe.target.kind}
              data-disabled={observeDisabled ? 'true' : 'false'}
              disabled={observeDisabled}
              title={observe.disabled ? observe.disabledReason ?? observe.detail : observe.detail}
              onClick={() => forwardAction(observe)}
            >
              {observe.label}
            </button>
          ) : null}
          {daoHeart ? (
            <button
              type="button"
              className="statusRootLawRouteButton statusRootLawRouteButton--daoHeart"
              data-route-kind={daoHeart.target.kind}
              data-disabled={daoDisabled ? 'true' : 'false'}
              disabled={daoDisabled}
              title={daoHeart.disabled ? daoHeart.disabledReason ?? daoHeart.detail : daoHeart.detail}
              onClick={() => forwardAction(daoHeart)}
            >
              {daoHeart.label}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
