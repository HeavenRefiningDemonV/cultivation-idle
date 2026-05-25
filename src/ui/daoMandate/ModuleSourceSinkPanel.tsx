import classNames from 'classnames';

import {
  type DaoMandateModuleSourceSinkProjection,
} from '../../systems/ui/daoMandate/index.js';
import type { DaoMandateRouteActionHandler } from './daoMandateComponentTypes.js';
import { SourceRouteSlip } from './SourceRouteSlip.js';
import './ModuleSourceSinkPanel.scss';

export interface ModuleSourceSinkPanelProps {
  projection: DaoMandateModuleSourceSinkProjection | null | undefined;
  className?: string;
  title?: string;
  onRouteAction?: DaoMandateRouteActionHandler;
}

function relationLabel(relation: DaoMandateModuleSourceSinkProjection['sourceSink']['relation']): string {
  switch (relation) {
    case 'primary-evidence':
      return 'Relevant source';
    case 'supporting-source':
      return 'Supporting source';
    case 'blocked':
      return 'Locked source';
    case 'completed':
      return 'Proof sealed';
    case 'quiet':
      return 'Quiet';
  }
}

export function ModuleSourceSinkPanel({
  projection,
  className,
  title,
  onRouteAction,
}: ModuleSourceSinkPanelProps) {
  if (!projection) return null;
  const { sourceSink } = projection;
  if (sourceSink.relation === 'quiet') return null;
  const stampLabel = relationLabel(sourceSink.relation);

  return (
    <section
      className={classNames('daoModuleSourceSinkPanel', className)}
      data-relation={stampLabel}
      data-module-key={sourceSink.moduleKey}
    >
      <header className="daoModuleSourceSinkPanel__header">
        <span className="daoModuleSourceSinkPanel__relation">{stampLabel}</span>
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
          onRouteAction={onRouteAction}
          className="daoModuleSourceSinkPanel__slip"
        />
      ) : sourceSink.impactLabel ? (
        <p className="daoModuleSourceSinkPanel__impact">{sourceSink.impactLabel}</p>
      ) : null}
    </section>
  );
}
