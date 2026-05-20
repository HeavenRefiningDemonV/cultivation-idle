import React, { type CSSProperties } from 'react';
import { GameIcon, type IconId } from '../../../../ui/icons/index.js';
import type { OutskirtsInnerPalacePreview as OutskirtsInnerPalacePreviewModel, OutskirtsInnerPalacePreviewSlot } from '../types.js';

export interface OutskirtsInnerPalacePreviewProps {
  preview: OutskirtsInnerPalacePreviewModel;
  onOpenTechniques?: () => void;
}

const SLOT_ICON_BY_TYPE: Record<OutskirtsInnerPalacePreviewSlot['slotType'], IconId> = {
  active: 'jadeSword',
  passive: 'inkSwirl',
  ultimate: 'inkBurst',
};

const SLOT_POSITION_BY_KEY: Record<string, { x: string; y: string }> = {
  'active-0': { x: '50%', y: '12%' },
  'active-1': { x: '77%', y: '25%' },
  'active-2': { x: '74%', y: '72%' },
  'active-3': { x: '50%', y: '88%' },
  'passive-0': { x: '26%', y: '74%' },
  'passive-1': { x: '24%', y: '26%' },
  'passive-2': { x: '30%', y: '52%' },
  'ultimate-0': { x: '70%', y: '49%' },
};

function buildSlotAria(slot: OutskirtsInnerPalacePreviewSlot): string {
  if (slot.state === 'equipped' && slot.techniqueName) return `${slot.label}: ${slot.techniqueName}`;
  if (slot.state === 'empty') return `${slot.label}: Empty`;
  return `${slot.label}: Locked.${slot.unlockLabel ? ` ${slot.unlockLabel}` : ''}`;
}

export function OutskirtsInnerPalacePreview({ preview, onOpenTechniques }: OutskirtsInnerPalacePreviewProps) {
  if (!preview.visible) return null;

  return React.createElement(
    'section',
    { className: 'outskirtsInnerPalacePreview', 'data-testid': 'outskirts-inner-palace-preview' },
    React.createElement(
      'div',
      { className: 'outskirtsInnerPalacePreview__header' },
      React.createElement(
        'div',
        { className: 'outskirtsInnerPalacePreview__headerCopy' },
        React.createElement('h4', { className: 'outskirtsInnerPalacePreview__title' }, preview.title),
        React.createElement('p', { className: 'outskirtsInnerPalacePreview__subtitle' }, preview.subtitle),
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          className: 'outskirtsInnerPalacePreview__manage',
          onClick: onOpenTechniques,
          disabled: !onOpenTechniques,
          'data-testid': 'outskirts-inner-palace-manage',
          'aria-label': 'Open techniques',
        },
        preview.manageLabel,
      ),
    ),
    React.createElement(
      'button',
      {
        type: 'button',
        className: 'outskirtsInnerPalacePreview__stage',
        onClick: onOpenTechniques,
        disabled: !onOpenTechniques,
        'data-testid': 'outskirts-inner-palace-stage',
        'aria-label': 'Open Inner Palace techniques preview',
      },
      React.createElement('span', { className: 'outskirtsInnerPalacePreview__orbit outskirtsInnerPalacePreview__orbit--outer', 'aria-hidden': 'true' }),
      React.createElement('span', { className: 'outskirtsInnerPalacePreview__orbit outskirtsInnerPalacePreview__orbit--inner', 'aria-hidden': 'true' }),
      React.createElement('span', { className: 'outskirtsInnerPalacePreview__core', 'aria-hidden': 'true' }),
      ...preview.slots.map((slot) => {
        const position = SLOT_POSITION_BY_KEY[slot.key] ?? { x: '50%', y: '50%' };
        const slotGlyph = slot.state === 'locked' ? 'inkLock' : SLOT_ICON_BY_TYPE[slot.slotType];
        const slotAria = buildSlotAria(slot);
        const mark = slot.state === 'equipped' && slot.techniqueName ? slot.techniqueName[0]?.toUpperCase() ?? '•' : slot.state === 'empty' ? '+' : '·';
        return React.createElement(
          'span',
          {
            key: slot.key,
            className: `outskirtsInnerPalacePreview__slot outskirtsInnerPalacePreview__slot--${slot.state}`,
            style: { '--slot-x': position.x, '--slot-y': position.y } as CSSProperties,
            role: 'img',
            'aria-label': slotAria,
            title: slotAria,
            'data-slot-type': slot.slotType,
            'data-slot-state': slot.state,
          },
          React.createElement('span', { className: 'outskirtsInnerPalacePreview__slotGlyph', 'aria-hidden': 'true' }, React.createElement(GameIcon, { icon: slotGlyph, size: 12, decorative: true })),
          React.createElement('span', { className: 'outskirtsInnerPalacePreview__slotMark', 'aria-hidden': 'true' }, mark),
        );
      }),
    ),
    React.createElement(
      'div',
      { className: 'outskirtsInnerPalacePreview__footer' },
      React.createElement('span', { className: 'outskirtsInnerPalacePreview__footerLine' }, preview.footerLine),
      preview.emptyUnlockedSlots > 0
        ? React.createElement(
          'span',
          { className: 'outskirtsInnerPalacePreview__warning', 'data-testid': 'outskirts-inner-palace-empty-slots' },
          `${preview.emptyUnlockedSlots} slot${preview.emptyUnlockedSlots === 1 ? '' : 's'} empty`,
        )
        : null,
    ),
  );
}
