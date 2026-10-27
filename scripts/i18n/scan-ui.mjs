#!/usr/bin/env node
// Drives the web build in Chromium for a few minutes and collects what the
// untranslated-text check (apps/web/src/fork/i18n/dev) found. Usage and setup:
// docs/fork/I18N-CHECK.ru.md.
//
//   node scripts/i18n/scan-ui.mjs [--url http://localhost:5173/] [--minutes 3] [--out /tmp/i18n-scan]
//     [--role god|observer] [--headed]
//
// The game starts in Russian (the fork's default); the check covers both
// upstream's translations (src/i18n/locales/ru) and the fork's own layer.
//
// Playwright is not a project dependency: install it anywhere and point
// PLAYWRIGHT_DIR at that folder (the one holding node_modules/playwright).
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

function args() {
  const out = { url: 'http://localhost:5173/', minutes: 3, out: '/tmp/i18n-scan', headed: false, role: 'god' }
  const argv = process.argv.slice(2)
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--headed') out.headed = true
    else if (a === '--url') out.url = argv[++i]
    else if (a === '--minutes') out.minutes = Number(argv[++i])
    else if (a === '--out') out.out = argv[++i]
    else if (a === '--role') out.role = argv[++i]
    else throw new Error(`unknown argument ${a}`)
  }
  return out
}

