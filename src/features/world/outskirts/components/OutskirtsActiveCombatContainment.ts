import React from 'react';

export function OutskirtsActiveCombatContainment(props: { children: React.ReactNode }) {
  return React.createElement(
    'section',
    {
      className: 'outskirtsActiveContainment',
      'data-testid': 'outskirts-active-contained',
      'aria-label': 'Outskirts active hunt containment',
    },
    props.children,
  );
}
