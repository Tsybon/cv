import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decodeContact, visibleIn, pickLang, filterList, formatRange } from '../assets/cv.js'

test('decodeContact decodes base64 to utf-8', () => {
  assert.equal(decodeContact('dHNzZXJnQHByb3Rvbm1haWwuY29t'), 'tsserg@protonmail.com')
})

test('decodeContact handles non-ascii', () => {
  assert.equal(decodeContact('0KHQtdGA0LPRltC5'), 'Сергій')
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

test('filterList tolerates a missing list', () => {
  assert.deepEqual(filterList(undefined, 'full'), [])
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

test('formatRange omits the duration when the start month is unknown', () => {
  const now = new Date('2026-09-04T00:00:00Z')
  assert.equal(formatRange('2024', null, 'en', now), '2024 — present')
  assert.equal(formatRange('2024', null, 'ua', now), '2024 — дотепер')
})

test('formatRange renders a year-only closed range', () => {
  const now = new Date('2026-09-04T00:00:00Z')
  assert.equal(formatRange('2022', '2022', 'en', now), '2022 — 2022')
})
