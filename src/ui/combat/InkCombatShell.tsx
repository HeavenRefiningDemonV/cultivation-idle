import type { ReactNode } from 'react';
import './InkCombatShell.scss';

interface InkCombatShellProps {
  title: string;
  subtitle?: string;
  sidebar: ReactNode;
  main: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function InkCombatShell({ title, subtitle, sidebar, main, onClose, className }: InkCombatShellProps) {
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
                ✕
              </button>
            ) : null}
          </div>
          {sidebar}
        </aside>
        <main className="ink-combat-shell__main">{main}</main>
      </div>
    </div>
  );
}
