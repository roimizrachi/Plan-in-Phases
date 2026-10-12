import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { serve, launch, openPage, ROOT } from './lib.mjs';

const { contact } = await import(pathToFileURL(path.join(ROOT, 'src', 'data', 'contact.js')).href);

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

test('Phase 5: contact data has a valid-looking email (if set) and at least one social link', () => {
  if (contact.email !== null) assert.match(contact.email, /^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  assert.ok(contact.socials.length >= 1);
  for (const s of contact.socials) {
    assert.ok(s.label, 'social link needs a label');
    assert.doesNotThrow(() => new URL(s.url), `bad social url: ${s.url}`);
  }
});

test('Phase 5: #contact exists inside main with a heading', async () => {
  const { page, context } = await openPage(browser, server.url);
  assert.equal(await page.locator('main #contact').count(), 1);
  assert.ok((await page.locator('#contact h2').innerText()).trim().length > 0);
  await context.close();
});

test('Phase 5: email link is exactly mailto:<address>, or absent when no email is set', async () => {
  const { page, context } = await openPage(browser, server.url);
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll('#contact a')].map((a) => a.getAttribute('href'))
  );
  const mailtos = hrefs.filter((h) => h.startsWith('mailto:'));
  if (contact.email === null) {
    assert.deepEqual(mailtos, [], 'no email is set, so there must be no mailto link');
  } else {
    assert.deepEqual(mailtos, [`mailto:${contact.email}`]);
  }
  await context.close();
});

test('Phase 5: social links have the intended URLs, target _blank and rel noopener noreferrer', async () => {
  const { page, context } = await openPage(browser, server.url);
  const links = await page.evaluate(() =>
    [...document.querySelectorAll('#contact a')]
      .filter((a) => !a.getAttribute('href').startsWith('mailto:'))
      .map((a) => ({ href: a.getAttribute('href'), text: a.textContent.trim(), target: a.target, rel: a.rel }))
  );
  assert.deepEqual(
    links.map((l) => [l.text, l.href]),
    contact.socials.map((s) => [s.label, s.url])
  );
  for (const l of links) {
    assert.equal(l.target, '_blank');
    assert.ok(l.rel.includes('noopener') && l.rel.includes('noreferrer'), `bad rel: "${l.rel}"`);
  }
  await context.close();
});

test('Phase 5: clicking "Contact" in the nav brings the section into view', async () => {
  const { page, context } = await openPage(browser, server.url);
  await page.locator('header nav a', { hasText: 'Contact' }).click();
  await page.waitForFunction(() => location.hash === '#contact');
  await page.waitForTimeout(800);
  const top = await page.evaluate(() => document.querySelector('#contact').getBoundingClientRect().top);
  assert.ok(top >= 0 && top < 700, `#contact top is ${top}`);
  await context.close();
});

test('Phase 5: no horizontal overflow at 375px', async () => {
  const { page, context } = await openPage(browser, server.url, {
    viewport: { width: 375, height: 667 },
    isMobile: true,
  });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await context.close();
});

test('Phase 5: console has no errors', async () => {
  const { problems, context } = await openPage(browser, server.url);
  assert.deepEqual(problems, []);
  await context.close();
});
