import { decodeContact, filterList, pickLang, formatRange } from './cv.js'

const body = document.body
const variant = body.dataset.variant
const base = body.dataset.base
const params = new URLSearchParams(location.search)
const forPdf = params.get('pdf') === '1'

function chooseLang() {
  const asked = params.get('lang')
  if (asked === 'en' || asked === 'ua') return asked
  let stored = null
  try {
    stored = localStorage.getItem('cvLang')
  } catch {
    // private mode or blocked storage — fall through to the browser locale
  }
  if (stored === 'en' || stored === 'ua') return stored
  return navigator.language?.startsWith('uk') ? 'ua' : 'en'
}

function el(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text != null) node.textContent = text
  return node
}

function section(parent, title) {
  parent.append(el('h2', 'sec', title))
}

function renderSidebar(cv) {
  const side = el('aside', 'side')
  side.append(el('h1', 'nm', cv.name), el('p', 'rl', cv.role))

  section(side, cv.labels.contact)
  side.append(el('p', 'it', cv.location))

  const email = decodeContact(cv.contacts.email)
  const mail = el('a', 'it mono', email)
  mail.href = `mailto:${email}`
  side.append(mail)

  const linked = el('a', 'it mono', cv.contacts.linkedin.replace('https://', ''))
  linked.href = cv.contacts.linkedin
  linked.rel = 'me noopener'
  side.append(linked)

  // The phone number ships only in the PDF build, which is the one request
  // that carries ?pdf=1. Crawlers reading the plain page never see it.
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

  block.append(el('p', 'org', job.orgHint ? `${job.org} · ${job.orgHint}` : job.org))

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

function renderSelected(item) {
  const row = el('div', 'win')
  row.append(el('span', 'mk', item.icon))

  const text = el('div')
  if (item.url) {
    const link = el('a', 'wtitle', item.title)
    link.href = item.url
    link.rel = 'noopener'
    text.append(link)
  } else {
    text.append(el('strong', 'wtitle', item.title))
  }
  text.append(el('p', null, item.detail))

  row.append(text)
  return row
}

function renderMain(cv, lang) {
  const main = el('div', 'main')

  section(main, cv.labels.profile)
  main.append(el('p', 'prof', cv.profile))

  section(main, cv.labels.experience)
  for (const job of filterList(cv.experience, variant)) main.append(renderJob(job, lang))

  section(main, cv.labels.selected)
  for (const item of filterList(cv.selected, variant)) main.append(renderSelected(item))

  section(main, cv.labels.certifications)
  for (const cert of cv.certifications.certs) main.append(el('p', 'cert', cert))
  main.append(el('p', 'sublab', cv.labels.training))
  for (const item of cv.certifications.training) main.append(el('p', 'cert', item))

  return main
}

function wireChrome(cv, lang) {
  for (const button of document.querySelectorAll('.langs button')) {
    button.classList.toggle('on', button.dataset.lang === lang)
    button.addEventListener('click', () => {
      try {
        localStorage.setItem('cvLang', button.dataset.lang)
      } catch {
        // storage unavailable — the query parameter still carries the choice
      }
      const next = new URL(location.href)
      next.searchParams.set('lang', button.dataset.lang)
      location.assign(next)
    })
  }

  const file = variant === 'full' ? `cv-full-${lang}.pdf` : `cv-${lang}.pdf`
  const link = document.querySelector('.download')
  link.href = `${base}/pdf/${file}`
  link.textContent = cv.labels.download
}

async function boot() {
  const lang = chooseLang()
  document.documentElement.lang = lang === 'ua' ? 'uk' : 'en'

  const response = await fetch(`${base}/data/cv.json`)
  if (!response.ok) throw new Error(`cv.json: ${response.status}`)
  const cv = pickLang(await response.json(), lang)

  document.getElementById('cv').replaceChildren(renderSidebar(cv), renderMain(cv, lang))
  document.title = `${cv.name} — ${cv.role.split('—')[0].trim()}`
  wireChrome(cv, lang)

  body.dataset.ready = 'true'
}

boot().catch(error => {
  console.error(error)
  document.getElementById('cv').replaceChildren(
    Object.assign(document.createElement('p'), {
      className: 'fallback',
      innerHTML:
        'Could not load this CV. ' +
        '<a href="https://linkedin.com/in/serhii-tsybulnyk-b33667195">LinkedIn</a>'
    })
  )
})
