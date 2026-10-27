import { defineMessages } from '../define'

/**
 * Words drawn on the map and in the building interiors: the plate over a tribe entering a new era,
 * battle plaques, strategy beacons, the territory hover card and the rooms opened from the map
 * (home, forge, bakery, mill, tavern, temple, village square). Names of eras, buildings and other
 * simulation ids come from `simLabel`, not from here.
 */
export const map = defineMessages(
  {
    'map.battle.siege': 'siege',
    'map.battle.war': 'war',
    'map.battle.raid': 'raid',
    'map.battle.skirmish': 'skirmish',
    'map.battle.battle': 'battle',
    'map.battle.fallen': { one: '{name} · {n} fallen', other: '{name} · {n} fallen' },

    'map.strategy.days': '{n}d',
    'map.shop.forge.title': '{tribe} forge',
    'map.shop.bakery.title': '{tribe} bakery',
    'map.shop.mill.title': '{tribe} mill',
    'map.shop.forge.subtitle': 'Iron, anvil, and smoke · {tribe}',
    'map.shop.bakery.subtitle': 'Bread, ovens, and yeast · {tribe}',
    'map.shop.mill.subtitle': 'Grain, stones, and flour · {tribe}',
    'map.shop.unowned': 'unowned',
    'map.village.title': '{tribe} village',
    'map.village.subtitle': 'Town square · {huts} · {n} residents',
    'map.village.huts': { one: '{n} hut', other: '{n} huts' },
    'map.retry': 'Retry renderer',
  },
  {
    'map.battle.siege': 'осада',
    'map.battle.war': 'война',
    'map.battle.raid': 'набег',
    'map.battle.skirmish': 'стычка',
    'map.battle.battle': 'битва',
    'map.battle.fallen': {
      one: '{name} · {n} павший',
      few: '{name} · {n} павших',
      many: '{name} · {n} павших',
      other: '{name} · {n} павших',
    },

    'map.strategy.days': '{n} дн.',
    'map.shop.forge.title': 'Кузница племени {tribe}',
    'map.shop.bakery.title': 'Пекарня племени {tribe}',
    'map.shop.mill.title': 'Мельница племени {tribe}',
    'map.shop.forge.subtitle': 'Железо, наковальня и дым · {tribe}',
    'map.shop.bakery.subtitle': 'Хлеб, печи и закваска · {tribe}',
    'map.shop.mill.subtitle': 'Зерно, жернова и мука · {tribe}',
    'map.shop.unowned': 'без владельца',
    'map.village.title': 'Деревня племени {tribe}',
    'map.village.subtitle': 'Площадь · {huts} · жителей: {n}',
    'map.village.huts': { one: '{n} хижина', few: '{n} хижины', many: '{n} хижин', other: '{n} хижины' },
    'map.retry': 'Перезапустить отрисовку',
  },
)
