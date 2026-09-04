# Public CV site on GitHub Pages — design

Date: 2026-09-04
Owner: Serhii Tsybulnyk (GitHub: `Tsybon`)
Status: awaiting review

## Goal

A single public web page presenting Serhii Tsybulnyk's CV, published on GitHub
Pages, so it can be sent to recruiters as a link. Two content variants and two
languages, plus a downloadable PDF per combination.

## Non-goals

- No blog, no project gallery, no analytics, no contact form.
- No CMS, no build framework, no runtime dependencies.
- No custom domain in the first release.

## Constraints

**NDA.** No employer is named anywhere on the site, in the repository, or in
generated PDFs. Organisations render as `Confidential (NDA)`, with an optional
neutral hint such as `national-level CSIRT`. The names CERT-UA and the State
Service of Special Communications must not appear in any file.

**Public repository.** Everything committed is world-readable, including
`data/cv.json`. Content excluded from the redacted variant is still present in
the repository and in the full variant. This is accepted: the two variants exist
to tailor the CV to a vacancy, not to keep secrets. Nothing genuinely
confidential goes into the repository at all.

**Contact data.** Phone and Telegram appear only in the generated PDFs, not on
the page. The PDFs are served from a public URL, so this reduces scraping by
crawlers that parse HTML but does not make the phone number private.

## URLs and repository

New public repository `Tsybon/cv`, GitHub Pages served from `main`.

| URL | Variant |
|---|---|
| `tsybon.github.io/cv/` | redacted — no CTF scenario development |
| `tsybon.github.io/cv/full/` | full — everything |

Language is a client-side toggle within each variant, persisted in
`localStorage`, defaulting to English (falling back to Ukrainian only when
`navigator.language` starts with `uk`).

## Layout

Two-column CV, validated visually during design.

- **Left sidebar**, dark (`#1a1a1d`): name, role line, contacts, skill groups,
  education, languages, interests.
- **Right column**, white: profile, experience, selected work, certifications.

### Colour tokens

Graphite palette — the most restrained option, chosen deliberately.

```
--sidebar-bg:    #1a1a1d
--sidebar-fg:    #a8adb5
--sidebar-head:  #ffffff
--accent:        #c7ccd4   /* role line in sidebar */
--accent-print:  #4b5058   /* organisation names on white */
--paper:         #ffffff
--ink:           #191d23
--ink-muted:     #4a515c
--rule:          #eaecef
```

All colours live in `:root` as CSS custom properties. Changing the palette later
is a single-block edit.

## Content model

One file, `data/cv.json`, holding both languages. Every content node carries an
optional `variants` array; a node without it appears in both variants.

```json
{
  "meta": {
    "updated": "2026-09-04",
    "variants": ["redacted", "full"],
    "defaultLang": "en"
  },
  "en": {
    "name": "Serhii Tsybulnyk",
    "role": "Security Engineer — EASM, Detection Engineering, Security Automation & AI",
    "location": "Kyiv, Ukraine",
    "contacts": {
      "email": "<base64>",
      "linkedin": "https://linkedin.com/in/serhii-tsybulnyk-b33667195",
      "phone": "<base64, PDF only>",
      "telegram": "<base64, PDF only>"
    },
    "profile": "…",
    "experience": [ { "role": "…", "org": "Confidential (NDA)", "orgHint": "…",
                      "from": "2021-07", "to": null, "bullets": ["…"],
                      "tags": ["…"], "variants": ["redacted","full"] } ],
    "selected":  [ { "icon": "…", "title": "…", "detail": "…",
                     "url": null, "variants": [...] } ],
    "skills":    { "Security": ["…"], "Platforms": ["…"],
                   "Engineering": ["…"], "AI Security": ["…"] },
    "certifications": { "certs": ["…"], "training": ["…"] },
    "education": [ { "school": "…", "degree": "…", "years": "…" } ],
    "languages": ["English — B2", "Ukrainian — native"],
    "interests": ["…"]
  },
  "ua": { "…mirror…" }
}
```

### Rules

- **Dates** are ISO `YYYY-MM`; durations are computed at render time so the CV
  never goes stale.
- **Email, phone and Telegram** are stored base64-encoded and decoded in JS.
  Email is rendered on the page; phone and Telegram are injected only into the
  PDF build. They are not obfuscated for secrecy — only to defeat naive
  address-harvesting crawlers.
