import classNames from 'classnames';
import type { CSSProperties } from 'react';

export type ReservedBadgeSpacePreset =
  | 'chip'
  | 'compactChip'
  | 'tabButton'
  | 'rowEndBadge'
  | 'cardCornerBadge'
  | 'spineBadge'
  | 'slotBadge';

export interface ReservedBadgeSpaceStyle extends CSSProperties {
  '--ui-reserved-badge-inline-size': string;
  '--ui-reserved-badge-block-size'?: string;
  '--ui-reserved-badge-gap'?: string;
}

const RESERVED_BADGE_SPACE_PRESETS: Record<ReservedBadgeSpacePreset, ReservedBadgeSpaceStyle> = {
  chip: {
    '--ui-reserved-badge-inline-size': 'var(--ui-reserved-badge-inline-size-chip, 3.5rem)',
    '--ui-reserved-badge-block-size': 'var(--ui-reserved-badge-block-size-chip, 1.25rem)',
    '--ui-reserved-badge-gap': '0.375rem',
  },
  compactChip: {
    '--ui-reserved-badge-inline-size': 'var(--ui-reserved-badge-inline-size-compact-chip, 2.6rem)',
    '--ui-reserved-badge-block-size': 'var(--ui-reserved-badge-block-size-chip, 1.25rem)',
    '--ui-reserved-badge-gap': '0.25rem',
  },
  tabButton: {
    '--ui-reserved-badge-inline-size': 'var(--ui-reserved-badge-inline-size-tab-button, 3rem)',
    '--ui-reserved-badge-block-size': 'var(--ui-reserved-badge-block-size-tab-button, 1.1rem)',
    '--ui-reserved-badge-gap': '0.35rem',
  },
  rowEndBadge: {
    '--ui-reserved-badge-inline-size': 'var(--ui-reserved-badge-inline-size-row-end, 3rem)',
    '--ui-reserved-badge-block-size': 'var(--ui-reserved-badge-block-size-row-end, 1.2rem)',
    '--ui-reserved-badge-gap': '0.4rem',
  },
  cardCornerBadge: {
    '--ui-reserved-badge-inline-size': 'var(--ui-reserved-badge-inline-size-card-corner, 2.8rem)',
    '--ui-reserved-badge-block-size': 'var(--ui-reserved-badge-block-size-card-corner, 1.2rem)',
    '--ui-reserved-badge-gap': '0.4rem',
  },
  spineBadge: {
    '--ui-reserved-badge-inline-size': 'var(--ui-reserved-badge-inline-size-spine-badge, 3.25rem)',
    '--ui-reserved-badge-block-size': 'var(--ui-reserved-badge-block-size-spine-badge, 1.2rem)',
    '--ui-reserved-badge-gap': '0.4rem',
  },
  slotBadge: {
    '--ui-reserved-badge-inline-size': 'var(--ui-reserved-badge-inline-size-slot-badge, 2.7rem)',
    '--ui-reserved-badge-block-size': 'var(--ui-reserved-badge-block-size-slot-badge, 1.1rem)',
    '--ui-reserved-badge-gap': '0.35rem',
  },
};

export function getReservedBadgeSpaceStyle(preset: ReservedBadgeSpacePreset): ReservedBadgeSpaceStyle {
  return RESERVED_BADGE_SPACE_PRESETS[preset];
}

export function buildStableInteractiveClassName(className?: string, interactive = false): string {
  return classNames(className, { uiNoShift: interactive });
}

export function getReservedBadgePresetMap() {
  return RESERVED_BADGE_SPACE_PRESETS;
}
