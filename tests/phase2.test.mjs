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

test('Phase 2: header, main and footer render in that order', async () => {
  const { page, context } = await openPage(browser, server.url);
  const order = await page.evaluate(() =>
    [...document.querySelectorAll('header, main, footer')].map((el) => el.tagName.toLowerCase())
  );
  assert.deepEqual(order, ['header', 'main', 'footer']);
  await context.close();
});

test('Phase 2: nav has About, Projects and Contact links', async () => {
  const { page, context } = await openPage(browser, server.url);
  const links = await page.evaluate(() =>
    [...document.querySelectorAll('header nav a')].map((a) => [a.textContent.trim(), a.getAttribute('href')])
  );
  assert.deepEqual(links, [
    ['About', '#about'],
    ['Projects', '#projects'],
    ['Contact', '#contact'],
  ]);
  await context.close();
});

test('Phase 2: header shows a site name', async () => {
  const { page, context } = await openPage(browser, server.url);
  const name = await page.locator('header .site-name').innerText();
  assert.ok(name.trim().length > 0);
  await context.close();
});

test('Phase 2: styles.css is loaded and applied', async () => {
  const { page, context } = await openPage(browser, server.url);
  const loaded = await page.evaluate(() =>
    [...document.styleSheets].some((s) => s.href && s.href.endsWith('/styles.css') && s.cssRules.length > 0)
  );
  assert.ok(loaded);
  await context.close();
});

test('Phase 2: no horizontal overflow at 375x667 and text is readable', async () => {
  const { page, context } = await openPage(browser, server.url, {
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const result = await page.evaluate(() => ({
    fits: document.documentElement.scrollWidth <= window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    fontSize: parseFloat(getComputedStyle(document.body).fontSize),
  }));
  assert.ok(result.fits, `scrollWidth ${result.scrollWidth} > innerWidth ${result.innerWidth}`);
  assert.ok(result.fontSize >= 16, `body font-size ${result.fontSize}px is below 16px`);
  await context.close();
});

test('Phase 2: nav links stay on screen at 375px', async () => {
  const { page, context } = await openPage(browser, server.url, {
    viewport: { width: 375, height: 667 },
    isMobile: true,
  });
  const boxes = await page.evaluate(() =>
    [...document.querySelectorAll('header nav a')].map((a) => {
      const r = a.getBoundingClientRect();
      return { left: r.left, right: r.right };
    })
  );
  assert.equal(boxes.length, 3);
  for (const b of boxes) assert.ok(b.left >= 0 && b.right <= 375, `link outside viewport: ${JSON.stringify(b)}`);
  await context.close();
});

test('Phase 2: dark mode follows the system setting', async () => {
  const bg = async (colorScheme) => {
    const { page, context } = await openPage(browser, server.url, { colorScheme });
    const value = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await context.close();
    return value;
  };
  const light = await bg('light');
  const dark = await bg('dark');
  assert.notEqual(light, dark, 'background is the same in light and dark mode');
});

test('Phase 2: console has no errors', async () => {
  const { problems, context } = await openPage(browser, server.url);
  assert.deepEqual(problems, []);
  await context.close();
});
