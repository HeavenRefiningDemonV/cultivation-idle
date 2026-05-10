import type { AriaRole, CSSProperties, ReactNode } from 'react';
import classNames from 'classnames';
import { GameIcon, type IconId } from '../icons/index.js';
import './BottomNavDock.scss';

export type BottomNavDockIndicator = 'none' | 'recommended' | 'attention';
export const BOTTOM_NAV_DOCK_INDICATOR_OPTIONS = ['none', 'recommended', 'attention'] as const satisfies readonly BottomNavDockIndicator[];

export type BottomNavDockHostAttrs = {
  id?: string;
  role?: AriaRole;
  style?: CSSProperties;
} & {
  [key in `aria-${string}`]?: string | number | boolean | undefined;
} & {
  [key in `data-${string}`]?: string | number | boolean | undefined;
};

export interface BottomNavDockItem {
  id: string;
  label: ReactNode;
  icon?: IconId;
  ariaLabel?: string;
  active: boolean;
  disabled?: boolean;
  indicator?: BottomNavDockIndicator;
  onSelect: () => void;
}

export interface BottomNavDockProps {
  items: BottomNavDockItem[];
  className?: string;
  itemClassName?: string;
  preserveLegacyHooks?: boolean;
  hostAttrs?: BottomNavDockHostAttrs;
}

export function BottomNavDock({ items, className, itemClassName, preserveLegacyHooks = false, hostAttrs }: BottomNavDockProps) {
  return (
    <nav
      className={classNames('bottomNavDock', { bottomTabBar: preserveLegacyHooks }, className)}
      aria-label="Primary navigation"
      {...hostAttrs}
    >
      <div className={classNames('bottomNavDock__inner', { bottomTabBarInner: preserveLegacyHooks })}>
        <div className={classNames('bottomNavDock__rail', { bottomTabBarList: preserveLegacyHooks })}>
          {items.map((item) => {
            const indicator = item.indicator ?? 'none';

            return (
              <button
                key={item.id}
                type="button"
                className={classNames(
                  'bottomNavDock__button',
                  {
                    'bottomNavDock__button--active': item.active,
                    [`bottomNavDock__button--indicator-${indicator}`]: indicator !== 'none',
                    bottomTabBarButton: preserveLegacyHooks,
                    'bottomTabBarButton--active': preserveLegacyHooks && item.active,
                  },
                  itemClassName,
                )}
                onClick={item.onSelect}
                aria-current={item.active ? 'page' : undefined}
                aria-label={item.ariaLabel}
                disabled={item.disabled}
              >
                {item.icon ? (
                  <span className="bottomNavDock__icon" aria-hidden="true">
                    <GameIcon icon={item.icon} size={20} decorative />
                  </span>
                ) : null}
                <span className="bottomNavDock__label">{item.label}</span>
                <span className="bottomNavDock__indicatorSlot" aria-hidden="true">
                  {indicator === 'none' ? null : <span className={classNames('bottomNavDock__indicator', `bottomNavDock__indicator--${indicator}`)} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
