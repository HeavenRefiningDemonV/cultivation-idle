import React from 'react';

export interface OutskirtsActiveContainmentProps {
  children: React.ReactNode;
}

export function OutskirtsActiveContainment({ children }: OutskirtsActiveContainmentProps) {
  return React.createElement(
    'section',
    { className: 'outskirtsActiveContainment', 'data-testid': 'outskirts-view-active-contained' },
    React.createElement(
      'header',
      { className: 'outskirtsActiveContainment__header' },
      React.createElement('h2', { className: 'outskirtsActiveContainment__title' }, 'Hunt in Progress'),
      React.createElement('p', { className: 'outskirtsActiveContainment__subtitle' }, 'A run is already active in this Outskirts lane.'),
    ),
    React.createElement('div', { className: 'outskirtsActiveContainment__body' }, children),
  );
}
