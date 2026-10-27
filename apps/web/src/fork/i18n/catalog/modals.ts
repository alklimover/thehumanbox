import { defineMessages } from '../define'

/**
 * The smaller windows: chronicles, the languages table, the list of all tribes, achievements,
 * goals and difficulty, ready-made scenes, and words several windows share.
 */
export const modals = defineMessages(
  {
    // Goal titles come from the simulation (sim/goals.rs) in English; the
    // Russian ones are picked by goal id (i18n/goals.ts).
    'goals.goal.keepTribes': 'Keep {tribes} alive for {years}',
    'goals.goal.tribes': { one: '{n} tribe', other: '{n} tribes' },
    'goals.goal.years': { one: '{n} year', other: '{n} years' },
    'goals.goal.ironAge': 'Reach the Iron Age',
  },
  {
    'goals.goal.keepTribes': 'Сохранить {tribes} в живых в течение {years}',
    'goals.goal.tribes': { one: '{n} племя', few: '{n} племени', many: '{n} племён', other: '{n} племени' },
    'goals.goal.years': { one: '{n} года', few: '{n} лет', many: '{n} лет', other: '{n} года' },
    'goals.goal.ironAge': 'Довести племя до железного века',
  },
)
