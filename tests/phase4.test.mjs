import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { serve, launch, openPage, ROOT } from './lib.mjs';

const { projects } = await import(pathToFileURL(path.join(ROOT, 'src', 'data', 'projects.js')).href);

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

test('Phase 4: data file has at least 3 projects with the required fields', () => {
  assert.ok(projects.length >= 3);
  for (const p of projects) {
    assert.ok(p.title && p.description && p.link, `incomplete project: ${JSON.stringify(p)}`);
    assert.ok(Array.isArray(p.tags), `tags must be an array: ${p.title}`);
  }
});

test('Phase 4: one card renders per entry in projects.js', async () => {
  const { page, context } = await openPage(browser, server.url);
  assert.equal(await page.locator('#projects article').count(), projects.length);
  const titles = await page.locator('#projects article h3').allInnerTexts();
  assert.deepEqual(titles, projects.map((p) => p.title));
  await context.close();
});

test('Phase 4: adding an entry to the data file adds a card with no other change', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'phase4-'));
  for (const f of fs.readdirSync(ROOT)) {
    if (['node_modules', '.git', 'tests'].includes(f)) continue;
    fs.cpSync(path.join(ROOT, f), path.join(tmp, f), { recursive: true });
  }
  const dataFile = path.join(tmp, 'src', 'data', 'projects.js');
  fs.appendFileSync(
    dataFile,
    "\nprojects.push({ title: 'Probe project', description: 'temp', tags: ['x'], link: 'https://example.com/probe' });\n"
  );
  const tmpServer = await serve(tmp);
  try {
    const { page, context } = await openPage(browser, tmpServer.url);
    assert.equal(await page.locator('#projects article').count(), projects.length + 1);
    assert.ok((await page.locator('#projects article h3').allInnerTexts()).includes('Probe project'));
    await context.close();
  } finally {
    await tmpServer.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('Phase 4: project link hrefs match the data and external links are safe', async () => {
  const { page, context } = await openPage(browser, server.url);
  const links = await page.evaluate(() =>
    [...document.querySelectorAll('#projects a')].map((a) => ({
      href: a.href,
      target: a.target,
      rel: a.rel,
    }))
  );
  assert.deepEqual(
    links.map((l) => l.href),
    projects.map((p) => new URL(p.link).href)
  );
  for (const l of links) {
    assert.equal(l.target, '_blank');
    assert.ok(l.rel.includes('noopener') && l.rel.includes('noreferrer'), `bad rel: "${l.rel}"`);
  }
  await context.close();
});

test('Phase 4: each card shows its tags', async () => {
  const { page, context } = await openPage(browser, server.url);
  const text = await page.locator('#projects article').allInnerTexts();
  projects.forEach((p, i) => {
    for (const tag of p.tags) assert.ok(text[i].includes(tag), `card "${p.title}" is missing tag "${tag}"`);
  });
  await context.close();
});

test('Phase 4: clicking "Projects" in the nav brings the section into view', async () => {
  const { page, context } = await openPage(browser, server.url);
  await page.locator('header nav a', { hasText: 'Projects' }).click();
  await page.waitForFunction(() => location.hash === '#projects');
  await page.waitForTimeout(800);
  const top = await page.evaluate(() => document.querySelector('#projects').getBoundingClientRect().top);
  assert.ok(top >= 0 && top < 700, `#projects top is ${top}`);
  await context.close();
});

test('Phase 4: grid is a single column at 375px and multi-column on desktop', async () => {
  const columns = async (width) => {
    const { page, context } = await openPage(browser, server.url, {
      viewport: { width, height: 800 },
      isMobile: width < 500,
    });
    const lefts = await page.evaluate(() =>
      [...document.querySelectorAll('#projects article')].map((a) => Math.round(a.getBoundingClientRect().left))
    );
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    await context.close();
    return { count: new Set(lefts).size, fits };
  };
  const mobile = await columns(375);
  assert.equal(mobile.count, 1, 'cards should stack in one column at 375px');
  assert.ok(mobile.fits, 'horizontal overflow at 375px');
  const desktop = await columns(1280);
  assert.ok(desktop.count >= 2, 'cards should use 2+ columns at 1280px');
});

test('Phase 4: console has no errors', async () => {
  const { problems, context } = await openPage(browser, server.url);
  assert.deepEqual(problems, []);
  await context.close();
});
