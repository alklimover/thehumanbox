import { defineMessages } from '../define'

/** The header bar over the map, its ⋯ menu, the phone menu and the command palette (⌘K). */
export const header = defineMessages(
  {
    'header.live': 'LIVE',
    'header.connecting': 'connecting...',
    'header.tick': 'tick {tick}',
    'header.tickTip': 'Simulation tick {tick} - 600 ticks = 1 in-world day · {elapsed}',
    'header.stats': 'stats',
    'header.civ': 'civilization',
    'header.chronicles': 'chronicles',
    'header.more': 'more',
    'header.settings': 'settings',
    'header.worldPanel': 'world panel',
    'header.peoplePanel': 'people panel',
    'header.fullscreen': 'fullscreen',
  },
  {
    'header.live': 'В СЕТИ',
    'header.connecting': 'подключение…',
    'header.tick': 'такт {tick}',
    'header.tickTip': 'Такт симуляции {tick} — 600 тактов = 1 день в мире · {elapsed}',
    'header.stats': 'статистика',
    'header.civ': 'цивилизация',
    'header.chronicles': 'летописи',
    'header.more': 'ещё',
    'header.settings': 'настройки',
    'header.worldPanel': 'панель мира',
    'header.peoplePanel': 'панель людей',
    'header.fullscreen': 'полноэкранный режим',
  },
)
