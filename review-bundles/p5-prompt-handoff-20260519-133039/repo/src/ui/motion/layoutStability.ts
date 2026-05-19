import classNames from 'classnames';
import type { CSSProperties } from 'react';
import { getBadgeSlotGap, getBadgeSlotStyle, type BadgeSlotPreset } from '../shell/badgeSpace.js';

export type ReservedBadgeSpacePreset =
  | 'chip'
  | 'compactChip'
  | 'tabButton'
  | 'rowEndBadge'
  | 'cardCornerBadge'
  | 'spineBadge'
  | 'slotBadge'
  | 'headerTrailing'
  | 'rowEnd'
  | 'inlineEnd'
  | 'cardCorner'
  | 'moduleMeta';

export interface ReservedBadgeSpaceStyle extends CSSProperties {
  '--ui-reserved-badge-inline-size': string;
  '--ui-reserved-badge-block-size'?: string;
  '--ui-reserved-badge-gap'?: string;
}

const LEGACY_BADGE_PRESET_MAP: Partial<Record<ReservedBadgeSpacePreset, ReservedBadgeSpaceStyle>> = {
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

function mapToSemanticPreset(preset: ReservedBadgeSpacePreset): BadgeSlotPreset | null {
  switch (preset) {
    case 'headerTrailing':
      return 'headerTrailing';
    case 'rowEnd':
    case 'rowEndBadge':
      return 'rowEnd';
    case 'inlineEnd':
    case 'compactChip':
    case 'slotBadge':
      return 'inlineEnd';
    case 'cardCorner':
    case 'cardCornerBadge':
      return 'cardCorner';
    case 'moduleMeta':
    case 'spineBadge':
      return 'moduleMeta';
    default:
      return null;
  }
}

export function getReservedBadgeSpaceStyle(preset: ReservedBadgeSpacePreset): ReservedBadgeSpaceStyle {
  const semanticPreset = mapToSemanticPreset(preset);
  if (semanticPreset) {
    const semanticStyle = getBadgeSlotStyle(semanticPreset);
    return {
      '--ui-reserved-badge-inline-size': semanticStyle['--badge-slot-inline-size'],
      '--ui-reserved-badge-block-size': semanticStyle['--badge-slot-block-size'],
      '--ui-reserved-badge-gap': getBadgeSlotGap(semanticPreset),
    };
  }
  const fallback = LEGACY_BADGE_PRESET_MAP[preset];
  if (!fallback) {
    throw new Error(`Unknown reserved badge preset: ${preset}`);
  }
  return fallback;
}

export function buildStableInteractiveClassName(className?: string, interactive = false): string {
  return classNames(className, { uiNoShift: interactive });
}

export function getReservedBadgePresetMap() {
  return LEGACY_BADGE_PRESET_MAP;
}
