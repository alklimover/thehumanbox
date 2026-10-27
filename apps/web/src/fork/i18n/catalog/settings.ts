import { defineMessages } from '../define'

/** The settings window: every tab, the browser world's saves and the desktop app's options. */
export const settings = defineMessages(
  {
    'settings.title': 'Settings',
    'settings.language.title': 'Language',
    'settings.language.desc':
      'The language of the interface. Switching reloads the game (your world is saved first).',
    'settings.language.failed':
      'could not checkpoint the current world; the language change was cancelled safely',

    // World tab, browser game
    // World tab, desktop app
    // Display tab
    // Accessibility tab
    // Performance tab
    // Help tab
    // Simulation tab (desktop)
    'settings.sim.capacity': {
      one: 'World capacity: {n} person',
      other: 'World capacity: {n} people',
    },
    'settings.beta': 'beta',
  },
  {
    'settings.title': 'Настройки',
    'settings.language.title': 'Язык',
    'settings.language.desc': 'Язык интерфейса. При смене игра перезагрузится (мир сначала сохранится).',
    'settings.language.failed': 'не удалось сохранить текущий мир; смена языка безопасно отменена',

    'settings.sim.capacity': {
      one: 'Вместимость мира: {n} человек',
      few: 'Вместимость мира: {n} человека',
      many: 'Вместимость мира: {n} человек',
      other: 'Вместимость мира: {n} человека',
    },
    'settings.beta': 'бета',
  },
)
