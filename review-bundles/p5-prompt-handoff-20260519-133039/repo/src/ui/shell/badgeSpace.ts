import type { CSSProperties } from 'react';

export type BadgeSlotPreset = 'cardCorner' | 'headerTrailing' | 'rowEnd' | 'inlineEnd' | 'moduleMeta';

export interface BadgeSlotStyle extends CSSProperties {
  '--badge-slot-inline-size': string;
  '--badge-slot-block-size': string;
}

export const BADGE_SLOT_PRESET_MAP: Record<BadgeSlotPreset, BadgeSlotStyle> = {
  cardCorner: {
    '--badge-slot-inline-size': 'var(--ui-reserved-badge-inline-size-card-corner, 2.8rem)',
    '--badge-slot-block-size': 'var(--ui-reserved-badge-block-size-card-corner, 1.2rem)',
    position: 'absolute',
    top: '10px',
    right: '12px',
    zIndex: 2,
  },
  headerTrailing: {
    '--badge-slot-inline-size': 'var(--ui-reserved-badge-inline-size-chip, 3.5rem)',
    '--badge-slot-block-size': 'var(--ui-reserved-badge-block-size-chip, 1.25rem)',
  },
  rowEnd: {
    '--badge-slot-inline-size': 'var(--ui-reserved-badge-inline-size-row-end, 3rem)',
    '--badge-slot-block-size': 'var(--ui-reserved-badge-block-size-row-end, 1.2rem)',
  },
  inlineEnd: {
    '--badge-slot-inline-size': 'var(--ui-reserved-badge-inline-size-compact-chip, 2.6rem)',
    '--badge-slot-block-size': 'var(--ui-reserved-badge-block-size-chip, 1.25rem)',
  },
  moduleMeta: {
    '--badge-slot-inline-size': 'var(--ui-reserved-badge-inline-size-spine-badge, 3.25rem)',
    '--badge-slot-block-size': 'var(--ui-reserved-badge-block-size-spine-badge, 1.2rem)',
  },
};

export const BADGE_SLOT_GAP_MAP: Record<BadgeSlotPreset, string> = {
  cardCorner: '0.4rem',
  headerTrailing: '0.375rem',
  rowEnd: '0.4rem',
  inlineEnd: '0.25rem',
  moduleMeta: '0.4rem',
};

export function getBadgeSlotStyle(preset: BadgeSlotPreset): BadgeSlotStyle {
  return BADGE_SLOT_PRESET_MAP[preset];
}

export function getBadgeSlotPresetMap() {
  return BADGE_SLOT_PRESET_MAP;
}

export function getBadgeSlotGap(preset: BadgeSlotPreset): string {
  return BADGE_SLOT_GAP_MAP[preset];
}
