# Public CV Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish Serhii Tsybulnyk's CV as a public GitHub Pages site with two content variants, two languages and four generated PDFs.

**Architecture:** A static site with no build step for the page itself. All content lives in one `data/cv.json` file holding an `en` and a `ua` tree; nodes carry an optional `variants` array. Two thin HTML shells (`index.html` for the redacted variant, `full/index.html` for the full one) load the same ES module, which filters the tree by variant and language and renders the two-column layout. Pure helper functions are exported so they can be unit-tested under `node:test` with no browser. A GitHub Actions workflow prints the four PDF combinations with Playwright and commits them back.

**Tech Stack:** Vanilla HTML/CSS/ES modules, Node 22 with the built-in `node:test` runner (no npm dependencies for tests), Playwright Chromium in CI, GitHub Pages from `main`.

**Spec:** `docs/superpowers/specs/2026-09-04-cv-github-pages-design.md`

## Global Constraints

- **No employer name anywhere.** The strings `CERT-UA`, `CERT UA`, `Держспецзв` and `State Service of Special Communications` must not appear in any committed file. Organisations render as `Confidential (NDA)`.
- **Telegram is never published.** No Telegram handle or link in any file.
- **GitHub profile is not linked** from the CV.
- **Phone `+38 (096) 038-01-55` renders only when the URL carries `?pdf=1`**, which is what the PDF build uses. It is stored base64-encoded in `cv.json`.
- **Email `tsserg@protonmail.com` is stored base64-encoded** and decoded in JS.
- **Colour tokens, verbatim:** `--sidebar-bg: #1a1a1d`, `--sidebar-fg: #a8adb5`, `--sidebar-head: #ffffff`, `--accent: #c7ccd4`, `--accent-print: #4b5058`, `--paper: #ffffff`, `--ink: #191d23`, `--ink-muted: #4a515c`, `--rule: #eaecef`.
- **Variant ids are exactly** `redacted` and `full`. Language ids are exactly `en` and `ua`.
- **No runtime dependencies.** No framework, no CDN script, no npm package used by the page.
- **Repository is public.** Nothing confidential is committed.

---

## File Structure

| File | Responsibility |
|---|---|
| `data/cv.json` | All content, both languages, variant tags. The only file edited to update the CV. |
| `assets/cv.js` | Pure logic: variant filtering, language selection, date formatting, base64 decoding. No DOM. Unit-tested. |
| `assets/render.js` | DOM rendering and page wiring: builds the sidebar and main column, language toggle, PDF link. Imports `cv.js`. |
| `assets/style.css` | Tokens, two-column layout, responsive stack, dark mode. |
| `assets/print.css` | A4 print rules, chrome hidden, page-break control. |
| `index.html` | Redacted-variant shell, `data-variant="redacted"`. |
| `full/index.html` | Full-variant shell, `data-variant="full"`, asset paths one level up. |
| `tests/cv.test.mjs` | Unit tests for `assets/cv.js`. |
| `tests/content.test.mjs` | Content and OPSEC validation of `data/cv.json` and the repository tree. |
| `.github/workflows/pdf.yml` | Playwright PDF generation, commits `pdf/*.pdf`. |
| `README.md` | How to edit content, run tests, and how PDFs are produced. |

`cv.js` and `render.js` are split because only the first is testable without a browser; keeping DOM code out of it is what makes the test suite dependency-free.

---

### Task 1: Content model and validation

**Files:**
- Create: `data/cv.json`
- Create: `assets/cv.js`
- Test: `tests/cv.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `decodeContact(encoded: string): string`
  - `visibleIn(node: object, variant: string): boolean`
  - `pickLang(data: object, lang: string): object`
  - `filterList(list: array, variant: string): array`
  - `formatRange(from: string, to: string|null, lang: string, now?: Date): string`

- [ ] **Step 1: Write the failing test**

Create `tests/cv.test.mjs`:

```javascript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decodeContact, visibleIn, pickLang, filterList, formatRange } from '../assets/cv.js'

test('decodeContact decodes base64 to utf-8', () => {
  assert.equal(decodeContact('dHNzZXJnQHByb3Rvbm1haWwuY29t'), 'tsserg@protonmail.com')
})