- **`variants`** drives both the page render and which PDFs are generated.
- The two language trees are structurally identical. A missing key in `ua`
  falls back to `en` rather than rendering blank.

## Content (final copy)

### Identity

- Name: Serhii Tsybulnyk
- Role line: Security Engineer — EASM · Detection Engineering · Security Automation & AI
- Location: Kyiv, Ukraine
- Page contacts: email `tsserg@protonmail.com`, LinkedIn
- PDF-only contacts: phone `+38 (096) 038-01-55`, Telegram (handle pending)

The GitHub profile is deliberately not linked: it has no public repositories,
so the link would lead a recruiter to an empty page.

Work format and relocation are deliberately not stated.

### Profile

> Security Engineer with 5+ years across SOC L1–L3, incident response and DFIR,
> detection engineering and External Attack Surface Management. Build production
> security tooling and automation, including a web platform built on top of a
> CLI-only attack-surface scanner, covering 2,000+ client organisations and
> 15,000+ tracked assets. Apply LLM/MCP and agentic workflows to security
> automation and engineering.

### Experience

**Security Engineer, EASM & Automation** — Confidential (NDA), national-level
CSIRT · Jul 2021 – present · *both variants*

- Progressed from SOC L1/L2/L3 into security engineering — alert triage,
  incident response, DFIR, threat hunting, detection engineering and SIEM
  operations.
- Sole developer of a web platform built on top of an open-source CLI
  attack-surface scanner: scan configuration and scheduling, run management,
  findings analysis, report generation and export — turning an operator-only
  tool into a product used across the team.
- Operate external attack-surface monitoring across 2,000+ client organisations
  and 15,000+ tracked assets.
- Authored ~20 global correlation rules plus a large set of client-specific
  detections across ~40 log sources, feeding L1/L2 triage.
- Automate alert triage, scanner-result analysis and dynamic client dashboard
  generation with LLM and agentic workflows — task decomposition, tool use,
  verification and human oversight rather than one-shot prompting.

Tags: Python, FastAPI, React, TypeScript, Docker, Splunk, BBOT, Nuclei, NetBox

**CTF Scenario Developer** — Confidential (NDA) · 2024 – present · *full only*

- Design realistic defensive cybersecurity scenarios and hands-on challenges,
  translating attack/defense concepts into reproducible lab environments.

**Scenario Engineer** — Confidential (NDA) · Jan 2026 – present · *full only*

- Develop and migrate CTF scenarios while preserving intended behaviour,
  dependencies and environment reliability.

### Selected work

- **Competitive CTF** — regular player on a high-performing team with multiple
  winning placements at international competitions; focus on blue/purple-team,
  DFIR and AI-assisted problem solving. Built tooling for attack/defense
  formats: service analysis, exploit analysis and generation, exploit
  validation and automated flag submission. *(both variants)*
- **Publication — "Can Frontier Models Reverse-Engineer Malware?"** — ARIMLABS,
  July 2026, named co-author. Benchmark evaluating seven frontier models on
  static malware analysis: 12 samples, 121 statically-recoverable indicators,
  252 evaluation runs. Links to
  `https://www.arimlabs.ai/writing/malware-reverse-engineering`.
  *(both variants)*

  The publication and the co-author credit are public, so ARIMLABS and the
  research title are named. Internal detail of the owner's specific
  contribution — which samples and exploits were prepared, and how the runs
  were orchestrated — stays off the CV.
- **Guest SME and speaker** — hands-on AV/EDR/XDR session at SET University
  using CrowdStrike and ELK endpoint telemetry; conference talk on applying AI
  to security operations. *(both variants)*
- **Independent engineering** — personal web and security-automation projects,
  n8n workflows, AI-assisted development with LLM agents and MCP.
  *(both variants)*

Specific competition placements (CyberChess 2025, U.S. DOE) are deliberately
generalised at the owner's request.

### Skills

| Group | Items |
|---|---|
| Security | EASM · attack-surface discovery · detection engineering · Sigma · YARA · incident response · DFIR · threat hunting · vulnerability management |
| Platforms | Splunk ES · ELK · QRadar · LogRhythm · CrowdStrike · Wazuh · Velociraptor · BBOT · Nuclei · NetBox · Nessus · MISP · n8n · AWS |
| Engineering | Python · FastAPI · REST · React · TypeScript · Docker · Linux · Bash · PowerShell |
| AI Security | LLM workflows · MCP · agentic automation · tool use · context and state management · evaluation and verification · human-in-the-loop |

