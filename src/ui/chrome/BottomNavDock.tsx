import type { ReactNode } from 'react';
import classNames from 'classnames';

export interface BottomNavDockProps {
  children: ReactNode;
  ariaLabel?: string;
  className?: string;
}

export function BottomNavDock({ children, ariaLabel = 'Bottom navigation', className }: BottomNavDockProps) {
  return (
    <nav className={classNames('bottomNavDock', className)} aria-label={ariaLabel}>
      {children}
    </nav>
  );
}