test('a node without variants is visible in every variant', () => {
  assert.equal(visibleIn({ title: 'x' }, 'redacted'), true)
  assert.equal(visibleIn({ title: 'x' }, 'full'), true)
})

test('a node listing only full is hidden from redacted', () => {
  const node = { title: 'CTF Scenario Developer', variants: ['full'] }
  assert.equal(visibleIn(node, 'full'), true)
  assert.equal(visibleIn(node, 'redacted'), false)
})

test('filterList keeps order and drops hidden nodes', () => {
  const list = [{ id: 'a' }, { id: 'b', variants: ['full'] }, { id: 'c' }]
  assert.deepEqual(filterList(list, 'redacted').map(n => n.id), ['a', 'c'])
  assert.deepEqual(filterList(list, 'full').map(n => n.id), ['a', 'b', 'c'])
})

test('pickLang returns the requested tree', () => {
  const data = { en: { name: 'Serhii' }, ua: { name: 'Сергій' } }
  assert.equal(pickLang(data, 'ua').name, 'Сергій')
})

test('pickLang falls back to English for an unknown language', () => {
  const data = { en: { name: 'Serhii' }, ua: { name: 'Сергій' } }
  assert.equal(pickLang(data, 'de').name, 'Serhii')
})

test('pickLang fills a missing Ukrainian key from English', () => {
  const data = { en: { name: 'Serhii', role: 'Security Engineer' }, ua: { name: 'Сергій' } }
  assert.equal(pickLang(data, 'ua').role, 'Security Engineer')
})

test('formatRange renders an open-ended English range with duration', () => {
  const now = new Date('2026-09-04T00:00:00Z')
  assert.equal(formatRange('2021-07', null, 'en', now), 'Jul 2021 — present · 5 yr 2 mo')
})

test('formatRange renders a closed English range without duration', () => {
  const now = new Date('2026-09-04T00:00:00Z')
  assert.equal(formatRange('2017-09', '2021-07', 'en', now), 'Sep 2017 — Jul 2021')
})

test('formatRange renders Ukrainian months and present marker', () => {
  const now = new Date('2026-09-04T00:00:00Z')
  assert.equal(formatRange('2026-01', null, 'ua', now), 'січ. 2026 — дотепер · 8 міс')
})

