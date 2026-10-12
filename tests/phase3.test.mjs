import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { serve, launch, openPage, ROOT } from './lib.mjs';

let server;
let browser;

before(async () => {
  server = await serve(ROOT);
  browser = await launch();
});

after(async () => {
  await browser.close();
  await server.close();
});

test('Phase 3: #about exists inside main with a heading and non-empty text', async () => {
  const { page, context } = await openPage(browser, server.url);
  assert.equal(await page.locator('main #about').count(), 1);
  assert.ok((await page.locator('#about h2').innerText()).trim().length > 0, 'About has no h2 heading');
  const text = await page.evaluate(() => document.querySelector('#about').innerText.trim());
  assert.ok(text.length > 'About'.length, `About has no body text: "${text}"`);
  await context.close();
});

test('Phase 3: clicking "About" in the nav brings the section into view', async () => {
  const { page, context } = await openPage(browser, server.url);
  await page.locator('header nav a', { hasText: 'About' }).click();
  await page.waitForFunction(() => location.hash === '#about');
  await page.waitForTimeout(800); // smooth scroll
  const top = await page.evaluate(() => document.querySelector('#about').getBoundingClientRect().top);
  const height = await page.evaluate(() => window.innerHeight);
  assert.ok(top >= 0 && top < height, `#about top is ${top}, viewport height ${height}`);
  await context.close();
});

test('Phase 3: any image in About has alt text and fits at 375px', async () => {
  const { page, context } = await openPage(browser, server.url, {
    viewport: { width: 375, height: 667 },
    isMobile: true,
  });
  const images = await page.evaluate(() =>
    [...document.querySelectorAll('#about img')].map((img) => ({
      alt: img.getAttribute('alt'),
      right: img.getBoundingClientRect().right,
    }))
  );
  for (const img of images) {
    assert.ok(img.alt && img.alt.trim().length > 0, 'image is missing alt text');
    assert.ok(img.right <= 375, `image overflows: right edge at ${img.right}`);
  }
  const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  assert.ok(fits, 'horizontal overflow at 375px');
  await context.close();
});

test('Phase 3: console has no errors', async () => {
  const { problems, context } = await openPage(browser, server.url);
  assert.deepEqual(problems, []);
  await context.close();
});
