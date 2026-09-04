# CV

Serhii Tsybulnyk's CV, published on GitHub Pages in two variants and two
languages.

| URL | Contents |
|---|---|
| https://tsybon.github.io/cv/ | redacted — no CTF scenario development |
| https://tsybon.github.io/cv/full/ | everything |

Language is a toggle on the page (`?lang=en` / `?lang=ua`), remembered per
browser. Each combination has a prebuilt PDF under `pdf/`.

## Editing the content

`data/cv.json` is the only file to touch. It holds an `en` and a `ua` tree with
identical keys. Add `"variants": ["full"]` to any experience or selected-work
entry to keep it out of the redacted build; entries without the field appear in
both.

Dates are `YYYY-MM`, or `YYYY` when the month is unknown — durations are
computed at render time, so the CV does not go stale. A year-only date prints
without a duration rather than guessing one.

After editing:

```bash
node --test tests/*.test.mjs
```

## This repository is public

Nothing here may name an employer. The tests in `tests/content.test.mjs` fail
the build if any committed file contains an employer name, a messenger handle
or a named competition placement. Organisations are written as
`Confidential (NDA)`.

The phone number lives base64-encoded in `data/cv.json` and renders only when
the URL carries `?pdf=1`, which is what the PDF build requests. That keeps it
out of the plain page for crawlers — it does not make it private, since the
PDFs themselves are public.

## PDFs

`.github/workflows/pdf.yml` rebuilds all four on every push to `main` and
commits them back. To build them locally:

```bash
npm install --no-save playwright@1
npx playwright install chromium
python3 -m http.server 8123 &
node scripts/build-pdf.mjs
```

## Layout

| File | Responsibility |
|---|---|
| `data/cv.json` | all content, both languages |
| `assets/cv.js` | pure logic — variant filter, language merge, date ranges |
| `assets/render.js` | DOM rendering and page wiring |
| `assets/style.css` | tokens, two-column layout, dark mode |
| `assets/print.css` | A4 print rules |
| `scripts/build-pdf.mjs` | Playwright PDF build |

No runtime dependencies and no build step for the page itself. Design notes are
in `docs/superpowers/specs/`.