test('formatRange omits the year part when under a year', () => {
  const now = new Date('2026-09-04T00:00:00Z')
  assert.equal(formatRange('2026-06', null, 'en', now), 'Jun 2026 — present · 3 mo')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/`
Expected: FAIL — `Cannot find module .../assets/cv.js`

- [ ] **Step 3: Write minimal implementation**

Create `assets/cv.js`:

```javascript
const MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ua: ['січ.', 'лют.', 'бер.', 'квіт.', 'трав.', 'черв.', 'лип.', 'серп.', 'вер.', 'жовт.', 'лист.', 'груд.']
}

const WORDS = {
  en: { present: 'present', yr: 'yr', mo: 'mo' },
  ua: { present: 'дотепер', yr: 'р', mo: 'міс' }
}

export function decodeContact(encoded) {
  const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function visibleIn(node, variant) {
  if (!node || !Array.isArray(node.variants)) return true
  return node.variants.includes(variant)
}

export function filterList(list, variant) {
  if (!Array.isArray(list)) return []
  return list.filter(node => visibleIn(node, variant))
}

export function pickLang(data, lang) {
  const base = data.en ?? {}
  if (lang === 'en' || !data[lang]) return base
  return { ...base, ...data[lang] }
}

function parseMonth(value) {
  const [year, month] = value.split('-').map(Number)
  return { year, month }
}

function label(value, lang) {
  const { year, month } = parseMonth(value)
  return `${MONTHS[lang][month - 1]} ${year}`
}

export function formatRange(from, to, lang, now = new Date()) {
  const words = WORDS[lang] ?? WORDS.en
  const start = label(from, lang)
  if (to) return `${start} — ${label(to, lang)}`

  const begin = parseMonth(from)
  const months =
    (now.getUTCFullYear() - begin.year) * 12 + (now.getUTCMonth() + 1 - begin.month)
  const years = Math.floor(months / 12)
  const rest = months % 12
  const parts = []
  if (years > 0) parts.push(`${years} ${words.yr}`)
  if (rest > 0 || years === 0) parts.push(`${rest} ${words.mo}`)
  return `${start} — ${words.present} · ${parts.join(' ')}`
}
```

Node 22 provides `atob` and `TextDecoder` globally, so this module runs unchanged in both the browser and the test runner.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/`
Expected: PASS, 11 tests.

- [ ] **Step 5: Write `data/cv.json`**

Create `data/cv.json` with the full content from the spec's "Content (final copy)" section. Base64 values: email `dHNzZXJnQHByb3Rvbm1haWwuY29t`, phone `KzM4ICgwOTYpIDAzOC0wMS01NQ==`.

Structure, with every list item that is CTF-scenario work tagged `"variants": ["full"]` and everything else untagged:

```json
{
  "meta": { "updated": "2026-09-04", "defaultLang": "en" },
  "en": {
    "name": "Serhii Tsybulnyk",
    "role": "Security Engineer — EASM · Detection Engineering · Security Automation & AI",
    "location": "Kyiv, Ukraine",
    "contacts": {
      "email": "dHNzZXJnQHByb3Rvbm1haWwuY29t",
      "linkedin": "https://linkedin.com/in/serhii-tsybulnyk-b33667195",
      "phone": "KzM4ICgwOTYpIDAzOC0wMS01NQ=="
    },
    "labels": {
      "profile": "Profile", "experience": "Experience", "selected": "Selected work",
      "certifications": "Certifications & training", "training": "SANS training",
      "contact": "Contact", "education": "Education", "languages": "Languages",
      "interests": "Interests", "download": "Download PDF"
    },
    "profile": "Security Engineer with 5+ years across SOC L1–L3, incident response and DFIR, detection engineering and External Attack Surface Management. Build production security tooling and automation, including a web platform built on top of a CLI-only attack-surface scanner, covering 2,000+ client organisations and 15,000+ tracked assets. Apply LLM/MCP and agentic workflows to security automation and engineering.",
    "experience": [ "…three entries per spec…" ],
    "selected": [ "…four entries per spec…" ],
    "skills": { "…four groups per spec…": [] },
    "certifications": { "certs": [], "training": [] },
    "education": [],
    "languages": ["English — B2", "Ukrainian — native"],
    "interests": ["Web development", "AI agents", "CTF"]
  },
  "ua": { "…mirror of every key above…" }
}
```

Write out every entry in full — no ellipses in the actual file. The Ukrainian tree mirrors the English one key for key; technical terms (EASM, DFIR, SIEM, Sigma, YARA, product and vendor names) stay in their original Latin form.

- [ ] **Step 6: Write the content and OPSEC test**

Create `tests/content.test.mjs`:

```javascript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { filterList, pickLang, decodeContact } from '../assets/cv.js'

const cv = JSON.parse(readFileSync(new URL('../data/cv.json', import.meta.url), 'utf8'))

const FORBIDDEN = ['CERT-UA', 'CERT UA', 'Держспецзв', 'State Service of Special Communications', 'telegram', 't.me']

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (['.git', 'node_modules', '.superpowers', 'pdf', 'docs'].includes(name)) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, files)
    else files.push(full)
  }
  return files
}

test('both language trees expose the same keys', () => {
  assert.deepEqual(Object.keys(cv.en).sort(), Object.keys(cv.ua).sort())
})

test('no employer is named in either tree', () => {
  const text = JSON.stringify(cv)
  for (const term of FORBIDDEN) {
    assert.ok(!text.toLowerCase().includes(term.toLowerCase()), `found "${term}" in cv.json`)
  }
})

test('no committed source file names an employer or Telegram', () => {
  for (const file of walk(new URL('..', import.meta.url).pathname)) {
    const text = readFileSync(file, 'utf8').toLowerCase()
    for (const term of FORBIDDEN) {
      assert.ok(!text.includes(term.toLowerCase()), `found "${term}" in ${file}`)
    }
  }
})

test('every experience entry hides its employer behind NDA', () => {
  for (const lang of ['en', 'ua']) {
    for (const job of cv[lang].experience) {
      assert.match(job.org, /NDA/, `${lang}: ${job.role} does not say NDA`)
    }
  }
})

test('the redacted variant drops CTF scenario work', () => {
  const redacted = filterList(pickLang(cv, 'en').experience, 'redacted')
  const roles = redacted.map(job => job.role).join(' ').toLowerCase()
  assert.ok(!roles.includes('scenario'), 'scenario work leaked into the redacted variant')
  assert.equal(redacted.length, 1)
})

test('the full variant keeps all three roles', () => {
  assert.equal(filterList(pickLang(cv, 'en').experience, 'full').length, 3)
})

test('contacts decode to the expected values', () => {
  assert.equal(decodeContact(cv.en.contacts.email), 'tsserg@protonmail.com')
  assert.equal(decodeContact(cv.en.contacts.phone), '+38 (096) 038-01-55')
})

test('the ARIMLABS publication is present with its link', () => {
  const found = cv.en.selected.find(item => /arimlabs/i.test(item.url ?? ''))
  assert.ok(found, 'publication entry missing')
  assert.equal(found.url, 'https://www.arimlabs.ai/writing/malware-reverse-engineering')
})
```

- [ ] **Step 7: Run the full suite**

Run: `node --test tests/`
Expected: PASS. Fix `data/cv.json` until it does — the OPSEC tests are the gate that keeps an employer name out of a public repository.

- [ ] **Step 8: Commit**

```bash
git add assets/cv.js data/cv.json tests/
git commit -m "feat: add CV content model with variant filtering and OPSEC tests"
```

---

### Task 2: Rendering and layout

**Files:**
- Create: `assets/render.js`
- Create: `assets/style.css`
- Create: `index.html`
- Create: `full/index.html`

**Interfaces:**
- Consumes: `decodeContact`, `visibleIn`, `filterList`, `pickLang`, `formatRange` from `assets/cv.js`.
- Produces: a rendered page. `render.js` reads `document.body.dataset.variant`, the `lang` query parameter, and `localStorage.cvLang`.

- [ ] **Step 1: Write the shells**

`index.html`:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Serhii Tsybulnyk — Security Engineer</title>
<meta name="description" content="CV of Serhii Tsybulnyk, Security Engineer working in EASM, detection engineering and security automation.">
<link rel="stylesheet" href="assets/style.css">
<link rel="stylesheet" href="assets/print.css" media="print">
</head>
<body data-variant="redacted" data-base=".">
<nav class="chrome">
  <div class="langs" role="group" aria-label="Language">
    <button type="button" data-lang="en">EN</button>
    <button type="button" data-lang="ua">UA</button>
  </div>
  <a class="download" href="pdf/cv-en.pdf" download>Download PDF</a>
</nav>
<main id="cv" class="cv"></main>
<noscript>
  <p class="fallback">This CV needs JavaScript to render.
  See <a href="https://linkedin.com/in/serhii-tsybulnyk-b33667195">LinkedIn</a>.</p>
</noscript>
<script type="module" src="assets/render.js"></script>
</body>
</html>
```

`full/index.html` is the same file with three differences: `data-variant="full"`, `data-base=".."`, and every asset path prefixed `../` (`../assets/style.css`, `../assets/print.css`, `../assets/render.js`, `../pdf/cv-full-en.pdf`).

- [ ] **Step 2: Write the renderer**

Create `assets/render.js`:

```javascript
import { decodeContact, filterList, pickLang, formatRange } from './cv.js'

const body = document.body
const variant = body.dataset.variant
const base = body.dataset.base
const params = new URLSearchParams(location.search)
const forPdf = params.get('pdf') === '1'

function chooseLang() {
  const asked = params.get('lang')
  if (asked === 'en' || asked === 'ua') return asked
  const stored = localStorage.getItem('cvLang')
  if (stored === 'en' || stored === 'ua') return stored
  return navigator.language?.startsWith('uk') ? 'ua' : 'en'
}

const el = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text != null) node.textContent = text
  return node
}

