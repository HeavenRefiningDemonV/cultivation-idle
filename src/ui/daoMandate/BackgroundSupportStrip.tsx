import classNames from 'classnames';

import type {
  DaoBackgroundPlanSurface,
  DaoMandateEffectiveMotionMode,
  DaoMandateGuidanceProfile,
  DaoMandateRoute,
} from '../../systems/ui/daoMandate/index.js';
import type { DaoMandateRouteActionHandler } from './daoMandateComponentTypes.js';
import { DaoMandateRouteButton } from './DaoMandateRouteButton.js';
import { getDaoMandateMotionClassName } from './daoMandateUiFormatters.js';
import './BackgroundSupportStrip.scss';

export interface BackgroundSupportStripProps {
  backgroundPlan: DaoBackgroundPlanSurface;
  profile?: DaoMandateGuidanceProfile;
  variant?: 'compact' | 'default' | 'full';
  onRouteAction?: DaoMandateRouteActionHandler;
  motionMode?: DaoMandateEffectiveMotionMode;
  className?: string;
}

type RouteGroup = 'active' | 'passive' | 'background' | 'unspecified';

const ROUTE_GROUPS: readonly RouteGroup[] = ['active', 'passive', 'background', 'unspecified'];

function groupRoutes(routes: DaoMandateRoute[]): Record<RouteGroup, DaoMandateRoute[]> {
  return {
    active: routes.filter((route) => route.activityMode === 'active'),
    passive: routes.filter((route) => route.activityMode === 'passive'),
    background: routes.filter((route) => route.activityMode === 'background'),
    unspecified: routes.filter((route) => !route.activityMode),
  };
}

function groupLabel(group: RouteGroup): string {
  switch (group) {
    case 'active':
      return 'Active';
    case 'passive':
      return 'Passive';
    case 'background':
      return 'Background';
    case 'unspecified':
      return 'Support';
  }
}

export function BackgroundSupportStrip({
  backgroundPlan,
  profile = 'elder',
  variant = 'default',
  onRouteAction,
  motionMode = 'medium',
  className,
}: BackgroundSupportStripProps) {
  const showDetail = profile !== 'sealed' && variant !== 'compact';
  const groupedRoutes = groupRoutes(backgroundPlan.routes);

  return (
    <section
      className={classNames(
        'daoBackgroundSupportStrip',
        `daoBackgroundSupportStrip--${variant}`,
        getDaoMandateMotionClassName(motionMode),
        className,
      )}
      data-dao-motion={motionMode}
      aria-label={backgroundPlan.adviceLabel}
    >
      <div className="daoBackgroundSupportStrip__copy">
        <span className="daoBackgroundSupportStrip__eyebrow">Background support</span>
        <strong>{backgroundPlan.adviceLabel}</strong>
        {showDetail ? <p>{backgroundPlan.adviceDetail}</p> : null}
        <div className="daoBackgroundSupportStrip__facts">
          {backgroundPlan.idleSlotCount !== null ? <span>Idle slots: {backgroundPlan.idleSlotCount}</span> : null}
          {showDetail && backgroundPlan.offlineProjectionLabel ? <span>{backgroundPlan.offlineProjectionLabel}</span> : null}
        </div>
      </div>
      {backgroundPlan.routes.length > 0 ? (
        <div className="daoBackgroundSupportStrip__routes">
          {ROUTE_GROUPS.map((group) => {
            const routes = groupedRoutes[group];
            if (routes.length === 0) return null;
            return (
              <div key={group} className="daoBackgroundSupportStrip__routeGroup">
                {variant === 'full' ? <span>{groupLabel(group)}</span> : null}
                {routes.map((route) => (
                  <DaoMandateRouteButton
                    key={route.id}
                    route={route}
                    onRouteAction={onRouteAction}
                    variant="inline"
                    size="compact"
                  />
                ))}
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
