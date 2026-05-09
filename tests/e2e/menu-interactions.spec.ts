import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const evidenceDir = path.resolve('docs/release/menu-function-evidence');

const liveModules = [
  { label: 'Manual Pavilion', root: null },
  { label: 'Apothecary', root: 'apothecary-exact-screen-owner' },
  { label: 'Forge', root: 'forge-exact-screen-owner' },
  { label: 'Bounties', root: 'bounties-exact-screen-owner' },
  { label: 'Expeditions', root: 'expeditions-exact-screen-owner' },
  { label: 'Outskirts', root: 'outskirts-view-screen' },
  { label: 'Gate Trial', root: 'gate-trial-screen-owner' },
  { label: 'Ruins', root: 'ruins-view-screen' },
] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function collectConsoleFailures(page: Page): Promise<string[]> {
  const failures: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      failures.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    failures.push(error.message);
  });
  return failures;
}

async function completeFreshLife(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto('/');
  await page.getByRole('button', { name: /Select heaven path/i }).click();
  await expect(page.getByRole('heading', { name: /Choose Your Heart Law/i })).toBeVisible();

  await page.getByRole('group', { name: 'Heart Law choices' }).getByRole('button').first().click();
  await expect(page.getByRole('button', { name: /^Next$/ })).toBeEnabled();
  await page.getByRole('button', { name: /^Next$/ }).click();
  await expect(page.getByRole('heading', { name: /Choose Breath Focus/i })).toBeVisible();

  await page.getByRole('button', { name: /Balanced/i }).click();
  await page.getByRole('button', { name: /^Finish$/ }).click();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
  await expect(bottomTab(page, 'Cultivation')).toHaveAttribute('aria-current', 'page');
}

async function assertNoRawLiveLeaks(page: Page) {
  const visibleText = await page.locator('body').innerText();
  expect(visibleText).not.toMatch(/\b(?:city|trial|heart_law)_[a-z0-9_]+\b/i);
  expect(visibleText).not.toContain('[object Object]');
  expect(visibleText).not.toMatch(/\bundefined\b/i);
}

async function screenshotEvidence(page: Page, name: string) {
  mkdirSync(evidenceDir, { recursive: true });
  await page.screenshot({ path: path.join(evidenceDir, `${name}.png`), fullPage: true });
}

function bottomTab(page: Page, name: string) {
  return page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button', { name, exact: true });
}

async function dismissOnboardingIfPresent(page: Page) {
  const callout = page.getByTestId('onboarding-callout-card');
  try {
    await callout.waitFor({ state: 'visible', timeout: 750 });
  } catch {
    return;
  }

  await callout.getByRole('button').last().click();
  await expect(callout).toBeHidden();
}

async function openWorldTab(page: Page) {
  await bottomTab(page, 'World').click();
  await expect(page.getByRole('button', { name: /^Outskirts$/ })).toBeVisible();
  await dismissOnboardingIfPresent(page);
}

async function openWorldModule(page: Page, label: string) {
  await openWorldTab(page);
  await page.getByRole('button', { name: new RegExp(`^${escapeRegExp(label)}$`) }).click();
  await page.getByRole('button', { name: new RegExp(`^Open ${escapeRegExp(label)}$`) }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

async function closeWorldModuleWithEscape(page: Page, rootTestId?: string | null) {
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  if (rootTestId) {
    await expect(page.getByTestId(rootTestId)).toBeHidden();
  }
  await expect(bottomTab(page, 'World')).toHaveAttribute('aria-current', 'page');
}

test.describe('menu interaction audit', () => {
  test('fresh life wizard and every bottom tab render a reachable surface', async ({ page }) => {
    const consoleFailures = await collectConsoleFailures(page);
    await completeFreshLife(page);

    for (const tab of ['Status', 'Cultivation', 'World', 'Inventory', 'Techniques', 'Prestige', 'Settings']) {
      await bottomTab(page, tab).click();
      await expect(bottomTab(page, tab)).toHaveAttribute('aria-current', 'page');
      await assertNoRawLiveLeaks(page);
    }

    await expect(consoleFailures, consoleFailures.join('\n')).toEqual([]);
  });

  test('World map opens and closes every live module through the player route', async ({ page }) => {
    const consoleFailures = await collectConsoleFailures(page);
    await completeFreshLife(page);
    await openWorldTab(page);
    await screenshotEvidence(page, 'world-map');

    for (const module of liveModules) {
      await openWorldModule(page, module.label);

      if (module.root) {
        await expect(page.getByTestId(module.root)).toBeVisible();
      } else {
        await expect(page.getByText('Buy Manual').first()).toBeVisible();
      }

      if (module.label === 'Gate Trial') {
        await expect(page.getByTestId('gate-trial-screen-owner')).toHaveAttribute('data-mode', 'live');
        await expect(page.getByTestId('gate-trial-screen-owner')).toHaveAttribute('data-actions-enabled', 'true');
        await screenshotEvidence(page, 'gate-trial-live');
      }

      if (module.label === 'Ruins') {
        await screenshotEvidence(page, 'ruins-live');
      }

      await assertNoRawLiveLeaks(page);
      await closeWorldModuleWithEscape(page, module.root);
    }

    await expect(consoleFailures, consoleFailures.join('\n')).toEqual([]);
  });

  test('Ruins tactical support cells route to Bounties and Expeditions modules', async ({ page }) => {
    const consoleFailures = await collectConsoleFailures(page);
    await completeFreshLife(page);

    await openWorldModule(page, 'Ruins');
    await page.getByTestId('ruins-tactical-cell-bounty').click();
    await expect(page.getByTestId('bounties-exact-screen-owner')).toBeVisible();
    await expect(page.getByTestId('ruins-view-screen')).toBeHidden();
    await closeWorldModuleWithEscape(page, 'bounties-exact-screen-owner');

    await openWorldModule(page, 'Ruins');
    await page.getByTestId('ruins-tactical-cell-expedition').click();
    await expect(page.getByTestId('expeditions-exact-screen-owner')).toBeVisible();
    await expect(page.getByTestId('ruins-view-screen')).toBeHidden();
    await closeWorldModuleWithEscape(page, 'expeditions-exact-screen-owner');

    await expect(consoleFailures, consoleFailures.join('\n')).toEqual([]);
  });

  test('Settings toggles and destructive save action are guarded', async ({ page }) => {
    const consoleFailures = await collectConsoleFailures(page);
    await completeFreshLife(page);

    await bottomTab(page, 'Settings').click();
    await expect(page.getByRole('heading', { name: 'Gameplay & UI' })).toBeVisible();
    await screenshotEvidence(page, 'settings');

    const combatLogToggle = page.getByLabel('Show combat log');
    const before = await combatLogToggle.isChecked();
    await combatLogToggle.setChecked(!before);
    await expect(combatLogToggle).toBeChecked({ checked: !before });
    await combatLogToggle.setChecked(before);
    await expect(combatLogToggle).toBeChecked({ checked: before });

    await page.getByRole('button', { name: 'Run Validation' }).click();
    await expect(page.getByText(/Last run:/)).toBeVisible();

    await page.getByRole('button', { name: 'Delete Save & Hard Reset' }).click();
    await expect(page.getByRole('heading', { name: 'Delete All Save Data?' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Delete All Save Data?' })).toBeHidden();

    await expect(consoleFailures, consoleFailures.join('\n')).toEqual([]);
  });
});
