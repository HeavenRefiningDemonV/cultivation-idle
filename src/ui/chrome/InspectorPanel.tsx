import type { CSSProperties, ReactNode } from 'react';
import classNames from 'classnames';
import { InkPanel, type InkPanelVariant } from '../ink/InkPanel.js';

export interface InspectorPanelProps {
  variant?: InkPanelVariant;
  header?: ReactNode;
  watermark?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function InspectorPanel({
  variant = 'default',
  header,
  watermark = false,
  className,
  style,
  children,
}: InspectorPanelProps) {
  return (
    <InkPanel
      variant={variant}
      header={header}
      watermark={watermark}
      className={classNames('inspectorPanel', className)}
      style={style}
    >
      {children}
    </InkPanel>
  );
}
