// Where the interface shows free text written by the simulation: thoughts,
// events, news, the life log, memories. That text stays English until it is
// translated at display time (v0.4), so the check files it as 'sim-text'
// instead of as an interface leftover. The places are listed here by their
// existing classes, so upstream components need no edits; an element the
// classes cannot reach is marked with data-i18n-sim. If upstream renames a
// class, its text simply shows up as 'ui' in the report.

export const SIM_TEXT_SELECTORS: readonly string[] = [
  '[data-i18n-sim]',
  // Thoughts: the person card, the side list, search, family tree.
  '.org-thought',
  '.org-detail-thought',
  '.org-search-thought',
  '.tree-tooltip-thought',
  // Recent thoughts, things witnessed, bonds and memories on the person card.
  '.thought-row .thought-text',
  // Events and news.
  '.event-detail',
  '.headline-ticker-item',
  '.civ-headline-text',
  '.chronicle-text',
  '.stats-detail',
]

export const SIM_TEXT_SELECTOR = SIM_TEXT_SELECTORS.join(', ')

/**
 * Text that is never English even though it is Latin: the made-up words of the
 * tribes' languages (the Languages window). Besides these, any element can opt
 * out with data-i18n-ignore.
 */
export const IGNORED_SELECTORS: readonly string[] = [
  '[data-i18n-ignore]',
  '.lang-lineage-col',
  '.lang-sex-word',
]

export const IGNORED_SELECTOR = IGNORED_SELECTORS.join(', ')
