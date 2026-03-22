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
}

export function InkCombatShell({ title, subtitle, leftSidebar, stage, onClose, className }: InkCombatShellProps) {
  return (
    <div className={`ink-combat-shell${className ? ` ${className}` : ''}`}>
      <div className="ink-combat-shell__body">
        <aside className="ink-combat-shell__sidebar">
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
          {leftSidebar}
        </aside>
        <main className="ink-combat-shell__main">{stage}</main>
      </div>
    </div>
  );
}