function section(parent, title) {
  parent.append(el('h2', 'sec', title))
}

function renderSidebar(cv, lang) {
  const side = el('aside', 'side')
  const h1 = el('h1', 'nm', cv.name)
  side.append(h1, el('p', 'rl', cv.role))

  section(side, cv.labels.contact)
  side.append(el('p', 'it', cv.location))

  const mail = el('a', 'it mono', decodeContact(cv.contacts.email))
  mail.href = `mailto:${decodeContact(cv.contacts.email)}`
  side.append(mail)

  const li = el('a', 'it mono', cv.contacts.linkedin.replace('https://', ''))
  li.href = cv.contacts.linkedin
  li.rel = 'me noopener'
  side.append(li)

  if (forPdf && cv.contacts.phone) {
    side.append(el('p', 'it mono', decodeContact(cv.contacts.phone)))
  }

  for (const [group, items] of Object.entries(cv.skills)) {
    section(side, group)
    for (const item of items) side.append(el('p', 'it', item))
  }

  section(side, cv.labels.education)
  for (const school of cv.education) {
    const block = el('div', 'it edu')
    block.append(el('strong', null, school.school))
    block.append(el('span', null, `${school.degree} · ${school.years}`))
    side.append(block)
  }

  section(side, cv.labels.languages)
  for (const item of cv.languages) side.append(el('p', 'it', item))

  section(side, cv.labels.interests)
  side.append(el('p', 'it', cv.interests.join(' · ')))

  return side
}

