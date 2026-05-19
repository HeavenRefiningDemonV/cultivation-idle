import type { AriaRole, CSSProperties, ReactNode } from 'react';
import classNames from 'classnames';
import { FrameCard } from './FrameCard.js';
import { PlaqueHeader } from './PlaqueHeader.js';
import './InspectorPanel.scss';

export type InspectorPanelVariant = 'world' | 'module' | 'dense';
export type InspectorPanelDensity = 'compact' | 'default';
export type InspectorPanelTone = 'paper' | 'ink';
export type InspectorPanelEmptyZoneBehavior = 'reserve' | 'collapse';
export const INSPECTOR_PANEL_VARIANT_OPTIONS = ['world', 'module', 'dense'] as const satisfies readonly InspectorPanelVariant[];
export const INSPECTOR_PANEL_DENSITY_OPTIONS = ['compact', 'default'] as const satisfies readonly InspectorPanelDensity[];
export const INSPECTOR_PANEL_TONE_OPTIONS = ['paper', 'ink'] as const satisfies readonly InspectorPanelTone[];
export const INSPECTOR_PANEL_EMPTY_ZONE_BEHAVIOR_OPTIONS = ['reserve', 'collapse'] as const satisfies readonly InspectorPanelEmptyZoneBehavior[];

export type InspectorPanelHostAttrs = {
  id?: string;
  role?: AriaRole;
  style?: CSSProperties;
} & {
  [key in `aria-${string}`]?: string | number | boolean | undefined;
} & {
  [key in `data-${string}`]?: string | number | boolean | undefined;
};

export interface InspectorPanelProps {
  title?: ReactNode;
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  header?: ReactNode;
  statusArea?: ReactNode;
  recommendationArea?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  variant?: InspectorPanelVariant;
  density?: InspectorPanelDensity;
  tone?: InspectorPanelTone;
  sticky?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  emptyZoneBehavior?: InspectorPanelEmptyZoneBehavior;
  hostAttrs?: InspectorPanelHostAttrs;
  children: ReactNode;
}

function buildAutoHeader({
  title,
  eyebrow,
  subtitle,
  actions,
  density,
}: Pick<InspectorPanelProps, 'title' | 'eyebrow' | 'subtitle' | 'actions' | 'density'>) {
  if (!title && !eyebrow && !subtitle) return null;

  return (
    <PlaqueHeader
      title={title ?? ''}
      eyebrow={eyebrow}
      subtitle={subtitle}
      variant="inspector"
      emphasis="medium"
      density={density === 'compact' ? 'compact' : 'default'}
      actions={actions}
      className="inspectorPanel__headerShell"
    />
  );
}

function toFrameSurface(variant: InspectorPanelVariant): 'inspector' | 'dense' | 'surface' {
  if (variant === 'dense') return 'dense';
  if (variant === 'module') return 'surface';
  return 'inspector';
}

export function InspectorPanel({
  title,
  eyebrow,
  subtitle,
  header,
  statusArea,
  recommendationArea,
  actions,
  footer,
  variant = 'world',
  density = 'default',
  tone = 'paper',
  sticky = false,
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
  emptyZoneBehavior = 'reserve',
  hostAttrs,
  children,
}: InspectorPanelProps) {
  if (import.meta.env.DEV && header && (title !== undefined || eyebrow !== undefined || subtitle !== undefined || actions !== undefined)) {
    console.warn('[InspectorPanel] `header` takes precedence; auto-header props are ignored.');
  }
  const resolvedHeader = header ?? buildAutoHeader({ title, eyebrow, subtitle, actions, density });
  const reserveEmptyZones = emptyZoneBehavior === 'reserve';
  const statusEmpty = !statusArea;
  const recommendationEmpty = !recommendationArea;

  return (
    <aside
      className={classNames(
        'inspectorPanel',
        `inspectorPanel--${variant}`,
        `inspectorPanel--${density}`,
        `inspectorPanel--${tone}`,
        { 'inspectorPanel--sticky': sticky },
        { 'inspectorPanel--collapse-empty-zones': !reserveEmptyZones },
        className,
      )}
      aria-label="Inspector"
      {...hostAttrs}
    >
      <FrameCard
        frame="panel"
        surface={toFrameSurface(variant)}
        density={density === 'compact' ? 'dense' : 'default'}
        emphasis={variant === 'world' ? 'medium' : 'light'}
        header={resolvedHeader}
        className="inspectorPanel__frame"
        headerClassName={headerClassName}
      >
        {header && actions ? <div className="inspectorPanel__actions">{actions}</div> : null}

        <section
          className={classNames('inspectorPanel__statusArea', { 'is-empty': statusEmpty, 'is-collapsed': statusEmpty && !reserveEmptyZones })}
          aria-live="polite"
        >
          {statusArea}
        </section>

        <section
          className={classNames(
            'inspectorPanel__recommendationArea',
            { 'is-empty': recommendationEmpty, 'is-collapsed': recommendationEmpty && !reserveEmptyZones },
          )}
        >
          {recommendationArea}
        </section>

        <div className={classNames('inspectorPanel__body', bodyClassName)}>{children}</div>

        {footer ? <footer className={classNames('inspectorPanel__footer', footerClassName)}>{footer}</footer> : null}
      </FrameCard>
    </aside>
  );
}