### Certifications

Each on its own line, no dates.

- GIAC Defending Advanced Threats (GDAT)
- Splunk Certified Cybersecurity Defense Architect
- Splunk Certified Cybersecurity Defense Analyst
- Cisco CCNA
- EC-Council Certified Incident Handler (ECIH)

Dragos Platform Certified User is excluded at the owner's request.

**SANS training** — titles verified against sans.org on 2026-09-04:

- SEC573: AI-Powered Security Automation: Building Tools with Python, LLMs, and MCP
- SEC598: AI and Security Automation for Red, Blue, and Purple Teams
- SEC555: Detection Engineering and SIEM Analytics
- FOR608: Enterprise-Class Incident Response & Threat Hunting
- FOR508: Advanced Incident Response, Threat Hunting, and Digital Forensics

### Education

- **State University of Telecommunications** — MSc, Computer Science, 2021–2023
- **Igor Sikorsky Kyiv Polytechnic Institute** — BSc, Computer Science, 2017–2021
- **Dubex, Denmark** — Cyber Academy, 3-month programme, 2022

### Languages and interests

- English — B2; Ukrainian — native
- Interests: web development, AI agents, CTF

DevSecOps is listed only as an interest, never as a skill.

## Repository layout

```
cv/
├── index.html                  # redacted variant
├── full/index.html             # full variant
├── assets/
│   ├── style.css               # screen styles, tokens, dark mode
│   ├── print.css               # @media print
│   └── app.js                  # render, i18n, contact decoding
├── data/cv.json                # all content, both languages
├── pdf/                        # build output, committed
│   ├── cv-en.pdf   cv-ua.pdf           # redacted
│   └── cv-full-en.pdf   cv-full-ua.pdf # full
├── .github/workflows/pdf.yml
├── .gitignore                  # .superpowers/
└── README.md
```

Both `index.html` files are thin shells differing only by a `data-variant`
attribute; all rendering logic is shared.

## Rendering

`app.js` fetches `data/cv.json`, filters nodes by the page's variant, selects
the language tree, and renders into the two columns. No framework, no
dependencies. Roughly 150 lines.

- Language toggle rewrites the DOM and updates `<html lang>`.
- Durations are computed from `from`/`to`.
- Email is decoded on first interaction, not at page load.
- If the fetch fails, a static fallback message with the LinkedIn URL is shown
  rather than an empty page.

## PDF pipeline

GitHub Actions workflow on push to `main`:

1. Check out, install Playwright with Chromium.
2. Serve the repository over a local static server.
3. For each of the four combinations (variant × language), open the page with
   the language preset via a query parameter, wait for render, inject
   PDF-only contacts, and print to A4 with `print.css` applied.
4. Commit the four PDFs back to `pdf/` if they changed.

The download button links to the matching prebuilt file, so a recruiter can be
sent the PDF URL directly.

## Print styles

- Sidebar keeps its dark background; `-webkit-print-color-adjust: exact`.
- Page chrome (language toggle, download button) is hidden.
- A4, 12mm margins, target one page for redacted and up to two for full.
- Explicit `page-break-inside: avoid` on each experience and certification entry.

## Accessibility and responsiveness

- Single-column stack below 720px; sidebar becomes a header block.
- Semantic landmarks, one `h1`, section headings as `h2`.
- Contrast checked against WCAG AA for both the graphite sidebar and body text.
- Dark mode via `prefers-color-scheme`: the white column becomes near-black and
  the sidebar stays dark; the PDF is always light.

## Verification

- Both variants render in both languages with no missing keys.
- The redacted variant contains no occurrence of "CTF Scenario", "Scenario
  Engineer" or scenario-development wording.
- No file in the repository contains "CERT-UA" or the State Service name.
- All four PDFs generate and open, contain phone and Telegram, and stay within
  the page budget.
- Page renders correctly with JavaScript-driven language switching and after a
  hard reload with a stored language preference.

## Open items

These do not block implementation; the affected fields ship with placeholders
until answered.

1. Telegram handle for the PDFs, or a decision to drop Telegram and keep only
   the phone number.
