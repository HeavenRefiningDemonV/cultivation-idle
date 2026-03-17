import assert from 'node:assert/strict';

export function expectCurrentlyBrokenContract(assertion: () => void, contractLabel: string): void {
  let threw = false;

  try {
    assertion();
  } catch {
    threw = true;
  }

  assert.equal(
    threw,
    true,
    `Expected this Phase 0 contract to be broken in current runtime: ${contractLabel}. If this starts passing, remove the expected-broken wrapper.`,
  );
}
