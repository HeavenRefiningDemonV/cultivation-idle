import React from 'react';

export interface OutskirtsPageTitleProps {
  title: string;
}

export function OutskirtsPageTitle({ title }: OutskirtsPageTitleProps) {
  return React.createElement(
    'div',
    { className: 'outskirtsTopRegion__titleAnchor', 'data-testid': 'outskirts-page-title' },
    React.createElement('h1', null, title),
  );
}
