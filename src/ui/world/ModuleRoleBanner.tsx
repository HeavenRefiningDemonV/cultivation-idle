import type { ModuleRoleBannerSurfaceV1, ModuleRoleRouteButton } from '../../systems/world/moduleRoleBannerSurface.js';
import './ModuleRoleBanner.scss';

interface ModuleRoleBannerProps {
  surface: ModuleRoleBannerSurfaceV1;
  className?: string;
  onRoute?: (route: ModuleRoleRouteButton) => void;
}

function fitLabel(state: ModuleRoleBannerSurfaceV1['currentBlockerFit']['state']): string {
  switch (state) {
    case 'primary':
      return 'Current role';
    case 'secondary':
      return 'Supporting role';
    case 'long_term':
      return 'City role';
    case 'irrelevant_now':
      return 'Normal role';
  }
}

export function ModuleRoleBanner({ surface, className, onRoute }: ModuleRoleBannerProps) {
  const route = surface.routeButtons[0] ?? null;
  const fit = surface.currentBlockerFit;
  const classes = [
    'moduleRoleBanner',
    `moduleRoleBanner--${surface.moduleKey}`,
    `moduleRoleBanner--fit-${fit.state}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <section className={classes} aria-label={`${surface.title} role banner`}>
      <div className="moduleRoleBanner__seal">
        <span className="moduleRoleBanner__eyebrow">{fitLabel(fit.state)}</span>
        <strong>{surface.title}</strong>
      </div>
      <div className="moduleRoleBanner__body">
        <p className="moduleRoleBanner__role">{surface.normalRole}</p>
        <p className="moduleRoleBanner__fit">{surface.negativeRelevanceCopy ?? fit.reason}</p>
        {surface.expectedPayoff ? (
          <p className="moduleRoleBanner__payoff">{surface.expectedPayoff.label}</p>
        ) : null}
      </div>
      <div className="moduleRoleBanner__tags" aria-label="Source and sink tags">
        {surface.sourceTags.slice(0, 2).map((tag) => <span key={`source-${tag}`}>{tag}</span>)}
        {surface.sinkTags.slice(0, 2).map((tag) => <span key={`sink-${tag}`}>{tag}</span>)}
      </div>
      {route ? (
        <button
          type="button"
          className="moduleRoleBanner__route uiNoShift"
          onClick={() => onRoute?.(route)}
          disabled={route.blocked}
          title={route.blockedReason ?? route.reason}
        >
          {route.actionLabel}
        </button>
      ) : null}
    </section>
  );
}
