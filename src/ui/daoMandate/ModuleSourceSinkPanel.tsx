import { useCallback } from 'react';
import classNames from 'classnames';

import {
  performDaoMandateRouteAction,
  type DaoMandateModuleSourceSinkProjection,
  type DaoMandateRoute,
} from '../../systems/ui/daoMandate/index.js';
import { useUIStore } from '../../stores/uiStore.js';
import { SourceRouteSlip } from './SourceRouteSlip.js';
import './ModuleSourceSinkPanel.scss';

export interface ModuleSourceSinkPanelProps {
  projection: DaoMandateModuleSourceSinkProjection | null | undefined;
  className?: string;
  title?: string;
}

export function ModuleSourceSinkPanel({
  projection,
  className,
  title,
}: ModuleSourceSinkPanelProps) {
  const addNotification = useUIStore((state) => state.addNotification);
  const handleRouteAction = useCallback((route: DaoMandateRoute) => {
    const result = performDaoMandateRouteAction(route);
    if (!result.performed) {
      addNotification('warning', result.reason ?? 'This route is blocked from the current screen.');
    }
  }, [addNotification]);

  if (!projection) return null;
  const { sourceSink } = projection;

  return (
    <section
      className={classNames('daoModuleSourceSinkPanel', className)}
      data-relation={sourceSink.relation}
      data-module-key={sourceSink.moduleKey}
    >
      <header className="daoModuleSourceSinkPanel__header">
        <span className="daoModuleSourceSinkPanel__relation">{sourceSink.relation}</span>
        <div>
          <h2>{title ?? sourceSink.headline}</h2>
          <p>{sourceSink.detail}</p>
        </div>
      </header>
      {sourceSink.entries.length > 0 ? (
        <SourceRouteSlip
          entries={sourceSink.entries}
          title={title ?? sourceSink.headline}
          profile={projection.profile}
          variant={projection.variant}
          motionMode={projection.motionMode}
          onRouteAction={handleRouteAction}
          className="daoModuleSourceSinkPanel__slip"
        />
      ) : sourceSink.impactLabel ? (
        <p className="daoModuleSourceSinkPanel__impact">{sourceSink.impactLabel}</p>
      ) : null}
    </section>
  );
}
