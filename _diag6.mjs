import { chromium, devices } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();
const creds = { username: process.env.BASIC_AUTH_USERNAME, password: process.env.BASIC_AUTH_PASSWORD };
const browser = await chromium.launch();
const context = await browser.newContext({ httpCredentials: creds, ...devices['Desktop Chrome'] });
const page = await context.newPage();
await page.goto(process.env.HOBBS_BASE_URL, { waitUntil: 'domcontentloaded' });

// Aceptar cookies de forma robusta (esperar a que el botón aparezca, hasta 15s)
const accept = page.locator('#onetrust-accept-btn-handler');
try {
  await accept.waitFor({ state: 'visible', timeout: 15000 });
  await accept.click();
  await page.locator('#onetrust-consent-sdk .onetrust-pc-dark-filter, #onetrust-banner-sdk')
    .first().waitFor({ state: 'hidden', timeout: 8000 }).catch(()=>{});
  console.log('cookies: aceptadas');
} catch { console.log('cookies: no apareció banner'); }

const sb = page.getByRole('searchbox').first();
await sb.fill('dress');
await sb.press('Enter');
await page.waitForURL(/\/search/, { timeout: 30000 }).catch(()=>{});
console.log('url:', page.url());

// Esperar pacientemente productos (Constructor.io async)
const tile = page.locator('.product-tile').first();
const ok = await tile.waitFor({ state: 'visible', timeout: 30000 }).then(()=>true).catch(()=>false);
console.log('tile visible en 30s?', ok, 'count:', await page.locator('.product-tile').count());
console.log('result count text:', (await page.locator('.filters__result-count').first().textContent().catch(()=>null))?.replace(/\s+/g,' ').trim().slice(0,40));
await browser.close();
