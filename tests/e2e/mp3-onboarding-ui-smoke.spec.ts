import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const artifactRoot = path.resolve('artifacts/mp3/final/onboarding-ui/browser');
const screenshotRoot = path.join(artifactRoot, 'screenshots');
const consoleLogRoot = path.join(artifactRoot, 'console-logs');

function ensureDirs() {
  mkdirSync(screenshotRoot, { recursive: true });
  mkdirSync(consoleLogRoot, { recursive: true });
}

async function maybeClick(locator: ReturnType<Page['locator']>, timeout = 700): Promise<boolean> {
  try {
    await locator.waitFor({ state: 'visible', timeout });
    await locator.click({ timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

async function completeFreshLife(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle').catch(() => {});

  const openingStory = page.getByRole('dialog', { name: /Opening story/i });
  if (await openingStory.isVisible().catch(() => false)) {
    await openingStory.getByRole('button', { name: /^Skip$/ }).click();
    await expect(openingStory).toBeHidden();
  }

  await page.getByRole('button', { name: /Select heaven path/i }).click();
  await expect(page.getByRole('group', { name: 'Heart Law choices' })).toBeVisible();
  await page.getByRole('group', { name: 'Heart Law choices' }).getByRole('button').first().click();
  await page.getByRole('button', { name: /^Next$/ }).click();
  await expect(page.getByRole('heading', { name: /Choose Breath Focus/i })).toBeVisible();
  await page.locator('[data-ui="life-start-breath-focus-selection-region"]').getByRole('button', { name: /Balanced/i }).click();
  await page.getByRole('button', { name: /^Finish$/ }).click();
  await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
}

async function queueTutorialCard(page: Page, cardId: string) {
  await page.evaluate(async (queuedCardId) => {
    const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<{
      useOnboardingStore: {
        getState: () => {
          queueTutorialCard: (id: string) => void;
        };
      };
    }>;
    const { useOnboardingStore } = await importModule('/src/stores/onboardingStore.ts');
    useOnboardingStore.getState().queueTutorialCard(queuedCardId);
  }, cardId);
}

async function writeRuntimeDebug(page: Page, name: string) {
  const debug = await page.evaluate(async () => {
    const importModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<Record<string, unknown>>;
    const onboardingModule = await importModule('/src/stores/onboardingStore.ts') as {
      useOnboardingStore: { getState: () => Record<string, unknown> };
    };
    const contentModule = await importModule('/src/stores/contentStore.ts') as {
      useContentStore: { getState: () => Record<string, unknown> };
    };
    const uiModule = await importModule('/src/stores/uiStore.ts') as {
      useUIStore: { getState: () => Record<string, unknown> };
    };
    const gameModule = await importModule('/src/stores/gameStore.ts') as {
      useGameStore: { getState: () => Record<string, unknown> };
    };
    const heartLawModule = await importModule('/src/stores/heartLawStore.ts') as {
      useHeartLawStore: { getState: () => Record<string, unknown> };
    };
    const storyModule = await importModule('/src/features/story/storyStore.ts') as {
      useStoryStore: { getState: () => Record<string, unknown> };
    };
    const milestoneModule = await importModule('/src/systems/onboarding/onboardingMilestoneSurface.ts') as {
      buildOnboardingMilestoneSurface: (input: Record<string, unknown>) => unknown;
    };
    const contentHelpers = await importModule('/src/systems/onboarding/onboardingContent.ts') as {
      getOnboardingMilestonesFromContent: (content: unknown) => unknown[];
    };
    const tabPolicyModule = await importModule('/src/systems/onboarding/onboardingTabPolicy.ts') as {
      buildOnboardingTabPolicy: (input: Record<string, unknown>) => unknown;
    };
    const worldPolicyModule = await importModule('/src/systems/onboarding/onboardingWorldModulePolicy.ts') as {
      buildOnboardingWorldModulePolicy: (input: Record<string, unknown>) => unknown;
    };
    const gameLayoutModule = await importModule('/src/components/GameLayout.tsx').catch(() => null) as null | {
      GameLayout?: unknown;
    };
    const onboarding = onboardingModule.useOnboardingStore.getState();
    const content = contentModule.useContentStore.getState();
    const ui = uiModule.useUIStore.getState();
    const game = gameModule.useGameStore.getState();
    const heartLaw = heartLawModule.useHeartLawStore.getState();
    const story = storyModule.useStoryStore.getState();
    const raw = content.raw as { onboarding_milestones?: { milestones?: Array<{ id: string }> } } | null;
    const milestones = contentHelpers.getOnboardingMilestonesFromContent(raw);
    const tabPolicy = tabPolicyModule.buildOnboardingTabPolicy({
      activeMilestoneId: onboarding.activeMilestoneId,
      unlockedTabs: onboarding.unlockedTabs,
      firstLifeOnlyComplete: onboarding.firstLifeOnlyComplete,
      devOverride: onboarding.devOverride,
      isExistingAdvancedSave: false,
      storyOrLifeStartBlocking: false,
      settingsAsUtility: true,
      exactFixtureOrCaptureMode: false,
      hasInventoryEvidence: false,
    });
    const citiesSorted = content.citiesSorted as Array<{ id: string; modules?: string[] }>;
    const currentCity = citiesSorted[0] ?? null;
    const worldModulePolicy = worldPolicyModule.buildOnboardingWorldModulePolicy({
      activeMilestoneId: onboarding.activeMilestoneId,
      completedMilestoneIds: onboarding.completedMilestoneIds,
      unlockedWorldModules: onboarding.unlockedWorldModules,
      teaserWorldModules: onboarding.teaserWorldModules,
      selectedCityModuleKeys: currentCity?.modules ?? [],
      deferredWorldModuleKeys: ['auctionHouse', 'beastPen', 'alchemy'],
      firstLifeOnlyComplete: onboarding.firstLifeOnlyComplete,
      devOverride: onboarding.devOverride,
      isExistingAdvancedSave: false,
      exactFixtureOrCaptureMode: false,
    });
    const milestoneSurface = milestoneModule.buildOnboardingMilestoneSurface({
      milestones,
      activeMilestoneId: onboarding.activeMilestoneId,
      tabPolicy,
      worldModulePolicy,
      currentCityId: currentCity?.id ?? null,
      suppressedReason: null,
    });

    return {
      query: window.location.search,
      hash: window.location.hash,
      milestoneScrollInDom: Boolean(document.querySelector('[data-testid="milestone-scroll"]')),
      unlockCeremonyInDom: Boolean(document.querySelector('[data-testid="unlock-ceremony"]')),
      gameLayoutGuidanceDebug: document.querySelector('[data-testid="onboarding-guidance-debug"]')?.textContent ?? null,
      onboarding: {
        activeMilestoneId: onboarding.activeMilestoneId,
        completedMilestoneIds: onboarding.completedMilestoneIds,
        unlockedTabs: onboarding.unlockedTabs,
        queuedTutorialCardIds: onboarding.queuedTutorialCardIds,
        seenTutorialCardIds: onboarding.seenTutorialCardIds,
        firstLifeOnlyComplete: onboarding.firstLifeOnlyComplete,
        devOverride: onboarding.devOverride,
      },
      content: {
        isLoaded: content.isLoaded,
        error: content.error,
        onboardingMilestoneCount: raw?.onboarding_milestones?.milestones?.length ?? 0,
        onboardingMilestoneIds: raw?.onboarding_milestones?.milestones?.map((entry) => entry.id) ?? [],
      },
      computedMilestoneSurface: milestoneSurface,
      gameLayoutSourceHasMilestoneScroll: gameLayoutModule && typeof gameLayoutModule.GameLayout === 'function'
        ? String(gameLayoutModule.GameLayout).includes('MilestoneScroll')
        : null,
      ui: {
        activeTab: ui.activeTab,
        showOfflineProgressModal: ui.showOfflineProgressModal,
        showManualSatchelModal: ui.showManualSatchelModal,
        showTechniqueLearnedModal: ui.showTechniqueLearnedModal,
        showWorldBuildingModal: ui.showWorldBuildingModal,
        showTutorialLedgerDrawer: ui.showTutorialLedgerDrawer,
        showCurrentChapterExhaustedModal: ui.showCurrentChapterExhaustedModal,
        showLifeSummaryModal: ui.showLifeSummaryModal,
        showMigrationIssuesModal: ui.showMigrationIssuesModal,
        activeOnboardingPrompt: ui.activeOnboardingPrompt,
        combatPresentation: ui.combatPresentation,
      },
      lifeIdentity: {
        selectedPath: game.selectedPath,
        selectedHeartLawId: heartLaw.selectedHeartLawId,
        breathMode: heartLaw.breathMode,
        storyIntroSeen: Boolean((story.seenFlags as Record<string, unknown> | undefined)?.story_intro_seen),
        activeCutsceneId: story.activeCutsceneId,
        bodyClass: document.body.className,
      },
    };
  });

  writeFileSync(path.join(artifactRoot, `${name}.debug.json`), JSON.stringify(debug, null, 2));
  return debug;
}

async function writeDomSummary(page: Page, consoleLines: string[]) {
  const summary = await page.evaluate((lines) => {
    const visibleText = document.body.innerText.replace(/\n{3,}/g, '\n\n');
    const testIds = Array.from(document.querySelectorAll('[data-testid]'))
      .map((node) => node.getAttribute('data-testid'))
      .filter(Boolean);
    const activeElement = document.activeElement;

    return {
      url: window.location.href,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth + 2,
      scrollWidth: document.documentElement.scrollWidth,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      testIds,
      activeElement: activeElement instanceof HTMLElement
        ? {
            tagName: activeElement.tagName,
            text: activeElement.innerText?.replace(/\s+/g, ' ').trim() ?? '',
            ariaLabel: activeElement.getAttribute('aria-label'),
          }
        : null,
      consoleLines: lines,
      visibleText: visibleText.slice(0, 6000),
    };
  }, consoleLines);
  writeFileSync(path.join(artifactRoot, 'mp3-onboarding-ui.dom.json'), JSON.stringify(summary, null, 2));
  return summary;
}

test.describe('MP3 onboarding UI smoke', () => {
  test.use({ viewport: { width: 1366, height: 768 } });
  test.setTimeout(90_000);

  test('fresh life shows milestone scroll, unlock ceremony, and tutorial ledger', async ({ page }) => {
    ensureDirs();
    const consoleLines: string[] = [];
    page.on('console', (message) => {
      consoleLines.push(`${message.type()}: ${message.text()}`);
    });
    page.on('pageerror', (error) => {
      consoleLines.push(`pageerror: ${error.message}`);
    });

    await completeFreshLife(page);
    await writeRuntimeDebug(page, '01-after-fresh-life');

    const milestoneScroll = page.getByTestId('milestone-scroll');
    await expect(milestoneScroll).toBeVisible();
    await expect(milestoneScroll).toContainText('Gather your first Qi');
    await maybeClick(milestoneScroll.getByRole('button', { name: 'How calculated' }), 500);
    await page.screenshot({ path: path.join(screenshotRoot, '01-milestone-scroll.png'), fullPage: false });

    await queueTutorialCard(page, 'card_status_unlock');
    const unlockCeremony = page.getByTestId('unlock-ceremony');
    await expect(unlockCeremony).toBeVisible();
    await expect(unlockCeremony).toContainText('Know the shape of this life');
    await page.screenshot({ path: path.join(screenshotRoot, '02-unlock-ceremony.png'), fullPage: false });

    await unlockCeremony.getByRole('button', { name: /^Continue$/ }).click();
    await expect(unlockCeremony).toBeHidden();

    await milestoneScroll.getByRole('button', { name: 'Tutorial Ledger' }).click();
    const ledger = page.getByRole('dialog', { name: /Tutorial Ledger/i });
    await expect(ledger).toBeVisible();
    await expect(ledger).toContainText('Know the shape of this life');
    await expect(page.locator(':focus')).toContainText('Close');
    await page.screenshot({ path: path.join(screenshotRoot, '03-tutorial-ledger.png'), fullPage: false });

    await page.keyboard.press('Escape');
    await expect(ledger).toBeHidden();

    const summary = await writeDomSummary(page, consoleLines);
    writeFileSync(path.join(consoleLogRoot, 'mp3-onboarding-ui.log'), consoleLines.join('\n'));

    expect(consoleLines.filter((line) => /^error:|^pageerror:/i.test(line))).toEqual([]);
    expect(summary.noHorizontalOverflow).toBe(true);
    expect(summary.visibleText).not.toMatch(/\b(Current Omen|Gate Proof|Recent Omens|Source Thread|Proof Detail|Mandate Lens|Dao Mandate Interface)\b/i);
  });
});
