import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const STATES = ['blocked', 'healthy', 'postFailure', 'prestigePressure', 'contentCap'] as const;
const MOTIONS = ['normal', 'reduced'] as const;

type StateId = (typeof STATES)[number];

// The Workstream C decision table, asserted on the DOM via resolver attributes.
const RESOLVER_TABLE: Record<StateId, { tone: string; dominant: string; canopyMode: string }> = {
  blocked: { tone: 'inkJade', dominant: 'canopy', canopyMode: 'bottleneck' },
  healthy: { tone: 'jadeCalm', dominant: 'vessel', canopyMode: 'maintenance' },
  postFailure: { tone: 'cinnabarHeavy', dominant: 'canopy', canopyMode: 'failureDiagnosis' },
  prestigePressure: { tone: 'goldRitual', dominant: 'canopy', canopyMode: 'reincarnationEdict' },
  contentCap: { tone: 'mutedCap', dominant: 'vessel', canopyMode: 'capNotice' },
};

const REGION_TESTIDS = [
  'obs-region-decree',
  'obs-region-vitals',
  'obs-region-root-law',
  'obs-region-vessel',
  'obs-region-canopy',
  'obs-region-constellation',
  'obs-region-scales',
  'obs-region-wheel',
  'obs-region-ledgers',
] as const;

const artifactRoot = path.resolve('artifacts/s9-observatory-foundation');
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

// Mirrors the default-route spec's seeding so the Status tab renders cleanly;
// the fixture surface itself is supplied by the ?obsFixture query param, not
// by store state.
async function seedStatusTab(page: Page) {
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
      useCityStore.setState({ currentCityId: cityId, unlockedCityIds: [cityId] });
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

test.describe('S9 observatory fixture state harness', () => {
  test.use({ viewport: { width: 1440, height: 980 } });

  for (const state of STATES) {
    for (const motion of MOTIONS) {
      test(`${state} -- ${motion}`, async ({ page }) => {
        test.setTimeout(120_000);
        await page.emulateMedia({ reducedMotion: motion === 'reduced' ? 'reduce' : 'no-preference' });
        await page.goto(`/?obsFixture=${state}`);
        await waitForApp(page);
        await seedStatusTab(page);

        const root = page.locator('[data-observatory-root="status-living-state-observatory"]');
        await expect(root).toBeVisible();
        await expect(root).toHaveAttribute('data-observatory-visual-state', state);
        await expect(root).toHaveAttribute('data-observatory-mode', 'fixture');
        await expect(root).toHaveAttribute('data-observatory-fixture', state);

        const expected = RESOLVER_TABLE[state];
        await expect(root).toHaveAttribute('data-observatory-tone', expected.tone);
        await expect(root).toHaveAttribute('data-observatory-dominant', expected.dominant);
        await expect(root).toHaveAttribute('data-observatory-canopy-mode', expected.canopyMode);

        // No instrument may disappear: all nine region wrappers must be visible.
        for (const testId of REGION_TESTIDS) {
          await expect(page.getByTestId(testId)).toBeVisible();
        }

        ensureArtifactDirs();
        const id = `${state}--${motion}`;
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: path.join(screenshotRoot, `${id}.png`), fullPage: true });

        const summary = await page.evaluate((regionIds: readonly string[]) => {
          const node = document.querySelector('[data-observatory-root="status-living-state-observatory"]');
          const attributeNames = [
            'data-observatory-visual-state',
            'data-observatory-mode',
            'data-observatory-fixture',
            'data-observatory-tone',
            'data-observatory-dominant',
            'data-observatory-canopy-mode',
          ];
          const rootAttributes: Record<string, string | null> = {};
          for (const name of attributeNames) {
            rootAttributes[name] = node?.getAttribute(name) ?? null;
          }
          const visibleRegionTestIds = regionIds.filter((rid) => document.querySelector(`[data-testid="${rid}"]`) !== null);
          return {
            url: window.location.href,
            rootAttributes,
            visibleRegionTestIds,
            regionCount: document.querySelectorAll('[data-testid^="obs-region-"]').length,
            noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth + 2,
          };
        }, REGION_TESTIDS as readonly string[]);
        writeFileSync(path.join(domSummaryRoot, `${id}.json`), JSON.stringify(summary, null, 2));

        expect(summary.regionCount).toBe(REGION_TESTIDS.length);
        expect(summary.visibleRegionTestIds).toEqual([...REGION_TESTIDS]);
      });
    }
  }
});
