# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: menu-interactions.spec.ts >> menu interaction audit >> World map opens and closes every live module through the player route
- Location: tests\e2e\menu-interactions.spec.ts:119:3

# Error details

```
Error: locator.click: Error: strict mode violation: getByRole('button', { name: /Balanced/i }) resolved to 2 elements:
    1) <button type="button" data-doctrine-id="breathFocus" class="cultivationExactDoctrineSeal cultivationExactDoctrineSeal--jade">…</button> aka getByRole('button', { name: 'Breath / Focus Balanced' })
    2) <button type="button" aria-pressed="true" class="lifeStartBreathChoice lifeStartBreathChoice--selected" aria-describedby="lifeStartBreathDetailTitle lifeStartBreathDetailSummary">…</button> aka getByRole('button', { name: 'Balanced Neutral cycle.' })

Call log:
  - waiting for getByRole('button', { name: /Balanced/i })

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
            - strong [ref=e25]: "516.23"
        - 'generic "Base 61.17 / s. Breath Balanced. Buffs: No active cultivation tonics." [ref=e26]':
          - img [ref=e28]
          - generic [ref=e31]:
            - generic [ref=e32]: Cultivation Rate
            - strong [ref=e33]: 61.17 / s
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
        - button "Path Heaven" [ref=e86] [cursor=pointer]:
          - img [ref=e88]
          - generic [ref=e91]:
            - generic [ref=e92]: Path
            - strong [ref=e93]: Heaven
        - button "Spirit Root Fire / Mortal" [ref=e95] [cursor=pointer]:
          - img [ref=e97]
          - generic [ref=e99]:
            - generic [ref=e100]: Spirit Root
            - strong [ref=e101]: Fire / Mortal
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
        - region "Qi 516.23 / 100" [ref=e133]:
          - img
          - generic [ref=e139]: Qi 516.23 / 100
          - generic [ref=e140]: +61.17/s
        - region "Cultivation commands" [ref=e141]:
          - button "Break Through" [ref=e142] [cursor=pointer]:
            - generic [ref=e143]: Break Through
          - button "Start Cultivation" [ref=e144] [cursor=pointer]:
            - generic [ref=e145]: Start Cultivation
    - navigation "Primary navigation" [ref=e146]:
      - generic [ref=e147]:
        - button "Status" [ref=e148]:
          - img [ref=e151]
          - generic [ref=e152]: Status
        - button "Cultivation" [ref=e154]:
          - img [ref=e157]
          - generic [ref=e159]: Cultivation
        - button "World" [ref=e161]:
          - img [ref=e164]
          - generic [ref=e165]: World
        - button "Inventory" [ref=e167]:
          - img [ref=e170]
          - generic [ref=e171]: Inventory
        - button "Techniques" [ref=e173]:
          - img [ref=e176]
          - generic [ref=e177]: Techniques
        - button "Records" [ref=e179]:
          - img [ref=e182]
          - generic [ref=e183]: Records
        - button "Prestige" [ref=e185]:
          - img [ref=e188]
          - generic [ref=e189]: Prestige
        - button "Settings" [ref=e191]:
          - img [ref=e194]
          - generic [ref=e199]: Settings
    - dialog "Begin Your New Life" [ref=e203]:
      - generic [ref=e206]:
        - generic [ref=e207]:
          - heading "Begin Your New Life" [level=2] [ref=e208]
          - paragraph [ref=e209]: Choose your path, scripture, and initial breath focus before cultivation begins.
        - list "Life start steps" [ref=e210]:
          - generic [ref=e212]: 1 · Life Path
          - generic [ref=e214]: 2 · Heart Law
          - generic [ref=e216]: 3 · Breath Focus
        - generic [ref=e217]:
          - generic [ref=e218]: "Locked Path: Heaven"
          - paragraph [ref=e219]: Fast cultivation and technique-led pressure. Heaven converts qi tempo into precise offensive windows, but its survival floor is thinner and greed is punished.
          - generic [ref=e220]:
            - generic [ref=e221]: precision_pressure
            - generic [ref=e222]: "Breath: Balanced"
        - generic [ref=e223]:
          - region "Breath focus choices" [ref=e224]:
            - generic [ref=e225]:
              - heading "Choose Breath Focus" [level=3] [ref=e226]
              - paragraph [ref=e227]: Select how this life will pace cultivation breath cycles.
            - generic [ref=e228]:
              - 'button "Balanced Neutral cycle. Steady Qi flow, steady comprehension, and steady stability. Best for: cultivate, recover Selected for this life" [pressed] [ref=e229] [cursor=pointer]':
                - generic [ref=e230]: Chosen
                - generic [ref=e231]: Balanced
                - generic [ref=e232]: Neutral cycle. Steady Qi flow, steady comprehension, and steady stability.
                - generic [ref=e233]: "Best for: cultivate, recover"
                - generic [ref=e234]: Selected for this life
              - 'button "Safe Controlled cycle. Slower Qi flow in exchange for better comprehension and better stability. Best for: prepare breakthrough, recover Select focus" [ref=e235] [cursor=pointer]':
                - generic [ref=e236]: Discipline
                - generic [ref=e237]: Safe
                - generic [ref=e238]: Controlled cycle. Slower Qi flow in exchange for better comprehension and better stability.
                - generic [ref=e239]: "Best for: prepare breakthrough, recover"
                - generic [ref=e240]: Select focus
              - 'button "Fast Aggressive cycle. Faster Qi flow in exchange for worse comprehension and worse stability. Best for: push fast, cultivate Select focus" [ref=e241] [cursor=pointer]':
                - generic [ref=e242]: Discipline
                - generic [ref=e243]: Fast
                - generic [ref=e244]: Aggressive cycle. Faster Qi flow in exchange for worse comprehension and worse stability.
                - generic [ref=e245]: "Best for: push fast, cultivate"
                - generic [ref=e246]: Select focus
          - complementary [ref=e247]:
            - generic [ref=e248]:
              - paragraph [ref=e249]: Breath Discipline
              - heading "Balanced" [level=3] [ref=e250]
              - paragraph [ref=e251]: Neutral cycle. Steady Qi flow, steady comprehension, and steady stability.
              - generic [ref=e252]: "Path: Heaven • Scripture: Ember Thread Sutra"
              - generic [ref=e253]:
                - generic [ref=e254]:
                  - paragraph [ref=e255]: Best for
                  - list [ref=e256]:
                    - listitem [ref=e257]: cultivate
                    - listitem [ref=e258]: recover
                - generic [ref=e259]:
                  - paragraph [ref=e260]: Caution
                  - paragraph [ref=e261]: Good default, but it will not specialize verse progress or short burst farming.
              - generic [ref=e262]:
                - button "Back" [ref=e263]
                - button "Finish" [ref=e264]
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
  8   |   { label: 'Manual Pavilion', root: null },
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
  41  |   await page.getByRole('button', { name: /Select heaven path/i }).click();
  42  |   await expect(page.getByRole('heading', { name: /Choose Your Heart Law/i })).toBeVisible();
  43  | 
  44  |   await page.getByRole('group', { name: 'Heart Law choices' }).getByRole('button').first().click();
  45  |   await expect(page.getByRole('button', { name: /^Next$/ })).toBeEnabled();
  46  |   await page.getByRole('button', { name: /^Next$/ }).click();
  47  |   await expect(page.getByRole('heading', { name: /Choose Breath Focus/i })).toBeVisible();
  48  | 
> 49  |   await page.getByRole('button', { name: /Balanced/i }).click();
      |                                                         ^ Error: locator.click: Error: strict mode violation: getByRole('button', { name: /Balanced/i }) resolved to 2 elements:
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
  142 |       }
  143 | 
  144 |       await assertNoRawLiveLeaks(page);
  145 |       await closeWorldModuleWithEscape(page, module.root);
  146 |     }
  147 | 
  148 |     await expect(consoleFailures, consoleFailures.join('\n')).toEqual([]);
  149 |   });
```