// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Report } from './report'
import { MARK_ATTRIBUTE, Scanner } from './scanner'

let root: HTMLElement
let report: Report
let scanner: Scanner
let runs: (() => void)[]

/** Mutation records arrive in a microtask; then the idle callback the scanner asked for runs. */
async function idle() {
  await Promise.resolve()
  const queued = runs
  runs = []
  for (const run of queued) run()
}

beforeEach(() => {
  root = document.createElement('div')
  document.body.appendChild(root)
  report = new Report()
  runs = []
  scanner = new Scanner(root, report, undefined, (run) => runs.push(run))
})

afterEach(() => {
  scanner.stop()
  root.remove()
})

describe('Scanner', () => {
  it('finds English already on the page and marks its element', async () => {
    root.innerHTML = '<div class="card"><span class="label">tribe</span><span>Lupif</span><b>племя</b></div>'
    scanner.start()
    await idle()
    expect(report.list().map((r) => [r.kind, r.text, r.where])).toEqual([
      ['ui', 'tribe', 'div > div.card > span.label'],
    ])
    expect(root.querySelector('.label')?.getAttribute(MARK_ATTRIBUTE)).toBe('ui')
    expect(root.querySelector('b')?.hasAttribute(MARK_ATTRIBUTE)).toBe(false)
  })

  it('checks labels that are read out or shown', async () => {
    root.innerHTML = '<button title="open settings" aria-label="настройки"><img alt="world map"></button>'
    scanner.start()
    await idle()
    expect(report.list().map((r) => r.where)).toEqual(['div > button [title]', 'div > button > img [alt]'])
  })

  it('waits for the idle callback and batches changes', async () => {
    scanner.start()
    await idle()
    const p = document.createElement('p')
    p.textContent = 'hunting'
    root.appendChild(p)
    root.appendChild(document.createTextNode('gathering'))
    await Promise.resolve()
    expect(report.list()).toEqual([])
    expect(runs).toHaveLength(1)
    await idle()
    expect(report.list().map((r) => r.text)).toEqual(['gathering', 'hunting'])
  })

  it('follows text that changes, and unmarks it once it is Russian', async () => {
    root.innerHTML = '<span>пауза</span>'
    scanner.start()
    await idle()
    const span = root.querySelector('span')!
    span.firstChild!.nodeValue = 'pause'
    await idle()
    expect(span.getAttribute(MARK_ATTRIBUTE)).toBe('ui')
    span.firstChild!.nodeValue = 'пауза'
    await idle()
    expect(span.hasAttribute(MARK_ATTRIBUTE)).toBe(false)
    span.setAttribute('title', 'resume')
    await idle()
    expect(span.getAttribute(MARK_ATTRIBUTE)).toBe('ui')
    expect(report.list().map((r) => r.text)).toEqual(['pause', 'resume'])
  })

  it('counts a text each time it appears, not each time it is rescanned', async () => {
    scanner.start()
    for (let i = 0; i < 3; i++) {
      const span = document.createElement('span')
      span.textContent = 'tribe'
      root.appendChild(span)
    }
    await idle()
    root.setAttribute('title', 'карта')
    await idle()
    scanner.flush()
    expect(report.list()).toMatchObject([{ text: 'tribe', count: 3 }])
  })

  it('files simulation text separately and hides it by default', async () => {
    root.innerHTML =
      '<div class="org-thought">heading to the trees</div>' +
      '<div class="org-card"><span data-i18n-sim>a quiet evening</span><span>forage</span></div>'
    scanner.start()
    await idle()
    expect(report.list().map((r) => r.text)).toEqual(['forage'])
    expect(
      report
        .list({ sim: true })
        .filter((r) => r.kind === 'sim-text')
        .map((r) => r.text),
    ).toEqual(['a quiet evening', 'heading to the trees'])
    expect(root.querySelector('.org-thought')?.getAttribute(MARK_ATTRIBUTE)).toBe('sim-text')
  })

  it('skips opted-out subtrees, code and scripts', async () => {
    root.innerHTML =
      '<div data-i18n-ignore><span>debug overlay</span></div><code>world.tick</code><script>let x</script>'
    scanner.start()
    await idle()
    root.querySelector('[data-i18n-ignore] span')!.textContent = 'still ignored'
    await idle()
    expect(report.list({ sim: true })).toEqual([])
  })

  it('stops watching when stopped', async () => {
    scanner.start()
    await idle()
    scanner.stop()
    root.textContent = 'tribe'
    await idle()
    expect(report.list()).toEqual([])
  })
})
