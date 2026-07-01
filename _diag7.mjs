import { chromium, devices } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();
const creds = { username: process.env.BASIC_AUTH_USERNAME, password: process.env.BASIC_AUTH_PASSWORD };
const browser = await chromium.launch();
const context = await browser.newContext({ httpCredentials: creds, ...devices['Desktop Chrome'] });
const page = await context.newPage();
await page.goto(process.env.HOBBS_BASE_URL, { waitUntil: 'domcontentloaded' });
const accept = page.locator('#onetrust-accept-btn-handler');
try { await accept.waitFor({ state: 'visible', timeout: 12000 }); await accept.click(); } catch {}

const sb = page.getByRole('searchbox').first();
await sb.fill('dress');
await sb.press('Enter');
await page.waitForURL(/\/search/, { timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(8000);

console.log('url:', page.url());
console.log('.product-grid existe:', await page.locator('.product-grid').count());
console.log('[class*=product] count:', await page.locator('[class*="product"]').count());
console.log('hay searchbox con texto dress?:', await page.getByRole('searchbox').first().inputValue().catch(()=>'?'));
// ¿reload server-side recupera productos?
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
console.log('tras RELOAD -> tiles:', await page.locator('.product-tile').count());
await browser.close();