function renderJob(job, lang) {
  const block = el('article', 'job')
  const line = el('div', 'ln')
  line.append(el('strong', null, job.role))
  line.append(el('span', 'dt', formatRange(job.from, job.to, lang)))
  block.append(line)

  const org = job.orgHint ? `${job.org} · ${job.orgHint}` : job.org
  block.append(el('p', 'org', org))

  const list = el('ul')
  for (const bullet of job.bullets) list.append(el('li', null, bullet))
  block.append(list)

  if (job.tags?.length) {
    const tags = el('div', 'tags')
    for (const tag of job.tags) tags.append(el('span', null, tag))
    block.append(tags)
  }
  return block
}

function renderMain(cv, lang) {
  const main = el('div', 'main')

  section(main, cv.labels.profile)
  main.append(el('p', 'prof', cv.profile))

  section(main, cv.labels.experience)
  for (const job of filterList(cv.experience, variant)) main.append(renderJob(job, lang))

  section(main, cv.labels.selected)
  for (const item of filterList(cv.selected, variant)) {
    const row = el('div', 'win')
    row.append(el('span', 'mk', item.icon))
    const text = el('div')
    if (item.url) {
      const link = el('a', null, item.title)
      link.href = item.url
      link.rel = 'noopener'
      text.append(link)
    } else {
      text.append(el('strong', null, item.title))
    }
    text.append(el('p', null, item.detail))
    row.append(text)
    main.append(row)
  }

  section(main, cv.labels.certifications)
  for (const cert of cv.certifications.certs) main.append(el('p', 'cert', cert))
  main.append(el('p', 'sublab', cv.labels.training))
  for (const item of cv.certifications.training) main.append(el('p', 'cert', item))

  return main
}

function wireChrome(lang) {
  for (const button of document.querySelectorAll('.langs button')) {
    button.classList.toggle('on', button.dataset.lang === lang)
    button.addEventListener('click', () => {
      localStorage.setItem('cvLang', button.dataset.lang)
      const next = new URL(location.href)
      next.searchParams.set('lang', button.dataset.lang)
      location.assign(next)
    })
  }
  const name = variant === 'full' ? `cv-full-${lang}.pdf` : `cv-${lang}.pdf`
  const link = document.querySelector('.download')
  link.href = `${base}/pdf/${name}`
}

