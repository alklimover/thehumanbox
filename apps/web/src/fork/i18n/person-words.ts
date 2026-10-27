// Words of the person panel that upstream shows as the simulation sends them.
import { ft, type ForkMessageKey } from '.'

/** The subjects a university grants degrees in (pick_degree in sim/civ/civ_tick/people.rs). */
const DEGREES: Record<string, ForkMessageKey> = {
  philosophy: 'person.degree.philosophy',
  arts: 'person.degree.arts',
  law: 'person.degree.law',
  history: 'person.degree.history',
  literature: 'person.degree.literature',
  medicine: 'person.degree.medicine',
  mathematics: 'person.degree.mathematics',
  astronomy: 'person.degree.astronomy',
  theology: 'person.degree.theology',
  architecture: 'person.degree.architecture',
  engineering: 'person.degree.engineering',
  economics: 'person.degree.economics',
  science: 'person.degree.science',
}

/** A degree's subject in the player's language; an unknown one as its words. */
export function degreeName(degree: string): string {
  const key = DEGREES[degree]
  return key ? ft(key) : degree.replace(/[_-]+/g, ' ')
}
