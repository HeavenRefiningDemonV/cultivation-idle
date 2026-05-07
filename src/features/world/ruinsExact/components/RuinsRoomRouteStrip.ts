import React from 'react';
import type { RuinsRoomRouteSurface } from '../types.js';

const routeIconClass = (iconKey: string): string =>
  `ruinsRoomRouteStrip__icon ruinsRoomRouteStrip__icon--${iconKey}`;

export function RuinsRoomRouteStrip({ route }: { route: RuinsRoomRouteSurface }) {
  return React.createElement('section', { className: 'ruinsRoomRouteStrip', 'data-testid': 'ruins-exact-room-route-strip', 'aria-label': 'Hollow Log Den room route', 'data-route-mode': route.mode },
    React.createElement('header', { className: 'ruinsRoomRouteStrip__heading' },
      React.createElement('h3', { className: 'ruinsRoomRouteStrip__titlePlate', 'data-testid': 'ruins-route-title' }, React.createElement('span', { className: 'ruinsRoomRouteStrip__title' }, route.title)),
      React.createElement('span', { className: 'ruinsRoomRouteStrip__chip', 'data-testid': 'ruins-route-anchor-chip' }, route.chip),
    ),
    React.createElement('div', { className: 'ruinsRoomRouteStrip__lane', 'data-testid': 'ruins-route-connector-lane', 'aria-hidden': 'true' }, React.createElement('span', { className: 'ruinsRoomRouteStrip__laneRule' })),
    React.createElement('ol', { className: 'ruinsRoomRouteStrip__nodes', 'data-testid': 'ruins-route-node-list' }, ...route.nodes.map((node, index) => React.createElement('li', { key: node.id, className: `ruinsRoomRouteStrip__node ruinsRoomRouteStrip__node--${node.state}`, 'data-testid': node.state === 'current' ? 'ruins-route-node-current' : 'ruins-route-node', 'data-node-id': node.id, 'data-state': node.state, 'data-anchor': node.isAnchor ? 'true' : 'false', 'data-current': route.currentNodeId === node.id ? 'true' : 'false', 'aria-label': node.ariaLabel ?? `${node.label} ${node.sublabel}` },
      route.currentNodeId === node.id ? React.createElement('span', { className: 'ruinsRoomRouteStrip__currentPointer', 'aria-hidden': 'true' }) : null,
      React.createElement('span', { className: `ruinsRoomRouteStrip__medallion ruinsRoomRouteStrip__medallion--${node.medallionVariant}` },
        node.state === 'completed'
          ? React.createElement('span', { className: 'ruinsRoomRouteStrip__completeMark', 'aria-hidden': 'true' })
          : React.createElement('span', { className: routeIconClass(node.iconKey), 'aria-hidden': 'true' }),
      ),
      index < route.nodes.length - 1 ? React.createElement('span', { className: 'ruinsRoomRouteStrip__laneDiamond', 'aria-hidden': 'true' }) : null,
      React.createElement('span', { className: 'ruinsRoomRouteStrip__text' }, React.createElement('span', { className: 'ruinsRoomRouteStrip__label' }, node.label), React.createElement('span', { className: 'ruinsRoomRouteStrip__sublabel' }, node.sublabel)),
    ))),
  );
}
