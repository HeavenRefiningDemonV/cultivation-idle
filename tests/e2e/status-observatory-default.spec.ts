import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const artifactRoot = path.resolve('artifacts/s8-status-observatory');
const screenshotRoot = path.join(artifactRoot, 'screenshots');
const domSummaryRoot = path.join(artifactRoot, 'dom-summaries');

function ensureArtifactDirs() {
  mkdirSync(screenshotRoot, { recursive: true });
  mkdirSync(domSummaryRoot, { recursive: true });
}

async function waitForApp(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.locator('body').waitFor({ state: 'visible' });
}

async function dismissTransientPrompts(page: Page) {
  for (let index = 0; index < 8; index += 1) {
    const clicked = await page.getByRole('button', { name: /^Continue$/ }).last().click({ timeout: 300 }).then(() => true).catch(() => false)
      || await page.getByRole('button', { name: /^Skip$/ }).last().click({ timeout: 300 }).then(() => true).catch(() => false)
      || await page.getByRole('button', { name: /^Close$/ }).last().click({ timeout: 300 }).then(() => true).catch(() => false);
    if (!clicked) return;
    await page.waitForTimeout(100);
  }
}

async function seedStatusObservatory(page: Page) {
  await page.evaluate(async () => {
    const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
    const { useCityStore } = await importModule('/src/stores/cityStore.ts');
    const { useContentStore } = await importModule('/src/stores/contentStore.ts');
    const { useGameStore } = await importModule('/src/stores/gameStore.ts');
    const { useHeartLawStore } = await importModule('/src/stores/heartLawStore.ts');
    const { useOnboardingStore } = await importModule('/src/stores/onboardingStore.ts');
    const { useUIStore } = await importModule('/src/stores/uiStore.ts');
    const { useStoryStore } = await importModule('/src/features/story/storyStore.ts');

    const content = useContentStore.getState();
    const cityId = content.maps.citiesById.city_pinewind_hamlet ? 'city_pinewind_hamlet' : content.citiesSorted[0]?.id;
    if (cityId) {
      useCityStore.setState({
        currentCityId: cityId,
        unlockedCityIds: [cityId],
      });
    }

    const game = useGameStore.getState();
    if (!game.selectedPath) {
      game.selectPath('heaven');
    }

    const lawId = content.maps.heartLawsById.heart_ember_thread_sutra
      ? 'heart_ember_thread_sutra'
      : Object.keys(content.maps.heartLawsById)[0];
    const heart = useHeartLawStore.getState();
    if (lawId) {
      heart.setUnlocked(Array.from(new Set([...(heart.unlockedHeartLawIds ?? []), lawId])));
      heart.selectHeartLaw(lawId);
      heart.setBreathMode('balanced');
      heart.setHeartLawLevel(lawId, 1, 0);
    }

    const onboarding = useOnboardingStore.getState();
    onboarding.hydrate({
      ...onboarding.toSaveState(),
      activeMilestoneId: 'complete',
      firstLifeOnlyComplete: true,
      unlockedTabs: ['cultivation', 'status', 'adventure', 'inventory', 'records', 'techniques', 'prestige'],
      unlockedWorldModules: ['outskirts', 'trainingHall', 'manualPavilion', 'apothecary', 'expeditions', 'forge', 'ruins', 'bounties', 'gateTrial'],
      teaserWorldModules: [],
      queuedTutorialCardIds: [],
    });
    onboarding.setDevOverride({ unlockAll: true });
    onboarding.applyUnlocks({
      unlockedTabs: ['cultivation', 'status', 'adventure', 'inventory', 'records', 'techniques', 'prestige'],
      unlockedWorldModules: ['outskirts', 'trainingHall', 'manualPavilion', 'apothecary', 'expeditions', 'forge', 'ruins', 'bounties', 'gateTrial'],
      teaserWorldModules: [],
    });

    const story = useStoryStore.getState();
    story.hydrateFromSave({ seenFlags: { story_intro_seen: true }, storyLog: [] });
    story.clearActive();

    const ui = useUIStore.getState();
    ui.hideOfflineProgress();
    ui.closeWorldBuildingModal();
    ui.closeMigrationIssuesModal();
    ui.closeLifeSummaryModal();
    ui.closeTutorialLedgerDrawer();
    ui.closeDaoHeartModal();
    ui.closeSpiritRootObservation();
    useUIStore.setState({
      activeOnboardingPrompt: null,
      queuedOnboardingPrompts: [],
      dismissedOnboardingLifeKeys: [],
      dismissedOnboardingRuntimeKeys: [],
    });
    ui.setActiveTab('status');
  });
  await page.waitForTimeout(200);
  await dismissTransientPrompts(page);
}

