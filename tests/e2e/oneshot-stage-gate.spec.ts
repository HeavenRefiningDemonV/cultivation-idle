import { test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Monitor-law gate for the Observatory Stage: the blocked fixture must render
// as one centered, uniformly-scaled parchment composition on the slate-teal
// void at any monitor size — same composition, larger/smaller, never reflowed.
const OUT_ROOT = path.resolve('artifacts/s10-exact-mockup/stage-gate');

const SIZES = [
  { id: '2560x1440', width: 2560, height: 1440 },
  { id: '1920x1080', width: 1920, height: 1080 },
  { id: '1280x800', width: 1280, height: 800 },
] as const;

async function waitForApp(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.locator('body').waitFor({ state: 'visible' });
}

async function dismissTransientPrompts(page: Page) {
  for (let index = 0; index < 8; index += 1) {
    const clicked =
      (await page.getByRole('button', { name: /^Continue$/ }).last().click({ timeout: 300 }).then(() => true).catch(() => false)) ||
      (await page.getByRole('button', { name: /^Skip$/ }).last().click({ timeout: 300 }).then(() => true).catch(() => false)) ||
      (await page.getByRole('button', { name: /^Close$/ }).last().click({ timeout: 300 }).then(() => true).catch(() => false));
    if (!clicked) return;
    await page.waitForTimeout(100);
  }
}

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

const FIXTURE = process.env.OBS_GATE_FIXTURE ?? 'blocked';

test.describe('oneshot stage gate — monitor-law screenshots', () => {
  for (const size of SIZES) {
    test(`${FIXTURE} @ ${size.id}`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/?obsFixture=${FIXTURE}`);
      await waitForApp(page);
      await seedStatusTab(page);
      const root = page.locator('[data-observatory-root="status-living-state-observatory"]');
      await root.waitFor({ state: 'visible' });
      await page.waitForTimeout(350);
      mkdirSync(OUT_ROOT, { recursive: true });
      await page.screenshot({ path: path.join(OUT_ROOT, `${FIXTURE}-${size.id}.png`), fullPage: false });

      const geo = await page.evaluate(() => {
        const q = (s: string) => document.querySelector(s) as HTMLElement | null;
        const rect = (el: HTMLElement | null) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
        };
        const vp = q('.obsStageViewport');
        const stage = q('.obsStage');
        const canvas = q('.statusObservatoryCanvas');
        const content = q('.gameLayoutContent');
        const vpcs = vp ? getComputedStyle(vp) : null;
        return {
          innerW: window.innerWidth,
          innerH: window.innerHeight,
          scaleVar: vp?.style.getPropertyValue('--obs-scale') || null,
          stageTransform: stage ? getComputedStyle(stage).transform : null,
          contentClass: content?.className ?? null,
          contentRect: rect(content),
          viewportRect: rect(vp),
          stageRect: rect(stage),
          canvasRect: rect(canvas),
          viewportBgImage: vpcs?.backgroundImage?.slice(0, 80) ?? null,
          viewportBgColor: vpcs?.backgroundColor ?? null,
          docScrollW: document.documentElement.scrollWidth,
          docScrollH: document.documentElement.scrollHeight,
        };
      });
      writeFileSync(path.join(OUT_ROOT, `geo-${FIXTURE}-${size.id}.json`), JSON.stringify(geo, null, 2));
    });
  }
});
