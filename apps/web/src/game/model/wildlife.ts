import { t, type MessageKey } from '../../i18n'
import type { AnimalState } from '../../shared/types'

export interface WildlifeCount {
  /** The group's name as shown ("birds"). */
  label: string
  count: number
  /** Birds that have flown south for the winter. */
  away?: number
  /** Predators are a danger, not game. */
  danger?: boolean
}

const GROUPS: Array<{ label: MessageKey; kinds: readonly string[]; danger?: boolean; herd?: boolean }> = [
  { label: 'model.wildlife.rabbits', kinds: ['rabbit'] },
  { label: 'model.wildlife.deer', kinds: ['deer'] },
  { label: 'model.wildlife.boar', kinds: ['boar'] },
  { label: 'model.wildlife.birds', kinds: ['bird'] },
  { label: 'model.wildlife.fish', kinds: ['fish'] },
  { label: 'model.wildlife.herds', kinds: ['sheep', 'cow', 'horse', 'chicken'], herd: true },
  { label: 'model.wildlife.foxes', kinds: ['fox'] },
  { label: 'model.wildlife.cats', kinds: ['cat'] },
  { label: 'model.wildlife.penguins', kinds: ['penguin'] },
  { label: 'model.wildlife.camels', kinds: ['camel'] },
  { label: 'model.wildlife.frogs', kinds: ['frog'] },
  { label: 'model.wildlife.whales', kinds: ['whale'] },
  { label: 'model.wildlife.ducks', kinds: ['duck'] },
  { label: 'model.wildlife.bees', kinds: ['bee'] },
  { label: 'model.wildlife.owls', kinds: ['owl'] },
  { label: 'model.wildlife.eagles', kinds: ['eagle'] },
  { label: 'model.wildlife.snakes', kinds: ['snake'] },
  { label: 'model.wildlife.crocodiles', kinds: ['crocodile'], danger: true },
  { label: 'model.wildlife.monkeys', kinds: ['monkey'] },
  { label: 'model.wildlife.wolves', kinds: ['wolf'], danger: true },
  { label: 'model.wildlife.goats', kinds: ['goat'] },
  { label: 'model.wildlife.elephants', kinds: ['elephant'] },
  { label: 'model.wildlife.lions', kinds: ['lion'] },
  { label: 'model.wildlife.zebras', kinds: ['zebra'] },
  { label: 'model.wildlife.polarBears', kinds: ['polar_bear'] },
  { label: 'model.wildlife.kangaroos', kinds: ['kangaroo'] },
  { label: 'model.wildlife.bears', kinds: ['bear'], danger: true },
]

/** Whether a count's label names farm animals kept in herds rather than wild game. */
export function isHerdLabel(label: string): boolean {
  return GROUPS.some((g) => g.herd && t(g.label) === label)
}

/** The living wild and herd animals by kind, empty kinds left out. */
export function wildlifeCounts(
  animals: readonly Pick<AnimalState, 'kind' | 'away'>[] | undefined,
): WildlifeCount[] {
  const out: WildlifeCount[] = []
  for (const g of GROUPS) {
    const mine = (animals ?? []).filter((a) => g.kinds.includes(a.kind))
    if (mine.length === 0) continue
    const away = mine.filter((a) => a.away).length
    out.push({
      label: t(g.label),
      count: mine.length - away,
      ...(away > 0 ? { away } : {}),
      ...(g.danger ? { danger: true } : {}),
    })
  }
  return out
}
