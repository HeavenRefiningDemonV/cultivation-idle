import type { ReactNode } from 'react';
import { GameIcon } from '../icons/index.js';
import './InkCombatShell.scss';

interface InkCombatShellProps {
  title: string;
  subtitle?: string;
  leftSidebar: ReactNode;
  stage: ReactNode;
  onClose?: () => void;
  className?: string;
  suppressHeader?: boolean;
  sidebarTop?: ReactNode;
  sidebarPosition?: 'left' | 'right';
}

export function InkCombatShell({
  title,
  subtitle,
  leftSidebar,
  stage,
  onClose,
  className,
  suppressHeader = false,
  sidebarTop,
  sidebarPosition = 'left',
}: InkCombatShellProps) {
  return (
    <div className={`ink-combat-shell${className ? ` ${className}` : ''}`}>
      <div className={`ink-combat-shell__body ${sidebarPosition === 'right' ? 'ink-combat-shell__body--sidebar-right' : ''}`.trim()}>
        <aside className="ink-combat-shell__sidebar">
          {!suppressHeader ? (
            <div className="ink-combat-shell__header">
              <div>
                <div className="ink-combat-shell__title">{title}</div>
                {subtitle ? <div className="ink-combat-shell__subtitle">{subtitle}</div> : null}
              </div>
              {onClose ? (
                <button type="button" className="ink-combat-shell__close" onClick={onClose} aria-label="Close">
                  <GameIcon icon="inkX" size={14} decorative />
                </button>
              ) : null}
            </div>
          ) : null}
          {sidebarTop ? <div className="ink-combat-shell__sidebar-top">{sidebarTop}</div> : null}
          {leftSidebar}
        </aside>
        <main className="ink-combat-shell__main">{stage}</main>
      </div>
    </div>
  );
}
