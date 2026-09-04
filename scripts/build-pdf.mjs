import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.CV_BASE ?? 'http://127.0.0.1:8123'

const TARGETS = [
  { path: '', lang: 'en', out: 'pdf/cv-en.pdf' },
  { path: '', lang: 'ua', out: 'pdf/cv-ua.pdf' },
  { path: 'full/', lang: 'en', out: 'pdf/cv-full-en.pdf' },
  { path: 'full/', lang: 'ua', out: 'pdf/cv-full-ua.pdf' }
]

mkdirSync('pdf', { recursive: true })

const browser = await chromium.launch()

// The PDF is the light palette regardless of the runner's system theme.
const page = await browser.newPage({ colorScheme: 'light' })

for (const target of TARGETS) {
  const url = `${BASE}/${target.path}?lang=${target.lang}&pdf=1`
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForSelector('body[data-ready="true"]', { timeout: 15000 })
  await page.emulateMedia({ media: 'print', colorScheme: 'light' })
  await page.pdf({ path: target.out, format: 'A4', printBackground: true })
  console.log(`wrote ${target.out}`)
}

await browser.close()
