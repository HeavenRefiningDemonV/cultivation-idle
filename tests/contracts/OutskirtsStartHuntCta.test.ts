import assert from 'node:assert/strict';
import test from 'node:test';

import { OutskirtsStartHuntCta } from '../../src/features/world/outskirts/components/OutskirtsStartHuntCta.js';

void test('P8 CTA component forwards click to existing handler when enabled', () => {
  let invoked = 0;
  const element = OutskirtsStartHuntCta({
    cta: {
      label: 'Start Hunt',
      ariaLabel: 'Start Outskirts hunt',
      visible: true,
      enabled: true,
      isPrimary: true,
    },
    onStartHunt: () => {
      invoked += 1;
    },
  });

  assert.equal(element?.props['data-testid'], 'outskirts-start-hunt-cta');
  element?.props.onClick?.();
  assert.equal(invoked, 1);
});
