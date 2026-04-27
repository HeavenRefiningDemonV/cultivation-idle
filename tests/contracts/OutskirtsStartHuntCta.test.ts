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
      intent: 'start-hunt',
      singleDominantCta: true,
      isPrimary: true,
    },
    onStartHunt: () => {
      invoked += 1;
    },
  });

  assert.equal(element?.props['data-testid'], 'outskirts-start-hunt-cta');
  assert.equal(element?.props['data-intent'], 'start-hunt');
  assert.equal(element?.props.className.includes('outskirtsStartHuntCta--ornate-gold'), true);
  const children = (element?.props as { children?: unknown[] } | undefined)?.children ?? [];
  const plateNode = children[1] as { props?: { children?: unknown } } | undefined;
  const plateChildren = (plateNode?.props?.children ?? []) as unknown[] | unknown;
  const flattened = Array.isArray(plateChildren) ? plateChildren : [plateChildren];
  const labelNode = flattened.find((node) => (node as { props?: { ['data-testid']?: string } })?.props?.['data-testid'] === 'outskirts-start-hunt-cta-label');
  assert.equal((labelNode as { props?: { ['data-testid']?: string } } | undefined)?.props?.['data-testid'], 'outskirts-start-hunt-cta-label');
  element?.props.onClick?.();
  assert.equal(invoked, 1);
});
