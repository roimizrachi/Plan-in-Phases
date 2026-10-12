import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serve, launch, openPage, ROOT } from './lib.mjs';

// Phase 1 (scaffold). The temporary useState counter was verified when the phase
// went green (0 -> 2 after two clicks) and then deleted, as the plan requires.
// These checks stay valid for every later phase.

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

test('Phase 1: React renders content into #root', async () => {
  const { page, context } = await openPage(browser, server.url);
  assert.ok((await page.locator('#root').innerText()).trim().length > 0);
  await context.close();
});

test('Phase 1: console has no errors and no failed requests', async () => {
  const { problems, context } = await openPage(browser, server.url);
  assert.deepEqual(problems, []);
  await context.close();
});

test('Phase 1: import map pins exact versions and keeps react external', async () => {
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const map = JSON.parse(indexHtml.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
  for (const [name, url] of Object.entries(map)) {
    assert.match(url, /@\d+\.\d+\.\d+/, `${name} is not pinned to an exact version: ${url}`);
  }
  assert.match(map['react-dom'], /external=react/);
  assert.match(map['react-dom/client'], /external=react/);
});

test('Phase 1: editing the source changes the rendered page', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'phase1-'));
  for (const f of fs.readdirSync(ROOT)) {
    if (['node_modules', '.git', 'tests'].includes(f)) continue;
    fs.cpSync(path.join(ROOT, f), path.join(tmp, f), { recursive: true });
  }
  const mainFile = path.join(tmp, 'src', 'main.js');
  fs.writeFileSync(mainFile, "document.title = 'edited-probe';\n" + fs.readFileSync(mainFile, 'utf8'));
  const tmpServer = await serve(tmp);
  try {
    const { page, context } = await openPage(browser, tmpServer.url);
    assert.equal(await page.title(), 'edited-probe');
    await context.close();
  } finally {
    await tmpServer.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
