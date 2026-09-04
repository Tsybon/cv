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

// A date is either "YYYY-MM" or "YYYY". A year-only date carries no month, so
// any duration computed from it would be a guess — we print the range alone.
function parseDate(value) {
  const [year, month] = String(value).split('-')
  return { year: Number(year), month: month ? Number(month) : null }
}

function label(value, lang) {
  const { year, month } = parseDate(value)
  return month ? `${MONTHS[lang][month - 1]} ${year}` : String(year)
}

function words(lang) {
  return WORDS[lang] ?? WORDS.en
}

export function formatRange(from, to, lang, now = new Date()) {
  const start = label(from, lang)
  if (to) return `${start} — ${label(to, lang)}`

  const begin = parseDate(from)
  if (!begin.month) return `${start} — ${words(lang).present}`

  const months =
    (now.getUTCFullYear() - begin.year) * 12 + (now.getUTCMonth() + 1 - begin.month)
  const years = Math.floor(months / 12)
  const rest = months % 12
  const parts = []
  if (years > 0) parts.push(`${years} ${words(lang).yr}`)
  if (rest > 0 || years === 0) parts.push(`${rest} ${words(lang).mo}`)
  return `${start} — ${words(lang).present} · ${parts.join(' ')}`
}