async function captureStatusObservatoryEvidence(page: Page, id: string) {
  ensureArtifactDirs();
  const screenshotPath = path.join(screenshotRoot, `${id}.png`);
  const summaryPath = path.join(domSummaryRoot, `${id}.json`);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  const summary = await page.evaluate(() => {
    const root = document.querySelector('[data-observatory-root="status-living-state-observatory"]');
    const drawer = document.querySelector('[data-testid="spirit-root-observation-drawer"]');
    return {
      url: window.location.href,
      observatoryRoot: root?.getAttribute('data-observatory-root') ?? null,
      observatoryMode: root?.getAttribute('data-observatory-mode') ?? null,
      noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth + 2,
      drawer: drawer
        ? {
            owner: drawer.getAttribute('data-owner'),
            activeTab: drawer.getAttribute('data-active-tab'),
          }
        : null,
      testIds: Array.from(document.querySelectorAll('[data-testid]'))
        .map((node) => node.getAttribute('data-testid'))
        .filter(Boolean)
        .slice(0, 140),
      visibleText: document.body.innerText.replace(/\n{3,}/g, '\n\n').slice(0, 9000),
    };
  });
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  return { screenshotPath, summaryPath, summary };
}

test.describe('S8 public Status Observatory default route', () => {
  test.use({ viewport: { width: 1440, height: 980 } });

  test('renders live Observatory by default and opens Spirit Root Observation through route action', async ({ page }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await waitForApp(page);
    await seedStatusObservatory(page);

    const root = page.locator('[data-observatory-root="status-living-state-observatory"]');
    await expect(root).toBeVisible();
    await expect(root).toHaveAttribute('data-observatory-mode', 'live');

    for (const testId of [
      'status-ledger-root',
      'status-ledger-hero',
      'status-ledger-metrics',
      'status-current-state',
      'status-ledger-grid',
      'status-root-law-instrument',
      'status-bottleneck-canopy',
      'status-stat-constellation',
      'status-ledger-build-preparation',
      'status-ledger-current-work',
      'status-ledger-details',
      'status-ledger-mission-requirements',
      'status-ledger-cultivation-base',
    ]) {
      await expect(page.getByTestId(testId)).toBeVisible();
    }

    await expect(page.getByTestId('status-ledger-card-mission-requirements')).toHaveCount(0);

    await page.evaluate(() => {
      window.scrollTo(0, 0);
      document.querySelector('[data-testid="status-ledger-root"]')?.scrollIntoView({ block: 'start', inline: 'nearest' });
    });
    const publicRoute = await captureStatusObservatoryEvidence(page, 'status-observatory-default-route');
    expect(publicRoute.summary.noHorizontalOverflow).toBe(true);
    expect(publicRoute.summary.observatoryRoot).toBe('status-living-state-observatory');
    expect(publicRoute.summary.observatoryMode).toBe('live');
    expect(publicRoute.summary.drawer).toBe(null);

    await page
      .getByTestId('status-root-law-instrument')
      .getByRole('button', { name: /Observe Spirit Root/i })
      .click();
    const drawer = page.getByTestId('spirit-root-observation-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('data-owner', 'status');

    const { summary } = await captureStatusObservatoryEvidence(page, 'status-observatory-root-observation-drawer');
    expect(summary.noHorizontalOverflow).toBe(true);
    expect(summary.observatoryRoot).toBe('status-living-state-observatory');
    expect(summary.observatoryMode).toBe('live');
    expect(summary.visibleText).not.toMatch(/\b(Current Omen|Gate Proof|Source Thread|Dao Mandate Interface|Omen evidence|Proof Detail|undefined|NaN|\[object Object\])\b/i);
  });
});
