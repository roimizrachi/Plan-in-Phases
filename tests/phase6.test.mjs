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

test('Phase 6: every link is reachable by keyboard, in page order, with a visible focus outline', async () => {
  const { page, context } = await openPage(browser, server.url);
  const expected = await page.evaluate(() =>
    [...document.querySelectorAll('a[href]')].map((a) => a.textContent.trim() + '|' + a.getAttribute('href'))
  );
  const visited = [];
  for (let i = 0; i < expected.length; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      const s = getComputedStyle(el);
      return {
        id: el.textContent.trim() + '|' + el.getAttribute('href'),
        outlineStyle: s.outlineStyle,
        outlineWidth: parseFloat(s.outlineWidth),
      };
    });
    assert.notEqual(info.outlineStyle, 'none', `no focus outline on ${info.id}`);
    assert.ok(info.outlineWidth >= 2, `focus outline too thin (${info.outlineWidth}px) on ${info.id}`);
    visited.push(info.id);
  }
  assert.deepEqual(visited, expected);
  await context.close();
});

test('Phase 6: page has a lang, a title that names the site, and a meta description', async () => {
  const { page, context } = await openPage(browser, server.url);
  assert.ok((await page.locator('html').getAttribute('lang'))?.length >= 2);
  const siteName = (await page.locator('header .site-name').innerText()).trim();
  const title = await page.title();
  assert.notEqual(title, 'My Site', 'title is still the scaffold default');
  assert.ok(title.includes(siteName), `title "${title}" does not include site name "${siteName}"`);
  const desc = await page.locator('meta[name="description"]').getAttribute('content');
  assert.ok(desc && desc.trim().length > 0, 'meta description is missing or empty');
  await context.close();
});

test('Phase 6: favicon is declared and loads', async () => {
  const { page, context } = await openPage(browser, server.url);
  const href = await page.locator('link[rel~="icon"]').first().getAttribute('href');
  assert.ok(href, 'no <link rel="icon">');
  if (!href.startsWith('data:')) {
    const res = await page.request.get(new URL(href, server.url).href);
    assert.equal(res.status(), 200);
  }
  await context.close();
});

test('Phase 6: semantic landmarks exist exactly once', async () => {
  const { page, context } = await openPage(browser, server.url);
  for (const sel of ['body > #root > header', 'main', 'nav', 'footer']) {
    assert.equal(await page.locator(sel).count(), 1, `expected exactly one ${sel}`);
  }
  assert.ok((await page.locator('main section').count()) >= 3);
  await context.close();
});

for (const width of [375, 768, 1280]) {
  test(`Phase 6: nothing overflows the viewport at ${width}px`, async () => {
    const { page, context } = await openPage(browser, server.url, {
      viewport: { width, height: 800 },
      isMobile: width < 500,
    });
    const result = await page.evaluate(() => {
      const w = window.innerWidth;
      const offenders = [...document.querySelectorAll('body *')]
        .filter((el) => el.getBoundingClientRect().right > w + 0.5)
        .map((el) => el.tagName.toLowerCase() + (el.className ? '.' + el.className : ''));
      return { fits: document.documentElement.scrollWidth <= w, offenders };
    });
    assert.ok(result.fits, 'horizontal scroll present');
    assert.deepEqual(result.offenders, []);
    await context.close();
  });
}

test('Phase 6: console has no errors or warnings', async () => {
  const { problems, context } = await openPage(browser, server.url);
  assert.deepEqual(problems, []);
  await context.close();
});

test('Phase 6: no dead links (empty or "#" href)', async () => {
  const { page, context } = await openPage(browser, server.url);
  const dead = await page.evaluate(() =>
    [...document.querySelectorAll('a')]
      .filter((a) => !a.getAttribute('href') || a.getAttribute('href') === '#')
      .map((a) => a.outerHTML)
  );
  assert.deepEqual(dead, []);
  await context.close();
});

test('Phase 6: no placeholder content (TODO / lorem) in text or HTML', async () => {
  const { page, context } = await openPage(browser, server.url);
  const text = await page.evaluate(() => document.body.innerText);
  const markup = await page.evaluate(() => document.documentElement.outerHTML);
  const pattern = /TODO|lorem/i;
  const textHits = text.split('\n').filter((l) => pattern.test(l));
  const markupHits = markup.split('\n').filter((l) => pattern.test(l)).map((l) => l.trim());
  assert.deepEqual(textHits, [], 'placeholder text still visible');
  assert.deepEqual(markupHits, [], 'placeholder still in the HTML (links, alt, meta, title)');
  await context.close();
});
