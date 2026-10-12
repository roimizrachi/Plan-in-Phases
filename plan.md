# Personal Website — Build Plan

**Stack:** plain HTML + React 19 via ES modules and an import map (esm.sh), `htm` for JSX-like templates. No build step, no Node dependencies beyond a static file server.

**Sections:** About, Projects, Contact.

**Rules**
- Phases are done in order, but each leaves the site in a working state.
- A phase is **not done until its test passes**. If a test fails, fix it before moving on.
- Tests are manual checks in the browser unless noted. Run the site with `npx serve` (or `python -m http.server 8000`) from the project root. Opening via `file://` will not work because browsers block ES modules there.

## Decisions

**Confirmed**
- Option 2 (import map, ES modules, `htm`) is the stack.
- Phase 1 test includes a `useState` counter and pinned versions, to prove a single React instance.
- Phase 2 responsive test uses 375×667 device emulation plus `scrollWidth <= innerWidth`.
- Phase 3 allows `TODO` placeholders. Phase 6 enforces that none remain, and also that no links are dead (`#` or empty).
- Phase 4 and 5 link tests are console checks of `href`, `target` and `rel`. Phase 5 also keeps the Outlook click test (Outlook is the user's default mail app).
- GitHub is the home for the project: the repo is hosted on GitHub and the site is deployed with GitHub Pages.
- Phase 6 keeps the Lighthouse 90+ bar and the keyboard check as written. Stricter checks were declined because this is a test project, so completeness is not a goal.

**Implementation notes**
- Tests are automated now, at the user's request ("write and run its tests"). They live in `tests/` (one `phaseN.test.mjs` per phase) and run with `npm test`. They use `playwright-core` (the only dev dependency) driving the installed Microsoft Edge, with a built-in static server in `tests/lib.mjs`. This replaces the earlier "manual checks only" default.
- Phase tests are cumulative: every earlier phase's tests must keep passing.
- Not automatable: the Phase 5 Outlook click test (it needs the desktop mail app), so it stays manual.
- Lighthouse accessibility is run on demand with `npx lighthouse` against a local server (score 100 at the time of Phase 6).
- `package.json` uses `"type": "module"` because all project `.js` files are ES modules.
- The site-name link points to `#top` (the header's id), because Phase 6 forbids `href="#"`.
- Content (test project): name "Roei Mazar", meta description `desc...` and bio `blabla` were given by the user and used verbatim. The three projects are generated samples; two of them link to `example.com`.
- No public email or LinkedIn (the user said no need). `contact.email` is `null`, the email link is hidden when it is `null`, and the Phase 5 tests allow either state. Contact shows GitHub only. To add an email later, set `contact.email` in `src/data/contact.js`, and then do the manual Outlook click test.
- Because the given text is very short, two test thresholds were relaxed to match the plan (non-empty): About body text and the meta description.

**Working defaults** (proposed, not explicitly confirmed; change if wrong)
- One scrolling page with anchor links, no router.
- Clean minimal design, light/dark following the system setting.
- Placeholder content marked `TODO` until the user supplies real content.
- CDN with pinned versions, no vendoring.
- Manual checks only, no test tooling.
- GitHub Pages on the default URL, no custom domain. This needs `git init` (the folder is not a git repo yet).
- Environment checked: Node, npx, Python and git are installed.

---

## Target file structure

```
index.html
styles.css
src/
  main.js          entry, mounts <App />
  App.js           composes the page
  html.js          binds htm to React.createElement (exports `html`)
  components/
    Header.js
    Footer.js
    About.js
    Projects.js
    ProjectCard.js
    Contact.js
  data/
    projects.js    project list as plain data
```

---

## Phase 1: Scaffold

**Goal:** A page that loads React 19 from the CDN through an import map and renders a placeholder component that uses a hook, proving there is a single working React instance.

**Files touched:**
- `index.html` (import map with **exact pinned versions**, `react-dom` configured to reuse the same `react` (e.g. esm.sh `?external=react`), `<div id="root">`, `<script type="module" src="src/main.js">`)
- `src/html.js`
- `src/main.js`
- `src/App.js` (placeholder text plus a temporary `useState` click counter)

**Test:**
1. Serve the folder and open `http://localhost:<port>`.
2. The placeholder text (e.g. "Hello") appears.
3. Clicking the counter button increases the number. (This proves hooks work, which fails with "Invalid hook call" if `react` and `react-dom` load as two separate copies.)
4. Browser console shows no errors and no failed network requests.
5. Changing the text in `App.js` and refreshing changes what is shown.
6. Before moving to Phase 2, delete the counter.

---

## Phase 2: Layout and styling base

**Goal:** Site shell with header (name + nav links), main area, and footer. Base styles, responsive down to phone width.

**Files touched:**
- `styles.css` (new, linked from `index.html`)
- `src/components/Header.js`, `src/components/Footer.js` (new)
- `src/App.js` (compose Header, main, Footer)

**Test:**
1. Header, main area and footer render in that order.
2. Nav shows links for About, Projects, Contact (they may point to empty sections for now).
3. Open dev tools device emulation (F12, device toolbar) at 375×667. In the console, `document.documentElement.scrollWidth <= window.innerWidth` returns `true` (no horizontal overflow), and text stays readable.
4. Console shows no errors.

---

## Phase 3: About section

**Goal:** An About section with a heading, a short bio, and optionally a photo.

**Files touched:**
- `src/components/About.js` (new)
- `src/App.js` (add `<About />` with `id="about"`)
- `styles.css` (section styles)

**Test:**
1. `document.querySelector('#about')` exists and its `innerText` is non-empty. Placeholder text marked `TODO` is allowed at this stage (Phase 6 enforces that none remains).
2. Clicking "About" in the nav scrolls to the section.
3. If a photo is used, it has `alt` text and does not overflow at 375px width.

---

## Phase 4: Projects section

**Goal:** A Projects section that renders a card per project from a data file, so adding a project means editing data only.

**Files touched:**
- `src/data/projects.js` (new: array of `{ title, description, tags, link }`)
- `src/components/ProjectCard.js`, `src/components/Projects.js` (new)
- `src/App.js` (add `<Projects />` with `id="projects"`)
- `styles.css` (card grid)

**Test:**
1. One card renders per entry in `projects.js`.
2. Add a temporary extra entry to the data file, refresh: a new card appears with no other code change. Remove it afterward.
3. In the console, `[...document.querySelectorAll('#projects a')].map(a => [a.href, a.target, a.rel])` lists every project link. Each `href` matches its entry in `projects.js`, and every external link has `rel="noopener noreferrer"`.
4. Grid reflows to a single column at 375px width.

---

## Phase 5: Contact section

**Goal:** A Contact section with ways to reach you: email link and social links. (A form is out of scope. It needs a backend or a third-party service and can be a later addition.)

**Files touched:**
- `src/components/Contact.js` (new)
- `src/App.js` (add `<Contact />` with `id="contact"`)
- `styles.css`

**Test:**
1. Clicking the email link opens a new Outlook message with the correct address in the To field.
2. In the console, `[...document.querySelectorAll('#contact a')].map(a => [a.getAttribute('href'), a.target, a.rel])` shows the email link as exactly `mailto:<your address>`, and every social link with its intended profile URL, `target="_blank"` and `rel="noopener noreferrer"`.
3. Clicking "Contact" in the nav scrolls to the section.

---

## Phase 6: Polish and accessibility

**Goal:** Finishing pass: page title and meta description, favicon, semantic HTML, keyboard and contrast checks, dark/light handling if wanted.

**Files touched:**
- `index.html` (title, meta description, favicon, `lang`)
- `styles.css` (focus styles, contrast fixes)
- Components as needed (semantic tags: `header`, `nav`, `main`, `section`, `footer`)

**Test:**
1. Tab through the page: every link is reachable and shows a visible focus outline.
2. Browser dev-tools Lighthouse (or equivalent) accessibility score is 90+ with no contrast failures.
3. Tab title and favicon are correct.
4. Full page looks right at 375px, 768px and 1280px widths.
5. Console shows no errors or warnings.
6. No dead links: `[...document.querySelectorAll('a')].filter(a => !a.getAttribute('href') || a.getAttribute('href') === '#')` returns an empty array.
7. No placeholder content remains: `/TODO|lorem/i.test(document.body.innerText)` returns `false`, and the same check on `document.documentElement.outerHTML` (alt text, links, meta tags) also returns `false`.

---

## Phase 7: Deploy

**Goal:** The site is live at a public URL as static files.

**Files touched:**
- None required. Optionally a `README.md` with run and deploy notes.
- Prerequisite: the folder must be a git repo with a GitHub remote (`git init` has not been run yet).

**Host options:** GitHub Pages, Netlify or Cloudflare Pages.

**Test:**
1. The public URL loads and renders the full site.
2. Nav links, project links and the email link all work on the live site.
3. The site loads on a phone.

---

## Out of scope (possible later)
- Contact form with a backend
- Blog or multiple pages (the point to consider moving to Vite)
- Server-side rendering for SEO