async function boot() {
  const lang = chooseLang()
  document.documentElement.lang = lang === 'ua' ? 'uk' : 'en'
  const data = await fetch(`${base}/data/cv.json`).then(r => r.json())
  const cv = pickLang(data, lang)
  const root = document.getElementById('cv')
  root.replaceChildren(renderSidebar(cv, lang), renderMain(cv, lang))
  document.title = `${cv.name} — ${cv.role.split('—')[0].trim()}`
  wireChrome(lang)
  document.querySelector('.download').textContent = cv.labels.download
  body.dataset.ready = 'true'
}

boot().catch(() => {
  document.getElementById('cv').innerHTML =
    '<p class="fallback">Could not load this CV. ' +
    '<a href="https://linkedin.com/in/serhii-tsybulnyk-b33667195">LinkedIn</a></p>'
})
```

`body.dataset.ready` is what the PDF workflow waits on.

- [ ] **Step 3: Write the stylesheet**

Create `assets/style.css` implementing the tokens from Global Constraints: `.cv` as `display:grid; grid-template-columns:236px 1fr`, dark sidebar, white main column, `.sec` uppercase letter-spaced headings, `.job .ln` as a baseline flex row with the date pushed right, `.tags span` as rounded chips, `.win` as an icon-plus-text row. Below `720px` the grid collapses to one column. A `prefers-color-scheme: dark` block darkens the main column to `#111316` with `--ink: #e7e9ec` and leaves the sidebar as it is.

- [ ] **Step 4: Verify in a browser**

Run: `python3 -m http.server 8000`
Open `http://localhost:8000/` and `http://localhost:8000/full/`.
Expected: redacted shows one role, full shows three; the EN/UA toggle switches every string; `?pdf=1` reveals the phone number and nothing else changes.

- [ ] **Step 5: Run the test suite again**

Run: `node --test tests/`
Expected: PASS — the OPSEC walk now covers the new HTML, CSS and JS files.

- [ ] **Step 6: Commit**

```bash
git add index.html full/index.html assets/render.js assets/style.css
git commit -m "feat: render the CV from JSON with variant and language switching"
```

---

### Task 3: Print styles and PDF pipeline

**Files:**
- Create: `assets/print.css`
- Create: `.github/workflows/pdf.yml`
- Create: `scripts/build-pdf.mjs`

**Interfaces:**
- Consumes: the rendered page and `body[data-ready="true"]`.
- Produces: `pdf/cv-en.pdf`, `pdf/cv-ua.pdf`, `pdf/cv-full-en.pdf`, `pdf/cv-full-ua.pdf`.

- [ ] **Step 1: Write the print stylesheet**

Create `assets/print.css`:

```css
@page { size: A4; margin: 0; }

body { margin: 0; }
.chrome, .fallback { display: none !important; }

.cv {
  grid-template-columns: 62mm 1fr;
  min-height: 297mm;
  font-size: 9.4pt;
  line-height: 1.45;
}

.side {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  background: #1a1a1d !important;
  color: #a8adb5 !important;
}

.main { padding: 12mm 12mm 12mm 10mm; }

.job, .win, .cert, .edu { break-inside: avoid; page-break-inside: avoid; }
.sec { break-after: avoid; page-break-after: avoid; }

a { color: inherit; text-decoration: none; }
```

- [ ] **Step 2: Write the PDF builder**

Create `scripts/build-pdf.mjs`:

```javascript
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.CV_BASE ?? 'http://127.0.0.1:8000'

const TARGETS = [
  { path: '', lang: 'en', out: 'pdf/cv-en.pdf' },
  { path: '', lang: 'ua', out: 'pdf/cv-ua.pdf' },
  { path: 'full/', lang: 'en', out: 'pdf/cv-full-en.pdf' },
  { path: 'full/', lang: 'ua', out: 'pdf/cv-full-ua.pdf' }
]

mkdirSync('pdf', { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage()

for (const target of TARGETS) {
  const url = `${BASE}/${target.path}?lang=${target.lang}&pdf=1`
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForSelector('body[data-ready="true"]', { timeout: 15000 })
  await page.emulateMedia({ media: 'print' })
  await page.pdf({ path: target.out, format: 'A4', printBackground: true })
  console.log(`wrote ${target.out}`)
}

await browser.close()
```

- [ ] **Step 3: Generate the PDFs locally**

