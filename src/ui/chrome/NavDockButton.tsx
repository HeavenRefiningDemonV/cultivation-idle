import type { ReactNode } from 'react';
import classNames from 'classnames';
import './NavDockButton.scss';

export interface NavDockButtonProps {
  label: ReactNode;
  icon?: ReactNode;
  active?: boolean;
  disabled?: boolean;
  notificationMarked?: boolean;
  onClick?: () => void;
  className?: string;
  title?: string;
}

export function NavDockButton({
  label,
  icon,
  active = false,
  disabled = false,
  notificationMarked = false,
  onClick,
  className,
  title,
}: NavDockButtonProps) {
  return (
    <button
      type="button"
      className={classNames(
        'button-standard',
        'uiNoShift',
        'navDockButton',
        'bottomTabBarButton',
        {
          'navDockButton--active': active,
          'bottomTabBarButton--active': active,
          'navDockButton--disabled': disabled,
          'navDockButton--marked': notificationMarked,
        },
        className,
      )}
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? 'page' : undefined}
      title={title}
    >
      {icon ? <span className="navDockButton__icon">{icon}</span> : null}
      <span className="navDockButton__label">{label}</span>
      {notificationMarked ? <span className="navDockButton__mark" aria-hidden="true" /> : null}
    </button>
  );
}
