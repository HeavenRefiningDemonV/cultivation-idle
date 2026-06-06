import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const artifactRoot = path.resolve('artifacts/mp1/browser');
const screenshotDir = path.join(artifactRoot, 'screenshots');
const domSummaryDir = path.join(artifactRoot, 'dom-summaries');
const consoleLogDir = path.join(artifactRoot, 'console-logs');

function ensureArtifactDirs() {
  mkdirSync(screenshotDir, { recursive: true });
  mkdirSync(domSummaryDir, { recursive: true });
  mkdirSync(consoleLogDir, { recursive: true });
}

async function captureState(page: Page, id: string, state: string) {
  ensureArtifactDirs();
  await page.screenshot({ path: path.join(screenshotDir, `${id}.png`), fullPage: true });
  const visibleText = await page.locator('body').innerText();
  writeFileSync(
    path.join(domSummaryDir, `${id}.txt`),
    [
      `state: ${state}`,
      `url: ${page.url()}`,
      '',
      visibleText.slice(0, 6000),
    ].join('\n'),
  );
}

function bottomTab(page: Page, name: string) {
  return page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button', { name, exact: true });
}

async function completeFreshLifeForMp1(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto('/');
  const openingStory = page.getByRole('dialog', { name: /Opening story/i });
  try {
    await openingStory.waitFor({ state: 'visible', timeout: 2000 });
    await captureState(page, 'SS-000-opening-story', 'fresh save opening story before life identity');
    await page.waitForTimeout(600);
    await openingStory.getByRole('button', { name: /^Skip$/ }).click();
    await expect(openingStory).toBeHidden();
  } catch {
    // Story may already be completed in a reused browser profile.
  }

  await expect(page.getByRole('button', { name: /Select heaven path/i })).toBeVisible();
  await captureState(page, 'SS-001-fresh-save-before-life-start', 'fresh save before life identity completion');
  await expect(page.locator('body')).not.toContainText(/Breakthrough Ready/i);

  await page.getByRole('button', { name: /Select heaven path/i }).click();
  await expect(page.getByRole('group', { name: 'Heart Law choices' })).toBeVisible();
  await captureState(page, 'SS-002-life-start-path-selected', 'path selected, Heart Law and breath still pending');
  await expect(page.locator('body')).not.toContainText(/Breakthrough Ready/i);

  await page.getByRole('group', { name: 'Heart Law choices' }).getByRole('button').first().click();
  await expect(page.getByRole('button', { name: /^Next$/ })).toBeEnabled();
  await page.getByRole('button', { name: /^Next$/ }).click();
  await expect(page.getByRole('heading', { name: /Choose Breath Focus/i })).toBeVisible();
  await page.locator('[data-ui="life-start-breath-focus-selection-region"]').getByRole('button', { name: /Balanced/i }).click();
  await page.getByRole('button', { name: /^Finish$/ }).click();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
  await expect(bottomTab(page, 'Cultivation')).toHaveAttribute('aria-current', 'page');
  await captureState(page, 'SS-003-life-start-complete-cultivation-active', 'life identity complete and cultivation tab active');
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

test('MP1 browser proof captures life-start pause and live Gate Trial surface', async ({ page }) => {
  ensureArtifactDirs();
  const consoleLines: string[] = [];
  page.on('console', (message) => {
    consoleLines.push(`${message.type()}: ${message.text()}`);
  });
  page.on('pageerror', (error) => {
    consoleLines.push(`pageerror: ${error.message}`);
  });

  await completeFreshLifeForMp1(page);

  await bottomTab(page, 'World').click();
  await dismissOnboardingIfPresent(page);
  const continueButton = page.getByRole('button', { name: /^Continue$/ });
  if (await continueButton.isVisible()) {
    await continueButton.click();
  }
  await expect(page.getByRole('button', { name: /^Open Gate Trial:/i })).toBeVisible();
  await page.getByRole('button', { name: /^Open Gate Trial:/i }).click();
  await page.getByRole('button', { name: /^Open Gate Trial$/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByTestId('gate-trial-screen-owner')).toBeVisible();
  await expect(page.getByTestId('gate-trial-screen-owner')).toHaveAttribute('data-mode', 'live');
  await captureState(page, 'SS-010-first-gate-locked', 'first Gate Trial live surface after fresh life');

  writeFileSync(path.join(consoleLogDir, 'mp1-route-proof.console.log'), consoleLines.join('\n'));
  expect(consoleLines.filter((line) => line.startsWith('error:') || line.startsWith('pageerror:'))).toEqual([]);
});
