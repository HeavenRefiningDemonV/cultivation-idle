import React from 'react';
import type { RuinsScenicStageSurface } from '../types.js';

export function RuinsScenicStage({ scenic }: { scenic: RuinsScenicStageSurface }) {
  const plateStyle = scenic.activeScenePlateSrc != null
    ? { backgroundImage: `url("${scenic.activeScenePlateSrc}")` }
    : undefined;

  return React.createElement(
    'section',
    {
      className: 'ruinsScenicStage',
      'data-testid': 'ruins-exact-scenic-stage',
      'data-art-status': scenic.artStatus,
      'data-asset-kind': scenic.assetKind,
      'data-final-art-required': scenic.requiresFinalArtBinding ? 'true' : 'false',
      'data-approved-plate': scenic.useApprovedMockupPlate ? 'true' : 'false',
      role: 'img',
      'aria-label': scenic.plateAlt,
      'aria-description': scenic.environmentDescriptor,
    },
    React.createElement(
      'div',
      { className: 'ruinsScenicStage__frame', 'data-testid': 'ruins-exact-scenic-frame', 'aria-hidden': 'true' },
      React.createElement('div', { className: 'ruinsScenicStage__plate', 'data-testid': 'ruins-exact-scenic-plate', style: plateStyle }),
      React.createElement('span', { className: 'ruinsScenicStage__deferredUnderpaint' }),
      React.createElement('span', { className: 'ruinsScenicStage__mist ruinsScenicStage__mist--lower' }),
      React.createElement('span', { className: 'ruinsScenicStage__mist ruinsScenicStage__mist--upper' }),
      React.createElement('span', { className: 'ruinsScenicStage__edgeFade' }),
    ),
  );
}
