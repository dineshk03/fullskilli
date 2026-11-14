const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage();
  const origin = process.env.SMOKE_URL || 'http://127.0.0.1:4173';
  const errors = [];
  const checks = [];
  page.on('pageerror', error => errors.push(error.message));
  // Exercise the compiled application without calling production integrations.
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === origin && !url.pathname.startsWith('/api')) return route.continue();
    if (['fetch', 'xhr'].includes(request.resourceType())) {
      const settings = url.pathname.includes('site-settings');
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        success: true, data: settings ? {} : [], settings: {}, courses: [], categories: [], teamMembers: []
      }) });
    }
    return route.abort();
  });
  try {
    for (const pathname of ['/', '/login', '/courses', '/about']) {
      const start = errors.length;
      await page.goto(origin + pathname, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => document.getElementById('root')?.innerText.length > 50, { timeout: 10000 });
      checks.push({ path: pathname, rendered: true, errors: errors.slice(start) });
    }
    const result = { checks, pageErrors: errors };
    fs.writeFileSync(path.resolve(__dirname, '../../browser-smoke-results.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result, null, 2));
    if (errors.length) process.exitCode = 1;
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
