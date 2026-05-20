import React from 'react';
import type {
  CombatAftermathDeltaSurface,
  CombatAftermathRouteSurface,
  CombatAftermathSurfaceV1,
} from './types.js';

export interface CombatAftermathCardProps {
  surface: CombatAftermathSurfaceV1;
  compact?: boolean;
  onRoute?: (route: CombatAftermathRouteSurface) => void;
}

function DeltaSlip({ delta }: { delta: CombatAftermathDeltaSurface }) {
  return (
    <div className="combatAftermathCard__deltaSlip" data-confidence={delta.confidence}>
      <span className="combatAftermathCard__deltaTitle">{delta.title}</span>
      <span className="combatAftermathCard__deltaValue">
        {delta.deltaLabel ?? delta.afterLabel ?? delta.beforeLabel ?? delta.confidence}
      </span>
      <span className="combatAftermathCard__deltaExplanation">{delta.explanation}</span>
    </div>
  );
}

function RouteButton(props: {
  route: CombatAftermathRouteSurface;
  primary?: boolean;
  onRoute?: (route: CombatAftermathRouteSurface) => void;
}) {
  const { route, primary = false, onRoute } = props;
  return (
    <button
      type="button"
      className={primary ? 'combatAftermathCard__route combatAftermathCard__route--primary' : 'combatAftermathCard__route'}
      disabled={!route.enabled}
      data-route-id={route.id}
      data-route-source={route.source}
      aria-label={route.disabledReason ? `${route.label}: ${route.disabledReason}` : route.label}
      onClick={() => {
        if (route.enabled) onRoute?.(route);
      }}
    >
      <span>{route.label}</span>
      <small>{route.enabled ? route.detail : route.disabledReason ?? route.detail}</small>
    </button>
  );
}

export function CombatAftermathCard({ surface, compact = false, onRoute }: CombatAftermathCardProps) {
  const visibleGroups = surface.spoilsGroups.filter((group) => !group.empty);
  const deltas = [surface.readinessDelta, surface.economyDelta, surface.doctrineDelta].filter(
    (delta): delta is CombatAftermathDeltaSurface => Boolean(delta),
  );

  return (
    <section
      className={[
        'combatAftermathCard',
        `combatAftermathCard--${surface.context.kind}`,
        `combatAftermathCard--${surface.outcome.tone}`,
        compact ? 'combatAftermathCard--compact' : '',
      ].filter(Boolean).join(' ')}
      data-testid="combat-aftermath-card"
      data-context-kind={surface.context.kind}
      data-outcome-kind={surface.outcome.kind}
      aria-label={`${surface.outcome.title} ${surface.outcome.gradeLabel}`}
    >
      <header className="combatAftermathCard__header">
        <div>
          <span className="combatAftermathCard__eyebrow">{surface.outcome.gradeLabel}</span>
          <h3 className="combatAftermathCard__title">{surface.outcome.title}</h3>
          <p className="combatAftermathCard__subtitle">{surface.outcome.subtitle}</p>
        </div>
        <span className="combatAftermathCard__seal" aria-hidden="true" />
      </header>

      {visibleGroups.length > 0 ? (
        <div className="combatAftermathCard__spoils" data-testid="combat-aftermath-spoils">
          {visibleGroups.map((group) => (
            <section key={group.id} className={`combatAftermathCard__group combatAftermathCard__group--${group.tone}`}>
              <div className="combatAftermathCard__groupHeader">
                <strong>{group.title}</strong>
                <span>{group.summary}</span>
              </div>
              <ul>
                {group.lines.slice(0, compact ? 2 : 4).map((line) => (
                  <li key={line.id}>
                    <span>{line.label}</span>
                    <strong>{line.value}</strong>
                    {line.detail ? <small>{line.detail}</small> : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}

      {deltas.length > 0 ? (
        <div className="combatAftermathCard__deltas">
          {deltas.map((delta) => <DeltaSlip key={`${delta.title}:${delta.deltaLabel ?? delta.explanation}`} delta={delta} />)}
        </div>
      ) : null}

      {surface.diagnosis ? (
        <section className="combatAftermathCard__diagnosis" data-testid="combat-aftermath-diagnosis">
          <span>{surface.diagnosis.label}</span>
          <p>{surface.diagnosis.explanation}</p>
          <strong>{surface.diagnosis.topFixLabel}</strong>
        </section>
      ) : null}

      {surface.failureReflection ? (
        <section className="combatAftermathCard__reflection" data-testid="combat-aftermath-inner-demon">
          <span>{surface.failureReflection.title}</span>
          <p>{surface.failureReflection.innerDemonLine}</p>
          <strong>{surface.failureReflection.correctiveRouteLabel}</strong>
          <small>{surface.failureReflection.correctiveRouteReason}</small>
        </section>
      ) : null}

      <footer className="combatAftermathCard__footer">
        <p className="combatAftermathCard__memoryLine">{surface.memoryLine}</p>
        <div className="combatAftermathCard__routes">
          {surface.primaryRoute ? <RouteButton route={surface.primaryRoute} primary onRoute={onRoute} /> : null}
          {!compact ? surface.secondaryRoutes.slice(0, 2).map((route) => (
            <RouteButton key={route.id} route={route} onRoute={onRoute} />
          )) : null}
        </div>
      </footer>
    </section>
  );
}
