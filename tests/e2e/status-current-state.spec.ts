import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const artifactRoot = path.resolve('artifacts/mp5/status-current-state');
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

async function seedStatusCurrentState(page: Page) {
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

async function captureStatusEvidence(page: Page, id: string) {
  ensureArtifactDirs();
  const screenshotPath = path.join(screenshotRoot, `${id}.png`);
  const summaryPath = path.join(domSummaryRoot, `${id}.json`);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  const summary = await page.evaluate(() => {
    const currentState = document.querySelector('[data-testid="status-current-state"]');
    const hero = document.querySelector('[data-testid="status-ledger-hero"]');
    const mission = document.querySelector('[data-testid="status-ledger-card-mission-requirements"]');
    const best = document.querySelector('[data-testid="status-ledger-card-best-improvements"]');
    const drawer = document.querySelector('[data-testid="spirit-root-observation-drawer"]');
    return {
      url: window.location.href,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth + 2,
      order: {
        currentStateTop: currentState?.getBoundingClientRect().top ?? null,
        heroTop: hero?.getBoundingClientRect().top ?? null,
        missionTop: mission?.getBoundingClientRect().top ?? null,
        bestTop: best?.getBoundingClientRect().top ?? null,
      },
      drawer: drawer
        ? {
            owner: drawer.getAttribute('data-owner'),
            activeTab: drawer.getAttribute('data-active-tab'),
          }
        : null,
      testIds: Array.from(document.querySelectorAll('[data-testid]'))
        .map((node) => node.getAttribute('data-testid'))
        .filter(Boolean)
        .slice(0, 120),
      visibleText: document.body.innerText.replace(/\n{3,}/g, '\n\n').slice(0, 8000),
    };
  });
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  return summary;
}

test.describe('MP5 Status Current State', () => {
  test.use({ viewport: { width: 1440, height: 980 } });

  test('renders Current State first, preserves old Status ledger, and opens Spirit Root Observation', async ({ page }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await waitForApp(page);
    await seedStatusCurrentState(page);

    const currentState = page.getByTestId('status-current-state');
    await expect(currentState).toBeVisible();
    await expect(currentState.getByRole('heading', { name: /^Current State$/ })).toBeVisible();

    for (const blockId of [
      'current-state-cultivation',
      'current-state-dao-heart',
      'current-state-spirit-root',
      'current-state-training',
      'current-state-build-prep',
      'current-state-active-work',
    ]) {
      await expect(currentState.getByTestId(`status-current-state-block-${blockId}`)).toBeVisible();
    }
    await expect(currentState.getByLabel('Current Bottleneck')).toBeVisible();

    await expect(page.getByTestId('status-ledger-hero')).toBeVisible();
    await expect(page.getByTestId('status-ledger-card-mission-requirements')).toBeAttached();
    await expect(page.getByTestId('status-ledger-card-best-improvements')).toBeAttached();
    await expect(page.getByTestId('status-ledger-card-current-work')).toBeAttached();
    await expect(page.getByTestId('status-ledger-card-build-preparation')).toBeAttached();

    const order = await page.evaluate(() => {
      const current = document.querySelector('[data-testid="status-current-state"]')?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      const hero = document.querySelector('[data-testid="status-ledger-hero"]')?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      const mission = document.querySelector('[data-testid="status-ledger-card-mission-requirements"]')?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      const best = document.querySelector('[data-testid="status-ledger-card-best-improvements"]')?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      return { current, hero, mission, best };
    });
    expect(order.current).toBeLessThan(order.hero);
    expect(order.current).toBeLessThan(order.mission);
    expect(order.current).toBeLessThan(order.best);

    await currentState
      .getByTestId('status-current-state-block-current-state-spirit-root')
      .getByRole('button', { name: /Observe Spirit Root/i })
      .click();
    const drawer = page.getByTestId('spirit-root-observation-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('data-owner', 'status');
    await expect(drawer).toHaveAttribute('data-active-tab', 'fit');

    const summary = await captureStatusEvidence(page, 'status-current-state-root-observation');
    expect(summary.noHorizontalOverflow).toBe(true);
    expect(summary.visibleText).not.toMatch(/\b(Current Omen|Gate Proof|Source Thread|Dao Mandate Interface|undefined|NaN|\[object Object\])\b/i);
  });
});
