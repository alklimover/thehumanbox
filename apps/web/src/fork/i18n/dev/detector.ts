/* eslint-disable no-console -- the report is read in the devtools console */
// The untranslated-text check, loaded only when it is switched on (see ./index).
// In the console:
//   __i18nReport()            table of interface leftovers and unknown simulation ids
//   __i18nReport({sim: true}) the same with free simulation text
//   __i18nReport.json()       the rows as JSON, copied to the clipboard when allowed
//   __i18n.highlight(), __i18n.showSim(), __i18n.rescan(), __i18n.clear()
// Keys: Alt+Shift+I outlines English on screen, Alt+Shift+S adds simulation text.
import { onSimLabelMiss } from '../sim'
import { Report, type Finding } from './report'
import { MARK_ATTRIBUTE, Scanner } from './scanner'

const HIGHLIGHT_FLAG = 'data-i18n-highlight'
const SHOW_SIM_FLAG = 'data-i18n-show-sim'

const STYLE = `
html[${HIGHLIGHT_FLAG}] [${MARK_ATTRIBUTE}="ui"] {
  outline: 2px dashed #ff2d75 !important;
  outline-offset: 1px;
  background-color: rgba(255, 45, 117, 0.12) !important;
}
html[${HIGHLIGHT_FLAG}][${SHOW_SIM_FLAG}] [${MARK_ATTRIBUTE}="sim-text"] {
  outline: 1px dotted #36c5f0 !important;
  outline-offset: 1px;
}
`

interface ReportFunction {
  (options?: { sim?: boolean }): Finding[]
  json(options?: { sim?: boolean }): string
}

interface I18nCheck {
  report: ReportFunction
  highlight(on?: boolean): boolean
  showSim(on?: boolean): boolean
  rescan(): void
  clear(): void
  summary(): ReturnType<Report['summary']>
}

declare global {
  interface Window {
    __i18nReport?: ReportFunction
    __i18n?: I18nCheck
  }
}

function toggleFlag(name: string, on?: boolean): boolean {
  const root = document.documentElement
  const next = on ?? !root.hasAttribute(name)
  root.toggleAttribute(name, next)
  return next
}

let started = false

export function startI18nCheck() {
  if (started || typeof document === 'undefined') return
  started = true

  const report = new Report()
  onSimLabelMiss((domain, id) => report.add('sim-label', `${domain}: ${id}`, [id], `simLabel('${domain}')`))

  const style = document.createElement('style')
  style.id = 'thb-i18n-check'
  style.textContent = STYLE
  document.head.appendChild(style)

  const scanner = new Scanner(document.body, report)
  scanner.start()

  const showSim = () => document.documentElement.hasAttribute(SHOW_SIM_FLAG)
  const reportFn = ((options?: { sim?: boolean }) => {
    scanner.flush()
    const rows = report.list({ sim: options?.sim ?? showSim() })
    console.table(
      rows.map(({ kind, text, count, where, firstSeen }) => ({ kind, text, count, where, firstSeen })),
    )
    console.info('[i18n-check]', report.summary())
    return rows
  }) as ReportFunction
  reportFn.json = (options) => {
    scanner.flush()
    const json = JSON.stringify(report.list({ sim: options?.sim ?? showSim() }), null, 2)
    navigator.clipboard?.writeText(json).catch(() => {})
    return json
  }

  window.__i18nReport = reportFn
  window.__i18n = {
    report: reportFn,
    highlight: (on) => toggleFlag(HIGHLIGHT_FLAG, on),
    showSim: (on) => toggleFlag(SHOW_SIM_FLAG, on),
    rescan: () => scanner.rescan(),
    clear: () => report.clear(),
    summary: () => report.summary(),
  }

  // Alt+Shift is free in every game shortcut (they skip Alt); the code, not the key,
  // because Option changes the character on a Mac.
  window.addEventListener('keydown', (event) => {
    if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return
    if (event.code === 'KeyI') toggleFlag(HIGHLIGHT_FLAG)
    else if (event.code === 'KeyS') toggleFlag(SHOW_SIM_FLAG)
    else return
    event.preventDefault()
  })

  console.info(
    '[i18n-check] включён: __i18nReport() — отчёт, Alt+Shift+I — подсветка, Alt+Shift+S — тексты симуляции',
  )
}
