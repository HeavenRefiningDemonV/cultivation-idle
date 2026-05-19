import { expect, test, type Page } from '@playwright/test';

const PAVILION_RECORD_TARGETS = [
  'current_life_and_doctrine.earth_path',
  'gate_trials_and_thresholds.foundation_gate',
  'item.gate_foundation_pill',
  'technique.quiet_breath_method',
] as const;

const PAVILION_VIEWPORTS = [
  { width: 2048, height: 1152 },
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
] as const;

async function openPavilionRecord(page: Page, entryId: string, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.goto(`/?pavilionExact=fixture&pavilionEntry=${encodeURIComponent(entryId)}`);
  await expect(page.getByTestId('pavilion-exact-page')).toBeVisible();
  await expect(page.getByTestId('pavilion-record-viewport')).toBeVisible();
}

async function expectCentralRecordNotClipped(page: Page) {
  const issues = await page.getByTestId('pavilion-record-scroll').evaluate((scroll) => {
    const viewport = scroll.querySelector<HTMLElement>('[data-testid="pavilion-record-viewport"]');
    if (!viewport) return ['missing record viewport'];

    const scrollElement = scroll as HTMLElement;
    const viewportRect = viewport.getBoundingClientRect();
    const header = scroll.querySelector<HTMLElement>('.pavilionExact__recordHeader');
    const headerRect = header?.getBoundingClientRect();
    const routeRail = scroll.querySelector<HTMLElement>('.pavilionExact__routeButtons');
    const routeRect = routeRail?.getBoundingClientRect();
    const clipped: string[] = [];

    if (scrollElement.scrollWidth > scrollElement.clientWidth + 2) {
      clipped.push(`record scroll has horizontal overflow ${scrollElement.scrollWidth}/${scrollElement.clientWidth}`);
    }

    if (headerRect && headerRect.bottom > viewportRect.top - 2) {
      clipped.push('record header overlaps the record viewport');
    }

    if (routeRect && routeRect.top < viewportRect.bottom - 2) {
      clipped.push('route rail overlaps the record viewport');
    }

    const textBearingSelectors = [
      '.pavilionRecordBrief__answer',
      '.pavilionRecordBrief__chip',
      '.pavilionExact__recordSection',
      '.pavilionExact__recordSection p',
      '.pavilionExact__sectionTitleRow h3',
      '.pavilionExact__sectionRow',
      '.pavilionExact__rowLabel',
      '.pavilionExact__rowValue',
    ].join(',');

    viewport.querySelectorAll<HTMLElement>(textBearingSelectors).forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const style = window.getComputedStyle(element);
      const horizontalOverflow = element.scrollWidth > element.clientWidth + 2;
      const verticalOverflow = element.scrollHeight > element.clientHeight + 2;
      const clipsText = style.overflow === 'hidden' || style.overflowX === 'hidden' || style.overflowY === 'hidden';

      if (horizontalOverflow) {
        clipped.push(`${index}:${element.className || element.tagName} horizontal overflow ${element.scrollWidth}/${element.clientWidth}`);
      }

      if (verticalOverflow && clipsText) {
        clipped.push(`${index}:${element.className || element.tagName} clipped vertical text ${element.scrollHeight}/${element.clientHeight}`);
      }
    });

    return clipped;
  });

  expect(issues).toEqual([]);
}

for (const viewport of PAVILION_VIEWPORTS) {
  test.describe(`Pavilion selected record overflow at ${viewport.width}x${viewport.height}`, () => {
    for (const entryId of PAVILION_RECORD_TARGETS) {
      test(`${entryId} keeps central text readable`, async ({ page }) => {
        await openPavilionRecord(page, entryId, viewport);
        await expectCentralRecordNotClipped(page);
      });
    }
  });
}
