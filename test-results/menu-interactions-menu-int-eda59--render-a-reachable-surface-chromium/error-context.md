# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: menu-interactions.spec.ts >> menu interaction audit >> fresh life wizard and every bottom tab render a reachable surface
- Location: tests\e2e\menu-interactions.spec.ts:106:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /Select heaven path/i })

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - img
  - generic [ref=e3]:
    - generic [ref=e7]:
      - region "Cultivation identity" [ref=e8]:
        - generic [ref=e9]:
          - img [ref=e11]
          - generic [ref=e14]:
            - generic [ref=e15]: Realm
            - strong [ref=e16]: Qi Condensation
            - generic [ref=e17]: Stage 1
        - generic [ref=e18]:
          - img [ref=e20]
          - generic [ref=e23]:
            - generic [ref=e24]: Qi
            - strong [ref=e25]: 4.17K
        - 'generic "Base 66.73 / s. Breath Balanced. Buffs: No active cultivation tonics." [ref=e26]':
          - img [ref=e28]
          - generic [ref=e31]:
            - generic [ref=e32]: Cultivation Rate
            - strong [ref=e33]: 66.73 / s
        - generic [ref=e34]:
          - img [ref=e36]
          - generic [ref=e39]:
            - generic [ref=e40]: Stability
            - strong [ref=e41]: 0%
        - generic [ref=e42]:
          - img [ref=e44]
          - generic [ref=e47]:
            - generic [ref=e48]: Foreground
            - strong [ref=e49]: Idle
      - complementary "Cultivation milestone seals" [ref=e50]:
        - button "Next Milestone Breakthrough" [ref=e52] [cursor=pointer]:
          - img [ref=e54]
          - generic [ref=e57]:
            - generic [ref=e58]: Next Milestone
            - strong [ref=e59]: Breakthrough
        - button "Need Qi Cap 100" [ref=e61] [cursor=pointer]:
          - img [ref=e63]
          - generic [ref=e66]:
            - generic [ref=e67]: Need
            - strong [ref=e68]: Qi Cap
            - generic [ref=e69]: "100"
        - button "Action Break Through" [ref=e71] [cursor=pointer]:
          - img [ref=e73]
          - generic [ref=e76]:
            - generic [ref=e77]: Action
            - strong [ref=e78]: Break Through
      - main "Dantian altar" [ref=e80]:
        - generic:
          - img
          - generic:
            - generic:
              - img
          - 'generic "Lotus state: Breakthrough Ready"':
            - generic: Breakthrough Ready
      - complementary "Doctrine seals" [ref=e81]:
        - button "Open Dao Heart" [ref=e82] [cursor=pointer]:
          - generic [ref=e84]: Dao
        - button "Path No Path selected" [ref=e86] [cursor=pointer]:
          - img [ref=e88]
          - generic [ref=e91]:
            - generic [ref=e92]: Path
            - strong [ref=e93]: No Path selected
        - button "Spirit Root Water / Uncommon" [ref=e95] [cursor=pointer]:
          - img [ref=e97]
          - generic [ref=e99]:
            - generic [ref=e100]: Spirit Root
            - strong [ref=e101]: Water / Uncommon
        - button "Heart Law No Heart Law selected" [ref=e103] [cursor=pointer]:
          - img [ref=e105]
          - generic [ref=e108]:
            - generic [ref=e109]: Heart Law
            - strong [ref=e110]: No Heart Law selected
        - button "Verse Chapter 1" [ref=e112] [cursor=pointer]:
          - img [ref=e114]
          - generic [ref=e117]:
            - generic [ref=e118]: Verse
            - strong [ref=e119]: Chapter 1
        - button "Breath / Focus Balanced" [ref=e121] [cursor=pointer]:
          - img [ref=e123]
          - generic [ref=e126]:
            - generic [ref=e127]: Breath / Focus
            - strong [ref=e128]: Balanced
      - generic:
        - generic [ref=e130]:
          - generic [ref=e131]: Breakthrough
          - strong [ref=e132]: Ready
        - region "Breakthrough Readiness" [ref=e133]:
          - generic [ref=e134]: Breakthrough Readiness
          - strong [ref=e135]: Qi and gate requirements are ready.
          - list [ref=e136]:
            - listitem [ref=e137]:
              - generic [ref=e138]: Qi
              - strong [ref=e139]: Ready
            - listitem [ref=e140]:
              - generic [ref=e141]: Realm edge
              - strong [ref=e142]: Reached
            - listitem [ref=e143]:
              - generic [ref=e144]: Gate item
              - strong [ref=e145]: Not needed now
        - region "Qi 4.17K / 100" [ref=e146]:
          - img
          - generic [ref=e152]: Qi 4.17K / 100
          - generic [ref=e153]: +66.73/s
        - region "Cultivation commands" [ref=e154]:
          - button "Break Through" [ref=e155] [cursor=pointer]:
            - generic [ref=e156]: Break Through
          - button "Start Cultivation" [ref=e157] [cursor=pointer]:
            - generic [ref=e158]: Start Cultivation
    - navigation "Primary navigation" [ref=e159]:
      - generic [ref=e160]:
        - button "Status" [ref=e161]:
          - img [ref=e164]
          - generic [ref=e165]: Status
        - button "Cultivation" [ref=e166]:
          - img [ref=e169]
          - generic [ref=e171]: Cultivation
        - button "World" [ref=e172]:
          - img [ref=e175]
          - generic [ref=e176]: World
        - button "Inventory" [ref=e177]:
          - img [ref=e180]
          - generic [ref=e181]: Inventory
        - button "Techniques" [ref=e182]:
          - img [ref=e185]
          - generic [ref=e186]: Techniques
        - button "Records" [ref=e187]:
          - img [ref=e190]
          - generic [ref=e191]: Records
        - button "Prestige" [ref=e192]:
          - img [ref=e195]
          - generic [ref=e196]: Prestige
        - button "Settings" [ref=e197]:
          - img [ref=e200]
          - generic [ref=e205]: Settings
    - dialog "Opening story" [ref=e206]:
      - paragraph [ref=e209]: A blank name cannot climb. Choose the first stroke of your Dao.
      - generic "Story controls":
        - button "Skip" [ref=e210] [cursor=pointer]
        - button "Choose Path" [active] [ref=e211] [cursor=pointer]
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test';
  2   | import { mkdirSync } from 'node:fs';
  3   | import path from 'node:path';
  4   | 
  5   | const evidenceDir = path.resolve('docs/release/menu-function-evidence');
  6   | 
  7   | const liveModules = [
  8   |   { label: 'Manual Pavilion', root: 'manual-pavilion-exact-page' },
  9   |   { label: 'Apothecary', root: 'apothecary-exact-screen-owner' },
  10  |   { label: 'Forge', root: 'forge-exact-screen-owner' },
  11  |   { label: 'Bounties', root: 'bounties-exact-screen-owner' },
  12  |   { label: 'Expeditions', root: 'expeditions-exact-screen-owner' },
  13  |   { label: 'Outskirts', root: 'outskirts-view-screen' },
  14  |   { label: 'Gate Trial', root: 'gate-trial-screen-owner' },
  15  |   { label: 'Ruins', root: 'ruins-view-screen' },
  16  | ] as const;
  17  | 
  18  | function escapeRegExp(value: string): string {
  19  |   return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  20  | }
  21  | 
  22  | async function collectConsoleFailures(page: Page): Promise<string[]> {
  23  |   const failures: string[] = [];
  24  |   page.on('console', (message) => {
  25  |     if (message.type() === 'error') {
  26  |       failures.push(message.text());
  27  |     }
  28  |   });
  29  |   page.on('pageerror', (error) => {
  30  |     failures.push(error.message);
  31  |   });
  32  |   return failures;
  33  | }
  34  | 
  35  | async function completeFreshLife(page: Page) {
  36  |   await page.addInitScript(() => {
  37  |     window.localStorage.clear();
  38  |     window.sessionStorage.clear();
  39  |   });
  40  |   await page.goto('/');
> 41  |   await page.getByRole('button', { name: /Select heaven path/i }).click();
      |                                                                   ^ Error: locator.click: Test timeout of 60000ms exceeded.
  42  |   await expect(page.getByRole('heading', { name: /Choose Your Heart Law/i })).toBeVisible();
  43  | 
  44  |   await page.getByRole('group', { name: 'Heart Law choices' }).getByRole('button').first().click();
  45  |   await expect(page.getByRole('button', { name: /^Next$/ })).toBeEnabled();
  46  |   await page.getByRole('button', { name: /^Next$/ }).click();
  47  |   await expect(page.getByRole('heading', { name: /Choose Breath Focus/i })).toBeVisible();
  48  | 
  49  |   await page.getByRole('button', { name: /Balanced/i }).click();
  50  |   await page.getByRole('button', { name: /^Finish$/ }).click();
  51  |   await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
  52  |   await expect(bottomTab(page, 'Cultivation')).toHaveAttribute('aria-current', 'page');
  53  | }
  54  | 
  55  | async function assertNoRawLiveLeaks(page: Page) {
  56  |   const visibleText = await page.locator('body').innerText();
  57  |   expect(visibleText).not.toMatch(/\b(?:city|trial|heart_law)_[a-z0-9_]+\b/i);
  58  |   expect(visibleText).not.toContain('[object Object]');
  59  |   expect(visibleText).not.toMatch(/\bundefined\b/i);
  60  | }
  61  | 
  62  | async function screenshotEvidence(page: Page, name: string) {
  63  |   mkdirSync(evidenceDir, { recursive: true });
  64  |   await page.screenshot({ path: path.join(evidenceDir, `${name}.png`), fullPage: true });
  65  | }
  66  | 
  67  | function bottomTab(page: Page, name: string) {
  68  |   return page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button', { name, exact: true });
  69  | }
  70  | 
  71  | async function dismissOnboardingIfPresent(page: Page) {
  72  |   const callout = page.getByTestId('onboarding-callout-card');
  73  |   try {
  74  |     await callout.waitFor({ state: 'visible', timeout: 750 });
  75  |   } catch {
  76  |     return;
  77  |   }
  78  | 
  79  |   await callout.getByRole('button').last().click();
  80  |   await expect(callout).toBeHidden();
  81  | }
  82  | 
  83  | async function openWorldTab(page: Page) {
  84  |   await bottomTab(page, 'World').click();
  85  |   await expect(page.getByRole('button', { name: /^Outskirts$/ })).toBeVisible();
  86  |   await dismissOnboardingIfPresent(page);
  87  | }
  88  | 
  89  | async function openWorldModule(page: Page, label: string) {
  90  |   await openWorldTab(page);
  91  |   await page.getByRole('button', { name: new RegExp(`^${escapeRegExp(label)}$`) }).click();
  92  |   await page.getByRole('button', { name: new RegExp(`^Open ${escapeRegExp(label)}$`) }).click();
  93  |   await expect(page.getByRole('dialog')).toBeVisible();
  94  | }
  95  | 
  96  | async function closeWorldModuleWithEscape(page: Page, rootTestId?: string | null) {
  97  |   await page.keyboard.press('Escape');
  98  |   await expect(page.getByRole('dialog')).toBeHidden();
  99  |   if (rootTestId) {
  100 |     await expect(page.getByTestId(rootTestId)).toBeHidden();
  101 |   }
  102 |   await expect(bottomTab(page, 'World')).toHaveAttribute('aria-current', 'page');
  103 | }
  104 | 
  105 | test.describe('menu interaction audit', () => {
  106 |   test('fresh life wizard and every bottom tab render a reachable surface', async ({ page }) => {
  107 |     const consoleFailures = await collectConsoleFailures(page);
  108 |     await completeFreshLife(page);
  109 | 
  110 |     for (const tab of ['Status', 'Cultivation', 'World', 'Inventory', 'Techniques', 'Prestige', 'Settings']) {
  111 |       await bottomTab(page, tab).click();
  112 |       await expect(bottomTab(page, tab)).toHaveAttribute('aria-current', 'page');
  113 |       await assertNoRawLiveLeaks(page);
  114 |     }
  115 | 
  116 |     await expect(consoleFailures, consoleFailures.join('\n')).toEqual([]);
  117 |   });
  118 | 
  119 |   test('World map opens and closes every live module through the player route', async ({ page }) => {
  120 |     const consoleFailures = await collectConsoleFailures(page);
  121 |     await completeFreshLife(page);
  122 |     await openWorldTab(page);
  123 |     await screenshotEvidence(page, 'world-map');
  124 | 
  125 |     for (const module of liveModules) {
  126 |       await openWorldModule(page, module.label);
  127 | 
  128 |       if (module.root) {
  129 |         await expect(page.getByTestId(module.root)).toBeVisible();
  130 |       } else {
  131 |         await expect(page.getByText('Buy Manual').first()).toBeVisible();
  132 |       }
  133 | 
  134 |       if (module.label === 'Gate Trial') {
  135 |         await expect(page.getByTestId('gate-trial-screen-owner')).toHaveAttribute('data-mode', 'live');
  136 |         await expect(page.getByTestId('gate-trial-screen-owner')).toHaveAttribute('data-actions-enabled', 'true');
  137 |         await screenshotEvidence(page, 'gate-trial-live');
  138 |       }
  139 | 
  140 |       if (module.label === 'Ruins') {
  141 |         await screenshotEvidence(page, 'ruins-live');
```