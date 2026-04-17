import React from 'react';

export function OutskirtsTopTitle(props: { title: string }) {
  return React.createElement(
    'header',
    { className: 'outskirtsExactTop__titleWrap', 'data-testid': 'outskirts-top-title' },
    React.createElement('h1', { className: 'outskirtsExactTop__title' }, props.title),
  );
}
