import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { filterList, pickLang, decodeContact } from '../assets/cv.js'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const cv = JSON.parse(readFileSync(join(ROOT, 'data/cv.json'), 'utf8'))

// This repository is public. None of these strings may ever be committed.
const FORBIDDEN = [
  'CERT-UA',
  'CERT UA',
  'Держспецзв',
  'State Service of Special Communications',
  'telegram',
  't.me'
]

// docs/ holds the spec and plan, which quote the forbidden terms in order to
// forbid them; pdf/ and the source CVs are binary.
const SKIP_DIRS = new Set(['.git', 'node_modules', '.superpowers', 'pdf', 'docs'])
const TEXT = new Set(['.html', '.css', '.js', '.mjs', '.json', '.yml', '.yaml', '.md', '.txt'])

// This file is the one place the forbidden strings are written down, so it
// cannot scan itself.
const SELF = fileURLToPath(import.meta.url)

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full, files)
    else if (TEXT.has(extname(name)) && full !== SELF) files.push(full)
  }
  return files
}

test('both language trees expose the same keys', () => {
  assert.deepEqual(Object.keys(cv.en).sort(), Object.keys(cv.ua).sort())
})

test('no employer is named in either tree', () => {
  const text = JSON.stringify(cv).toLowerCase()
  for (const term of FORBIDDEN) {
    assert.ok(!text.includes(term.toLowerCase()), `found "${term}" in cv.json`)
  }
})

test('no committed source file names an employer or Telegram', () => {
  for (const file of walk(ROOT)) {
    const text = readFileSync(file, 'utf8').toLowerCase()
    for (const term of FORBIDDEN) {
      assert.ok(!text.includes(term.toLowerCase()), `found "${term}" in ${file}`)
    }
  }
})

test('every experience entry hides its employer behind NDA', () => {
  for (const lang of ['en', 'ua']) {
    for (const job of cv[lang].experience) {
      assert.match(job.org, /NDA/, `${lang}: "${job.role}" does not say NDA`)
    }
  }
})

test('the redacted variant drops CTF scenario work', () => {
  for (const lang of ['en', 'ua']) {
    const redacted = filterList(pickLang(cv, lang).experience, 'redacted')
    assert.equal(redacted.length, 1, `${lang}: redacted should keep one role`)
    const text = redacted
      .map(job => `${job.role} ${job.bullets.join(' ')}`)
      .join(' ')
      .toLowerCase()
    assert.ok(!/scenario|сценарі/.test(text), `${lang}: scenario work leaked into redacted`)
  }
})

test('the full variant keeps all three roles', () => {
  for (const lang of ['en', 'ua']) {
    assert.equal(filterList(pickLang(cv, lang).experience, 'full').length, 3)
  }
})

test('contacts decode to the expected values', () => {
  assert.equal(decodeContact(cv.en.contacts.email), 'tsserg@protonmail.com')
  assert.equal(decodeContact(cv.en.contacts.phone), '+38 (096) 038-01-55')
})

test('the ARIMLABS publication is present with its link', () => {
  for (const lang of ['en', 'ua']) {
    const found = cv[lang].selected.find(item => /arimlabs/i.test(item.url ?? ''))
    assert.ok(found, `${lang}: publication entry missing`)
    assert.equal(found.url, 'https://www.arimlabs.ai/writing/malware-reverse-engineering')
  }
})

test('no competition is named by placement', () => {
  const text = JSON.stringify(cv).toLowerCase()
  for (const term of ['cyberchess', 'department of energy', 'netflix&chill']) {
    assert.ok(!text.includes(term), `found "${term}" — placements are generalised`)
  }
})

test('every label key used by the renderer exists in both languages', () => {
  const needed = ['profile', 'experience', 'selected', 'certifications', 'training',
    'contact', 'education', 'languages', 'interests', 'download']
  for (const lang of ['en', 'ua']) {
    for (const key of needed) {
      assert.ok(cv[lang].labels[key], `${lang}: missing label "${key}"`)
    }
  }
})
