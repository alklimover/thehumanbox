// Words in the civilisation window that upstream shows as the simulation sends them.
import { ft, type ForkMessageKey } from '.'

/** Book topics (sim/civ/culture/books.rs). */
const TOPICS: Record<string, ForkMessageKey> = {
  history: 'civ.topic.history',
  philosophy: 'civ.topic.philosophy',
  science: 'civ.topic.science',
  medicine: 'civ.topic.medicine',
  religion: 'civ.topic.religion',
  poetry: 'civ.topic.poetry',
  law: 'civ.topic.law',
  engineering: 'civ.topic.engineering',
  geography: 'civ.topic.geography',
  mathematics: 'civ.topic.mathematics',
  astronomy: 'civ.topic.astronomy',
  fiction: 'civ.topic.fiction',
  biography: 'civ.topic.biography',
  economics: 'civ.topic.economics',
  drama: 'civ.topic.drama',
}

/** A book's topic in the player's language; an unknown one as sent. */
export function bookTopic(topic: string | null | undefined): string {
  if (!topic) return ''
  const key = TOPICS[topic]
  return key ? ft(key) : topic
}
