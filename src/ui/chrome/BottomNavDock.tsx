import type { ReactNode } from 'react';
import classNames from 'classnames';
import { FrameCard } from './FrameCard.js';
import { NavDockButton } from './NavDockButton.js';
import './BottomNavDock.scss';

export type BottomNavDockItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  notificationMarked?: boolean;
  title?: string;
};

export interface BottomNavDockProps {
  items: BottomNavDockItem[];
  activeId: string;
  onSelect: (id: string) => void;
  ariaLabel?: string;
  className?: string;
}

export function BottomNavDock({ items, activeId, onSelect, ariaLabel = 'Primary navigation', className }: BottomNavDockProps) {
  return (
    <nav className={classNames('bottomNavDock', 'bottomTabBar', className)} aria-label={ariaLabel}>
      <div className={classNames('bottomNavDock__inner', 'bottomTabBarInner')}>
        <FrameCard variant="dock" className="bottomNavDock__frame">
          <div className={classNames('bottomNavDock__list', 'bottomTabBarList')}>
            {items.map((item) => {
              const isActive = item.id === activeId;
              return (
                <NavDockButton
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  active={isActive}
                  disabled={item.disabled}
                  notificationMarked={item.notificationMarked}
                  onClick={item.disabled ? undefined : () => onSelect(item.id)}
                  title={item.title ?? item.label}
                />
              );
            })}
          </div>
        </FrameCard>
      </div>
    </nav>
  );
}
