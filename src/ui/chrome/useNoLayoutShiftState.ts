import classNames from 'classnames';

export interface UseNoLayoutShiftStateOptions {
  selected?: boolean;
  active?: boolean;
  recommended?: boolean;
  warning?: boolean;
  disabled?: boolean;
  reserveBadgeSlot?: boolean;
  reserveIconSlot?: boolean;
  reserveActionSlot?: boolean;
}

export interface NoLayoutShiftStateResult {
  guardClassName: string;
  dataAttrs: Record<string, 'true' | 'false'>;
}

export function useNoLayoutShiftState(options: UseNoLayoutShiftStateOptions = {}): NoLayoutShiftStateResult {
  const {
    selected = false,
    active = false,
    recommended = false,
    warning = false,
    disabled = false,
    reserveBadgeSlot = false,
    reserveIconSlot = false,
    reserveActionSlot = false,
  } = options;

  return {
    guardClassName: classNames('uiNoShiftGuard', {
      uiNoShiftSelectionHost: selected || active || recommended || warning,
      uiNoShiftBadgeSlot: reserveBadgeSlot,
      uiNoShiftIconSlot: reserveIconSlot,
      uiNoShiftActionSlot: reserveActionSlot,
      uiNoShiftSelectableRow: selected || active,
    }),
    dataAttrs: {
      'data-ui-no-shift-selected': selected ? 'true' : 'false',
      'data-ui-no-shift-active': active ? 'true' : 'false',
      'data-ui-no-shift-recommended': recommended ? 'true' : 'false',
      'data-ui-no-shift-warning': warning ? 'true' : 'false',
      'data-ui-no-shift-disabled': disabled ? 'true' : 'false',
    },
  };
}
