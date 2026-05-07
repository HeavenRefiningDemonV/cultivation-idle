import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

void test('Apothecary Exact action controller revalidates buys and brews through owning stores', () => {
  const source = readFileSync('src/features/apothecary/exact/useApothecaryExactActionController.ts', 'utf8');

  assert.equal(source.includes('shop.canBuy(shopId, stockId, qty)'), true);
  assert.equal(source.includes('shop.buy(shopId, stockId, qty)'), true);
  assert.equal(source.includes('useProfessionStore.getState().startAlchemy(recipeId, qty)'), true);
  assert.equal(source.includes('buildApothecaryExactSurfaceFromStores(args.cityId'), true);
  assert.equal(source.includes('buildApothecaryExactPackagePlan(freshSurface)'), true);
  assert.equal(source.includes('args.onOpenPouchModal()'), true);
  assert.equal(source.includes("intent: { gateTrialExactMode: 'live' }"), true);
});

void test('Apothecary Exact action controller avoids direct rewards, inventory mutation shortcuts, and invalid pouch slots', () => {
  const source = readFileSync('src/features/apothecary/exact/useApothecaryExactActionController.ts', 'utf8');

  for (const forbidden of [
    'RewardService',
    '.setState({ items',
    'addCurrency(',
    'spendCurrency(',
    'grantRewards',
    "'defense'",
    '"defense"',
    "'spirit'",
    '"spirit"',
  ]) {
    assert.equal(source.includes(forbidden), false, `controller must not contain ${forbidden}`);
  }

  assert.equal(source.includes("['healing', healing?.itemId ?? null]"), true);
  assert.equal(source.includes("['specialty', specialty?.itemId ?? null]"), true);
});