async function loadPlaywright() {
  try {
    return await import('playwright')
  } catch {
    const dir = process.env.PLAYWRIGHT_DIR
    if (!dir) throw new Error('playwright not found: set PLAYWRIGHT_DIR (see docs/fork/I18N-CHECK.ru.md)')
    return createRequire(path.join(path.resolve(dir), 'noop.js'))('playwright')
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * The UI store, through the dev server's module graph: the same module the app
 * imported, so opening a modal here opens it in the app. A production build has
 * no /src, and the scan then only sees what is on screen without clicking.
 */
async function ui(page, action, arg) {
  return page.evaluate(
    async ([action, arg]) => {
      try {
        const { useUIStore } = await import('/src/state/store.ts')
        const { useWorldStore } = await import('/src/state/worldStore.ts')
        const s = useUIStore.getState()
        const world = useWorldStore.getState().world
        const alive = (world?.organisms ?? []).filter((o) => o.alive)
        const someone = alive[Math.floor(Math.random() * alive.length)]
        switch (action) {
          case 'open':
            s.closeAllModals()
            s[arg]()
            return true
          case 'close':
            s.closeAllModals()
            return true
          case 'person':
            if (!someone) return false
            s.closeAllModals()
            s.selectOrg(someone.id)
            if (!s.panelOpen) s.togglePanel()
            return someone.name
          case 'tribe': {
            const lineages = [...new Set(alive.map((o) => o.lineage_id))]
            const lineage = lineages[Math.floor(Math.random() * lineages.length)]
            if (!lineage) return false
            s.closeAllModals()
            s.setFocus(`lineage:${lineage}`)
            return lineage
          }
          case 'convo':
            if (!someone) return false
            s.closeAllModals()
            s.openConvo(someone.id)
            return true
          case 'family':
            s.closeAllModals()
            s.openFamilyTree(someone?.id ?? null)
            return true
          case 'toggle':
            s[arg]()
            return true
        }
        return false
      } catch {
        return false
      }
    },
    [action, arg],
  )
}

const MODALS = [
  'openCiv',
  'openStats',
  'openChronicles',
  'openLanguages',
  'openAchievements',
  'openGoals',
  'openScenarios',
  'openOrgSearch',
  'openAllLineages',
  'openNotable',
  'openAbout',
  'openDesktopSettings',
]

/** Click through the tabs of whatever modal is open, so each tab's text is rendered once. */
async function clickTabs(page) {
  const tabs = page.locator('[role="dialog"] [role="tab"], [role="dialog"] .tab, [role="dialog"] button[class*="tab"]')
  const n = Math.min(await tabs.count(), 12)
  for (let i = 0; i < n; i++) {
    await tabs
      .nth(i)
      .click({ timeout: 1000 })
      .catch(() => {})
    await sleep(400)
  }
}

async function main() {
  const opts = args()
  const { chromium } = await loadPlaywright()
  const browser = await chromium.launch({ headless: !opts.headed })
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))

  const url = new URL(opts.url)
  url.searchParams.set('i18n-check', '1')
  await page.goto(url.href)
  await page.waitForFunction(() => typeof window.__i18nReport === 'function', null, { timeout: 60_000 })
  console.log('check is on, waiting for the world…')
  await page.waitForFunction(() => document.getElementById('thb-splash') === null, null, { timeout: 120_000 })

  // The fork's first screen asks for a role: the god sees the most of the interface (the dock, prayers).
  const roleCard = page.locator(`.fork-mode-card[data-role="${opts.role}"]`)
  if (await roleCard.count()) {
    await roleCard.click()
    await sleep(300)
  }
  // The welcome card, then the tour it offers.
  for (let i = 0; i < 10; i++) {
    const primary = page.locator('.welcome-btn--primary')
    if (!(await primary.count())) break
    const tour = page.locator('.welcome-btn--ghost')
    const isLast = (await tour.count()) && /тур|tour/i.test((await tour.textContent()) ?? '')
    await (isLast ? tour : primary).click()
    await sleep(500)
  }
  // The tour, or the tips of the chosen role (the same card), read through to the end.
  for (let i = 0; i < 12; i++) {
    const next = page.locator('.thb-tour-card .shepherd-button:not(.shepherd-button-secondary)')
    if (!(await next.count())) break
    await next.click().catch(() => {})
    await sleep(700)
  }

  // 10× speed (the game key 4; the map must not own the keyboard focus).
  await page.locator('body').click({ position: { x: 5, y: 500 } }).catch(() => {})
  await page.keyboard.press('4')
  console.log(`running for ${opts.minutes} min at 10×…`)

  const steps = [
    ...MODALS.map((name) => ['open', name]),
    ['person'],
    ['person'],
    ['tribe'],
    ['convo'],
    ['family'],
    ['toggle', 'toggleMore'],
    ['toggle', 'toggleLeft'],
  ]
  const until = Date.now() + opts.minutes * 60_000
  let usedStore = false
  for (let i = 0; Date.now() < until; i++) {
    const [action, arg] = steps[i % steps.length]
    if (await ui(page, action, arg)) usedStore = true
    await sleep(1500)
    if (action === 'open') await clickTabs(page)
    await sleep(1500)
    if (action === 'toggle') await ui(page, action, arg)
  }
  if (!usedStore) console.log('no dev-server store (production build?): only the screen as it was was scanned')
  await ui(page, 'close')
  await page.keyboard.press('?').catch(() => {})
  await sleep(1000)

  const json = await page.evaluate(() => window.__i18nReport.json({ sim: true }))
  const rows = JSON.parse(json)
  await mkdir(opts.out, { recursive: true })
  await writeFile(path.join(opts.out, 'i18n-report.json'), json)
  await page.evaluate(() => window.__i18n.highlight(true))
  await page.screenshot({ path: path.join(opts.out, 'highlight.png') })
  await browser.close()

  const byKind = (kind) => rows.filter((r) => r.kind === kind)
  console.log(
    `ui: ${byKind('ui').length}, sim-label: ${byKind('sim-label').length}, sim-text: ${byKind('sim-text').length}`,
  )
  for (const r of [...byKind('ui'), ...byKind('sim-label')]) {
    console.log(`${r.kind}\t${r.count}\t${r.text.slice(0, 120)}\t${r.where}`)
  }
  if (errors.length) console.log(`page errors:\n${errors.join('\n')}`)
  console.log(`report: ${path.join(opts.out, 'i18n-report.json')}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
