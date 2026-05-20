import React from 'react';
import type { OutskirtsEncounterStrip } from '../types.js';
import { OUTSKIRTS_ASSETS } from '../outskirtsAssetRegistry.js';

export interface OutskirtsEncounterProgressStripProps {
  strip: OutskirtsEncounterStrip;
  onPreviewPrevious?: () => void;
  onPreviewNext?: () => void;
  onSelectEncounter?: (encounterId: string) => void;
}

export function OutskirtsEncounterProgressStrip({ strip, onPreviewPrevious, onPreviewNext, onSelectEncounter }: OutskirtsEncounterProgressStripProps) {
  return React.createElement(
    'section',
    {
      className: `outskirtsEncounterProgressStrip outskirtsEncounterProgressStrip--${strip.mode}`,
      'data-testid': 'outskirts-exact-encounter-strip',
      'data-legacy-testid': 'outskirts-encounter-progress-strip',
      'data-strip-mode': strip.mode,
      'aria-label': strip.ariaLabel,
    },
    strip.lane.showConnector
      ? React.createElement('span', { className: `outskirtsEncounterProgressStrip__lane outskirtsEncounterProgressStrip__lane--${strip.lane.connectorVariant ?? 'brush'}`, 'aria-hidden': 'true' })
      : null,
    React.createElement(
      'button',
      {
        type: 'button',
        className: `outskirtsEncounterProgressStrip__arrow outskirtsEncounterProgressStrip__arrow--left outskirtsEncounterProgressStrip__arrow--${strip.leftArrow.ornamentVariant ?? 'parchment'}`,
        'data-testid': 'outskirts-exact-encounter-strip-left-arrow',
        disabled: !strip.leftArrow.enabled,
        'aria-label': strip.leftArrow.ariaLabel,
        'aria-hidden': strip.leftArrow.visible ? undefined : 'true',
        onClick: strip.leftArrow.enabled ? onPreviewPrevious : undefined,
      },
      React.createElement('span', { className: 'outskirtsEncounterProgressStrip__arrowGlyph', 'aria-hidden': 'true' }, '‹'),
    ),
    React.createElement(
      'ol',
      { className: 'outskirtsEncounterProgressStrip__nodes', 'aria-hidden': 'false', style: { '--outskirts-strip-node-count': strip.nodes.length } as React.CSSProperties },
      ...strip.nodes.map((node) => React.createElement(
        'li',
        {
          key: node.id,
          className: `outskirtsEncounterProgressStrip__node outskirtsEncounterProgressStrip__node--${node.state}${node.isSelected ? ' outskirtsEncounterProgressStrip__node--selected' : ''}`,
          'data-testid': 'outskirts-exact-encounter-strip-node',
          'data-node-id': node.id,
          'data-state': node.state,
          'data-selected': node.isSelected ? '1' : '0',
        },
        React.createElement(
          'button',
          {
            type: 'button',
            className: `outskirtsEncounterProgressStrip__thumb outskirtsEncounterProgressStrip__thumb--${node.state} outskirtsEncounterProgressStrip__thumb--${node.medallionVariant ?? 'quiet-field'}`,
            'data-testid': node.state === 'current'
              ? 'outskirts-exact-encounter-strip-node-current'
              : node.state === 'completed'
                ? 'outskirts-exact-encounter-strip-node-completed'
                : 'outskirts-exact-encounter-strip-node-future',
            disabled: strip.mode === 'active-chain' || !node.isClickable,
            'aria-label': node.ariaLabel,
            'aria-current': node.isSelected ? 'true' : undefined,
            onClick: strip.mode !== 'active-chain' && node.isClickable ? () => onSelectEncounter?.(node.id) : undefined,
            style: node.state === 'completed' && node.imageSrc ? { backgroundImage: `url('${node.imageSrc}')`, backgroundPosition: node.imagePosition ?? '50% 72%' } : undefined,
          },
          node.state === 'current'
            ? React.createElement('img', { src: node.imageSrc ?? OUTSKIRTS_ASSETS.stripArt.wolfEnemy, alt: '', className: 'outskirtsEncounterProgressStrip__portrait', loading: 'eager', 'aria-hidden': 'true' })
            : null,
          node.state === 'future'
            ? React.createElement(
                React.Fragment,
                null,
                React.createElement('span', {
                  className: 'outskirtsEncounterProgressStrip__futureBackdrop',
                  style: node.imageSrc ? { backgroundImage: `url('${node.imageSrc}')`, backgroundPosition: node.imagePosition ?? '75% 72%' } : undefined,
                  'aria-hidden': 'true',
                }),
                node.silhouetteImageSrc
                  ? React.createElement('img', { src: node.silhouetteImageSrc ?? OUTSKIRTS_ASSETS.stripArt.slimeEnemy, alt: '', className: 'outskirtsEncounterProgressStrip__silhouette', loading: 'eager', 'aria-hidden': 'true' })
                  : React.createElement('span', { className: 'outskirtsEncounterProgressStrip__unknownMark', 'aria-hidden': 'true' }, '?'),
              )
            : null,
          node.completionMark
            ? React.createElement('span', { className: 'outskirtsEncounterProgressStrip__completeMark', 'aria-hidden': 'true' })
            : null,
        ),
        React.createElement(
          'div',
          { className: 'outskirtsEncounterProgressStrip__text' },
          React.createElement('span', { className: 'outskirtsEncounterProgressStrip__label' }, node.label),
          React.createElement(
            'span',
            { className: 'outskirtsEncounterProgressStrip__level' },
            node.levelLabel,
          ),
        ),
      )),
    ),
    React.createElement(
      'button',
      {
        type: 'button',
        className: `outskirtsEncounterProgressStrip__arrow outskirtsEncounterProgressStrip__arrow--right outskirtsEncounterProgressStrip__arrow--${strip.rightArrow.ornamentVariant ?? 'parchment'}`,
        'data-testid': 'outskirts-exact-encounter-strip-right-arrow',
        disabled: !strip.rightArrow.enabled,
        'aria-label': strip.rightArrow.ariaLabel,
        'aria-hidden': strip.rightArrow.visible ? undefined : 'true',
        onClick: strip.rightArrow.enabled ? onPreviewNext : undefined,
      },
      React.createElement('span', { className: 'outskirtsEncounterProgressStrip__arrowGlyph', 'aria-hidden': 'true' }, '›'),
    ),
  );
}
