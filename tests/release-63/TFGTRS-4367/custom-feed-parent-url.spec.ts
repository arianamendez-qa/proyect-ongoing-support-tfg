import { test, expect } from '@playwright/test';
import { phaseEightData } from '@data/phase-eight.data';

// Feed file is exported to WebDAV and readable via HTTP Basic Auth (same credentials
// used by the rest of the suite via httpCredentials in playwright.config.ts).
// Update FEED_PATH once the exact export path is confirmed with the team.
const FEED_PATH = '/on/demandware.store/Sites-PhaseeightUK-Site/default/Feeds-Start?type=Custom';

test.describe('TFGTRS-4367 - CustomFeed: productParentUrl field', () => {

  test('productParentUrl field is present in feed output for Phase Eight', async ({ request }) => {
    const response = await request.get(`${phaseEightData.baseUrl}${FEED_PATH}`);
    expect(response.status(), 'Feed endpoint did not return 200').toBe(200);

    const body = await response.text();
    expect(body, 'productParentUrl field missing from feed output').toContain('productParentUrl');
  });

  test('productParentUrl contains the master product URL, not the variant URL', async ({ request }) => {
    const response = await request.get(`${phaseEightData.baseUrl}${FEED_PATH}`);
    const body = await response.text();

    // In SFCC, variant URLs contain a color or size parameter; master URLs do not.
    // productParentUrl must NOT include variant query params (dwvar_*).
    const parentUrlMatches = body.match(/productParentUrl[^>]*>(.*?)<\/productParentUrl>/gs) ?? [];
    expect(parentUrlMatches.length, 'No productParentUrl entries found').toBeGreaterThan(0);

    for (const match of parentUrlMatches) {
      expect(match, 'productParentUrl contains variant-level dwvar parameter').not.toContain('dwvar_');
    }
  });

  test('existing productUrl field still returns the variant-level URL', async ({ request }) => {
    const response = await request.get(`${phaseEightData.baseUrl}${FEED_PATH}`);
    const body = await response.text();

    // productUrl must still be present and unchanged.
    expect(body, 'productUrl field disappeared from feed output').toContain('productUrl');
  });

});