```bash
npx --yes playwright@1 install --with-deps chromium
python3 -m http.server 8000 &
SERVER=$!
npx --yes playwright@1 exec node scripts/build-pdf.mjs || node scripts/build-pdf.mjs
kill $SERVER
```

Expected: four files in `pdf/`. Open each and confirm the sidebar keeps its dark background, the chrome is gone, the phone number appears, and the redacted pair has no scenario work.

- [ ] **Step 4: Write the workflow**

Create `.github/workflows/pdf.yml`:

```yaml
name: Build CV PDFs

on:
  push:
    branches: [main]
    paths-ignore: ['pdf/**', 'docs/**', 'README.md']
  workflow_dispatch:

permissions:
  contents: write

jobs:
  pdf:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: node --test tests/
      - run: npm init -y && npm install --no-save playwright@1
      - run: npx playwright install --with-deps chromium
      - run: python3 -m http.server 8000 &
      - run: npx wait-on http://127.0.0.1:8000 || sleep 3
      - run: node scripts/build-pdf.mjs
      - name: Commit PDFs
        run: |
          git config user.name  "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add pdf/
          git diff --staged --quiet || git commit -m "chore: rebuild CV PDFs [skip ci]"
          git push
```

`paths-ignore` on `pdf/**` plus `[skip ci]` in the message prevents the commit from retriggering the workflow.

- [ ] **Step 5: Commit**

```bash
git add assets/print.css scripts/build-pdf.mjs .github/ pdf/
git commit -m "feat: generate the four CV PDFs with Playwright in CI"
```

---

### Task 4: Publish

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: everything above.
- Produces: a live site at `https://tsybon.github.io/cv/`.

- [ ] **Step 1: Write the README**

Cover: what the two URLs are, that `data/cv.json` is the only file to edit for content, `node --test tests/` as the check to run before pushing, how the PDFs are produced, and an explicit note that the repository is public and must never name an employer.

- [ ] **Step 2: Run the full check**

Run: `node --test tests/`
Expected: PASS.

- [ ] **Step 3: Create the public repository and push**

```bash
gh repo create Tsybon/cv --public --source=. --remote=origin --push
```

- [ ] **Step 4: Enable Pages**

```bash
gh api -X POST repos/Tsybon/cv/pages -f 'source[branch]=main' -f 'source[path]=/'
```

- [ ] **Step 5: Verify the live site**

Open `https://tsybon.github.io/cv/` and `https://tsybon.github.io/cv/full/`. Confirm both variants, both languages, and that all four PDF links resolve.

- [ ] **Step 6: Commit and push the README**

```bash
git add README.md
git commit -m "docs: explain how to edit and publish the CV"
git push
```

---

## Self-Review

**Spec coverage.** Goal → Task 4. Two variants → Task 1 (`variants` tagging) and Task 2 (`data-variant` shells). Colour tokens → Task 2 Step 3, values copied into Global Constraints. Content model → Task 1. Final copy → Task 1 Step 5. Rendering → Task 2. PDF pipeline → Task 3. Print styles → Task 3 Step 1. Responsive and dark mode → Task 2 Step 3. Verification list → `tests/content.test.mjs` covers the employer-name, variant-leak and contact checks; the PDF and render checks are manual steps in Tasks 2 and 3. NDA constraint → Global Constraints plus two OPSEC tests. No gaps found.

**Placeholder scan.** The only ellipses are inside the illustrative JSON skeleton in Task 1 Step 5, which is immediately followed by the instruction to write every entry in full from the named spec section. `style.css` in Task 2 Step 3 is described rather than listed in full; its tokens are fixed verbatim in Global Constraints and its structure is specified selector by selector, so nothing is left to taste.

**Type consistency.** `decodeContact`, `visibleIn`, `filterList`, `pickLang` and `formatRange` are declared in Task 1's Interfaces block, exported with those exact names in Step 3, and imported under the same names in `render.js` and both test files. `body.dataset.ready` is set in `render.js` and awaited in `build-pdf.mjs`. PDF filenames match between `wireChrome`, `build-pdf.mjs` and the shells.
