import type { ReactNode } from 'react';
import classNames from 'classnames';

export interface SelectionHaloProps {
  active?: boolean;
  children?: ReactNode;
  className?: string;
}

/**
 * Semantic selected-state helper with zero layout footprint intent.
 * B.1 does not add visual FX treatment; later packets own style convergence.
 */
export function SelectionHalo({ active = false, children, className }: SelectionHaloProps) {
  return <span className={classNames('selectionHalo', { 'selectionHalo--active': active }, className)}>{children}</span>;
}
