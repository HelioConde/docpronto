const { test, expect } = require('@playwright/test');

test('não salva links privados de propostas no cache e preserva outros apps', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const foreign = await caches.open('agendaleve-shell-sentinel');
    await foreign.put('/foreign-app-data', new Response('preserved'));
    await navigator.serviceWorker.register('./sw.js');
    await navigator.serviceWorker.ready;
  });

  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  const legacyUrl = '/?proposta=11111111-1111-4111-8111-111111111111&token=private-regression-token';
  await page.goto(legacyUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    await fetch('./version.json?token=private-regression-token', { cache: 'no-store' });
  });
  const result = await page.evaluate(async () => {
    const names = await caches.keys();
    const urls = [];
    for (const name of names) {
      const cache = await caches.open(name);
      urls.push(...(await cache.keys()).map(request => request.url));
    }
    const foreign = await caches.open('agendaleve-shell-sentinel');
    return { names, urls, preserved: await (await foreign.match('/foreign-app-data'))?.text() };
  });
  expect(result.names).toContain('docpronto-shell-v2');
  expect(result.preserved).toBe('preserved');
  expect(result.urls.some(url => url.includes('private-regression-token'))).toBe(false);
  expect(result.urls.some(url => url.includes('version.json?'))).toBe(false);
});

test('PWA mantém edição local offline após ativação do service worker', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('./sw.js');
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('form#form')).toBeAttached();
  await context.setOffline(false);
});
