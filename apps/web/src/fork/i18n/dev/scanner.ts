// Watches the page for text and labels with English in them. New and changed
// nodes are collected from a MutationObserver and checked when the browser is
// idle, so a busy frame never waits for the check.
import { englishWords, DEFAULT_ALLOWLIST, type Allowlist } from './heuristic'
import type { FindingKind, Report } from './report'
import { IGNORED_SELECTOR, SIM_TEXT_SELECTOR } from './sim-text'

/** Attributes that are read out or shown as text. */
export const CHECKED_ATTRIBUTES = ['title', 'placeholder', 'aria-label', 'alt'] as const

/** Set on an element whose text or label is English; its value is the finding kind. */
export const MARK_ATTRIBUTE = 'data-i18n-en'

/** Put on an element whose subtree must not be checked (only where it is really needed). */
export const IGNORE_ATTRIBUTE = 'data-i18n-ignore'

const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'TEXTAREA', 'CODE', 'PRE'])

type Kind = Exclude<FindingKind, 'sim-label'>
type Schedule = (run: () => void) => void

function scheduleIdle(run: () => void) {
  if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 1000 })
  else setTimeout(run, 200)
}

/** "div.org-card > span.event-detail": enough to find the place in the devtools. */
export function elementHint(el: Element): string {
  const parts: string[] = []
  for (let node: Element | null = el; node && parts.length < 3 && node !== document.body;) {
    let part = node.tagName.toLowerCase()
    if (node.id) part += `#${node.id}`
    const classes = [...node.classList].slice(0, 2)
    if (classes.length > 0) part += `.${classes.join('.')}`
    parts.unshift(part)
    node = node.parentElement
  }
  return parts.join(' > ')
}

export class Scanner {
  private observer: MutationObserver | null = null
  private pending = new Set<Node>()
  private scheduled = false
  /** Per element, what in it is English: its text nodes and attribute names, with their kind. */
  private marks = new WeakMap<Element, Map<Node | string, Kind>>()
  /** The element a text node was marked on, to unmark it when the node goes away. */
  private owners = new WeakMap<Node, Element>()
  /** The text last counted for a node or an element attribute, so an unchanged rescan is not counted again. */
  private seenText = new WeakMap<Node, string>()
  private seenAttr = new WeakMap<Element, Map<string, string>>()

  private readonly root: Element
  private readonly report: Report
  private readonly allow: Allowlist
  private readonly schedule: Schedule

  constructor(
    root: Element,
    report: Report,
    allow: Allowlist = DEFAULT_ALLOWLIST,
    schedule: Schedule = scheduleIdle,
  ) {
    this.root = root
    this.report = report
    this.allow = allow
    this.schedule = schedule
  }

  start() {
    this.observer = new MutationObserver((records) => this.onMutations(records))
    this.observer.observe(this.root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...CHECKED_ATTRIBUTES],
    })
    this.enqueue(this.root)
  }

  stop() {
    this.observer?.disconnect()
    this.observer = null
    this.pending.clear()
  }

  /** Check everything collected so far right now (tests, and the rescan in the console). */
  flush() {
    this.scheduled = false
    const nodes = [...this.pending]
    this.pending.clear()
    for (const node of nodes) {
      if (node.isConnected) this.scanSubtree(node)
    }
  }

  /** Forget what was counted and check the whole page again. */
  rescan() {
    this.seenText = new WeakMap()
    this.seenAttr = new WeakMap()
    this.enqueue(this.root)
    this.flush()
  }

  private onMutations(records: MutationRecord[]) {
    for (const record of records) {
      if (record.type === 'childList') {
        record.addedNodes.forEach((node) => this.enqueue(node))
        record.removedNodes.forEach((node) => this.forget(node))
      } else {
        this.enqueue(record.target)
      }
    }
  }

  private enqueue(node: Node) {
    this.pending.add(node)
    if (this.scheduled) return
    this.scheduled = true
    this.schedule(() => this.flush())
  }

  private forget(node: Node) {
    if (node.nodeType !== Node.TEXT_NODE) return
    const owner = this.owners.get(node)
    if (owner) this.setMark(owner, node, null)
  }

  private scanSubtree(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      this.scanText(node as Text)
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as Element
    if (this.skipped(el)) return
    this.scanAttributes(el)
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => {
        if (n.nodeType === Node.ELEMENT_NODE) {
          const child = n as Element
          if (SKIPPED_TAGS.has(child.tagName) || child.matches(IGNORED_SELECTOR)) {
            return NodeFilter.FILTER_REJECT
          }
        }
        return NodeFilter.FILTER_ACCEPT
      },
    })
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (n.nodeType === Node.TEXT_NODE) this.scanText(n as Text)
      else this.scanAttributes(n as Element)
    }
  }

  private skipped(el: Element): boolean {
    return SKIPPED_TAGS.has(el.tagName) || el.closest(IGNORED_SELECTOR) !== null
  }

  private scanText(node: Text) {
    const owner = node.parentElement
    const previous = this.owners.get(node)
    if (previous && previous !== owner) this.setMark(previous, node, null)
    if (!owner || SKIPPED_TAGS.has(owner.tagName) || owner.closest(IGNORED_SELECTOR)) return
    const text = (node.nodeValue ?? '').replace(/\s+/g, ' ').trim()
    const words = text ? englishWords(text, this.allow) : []
    if (words.length === 0) {
      this.setMark(owner, node, null)
      return
    }
    const kind = this.kindOf(owner)
    this.owners.set(node, owner)
    this.setMark(owner, node, kind)
    if (this.seenText.get(node) === text) return
    this.seenText.set(node, text)
    this.report.add(kind, text, words, elementHint(owner))
  }

  private scanAttributes(el: Element) {
    for (const name of CHECKED_ATTRIBUTES) {
      const text = el.getAttribute(name)?.replace(/\s+/g, ' ').trim() ?? ''
      const words = text ? englishWords(text, this.allow) : []
      if (words.length === 0) {
        this.setMark(el, name, null)
        continue
      }
      const kind = this.kindOf(el)
      this.setMark(el, name, kind)
      let seen = this.seenAttr.get(el)
      if (!seen) this.seenAttr.set(el, (seen = new Map()))
      if (seen.get(name) === text) continue
      seen.set(name, text)
      this.report.add(kind, text, words, `${elementHint(el)} [${name}]`)
    }
  }

  private kindOf(el: Element): Kind {
    return el.closest(SIM_TEXT_SELECTOR) ? 'sim-text' : 'ui'
  }

  /** Record (or clear, with null) one English source on an element and update its mark. */
  private setMark(el: Element, source: Node | string, kind: Kind | null) {
    let sources = this.marks.get(el)
    if (!sources) {
      if (kind === null) return
      this.marks.set(el, (sources = new Map()))
    }
    if (kind === null) sources.delete(source)
    else sources.set(source, kind)
    const kinds = new Set(sources.values())
    const mark = kinds.has('ui') ? 'ui' : kinds.has('sim-text') ? 'sim-text' : null
    if (mark === null) el.removeAttribute(MARK_ATTRIBUTE)
    else if (el.getAttribute(MARK_ATTRIBUTE) !== mark) el.setAttribute(MARK_ATTRIBUTE, mark)
  }
}
